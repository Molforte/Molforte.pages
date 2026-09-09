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

/** Markdown -> HTML 字符串 */
export function renderMarkdown(md) {
  return marked.parse(md)
}
