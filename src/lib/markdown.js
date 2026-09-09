import { marked } from 'marked'

marked.use({
  gfm: true, // 表格、任务列表等 GitHub 风格语法
  breaks: false,
  renderer: {
    // 站外链接在新标签页打开
    link(token) {
      const title = token.title ? ` title="${token.title}"` : ''
      const extra = /^https?:\/\//i.test(token.href)
        ? ' target="_blank" rel="noopener noreferrer"'
        : ''
      return `<a href="${token.href}"${title}${extra}>${token.text}</a>`
    },
  },
})

/** Markdown -> HTML 字符串 */
export function renderMarkdown(md) {
  return marked.parse(md)
}
