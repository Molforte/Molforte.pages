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
    const fixed = [...document.querySelectorAll('body *')].filter(
      (el) => getComputedStyle(el).position === 'fixed' || getComputedStyle(el).position === 'sticky',
    ).length
    return {
      fixedOrSticky: fixed,
      bodyBg: cs('body', 'backgroundColor'),
      bodyFont: cs('body', 'fontFamily').split(',')[0],
      mastheadSize: cs('.masthead__title', 'fontSize'),
      mastheadWeight: cs('.masthead__title', 'fontWeight'),
      mastheadColor: cs('.masthead__title', 'color'),
      listItems: document.querySelectorAll('.post-item').length,
      dateText: document.querySelector('.post-item time')?.textContent || null,
      linkColor: cs('.post-item__title a', 'color'),
      hOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      codeBlocks: document.querySelectorAll('.post-body pre').length,
      highlighted: document.querySelectorAll('.post-body .hljs-keyword, .post-body .hljs-string').length,
      footerNav: document.querySelectorAll('.site-footer__nav a').length,
    }
  })
  console.log(`[${name}]`, JSON.stringify(r))
  await page.close()
}

await audit('home-desktop', `${BASE}/`, 1280, 900)
await audit('home-mobile', `${BASE}/`, 390, 844)
await audit('post-tech', `${BASE}/post/how-this-site-is-built`, 1280, 900)
await audit('post-essay', `${BASE}/post/why-no-topbar`, 390, 844)
await browser.close()
console.log('audit done')
