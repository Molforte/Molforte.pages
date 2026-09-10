// 对齐验收：核对「边距 = 圆角半径」这条全局规则——量的是**字形墨迹**，不是行盒。
// 覆盖当前真实的四个面：归档 hero、栏目卡、册内笔记列表、首页（栏目卡 + 文章卡，有才查）。
// 用法：node scripts/qa-align.mjs
//       QA_BASE=https://molforte.github.io/Molforte.pages node scripts/qa-align.mjs
//       QA_W=390 可换窄屏宽度
import { chromium } from 'playwright-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = process.env.QA_BASE || 'http://127.0.0.1:4173/Molforte.pages'
const W = Number(process.env.QA_W || 1280)
const R = 20 // --r-lg
const TOL = 2.5 // 允许误差（含 1px 边框与亚像素取整）

const MEASURE = `(sel, containerSel) => {
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
  return {
    text: text.slice(0, 10),
    left: +(b.left - m.actualBoundingBoxLeft - c.left).toFixed(2),
    top: +(b.top + baselineTop - m.actualBoundingBoxAscent - c.top).toFixed(2),
  }
}`

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--disable-gpu'],
})
const page = await browser.newPage({ viewport: { width: W, height: 1200 }, deviceScaleFactor: 1 })
const measure = (data) =>
  page.evaluate(
    new Function('rows', `const f = ${MEASURE}; return rows.map((r) => f(r[0], r[1]))`),
    data,
  )
const near = (v, target = R, tol = TOL) => Math.abs(v - target) <= tol

// ---- 归档页：hero 标题 + 栏目卡 ----
await page.goto(`${BASE}/archive`, { waitUntil: 'domcontentloaded', timeout: 90000 })
await page.waitForTimeout(1500)
const [heroTitle, columnSeries] = await measure([
  ['.archive-hero__title', '.archive-hero'],
  ['.column-card__series', '.column-card'],
])
const column = await page.evaluate(() => {
  const el = document.querySelector('.column-card')
  if (!el) return null
  const b = (n) => n.getBoundingClientRect()
  const excerpt = el.querySelector('.column-card__excerpt')
  const foot = el.querySelector('.column-card__foot')
  return {
    excerptLines: +(b(excerpt).height / parseFloat(getComputedStyle(excerpt).lineHeight)).toFixed(
      2,
    ),
    footFromBottom: +(b(el).bottom - b(foot).bottom).toFixed(2),
    overflow: el.scrollHeight - el.clientHeight,
  }
})

// ---- 册页：笔记列表（窄屏会折行，首行取最上/最左、末行取最深）----
const volHref = await page
  .$eval('.column-card__link', (a) => a.getAttribute('href'))
  .catch(() => null)
let volume = null
let volumeTitle = null
if (volHref) {
  await page.goto(new URL(volHref, BASE).href, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForTimeout(1200)
  // 先滚到底让 Reveal 全部播完（未播完的元素带 translate，会污染墨迹测量），再回顶部
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(1400)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(400)
  volume = await page.evaluate(() => {
    const card = document.querySelector('.note-list')
    if (!card) return null
    const ctx = document.createElement('canvas').getContext('2d')
    const ink = (el) => {
      const cs = getComputedStyle(el)
      ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily
      const m = ctx.measureText(el.textContent.trim())
      const fs = parseFloat(cs.fontSize)
      const lh = cs.lineHeight === 'normal' ? fs * 1.2 : parseFloat(cs.lineHeight)
      const b = el.getBoundingClientRect()
      const baseline = b.top + (lh - fs) / 2 + m.fontBoundingBoxAscent
      return {
        left: b.left - m.actualBoundingBoxLeft,
        top: baseline - m.actualBoundingBoxAscent,
        bottom: baseline + m.actualBoundingBoxDescent,
      }
    }
    const items = (row) => [
      ...row.querySelectorAll('.note-row__order, .note-row__title, .note-row__date'),
    ]
    const rows = [...document.querySelectorAll('.note-row')]
    const cb = card.getBoundingClientRect()
    const first = items(rows[0]).map(ink)
    const last = items(rows.at(-1)).map(ink)
    const spread = (arr) => +(Math.max(...arr) - Math.min(...arr)).toFixed(2)
    const orders = rows.map((r) => ink(r.querySelector('.note-row__order')).left)
    // 标题首字不同（L / D / 准…）墨迹左边界天然差一点点，这条规则量的是盒子左边界
    const titles = rows.map((r) => r.querySelector('.note-row__title').getBoundingClientRect().left)
    const dateRights = rows.map(
      (r) => r.querySelector('.note-row__date').getBoundingClientRect().right,
    )
    return {
      rows: rows.length,
      orderSpread: spread(orders),
      titleSpread: spread(titles),
      dateSpread: spread(dateRights),
      firstLeft: +(Math.min(...first.map((i) => i.left)) - cb.left).toFixed(2),
      firstTop: +(Math.min(...first.map((i) => i.top)) - cb.top).toFixed(2),
      lastInkFromBottom: +(cb.bottom - Math.max(...last.map((i) => i.bottom))).toFixed(2),
    }
  })
  volumeTitle = await page.$eval('.volume__title', (el) => el.textContent.trim()).catch(() => null)
}

// ---- 首页：文章卡（有才查；样例文章删掉后首页是栏目卡）----
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 90000 })
await page.waitForTimeout(1200)
const [cardTitle] = await measure([['.post-card__title', '.post-card']])
const card = await page.evaluate(() => {
  const el = document.querySelector('.post-card')
  if (!el) return null
  const sum = el.querySelector('.post-card__summary')
  const meta = el.querySelector('.post-card__meta')
  const b = (n) => n.getBoundingClientRect()
  return {
    summaryLines: +(b(sum).height / parseFloat(getComputedStyle(sum).lineHeight)).toFixed(2),
    metaFromBottom: +(b(el).bottom - b(meta).bottom).toFixed(2),
    overflow: el.scrollHeight - el.clientHeight,
  }
})
const [homeSeries] = await measure([['.column-card__series', '.column-card']])

const checks = {
  '归档 hero 标题墨迹贴角': near(heroTitle.left, R, 3) && near(heroTitle.top),
  栏目卡第一行墨迹贴角: columnSeries ? near(columnSeries.left) && near(columnSeries.top) : false,
  栏目卡摘要整数行: column
    ? Math.abs(column.excerptLines - Math.round(column.excerptLines)) < 0.02
    : false,
  栏目卡不溢出: column ? column.overflow <= 0 : false,
  册内笔记标题左边界齐平: volume ? volume.titleSpread <= 0.5 : false,
  册内角标左边界齐平: volume ? volume.orderSpread <= 0.5 : false,
  // 同一行里角标/标题/日期共基线，墨迹顶天然差 ~4px（角标 20.4、标题 16.3），故放宽到 ±5
  册内首行墨迹贴角: volume ? near(volume.firstLeft) && near(volume.firstTop, R, 5) : false,
  册内日期成一列: volume ? volume.dateSpread <= 0.5 : false,
  '册内末行到卡片下边 = 圆角': volume ? near(volume.lastInkFromBottom, R, 3) : false,
  首页栏目卡第一行墨迹贴角: homeSeries ? near(homeSeries.left) && near(homeSeries.top) : false,
  // 下面几条只在首页仍有文章卡时校验（样例文章已移除，允许为空）
  ...(card
    ? {
        文章卡标题墨迹贴角: near(cardTitle.left) && near(cardTitle.top),
        '文章卡摘要正好 3 行': Math.abs(card.summaryLines - 3) < 0.02,
        文章卡不溢出: card.overflow <= 0,
        文章卡元信息贴卡片底: near(card.metaFromBottom, R, 3),
      }
    : {}),
}

const failed = Object.entries(checks).filter(([, ok]) => !ok)
console.log(
  JSON.stringify(
    {
      base: BASE,
      width: W,
      radius: R,
      heroTitle,
      columnSeries,
      column,
      volume,
      volumeTitle,
      cardTitle,
      card,
      homeSeries,
      checks,
    },
    null,
    2,
  ),
)
console.log(failed.length ? `FAIL: ${failed.map(([k]) => k).join(' | ')}` : 'PASS: 对齐验收通过')
await browser.close()
process.exit(failed.length ? 1 : 0)
