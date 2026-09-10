import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync, readdirSync, readFileSync, mkdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parseFrontMatter } from './src/lib/frontmatter.js'
import { countChars } from './src/lib/text.js'

// 文章库（将来是 submodule：Molforte/molforte.Articles），三个顶层文件夹：
//   Projects/   一册一个目录（栏目）：笔记 + index.md + img/（图片随册存放）
//   Articles/   独立文章（按日期）
//   Fragments/  残页
const LIB = 'articles'
const PROJECTS_DIR = `${LIB}/Projects`
const ARTICLES_DIR = `${LIB}/Articles`
const FRAGMENTS_DIR = `${LIB}/Fragments`

/**
 * 内容清单：构建期扫文章库的 frontmatter，生成虚拟模块 virtual:content。
 * 这样内容库里**只要多一个 .md 就会出现**，不需要跑同步脚本或提交清单文件；
 * 正文不进这个模块（content.js 用惰性 glob 按需加载），字数/摘要在这里算好。
 */
function contentIndex() {
  const virtualId = 'virtual:content'
  const resolvedId = '\0' + virtualId

  const excerpt = (md) => {
    const line =
      md
        .split(/\r?\n/)
        .map((s) => s.trim())
        .find((s) => s && !/^[|>#`]|^[-*+]\s|\d+\.\s/.test(s)) || ''
    return line
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[*_~`$]/g, '')
      .replace(/\s+/g, ' ')
      .slice(0, 140)
  }
  const num = (o) => {
    const m = /^(\d+)([a-z]?)$/i.exec(o)
    return m ? [+m[1], m[2]] : [1e6, o]
  }
  /** 单篇（册内笔记 / 文章 / 残页）共用的元数据 */
  const meta = (file, raw) => {
    const { data, content } = parseFrontMatter(raw)
    const chars = countChars(content)
    return {
      slug: data.slug ? String(data.slug) : file.replace(/\.md$/, ''),
      title: data.title || file.replace(/\.md$/, ''),
      order: data.order ? String(data.order) : '',
      date: data.date ? String(data.date).slice(0, 10) : '',
      tags: Array.isArray(data.tags) ? data.tags : [],
      project: data.project ? String(data.project) : '',
      summary: data.summary || excerpt(content),
      chars,
    }
  }
  /** 平铺目录（Articles / Fragments）：按日期倒序 */
  const flat = (dir) => {
    if (!existsSync(dir)) return []
    const out = []
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.md') || /^readme\.md$/i.test(f)) continue
      const raw = readFileSync(join(dir, f), 'utf8')
      const item = meta(f, raw)
      if (!item.date) continue // 没写日期的不进列表
      out.push(item)
    }
    return out.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug))
  }

  const build = () => {
    const root = process.cwd()
    const volumes = []
    const projectsDir = join(root, PROJECTS_DIR)
    if (existsSync(projectsDir)) {
      for (const entry of readdirSync(projectsDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue
        const slug = entry.name
        const volDir = join(projectsDir, slug)
        const notes = []
        let intro = null
        let indexChars = 0
        for (const f of readdirSync(volDir)) {
          if (!f.endsWith('.md')) continue
          const raw = readFileSync(join(volDir, f), 'utf8')
          const { data, content } = parseFrontMatter(raw)
          if (f === 'index.md') {
            intro = {
              title: data.title || slug,
              series: data.series || '',
              project: data.project || '',
            }
            indexChars = countChars(content)
            continue
          }
          if (data.draft === true) continue
          notes.push(meta(f, raw))
        }
        notes.sort((a, b) => {
          const [na, sa] = num(a.order)
          const [nb, sb] = num(b.order)
          return na - nb || String(sa).localeCompare(String(sb), 'zh')
        })
        volumes.push({
          slug,
          title: intro?.title || slug,
          series: intro?.series || '',
          project: intro?.project || '',
          updated:
            notes
              .map((n) => n.date)
              .sort()
              .at(-1) || '',
          notes,
          chars: indexChars + notes.reduce((n, x) => n + x.chars, 0),
        })
      }
    }
    return {
      volumes: volumes.sort((a, b) => (b.updated || '').localeCompare(a.updated || '')),
      articles: flat(join(root, ARTICLES_DIR)),
      fragments: flat(join(root, FRAGMENTS_DIR)),
    }
  }

  return {
    name: 'content-index',
    resolveId: (id) => (id === virtualId ? resolvedId : null),
    load: (id) =>
      id === resolvedId ? `export const contentIndex = ${JSON.stringify(build())}\n` : null,
    // 文章库变化 → 让虚拟模块失效，dev 下立刻反映
    handleHotUpdate({ file, server }) {
      const norm = file.replace(/\\/g, '/')
      if (!norm.includes(`/${LIB}/`)) return
      const mod = server.moduleGraph.getModuleById(resolvedId)
      if (mod) server.moduleGraph.invalidateModule(mod)
    },
  }
}

/**
 * 图片：随册存放在 articles/Projects/<册>/img/，构建/开发前物化到 public/images/<册>/。
 * 于是站点仓库不再存图（public/images/ 已 gitignore），内容库自己带着图片走。
 */
function materializeImages() {
  const copyAll = () => {
    const srcRoot = join(process.cwd(), PROJECTS_DIR)
    if (!existsSync(srcRoot)) return
    let copied = 0
    // img/ → public/images/<册>/，files/ → public/files/<册>/
    for (const [sub, target] of [
      ['img', 'images'],
      ['files', 'files'],
    ]) {
      for (const slug of readdirSync(srcRoot)) {
        const from = join(srcRoot, slug, sub)
        if (!existsSync(from)) continue
        const dstDir = join(process.cwd(), 'public', target, slug)
        mkdirSync(dstDir, { recursive: true })
        for (const f of readdirSync(from)) {
          const src = join(from, f)
          const to = join(dstDir, f)
          if (!statSync(src).isFile()) continue
          if (!existsSync(to) || statSync(src).mtimeMs > statSync(to).mtimeMs) {
            copyFileSync(src, to)
            copied++
          }
        }
      }
    }
    if (copied)
      console.log(`[assets] 从 ${PROJECTS_DIR}/*/{img,files} 物化 ${copied} 个文件到 public/`)
  }
  return { name: 'materialize-assets', configResolved: copyAll, buildStart: copyAll }
}

// 部署子路径（base）：
//  · 在 GitHub Actions 里会**自动推断**：GITHUB_REPOSITORY 为 "owner/repo" 时，
//      项目站点 → /repo/；用户站点（repo 形如 owner.github.io）→ /
//  · 本地构建用下面的兜底值；也可以用环境变量 VITE_BASE 手动覆盖（记得首尾带 /）
const FALLBACK_BASE = '/Molforte.pages/'

function resolveBase() {
  const explicit = process.env.VITE_BASE
  if (explicit) return explicit.endsWith('/') ? explicit : `${explicit}/`

  const full = process.env.GITHUB_REPOSITORY // 例如 "Molforte/Molforte.pages"
  const owner = process.env.GITHUB_REPOSITORY_OWNER || full?.split('/')[0]
  const repo = full?.split('/')[1]
  if (repo) {
    const isUserSite = !!owner && repo.toLowerCase() === `${owner}.github.io`.toLowerCase()
    return isUserSite ? '/' : `/${repo}/`
  }
  return FALLBACK_BASE
}

export default defineConfig(({ command }) => {
  const base = command === 'build' ? resolveBase() : '/'
  if (command === 'build') console.log(`[gh-pages] base = ${base}`)

  return {
    // 开发时用根路径；构建时按 GitHub Pages 子路径产出资源
    base,
    plugins: [
      react(),
      materializeImages(),
      contentIndex(),
      {
        // GitHub Pages 本身不支持 SPA 路由回退。
        // 构建后把 index.html 复制为 404.html：刷新 /post/xxx 时
        // GitHub 会返回这个文件，React Router 随即接管并渲染正确页面。
        name: 'gh-pages-spa-fallback',
        apply: 'build',
        closeBundle() {
          const from = 'dist/index.html'
          const to = 'dist/404.html'
          if (existsSync(from)) {
            copyFileSync(from, to)
            console.log('[gh-pages] 已生成 dist/404.html（SPA 路由回退）')
          }
        },
      },
    ],
  }
})
