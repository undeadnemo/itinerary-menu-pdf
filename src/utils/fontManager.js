const DB_NAME = 'menu_tool_fonts_db'
const STORE_NAME = 'fonts'
const STYLE_ID = 'menu-tool-fontfaces'

/**
 * 字体格式检测 —— 根据文件后缀返回格式标识和 MIME 类型
 */
const FONT_FORMATS = {
  '.woff2': { format: 'woff2', mime: 'font/woff2' },
  '.woff':  { format: 'woff',  mime: 'font/woff' },
  '.otf':   { format: 'opentype', mime: 'font/otf' },
  '.ttf':   { format: 'truetype', mime: 'font/ttf' },
}

function getFontInfo(fileName) {
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
  return FONT_FORMATS[ext] || FONT_FORMATS['.ttf']
}

function formatToMime(format) {
  for (const key of Object.keys(FONT_FORMATS)) {
    if (FONT_FORMATS[key].format === format) return FONT_FORMATS[key].mime
  }
  return 'font/ttf'
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ─── 注入 @font-face ───
// 无 font-display: swap，避免 html2canvas 截到 fallback 字体
function injectFontFace(name, dataUrl, format) {
  let styleEl = document.getElementById(STYLE_ID)
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = STYLE_ID
    document.head.appendChild(styleEl)
  }

  const existing = styleEl.textContent || ''
  const regex = new RegExp(`@font-face\\s*\\{[^}]*font-family:\\s*'${escapeRegex(name)}'[^}]*\\}\\s*`, 'g')
  styleEl.textContent = existing.replace(regex, '')

  styleEl.textContent +=
    `@font-face {\n` +
    `  font-family: '${name}';\n` +
    `  src: url('${dataUrl}') format('${format}');\n` +
    `  font-weight: normal;\n` +
    `  font-style: normal;\n` +
    `}\n`
}

// ─── IndexedDB ───
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'name' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// ─── 文件 → data: URL（直接转换，无中间步骤）───
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

// ─── 预置字体 ───
export function loadPresetFont(name, file) {
  injectFontFace(name, `./fonts/${file}`, 'truetype')
}

// ─── 上传字体 ───
export async function uploadFonts(files) {
  const list = Array.from(files)
  const loaded = []

  for (const file of list) {
    try {
      const info = getFontInfo(file.name)
      const name = file.name.replace(/\.[^.]+$/, '')
      if (loaded.includes(name)) continue

      // 读 ArrayBuffer（一次读取，复用）
      const arrayBuffer = await file.arrayBuffer()

      // 用正确 MIME 创建 Blob → data: URL
      const blob = new Blob([arrayBuffer], { type: info.mime })
      const dataUrl = await blobToDataURL(blob)

      // 注入 @font-face（无 font-display: swap）
      injectFontFace(name, dataUrl, info.format)
      loaded.push(name)

      // 持久化到 IndexedDB（复用 arrayBuffer）
      try {
        const db = await openDB()
        const tx = db.transaction(STORE_NAME, 'readwrite')
        tx.objectStore(STORE_NAME).put({ name, data: arrayBuffer, format: info.format })
        await new Promise((resolve, reject) => {
          tx.oncomplete = resolve; tx.onerror = reject
        })
      } catch (e) { console.warn('IndexedDB error:', e.message) }
    } catch (e) {
      console.warn(`Upload failed for "${file?.name}":`, e.message)
    }
  }

  await document.fonts.ready
  return loaded
}

// ─── 从 IndexedDB 恢复字体 ───
export async function loadSavedFonts() {
  const names = []
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const all = await new Promise((resolve, reject) => {
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })

    for (const font of all) {
      try {
        const blob = new Blob([font.data], { type: formatToMime(font.format) })
        const dataUrl = await blobToDataURL(blob)
        injectFontFace(font.name, dataUrl, font.format)
        names.push(font.name)
      } catch (e) { console.warn(`Reload failed for "${font.name}":`, e.message) }
    }
    await document.fonts.ready
  } catch (e) { console.warn('loadSavedFonts error:', e.message) }
  return names
}

// ─── 删除字体 ───
export async function deleteFont(name) {
  const styleEl = document.getElementById(STYLE_ID)
  if (styleEl) {
    const regex = new RegExp(`@font-face\\s*\\{[^}]*font-family:\\s*'${escapeRegex(name)}'[^}]*\\}\\s*`, 'g')
    styleEl.textContent = (styleEl.textContent || '').replace(regex, '')
  }
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(name)
    await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = reject })
  } catch (_) {}
}

export async function getSavedFontNames() {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    return await new Promise((resolve, reject) => {
      const req = store.getAllKeys()
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  } catch { return [] }
}
