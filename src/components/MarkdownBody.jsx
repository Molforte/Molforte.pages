import { useEffect, useRef } from 'react'
import { highlightCodeBlock } from '../lib/highlight.js'

/** 渲染 Markdown 出来的 HTML，并对其中的代码块做语法高亮 */
export default function MarkdownBody({ html, className = 'post-body' }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current) return
    ref.current.querySelectorAll('pre code').forEach((el) => highlightCodeBlock(el))
  }, [html])
  return <div ref={ref} className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
