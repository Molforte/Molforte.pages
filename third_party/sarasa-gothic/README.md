# 第三方字体：Sarasa Gothic（更纱黑体）

- 上游仓库：<https://github.com/be5invis/Sarasa-Gothic>
- 作者：Renzhi Li（Belleve Invis），基于 Iosevka 与 Source Han Sans
- 许可：SIL Open Font License 1.1（见同目录 `LICENSE`）
- 本站用了哪一款：**Sarasa Mono SC Regular**（等距更纱黑体 · 简体中文 · Mono 变体，全宽破折号）

## 仓库里有什么 / 没有什么

- ✅ `LICENSE`：上游许可原文（再分发子集时必须保留）
- ✅ 子集产物：`src/assets/fonts/sarasa-mono-sc-subset.woff2`（**236 KB**）
- ❌ **没有**放进仓库的：官方完整 TTF / 7z（24 MB / 63 MB）。它们只在本地 `.fontsrc/`
  （已被 `.gitignore` 忽略），需要时用下面的命令重新拉。

## 重新生成子集（两步）

```bash
# 1) 下载 + 解压官方字体（多源兜底：清华镜像 / 南大镜像 / GitHub 代理）
node scripts/fetch-font-source.mjs

# 2) 只保留「站点实际用到的字符」，生成自托管 woff2
node scripts/build-font-subset.mjs ".fontsrc/ttf/SarasaMonoSC-Regular.ttf"
```

第 2 步的字符集 = ASCII / 拉丁补充 / 常用标点 / 箭头 / 制表符 / 方块与几何 / CJK 标点 /
全角 + `content/`、`src/` 里出现过的所有字符 + 可选的 `scripts/font-extra-chars.txt`。
新增文章后如果出现没覆盖的字，重跑第 2 步即可（缺字本来也会自动回落到系统等宽，不会坏版）。
