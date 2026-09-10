/**
 * 数学公式：渲染层按需加载 KaTeX。
 *
 * Markdown 里的 $...$ / $$...$$ 在 markdown.js 里被换成
 * <span class="math-tex" data-tex="<encodeURIComponent(TeX)>" data-display="0|1"></span>，
 * 页面里真的出现这种节点时才去 import KaTeX 与它的样式 —— 主包不含 KaTeX，
 * 纯文字页面为它付 0 字节。
 */
let katexPromise

function loadKatex() {
  if (!katexPromise) {
    katexPromise = Promise.all([import('katex'), import('katex/dist/katex.min.css')])
      .then(([mod]) => mod.default || mod)
      .catch(() => null)
  }
  return katexPromise
}

/** 把 root 下还没渲染的 .math-tex 交给 KaTeX（没有就不加载） */
export async function renderMathIn(root) {
  const nodes = [...root.querySelectorAll('.math-tex:not([data-rendered])')]
  if (!nodes.length) return
  const katex = await loadKatex()
  for (const el of nodes) {
    if (el.dataset.rendered) continue
    const tex = decodeURIComponent(el.dataset.tex || '')
    if (!katex) {
      el.textContent = tex // 加载失败也别丢内容，退化成纯文本
      el.dataset.rendered = '1'
      continue
    }
    try {
      katex.render(tex, el, {
        displayMode: el.dataset.display === '1',
        throwOnError: false,
        output: 'html',
        strict: false,
      })
    } catch {
      el.textContent = tex
    }
    el.dataset.rendered = '1'
  }
}
