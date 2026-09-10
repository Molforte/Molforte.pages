import { chromium } from 'playwright-core'
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const SITE = 'https://molforte.github.io/Molforte.pages'
const b = await chromium.launch({ executablePath: EDGE, headless: true, args: ['--disable-gpu'] })
const p = await b.newPage({ viewport: { width: 1366, height: 900 } })
await p.goto(SITE + '/?nocache=' + Date.now(), { waitUntil: 'networkidle' })
await p.waitForTimeout(600)
const r = await p.evaluate(() => ({
  surfaces: document.querySelectorAll('.dock .glass-surface').length,
  scales: [...document.querySelectorAll('.dock .glass-surface feDisplacementMap')].map((d) =>
    d.getAttribute('scale'),
  ),
}))
console.log(JSON.stringify(r))
await b.close()
