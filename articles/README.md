# molforte.Articles

这个仓库放**已公开**的文章内容，站点（[Molforte.pages](https://github.com/Molforte/Molforte.pages)）
构建时读取它。仓库里只有 Markdown 与图片，没有代码。

## 三个文件夹

| 文件夹 | 放什么 | 站点上长什么样 |
| --- | --- | --- |
| `Projects/` | **一册一个目录**（教程序列 / 主题笔记集）：笔记 + `index.md` + `img/` | 归档页的一个**栏目** → 栏目首页（`index.md` + 按编号排的笔记列表）→ 单篇笔记 |
| `Articles/` | 独立文章，一篇一个 `.md` | 首页与归档的**文章**（按日期倒序） |
| `Fragments/` | 残页 / 零散片段，一篇一个 `.md` | 归档的**碎片**列表 → 单篇 |

## 命名与 frontmatter

```yaml
---
title: 电阻器            # 不写就用文件名
date: 2025-03-17         # 不写用文件修改时间；Articles/Fragments 必须有日期才会进列表
tags: [电子元器件, 基础]  # 可选
summary: 一句话摘要       # 可选，不写就取正文第一段
---
```

- **一册内部**（`Projects/<册>/`）：
  - `index.md` 是册首页（放 README / 目录性质的内容，`title`/`series`/`project` 写在这里）；
  - 笔记的**顺序**由文件名决定，两种编号都认：`01-标题.md`、`0a-标题.md`、`第一章-标题.md`、`第9章-标题.md`。
    编号只用于排序与角标，页面上标题不带编号；
  - 图片放在该册的 `img/` 里，正文用 `![[图片名.png]]` 引用（同步器会转成站内路径）。
- **`Articles/` / `Fragments/`**：文件名建议 `YYYY-MM-DD-slug.md`（slug 用英文，决定 URL）。

## 和 vault 的关系

内容来自私有 Obsidian vault，用站点仓库里的 `scripts/sync-obsidian.mjs` 做**单向**转换：

```bash
# 在 Molforte.pages 里
node scripts/sync-obsidian.mjs            # dry-run：只出报告与预览
node scripts/sync-obsidian.mjs --write    # 写入 articles/Projects/<册>/
```

白名单（哪些册可以公开）在站点仓库的 `scripts/obsidian.config.mjs`（已 gitignore）。
**vault 是唯一事实来源**：想改文章请改 vault 再同步，不要直接改这里的转换产物。

## 许可

文字版权归作者所有；引用请注明出处。
