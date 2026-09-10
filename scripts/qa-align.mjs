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
const [heroTitle, groupName, firstRow] = await measure([
  ['.archive-hero__title', '.archive-hero'],
  ['.archive-group-card__name', '.archive-group-card'],
  ['.archive-row__title', '.archive-group-card'],
])
// 末行取「最深的那一条文字」到卡片下边的距离（窄屏行会折成两行，标题不再是最低的）
const lastRow = await page.evaluate(() => {
  const ctx = document.createElement('canvas').getContext('2d')
  const card = document.querySelector('.archive-group-card').getBoundingClientRect()
  const row = document.querySelector('.archive-row:last-child')
  const parts = [
    ...row.querySelectorAll('.archive-row__title, .archive-row__date, .archive-row__read'),
  ]
  const inkBottom = (el) => {
    const cs = getComputedStyle(el)
    ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily
    const m = ctx.measureText(el.textContent.trim())
    const fs = parseFloat(cs.fontSize)
    const lh = cs.lineHeight === 'normal' ? fs * 1.2 : parseFloat(cs.lineHeight)
    const b = el.getBoundingClientRect()
    return b.top + (lh - fs) / 2 + m.fontBoundingBoxAscent + m.actualBoundingBoxDescent
  }
  return { text: '最深文字', bottom: +(card.bottom - Math.max(...parts.map(inkBottom))).toFixed(2) }
})
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
// 卡片几何：摘要必须正好 3 行且卡片不溢出（overflow 会被切出半行 / 裁掉元信息）
const card = await page.evaluate(() => {
  const el = document.querySelector('.post-card')
  const sum = el.querySelector('.post-card__summary')
  const meta = el.querySelector('.post-card__meta')
  const b = (n) => n.getBoundingClientRect()
  return {
    cardH: +b(el).height.toFixed(2),
    summaryLines: +(b(sum).height / parseFloat(getComputedStyle(sum).lineHeight)).toFixed(2),
    metaFromBottom: +(b(el).bottom - b(meta).bottom).toFixed(2),
    gapSummaryToMeta: +(b(meta).top - b(sum).bottom).toFixed(2),
    overflow: el.scrollHeight - el.clientHeight,
  }
})

// ---- 归档：栏目卡（第一行是系列/篇数那行）----
await page.goto(`${BASE}/archive`, { waitUntil: 'domcontentloaded', timeout: 90000 })
await page.waitForTimeout(1500)
const [columnSeries] = await measure([['.column-card__series', '.column-card']])
const column = await page.evaluate(() => {
  const el = document.querySelector('.column-card')
  if (!el) return null
  const b = (n) => n.getBoundingClientRect()
  const excerpt = el.querySelector('.column-card__excerpt')
  const foot = el.querySelector('.column-card__foot')
  return {
    h: +b(el).height.toFixed(2),
    excerptLines: +(b(excerpt).height / parseFloat(getComputedStyle(excerpt).lineHeight)).toFixed(
      2,
    ),
    footFromBottom: +(b(el).bottom - b(foot).bottom).toFixed(2),
    overflow: el.scrollHeight - el.clientHeight,
  }
})

// ---- 册页：笔记列表 ----
const volHref = await page
  .$eval('.column-card__link', (a) => a.getAttribute('href'))
  .catch(() => null)
let volume = null
let groupName2 = null
if (volHref) {
  await page.goto(new URL(volHref, BASE).href, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForTimeout(1200)
  // 先滚到底让 Reveal 全部播完（未播完的元素带 translate，会污染墨迹测量），再回顶部
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(1400)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(400)
  const [noteOrder] = await measure([['.note-row__order', '.note-list']])
  const volumeRow = await page.evaluate(() => {
    const card = document.querySelector('.note-list')
    if (!card) return null
    const ctx = document.createElement('canvas').getContext('2d')
    const ink = (el) => {
      const cs = getComputedStyle(el)
      ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily
      const t = el.textContent.trim()
      const m = ctx.measureText(t)
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
      // 首行：最上的墨迹 + 最左的墨迹（窄屏会折行，取极值才对）
      firstLeft: +(Math.min(...first.map((i) => i.left)) - cb.left).toFixed(2),
      firstTop: +(Math.min(...first.map((i) => i.top)) - cb.top).toFixed(2),
      // 末行：最深的一条文字墨迹到卡片下边
      lastInkFromBottom: +(cb.bottom - Math.max(...last.map((i) => i.bottom))).toFixed(2),
    }
  })
  groupName2 = await page.$eval('.volume__title', (el) => el.textContent.trim()).catch(() => null)
  volume = { ...volumeRow, orderInk: noteOrder }
}

const checks = {
  '归档 hero 标题墨迹左右一致': near(heroTitle.left, R, 3) && near(heroTitle.top),
  分组卡标题墨迹贴角: near(groupName.left, R, 1.5) && near(groupName.top),
  行标题与分组卡标题同线: near(rows ? firstRow.left : R, R, 1.5),
  各行标题左边界齐平: spread.titleSpread <= 0.5,
  各行日期成一列: spread.dateSpread <= 0.5,
  '末行文字到卡片下边 = 圆角': near(lastRow.bottom, R, 3),
  首页卡片标题墨迹贴角: near(cardTitle.left) && near(cardTitle.top),
  '首页摘要正好 3 行': Math.abs(card.summaryLines - 3) < 0.02,
  首页卡片不溢出: card.overflow <= 0,
  首页元信息贴卡片底: near(card.metaFromBottom, R, 3),
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
      card,
      spread,
      columnSeries,
      column,
      volume,
      groupName2,
      checks,
    },
    null,
    2,
  ),
)
console.log(failed.length ? `FAIL: ${failed.map(([k]) => k).join(' | ')}` : 'PASS: 对齐验收通过')
await browser.close()
process.exit(failed.length ? 1 : 0)
