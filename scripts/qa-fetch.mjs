import { chromium } from 'playwright-core'
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const browser = await chromium.launch({ executablePath: EDGE, headless: true, args: ['--disable-gpu'] })
const page = await browser.newPage()
const u = 'http://127.0.0.1:4173/Molforte.pages/assets/index-gc7YhcUN.js'
const r = await page.evaluate(async (url) => {
  const res = await fetch(url)
  const text = await res.text()
  return { status: res.status, len: text.length, head: text.slice(0, 80) }
}, u)
console.log('fetch in page:', JSON.stringify(r))
await browser.close()
