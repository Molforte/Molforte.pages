import { chromium } from 'playwright-core'
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const browser = await chromium.launch({ executablePath: EDGE, headless: true, args: ['--disable-gpu'] })
const page = await browser.newPage()
page.on('console', (m) => console.log(`[console.${m.type()}]`, m.text().slice(0, 300)))
page.on('pageerror', (e) => console.log('[pageerror]', String(e).slice(0, 300)))
page.on('requestfailed', (r) => console.log('[requestfailed]', r.url(), r.failure()?.errorText))
page.on('response', (r) => {
  if (r.status() >= 400) console.log('[bad-response]', r.status(), r.url())
})
const resp = await page.goto('http://127.0.0.1:4173/Molforte.pages/', { waitUntil: 'networkidle' })
console.log('final status', resp?.status())
await page.waitForTimeout(1500)
console.log('bodyChars:', (await page.evaluate(() => document.body.innerText.length)))
console.log('root html len:', (await page.evaluate(() => document.getElementById('root')?.innerHTML.length)))
await browser.close()
