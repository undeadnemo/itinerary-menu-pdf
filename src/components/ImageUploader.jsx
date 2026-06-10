import { useRef, useCallback } from 'react'

export default function ImageUploader({ label, dimension, value, onChange }) {
  const inputRef = useRef(null)

  const handleFile = useCallback((e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onChange(ev.target.result)
    reader.readAsDataURL(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }, [onChange])

  const handleRemove = useCallback((e) => {
    e.stopPropagation()
    onChange(null)
  }, [onChange])

  const handleClick = () => {
    inputRef.current?.click()
  }

  return (
    <div
      className={`image-upload-item ${value ? 'has-image' : ''}`}
      onClick={handleClick}
    >
      <div className="image-upload-header">
        <span className="image-upload-label">
          {label}
          {dimension && <span className="dimension"> &nbsp;{dimension}</span>}
        </span>
        {value && (
          <button
            className="btn btn-danger btn-icon"
            onClick={handleRemove}
            title="移除图片"
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFile}
      />

      {value ? (
        <div className="image-preview">
          <img src={value} alt={label} />
        </div>
      ) : (
        <div className="image-placeholder">
          <span className="icon">🖼️</span>
          <span>点击上传</span>
        </div>
      )}
    </div>
  )
}
