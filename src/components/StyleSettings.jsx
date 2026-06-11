import { useState, useRef, useCallback } from 'react'
import { uploadFonts, deleteFont } from '../utils/fontManager'

const PRESET_FONTS = [
  { label: '苹方 (PingFang SC)', value: 'PingFang SC' },
  { label: '微软雅黑 (Microsoft YaHei)', value: 'Microsoft YaHei' },
  { label: '黑体 (SimHei)', value: 'SimHei' },
  { label: '宋体 (SimSun)', value: 'SimSun' },
  { label: '楷体 (KaiTi)', value: 'KaiTi' },
  { label: 'Noto Sans SC', value: 'Noto Sans SC' },
]

const LEVELS = [
  { key: 'title', label: '餐单标题' },
  { key: 'mainCategory', label: '一级分类' },
  { key: 'mainEn', label: '一级分类英文' },
  { key: 'subCategory', label: '二级分类' },
  { key: 'dishName', label: '菜品名' },
  { key: 'dishDesc', label: '描述' },
]

const SIZE_RANGES = {
  title: { min: 14, max: 36, step: 1 },
  mainCategory: { min: 12, max: 30, step: 1 },
  mainEn: { min: 10, max: 24, step: 1 },
  subCategory: { min: 11, max: 26, step: 1 },
  dishName: { min: 10, max: 22, step: 1 },
  dishDesc: { min: 8, max: 18, step: 1 },
}

export default function StyleSettings({ styles, onChange, customFonts, onFontsChange }) {
  const fontInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  // Combine presets + custom fonts for the datalist
  const fontOptions = [
    ...PRESET_FONTS,
    ...customFonts.map((name) => ({ label: name, value: name })),
  ]

  const handleFontUpload = useCallback(async (e) => {
    const files = e.target.files
    if (!files || !files.length) return
    setUploading(true)
    try {
      const names = await uploadFonts(files)
      if (names.length === 0) {
        alert('⚠️ 未能加载任何字体，请确认文件格式正确')
      } else if (names.length < files.length) {
        alert(`⚠️ 成功加载 ${names.length}/${files.length} 个字体。部分字体可能格式不受支持。`)
      }
      // Merge with existing, deduplicate
      const merged = [...new Set([...customFonts, ...names])]
      onFontsChange(merged)
      e.target.value = ''
    } catch (err) {
      alert('字体加载失败：' + err.message)
    } finally {
      setUploading(false)
    }
  }, [customFonts, onFontsChange])

  // Delete a font
  const handleDeleteFont = useCallback(async (e, fontName) => {
    e.stopPropagation()
    await deleteFont(fontName)
    onFontsChange(customFonts.filter(n => n !== fontName))
  }, [customFonts, onFontsChange])

  // Click a loaded font tag → apply to all levels
  const applyFontToAll = useCallback((fontName) => {
    const updated = { ...styles }
    for (const level of LEVELS) {
      updated[level.key] = {
        ...(updated[level.key] || {}),
        font: fontName,
      }
    }
    onChange(updated)
  }, [styles, onChange])

  const handleChange = (level, field, value) => {
    onChange({
      ...styles,
      [level]: {
        ...(styles[level] || {}),
        [field]: value,
      },
    })
  }

  return (
    <div className="style-settings">
      {/* Custom font upload */}
      <div className="font-upload-section">
        <div className="font-upload-header">
          <span className="font-upload-label">📂 上传自定义字体</span>
          <span className="badge" style={{
            fontSize: 11,
            color: customFonts.length ? '#27AE60' : '#AAA',
          }}>
            {customFonts.length} 个已加载
          </span>
        </div>
        <div className="font-upload-controls">
          <input
            ref={fontInputRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            multiple
            onChange={handleFontUpload}
            style={{ display: 'none' }}
          />
          <button
            className="btn btn-secondary"
            onClick={() => fontInputRef.current?.click()}
            disabled={uploading}
            style={{ flex: 1 }}
          >
            {uploading ? '⏳ 加载中...' : '📁 选择字体文件（可多选）'}
          </button>
        </div>
        {customFonts.length > 0 && (
          <div className="loaded-fonts">
            {customFonts.map((name) => (
              <span
                className="loaded-font-tag"
                key={name}
                style={{ fontFamily: `"${name}"`, cursor: 'pointer' }}
                onClick={() => applyFontToAll(name)}
                title="点击应用到所有层级"
              >
                {name}
                <button
                  className="font-delete-btn"
                  onClick={(e) => handleDeleteFont(e, name)}
                  title="删除此字体"
                >✕</button>
              </span>
            ))}
          </div>
        )}
        <div className="font-upload-tip">
          支持 .ttf / .otf / .woff / .woff2，可一次选多个
        </div>
      </div>

      {/* Style table */}
      <div className="style-table">
        <div className="style-row style-header" style={{ gridTemplateColumns: '100px 120px 1fr 110px' }}>
          <div className="style-cell level-label">层级</div>
          <div className="style-cell" style={{ justifyContent: 'center' }}>颜色</div>
          <div className="style-cell style-font">字体</div>
          <div className="style-cell style-size">字号</div>
        </div>

        {LEVELS.map(({ key, label }) => {
          const levelStyle = styles[key] || { font: 'PingFang SC', size: 14, color: '#2D2D2D' }
          const range = SIZE_RANGES[key]

          return (
            <div className="style-row" key={key} style={{ gridTemplateColumns: '100px 120px 1fr 110px' }}>
              <div className="style-cell level-label">
                <span className="level-name">{label}</span>
              </div>

              {/* Color: swatch + hex input */}
              <div className="style-cell" style={{ justifyContent: 'center', padding: '8px 4px' }}>
                <div className="color-input-group">
                  <label className="color-swatch-btn" style={{ backgroundColor: levelStyle.color || '#2D2D2D' }}>
                    <input
                      type="color"
                      className="color-picker-input"
                      value={levelStyle.color || '#2D2D2D'}
                      onChange={(e) => handleChange(key, 'color', e.target.value)}
                    />
                  </label>
                  <input
                    type="text"
                    className="hex-input"
                    value={(levelStyle.color || '#2D2D2D').toUpperCase()}
                    onChange={(e) => {
                      let val = e.target.value
                      // Auto-prefix # if missing
                      if (val && !val.startsWith('#')) val = '#' + val
                      // Only accept valid hex chars after #
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(val) || val === '#') {
                        handleChange(key, 'color', val)
                      }
                    }}
                    maxLength={7}
                    placeholder="#HEX"
                  />
                </div>
              </div>
              <div className="style-cell style-font">
                <div className="font-combobox">
                  <input
                    type="text"
                    list={`font-list-${key}`}
                    className="font-combobox-input"
                    value={levelStyle.font || ''}
                    onChange={(e) => handleChange(key, 'font', e.target.value)}
                    placeholder="选择或输入字体名…"
                    style={{ fontFamily: levelStyle.font || undefined }}
                  />
                  <datalist id={`font-list-${key}`}>
                    {fontOptions.map((f) => (
                      <option key={f.value} value={f.value} label={f.label !== f.value ? f.label : undefined} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Size control */}
              <div className="style-cell style-size">
                <div className="size-control">
                  <button
                    className="size-btn"
                    onClick={() => {
                      const cur = levelStyle.size ?? range.min
                      handleChange(key, 'size', Math.max(range.min, cur - range.step))
                    }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={levelStyle.size ?? range.min}
                    min={range.min}
                    max={range.max}
                    step={range.step}
                    onChange={(e) => {
                      let val = parseInt(e.target.value, 10)
                      if (isNaN(val)) val = range.min
                      handleChange(key, 'size', Math.max(range.min, Math.min(range.max, val)))
                    }}
                  />
                  <button
                    className="size-btn"
                    onClick={() => {
                      const cur = levelStyle.size ?? range.min
                      handleChange(key, 'size', Math.min(range.max, cur + range.step))
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
