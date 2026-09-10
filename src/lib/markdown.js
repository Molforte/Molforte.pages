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
 *
 *  数学公式 $...$ / $$...$$ 在这里换成占位 span（TeX 放在 data-tex 里，
 *  encodeURIComponent 过），真正的渲染由 MarkdownBody → lib/math.js 按需加载 KaTeX。
 *  用占位而不是直接塞给 marked，是因为正文里的 _ ^ \ 会被当成 Markdown 语法弄坏。
 */
export function renderMarkdown(md, options = {}) {
  const base = import.meta.env.BASE_URL
  const vol = options.volume || ''

  // 先把代码保护起来（围栏 + 行内），免得代码里的 $ 和 {{}} 被下面两步误伤
  const kept = []
  let s = String(md).replace(/```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`/g, (m) => {
    kept.push(m)
    return `\uE000${kept.length - 1}\uE000`
  })

  s = s
    .replace(/\{\{IMG:([^}]+)\}\}/g, (m, f) => `${base}images/${vol}/${encodeURIComponent(f)}`)
    .replace(/\{\{FILE:([^}]+)\}\}/g, (m, f) => `${base}files/${vol}/${encodeURIComponent(f)}`)
    .replace(/\{\{NOTE:([^/}]+)\/([^}]*)\}\}/g, (m, v, t) => {
      const tail = t ? `/${encodeURIComponent(t)}` : '/'
      return `${base}notes/${v}${tail}`
    })
    // 块级公式先于行内处理；行内要求 $ 紧贴内容、后面不跟数字（避开「$5 和 $10」这种）
    .replace(/\$\$([\s\S]+?)\$\$/g, (m, tex) => mathSpan(tex, true))
    .replace(/\$(?!\s)([^$\n]*?[^\s$])\$(?!\d)/g, (m, tex) => mathSpan(tex, false))

  s = s.replace(/\uE000(\d+)\uE000/g, (m, i) => kept[+i])
  return marked.parse(s)
}

const mathSpan = (tex, display) =>
  `<span class="math-tex" data-display="${display ? 1 : 0}" data-tex="${encodeURIComponent(
    tex.trim(),
  )}"></span>`
