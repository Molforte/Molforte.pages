import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// 差值混合光标 —— 复刻 deepseek.com 首页 "Into the Unknown" 的悬停效果。
// 上游实现要点（读自 https://www.deepseek.com/en/ 的 .ds-cursor-region / .ds-cursor-canvas）：
//   · 区域只包住标题，内部元素标 [data-cursor="blend"]；
//   · 指针首次进入区域才挂一块全屏 canvas（fixed inset:0 / pointer-events:none /
//     mix-blend-mode:difference / z-index:9999）；
//   · rAF 循环画白色圆点跟随鼠标：缓动 0.7（距离<50px）或 0.4，透明度与缩放各按 0.24 缓动；
//     半径 = 32 × scale，scale 常态 0.5（16px）、进入 blend 目标时 1（32px）；
//   · 离开区域 / 滚动 / 页面隐藏时缩回淡出；触屏不启用；prefers-reduced-motion 不启用。
// 这里按同样的数值与流程用 React 重写，未引入其 WebGL 背景那部分。

const BLEND_SELECTOR = '[data-cursor="blend"]'

const isBlendTarget = (target) =>
  target instanceof Element && target.closest(BLEND_SELECTOR) !== null

export default function BlendCursor({ children }) {
  const [active, setActive] = useState(false)
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const regionRef = useRef(null)
  const canvasRef = useRef(null)
  const pendingRef = useRef(null)

  // 跟随系统的“减弱动态效果”，与上游一致：开启时不挂载 canvas
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  const show = active && !reduced

  useEffect(() => {
    if (!show) return
    const region = regionRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!region || !canvas || !ctx) return

    const pending = pendingRef.current
    pendingRef.current = null

    let targetX = pending?.clientX ?? 0
    let targetY = pending?.clientY ?? 0
    let x = targetX
    let y = targetY
    let alpha = 0
    let scale = 0.5
    let blend = 0
    let raf = 0
    let lastX = 0
    let lastY = 0
    let lastR = 0

    const clearPrev = () => {
      if (lastR)
        ctx.clearRect(lastX - lastR - 2, lastY - lastR - 2, (lastR + 2) * 2, (lastR + 2) * 2)
    }

    const frame = () => {
      const dx = targetX - x
      const dy = targetY - y
      const ease = Math.sqrt(dx * dx + dy * dy) < 50 ? 0.7 : 0.4
      x += dx * ease
      y += dy * ease
      alpha += (blend - alpha) * 0.24
      scale += ((blend ? 1 : 0.5) - scale) * 0.24
      clearPrev()

      const r = 32 * scale
      if (alpha > 0.002) {
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(x, y, r, 0, 2 * Math.PI)
        ctx.fill()
        ctx.restore()
        lastX = x
        lastY = y
        lastR = r
      } else {
        lastR = 0
      }

      const alphaDone = Math.abs(blend - alpha) <= 0.002
      const scaleDone = Math.abs((blend ? 1 : 0.5) - scale) <= 0.002
      if (Math.abs(dx) + Math.abs(dy) <= 0.1 && alphaDone && scaleDone) {
        x = targetX
        y = targetY
        alpha = blend
        scale = blend ? 1 : 0.5
        raf = 0
      } else {
        raf = requestAnimationFrame(frame)
      }
    }

    const ensure = () => {
      if (!raf && !document.hidden) raf = requestAnimationFrame(frame)
    }

    const onPointer = (e) => {
      if (!isBlendTarget(e.target)) {
        blend = 0
        if (alpha > 0.002 || lastR) ensure()
        return
      }
      targetX = e.clientX
      targetY = e.clientY
      if (alpha <= 0.002 && !lastR) {
        x = targetX
        y = targetY
      }
      blend = 1
      ensure()
    }

    const onLeave = () => {
      blend = 0
      if (alpha > 0.002 || lastR) ensure()
    }

    const onVisibility = () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf)
        raf = 0
      } else if (blend > 0 || alpha > 0.002) {
        ensure()
      }
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.round(window.innerWidth * dpr)
      const h = Math.round(window.innerHeight * dpr)
      canvas.width = w
      canvas.height = h
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      alpha = 0
      blend = 0
      lastR = 0
    }

    resize()
    region.addEventListener('pointermove', onPointer, { passive: true })
    region.addEventListener('pointerover', onPointer, { passive: true })
    region.addEventListener('pointerleave', onLeave, { passive: true })
    window.addEventListener('scroll', onLeave, { passive: true })
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)

    // 若指针在挂载前就已停在 blend 目标上，直接显影
    if (pending?.blend) {
      blend = 1
      ensure()
    }

    return () => {
      if (raf) cancelAnimationFrame(raf)
      region.removeEventListener('pointermove', onPointer)
      region.removeEventListener('pointerover', onPointer)
      region.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('scroll', onLeave)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [show])

  return (
    <div
      ref={regionRef}
      className="cursor-region"
      onPointerMove={
        show
          ? undefined
          : (e) => {
              if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
              pendingRef.current = {
                clientX: e.clientX,
                clientY: e.clientY,
                blend: isBlendTarget(e.target),
              }
              setActive(true)
            }
      }
    >
      {children}
      {show &&
        typeof document !== 'undefined' &&
        createPortal(
          <canvas ref={canvasRef} className="cursor-canvas" aria-hidden="true" />,
          document.body,
        )}
    </div>
  )
}
