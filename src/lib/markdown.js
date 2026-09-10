import { marked } from 'marked'

// 转义 HTML 特殊字符，避免 Markdown 里的链接 title/href 注入标签
function esc(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

marked.use({
  gfm: true, // 表格、任务列表等 GitHub 风格语法
  breaks: false,
  renderer: {
    // 站外链接在新标签页打开；属性做转义
    link(token) {
      const href = esc(token.href)
      const title = token.title ? ` title="${esc(token.title)}"` : ''
      const extra = /^https?:\/\//i.test(token.href)
        ? ' target="_blank" rel="noopener noreferrer"'
        : ''
      return `<a href="${href}"${title}${extra}>${token.text}</a>`
    },
  },
})

/** Markdown -> HTML 字符串
 *  options.volume：该文所在「册」的 slug，用于解析同步器写的占位符：
 *    {{IMG:文件}}          → <base>images/<册>/<文件>
 *    {{FILE:文件}}         → <base>files/<册>/<文件>
 *    {{NOTE:册/笔记}}      → <base>notes/<册>/<笔记>
 *  这样内容里不写死部署 base（开发是 /，Pages 是 /Molforte.pages/）。
 */
export function renderMarkdown(md, options = {}) {
  const base = import.meta.env.BASE_URL
  const vol = options.volume || ''
  const resolved = md
    .replace(/\{\{IMG:([^}]+)\}\}/g, (m, f) => `${base}images/${vol}/${encodeURIComponent(f)}`)
    .replace(/\{\{FILE:([^}]+)\}\}/g, (m, f) => `${base}files/${vol}/${encodeURIComponent(f)}`)
    .replace(/\{\{NOTE:([^/}]+)\/([^}]*)\}\}/g, (m, v, s) => {
      const tail = s ? `/${encodeURIComponent(s)}` : '/'
      return `${base}notes/${v}${tail}`
    })
  return marked.parse(resolved)
}
