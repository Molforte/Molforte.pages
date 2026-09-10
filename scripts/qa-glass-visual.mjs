// 玻璃是否真的在起作用：截图对比「backdrop-filter 开 / 关」的像素差异。
// 若两者几乎相同，说明 backdrop-filter 没生效（例如被祖先的 opacity/transform/filter 破坏）。
// 用法：node scripts/qa-glass-visual.mjs
import { chromium } from 'playwright-core'
import zlib from 'node:zlib'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = process.env.QA_BASE || 'http://127.0.0.1:4173/Molforte.pages'

// —— 极简 PNG 解码（8bit RGB/RGBA，处理 5 种 filter），够用来做像素对比 ——
function decodePNG(buf) {
  let pos = 8
  let width = 0
  let height = 0
  let colorType = 6
  const idat = []
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('ascii', pos + 4, pos + 8)
    const data = buf.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      width = data.readUInt32BE(0)
      height = data.readUInt32BE(4)
      colorType = data[9]
    } else if (type === 'IDAT') {
      idat.push(data)
    } else if (type === 'IEND') break
    pos += 12 + len
  }
  const raw = zlib.inflateSync(Buffer.concat(idat))
  const bpp = colorType === 6 ? 4 : 3
  const stride = width * bpp
  const out = Buffer.alloc(height * stride)
  let rp = 0
  for (let y = 0; y < height; y++) {
    const f = raw[rp++]
    const line = raw.subarray(rp, rp + stride)
    rp += stride
    const prevOff = (y - 1) * stride
    const curOff = y * stride
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[curOff + x - bpp] : 0
      const b = y > 0 ? out[prevOff + x] : 0
      const c = y > 0 && x >= bpp ? out[prevOff + x - bpp] : 0
      let v = line[x]
      if (f === 1) v += a
      else if (f === 2) v += b
      else if (f === 3) v += (a + b) >> 1
      else if (f === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      out[curOff + x] = v & 0xff
    }
  }
  return { width, height, bpp, data: out }
}

const meanAbsDiff = (A, B) => {
  const n = Math.min(A.data.length, B.data.length)
  let sum = 0
  let max = 0
  for (let i = 0; i < n; i++) {
    if (A.bpp === 4 && i % 4 === 3) continue // 跳过 alpha
    const d = Math.abs(A.data[i] - B.data[i])
    sum += d
    if (d > max) max = d
  }
  return { mean: +(sum / n).toFixed(2), max }
}

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--disable-gpu'],
})
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

// 在玻璃后方放一块高对比条纹背景，玻璃生效时边缘会折射/位移
await page.addStyleTag({
  content: `
    body::after {
      content: ''; position: fixed; inset: 0; z-index: 0; pointer-events: none;
      background: repeating-linear-gradient(90deg, #000 0 12px, #fff 12px 24px);
      opacity: 0.9;
    }
  `,
})

const glassBox = await page.locator('.dock').boundingBox()
const controlBox = await page.locator('.archive-hero, .masthead').first().boundingBox()
const clip = (b) => ({
  x: Math.round(b.x),
  y: Math.round(b.y),
  width: Math.round(b.width),
  height: Math.round(b.height),
})

const shot = async (box) => decodePNG(await page.screenshot({ clip: clip(box) }))

const glassOn = await shot(glassBox)
const controlOn = await shot(controlBox)

// 关掉 backdrop-filter 再截一次
await page.addStyleTag({ content: `.dock .glass-surface { backdrop-filter: none !important; }` })
await page.waitForTimeout(400)
const glassOff = await shot(glassBox)
const controlOff = await shot(controlBox)

const glassDiff = meanAbsDiff(glassOn, glassOff)
const controlDiff = meanAbsDiff(controlOn, controlOff)

const ancestors = await page.evaluate(() => {
  const info = (el, name) => {
    if (!el) return null
    const cs = getComputedStyle(el)
    return {
      name,
      opacity: cs.opacity,
      transform: cs.transform,
      translate: cs.translate,
      filter: cs.filter,
      animationName: cs.animationName,
      willChange: cs.willChange,
    }
  }
  const dock = document.querySelector('.dock')
  return [
    info(document.body, 'body'),
    info(dock, '.dock'),
    info(document.querySelector('.dock .glass-surface'), '.glass-surface'),
  ]
})

console.log(
  JSON.stringify(
    {
      glassDiff,
      controlDiff,
      verdict:
        glassDiff.mean > 1 ? '玻璃在起作用 ✓' : '玻璃没起作用 ✗（backdrop-filter 被破坏或未生效）',
      ancestors,
    },
    null,
    2,
  ),
)
await browser.close()
