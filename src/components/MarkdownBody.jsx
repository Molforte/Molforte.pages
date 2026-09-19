import { useEffect, useRef, useState } from 'react'
import { highlightCodeBlock } from '../lib/highlight.js'
import { renderMathIn } from '../lib/math.js'
import ImageZoom from './ImageZoom.jsx'

/**
 * 渲染 Markdown 出来的 HTML：代码块做语法高亮、公式按需加载 KaTeX，
 * 另外接管两件交互（都用事件委托，因为那部分 DOM 是 dangerouslySetInnerHTML 来的）：
 *   · 代码块右上角的「复制」按钮（按钮本身由 markdown.js 写进 HTML）
 *   · 点正文图片放大预览（见 ImageZoom）
 */
export default function MarkdownBody({ html, className = 'post-body' }) {
  const ref = useRef(null)
  const [zoom, setZoom] = useState(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.querySelectorAll('pre code').forEach((el) => highlightCodeBlock(el))

    // 代码块左侧的行号：按**真实行数**生成，插在卡片**外面**（页面上是
    // 「行号 | 代码卡片」两列）。行号不参与代码的横向滚动，代码滑走时它留着。
    // 在 DOM 上数行数最准（高亮之后 spans 可能跨行，切字符串会切坏 HTML）。
    ref.current.querySelectorAll('.code-block').forEach((block) => {
      const pre = block.querySelector('pre')
      if (!pre || block.querySelector('.code-nums')) return
      const lines = pre.textContent.replace(/\n$/, '').split('\n').length
      const nums = document.createElement('div')
      nums.className = 'code-nums'
      nums.setAttribute('aria-hidden', 'true') // 读屏不必念一遍行号
      nums.textContent = Array.from({ length: lines }, (_, i) => i + 1).join('\n')
      block.insertBefore(nums, pre)
    })

    renderMathIn(ref.current)
  }, [html])

  /** 复制纯文本：优先用剪贴板 API，不行就退回临时 textarea + execCommand */
  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.setAttribute('readonly', '')
      ta.style.cssText = 'position:fixed;top:-1000px;opacity:0'
      document.body.appendChild(ta)
      ta.select()
      let ok = false
      try {
        ok = document.execCommand('copy')
      } catch {
        /* 有些环境禁用了 execCommand：保持 ok = false */
      }
      ta.remove()
      return ok
    }
  }

  const onClick = async (e) => {
    const btn = e.target.closest('.code-copy')
    if (btn && ref.current?.contains(btn)) {
      const code = btn.parentElement?.querySelector('code')
      if (!code) return
      // 末尾那个换行是代码块自带的，复制时去掉，粘出来才干净
      const ok = await copyText(code.textContent.replace(/\n$/, ''))
      // **文字不动**（那颗按钮永远显示代码语言），结果只用颜色表示：
      // data-copied=1 → 强调色，0 → 变淡。读屏那边靠 aria-label 播报。
      // 文案用英文，和那颗按钮的可见文案（语言 / Copy）一致。
      btn.dataset.copied = ok ? '1' : '0'
      btn.setAttribute('aria-label', ok ? 'Copied' : 'Copy failed')
      btn.title = ok ? 'Copied' : 'Copy failed — select and copy manually'
      clearTimeout(btn._copyTimer)
      btn._copyTimer = setTimeout(() => {
        btn.dataset.copied = ''
        btn.setAttribute('aria-label', 'Copy code')
        btn.title = 'Copy code'
      }, 1400)
      return
    }

    const img = e.target.closest('img')
    if (img && ref.current?.contains(img)) {
      setZoom({ src: img.currentSrc || img.src, alt: img.alt })
    }
  }

  return (
    <>
      <div
        ref={ref}
        className={className}
        onClick={onClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {zoom && <ImageZoom src={zoom.src} alt={zoom.alt} onClose={() => setZoom(null)} />}
    </>
  )
}
