# 札记 · Molforte

个人博客，部署在 GitHub Pages。**没有顶栏**——页面是居中的内容流。
底部功能区是两个**分离的悬浮岛**：主岛是四个图标（主页 / 归档 / 友链 / 关于，
文字在悬浮/聚焦时才浮现，选中格加深约 1/4），旁边是独立的圆形搜索副岛，
像横着的“感叹号”；搜索会打开玻璃浮层按标题/标签检索文章。
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
  check-deploy.mjs      # 部署检查（CI 状态 + 线上服务的是源码还是产物）
  qa-*.mjs              # 可选：无头 Edge 渲染 / 审计 / 线上验收脚本
src/
  site.js               # 站点设置（标题、署名、导语……）
  theme.js              # 深浅色切换（跟随系统 + 手动记忆）
  lib/content.js        # 读 content/、解析 frontmatter、排序、按项目分组
  lib/markdown.js       # Markdown -> HTML（站外链接新开页）
  lib/highlight.js      # 按需注册的语言
  components/           # BottomDock（GlassSurface 玻璃岛 + 搜索）/ BlendCursor / Footer
  pages/                # Home / Archive / Post / StaticPage / NotFound
  styles/global.css     # 全部样式与设计 token
index.html
vite.config.js          # base 路径（Actions 里自动推断）与 404.html 回退插件
```

## 本地开发

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 产物在 dist/
```

开发模式下新增 / 修改文章即时生效（`import.meta.glob` 会监听 `content/`）。

### 代码质量

- `npm run lint`：ESLint 检查（React Hooks、Fast Refresh 等规则）；
- `npm run lint:fix`：自动修复可修问题；
- `npm run format`：Prettier 统一格式（只格式化代码，不改文章 Markdown）。

配置见 `eslint.config.js` 与 `.prettierrc`。

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

## 部署到 GitHub Pages（首次）

仓库地址：`github.com/Molforte/Molforte.pages` → 站点地址 `https://molforte.github.io/Molforte.pages/`

### 三步

1. **推送代码**（本地已 init 并提交好，只差 push）：

   ```powershell
   pwsh -File scripts/push-to-github.ps1     # 带连通性检查与提示
   # 或者手动：
   git remote add origin https://github.com/Molforte/Molforte.pages.git
   git push -u origin main
   ```

   > 本机 hosts 把 `github.com` 指向了 `127.0.0.1`（Steam++/Watt Toolkit 写的）。
   > push 前请先关掉它的加速开关，否则会 `Connection was reset`。

2. **开启 Pages**：仓库 **Settings → Pages → Source** 选 **GitHub Actions**（不是 “Deploy from a branch”）。

3. **等 CI**：Actions 里 `Deploy to GitHub Pages` 跑完（`npm ci` → `npm run build` → 发布 `dist/`），
   然后访问 `https://molforte.github.io/Molforte.pages/`。之后每次 push 到 `main` 都会自动重新部署。

### base 路径是自动的

`vite.config.js` 在 Actions 里会用 `GITHUB_REPOSITORY` 自动推断：

| 仓库 | base |
| --- | --- |
| `Molforte/Molforte.pages`（项目站点） | `/Molforte.pages/` |
| `Molforte/Molforte.github.io`（用户站点） | `/` |
| 本地构建（无环境变量） | 兜底 `/Molforte.pages/` |

要手动指定（例如换了仓库名、或自定义域名部署在根路径）：
`VITE_BASE=/新路径/ npm run build`。改过仓库地址的话，顺手把
`src/components/Footer.jsx` 里的仓库外链也改一下。

### 刷新文章地址不会 404？

走 `404.html` 回退：构建时 `index.html` 被复制为 `404.html`，刷新 `/post/xxx` 时
GitHub 返回该文件，React Router 再按真实 URL 渲染。`public/.nojekyll` 也在，
万一你改成 “Deploy from a branch” 也不会被 Jekyll 处理。

### 排查

| 现象 | 原因 |
| --- | --- |
| push 报 `Connection was reset` | 本机 hosts/Steam++ 拦截了 github，先关掉加速 |
| 页面能开但样式/JS 404 | base 不符：确认仓库名，或用 `VITE_BASE` 指定 |
| Actions 找不到 Pages | Settings → Pages → Source 要选 **GitHub Actions** |
| 刚部署完访问 404 | 首次部署要等 1–2 分钟，或强刷（CDN 缓存） |
| 深链刷新 404（状态码） | 正常：`404.html` 内容就是应用，页面仍会正常渲染 |

## 布局与定制

- **全站统一内容宽度**：`min(76vw, 60rem)`，所有页面同宽（超宽屏封顶 60rem）；
- 小屏（<900px）：内容放宽到接近全宽（`--measure-phone: 46rem` 兜底）；
- **深色模式**：默认跟随系统（`prefers-color-scheme`），页脚月亮/太阳按钮可手动切换并记忆（localStorage）；首屏前内联脚本已应用主题，无闪烁；
- 想调宽度：改 `src/styles/global.css` 顶部的 `--measure` 即可；
- 底栏玻璃参数：在 `src/components/BottomDock.jsx` 里传给 `<GlassSurface />`
  （`borderRadius` / `backgroundOpacity` / `saturation` / `blur` / `distortionScale` 等，
  完整 props 见组件头部注释与 React Bits 文档）；布局与气泡样式在 `global.css` 的
  `dock` / `dock-glass` / `apptabbar` / `search-island` / `search-backdrop` 规则里；
- 深浅色都由 `:root` / `:root[data-theme='dark']` 里的 token 控制，换色只改这两处。

## 设计规则（全局，改样式时照做）

### 1）圆角只用这几档（对齐苹果）

| token | 值 | 用在哪 |
| --- | --- | --- |
| `--r-xs` | 8px | 标签芯片、悬浮气泡、行内代码 |
| `--r-sm` | 12px | 图标按钮（主题切换） |
| `--r-md` | 16px | 列表行、图片、代码块 |
| `--r-lg` | 20px | 卡片、归档 hero、归档分组卡 |
| `--r-xl` | 28px | 搜索浮层 |
| `--r-pill` | 999px | 胶囊（底栏标签/选中胶囊）、圆形 |

底栏两个岛的半径由 `GlassSurface` 以数值 props 传：主岛 **34px**（= 岛高一半，胶囊）、
搜索岛 **999px**（正圆）。改 `--dock-h` 时记得同步主岛半径（`BottomDock.jsx`）。

### 2）边距 = 圆角半径

把文字块当成一个方格：**文字到圆角曲线的距离 = 该容器的圆角半径**，
所以卡片内边距直接写 `padding: var(--r-lg)`，而不是随手给数字。

现有对应：卡片 20/20、归档 hero 20/20、归档分组卡与行左右 20、
搜索浮层与结果行左右 28、代码块 16/16、芯片/气泡/行内代码左右 8、主题按钮 12/12。

唯一例外是**胶囊**（底栏标签与选中胶囊）：两端本来就是完整圆弧，
内容由「胶囊格」居中承载，不套用这条规则。

### 3）字体

- 正文：Apple → **苹方**（`PingFang SC`）；Android → **思源**（`Source Han Sans SC` / `Noto Sans CJK SC`）；Windows → **雅黑**（`Microsoft YaHei`）；拉丁优先走 SF / Segoe UI；
- 代码：**Sarasa Mono SC**，自托管精简子集 `src/assets/fonts/sarasa-mono-sc-subset.woff2`（236 KB），缺字自动回落系统等宽；应用启动时用 FontFace API 显式加载（浏览器对未使用的 `@font-face` 会懒加载，不显式加载会一直停在 unloaded）；
- 重新生成子集（两步）：

  ```bash
  node scripts/fetch-font-source.mjs                                  # 下载 + 解压官方字体（清华/南大镜像 → GitHub 代理兜底）
  node scripts/build-font-subset.mjs ".fontsrc/ttf/SarasaMonoSC-Regular.ttf"   # 只留站点用到的字符
  ```

- 许可：Sarasa Gothic © Renzhi Li，SIL OFL 1.1（子集与说明见 `third_party/sarasa-gothic/`）。

## 已知取舍

- 没有目录、RSS——按“功能贴近上下文、不为不存在而存在”的原则，等真正需要再加
  （它们会加在正文/侧栏附近，而不是重新长出一条顶栏）。
- 手机上只是同一份内容的自适应，没有单独的移动端导航。

## 效果来源

站上两个交互效果都不是自创的，来源都在这里说清楚：

1. **底栏玻璃** —— 使用 [React Bits](https://reactbits.dev/) 的 `GlassSurface` 组件
   （JavaScript + CSS 变体），源码在 `src/components/GlassSurface.jsx` / `.css`。
   相对上游只有两处等价改写（把 SVG 能力探测提为模块级函数 + 惰性初始 state），
   原因是通过本项目 ESLint；改动已在文件头注明。
   底栏的两个岛（主岛、搜索圆岛）都由它包裹，玻璃参数在 `BottomDock.jsx` 里传：
   `borderRadius` / `backgroundOpacity` / `saturation` 等，其余用组件默认值。
   （早先曾用 shuding/liquid-glass 自适配，现已移除，历史里仍可找回。）
2. **“札记”标题的悬停效果** —— 复刻 [deepseek.com](https://www.deepseek.com/en/) 首页
   “Into the Unknown” 的差值混合光标：指针进入标题区域后挂一块全屏 canvas
   （`mix-blend-mode: difference`），白色圆点跟随鼠标，**经过文字时反相**；
   常态半径 16px，进入 `[data-cursor="blend"]` 放大到 32px，离开则缩回淡出；
   触屏与 `prefers-reduced-motion` 下不启用。实现见 `src/components/BlendCursor.jsx`
   （按上游公开页面里的行为与数值重写，未复制其代码）。

## 免责网络备注

本机 hosts（Steam++ 写入）把 `github.com` 等指向了 `127.0.0.1`，
从这台机器直接 `git push` 前需要先关闭 Steam++ 的对应开关。
