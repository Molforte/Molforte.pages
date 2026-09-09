import { chromium } from 'playwright-core'
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = 'http://127.0.0.1:4173/Molforte.pages'
const b = await chromium.launch({ executablePath: EDGE, headless: true, args: ['--disable-gpu'] })
const p = await b.newPage({ viewport: { width: 1366, height: 900 } })
const errs = []
p.on('pageerror', (e) => errs.push(String(e)))

await p.goto(BASE + '/', { waitUntil: 'networkidle' })
const home = await p.evaluate(() => ({
  cards: document.querySelectorAll('.post-card').length,
  tert: getComputedStyle(document.documentElement).getPropertyValue('--text-3').trim(),
  hOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
}))

await p.goto(BASE + '/post/how-this-site-is-built', { waitUntil: 'networkidle' })
const post = await p.evaluate(() => ({
  title: document.querySelector('.post__title')?.textContent,
  extLinks: document.querySelectorAll('.post-body a[target="_blank"]').length,
}))

await p.goto(BASE + '/archive', { waitUntil: 'networkidle' })
const arch = await p.evaluate(() => ({
  hero: !!document.querySelector('.archive-hero'),
  groupCards: document.querySelectorAll('.archive-group-card').length,
}))

await p.goto(BASE + '/about', { waitUntil: 'networkidle' })
const about = await p.evaluate(() => document.querySelector('.page__title')?.textContent)

console.log(JSON.stringify({ home, post, arch, about, pageErrors: errs }, null, 2))
await b.close()
