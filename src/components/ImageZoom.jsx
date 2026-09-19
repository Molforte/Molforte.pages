import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

/**
 * 点击正文里的图片 → 全屏放大预览。
 *
 * 挂到 document.body 上（createPortal）：正文可能处在带 transform / overflow 的
 * 祖先里（首屏那些入场动效就会加 transform），fixed 定位在里面会被当成相对祖先定位。
 * 打开时照搜索浮层那套做：锁页面滚动、给内容栏加 inert、焦点先移到关闭按钮、
 * 关掉再还回去。Esc / 点背景 / 点关闭按钮都能关。
 */
export default function ImageZoom({ src, alt, onClose }) {
  const closeRef = useRef(null)
  const prevFocus = useRef(null)

  useEffect(() => {
    prevFocus.current = document.activeElement
    closeRef.current?.focus()

    const prevOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    const frame = document.querySelector('.site-frame')
    frame?.setAttribute('inert', '')

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.documentElement.style.overflow = prevOverflow
      frame?.removeAttribute('inert')
      if (prevFocus.current instanceof HTMLElement) prevFocus.current.focus()
    }
  }, [onClose])

  return createPortal(
    <div
      className="image-zoom"
      role="dialog"
      aria-modal="true"
      aria-label={alt ? `图片预览：${alt}` : '图片预览'}
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        className="image-zoom__close"
        onClick={onClose}
        aria-label="关闭预览"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M6 6l12 12M18 6L6 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {/* 点图片本身不关（免得手一抖就没了），只有背景与按钮关 */}
      <img
        className="image-zoom__img"
        src={src}
        alt={alt || ''}
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    document.body,
  )
}
