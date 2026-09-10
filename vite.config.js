import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseFrontMatter } from './src/lib/frontmatter.js'
import { countChars } from './src/lib/text.js'

const NOTES_DIR = 'content/notes'

/**
 * 笔记「册」清单：构建期扫 content/notes/<册>/*.md 的 frontmatter，
 * 生成虚拟模块 virtual:notes（标题/顺序/日期/标签/摘要）。
 * 这样内容库里**只要多一个 .md 就会出现**，不需要跑同步脚本或提交清单文件。
 * 正文不进这个模块，由 content.js 用惰性 glob 按需加载。
 */
function notesIndex() {
  const virtualId = 'virtual:notes'
  const resolvedId = '\0' + virtualId
  const firstLine = (md) =>
    md
      .split(/\r?\n/)
      .map((s) => s.trim())
      .find((s) => s && !/^[|>#`]|^[-*+]\s|\d+\.\s/.test(s)) || ''
  const excerpt = (md) =>
    firstLine(md)
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[*_~`$]/g, '')
      .replace(/\s+/g, ' ')
      .slice(0, 140)

  const build = () => {
    const root = process.cwd()
    const dir = join(root, NOTES_DIR)
    if (!existsSync(dir)) return []
    const volumes = []
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const slug = entry.name
      const volDir = join(dir, slug)
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
        notes.push({
          slug: f.replace(/\.md$/, ''),
          title: data.title || f.replace(/\.md$/, ''),
          order: data.order ? String(data.order) : '',
          date: data.date ? String(data.date).slice(0, 10) : '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          summary: data.summary || excerpt(content),
          // 字数只算正文（围栏代码块不计），构建期算好，正文不进包
          chars: countChars(content),
        })
      }
      const num = (o) => {
        const m = /^(\d+)([a-z]?)$/i.exec(o)
        return m ? [+m[1], m[2]] : [1e6, o]
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
    // 最近更新的栏目排前面
    return volumes.sort((a, b) => (b.updated || '').localeCompare(a.updated || ''))
  }

  return {
    name: 'notes-index',
    resolveId: (id) => (id === virtualId ? resolvedId : null),
    load: (id) =>
      id === resolvedId ? `export const volumeIndex = ${JSON.stringify(build(), null, 2)}\n` : null,
    // 内容目录变化 → 让虚拟模块失效，dev 下立刻反映
    handleHotUpdate({ file, server }) {
      if (!file.includes(NOTES_DIR.replace('/', '\\')) && !file.includes(NOTES_DIR)) return
      const mod = server.moduleGraph.getModuleById(resolvedId)
      if (mod) server.moduleGraph.invalidateModule(mod)
    },
  }
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
      notesIndex(),
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
