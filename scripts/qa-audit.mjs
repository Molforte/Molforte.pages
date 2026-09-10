// 设计审计：验证底部功能区（图标主岛 + 搜索副岛 + 悬浮文字 + 搜索浮层）
import { chromium } from 'playwright-core'
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const BASE = 'http://127.0.0.1:4173/Molforte.pages'

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--disable-gpu'],
})

async function audit(name, url, vw, vh, withHover = false) {
  const page = await browser.newPage({ viewport: { width: vw, height: vh } })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)

  const r = await page.evaluate(() => {
    const floaters = [...document.querySelectorAll('body *')].filter((el) => {
      const p = getComputedStyle(el).position
      if (p !== 'fixed' && p !== 'sticky') return false
      return !el.closest('.dock, .search-backdrop')
    }).length
    const island = document.querySelector('.apptabbar')
    const irect = island?.getBoundingClientRect()
    const active = document.querySelector('.apptabbar__tab.is-active')
    const search = document.querySelector('.search-island')
    const label = document.querySelector('.apptabbar__label')
    return {
      unexpectedFixedSticky: floaters,
      island:
        island && irect
          ? {
              widthRatio: +(irect.width / window.innerWidth).toFixed(3),
              tabCount: document.querySelectorAll('.apptabbar__tab').length,
              glass:
                getComputedStyle(island).backdropFilter ||
                getComputedStyle(island).webkitBackdropFilter,
            }
          : null,
      labelsHiddenByDefault: label ? getComputedStyle(label).visibility : null,
      active: active
        ? {
            label: active.getAttribute('aria-label'),
            segmentRatio: +(active.getBoundingClientRect().width / irect.width).toFixed(3),
          }
        : null,
      searchIsland: search ? Math.round(search.getBoundingClientRect().height) : null,
      h1: document.querySelector('h1, .post__title, .page__title')?.textContent?.trim() || null,
      hOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }
  })

  // 悬浮一个标签：文字应浮现
  let hoverReveal = null
  if (withHover) {
    const firstTab = page.locator('.apptabbar__tab').first()
    const labelEl = firstTab.locator('.apptabbar__label')
    await firstTab.hover()
    await page.waitForTimeout(250)
    hoverReveal = await labelEl.evaluate((el) => getComputedStyle(el).visibility)
  }

  // 打开搜索浮层并检索
  let searchCheck = null
  const panel = page.locator('.search-panel')
  if (await page.locator('.search-island').count()) {
    await page.locator('.search-island').click()
    await page.waitForTimeout(250)
    const opened = (await panel.count()) > 0
    let found = null
    if (opened) {
      await page.locator('.search-panel__input').fill('数码管')
      await page.waitForTimeout(150)
      found = await page.locator('.search-panel__item').count()
      await page.keyboard.press('Escape')
      await page.waitForTimeout(150)
    }
    searchCheck = { opened, found, closedAfterEsc: (await panel.count()) === 0 }
  }

  console.log(`[${name}]`, JSON.stringify({ ...r, hoverReveal, searchCheck }))
  await page.close()
}

await audit('home-desktop', `${BASE}/`, 1366, 900, true)
await audit('home-mobile', `${BASE}/`, 390, 844)
await audit('archive', `${BASE}/archive`, 1366, 900)
await audit('note', `${BASE}/notes/iap-board/16-DS18B20温度传感器`, 1366, 900)
await browser.close()
console.log('audit done')
