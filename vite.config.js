import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync } from 'node:fs'

// GitHub Pages「项目站点」的部署子路径，等于仓库名。
// 如果你的仓库名不是 Molforte.pages，改这里即可（开头结尾都要带 /）。
const REPO_BASE = '/Molforte.pages/'

export default defineConfig(({ command }) => ({
  // 开发时用根路径；构建时按 GitHub Pages 子路径产出资源
  base: command === 'build' ? REPO_BASE : '/',
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
}))
