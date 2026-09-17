import { useEffect, useRef } from 'react'

/**
 * 跟着鼠标的词：墨色那一层朝指针方向平移出去，原位留一层蓝色残影（画在 ::before 里）。
 * 平移后偏离到哪里，哪里就露出下面的蓝色。
 *
 * 位移 = 指向指针的单位向量 × 偏移上限 × min(1, 距离 / 参考半径)，
 * 每帧朝目标插值，所以是「被牵着走」而不是硬贴在指针上；指针离开区域就回原位。
 * 参照的是 wrap 的位置——wrap 自己不位移，只有里面那层动，所以不会自我追逐。
 *
 * 每帧只往 CSS 变量里写数值，不碰 state：用 state 的话每帧都要重渲染整棵树。
 * 触屏（没有 hover）与 prefers-reduced-motion 下直接不启用，词就静静待在原位。
 */
export default function MagneticWord({ areaRef, word }) {
  const wrapRef = useRef(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const area = areaRef?.current
    if (!wrap || !area || !word) return

    const mq = window.matchMedia
    if (mq?.('(prefers-reduced-motion: reduce)').matches) return
    if (!mq?.('(hover: hover) and (pointer: fine)').matches) return

    // 偏移上限按字号折算：86px 的标题下约 19px。想更飘就调大 MAX_EM，
    // 19px 上下是「看得出被牵动、又不至于把词拆开」的一档。
    const MAX_EM = 0.22
    const EASE = 0.16 // 每帧插值比例：越大越跟手，越小越飘

    let pointer = { x: 0, y: 0 }
    let inside = false
    let target = { x: 0, y: 0 }
    let cur = { x: 0, y: 0 }
    let raf = 0
    let maxOffset = 19 // 偏移上限（px）
    let radius = 360 // 拉满这个上限所需的距离（px）

    const measure = () => {
      const fs = parseFloat(getComputedStyle(wrap).fontSize) || 16
      maxOffset = fs * MAX_EM
      radius = Math.max(200, fs * 4.2)
    }

    const write = () => {
      // 蓝层浓度跟着位移量走：完全没偏时一点不出来（否则字形抗锯齿边缘会渗出一圈淡蓝），
      // 偏到上限的 2/3 就已经是满浓度
      const t = Math.min(1, Math.hypot(cur.x, cur.y) / maxOffset)
      wrap.style.setProperty('--t', t.toFixed(3))
      if (t < 0.004) {
        // 没偏的时候把整个位移摘掉（CSS 里 var(--shift, none) 会落回 none）：
        // 就算只留一个 translate: 0 0，也足以让浏览器换一条栅格化路径，
        // 静止时的文字边缘会跟着变。
        wrap.style.removeProperty('--shift')
        return
      }
      wrap.style.setProperty('--shift', `${cur.x.toFixed(2)}px ${cur.y.toFixed(2)}px`)
    }

    const frame = () => {
      raf = 0
      // wrap 是静止的那层：它的中心就是词「本该在」的位置
      const r = wrap.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2

      if (inside) {
        const dx = pointer.x - cx
        const dy = pointer.y - cy
        const d = Math.hypot(dx, dy)
        const mag = maxOffset * Math.min(1, d / radius)
        target = d > 1 ? { x: (dx / d) * mag, y: (dy / d) * mag } : { x: 0, y: 0 }
      } else {
        target = { x: 0, y: 0 }
      }

      cur.x += (target.x - cur.x) * EASE
      cur.y += (target.y - cur.y) * EASE
      const settled = Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) < 0.05
      if (settled) {
        cur.x = target.x
        cur.y = target.y
      }
      write()
      if (!settled) ensure()
    }

    const ensure = () => {
      if (!raf && !document.hidden) raf = requestAnimationFrame(frame)
    }

    const onMove = (e) => {
      pointer = { x: e.clientX, y: e.clientY }
      inside = true
      ensure()
    }

    const onLeave = () => {
      inside = false
      ensure()
    }

    const onResize = () => {
      measure()
      ensure()
    }

    const onVisibility = () => {
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf)
        raf = 0
      } else if (inside || cur.x !== 0 || cur.y !== 0) {
        ensure()
      }
    }

    measure()
    write()
    area.addEventListener('pointermove', onMove, { passive: true })
    area.addEventListener('pointerleave', onLeave, { passive: true })
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      area.removeEventListener('pointermove', onMove)
      area.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [areaRef, word])

  return (
    // 蓝层用 ::before + data-ghost 画：DOM 里只留一份 "Molforte"，
    // 复制标题和读屏都不会读成两遍
    <span className="magnet" data-ghost={word} ref={wrapRef}>
      <span className="magnet__word">{word}</span>
    </span>
  )
}
