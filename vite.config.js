import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync } from 'node:fs'

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
