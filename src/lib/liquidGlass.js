// 液态玻璃底栏折射 —— 适配自 shuding/liquid-glass（MIT，© 2025 Shu Ding）
// 上游：https://github.com/shuding/liquid-glass
// 原件与改动说明见 third_party/liquid-glass/。
//
// 机制与上游完全一致：canvas 生成位移贴图 → SVG feImage + feDisplacementMap →
// backdrop-filter: url(#filter) blur() contrast() brightness() saturate()。
// 唯一改动：SDF 由归一化坐标换算到「短边 = 1」的各向同性单位，
// 这样宽扁的胶囊岛与圆岛都能得到沿边缘等宽的折射带（上游常量是为 300×200 调的）。

// ---------- 以下四个函数照搬上游源码 ----------
function smoothStep(a, b, t) {
  t = Math.max(0, Math.min(1, (t - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function length(x, y) {
  return Math.sqrt(x * x + y * y)
}

function roundedRectSDF(x, y, width, height, radius) {
  const qx = Math.abs(x) - width + radius
  const qy = Math.abs(y) - height + radius
  return Math.min(Math.max(qx, qy), 0) + length(Math.max(qx, 0), Math.max(qy, 0)) - radius
}

function texture(x, y) {
  return { type: 't', x, y }
}

const SVG_NS = 'http://www.w3.org/2000/svg'
const XLINK_NS = 'http://www.w3.org/1999/xlink'

let seq = 0
const uid = () => `liquid-glass-${(++seq).toString(36)}${Math.random().toString(36).slice(2, 6)}`

/** 浏览器是否支持带 SVG 滤镜的 backdrop-filter */
function supported() {
  return typeof CSS !== 'undefined' && !!CSS.supports && CSS.supports('backdrop-filter', 'url(#x)')
}

/**
 * 给元素挂上液态玻璃折射效果，返回销毁函数。
 * @param {HTMLElement} el 目标元素（读取实际尺寸与 border-radius）
 * @param {{ insetRatio?: number, minScale?: number }} [options]
 *   insetRatio：边缘折射带宽度（相对短边），minScale：边缘最弱处的采样缩放
 */
export function attachLiquidGlass(el, options = {}) {
  if (!el || !supported()) return () => {}
  const insetRatio = options.insetRatio ?? 0.18
  const minScale = options.minScale ?? 0.62

  const id = uid()

  // ---- SVG 滤镜（与上游同构） ----
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('width', '0')
  svg.setAttribute('height', '0')
  svg.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none'

  const defs = document.createElementNS(SVG_NS, 'defs')
  const filter = document.createElementNS(SVG_NS, 'filter')
  filter.setAttribute('id', id)
  filter.setAttribute('filterUnits', 'userSpaceOnUse')
  filter.setAttribute('colorInterpolationFilters', 'sRGB')
  filter.setAttribute('x', '0')
  filter.setAttribute('y', '0')

  const feImage = document.createElementNS(SVG_NS, 'feImage')
  feImage.setAttribute('id', `${id}_map`)

  const feDisplacementMap = document.createElementNS(SVG_NS, 'feDisplacementMap')
  feDisplacementMap.setAttribute('in', 'SourceGraphic')
  feDisplacementMap.setAttribute('in2', `${id}_map`)
  feDisplacementMap.setAttribute('xChannelSelector', 'R')
  feDisplacementMap.setAttribute('yChannelSelector', 'G')

  filter.appendChild(feImage)
  filter.appendChild(feDisplacementMap)
  defs.appendChild(filter)
  svg.appendChild(defs)

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  document.body.appendChild(svg)

  let frame = 0
  let lastKey = ''

  const render = () => {
    const rect = el.getBoundingClientRect()
    const w = Math.max(1, Math.round(rect.width))
    const h = Math.max(1, Math.round(rect.height))
    if (w < 2 || h < 2) return

    const cssRadius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || h / 2
    const radius = Math.min(Math.max(cssRadius, 0), Math.min(w, h) / 2)

    const key = `${w}x${h}x${radius}`
    if (key === lastKey) return
    lastKey = key

    filter.setAttribute('width', String(w))
    filter.setAttribute('height', String(h))
    svg.setAttribute('width', String(w))
    svg.setAttribute('height', String(h))
    feImage.setAttribute('width', String(w))
    feImage.setAttribute('height', String(h))
    canvas.width = w
    canvas.height = h

    const s = Math.min(w, h) // 各向同性单位：短边 = 1
    const inset = Math.max(2, s * insetRatio)
    const hx = Math.max((w / 2 - inset) / s, 0)
    const hy = Math.max((h / 2 - inset) / s, 0)
    const rad = Math.max((radius - inset) / s, 0)
    const band = Math.max(inset / s, 1e-6)

    const count = w * h
    const data = new Uint8ClampedArray(count * 4)
    const raw = new Float32Array(count * 2)
    let maxScale = 0
    let k = 0

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const fx = (x + 0.5 - w / 2) / s
        const fy = (y + 0.5 - h / 2) / s
        const d = roundedRectSDF(fx, fy, hx, hy, rad)
        // 体内（d<0）不折射，越靠近边缘折射越强
        const t = Math.max(0, Math.min(1, d / band))
        const scaled = 1 - (1 - minScale) * smoothStep(0, 1, t)
        const uvx = 0.5 + ((x + 0.5) / w - 0.5) * scaled
        const uvy = 0.5 + ((y + 0.5) / h - 0.5) * scaled
        const dx = uvx * w - (x + 0.5)
        const dy = uvy * h - (y + 0.5)
        maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy))
        raw[k++] = dx
        raw[k++] = dy
      }
    }

    maxScale = Math.max(maxScale * 0.5, 1e-6)

    let i = 0
    let j = 0
    for (; i < data.length; i += 4) {
      data[i] = (raw[j++] / maxScale + 0.5) * 255
      data[i + 1] = (raw[j++] / maxScale + 0.5) * 255
      data[i + 2] = 0
      data[i + 3] = 255
    }

    context.putImageData(new ImageData(data, w, h), 0, 0)
    feImage.setAttributeNS(XLINK_NS, 'href', canvas.toDataURL())
    feDisplacementMap.setAttribute('scale', String(maxScale))
  }

  const schedule = () => {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      render()
    })
  }

  // 应用上游同款 backdrop-filter 组合（内联覆盖 CSS 里的磨砂）
  const previous = {
    backdrop: el.style.backdropFilter,
    webkit: el.style.webkitBackdropFilter,
  }
  const GLASS = `url(#${id}) blur(0.25px) contrast(1.2) brightness(1.05) saturate(1.1)`
  el.style.backdropFilter = GLASS
  el.style.webkitBackdropFilter = GLASS

  render()

  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null
  ro?.observe(el)
  window.addEventListener('resize', schedule)

  return () => {
    cancelAnimationFrame(frame)
    ro?.disconnect()
    window.removeEventListener('resize', schedule)
    el.style.backdropFilter = previous.backdrop
    el.style.webkitBackdropFilter = previous.webkit
    svg.remove()
  }
}

// 保留 texture 供将来扩展（上游 fragment 的返回类型）
export { texture }
