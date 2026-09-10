import { chromium } from 'playwright-core'
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = 'http://127.0.0.1:4173/Molforte.pages'
const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--disable-gpu'],
})

const measure = async (page) => {
  return page.evaluate(() => {
    const canvas = document.querySelector('.cursor-canvas')
    if (!canvas) return { canvas: false }
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = canvas.width
    const h = canvas.height
    const data = ctx.getImageData(0, 0, w, h).data
    let minX = 1e9
    let minY = 1e9
    let maxX = -1
    let maxY = -1
    let painted = 0
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 8) {
          painted++
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }
    return {
      canvas: true,
      mixBlend: getComputedStyle(canvas).mixBlendMode,
      paintedPixels: painted,
      radiusCssPx: painted ? Math.round((maxX - minX) / 2 / dpr) : 0,
    }
  })
}

// 1) 正常悬停
const p = await browser.newPage({ viewport: { width: 1366, height: 900 } })
await p.goto(BASE + '/', { waitUntil: 'networkidle' })
const box = await p.locator('.masthead__title').boundingBox()
const cx = box.x + box.width / 2
const cy = box.y + box.height / 2

await p.mouse.move(cx - 160, cy) // 进入区域但不在字上
await p.mouse.move(cx - 140, cy)
await p.waitForTimeout(150)
await p.mouse.move(cx, cy) // 移到“札记”字样上
await p.waitForTimeout(700)
const overText = await measure(p)

await p.mouse.move(cx - 400, cy) // 移到区域外（仍在页面内）
await p.waitForTimeout(700)
const away = await measure(p)

console.log(JSON.stringify({ overText, away }, null, 2))

// 2) reduced motion 不应挂载 canvas
const ctx2 = await browser.newContext({
  viewport: { width: 1366, height: 900 },
  reducedMotion: 'reduce',
})
const p2 = await ctx2.newPage()
await p2.goto(BASE + '/', { waitUntil: 'networkidle' })
const b2 = await p2.locator('.masthead__title').boundingBox()
await p2.mouse.move(b2.x + b2.width / 2, b2.y + b2.height / 2)
await p2.mouse.move(b2.x + b2.width / 2 + 6, b2.y + b2.height / 2)
await p2.waitForTimeout(400)
const reduced = await p2.evaluate(() => !!document.querySelector('.cursor-canvas'))
console.log('reduced-motion 下 canvas 是否挂载:', reduced)

await browser.close()
