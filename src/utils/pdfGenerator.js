import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const PAGE_WIDTH_MM = 100

/**
 * 将 data: URL 转为 Blob URL — 在 html2canvas 克隆文档中也能正常使用
 */
function dataURLToBlobURL(dataUrl) {
  const [header, base64] = dataUrl.split(',')
  const mime = header.split(':')[1].split(';')[0]
  const binary = atob(base64)
  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i)
  }
  return URL.createObjectURL(new Blob([array], { type: mime }))
}

/**
 * 临时将 @font-face 中的 data: URL 替换为 Blob URL，并返回恢复函数
 */
function swapDataURLsToBlobURLs() {
  const styleEl = document.getElementById('menu-tool-fontfaces')
  if (!styleEl) return () => {}

  const original = styleEl.textContent || ''
  const urlRegex = /url\('(data:[^']+)'\)/g
  const replacements = []
  let match

  while ((match = urlRegex.exec(original)) !== null) {
    const dataUrl = match[1]
    const blobUrl = dataURLToBlobURL(dataUrl)
    replacements.push({ from: dataUrl, to: blobUrl })
  }

  if (replacements.length === 0) return () => {}

  // 替换为 Blob URL
  let updated = original
  for (const { from, to } of replacements) {
    updated = updated.replace(`url('${from}')`, `url('${to}')`)
  }
  styleEl.textContent = updated

  // 返回恢复函数
  return () => {
    styleEl.textContent = original
    // 清理 Blob URL
    for (const { to } of replacements) {
      URL.revokeObjectURL(to)
    }
  }
}

/**
 * Generate a PDF from the menu preview DOM element.
 * @param {HTMLElement} element - The .menu-card element
 * @param {string} title - PDF filename title
 */
export async function generateMenuPdf(element, title = 'menu') {
  if (!element) throw new Error('No element to render')

  // 临时将自定义字体的 data: URL 换成 Blob URL（克隆文档中可用）
  const restoreFonts = swapDataURLsToBlobURLs()

  // 等待主文档字体就绪
  await document.fonts.ready

  try {
    const canvas = await html2canvas(element, {
      scale: 4,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
      onclone: async (doc) => {
        const card = doc.querySelector('.menu-card')
        if (card) {
          card.style.height = 'auto'
          card.style.overflow = 'visible'
        }

        // 复制 @font-face（此时已是 Blob URL）
        const fontStyle = document.getElementById('menu-tool-fontfaces')
        if (fontStyle) {
          const clone = doc.createElement('style')
          clone.id = 'menu-tool-fontfaces'
          clone.textContent = fontStyle.textContent
          doc.head.appendChild(clone)
        }

        // 等待克隆文档字体加载
        if (doc.fonts && typeof doc.fonts.ready !== 'undefined') {
          await doc.fonts.ready
        }
        await new Promise(r => setTimeout(r, 500))
      },
    })

    restoreFonts()

    const imgData = canvas.toDataURL('image/jpeg', 0.98)
    const imgHeightMm = (canvas.height * PAGE_WIDTH_MM) / canvas.width

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [PAGE_WIDTH_MM, imgHeightMm],
    })
    pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_WIDTH_MM, imgHeightMm)
    pdf.save(sanitizeFilename(title))
  } catch (e) {
    restoreFonts()
    throw e
  }
}

function sanitizeFilename(name) {
  return name
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 100) + '.pdf'
}
