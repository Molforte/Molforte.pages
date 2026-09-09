// 设计审计：验证“悬浮岛底栏”设计要点是否落地（无头、无截图）
import { chromium } from 'playwright-core'
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = 'http://127.0.0.1:4173/Molforte.pages'

const browser = await chromium.launch({ executablePath: EDGE, headless: true, args: ['--disable-gpu'] })

async function audit(name, url, vw, vh) {
  const page = await browser.newPage({ viewport: { width: vw, height: vh } })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  const r = await page.evaluate(() => {
    // 唯一允许 fixed/sticky：悬浮岛本身
    const floaters = [...document.querySelectorAll('body *')].filter((el) => {
      const p = getComputedStyle(el).position
      if (p !== 'fixed' && p !== 'sticky') return false
      return !el.classList.contains('apptabbar')
    }).length
    const bar = document.querySelector('.apptabbar')
    const rect = bar?.getBoundingClientRect()
    const activeWrap = document.querySelector('.apptabbar__tab.is-active .apptabbar__icon-wrap')
    const cs = (el, prop) => (el ? getComputedStyle(el)[prop] : null)
    return {
      unexpectedFixedSticky: floaters,
      island: bar && rect ? {
        tabCount: document.querySelectorAll('.apptabbar__tab').length,
        floating: Math.round(window.innerHeight - rect.bottom), // >0 即悬浮离底
        width: Math.round(rect.width),
        notFullWidth: rect.width < window.innerWidth - 40,
        centeredWithin: Math.abs(rect.left + rect.width / 2 - window.innerWidth / 2) <= 3,
        radius: cs(bar, 'borderRadius'),
        glass: cs(bar, 'backdropFilter') || cs(bar, '-webkit-backdrop-filter'),
        background: cs(bar, 'backgroundColor'),
      } : null,
      active: bar ? {
        label: document.querySelector('.apptabbar__tab.is-active')?.textContent?.trim() || null,
        iconBubbleBg: activeWrap ? cs(activeWrap, 'backgroundColor') : null, // 应为深色 rgb(29,29,31)
      } : null,
      frameW: Math.round(document.querySelector('.site-frame')?.getBoundingClientRect().width || 0),
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
