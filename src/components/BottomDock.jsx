import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { posts, searchNotes, formatDate } from '../lib/content.js'
import GlassSurface from './GlassSurface.jsx'

const ICON = {
  home: (
    <>
      <path d="M4.3 10.6 12 4.3l7.7 6.3" />
      <path d="M6.3 9.5v9.9c0 .6.4 1 1 1h9.4c.6 0 1-.4 1-1V9.5" />
      <path d="M10.1 20.4v-5.3h3.8v5.3" />
    </>
  ),
  archive: (
    <>
      <rect x="5.9" y="6.9" width="12.2" height="13" rx="1.4" />
      <path d="M5.9 10.4h12.2" />
      <path d="M9.6 13.6h4.8" />
    </>
  ),
  friends: (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
  about: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 10.6v6.4" />
      <circle cx="12" cy="7.5" r="1.15" fill="currentColor" stroke="none" />
    </>
  ),
  search: (
    <>
      <circle cx="10.6" cy="10.6" r="6.2" />
      <path d="M15.2 15.2 20 20" />
    </>
  ),
}

const TABS = [
  { to: '/', label: '主页', end: true, icon: ICON.home },
  { to: '/archive', label: '归档', icon: ICON.archive },
  { to: '/friends', label: '友链', icon: ICON.friends },
  { to: '/about', label: '关于', icon: ICON.about },
]

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.7',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
}

// 玻璃参数（两个岛共用）。色散/RGB 分离由三个通道的额外位移决定，
// GlassSurface 默认是 0 / 10 / 20，偏明显；这里压低到 0 / 5 / 10。
// 想完全没有 RGB 分离：三个都设 0；想更明显：往 0 / 20 / 40 调。
const GLASS_TINT = {
  backgroundOpacity: 0.06,
  saturation: 1.2,
  redOffset: 0,
  greenOffset: 5,
  blueOffset: 10,
}

export default function BottomDock() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const inputRef = useRef(null)
  const panelRef = useRef(null)
  const triggerRef = useRef(null)

  // 选中胶囊：跟随当前路由滑动过去（动画做在玻璃内部，避免影响 backdrop-filter）
  const { pathname } = useLocation()
  const tabsRef = useRef(null)
  const [pill, setPill] = useState({ left: 0, width: 0 })
  const [pillReady, setPillReady] = useState(false)

  useEffect(() => {
    const measure = () => {
      const tabs = tabsRef.current
      if (!tabs) return
      const active = tabs.querySelector('.apptabbar__tab.is-active')
      if (!active) {
        setPill((p) => (p.width === 0 ? p : { ...p, width: 0 }))
        return
      }
      setPill({ left: active.offsetLeft, width: active.offsetWidth })
    }
    measure()
    const raf = requestAnimationFrame(() => setPillReady(true))
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
    }
  }, [pathname])

  const results = useMemo(() => {
    const key = q.trim().toLowerCase()
    if (!key) return []
    const hit = (hay) => hay.toLowerCase().includes(key)
    return [
      // 笔记（册内）：标题 / 标签 / 册名都可搜
      ...searchNotes
        .filter((n) => hit(`${n.title} ${n.tags.join(' ')} ${n.slug} ${n.volumeTitle}`))
        .map((n) => ({
          key: `${n.volume}/${n.slug}`,
          to: `/notes/${n.volume}/${n.slug}`,
          date: n.date,
          title: n.title,
          where: n.volumeTitle,
        })),
      ...posts
        .filter((p) => hit(`${p.title} ${p.tags.join(' ')} ${p.slug}`))
        .map((p) => ({
          key: p.slug,
          to: `/post/${p.slug}`,
          date: p.date,
          title: p.title,
          where: '',
        })),
    ].slice(0, 12)
  }, [q])

  const close = useCallback(() => {
    setOpen(false)
    setQ('')
    // 关闭后把焦点还给触发按钮，键盘用户不失焦
    requestAnimationFrame(() => triggerRef.current?.focus())
  }, [])

  // 打开时：聚焦输入框、锁滚动、让背后内容 inert（不可交互/不可聚焦）
  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const prevOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    const frame = document.querySelector('.site-frame')
    const dock = document.querySelector('.dock')
    frame?.setAttribute('inert', '')
    dock?.setAttribute('inert', '')
    return () => {
      document.documentElement.style.overflow = prevOverflow
      frame?.removeAttribute('inert')
      dock?.removeAttribute('inert')
    }
  }, [open])

  // 键盘：Esc 关闭；Tab/Shift+Tab 只在浮层内循环（焦点陷阱）
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        close()
        return
      }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const focusables = panel.querySelectorAll(
        'a[href], button, input, [tabindex]:not([tabindex="-1"])',
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      const inside = panel.contains(active)
      if (e.shiftKey) {
        if (active === first || !inside) {
          e.preventDefault()
          last.focus()
        }
      } else if (active === last || !inside) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  return (
    <>
      <div className="dock">
        {/* 主岛：玻璃来自 React Bits 的 <GlassSurface />；内部只有图标，文字悬浮浮现 */}
        <GlassSurface
          className="dock-glass dock-glass--island"
          width="min(72vw, 54rem)"
          height="var(--dock-h)"
          borderRadius={34}
          {...GLASS_TINT}
        >
          <nav className="apptabbar" aria-label="主导航">
            <div className={`apptabbar__tabs${pillReady ? ' is-ready' : ''}`} ref={tabsRef}>
              <span
                className="apptabbar__pill"
                aria-hidden="true"
                style={{
                  transform: `translateX(${pill.left}px)`,
                  width: `${pill.width}px`,
                  opacity: pill.width ? 1 : 0,
                }}
              />
              {TABS.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  aria-label={tab.label}
                  className={({ isActive }) =>
                    // 笔记的册页/笔记页都属于「归档」这一栏
                    `apptabbar__tab${
                      isActive || (tab.to === '/archive' && pathname.startsWith('/notes/'))
                        ? ' is-active'
                        : ''
                    }`
                  }
                >
                  <span className="apptabbar__icon-wrap">
                    <svg className="apptabbar__icon" {...ICON_PROPS}>
                      {tab.icon}
                    </svg>
                  </span>
                  <span className="apptabbar__label" aria-hidden="true">
                    {tab.label}
                  </span>
                </NavLink>
              ))}
            </div>
          </nav>
        </GlassSurface>

        {/* 搜索副岛：独立的圆形 GlassSurface */}
        <GlassSurface
          className="dock-glass dock-glass--circle"
          width="var(--dock-h)"
          height="var(--dock-h)"
          borderRadius={999}
          {...GLASS_TINT}
        >
          <button
            type="button"
            className="search-island"
            aria-label="搜索文章"
            ref={triggerRef}
            onClick={() => setOpen(true)}
          >
            <svg {...ICON_PROPS}>{ICON.search}</svg>
          </button>
        </GlassSurface>
      </div>

      {open && (
        <div
          className="search-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="搜索文章"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close()
          }}
        >
          <div className="search-panel" ref={panelRef}>
            <div className="search-panel__row">
              <svg {...ICON_PROPS}>{ICON.search}</svg>
              <input
                ref={inputRef}
                className="search-panel__input"
                placeholder="搜索标题或标签…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            {q.trim() === '' ? (
              <p className="search-panel__hint">输入关键词，按标题 / 标签搜索。</p>
            ) : results.length === 0 ? (
              <p className="search-panel__hint">没有找到与“{q.trim()}”相关的文章。</p>
            ) : (
              <ul className="search-panel__list">
                {results.map((item, index) => (
                  <li
                    className="search-panel__item"
                    key={item.key}
                    style={{ '--i': Math.min(index, 8) }}
                  >
                    <Link to={item.to} onClick={close}>
                      <time dateTime={item.date}>{formatDate(item.date)}</time>
                      <span>{item.title}</span>
                      {item.where && <span className="search-panel__where">{item.where}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  )
}
