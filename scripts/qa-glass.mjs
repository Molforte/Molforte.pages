import { chromium } from 'playwright-core'
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = 'http://127.0.0.1:4173/Molforte.pages'
const b = await chromium.launch({ executablePath: EDGE, headless: true, args: ['--disable-gpu'] })
const p = await b.newPage({ viewport: { width: 1366, height: 900 } })
const errs = []
p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)))
await p.goto(BASE + '/', { waitUntil: 'networkidle' })
await p.waitForTimeout(600)
const r = await p.evaluate(() => {
  const island = document.querySelector('.apptabbar')
  const search = document.querySelector('.search-island')
  const filters = [...document.querySelectorAll('svg filter')]
  const disp = document.querySelector('feDisplacementMap')
  const img = document.querySelector('feImage')
  return {
    cssSupports: CSS.supports('backdrop-filter', 'url(#x)'),
    islandBackdrop: island.style.backdropFilter,
    searchBackdrop: search.style.backdropFilter,
    filterCount: filters.length,
    filterId: filters[0]?.id || null,
    displacementScale: disp?.getAttribute('scale') || null,
    mapHrefIsData: (img?.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || '').startsWith('data:image/png'),
    islandSize: [Math.round(island.getBoundingClientRect().width), Math.round(island.getBoundingClientRect().height)],
  }
})
console.log(JSON.stringify({ ...r, pageErrors: errs }, null, 2))
await b.close()
