import { useEffect, useRef, useState } from 'react'

const supportsIntersectionObserver = typeof IntersectionObserver !== 'undefined'

/**
 * 滚动进入动效的容器：元素进入视口后播放入场（只播一次）。
 * 用 IntersectionObserver；不支持时直接显示，绝不把内容留在隐藏态。
 * 动效本体在 global.css 的 .reveal / .reveal.is-visible（尊重 prefers-reduced-motion）。
 */
export default function Reveal({ as: Tag = 'div', i = 0, className = '', children, ...rest }) {
  // 不支持 IO 的环境直接视为已显示，避免内容被留在隐藏态
  const [shown, setShown] = useState(() => !supportsIntersectionObserver)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !supportsIntersectionObserver) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={`reveal${shown ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}
      style={{ '--i': i }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
