import { useCallback, useState } from 'react'

const KEY = 'molforte-theme'

const prefersDark = () =>
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

function apply(theme) {
  document.documentElement.dataset.theme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.content = theme === 'dark' ? '#101014' : '#ffffff'
}

/** 应用初始主题（存值优先，否则跟随系统），并监听系统变化 */
export function initTheme() {
  let stored = null
  try {
    stored = localStorage.getItem(KEY)
  } catch {
    /* ignore */
  }
  apply(stored || (prefersDark() ? 'dark' : 'light'))
  if (!stored && window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', (e) => {
      try {
        if (!localStorage.getItem(KEY)) apply(e.matches ? 'dark' : 'light')
      } catch {
        apply(e.matches ? 'dark' : 'light')
      }
    })
  }
}

/** 手动开关：切到另一主题并持久化 */
export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light')
  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(KEY, next)
      } catch {
        /* ignore */
      }
      apply(next)
      return next
    })
  }, [])
  return { theme, toggle }
}
