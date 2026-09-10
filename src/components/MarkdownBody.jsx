import { useEffect, useRef } from 'react'
import { highlightCodeBlock } from '../lib/highlight.js'
import { renderMathIn } from '../lib/math.js'

/** 渲染 Markdown 出来的 HTML：代码块做语法高亮，公式按需加载 KaTeX */
export default function MarkdownBody({ html, className = 'post-body' }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    ref.current.querySelectorAll('pre code').forEach((el) => highlightCodeBlock(el))
    renderMathIn(ref.current)
  }, [html])
  return <div ref={ref} className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
