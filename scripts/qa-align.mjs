// 对齐验收：核对「边距 = 圆角半径」这条全局规则——量的是**字形墨迹**，不是行盒。
// 用法：node scripts/qa-align.mjs
//       QA_BASE=https://molforte.github.io/Molforte.pages node scripts/qa-align.mjs
//       QA_W=390 可换窄屏宽度
import { chromium } from 'playwright-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = process.env.QA_BASE || 'http://127.0.0.1:4173/Molforte.pages'
const W = Number(process.env.QA_W || 1280)
const R = 20 // --r-lg
const TOL = 2.5 // 允许误差（含 1px 边框与亚像素取整）

const MEASURE = `(sel, containerSel, mode) => {
  const ctx = document.createElement('canvas').getContext('2d')
  const el = document.querySelector(sel)
  const container = document.querySelector(containerSel)
  if (!el || !container) return null
  const cs = getComputedStyle(el)
  ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily
  const text = el.textContent.trim()
  const m = ctx.measureText(text)
  const fs = parseFloat(cs.fontSize)
  const lh = cs.lineHeight === 'normal' ? fs * 1.2 : parseFloat(cs.lineHeight)
  const b = el.getBoundingClientRect()
  const c = container.getBoundingClientRect()
  const baselineTop = (lh - fs) / 2 + m.fontBoundingBoxAscent
  const out = {
    text: text.slice(0, 10),
    left: +(b.left - m.actualBoundingBoxLeft - c.left).toFixed(2),
  }
  if (mode === 'bottom') {
    out.bottom = +(c.bottom - (b.top + baselineTop + m.actualBoundingBoxDescent)).toFixed(2)
  } else {
    out.top = +(b.top + baselineTop - m.actualBoundingBoxAscent - c.top).toFixed(2)
  }
  return out
}`

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--disable-gpu'],
})
const page = await browser.newPage({ viewport: { width: W, height: 1200 }, deviceScaleFactor: 1 })
const measure = (data) =>
  page.evaluate(
    new Function('rows', `const f = ${MEASURE}; return rows.map((r) => f(r[0], r[1], r[2]))`),
    data,
  )

const near = (v, target = R, tol = TOL) => Math.abs(v - target) <= tol

// ---- 归档页 ----
await page.goto(`${BASE}/archive`, { waitUntil: 'domcontentloaded', timeout: 90000 })
await page.waitForTimeout(1500)
const rows = await page.$$eval('.archive-row', (els) => els.length)
const [heroTitle, groupName, firstRow, lastRow] = await measure([
  ['.archive-hero__title', '.archive-hero'],
  ['.archive-group-card__name', '.archive-group-card'],
  ['.archive-row__title', '.archive-group-card'],
  ['.archive-row:last-child .archive-row__title', '.archive-group-card', 'bottom'],
])
const spread = await page.evaluate(() => {
  const ctx = document.createElement('canvas').getContext('2d')
  const leftOf = (el) => {
    const cs = getComputedStyle(el)
    ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily
    const m = ctx.measureText(el.textContent.trim())
    return el.getBoundingClientRect().left - m.actualBoundingBoxLeft
  }
  const titles = [...document.querySelectorAll('.archive-row__title')].map(leftOf)
  const dates = [...document.querySelectorAll('.archive-row__date')].map(leftOf)
  const span = (a) => +(Math.max(...a) - Math.min(...a)).toFixed(2)
  const card = document.querySelector('.archive-group-card').getBoundingClientRect().left
  return {
    titleSpread: span(titles),
    dateSpread: span(dates),
    titlesFromCard: +(Math.min(...titles) - card).toFixed(2),
    datesFromCard: +(Math.max(...dates) - card).toFixed(2),
  }
})

// ---- 首页卡片 ----
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 90000 })
await page.waitForTimeout(1200)
const [cardTitle] = await measure([['.post-card__title', '.post-card']])

const checks = {
  '归档 hero 标题墨迹左右一致': near(heroTitle.left, R, 3) && near(heroTitle.top),
  分组卡标题墨迹贴角: near(groupName.left, R, 1.5) && near(groupName.top),
  行标题与分组卡标题同线: near(rows ? firstRow.left : R, R, 1.5),
  各行标题左边界齐平: spread.titleSpread <= 0.5,
  各行日期成一列: spread.dateSpread <= 0.5,
  '末行文字到卡片下边 = 圆角': near(lastRow.bottom, R, 3),
  首页卡片标题墨迹贴角: near(cardTitle.left) && near(cardTitle.top),
}

const failed = Object.entries(checks).filter(([, ok]) => !ok)
console.log(
  JSON.stringify(
    {
      base: BASE,
      width: W,
      radius: R,
      rows,
      heroTitle,
      groupName,
      firstRow,
      lastRow,
      cardTitle,
      spread,
      checks,
    },
    null,
    2,
  ),
)
console.log(failed.length ? `FAIL: ${failed.map(([k]) => k).join(' | ')}` : 'PASS: 对齐验收通过')
await browser.close()
process.exit(failed.length ? 1 : 0)
