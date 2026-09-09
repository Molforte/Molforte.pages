# 札记 · Molforte

个人博客，部署在 GitHub Pages。**没有顶栏**——页面是居中的内容流。
主导航是一个**悬浮岛底栏**：底部居中的液态玻璃胶囊（磨砂模糊 + 高光 + 投影），
内含 主页 / 归档 / 友链 / 关于 四个标签，选中项落入深色小泡并加深。
正文末尾另有「较新的文章 / 较旧的文章」。

风格取向是克制的苹果式简洁：白底、系统无衬线、发丝线分隔、大量留白；
大屏内容栏约取整页 60% 宽。全部视觉 token 集中在一份 CSS 里，改起来很容易。

## 技术栈

- **构建**：Vite 6
- **UI**：React 18 + react-router-dom
- **内容**：`content/*.md`（纯 Markdown 文件），`marked` 渲染，`highlight.js` 高亮
- **没有**用 Hexo / Hugo 等博客框架，也没有任何主题黑盒

## 目录结构

```text
content/                # 所有文章，一篇一个 .md
content/pages/          # 静态单页：about.md（关于）、friends.md（友链）…
.github/workflows/      # GitHub Actions：push 到 main 自动构建并部署 Pages
public/favicon.svg
scripts/
  serve-dist.mjs        # 本地模拟 GitHub Pages 的静态服务器
  qa-shots.mjs / qa-audit.mjs   # 可选：无头 Edge 渲染审计
src/
  site.js               # 站点设置（标题、署名、导语……）
  lib/content.js        # 读 content/、解析 frontmatter、排序、按项目分组
  lib/markdown.js       # Markdown -> HTML（站外链接新开页）
  lib/highlight.js      # 按需注册的语言
  components/           # Sidebar（侧栏导航）/ Footer
  pages/                # Home / Archive / Post / StaticPage / NotFound
  styles/global.css     # 全部样式与设计 token
index.html
vite.config.js          # base 路径与 404.html 回退插件
```

## 本地开发

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 产物在 dist/
```

开发模式下新增 / 修改文章即时生效（`import.meta.glob` 会监听 `content/`）。

### 本地预览（模拟 GitHub Pages 子路径）

`vite preview` 在子路径 base 下资源映射不对，预览请用：

```bash
npm run build
node scripts/serve-dist.mjs     # http://127.0.0.1:4173/Molforte.pages/
```

## 写新文章

在 `content/` 新建一个文件，命名 `YYYY-MM-DD-english-slug.md`：

````markdown
---
title: 一篇新文章
date: 2026-09-09
tags: [随笔, 前端]
summary: 不写会自动从正文第一段截取。
draft: false   # true = 暂不发布
---

正文从这里开始，支持标准的 GitHub 风格 Markdown：

- 表格、任务列表（gfm）
- 代码块自动高亮：```js / ```bash / ```yaml / ```html …
- 链接、引用、图片……
````

frontmatter 字段说明（约定单行书写）：

| 字段 | 说明 |
| --- | --- |
| title | 标题，必填 |
| date | `YYYY-MM-DD`；缺省用文件名里的日期 |
| project | 项目名（可选）；归档页按它分组 |
| tags | `[a, b]` 数组 |
| summary | 摘要；缺省自动取正文第一段 |
| slug | 覆盖 URL 中的 slug；缺省用文件名 |
| draft | `true` 时不出现在站点上 |

## 路由

| 路径 | 页面 |
| --- | --- |
| `/` | 主页（文章列表） |
| `/archive` | 归档（按 project 字段分组） |
| `/friends` | 友链（编辑 `content/pages/friends.md`） |
| `/about` | 关于（编辑 `content/pages/about.md`） |
| `/post/:slug` | 单篇文章 |
| 其它 | 404 |

## 站点配置

`src/site.js` 里改：主标题、作者、导语、页脚文案。改标题后记得同步
`index.html` 的 `<title>` 与 `public/favicon.svg` 里的字。

视觉 token（底色、文字、分隔线、链接蓝）集中在 `src/styles/global.css` 顶部
`:root`，改配色只动那一处。

## 部署到 GitHub Pages

1. 仓库需是 GitHub 上的项目仓库（本仓库对应 `github.com/Molforte/Molforte.pages`）；
2. 代码推送到 `main` 分支；
3. 在仓库 **Settings → Pages → Source** 选 **GitHub Actions**；
4. 工作流 `npm ci && npm run build` 后发布 `dist/`，站点地址为
   `https://molforte.github.io/Molforte.pages/`。

每次发布都发生在 CI，不需要本地构建产物入库。

### 换仓库名？

改两处，其余自动：

- `vite.config.js` 顶部的 `REPO_BASE`（构建资源 base 与路由 basename 都会随之生效）；
- `src/components/Footer.jsx` 里的仓库外链。

### 直接刷新文章地址不会 404？

会走 GitHub Pages 的 `404.html` 回退：构建时 `index.html` 被复制为
`404.html`，刷新 `/post/xxx` 时 GitHub 返回 `404.html`，应用启动后由
React Router 根据真实 URL 渲染对应文章。这是 GitHub Pages 上 SPA 的标准做法。

## 布局与定制

- **全站统一内容宽度**：`min(76vw, 60rem)`，所有页面同宽（超宽屏封顶 60rem）；
- 小屏（<900px）：内容放宽到接近全宽（`--measure-phone: 46rem` 兜底）；
- 想调宽度：改 `src/styles/global.css` 顶部的 `--measure` 即可；
- 悬浮岛（宽度 80% / 磨砂浓度 / 圆角 / 选中加深）：全局搜索 `apptabbar`
  相关规则，选中大胶囊的加深色是 `rgba(29, 29, 31, 0.09)`。

## 已知取舍

- 没有深色模式、目录、站内搜索、RSS——按“功能贴近上下文、不为不存在而存在”
  的原则，等真正需要再加（它们会加在正文/侧栏附近，而不是重新长出一条顶栏）。
- 手机上只是同一份内容的自适应，没有单独的移动端导航。

## 免责网络备注

本机 hosts（Steam++ 写入）把 `github.com` 等指向了 `127.0.0.1`，
从这台机器直接 `git push` 前需要先关闭 Steam++ 的对应开关。
