import { useState, useEffect, useCallback, useRef } from 'react'
import ImageUploader from './components/ImageUploader'
import JsonEditor from './components/JsonEditor'
import MenuPreview from './components/MenuPreview'
import StyleSettings from './components/StyleSettings'
import { generateMenuPdf } from './utils/pdfGenerator'
import { saveToLocal, loadFromLocal, KEYS } from './utils/storage'
import { loadSavedFonts, loadPresetFont, getSavedFontNames, deleteFont } from './utils/fontManager'
import presetFonts from './utils/presetFonts'
import sampleData from './data/sampleData'

const STORAGE_KEYS = {
  ...KEYS,
  STYLES: 'menu_tool_styles',
  DECO_IMAGE: 'menu_tool_deco_img',
  BG_COLOR: 'menu_tool_bg_color',
  MENU_TITLE: 'menu_tool_menu_title',
  TITLE_HEIGHT: 'menu_tool_title_height',
  HEADER_OVERLAP: 'menu_tool_header_overlap',
  FOOTER_OVERLAP: 'menu_tool_footer_overlap',
}

const DEFAULT_STYLES = {
  title: { font: '字魂书雅宋-Regular', size: 14, color: '#BFA281' },
  mainCategory: { font: '字魂书雅宋-Bold', size: 24, color: '#2D2D2D' },
  mainEn: { font: '字魂书雅宋-Regular', size: 16, color: '#888888' },
  subCategory: { font: '字魂书雅宋-Bold', size: 16, color: '#ad7e52' },
  dishName: { font: '字魂书雅宋-Medium', size: 14, color: '#2D2D2D' },
  dishDesc: { font: '字魂书雅宋-Regular', size: 12, color: '#888888' },
}

export default function App() {
  // Image state
  const [headerImage, setHeaderImage] = useState(null)
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [footerImage, setFooterImage] = useState(null)
  const [decoImage, setDecoImage] = useState(null)

  // Title state (overrides JSON title)
  const [menuTitle, setMenuTitle] = useState('餐单标题')
  const [titleHeight, setTitleHeight] = useState(136)

  // Overlap spacing
  const [headerOverlap, setHeaderOverlap] = useState(-60)
  const [footerOverlap, setFooterOverlap] = useState(-100)

  // JSON state
  const [jsonRaw, setJsonRaw] = useState('')
  const [menuData, setMenuData] = useState(null)

  // Style state
  const [styles, setStyles] = useState(DEFAULT_STYLES)

  // Custom fonts loaded from file upload
  const [customFonts, setCustomFonts] = useState([])

  // UI state
  const [toast, setToast] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const toastTimer = useRef(null)
  const previewRef = useRef(null)

  // Restore from localStorage on mount
  useEffect(() => {
    const savedHeader = loadFromLocal(STORAGE_KEYS.HEADER_IMAGE)
    const savedBgColor = loadFromLocal(STORAGE_KEYS.BG_COLOR)
    const savedFooter = loadFromLocal(STORAGE_KEYS.FOOTER_IMAGE)
    const savedDeco = loadFromLocal(STORAGE_KEYS.DECO_IMAGE)
    const savedMenuTitle = loadFromLocal(STORAGE_KEYS.MENU_TITLE)
    const savedTitleHeight = loadFromLocal(STORAGE_KEYS.TITLE_HEIGHT)
    const savedHeaderOverlap = loadFromLocal(STORAGE_KEYS.HEADER_OVERLAP)
    const savedFooterOverlap = loadFromLocal(STORAGE_KEYS.FOOTER_OVERLAP)
    const savedJson = loadFromLocal(STORAGE_KEYS.JSON_DATA)
    const savedStyles = loadFromLocal(STORAGE_KEYS.STYLES)

    if (savedHeader) setHeaderImage(savedHeader)
    if (savedBgColor) setBgColor(savedBgColor)
    if (savedFooter) setFooterImage(savedFooter)
    if (savedDeco) setDecoImage(savedDeco)
    if (savedMenuTitle !== null) setMenuTitle(savedMenuTitle)
    if (savedTitleHeight !== null) setTitleHeight(parseInt(savedTitleHeight, 10) || 136)
    if (savedHeaderOverlap !== null) setHeaderOverlap(parseInt(savedHeaderOverlap, 10) || -60)
    if (savedFooterOverlap !== null) setFooterOverlap(parseInt(savedFooterOverlap, 10) || -100)

    if (savedStyles) {
      try {
        const parsed = JSON.parse(savedStyles)
        setStyles({ ...DEFAULT_STYLES, ...parsed })
      } catch { /* use defaults */ }
    }

    if (savedJson) {
      setJsonRaw(savedJson)
      try {
        const parsed = JSON.parse(savedJson)
        if (parsed.title && Array.isArray(parsed.menuDetail)) {
          setMenuData(parsed)
        }
      } catch { /* ignore */ }
    } else {
      // First visit — load sample data + images as a quick start
      const raw = JSON.stringify(sampleData, null, 2)
      setJsonRaw(raw)
      setMenuData(sampleData)

      // Load default images from public/
      const loadDefaultImage = async (url) => {
        try {
          const resp = await fetch(url)
          const blob = await resp.blob()
          return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.readAsDataURL(blob)
          })
        } catch { return null }
      };
      (async () => {
        const [hdr, ftr, dec] = await Promise.all([
          loadDefaultImage('./header.png'),
          loadDefaultImage('./footer.png'),
          loadDefaultImage('./deco.png'),
        ])
        if (hdr) setHeaderImage(hdr)
        if (ftr) setFooterImage(ftr)
        if (dec) setDecoImage(dec)
      })()
    }

    // Load preset fonts (public/fonts/) — available to all users
    const presetNames = []
    for (const f of presetFonts) {
      try {
        loadPresetFont(f.name, f.file)
        presetNames.push(f.name)
      } catch (e) {
        console.warn(`Failed to load preset font "${f.name}":`, e.message)
      }
    }

    // Load saved custom fonts from IndexedDB
    loadSavedFonts().then((names) => {
      const merged = [...new Set([...presetNames, ...names])]
      if (merged.length) setCustomFonts(merged)
      else if (presetNames.length) setCustomFonts(presetNames)
    }).catch(() => {
      if (presetNames.length) setCustomFonts(presetNames)
    })
  }, [])

  // Auto-save to localStorage on change
  useEffect(() => { if (headerImage) saveToLocal(STORAGE_KEYS.HEADER_IMAGE, headerImage) }, [headerImage])
  useEffect(() => { saveToLocal(STORAGE_KEYS.BG_COLOR, bgColor) }, [bgColor])
  useEffect(() => { if (footerImage) saveToLocal(STORAGE_KEYS.FOOTER_IMAGE, footerImage) }, [footerImage])
  useEffect(() => { if (decoImage) saveToLocal(STORAGE_KEYS.DECO_IMAGE, decoImage) }, [decoImage])
  useEffect(() => { if (jsonRaw) saveToLocal(STORAGE_KEYS.JSON_DATA, jsonRaw) }, [jsonRaw])
  useEffect(() => { saveToLocal(STORAGE_KEYS.MENU_TITLE, menuTitle) }, [menuTitle])
  useEffect(() => { saveToLocal(STORAGE_KEYS.TITLE_HEIGHT, String(titleHeight)) }, [titleHeight])
  useEffect(() => { saveToLocal(STORAGE_KEYS.HEADER_OVERLAP, String(headerOverlap)) }, [headerOverlap])
  useEffect(() => { saveToLocal(STORAGE_KEYS.FOOTER_OVERLAP, String(footerOverlap)) }, [footerOverlap])
  useEffect(() => { saveToLocal(STORAGE_KEYS.STYLES, JSON.stringify(styles)) }, [styles])

  const showToast = useCallback((msg) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => {
      setToast(null)
      toastTimer.current = null
    }, 2500)
  }, [])

  const handleDownloadPdf = useCallback(async () => {
    if (!menuData) {
      showToast('⚠️ 请先输入菜单数据')
      return
    }
    if (!previewRef.current) {
      showToast('⚠️ 预览区域不可用')
      return
    }

    setIsGenerating(true)
    try {
      const card = previewRef.current.querySelector('.menu-card')
      if (!card) throw new Error('Menu card not found')
      const jsonTitle = menuData?.title
      const pdfTitle = `定制餐单-${menuTitle || jsonTitle || '菜单'}`
      await generateMenuPdf(card, pdfTitle)
      showToast('✅ PDF 已生成并下载')
    } catch (err) {
      console.error('PDF generation failed:', err)
      showToast('⚠️ PDF 生成失败：' + err.message)
    } finally {
      setIsGenerating(false)
    }
  }, [menuData, showToast])

  const handleSaveBackup = useCallback(() => {
    const data = JSON.stringify({
      headerImage,
      bgColor,
      footerImage,
      decoImage,
      menuTitle,
      titleHeight,
      headerOverlap,
      footerOverlap,
      jsonRaw,
      styles,
      customFonts,
      savedAt: new Date().toISOString(),
    })
    try {
      localStorage.setItem('menu_tool_backup', data)
      showToast('✅ 备份已保存')
    } catch {
      showToast('⚠️ 保存失败，图片可能过大')
    }
  }, [headerImage, bgColor, footerImage, decoImage, menuTitle, titleHeight, headerOverlap, footerOverlap, jsonRaw, styles, customFonts, showToast])

  const handleRestoreBackup = useCallback(() => {
    try {
      const raw = localStorage.getItem('menu_tool_backup')
      if (!raw) { showToast('⚠️ 没有找到备份'); return }
      const data = JSON.parse(raw)
      if (data.headerImage) setHeaderImage(data.headerImage)
      if (data.bgColor) setBgColor(data.bgColor)
      if (data.footerImage) setFooterImage(data.footerImage)
      if (data.decoImage) setDecoImage(data.decoImage)
      if (data.menuTitle !== undefined) setMenuTitle(data.menuTitle)
      if (data.titleHeight) setTitleHeight(data.titleHeight)
      if (data.headerOverlap !== undefined) setHeaderOverlap(data.headerOverlap)
      if (data.footerOverlap !== undefined) setFooterOverlap(data.footerOverlap)
      if (data.styles) setStyles({ ...DEFAULT_STYLES, ...data.styles })
      if (data.customFonts && Array.isArray(data.customFonts)) setCustomFonts(data.customFonts)
      if (data.jsonRaw) {
        setJsonRaw(data.jsonRaw)
        try {
          const parsed = JSON.parse(data.jsonRaw)
          if (parsed.title && Array.isArray(parsed.menuDetail)) setMenuData(parsed)
        } catch { /* ignore */ }
      }
      showToast('✅ 已从备份恢复')
    } catch {
      showToast('⚠️ 备份数据损坏')
    }
  }, [showToast])

  const handleClearAll = useCallback(() => {
    setHeaderImage(null); setBgColor('#FFFFFF'); setFooterImage(null); setDecoImage(null)
    setMenuTitle(''); setTitleHeight(136); setHeaderOverlap(-60); setFooterOverlap(-100); setJsonRaw(''); setMenuData(null)
    setStyles(DEFAULT_STYLES)
    ;[STORAGE_KEYS.HEADER_IMAGE, STORAGE_KEYS.BG_COLOR, STORAGE_KEYS.FOOTER_IMAGE,
      STORAGE_KEYS.DECO_IMAGE, STORAGE_KEYS.MENU_TITLE, STORAGE_KEYS.TITLE_HEIGHT,
      STORAGE_KEYS.HEADER_OVERLAP, STORAGE_KEYS.FOOTER_OVERLAP,
      STORAGE_KEYS.JSON_DATA, STORAGE_KEYS.STYLES].forEach(
      (k) => localStorage.removeItem(k)
    )
    showToast('🗑️ 已清除所有数据')
    getSavedFontNames().then(names => names.forEach(n => deleteFont(n)))
    setCustomFonts([])
  }, [showToast])

  const hasData = headerImage || footerImage || decoImage || jsonRaw

  return (
    <div className="app">
      {/* Header */}
      <div className="app-header no-pdf">
        <span style={{ fontSize: 24 }}>🍽️</span>
        <h1>航班管家公务机PDF版餐单生成器</h1>
        <span className="subtitle">设计宽度 375px</span>
      </div>

      {/* Workspace */}
      <div className="workspace no-pdf">
        {/* Left panel — Inputs */}
        <div className="workspace-inputs">
          {/* Menu Title Card */}
          <div className="card">
            <div className="card-title">
              📝 餐单标题
              <span className="badge">自定义</span>
            </div>
            <div className="title-input-section">
              <div className="title-input-row">
                <input
                  type="text"
                  className="title-text-input"
                  value={menuTitle}
                  onChange={(e) => setMenuTitle(e.target.value)}
                  placeholder="输入餐单标题…"
                />
              </div>
              <div className="title-height-row">
                <span className="title-height-label">距离顶部</span>
                <div className="size-control" style={{ display: 'inline-flex' }}>
                  <button className="size-btn" onClick={() => setTitleHeight(Math.max(40, titleHeight - 5))}>−</button>
                  <input
                    type="number"
                    className="size-control input"
                    value={titleHeight}
                    min={40}
                    max={400}
                    step={5}
                    onChange={(e) => setTitleHeight(parseInt(e.target.value, 10) || 136)}
                    style={{ width: 50 }}
                  />
                  <button className="size-btn" onClick={() => setTitleHeight(Math.min(400, titleHeight + 5))}>+</button>
                </div>
                <span className="title-height-unit">px</span>
              </div>
            </div>
          </div>

          {/* JSON Editor */}
          <div className="card">
            <div className="card-title">
              📝 JSON 数据
              <span className="badge">必填</span>
            </div>
            <JsonEditor
              value={jsonRaw}
              onChange={setJsonRaw}
              onParse={setMenuData}
            />
          </div>

          {/* Actions */}
          <div className="card">
            <div className="card-title">⚙️ 操作</div>
            <div className="export-actions">
              <button
                className="btn btn-primary"
                onClick={handleDownloadPdf}
                disabled={!menuData || isGenerating}
                style={{ fontSize: 15, padding: '12px 24px' }}
              >
                {isGenerating ? '⏳ 生成中...' : '📥 下载 PDF'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleSaveBackup}
                disabled={!hasData}
              >
                💾 保存备份
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleRestoreBackup}
              >
                📂 恢复备份
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleClearAll}
                disabled={!hasData}
              >
                🗑️ 清除数据
              </button>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: '#AAA', lineHeight: 1.6 }}>
              <p>💡 点击「下载 PDF」直接生成并保存 PDF 文件</p>
              <p>💡 数据会自动保存在浏览器中，关闭页面不会丢失</p>
              <p>💡 在「样式设置」中可自定义各层级的字体和字号</p>
            </div>
          </div>

          {/* Style Settings */}
          <div className="card">
            <div className="card-title">
              🎨 样式设置
              <span className="badge">自定义</span>
            </div>
            <StyleSettings
              styles={styles}
              onChange={setStyles}
              customFonts={customFonts}
              onFontsChange={setCustomFonts}
            />
          </div>

          {/* Image Upload */}
          <div className="card">
            <div className="card-title">
              🖼️ 图片上传
              <span className="badge">可选</span>
            </div>
            <div className="image-upload-grid">
              <ImageUploader
                label="头图"
                dimension="375 × 265"
                value={headerImage}
                onChange={setHeaderImage}
              />
              <div className="overlap-control">
                <span className="overlap-label">与菜品重叠</span>
                <div className="size-control" style={{ display: 'inline-flex', marginLeft: 'auto' }}>
                  <button className="size-btn" onClick={() => setHeaderOverlap(Math.max(-200, headerOverlap - 2))}>−</button>
                  <input type="number" className="size-control input"
                    value={headerOverlap} min={-200} max={50} step={2}
                    onChange={(e) => setHeaderOverlap(parseInt(e.target.value, 10) || 0)}
                    style={{ width: 48 }}
                  />
                  <button className="size-btn" onClick={() => setHeaderOverlap(Math.min(50, headerOverlap + 2))}>+</button>
                </div>
                <span className="overlap-unit">px</span>
              </div>

              {/* Menu title input */}
              {/* 已移到独立的「餐单标题」卡片中 */}

              <div className="bg-color-picker">
                <div className="image-upload-header">
                  <span className="image-upload-label">背景色 <span className="dimension">代替背景图</span></span>
                </div>
                <div className="bg-color-input-group">
                  <label className="color-swatch-btn" style={{ backgroundColor: bgColor }}>
                    <input
                      type="color"
                      className="color-picker-input"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                    />
                  </label>
                  <input
                    type="text"
                    className="hex-input"
                    value={bgColor.toUpperCase()}
                    onChange={(e) => {
                      let val = e.target.value
                      if (val && !val.startsWith('#')) val = '#' + val
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(val) || val === '#') {
                        setBgColor(val)
                      }
                    }}
                    maxLength={7}
                    placeholder="#HEX"
                  />
                </div>
              </div>
              <ImageUploader
                label="底图"
                dimension="375 × 292"
                value={footerImage}
                onChange={setFooterImage}
              />
              <div className="overlap-control">
                <span className="overlap-label">与菜品重叠</span>
                <div className="size-control" style={{ display: 'inline-flex', marginLeft: 'auto' }}>
                  <button className="size-btn" onClick={() => setFooterOverlap(Math.max(-300, footerOverlap - 5))}>−</button>
                  <input type="number" className="size-control input"
                    value={footerOverlap} min={-300} max={50} step={5}
                    onChange={(e) => setFooterOverlap(parseInt(e.target.value, 10) || 0)}
                    style={{ width: 48 }}
                  />
                  <button className="size-btn" onClick={() => setFooterOverlap(Math.min(50, footerOverlap + 5))}>+</button>
                </div>
                <span className="overlap-unit">px</span>
              </div>
              <ImageUploader
                label="分类装饰图"
                dimension="宽度不限"
                value={decoImage}
                onChange={setDecoImage}
              />
            </div>
          </div>
        </div>

        {/* Right panel — Preview */}
        <div className="workspace-preview">
          <div className="card menu-preview-card">
            <div className="card-title">
              👁️ 菜单预览
              <span className="badge">实时</span>
            </div>
            <div className="menu-preview-wrapper" ref={previewRef}>
              <MenuPreview
                menuData={menuData}
                headerImage={headerImage}
                bgColor={bgColor}
                footerImage={footerImage}
                decoImage={decoImage}
                menuTitle={menuTitle}
                titleHeight={titleHeight}
                headerOverlap={headerOverlap}
                footerOverlap={footerOverlap}
                styles={styles}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}
