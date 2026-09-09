// 设计审计：用计算样式验证设计要点是否落地（无头、无截图）
import { chromium } from 'playwright-core'
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = 'http://127.0.0.1:4173/Molforte.pages'

const browser = await chromium.launch({ executablePath: EDGE, headless: true, args: ['--disable-gpu'] })

async function audit(name, url, vw, vh) {
  const page = await browser.newPage({ viewport: { width: vw, height: vh } })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  const r = await page.evaluate(() => {
    const cs = (sel, prop) => {
      const el = document.querySelector(sel)
      return el ? getComputedStyle(el)[prop] : null
    }
    const floating = [...document.querySelectorAll('body *')].filter((el) => {
      const p = getComputedStyle(el).position
      return p === 'fixed' || p === 'sticky'
    }).length
    const frame = document.querySelector('.site-frame')
    const rect = frame ? frame.getBoundingClientRect() : null
    return {
      floatingElements: floating, // 任何 fixed/sticky 都不允许（无顶栏）
      frameW: rect ? Math.round(rect.width) : null,
      frameRatio: rect ? +(rect.width / window.innerWidth).toFixed(3) : null,
      footerNavLinks: document.querySelectorAll('.site-footer__nav a').length,
      activeNav: document.querySelector('.site-footer__nav a[aria-current="page"]')?.textContent?.trim() || null,
      bodyBg: cs('body', 'backgroundColor'),
      h1: document.querySelector('h1, .post__title, .page__title')?.textContent?.trim() || null,
      hOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      codeBlocks: document.querySelectorAll('.post-body pre').length,
    }
  })
  console.log(`[${name}]`, JSON.stringify(r))
  await page.close()
}

await audit('home-desktop', `${BASE}/`, 1366, 900)
await audit('home-mid', `${BASE}/`, 1024, 900)
await audit('home-mobile', `${BASE}/`, 390, 844)
await audit('archive', `${BASE}/archive`, 1366, 900)
await audit('about', `${BASE}/about`, 1366, 900)
await audit('friends-mobile', `${BASE}/friends`, 390, 844)
await audit('post', `${BASE}/post/how-this-site-is-built`, 1366, 900)
await browser.close()
console.log('audit done')
