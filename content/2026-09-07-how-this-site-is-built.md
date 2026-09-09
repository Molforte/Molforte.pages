---
title: 本站是怎么搭起来的
date: 2026-09-07
tags: [技术, 前端]
summary: React + Vite，文章是仓库里的 Markdown 文件，没有用 Hexo 这类博客框架。记一下结构与部署方式，方便自己以后维护。
---

这个博客不用 Hexo、Hugo 这类博客框架，也不用任何现成的博客主题。它是 React + Vite 的手工组合：**文章是一篇篇放在仓库里的 Markdown 文件，剩下的交给几个很小的库**。好处是结构完全透明、没有框架黑盒，坏处是要自己处理一些框架早就替你处理好的事（路由、部署回退……）。下面把这几件事是怎么处理的记下来。

## 为什么不用博客框架

Hexo 这类工具很成熟，开箱即用，主题也多。但它们的代价是：内容组织、路由、主题结构都按框架的约定来，想改一处全局的东西（比如去掉顶栏），往往要在主题模板里翻很久。

React 生态的好处是组件即页面，导航、布局、样式都是普通代码。既然已经决定要一个“没有顶栏、长自己样子的博客”，从零搭反而更直接。

## 一篇文章 = 一个 Markdown 文件

所有文章放在 `content/`，一篇一个文件，文件名带日期和 slug：

```text
content/
└── 2026-09-07-how-this-site-is-built.md
```

文件头部是一段 frontmatter，用 `gray-matter` 解析：

```markdown
---
title: 本站是怎么搭起来的
date: 2026-09-07
tags: [技术, 前端]
summary: 一段摘要，不写就从正文第一段自动截取。
draft: false   # 设为 true 时这篇文章不会出现在站点上
---
```

写文章 = 往 `content/` 里丢一个文件，构建时自动出现。没有数据库，没有后台。

## Markdown 怎么变成页面

关键只有一行。Vite 的 `import.meta.glob` 能把 `content/` 下所有 `.md` 以纯文本打进构建产物：

```js
// src/lib/content.js
const modules = import.meta.glob('../../content/*.md', {
  query: '?raw', // 以原始文本读入
  import: 'default',
  eager: true,   // 构建时同步全部加载
})
```

开发模式下，往 `content/` 里新增或修改文章会即时生效；构建时，所有文章随包输出。解析与渲染是两段：frontmatter 用 `gray-matter`，正文用 `marked` 转 HTML：

```js
import { marked } from 'marked'
marked.use({ gfm: true }) // 表格、任务列表等
const html = marked.parse(markdown)
```

代码高亮用的是 `highlight.js`，但只注册了常用语言来控体积：

```js
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import yaml from 'highlight.js/lib/languages/yaml'
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('yaml', yaml)
```

## 部署到 GitHub Pages

部署分两件事：**构建产物**和**路由**。

GitHub Pages 是纯静态托管。构建由 GitHub Actions 完成——每次推送到 `main`，工作流里跑 `npm ci && npm run build`，把 `dist/` 发布到 Pages：

```yaml
# .github/workflows/pages.yml（节选）
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
    steps:
      - uses: actions/deploy-pages@v4
```

### 子路径

这个仓库是项目仓库（`Molforte.pages`），所以站点部署在子路径 `/Molforte.pages/` 下。Vite 构建时要带上这个 base：

```js
// vite.config.js
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Molforte.pages/' : '/',
  // ...
}))
```

React Router 用 `import.meta.env.BASE_URL` 做 basename，构建后它会自动变成 `/Molforte.pages/`，开发时则是 `/`，两端都不用改代码。

### SPA 路由回退

GitHub Pages 只按文件找路径：直接访问 `/post/xxx` 会 404，因为磁盘上不存在这个文件。解决方式是构建后把 `index.html` 复制一份成 `404.html`——GitHub 会把 `404.html` 的内容连同原路径返回，应用启动后 React Router 读到真实 URL，照样渲染出对应文章：

```js
// vite.config.js 里的一个小插件
closeBundle() {
  copyFileSync('dist/index.html', 'dist/404.html')
}
```

## 常用命令

```bash
npm install     # 安装依赖
npm run dev     # 本地开发，http://localhost:5173
npm run build   # 构建到 dist/
```

依赖一共没几个：`react`、`react-dom`、`react-router-dom`、`marked`、`gray-matter`、`highlight.js`，加上 `vite` 和 `@vitejs/plugin-react`。这张表就是全部家当：

| 依赖 | 用途 |
| --- | --- |
| react / react-dom | UI |
| react-router-dom | 路由 |
| marked | Markdown → HTML |
| gray-matter | 解析 frontmatter |
| highlight.js | 代码高亮 |
| vite / @vitejs/plugin-react | 构建与开发服务器 |

## 结论

这套组合适合“愿意自己维护、但不想碰框架黑盒”的博客。内容沉淀在纯文本里，永远可迁移；站点逻辑就几个组件，读一遍就能改。等哪天觉得麻烦，把 `content/` 原样搬去任何框架都行——文章是文章，和框架无关。
