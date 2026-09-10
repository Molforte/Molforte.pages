// 线上验收：直接对 GitHub Pages 上的真实站点跑一遍关键交互。
// 用法：node scripts/qa-live.mjs
import { chromium } from 'playwright-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const SITE = 'https://molforte.github.io/Molforte.pages'

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--disable-gpu'],
})
const out = {}

// —— 首页 ——
const p = await browser.newPage({ viewport: { width: 1366, height: 900 } })
const errs = []
p.on('pageerror', (e) => errs.push(String(e).slice(0, 140)))
await p.goto(`${SITE}/`, { waitUntil: 'networkidle' })
await p.waitForTimeout(600)
out.home = await p.evaluate(() => ({
  title: document.title,
  h1: document.querySelector('.masthead__title')?.textContent?.trim(),
  cards: document.querySelectorAll('.post-card').length,
  dock: !!document.querySelector('.dock'),
  liquidGlass: (document.querySelector('.apptabbar')?.style.backdropFilter || '').includes(
    'liquid-glass',
  ),
  theme: document.documentElement.dataset.theme,
  hOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
}))
out.homeErrors = errs

// —— 深链（直接打开文章地址 = 走 404 回退）——
const p2 = await browser.newPage({ viewport: { width: 1366, height: 900 } })
const errs2 = []
p2.on('pageerror', (e) => errs2.push(String(e).slice(0, 140)))
const resp = await p2.goto(`${SITE}/post/how-this-site-is-built`, { waitUntil: 'networkidle' })
await p2.waitForTimeout(400)
out.deepLink = {
  httpStatus: resp?.status(),
  ...(await p2.evaluate(() => ({
    postTitle: document.querySelector('.post__title')?.textContent?.trim(),
    codeBlocks: document.querySelectorAll('.post-body pre').length,
    pager: !!document.querySelector('.post__pager'),
  }))),
}
out.deepLinkErrors = errs2

// —— 搜索浮层 ——
await p.click('.search-island')
await p.waitForTimeout(300)
await p.fill('.search-panel__input', '顶栏')
await p.waitForTimeout(250)
out.search = await p.evaluate(() => ({
  open: !!document.querySelector('.search-panel'),
  hits: document.querySelectorAll('.search-panel__item').length,
}))
await p.keyboard.press('Escape')
await p.waitForTimeout(200)
out.search.closedByEsc = await p.evaluate(() => !document.querySelector('.search-panel'))

// —— 差值混合光标（悬停「札记」）——
const box = await p.locator('.masthead__title').boundingBox()
await p.mouse.move(box.x + box.width / 2 - 120, box.y + box.height / 2)
await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
await p.waitForTimeout(700)
out.cursor = await p.evaluate(() => {
  const c = document.querySelector('.cursor-canvas')
  if (!c) return { canvas: false }
  const ctx = c.getContext('2d')
  const d = ctx.getImageData(0, 0, c.width, c.height).data
  let painted = 0
  for (let i = 3; i < d.length; i += 4) if (d[i] > 8) painted++
  return { canvas: true, mixBlend: getComputedStyle(c).mixBlendMode, painted }
})

// —— 深色模式 ——
await p.click('.theme-toggle')
await p.waitForTimeout(300)
out.themeToggle = await p.evaluate(() => ({
  theme: document.documentElement.dataset.theme,
  bodyBg: getComputedStyle(document.body).backgroundColor,
  stillGlass: (document.querySelector('.apptabbar')?.style.backdropFilter || '').includes(
    'liquid-glass',
  ),
}))

// —— 404 ——
const p3 = await browser.newPage({ viewport: { width: 1366, height: 900 } })
await p3.goto(`${SITE}/post/does-not-exist`, { waitUntil: 'networkidle' })
await p3.waitForTimeout(300)
out.notFound = await p3.evaluate(() => ({
  code: document.querySelector('.notfound__code')?.textContent,
  back: document.querySelector('.notfound__back')?.textContent?.trim(),
}))

console.log(JSON.stringify(out, null, 2))
await browser.close()
