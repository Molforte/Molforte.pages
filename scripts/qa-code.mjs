// 代码块验收：已注册语言真的高亮、纯文本块不着色、控制台没有「未知语言」告警。
// 用法：node scripts/qa-code.mjs
//       QA_BASE=https://molforte.github.io/Molforte.pages node scripts/qa-code.mjs
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
import { chromium } from 'playwright-core'

const BASE = process.env.QA_BASE || 'http://127.0.0.1:4173/Molforte.pages'
const SLUG = process.env.QA_SLUG || 'how-this-site-is-built'

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--disable-gpu'],
})
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } })
const logs = []
page.on('console', (m) => logs.push(`${m.type()}: ${m.text()}`))
page.on('pageerror', (e) => logs.push(`pageerror: ${e.message}`))

await page.goto(`${BASE}/post/${SLUG}`, {
  waitUntil: process.env.QA_WAIT || 'load',
  timeout: 60000,
})
await page.waitForTimeout(3000)

const info = await page.evaluate(() => {
  const blocks = [...document.querySelectorAll('.post-body pre code')]
  const isPlain = (b) => [...b.classList].some((c) => c.includes('plain') || c.includes('text'))
  const spans = (b) => b.querySelectorAll('span[class^="hljs-"]').length
  return {
    total: blocks.length,
    highlighted: blocks.filter((b) => spans(b) > 0).length,
    plainBlocks: blocks.filter(isPlain).length,
    plainSpans: blocks.filter(isPlain).map(spans),
    codeFontResolved: blocks.length
      ? getComputedStyle(blocks[0]).fontFamily.split(',')[0].replace(/["']/g, '')
      : null,
  }
})

const unknownLangWarn = logs.filter((l) => /Could not find the language/i.test(l))
const pageErrors = logs.filter((l) => l.startsWith('pageerror:'))

const checks = {
  '代码块数量 > 0': info.total > 0,
  有代码块被高亮: info.highlighted > 0,
  纯文本块不着色: info.plainSpans.every((n) => n === 0),
  '无「未知语言」告警': unknownLangWarn.length === 0,
  无脚本报错: pageErrors.length === 0,
}
const failed = Object.entries(checks).filter(([, ok]) => !ok)

console.log(JSON.stringify({ base: BASE, ...info, checks, unknownLangWarn, pageErrors }, null, 2))
console.log(failed.length ? `FAIL: ${failed.map(([k]) => k).join(' | ')}` : 'PASS: 代码块验收通过')
await browser.close()
process.exit(failed.length ? 1 : 0)
