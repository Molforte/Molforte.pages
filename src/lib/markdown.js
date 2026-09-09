import { marked } from 'marked'

marked.use({
  gfm: true, // 表格、任务列表等 GitHub 风格语法
  breaks: false,
})

/** Markdown -> HTML 字符串 */
export function renderMarkdown(md) {
  return marked.parse(md)
}
