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
    // 允许侧栏自身 sticky；除此之外不允许任何 fixed/sticky（无顶栏）
    const sticky = [...document.querySelectorAll('body *')].filter((el) => {
      const p = getComputedStyle(el).position
      return (p === 'fixed' || p === 'sticky') && !el.classList.contains('sidebar')
    }).length
    const sidebar = document.querySelector('.sidebar')
    const list = document.querySelector('.post-index, .archive, .static-page, .post')
    const rect = list ? list.getBoundingClientRect() : null
    return {
      unexpectedFixedSticky: sticky,
      sidebarVisible: !!sidebar && getComputedStyle(sidebar).display !== 'none',
      sidebarSticky: sidebar ? getComputedStyle(sidebar).position : null,
      mainW: rect ? Math.round(rect.width) : null,
      mainRatio: rect ? +(rect.width / window.innerWidth).toFixed(3) : null,
      navItems: document.querySelectorAll('.sidebar__link').length,
      activeNav: document.querySelector('.sidebar__link.is-active')?.textContent || null,
      bodyBg: cs('body', 'backgroundColor'),
      h1: document.querySelector('h1, .post__title, .page__title')?.textContent?.trim() || null,
      hOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      footerLine: document.querySelector('.site-footer__line')?.textContent?.slice(0, 40) || null,
      codeBlocks: document.querySelectorAll('.post-body pre').length,
    }
  })
  console.log(`[${name}]`, JSON.stringify(r))
  await page.close()
}

await audit('home-desktop', `${BASE}/`, 1366, 900)
await audit('home-tablet-1000', `${BASE}/`, 1000, 900)
await audit('home-mobile', `${BASE}/`, 390, 844)
await audit('archive-desktop', `${BASE}/archive`, 1366, 900)
await audit('about-desktop', `${BASE}/about`, 1366, 900)
await audit('friends-mobile', `${BASE}/friends`, 390, 844)
await audit('post-tech', `${BASE}/post/how-this-site-is-built`, 1366, 900)
await audit('fallback-404', `${BASE}/post/does-not-exist`, 1366, 900)
await browser.close()
console.log('audit done')
