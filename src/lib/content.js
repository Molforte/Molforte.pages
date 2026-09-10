// ============================================================
// 内容管线
// 文章库 articles/（将来是 submodule：Molforte/molforte.Articles）：
//   Projects/<册>/   一册一个目录（栏目）：<笔记>.md + index.md + img/
//   Articles/<文章>.md   独立文章（按日期）
//   Fragments/<残页>.md  残页
// 站点自己的静态页仍在 content/pages/。
// 清单由 vite 插件构建期生成（virtual:content），正文用惰性 glob 按需加载。
// ============================================================
import { parseFrontMatter } from './frontmatter.js'
import { stripCode, countChars } from './text.js'
import { contentIndex } from 'virtual:content'

// 文章正文：惰性加载（进单篇页面才拉那一篇）
const articleLoaders = import.meta.glob('../../articles/Articles/*.md', {
  query: '?raw',
  import: 'default',
})
const fragmentLoaders = import.meta.glob('../../articles/Fragments/*.md', {
  query: '?raw',
  import: 'default',
})

const FILE_RE = /^(\d{4}-\d{2}-\d{2})-([\w-]+)\.md$/

// 静态单页（关于 / 友链…）：content/pages/*.md，与文章同语法
const pageModules = import.meta.glob('../../content/pages/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

function firstParagraph(md) {
  const line = md
    .split(/\n\s*\n/)[0]
    .replace(/^#+\s*/, '')
    .replace(/[#>*`_[\]()!-]/g, '')
    .trim()
  return line.length > 140 ? `${line.slice(0, 137)}…` : line
}

function parseFile(path, raw) {
  const base = path.split('/').pop() // 2026-09-08-why-no-topbar.md
  const m = FILE_RE.exec(base)
  const { data, content } = parseFrontMatter(raw)

  return {
    slug: data.slug || (m ? m[2] : base.replace(/\.md$/, '')),
    title: data.title || (m ? m[2] : base.replace(/\.md$/, '')),
    date: data.date ? String(data.date).slice(0, 10) : m?.[1] || '',
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    project: data.project ? String(data.project) : '',
    summary: data.summary || firstParagraph(content),
    draft: Boolean(data.draft),
    content, // 原始 Markdown，正文页再渲染成 HTML
  }
}

/** 独立文章（articles/Articles/）：清单来自构建期，正文惰性加载 */
const withMinutes = (a) => ({ ...a, minutes: Math.max(1, Math.round((a.chars || 0) / 420)) })
export const posts = contentIndex.articles.map(withMinutes)
export const fragments = contentIndex.fragments

export function getPostBySlug(slug) {
  return posts.find((p) => p.slug === slug) || null
}

export function getFragment(slug) {
  return fragments.find((f) => f.slug === slug) || null
}

/** 取单篇文章正文（动态 import，按需下载） */
export async function loadArticle(slug) {
  const key = Object.keys(articleLoaders).find((k) => k.split('/').pop() === `${slug}.md`)
  if (!key) return null
  return parseFile(key, await articleLoaders[key]())
}

/** 取单篇残页正文（同上） */
export async function loadFragment(slug) {
  const key = Object.keys(fragmentLoaders).find((k) => k.split('/').pop() === `${slug}.md`)
  if (!key) return null
  return parseFile(key, await fragmentLoaders[key]())
}

/** 静态单页：按文件名（不含 .md）取 content/pages/ 下的页面 */
export function getPage(name) {
  for (const [path, raw] of Object.entries(pageModules)) {
    if (path.split('/').pop().replace(/\.md$/, '') === name) {
      return parseFile(path, raw)
    }
  }
  return null
}

/** 按项目分组归档（frontmatter 的 project 字段） */
export function groupByProject() {
  const groups = new Map() // project -> posts[]
  for (const post of posts) {
    const key = post.project || '未分类'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(post)
  }
  // 组内已按时间倒序；组按“最近一篇文章”的新旧排序，未分类放最后
  return [...groups.entries()]
    .map(([name, items]) => ({ name, items }))
    .sort((a, b) => {
      if (a.name === '未分类') return 1
      if (b.name === '未分类') return -1
      return b.items[0].date.localeCompare(a.items[0].date)
    })
}

/** 相邻文章：left = 更新的一篇，right = 更旧的一篇 */
export function getNeighbors(slug) {
  const i = posts.findIndex((p) => p.slug === slug)
  if (i === -1) return { left: null, right: null }
  return {
    left: posts[i - 1] || null,
    right: posts[i + 1] || null,
  }
}

/** 粗略阅读时长：中文字符按 420 字/分钟，英文按 180 词/分钟（代码块不计） */
export function readingMinutes(md) {
  const text = stripCode(md)
  const cjk = (text.match(/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/g) || []).length
  const en = (text.match(/[A-Za-z0-9]+/g) || []).length
  return Math.max(1, Math.round(cjk / 420 + en / 180))
}

/** 简洁日期：2026-09-08（等宽数字、更克制） */
export function formatDate(iso) {
  return iso || ''
}

export { countChars, stripCode }

/* ============================================================
   笔记「册」：articles/Projects/<册>/
     <笔记>.md    一篇一个文件，**正文惰性加载**（进页面才拉那一篇）
     index.md     册首页（vault 里 README / @ 索引页的内容）
     img/         该册引用的图片（构建期物化到 public/images/<册>/）
   册清单不落盘：由 vite 插件在**构建期扫 frontmatter** 生成虚拟模块
   （virtual:content）——所以往目录里丢一个 .md 就够了，不用跑任何脚本。
   ============================================================ */
const volumePages = import.meta.glob('../../articles/Projects/*/index.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})
const noteLoaders = import.meta.glob('../../articles/Projects/*/*.md', {
  query: '?raw',
  import: 'default',
}) // 注意：非 eager

const volDir = (path) => path.split('/').slice(-2)[0]

/** 栏目（= 册）列表：构建期生成，按最后更新倒序 */
export const volumes = contentIndex.volumes

export function getVolume(slug) {
  return volumes.find((v) => v.slug === slug) || null
}

/** 所有笔记的正文汉字数合计（构建期算好，正文不用加载） */
export function countNoteChars() {
  return volumes.reduce((sum, v) => sum + (v.chars || 0), 0)
}

/** 全站字数（文章 + 笔记 + 残页），口径统一：只算正文，围栏代码块不计 */
export function countAllChars() {
  return (
    posts.reduce((sum, p) => sum + (p.chars || 0), 0) +
    fragments.reduce((sum, f) => sum + (f.chars || 0), 0) +
    countNoteChars()
  )
}

/** 搜索用的扁平笔记索引（构建期清单，正文不加载） */
export const searchNotes = volumes.flatMap((v) =>
  v.notes.map((n) => ({ ...n, volume: v.slug, volumeTitle: v.title })),
)

/** 册首页正文（README/@ 索引页转换而来） */
export function getVolumeIntro(slug) {
  for (const [path, raw] of Object.entries(volumePages)) {
    if (volDir(path) === slug) return parseFile(path, raw).content
  }
  return ''
}

/** 册内相邻笔记：prev = 上一篇（更靠前），next = 下一篇 */
export function getNoteNeighbors(volumeSlug, noteSlug) {
  const vol = getVolume(volumeSlug)
  if (!vol) return { prev: null, next: null }
  const i = vol.notes.findIndex((n) => n.slug === noteSlug)
  if (i === -1) return { prev: null, next: null }
  return { prev: vol.notes[i - 1] || null, next: vol.notes[i + 1] || null }
}

/** 取单篇笔记正文（动态 import，按需下载） */
export async function loadNote(volumeSlug, noteSlug) {
  const key = Object.keys(noteLoaders).find(
    (k) => volDir(k) === volumeSlug && k.split('/').pop() === `${noteSlug}.md`,
  )
  if (!key) return null
  const raw = await noteLoaders[key]()
  return parseFile(key, raw)
}
