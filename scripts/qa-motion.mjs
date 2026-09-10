// 动效验收：入场/错峰/滚动进入/状态微交互，以及 reduced-motion 行为。
// 用法：node scripts/qa-motion.mjs
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
await page.goto(BASE + '/', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)

const home = await page.evaluate(() => {
  const cs = (el, p) => (el ? getComputedStyle(el)[p] : null)
  const cards = [...document.querySelectorAll('.post-card')]
  return {
    pageEnter: cs(document.querySelector('.page-enter'), 'animationName'),
    cardAnim: cs(cards[0], 'animationName'),
    cardDelays: cards.map((c) => cs(c, 'animationDelay')),
    cardOpacity: cards.map((c) => cs(c, 'opacity')),
    dockAnim: cs(document.querySelector('.dock'), 'animationName'),
    activeIconAnim: cs(
      document.querySelector('.apptabbar__tab.is-active .apptabbar__icon-wrap'),
      'animationName',
    ),
    footerIsReveal: document.querySelector('.site-footer')?.classList.contains('reveal'),
    hOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }
})

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
await page.waitForTimeout(900)
const footerAfterScroll = await page.evaluate(() => {
  const f = document.querySelector('.site-footer')
  return { visible: f?.classList.contains('is-visible'), opacity: getComputedStyle(f).opacity }
})

await page.evaluate(() => window.scrollTo(0, 0))
await page.locator('.post-card').first().hover()
await page.waitForTimeout(300)
const hover = await page.evaluate(() => {
  const el = document.querySelector('.post-card:hover')
  return { transform: el ? getComputedStyle(el).transform : null }
})

await page.click('.search-island')
await page.waitForTimeout(120)
await page.fill('.search-panel__input', '顶栏')
await page.waitForTimeout(160)
const search = await page.evaluate(() => ({
  panelAnim: getComputedStyle(document.querySelector('.search-panel')).animationName,
  itemAnim: getComputedStyle(document.querySelector('.search-panel__item')).animationName,
}))
await page.keyboard.press('Escape')
await page.waitForTimeout(200)

await page.click('.theme-toggle')
await page.waitForTimeout(120)
const themeIcon = await page.evaluate(() => ({
  theme: document.documentElement.dataset.theme,
  iconAnim: getComputedStyle(document.querySelector('.theme-toggle__icon')).animationName,
}))

const arch = await browser.newPage({ viewport: { width: 1366, height: 900 } })
await arch.goto(BASE + '/archive', { waitUntil: 'networkidle' })
await arch.waitForTimeout(900)
const archive = await arch.evaluate(() => {
  const card = document.querySelector('.archive-group-card')
  return {
    isReveal: card?.classList.contains('reveal'),
    visible: card?.classList.contains('is-visible'),
  }
})

const ctx = await browser.newContext({
  viewport: { width: 1366, height: 900 },
  reducedMotion: 'reduce',
})
const rm = await ctx.newPage()
await rm.goto(BASE + '/', { waitUntil: 'networkidle' })
await rm.waitForTimeout(500)
const reduce = await rm.evaluate(() => {
  const cs = (el, p) => (el ? getComputedStyle(el)[p] : null)
  return {
    cardOpacity: cs(document.querySelector('.post-card'), 'opacity'),
    cardAnimDuration: cs(document.querySelector('.post-card'), 'animationDuration'),
    footerOpacity: cs(document.querySelector('.site-footer'), 'opacity'),
    footerTranslate: cs(document.querySelector('.site-footer'), 'translate'),
  }
})

console.log(
  JSON.stringify(
    { home, footerAfterScroll, hover, search, themeIcon, archive, reduce, pageErrors: errors },
    null,
    2,
  ),
)
await browser.close()
