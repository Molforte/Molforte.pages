# 第三方：shuding/liquid-glass（液态玻璃）

- 上游仓库：https://github.com/shuding/liquid-glass
- 作者：Shu Ding（© 2025）
- 许可：MIT（见同目录 `LICENSE`）
- 取用方式：本机无法直连 GitHub（hosts 把 github.com 指向 127.0.0.1），
  通过 jsDelivr 拿到 `@main` 的原件：
  `https://cdn.jsdelivr.net/gh/shuding/liquid-glass@main/liquid-glass.js`

## 这里的文件

- `liquid-glass.js`：上游原文件，**未做任何修改**，仅作存档与对照。
- `LICENSE`：上游 MIT 许可证原文。

## 我们怎么用的

上游是一个「贴进浏览器控制台就能跑」的 demo：它自己造一个可拖拽的 300×200
圆角方块，用 `roundedRectSDF` 生成位移贴图（canvas），塞进 SVG 的
`feImage` + `feDisplacementMap`，再用
`backdrop-filter: url(#filter) blur(...) contrast(...)` 让背景产生折射。

我们的底栏是**很宽很扁的胶囊**（约 1054×67）和**圆岛**（约 67×67），
而上游的 SDF 常量（0.3 / 0.2 / 0.6）是在 300×200 这种接近方形的容器上调的，
直接套到宽扁胶囊上会严重各向异性（左右两端几乎不折射）。

所以 `src/lib/liquidGlass.js` 复用了它的**同一套机制**：
- `smoothStep` / `length` / `roundedRectSDF` / `texture` 四个函数原样照搬；
- 同样的 SVG 滤镜管线（feImage + feDisplacementMap、sRGB、R/G 通道、canvas 位移图、
  按 maxScale 归一化、`feDisplacementMap.scale`）；
- 同样的 `backdrop-filter: url(#id) blur(0.25px) contrast(1.2) brightness(1.05) saturate(1.1)`。

区别只有一处：**把 SDF 从归一化坐标换算到“短边 = 1”的各向同性单位**，
并按元素实际尺寸做固定像素的内缩，这样宽扁胶囊和圆岛都能得到沿边缘等宽的折射带。
折射带宽度与折射强度是两个可调常量（`insetRatio` / `minScale`）。

上游 demo 自带的鼠标、拖拽交互我们没有需要（底栏是导航，不是可拖动的玻璃块），
故未引入。
