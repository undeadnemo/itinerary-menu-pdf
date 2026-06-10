import { useState, useCallback } from 'react'
import sampleData from '../data/sampleData'

export default function JsonEditor({ value, onChange, onParse }) {
  const [error, setError] = useState(null)
  const [touched, setTouched] = useState(false)

  const handleChange = useCallback((e) => {
    const raw = e.target.value
    onChange(raw)
    setTouched(true)

    if (!raw.trim()) {
      setError(null)
      onParse(null)
      return
    }

    try {
      const parsed = JSON.parse(raw)
      if (!parsed.title || !Array.isArray(parsed.menuDetail)) {
        setError('JSON 需要包含 "title" 和 "menuDetail" 字段')
        onParse(null)
      } else {
        setError(null)
        onParse(parsed)
      }
    } catch (e) {
      setError(`JSON 格式错误: ${e.message}`)
      onParse(null)
    }
  }, [onChange, onParse])

  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(value || '{}')
      onChange(JSON.stringify(parsed, null, 2))
      setError(null)
      setTouched(true)
      onParse(parsed)
    } catch (e) {
      setError(`格式化失败: ${e.message}`)
    }
  }, [value, onChange, onParse])

  const handleLoadSample = useCallback(() => {
    const str = JSON.stringify(sampleData, null, 2)
    onChange(str)
    setTouched(true)
    try {
      const parsed = JSON.parse(str)
      setError(null)
      onParse(parsed)
    } catch (e) {
      setError(`示例数据错误: ${e.message}`)
      onParse(null)
    }
  }, [onChange, onParse])

  const handleClear = useCallback(() => {
    onChange('')
    setError(null)
    setTouched(false)
    onParse(null)
  }, [onChange, onParse])

  const lineCount = value ? value.split('\n').length : 0

  return (
    <div className="json-editor">
      <textarea
        value={value}
        onChange={handleChange}
        className={error ? 'has-error' : ''}
        placeholder={'{\n  "title": "菜单标题",\n  "menuDetail": [\n    {\n      "category": { "main": "主分类", "sub": "子分类" },\n      "dishes": [\n        { "name": "菜品名", "desc": "Description" }\n      ]\n    }\n  ]\n}'}
        spellCheck={false}
      />

      <div className="editor-actions">
        <button className="btn btn-secondary" onClick={handleFormat}>
          ✨ 格式化
        </button>
        <button className="btn btn-secondary" onClick={handleLoadSample}>
          📋 加载示例
        </button>
        <button className="btn btn-secondary" onClick={handleClear}>
          🗑️ 清空
        </button>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#AAA' }}>
          {lineCount} 行
        </span>
      </div>

      {error && <div className="json-error">{error}</div>}
      {!error && touched && value && (
        <div className="json-valid">✓ JSON 格式正确</div>
      )}
    </div>
  )
}
