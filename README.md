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
articles/               # 文章库（独立仓库 Molforte/molforte.Articles，目标做成 submodule）
  Projects/<册>/        # 一册一个目录（= 归档里的一个栏目）
    <笔记>.md           #   笔记：01- 或 第一章- 前缀决定顺序
    index.md            #   册首页（Obsidian 的 README/@ 索引页转换而来）
    img/  files/        #   该册引用的图片与附件（构建期物化到 public/，站点库不存图）
  Articles/             # 独立文章（按日期；首页与归档的「文章」）
  Fragments/            # 残页（归档的「碎片」）
content/pages/          # 站点自己的静态单页：about.md（关于）、friends.md（友链）…
public/images/<册>/     # ↑ 构建期从 articles/Projects/<册>/img 物化而来（已 gitignore）
.github/workflows/      # GitHub Actions：push 到 main 自动构建并部署 Pages
public/favicon.svg
scripts/
  serve-dist.mjs        # 本地模拟 GitHub Pages 的静态服务器
  check-deploy.mjs      # 部署检查（CI 状态 + 线上服务的是源码还是产物）
  qa-*.mjs              # 可选：无头 Edge 渲染 / 审计 / 线上验收脚本
  qa-code.mjs           # 代码块验收：高亮生效、纯文本块不着色、无未知语言告警
  qa-font.mjs           # 字体验收：Sarasa 子集已加载且真等宽（QA_WAIT=load 可放宽等待）
  qa-align.mjs          # 对齐验收：卡片内「墨迹」到圆角的距离 = 圆角半径（QA_W=390 可测窄屏）
  scan-vault.mjs        # Obsidian 全库盘点（只读）：链接/嵌入/公式/图片用量与领域分档
  sync-obsidian.mjs     # Obsidian → 站点转换：默认 dry-run，--write 才落盘
  obsidian.config.example.mjs   # 同步白名单模板（真正的 obsidian.config.mjs 已 gitignore）
src/
  site.js               # 站点设置（标题、署名、导语……）
  theme.js              # 深浅色切换（跟随系统 + 手动记忆）
  lib/frontmatter.js    # 极简 frontmatter 解析（运行时与构建期共用）
  lib/content.js        # 读 content/、解析 frontmatter、排序、按项目分组
  lib/markdown.js       # Markdown -> HTML（站外链接新开页 + {{IMG}}/{{FILE}}/{{NOTE}} 占位符）
  lib/highlight.js      # 按需注册的语言
  components/           # BottomDock（GlassSurface 玻璃岛 + 搜索）/ MarkdownBody / BlendCursor / Footer
  pages/                # Home / Archive（栏目制）/ Volume / Note / Post / StaticPage / NotFound
  styles/global.css     # 全部样式与设计 token
index.html
vite.config.js          # base 路径（Actions 里自动推断）、404.html 回退、virtual:notes 册清单插件
```

## 本地开发

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 产物在 dist/
```

开发模式下新增 / 修改文章即时生效（`import.meta.glob` 会监听 `content/`）。

> 站点现在的正文是「笔记」（下面的栏目）；`content/*.md` 那套按日期的「文章」是可选的，
> 目前为空（样例已移除）。两条内容线共用同一套渲染与设计规则。

**字数口径**：只算正文——``` 或 ~~~ 围栏代码块（语言任意）与行内代码都不计入，
未闭合的围栏按到文末处理。实现见 `src/lib/text.js`，归档统计、页脚「写完了多少字」、
阅读时长、同步脚本报告都走这一份规则（笔记正文字数在构建期由 `vite.config.js` 的
`notes-index` 插件算好，正文本身不进包）。

## 内容：文章库 articles/（三分）

内容单独放在 **[Molforte/molforte.Articles](https://github.com/Molforte/molforte.Articles)**，
站内挂在 `articles/`（目标形态是 submodule）：

| 文件夹           | 放什么                                   | 站点上                              |
| ---------------- | ---------------------------------------- | ----------------------------------- |
| `Projects/<册>/` | 一册一个目录：笔记 + `index.md` + `img/` | 归档的**栏目** → 册首页 → 单篇笔记  |
| `Articles/`      | 独立文章（`YYYY-MM-DD-slug.md`）         | 首页与归档的**文章**                |
| `Fragments/`     | 残页                                     | 归档的**碎片** → `/fragment/<slug>` |

一「册」= 一个教程序列 / 主题笔记集（vault 里的叶子目录）。命名与显示规则：

| 内容里                                 | 站点上                                                                      |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `01-LED指示灯的基本操作.md`            | 标题 `LED指示灯的基本操作` + 顺序角标 `01`（编号只用于排序）                |
| `0a-准备.md` / `16-DS18B20….md`        | `0a` 排在 `01` 前，`16` 排在 `06` 后（数字+字母自然序）                     |
| `第一章-电阻器.md` / `第9章-蜂鸣器.md` | 中文数字编号同样认，角标显示 `1` / `9`                                      |
| `index.md`                             | 该册首页（栏目落地页）                                                      |
| `img/x.png`（被 `![[x.png]]` 引用）    | 随册存放，构建期物化到 `public/images/<册>/`，正文里用 `{{IMG:x.png}}`      |
| `[[另一篇]]`                           | 站内链接 `{{NOTE:<册>/<笔记>}}`；指向未发布笔记的降级成纯文本（不泄露标题） |
| `created:` 或文件时间                  | 显示成「最后更新」                                                          |

**加一册**（同步白名单即发布闸门，没列进去的册根本不会被读）：

```bash
cp scripts/obsidian.config.example.mjs scripts/obsidian.config.mjs   # 首次；该文件已 gitignore
# 编辑 volumes：vaultPath / slug / title / series / project
node scripts/scan-vault.mjs "D:\path\to\vault"     # 可选：先盘点（链接/公式/图片用量）
node scripts/sync-obsidian.mjs                     # dry-run：只出报告与 .qa/ 预览，不写文件
node scripts/sync-obsidian.mjs --write             # 写入 articles/Projects/<册>/（含 img/）
npm run build && node scripts/serve-dist.mjs       # 本地看效果
```

**清单不落盘**：`vite.config.js` 的 `content-index` 插件在构建期扫 `articles/**` 的 frontmatter
生成虚拟模块 `virtual:content`，所以往库里的三个目录丢 `.md` 就会出现，不需要跑脚本、
也没有要提交的索引文件；正文用惰性 `import.meta.glob`，一篇一个 chunk，几百篇也不会塞进首屏。
**图片同理**：`materialize-assets` 插件在构建/开发前把 `articles/Projects/<册>/{img,files}`
物化到 `public/images|files/<册>/`（已 gitignore），所以站点仓库不存图。

### 把 articles/ 换成 submodule（内容推上去之后）

```bash
# 站点仓库里（articles/ 已提交过，切 submodule 前先删掉普通目录）
git rm -r --cached articles && rm -rf articles
git submodule add https://github.com/Molforte/molforte.Articles articles
git commit -m "chore: 内容库改为 submodule"
```

CI 侧需要在 `actions/checkout` 上加 `submodules: true`（公开仓库，读不需要额外 token），
改动内容库后要么手动重跑站点构建，要么在内容库加一个 `repository_dispatch`。

vault 本身保持私有：同步只读白名单里的目录，指向未发布笔记的链接会被降级，
`scripts/obsidian.config.mjs`（含本机路径）也在 `.gitignore` 里。

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

```markdown
---
title: 一篇新文章
date: 2026-09-09
tags: [随笔, 前端]
summary: 不写会自动从正文第一段截取。
draft: false # true = 暂不发布
---

正文从这里开始，支持标准的 GitHub 风格 Markdown：

- 表格、任务列表（gfm）
- 代码块自动高亮：`js / `bash / `yaml / `html …
- 链接、引用、图片……
```

frontmatter 字段说明（约定单行书写）：

| 字段    | 说明                               |
| ------- | ---------------------------------- |
| title   | 标题，必填                         |
| date    | `YYYY-MM-DD`；缺省用文件名里的日期 |
| project | 项目名（可选）；归档页按它分组     |
| tags    | `[a, b]` 数组                      |
| summary | 摘要；缺省自动取正文第一段         |
| slug    | 覆盖 URL 中的 slug；缺省用文件名   |
| draft   | `true` 时不出现在站点上            |

## 路由

| 路径                   | 页面                                        |
| ---------------------- | ------------------------------------------- |
| `/`                    | 主页（最近更新的栏目 + 文章，有文章才显示） |
| `/archive`             | 归档（栏目制：一册一栏目）                  |
| `/notes/:volume`       | 栏目首页（该册 README/目录 + 编号笔记列表） |
| `/notes/:volume/:note` | 单篇笔记（册内上下篇）                      |
| `/post/:slug`          | 单篇文章（`content/*.md`，可选用）          |
| `/friends`             | 友链（编辑 `content/pages/friends.md`）     |
| `/about`               | 关于（编辑 `content/pages/about.md`）       |
| 其它                   | 404                                         |

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

| 仓库                                      | base                    |
| ----------------------------------------- | ----------------------- |
| `Molforte/Molforte.pages`（项目站点）     | `/Molforte.pages/`      |
| `Molforte/Molforte.github.io`（用户站点） | `/`                     |
| 本地构建（无环境变量）                    | 兜底 `/Molforte.pages/` |

要手动指定（例如换了仓库名、或自定义域名部署在根路径）：
`VITE_BASE=/新路径/ npm run build`。改过仓库地址的话，顺手把
`src/components/Footer.jsx` 里的仓库外链也改一下。

### 刷新文章地址不会 404？

走 `404.html` 回退：构建时 `index.html` 被复制为 `404.html`，刷新 `/post/xxx` 时
GitHub 返回该文件，React Router 再按真实 URL 渲染。`public/.nojekyll` 也在，
万一你改成 “Deploy from a branch” 也不会被 Jekyll 处理。

### 排查

| 现象                           | 原因                                              |
| ------------------------------ | ------------------------------------------------- |
| push 报 `Connection was reset` | 本机 hosts/Steam++ 拦截了 github，先关掉加速      |
| 页面能开但样式/JS 404          | base 不符：确认仓库名，或用 `VITE_BASE` 指定      |
| Actions 找不到 Pages           | Settings → Pages → Source 要选 **GitHub Actions** |
| 刚部署完访问 404               | 首次部署要等 1–2 分钟，或强刷（CDN 缓存）         |
| 深链刷新 404（状态码）         | 正常：`404.html` 内容就是应用，页面仍会正常渲染   |

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

| token      | 值    | 用在哪                          |
| ---------- | ----- | ------------------------------- |
| `--r-xs`   | 8px   | 标签芯片、悬浮气泡、行内代码    |
| `--r-sm`   | 12px  | 图标按钮（主题切换）            |
| `--r-md`   | 16px  | 列表行、图片、代码块            |
| `--r-lg`   | 20px  | 卡片、归档 hero、归档分组卡     |
| `--r-xl`   | 28px  | 搜索浮层                        |
| `--r-pill` | 999px | 胶囊（底栏标签/选中胶囊）、圆形 |

底栏两个岛的半径由 `GlassSurface` 以数值 props 传：主岛 **34px**（= 岛高一半，胶囊）、
搜索岛 **999px**（正圆）。改 `--dock-h` 时记得同步主岛半径（`BottomDock.jsx`）。

### 2）边距 = 圆角半径

把文字块当成一个方格：**文字到圆角曲线的距离 = 该容器的圆角半径**，
所以卡片内边距直接写 `padding: var(--r-lg)`，而不是随手给数字。

现有对应：卡片 20/20、归档 hero 20/20、归档分组卡与行左右 20、
搜索浮层与结果行左右 28、代码块 16/16、芯片/气泡/行内代码左右 8、主题按钮 12/12。

#### 2.1）量的是「墨迹」，不是行盒

上面的 20 指的是**字形墨迹**到边的距离。行盒顶部还含半行距与字体内部空隙，
字号越大越明显（归档页 44px 的「归档」原本离上边 31.6px、离左边 23px，看起来就是没对齐）。
所以卡片内**第一行字**要补一次墨迹补偿：

```css
.archive-hero__title {
  --lh: 1.3;
  /* 半行距 + 字体内部空隙（--ink-gap 见 :root，换字体栈需重新标定）反向抵消 */
  margin: calc((1 - var(--lh)) / 2 * 1em - var(--ink-gap)) 0 0;
  line-height: var(--lh);
}
```

两个坑：

- 与别的元素**基线对齐**（`align-items: baseline`）的 flex 子项，负 `margin-top` 会被
  基线对齐算法抵消，必须改从父容器内边距里扣（见 `.archive-group-card__head`）；
- 补偿只加在**卡片内第一行字**上（归档 hero 标题、分组卡标题、首页卡片标题）。
  正文页标题不在卡片里，页面留白不是圆角，不套这条。

归档分组卡的行距同样是 20 的网格：卡头下内边距 10 + 行内边距 10 = 20；
末行文字到卡片下边 ≈ 21（`.archive-rows` 的 `padding-bottom: 7px` 是为此标定的）。

#### 2.2）卡片摘要必须锁死整数行

首页摘要写的是 `-webkit-line-clamp: 3`，但 `-webkit-box` 作为 **flex 子项会被块化成
`flow-root`**，此时 line-clamp 只负责加省略号、**不限制高度**，于是第 4 行整行、第 5 行半截
都会露出来（就是「卡片最后一行被切一半」的根因）。所以摘要除了 clamp 还要显式给高度：

```css
.post-card__summary {
  --lh-sum: 1.6;
  flex: none;
  height: calc(3 * var(--lh-sum) * 1em); /* 与 line-height 同源，改行高时一起改 */
  line-height: var(--lh-sum);
}
```

余量交给 `.post-card__meta` 的 `margin: auto 0 0`（元信息永远贴卡片底部）。

#### 2.3）卡片高度贴合内容，不留空块

摘要锁成整数行之后，原先写死的 `height: 12.5rem` 就会在摘要与元信息之间空出一大块。
现在改成「下限 + 内容自适应」：

```css
.post-card {
  display: flex; /* 让 .post-card__link 撑满卡片，auto 外边距才能推到底 */
  min-height: 11rem; /* 窄屏 10.5rem；一行标题时的舒适下限 */
}
.post-card__link {
  flex: 1; /* 不能用 height: 100%：父级是 min-height，百分比高度解析不出可用值 */
}
```

一行标题时卡片 187px，摘要到元信息正好 **21px**（≈ 一个圆角半径）；
标题折成两行时卡片自己长到 204px，元信息仍贴底 21px，绝不会被 `overflow: hidden` 裁掉。
所以「卡片高度」只保证下限，不追求像素级一致——一致性交给摘要固定 3 行。

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
