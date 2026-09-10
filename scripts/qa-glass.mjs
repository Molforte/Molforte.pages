// 验收：底栏使用的 React Bits <GlassSurface /> 是否正常工作。
// 用法：node scripts/qa-glass.mjs   （需先 build，并对本地 dist 服务器 4173 运行）
import { chromium } from 'playwright-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = process.env.QA_BASE || 'http://127.0.0.1:4173/Molforte.pages'

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--disable-gpu'],
})
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e).slice(0, 140)))
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)

const base = await page.evaluate(() => {
  const surfaces = [...document.querySelectorAll('.dock .glass-surface')]
  const info = surfaces.map((el) => {
    const cs = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return {
      svgMode: el.classList.contains('glass-surface--svg'),
      backdrop: cs.backdropFilter,
      size: [Math.round(r.width), Math.round(r.height)],
      radius: cs.borderRadius,
      overflow: cs.overflow,
      shadowLayers: cs.boxShadow.split('rgba').length - 1,
    }
  })
  return {
    surfaceCount: surfaces.length,
    surfaces: info,
    tabs: document.querySelectorAll('.apptabbar__tab').length,
    filterIds: [...document.querySelectorAll('.glass-surface filter')].map((f) => f.id),
    dispMaps: document.querySelectorAll('.glass-surface feDisplacementMap').length,
    hOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }
})

// 悬浮第一个标签：文字气泡应浮出岛外（不被 overflow 裁掉）
const tab = page.locator('.apptabbar__tab').first()
await tab.hover()
await page.waitForTimeout(300)
const tooltip = await page.evaluate(() => {
  const label = document.querySelector('.apptabbar__tab .apptabbar__label')
  const island = document.querySelector('.dock .glass-surface')
  const cs = getComputedStyle(label)
  const lr = label.getBoundingClientRect()
  const ir = island.getBoundingClientRect()
  return {
    visibility: cs.visibility,
    opacity: cs.opacity,
    aboveIsland: lr.top < ir.top, // 气泡在岛的上方 = 没有被裁切
    labelTop: Math.round(lr.top),
    islandTop: Math.round(ir.top),
  }
})

// 搜索圆岛：点击应打开浮层
await page.click('.search-island')
await page.waitForTimeout(350)
const search = await page.evaluate(() => ({
  opened: !!document.querySelector('.search-panel'),
  inputFocused: document.activeElement?.classList.contains('search-panel__input'),
}))
await page.keyboard.press('Escape')
await page.waitForTimeout(200)

// 深色下玻璃的 light-dark() 层应跟着变
const lightShadow = await page.evaluate(
  () => getComputedStyle(document.querySelector('.dock .glass-surface')).boxShadow.length,
)
await page.click('.theme-toggle')
await page.waitForTimeout(350)
const dark = await page.evaluate(() => {
  const el = document.querySelector('.dock .glass-surface')
  return {
    theme: document.documentElement.dataset.theme,
    colorScheme: getComputedStyle(document.documentElement).colorScheme,
    shadowLen: getComputedStyle(el).boxShadow.length,
    backdrop: getComputedStyle(el).backdropFilter.includes('glass-filter'),
  }
})

console.log(
  JSON.stringify(
    { base, tooltip, search, lightShadowLen: lightShadow, dark, pageErrors: errors },
    null,
    2,
  ),
)
await browser.close()
