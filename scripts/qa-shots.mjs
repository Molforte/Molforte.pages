// QA 截图脚本（本地开发用）：用系统 Edge 无头渲染各页面，保存截图与诊断信息
import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'

const BASE = process.env.QA_BASE || 'http://127.0.0.1:4173/Molforte.pages'
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const OUT = '.qa'
mkdirSync(OUT, { recursive: true })

const cases = [
  { name: 'home-desktop', url: `${BASE}/`, vw: 1280, vh: 900 },
  { name: 'home-mobile', url: `${BASE}/`, vw: 390, vh: 844 },
  { name: 'archive-desktop', url: `${BASE}/archive`, vw: 1280, vh: 900 },
  { name: 'archive-mobile', url: `${BASE}/archive`, vw: 390, vh: 844 },
  { name: 'post-tech', url: `${BASE}/post/how-this-site-is-built`, vw: 1280, vh: 900 },
  { name: 'post-essay', url: `${BASE}/post/why-no-topbar`, vw: 1280, vh: 900 },
  { name: 'fallback-404', url: `${BASE}/post/does-not-exist`, vw: 1280, vh: 900 },
]

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--disable-gpu', '--no-sandbox'],
})

for (const c of cases) {
  const page = await browser.newPage({ viewport: { width: c.vw, height: c.vh } })
  const errors = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  const resp = await page.goto(c.url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/${c.name}.png`, fullPage: true })
  const info = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelector('h1')?.textContent?.trim() || null,
    links: document.querySelectorAll('a').length,
    hasTopBar:
      !!document.querySelector('header, nav') &&
      (() => {
        const h = document.querySelector('header')
        return !!h && getComputedStyle(h).position === 'fixed'
      })(),
    bodyTextLen: document.body.innerText.length,
  }))
  console.log(
    `[${c.name}] status=${resp?.status()} title=${info.title} h1=${info.h1} links=${info.links} bodyChars=${info.bodyTextLen} errors=${errors.length}`,
  )
  errors.slice(0, 5).forEach((e) => console.log(`   error: ${e.slice(0, 200)}`))
  await page.close()
}

await browser.close()
console.log('done ->', OUT)
