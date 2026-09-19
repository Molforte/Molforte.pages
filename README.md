# 札记 · Molforte

个人博客，部署在 GitHub Pages。**没有顶栏**——页面是居中的内容流。
底部功能区是两个**分离的悬浮岛**：主岛是一排圆形图标芯片
（Home / Archive / Links；芯片样式取自 [Uiverse](https://uiverse.io/) 的
`navigation-card`——50px 圆片、极浅底色、悬浮变深），
**当前那枚会撑宽成一颗胶囊、把栏名浮出来**（这层来自我们早先那版 Apple `.dotnav`
的「点拉长成线」）。旁边是独立的圆形搜索副岛，搜索会打开玻璃浮层按标题/标签检索文章。
两个岛的外壳默认是**实心白卡片**（只留一层几乎看不见的底影），
另有发丝描边与液态玻璃两版，见「布局与定制」。
正文末尾另有「较新的文章 / 较旧的文章」。
首页是一整屏的首屏（hero）：欢迎语、格言，下面两个按钮——主按钮是**描边式**
（页面底色 + 3px 主蓝描边 + 同色文字，悬浮时整块填成主蓝、文字翻成底色、字号抬 +25%，
圆角仍是全站的 `--r-pill`），副按钮是一排**圆形联系方式图标**
（Bilibili / GitHub / Email，指针停在某一枚上时它浮出名字气泡、其余几枚模糊缩小）；
文章与项目都落在折线以下。欢迎语里的 “Molforte” 会朝鼠标方向偏出去，
偏走的地方露出原位的蓝色残影；**只有首屏这一屏**底上铺了点阵：
**横向满幅到屏幕两边、高度就是一屏（`height: 100dvh`）**，
再往下翻（Whoami、最近更新）是干净的白底；指针快速掠过时点会被「顶开」，
别的页面也没有这层。

首屏往下是**第二屏：Whoami**（主按钮「Get Started」点了就往下滑一屏，正好停在它开头）。
这一屏很规矩：左上角是标题，下面一张卡片。

**全站的卡片共用一套材料**：实心 `--surface` + `--island-shadow`（悬浮时换成
`--island-shadow-hover`），圆角一律 `--r-lg`，**都不带描边**。
底栏那两座岛、首页的 Whoami 卡与 Recent 卡、归档页的 hero 与栏目卡、
册页的说明卡与笔记列表卡——全都引这几个 token。
早先各页各有一套 `--card-bg` / `--card-border` / `--card-shadow`（还带
一条 1px 描边和顶部内高光），卡片之间材质并不一致；那一组 token 已经删掉。
一句话：同一个站里"浮起来的东西"应该是同一种材料，不该一处一个影。
（深色下表面是 `#1d1d1f`，不是页面底色纯黑。）

**卡片内部是标签页**（`src/components/WhoamiTabs.jsx`），一个 `H1` 一个标签：

- 内容取自 `content/pages/whoami.md`，走仓库既有的 `getPage()` + `renderMarkdown()`
  这条管线（不引新依赖），组件按 `<h1>` 把渲染好的 HTML 切成几段；
- 视觉照 [Uiverse](https://uiverse.io/) 那份 radio tabs 移植：一条浅灰标签栏，
  选中的标签底色与面板一致，两侧两块"缺口"小方块用 `box-shadow` 在圆角外补出反向圆角，
  标签与面板于是像连在一起的一张纸（`.wtabs__notch`）。
  **缺口小方块必须用不透明的栏底色**（`--tabbar-bg`）——原版也是写死不透明的，
  用半透明色会压在栏上合成出更亮的一块，深色下就是那个"颜色不搭的角"；
- 圆角与边距按站里的规矩对齐：卡片圆角 `--r-lg`(20px)，栏与面板的左右/下内边距也是它
  （「边距 = 圆角半径」）；标签圆角 `--r-sm`(12px)，**缺口的边长与它相等**——
  两个半径一样，补出来的反向圆角才和标签圆角是同一条曲线，接缝才连续。
  想换标签圆润度只改 `.wtabs` 的 `--tab-radius`，缺口会跟着走；
- 与那份实现的三处不同：颜色换成站点 token（不再是写死的绿 + 灰）；
  面板走**正常文档流**（原实现是 `position: absolute`，卡片撑不开高度，
  换个长一点的标签页就会盖到下面）；交互用**真正的 ARIA 标签页**
  （`role="tab"` / `role="tabpanel"`，左右方向键可切、只有选中的那个在 Tab 序列里），
  不是隐藏的 radio——这里本来就是"切内容面板"，tab 语义是对的；
- 正文排版复用文章那套 `.post-body`，只在 `.wtabs__body` 里收一档字号。

**卡片与正文没有任何入场动效**，进去就是完整的；动效只服务于标题那一个词：

标题是**一个盒子**——整串 `Whoami` 就在那个 `h2` 里，`W` 与 `hoami` 是同一段文字的
前后两截，靠**裁切宽度**决定露多少（`overflow: hidden` + `width`）：

1. 首屏 Welcome 里的 `W` 是个 `.home-hero__w`，按滚动进度平移到标题第一个字的位置
   （往回滚就原样飞回去）。飞行期间标题宽度是 **0**，所以这一页当时没有标题；
2. `W` 落定那一刻，标题宽度先落到**一个 W 宽**——就是刚落下的那个字接上了；
3. 紧接着（强制结算一帧之后）宽度长到整串宽，`hoami` 于是**从 W 后面长出来**。
   两个宽度值（`--tw-from` / `--tw-to`）与飞行几何都用 `Range` 在标题里量，
   不用额外包 span。往回滚会收回去，再滚下来重放一次。

插值用 **JS 逐帧写一个 CSS 变量**（`--w-p`，0→1，rAF 节流），**不是** CSS 滚动时间轴：
后者支持度不齐，遇到不支持会整段静悄悄不执行（第一版就是这么"没动"的）。
几何在挂载时量一次，并在字体加载完、挂载后 300ms / 1200ms 各重量一次——
首屏入场动效与字体切换会让行盒晚一拍 settle，实测差 10px；缩放按**渲染宽度**之比
而不是字号之比（按字号算会宽 4px，落点看得出来），按中心对齐。
`prefers-reduced-motion` 下不飞、标题直接是完整的；JS 没跑时同样如此。
文案在 `src/site.js` 的 `whoami`（`title` 标题、`page` 对应
`content/pages/<page>.md`——那一页不在路由里，只给这张卡片当内容源）。

第三屏是**最近更新**：三张卡片 + 一个 `More →`。
条目由 `content.js` 的 `recentItems(n)` 生成——**笔记与文章混排、按日期倒序**，
每条带跳转地址与所属栏目。混排是有意的：笔记有几十篇、文章可能只有一两篇，
只挑文章会挑出一堆空位。卡片表面与底栏岛、第二屏那张卡同一套材料
（`--surface` + `--island-shadow`），摘要用 `-webkit-line-clamp: 2` 收两行，
三张卡高度才整齐；窄屏落成一列。**这一屏是自动的**：写新笔记，首页自己会变。

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
content/pages/          # 站点自己的静态单页：friends.md（友链）、whoami.md（首页第二屏的内容源）
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
  components/           # BottomDock（圆形图标芯片 + 搜索）/ SocialLinks（联系方式那一排）
                        # MagneticWord（跟着鼠标的词）/ DotField（首屏点阵）
                        # ShinyText（主按钮文案的高光）/ MarkdownBody / BlendCursor（差值光标）
                        # Reveal（滚动入场）/ Footer
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

**字数口径**：只算正文——``` 或 ~~~ 围栏代码块（语言任意）、行内代码、
以及 `<!-- HTML 注释 -->` 都不计入，未闭合的围栏按到文末处理。
实现见 `src/lib/text.js`，归档统计、页脚「写完了多少字」、阅读时长、
同步脚本报告都走这一份规则（笔记正文字数在构建期由 `vite.config.js` 的
`notes-index` 插件算好，正文本身不进包）。
注释这条是补上的：`content/pages/friends.md` 里写了一段「怎么加友链」的
HTML 注释（对读者不可见），结果被算进了全站字数——55 个汉字。
注释是写给作者看的、不是正文，和代码块同一个道理，所以现在整段摘掉。
计数范围 = 文章 + 笔记 + 残页 + **`content/pages/` 下的静态单页**
（首页第二屏那张卡片的内容源就在这里；它们没进构建期清单，由 `countPageChars()`
在 `content.js` 里按需算——文件本来就是 eager 读进来的）。
所以往 `content/pages/*.md` 里写字，页脚与归档的「字数」会一起涨，
两处永远同一个数。

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

正文渲染出来之后，**下面这些是自动的**，写的时候不用管：

| 元素 | 自动做的事 | 在哪实现 |
| --- | --- | --- |
| 代码块 | 语法高亮；**左侧一行行号，在卡片之外**（站在页面底色上、不参与代码的横向滚动、`user-select: none` 不会跟代码一起被选走）；右上角一颗按钮，文案就是**代码语言**（`~~~C` → 「C」，没写语言则显示「复制」），点了复制纯文本并把文案换成「已复制」 | 行号由 `MarkdownBody` 按真实行数插入；按钮标记由 `markdown.js` 写进 HTML、点击由 `MarkdownBody` 事件委托 |
| 图片 | 光标变放大镜，点一下全屏预览：毛玻璃背景、Esc / 点背景 / 点右上关闭都能关，打开时锁页面滚动并给内容栏加 `inert` | `src/components/ImageZoom.jsx` |
| 表格 | 撑到内容宽（至少占满内容栏），超出就在卡片里横向滑 | `markdown.js` 套 `.rail-scroll` + `global.css` |
| 行间公式 | 按需加载 KaTeX，宽了同样横向滑 | `lib/math.js` + 上面的滑轨 |

> 行号能和代码精确对齐，靠的是两列的 `font-family` / `font-size` / `line-height`
> 完全相同，外加行号自己的 `padding-top` 等于代码卡片的 `padding`。
> **改代码块的字号或行高时，`.code-nums` 那几项要跟着一起改**，否则会错行。

## 路由

| 路径                   | 页面                                        |
| ---------------------- | ------------------------------------------- |
| `/`                    | 主页（最近更新的栏目 + 文章，有文章才显示） |
| `/archive`             | 归档（栏目制：一册一栏目）                  |
| `/notes/:volume`       | 栏目首页（该册 README/目录 + 编号笔记列表） |
| `/notes/:volume/:note` | 单篇笔记（册内上下篇）                      |
| `/post/:slug`          | 单篇文章（`content/*.md`，可选用）          |
| `/friends`             | 友链（编辑 `content/pages/friends.md`）     |
| 其它                   | 404                                         |

> `/about` 已去掉（导航栏那格与页面一起删的，`content/pages/about.md` 在 git 里，
> 需要时 `git checkout` 就能找回）。自我介绍现在活在首页第二屏那张卡片的标签页里，
> 内容源是 `content/pages/whoami.md`。

## 站点配置

`src/site.js` 里改：主标题、作者、页脚文案，以及**首页首屏**那几行文案——
`welcome`（欢迎语，首屏大字，写数组就是一行一句、断行你自己定；写字符串则自动折行）、
`motto`（格言）、`magnetic`（会朝鼠标偏出去的那个词，留空即无此效果）、
`start`（主按钮：默认**往下滑一屏**，也就是「主页第二页」，不跳路由；
给它补一个 `to: '/archive'` 就变回跳转）、
`whoami`（第二屏：`title` 标题、`meta.name` / `meta.time` 卡片署名、
`body` 正文、`items` 卡片底部那一行身份）、
`social`（副按钮那排联系方式：`key` 决定图标，可用 `bilibili` / `github` / `email`，
`href` 留空字符串那一项就自动不显示）。
改标题后记得同步 `index.html` 的 `<title>` 与 `public/favicon.svg` 里的字。

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
- **首页首屏**：`.home-hero` 高一整屏（`100dvh`），里面只有三块内容
  `.home-hero__title`（欢迎语）/ `__motto`（格言）/ `__actions`（两个按钮），
  字号都走 `clamp()`，不会掉到折线以下；给底栏岛让位的高度是 `--dock-clearance`，
  `.site-frame` 的内边距与首屏高度共用它，改底栏高度时只动这一处；
- **底栏**：一条圆形图标芯片的主岛 + 一个圆形搜索副岛。芯片尺寸、项间距、
  容器内边距都在 `global.css` 的 `.dotnav` 一族里（照着 Uiverse `navigation-card`
  那套：50px 圆片、30px 间距，内边距收紧到 7px 11px —— 原样式是 15px 20px）；
  芯片底色是 `--tab-bg` / `--tab-bg-hover` / `--tab-bg-current`（深浅两套），
  当前那枚宽度 `50px → 7rem`。
  外壳有三版，做在 `dock--hairline` / `dock--solid` / `dock--glass` 三个类上，
  默认值在 `BottomDock.jsx` 顶部的 `DOCK_SURFACE_DEFAULT`（现在是 `solid`），
  运行时可以 `?dock=solid|hairline|glass` 或按 `Shift+D` 循环着切。
  只有 `glass` 那版会挂载 React Bits 的 `<GlassSurface />`（它的宽度、圆角、
  玻璃参数都在 `BottomDock.jsx` 里传：`borderRadius` / `backgroundOpacity` /
  `saturation` / `distortionScale` 等，完整 props 见组件头部注释与 React Bits 文档）；
  另外两版就是一个普通盒子，省掉 SVG 滤镜的开销，也没有它在边缘留下的那圈淡蓝纹。
  搜索浮层样式在 `search-island` / `search-backdrop` 规则里；
  两个岛离窗口底边 26px（窄屏 20px，`.dock` 的 `bottom`）；
- 深浅色都由 `:root` / `:root[data-theme='dark']` 里的 token 控制，换色只改这两处。

## 设计规则（全局，改样式时照做）

### 0）横向溢出：一律走滑轨，不许撑破容器

内容比容器宽时（长代码行、宽表格、行间公式）**横向滑动**，不换行、不挤压、
更不许把容器撑破。分两类处理：

| 类别 | 有哪些 | 滑轨 | 为什么 |
| --- | --- | --- | --- |
| 内容块 | 代码块 `pre`、表格、行间公式 | **显示**一条 8px 细轨（`--rail-*`） | 不显示的话读者不知道右边还有内容 |
| 控件 | 第二屏标签栏、底栏那一排 | **藏掉**滑轨（`scrollbar-width: none`），照样能滑/拖/滚 | 一排按钮底下横一条滚动条太吵 |

表格的滑轨由 `markdown.js` 在渲染时套一层 `.rail-scroll`（表格自己设
`display: block` 会丢列宽）。滑轨样式**必须按引擎分开写**：标准属性
（`scrollbar-width` / `scrollbar-color`）一旦写成非 `auto`，Blink 就会忽略
`::-webkit-scrollbar` 改用原生滑轨，于是"有没有滑轨"在不同平台表现不一致。
现在用 `@supports selector(::-webkit-scrollbar)` 分流：Blink/WebKit 自绘，
Firefox 走标准属性。

**两个必须记住的坑**（都实际踩过，症状是"内容把卡片撑破"而不是"内容在卡片里滑"）：

- `grid` / `flex` 子项默认 `min-width: auto`，**拒绝收缩**。所以
  `.wtabs__panels` 的轨道写成 `minmax(0, 1fr)`、面板加 `min-width: 0`，
  `.dock > *` 加 `min-width: 0`，`.post-body` 也加 `min-width: 0`；
  底栏那座岛原本是 `flex: 0 0 auto`（拒绝收缩），已改成 `flex: 0 1 auto`。
- 居中的 flex 容器**一旦溢出，开头会被裁到滚不回来的地方**。所以
  `.dotnav` 用 `justify-content: safe center`：装得下居中，装不下退回从头排。

### 1）圆角只用这几档（对齐苹果）

| token      | 值    | 用在哪                          |
| ---------- | ----- | ------------------------------- |
| `--r-xs`   | 8px   | 标签芯片、悬浮气泡、行内代码    |
| `--r-sm`   | 12px  | 图标按钮（主题切换）            |
| `--r-md`   | 16px  | 列表行、图片、代码块            |
| `--r-lg`   | 20px  | 卡片、归档 hero、归档分组卡     |
| `--r-xl`   | 28px  | 搜索浮层                        |
| `--r-pill` | 999px | 胶囊（底栏的线/文字格）、圆形     |

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
- **底栏是开着的**（`src/App.jsx` 顶部 `SHOW_BOTTOM_DOCK = true`）。改 `false` 时
  组件、玻璃岛、搜索浮层、样式都原样保留，只是不挂载；`global.css` 的
  `.site-frame--no-dock` 会顺手把给它让位的那块高度（6rem）收掉，
  否则页面底部会留一条空带。

## 效果来源

站上五个交互效果，来源都在这里说清楚：

1. **底栏玻璃** —— 使用 [React Bits](https://reactbits.dev/) 的 `GlassSurface` 组件
   （JavaScript + CSS 变体），源码在 `src/components/GlassSurface.jsx` / `.css`。
   注意现在只有底栏外壳切到 `?dock=glass` 那一版时才会挂载它；默认是发丝描边，
   不走玻璃。
   底栏里那排**圆形图标芯片**的样式取自 [Uiverse](https://uiverse.io/) 的 `navigation-card`：
   50px 圆片、底色 `--tab-bg`（浅 #fcfcfc）、悬浮变深 `--tab-bg-hover`（#dfdfdf）、
   项间距 30px，圆角仍用全站的 `--r-pill`；容器内边距比原样式收紧了一档
   （原 15px 20px → 现在 7px 11px），让外框到芯片更近。
   在它之上保留了本站早先那版 [Apple `.dotnav`](https://www.apple.com/os/ipados/)
   的做法：**当前那一枚撑宽成胶囊**（50px → 7rem）并把栏名浮出来；
   但当前态**不填黑块**，只用再深一档的浅灰（`--tab-bg-current`）——那份参考的
   干净感正来自「所有 tab 都是同一个浅色」，填黑会一下把整条压重。
   因为不再有深底白字，也就没有「白字形显胖」的问题，四个图标同尺寸即可。
   两处按本站调整：命中的语义没照搬 Apple 的 `role="tablist"`——底栏是页面导航，
   仍用 `<nav>` + 链接；深浅两套芯片底色各给一份（`--tab-bg*`）。
   图标的**视觉重量**也调过：链环那个（Links）的两条路径在 24 格 viewBox 里铺得比
   别的图标满，同尺寸看着偏大，所以标了 `small`、收一档（`.dotnav__icon--sm`）。
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
3. **首屏“Molforte”跟着鼠标的效果** —— 没有对应的库或上游实现，是自己写的：
   指针在首屏里移动时，那个词朝指针方向平移，
   `位移 = 指向指针的单位向量 × 偏移上限 × min(1, 距离 / 参考半径)`；
   偏移上限按字号折算（`MAX_EM = 0.22`，86px 标题下约 19px），
   参考半径 `4.2em`，每帧插值所以是“被牵着走”而不是硬贴在指针上。
   原位那层**蓝色残影**是同一个词用 `::before` + `content: attr(data-ghost)` 画的、
   **不跟着动**，所以偏到哪里，原本被盖住的地方就露出多少蓝色；浓度跟着位移量走
   （没偏时为 0，免得字形抗锯齿边缘渗出一圈淡蓝，也免得静止时有任何变化）。
   实现见 `src/components/MagneticWord.jsx`。`src/site.js` 的 `magnetic` 决定是哪个词，
   留空即整段效果消失。
4. **主按钮文案上扫过的一束光** —— 使用 [React Bits](https://reactbits.dev/text-animations/shiny-text)
   的 `ShinyText`。上游的 JS 变体用 motion/react 逐帧算 `background-position`，
   本站没有（也不打算）引 motion，所以换成一条等价的 CSS keyframes 动画：
   120deg、`background-size: 200%`、位移 `150% → -50%`、周期 2.6s 都照上游数值。
   一处按本站情况适配：**高光用更深的蓝而不是白色**。主按钮现在是白底蓝字
   （描边式，见 `.hero-btn--primary`），白色高光扫过等于把字擦掉（字与底同色）；
   换成深一档的蓝之后，扫过时是蓝色变深，字全程读得见（#0071e3 对白底 4.70:1 达 AA）。
   见 `src/components/ShinyText.jsx` 与 `global.css` 的 `.shiny-text`。
5. **首屏那层点阵** —— 使用 [React Bits](https://reactbits.dev/) 的 `DotField`，
   源码在 `src/components/DotField.jsx` / `.css`。相对上游的改动只有一处，是性能上的：
   上游每帧无条件重画整块点阵（rAF 永远在跑），页面闲置时也一直 60fps 重绘；
   这里加了一条短路口——上一帧还有点没归位、或指针仍在参与（`eng > 0`）才重画，
   否则直接返回，画布保持原样。视觉与交互与上游一致。
   颜色按本站调过：上游默认那套紫渐变 + 深色光晕是给深底用的，
   这里换成中性灰（对角线由 0.4 淡到 0.18）。跟着指针的那圈**光晕关掉了**
   （`glowRadius={0}` + `glowColor="transparent"`）：推挤时只该看到点被撞开，
   不该额外糊一层蓝雾。深浅两个主题共用同一套灰（没有跟着主题切换，是有意的）。
   铺的范围是**首屏一屏**：`.home__dots` 高度写死 `100dvh`、下缘一层 mask 淡出，
   往下翻（Whoami、最近更新）就是白底——点阵是首屏的背景，不是整页的纹理。
   动画方式定下来是 `push`（`Home.jsx` 顶部的 `DOTS_MODE`）：指针快速划过时把点撞开、
   再自己弹回——这正是上游 `bulgeOnly: false` 的那一态，所以没有偏离上游。
   同族另外五种留在组件的 `mode` prop 里（`bulge` 顶开 / `attract` 吸向指针 /
   `vortex` 绕指针转 / `ripple` 按距离做行波 / `magnify` 近处点变大），
   还有上游的 `wave` / `sparkle` 两态；想换只改 `DOTS_MODE` 一个词。
   注意开了 `wave` / `sparkle` 之后点阵一直在动，上面那条「静止跳过重绘」就不生效了
   （组件里已按这两个 prop 做了判断）。
6. **首屏那排联系方式** —— 样式来源 [Uiverse.io by GigioBagigi0](https://uiverse.io/)
   的 `.card` / `.social-icons`：一排等距圆形图标，指针停在某一枚上时
   **它浮出名字气泡（带小三角）、其余几枚同时模糊并缩小**，视线被拉到指针那一枚。
   本站改了三处：气泡颜色换成站点的浮层配色（来样是固定蓝/红），
   模糊只在真的指向某一枚时发生（`.social-card:has(.social-card__item:hover)`——
   来样的 `:not(:hover)` 在指针落在卡片空白处时会把整排都糊掉），
   尺寸沿用主按钮那套（等宽等高、同样 `min-width: min(10rem, 40vw)`），两个并排才齐平。
   图标是内联 SVG（B 站那枚是描边画的圆角电视 + 天线 + 两只眼睛，和站内其他图标一套画法），
   各自用品牌色：B 站粉、GitHub 墨黑、邮箱主蓝。
   颜色按 UI 那条 3:1 卡过（芯片底 ≈ `#f4f4f4`）：B 站官方那支粉 `#FB7299` 只有 2.40:1，
   所以浅色下压深一档用 `#E8558A`（3.13:1，肉眼几乎还是那支粉）；
   深色底上官方粉有 5.44:1，直接用官方值，GitHub 则换成浅灰（黑的在深底上会消失）。
   内容在 `src/site.js` 的 `SITE.social`。

## 免责网络备注

本机 hosts（Steam++ 写入）把 `github.com` 等指向了 `127.0.0.1`，
从这台机器直接 `git push` 前需要先关闭 Steam++ 的对应开关。
