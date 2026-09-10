// 字体验收：Sarasa Mono SC 子集是否被加载、且真的等宽。
// 用法：node scripts/qa-font.mjs            （本地 4173）
//       QA_BASE=https://molforte.github.io/Molforte.pages node scripts/qa-font.mjs
//       QA_WAIT=load 可放宽等待条件（线上首屏偶尔等不到 networkidle）
import { chromium } from 'playwright-core'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = process.env.QA_BASE || 'http://127.0.0.1:4173/Molforte.pages'

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--disable-gpu'],
})
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } })
const fontResponses = []
page.on('response', (r) => {
  if (/\.woff2?(\?|$)/.test(r.url()))
    fontResponses.push(`${r.status()} ${r.url().split('/').pop()}`)
})

await page.goto(`${BASE}/notes/iap-board/16-DS18B20温度传感器`, {
  waitUntil: process.env.QA_WAIT || 'networkidle',
  timeout: 60000,
})

// 等字体真正就绪（最多 8 秒；线上首屏较慢）
const ready = await page
  .waitForFunction(() => document.fonts.check('16px "Sarasa Mono SC Web"', 'const 札记'), null, {
    timeout: 8000,
  })
  .then(() => true)
  .catch(() => false)

const r = await page.evaluate(() => {
  const code = document.querySelector('.post-body pre code')
  // 用「可见」探针测等宽（不可见文本浏览器会延迟加载字体）
  const el = document.createElement('span')
  el.style.cssText =
    'font-family:"Sarasa Mono SC Web";font-size:20px;white-space:pre;opacity:0.01;position:fixed;top:0;left:0;pointer-events:none'
  document.body.appendChild(el)
  el.textContent = 'iiiii'
  const w1 = el.getBoundingClientRect().width
  el.textContent = 'WWWWW'
  const w2 = el.getBoundingClientRect().width
  el.textContent = '札记代码块'
  const w3 = el.getBoundingClientRect().width
  el.remove()

  const faces = [...document.fonts].map((f) => ({
    family: f.family,
    status: f.status,
    weight: f.weight,
  }))

  // 关键校验：真实代码块用的到底是不是我们的字体
  // 做法：量同一段文本的宽度，再把 font-family 强制成 monospace 量一次
  let applied = null
  if (code) {
    const range = document.createRange()
    const widthOf = () => {
      range.selectNodeContents(code)
      return +range.getBoundingClientRect().width.toFixed(2)
    }
    const prev = code.style.fontFamily
    const ours = widthOf()
    code.style.fontFamily = 'monospace'
    const fallback = widthOf()
    code.style.fontFamily = prev
    applied = { ours, fallback, differs: Math.abs(ours - fallback) > 1 }
  }

  return {
    codeFontFamily: code ? getComputedStyle(code).fontFamily.split(',')[0] : null,
    codeFontSize: code ? getComputedStyle(code).fontSize : null,
    checkAscii: document.fonts.check('16px "Sarasa Mono SC Web"', 'const a = 1;'),
    checkCjk: document.fonts.check('16px "Sarasa Mono SC Web"', '札记代码块'),
    monoWidths: { i: +w1.toFixed(2), W: +w2.toFixed(2), cjk: +w3.toFixed(2) },
    isMonospaced: Math.abs(w1 - w2) < 0.6,
    fontAppliedToCode: applied,
    faces,
  }
})

console.log(JSON.stringify({ fontReadyAfterWait: ready, ...r, fontResponses }, null, 2))
await browser.close()
