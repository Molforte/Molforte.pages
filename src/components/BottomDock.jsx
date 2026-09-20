import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { posts, searchNotes, formatDate } from '../lib/content.js'
import GlassSurface from './GlassSurface.jsx'

// 导航图标：每个圆形芯片里放一个（芯片样式来自 Uiverse 的 navigation-card）
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
  // 链环：这对路径在 24 格 viewBox 里铺得比别的图标满（x 从 3 到 21），
  // 同尺寸看着会偏大，所以标记成 small，渲染时收一档
  links: (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
  search: (
    <>
      <circle cx="10.6" cy="10.6" r="6.2" />
      <path d="M15.2 15.2 20 20" />
    </>
  ),
  // 搜索态里，导航岛缩成小圆后显示这个：「回导航」
  back: (
    <>
      <path d="M19 12H5.6" />
      <path d="M11.4 5.6 5 12l6.4 6.4" />
    </>
  ),
}

// 栏名平时收在芯片里（宽度 0），当前那枚撑开时才浮出来；
// 它同时也是这一项的无障碍名。small: true 的图标收一档（见 .dotnav__icon--sm）。
const TABS = [
  { to: '/', label: 'Home', end: true, icon: ICON.home },
  { to: '/archive', label: 'Archive', icon: ICON.archive },
  { to: '/friends', label: 'Links', icon: ICON.links, small: true },
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

/** 当前路由是否属于这一栏；笔记的册页/笔记页都算「归档」。 */
function isTabActive(tab, pathname) {
  if (tab.to === '/archive') {
    return pathname.startsWith('/archive') || pathname.startsWith('/notes/')
  }
  return tab.end ? pathname === tab.to : pathname.startsWith(tab.to)
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

/* ＝临时＝ 底栏外壳的样式，做出来比着看：
     glass    —— 原来的 React Bits 液态玻璃（白底上偏灰，边缘还有一点滤镜纹）
     hairline —— 透明底 + 1px 发丝线
     solid    —— 实心底 + 柔影
   默认值就是下面那一行。运行时可以 ?dock=hairline|solid|glass，
   或按 Shift+D 循环着切；定下来之后把默认值改掉、这段开关就可以删了。 */
const DOCK_SURFACES = ['solid', 'hairline', 'glass']
const DOCK_SURFACE_DEFAULT = 'solid'
const DOCK_SURFACE_KEY = 'molforte-dock-surface'

function readDockSurface() {
  try {
    const v = new URLSearchParams(window.location.search).get('dock')
    if (v && DOCK_SURFACES.includes(v)) {
      localStorage.setItem(DOCK_SURFACE_KEY, v)
      return v
    }
    const stored = localStorage.getItem(DOCK_SURFACE_KEY)
    if (stored && DOCK_SURFACES.includes(stored)) return stored
  } catch {
    /* 无痕模式读不到就用默认值 */
  }
  return DOCK_SURFACE_DEFAULT
}

function useDockSurface() {
  const [surface, setSurface] = useState(readDockSurface)
  useEffect(() => {
    const onKey = (e) => {
      if (!e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return
      if (String(e.key).toLowerCase() !== 'd') return
      const t = e.target
      if (
        t instanceof Element &&
        (t.closest('input, textarea, [contenteditable]') || t.isContentEditable)
      )
        return
      e.preventDefault()
      setSurface((prev) => {
        const next = DOCK_SURFACES[(DOCK_SURFACES.indexOf(prev) + 1) % DOCK_SURFACES.length]
        try {
          localStorage.setItem(DOCK_SURFACE_KEY, next)
        } catch {
          /* ignore */
        }
        console.info(`[调试] 底栏外壳：${next}（Shift+D 循环，?dock=… 也行）`)
        return next
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return surface
}

/** 两个岛的外壳：玻璃那版交给 React Bits 的 <GlassSurface />，其余两版就是一个普通盒子
    （省掉 SVG 滤镜的那点开销，也没有它在边缘留下的淡蓝纹）。 */
function Island({ surface, shape, className = '', children }) {
  const cls = `dock-island dock-island--${shape}${className ? ` ${className}` : ''}`
  if (surface === 'glass') {
    return (
      <GlassSurface
        className={`${cls} dock-glass`}
        width={shape === 'pill' ? 'min(72vw, 25rem)' : 'var(--dock-h)'}
        height="var(--dock-h)"
        borderRadius={shape === 'pill' ? 34 : 999}
        {...GLASS_TINT}
      >
        {children}
      </GlassSurface>
    )
  }
  return <div className={cls}>{children}</div>
}

export default function BottomDock() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [navW, setNavW] = useState(0)
  const inputRef = useRef(null)
  const panelRef = useRef(null)
  const triggerRef = useRef(null)
  const navRef = useRef(null)

  const { pathname } = useLocation()
  const surface = useDockSurface()

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
    // 关闭后把焦点还给搜索按钮，键盘用户不失焦
    requestAnimationFrame(() => triggerRef.current?.focus())
  }, [])

  // 打开时聚焦输入框（不再锁滚动、也不再给背后加 inert：
  // 输入框就在底栏里，页面该照常能滚能点）
  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
  }, [open])

  // 量一下导航岛的「自然宽度」（含当前那枚撑开的胶囊）：搜索态里两岛要互换宽度，
  // 于是 --nav-w 既是导航缩下去的目标，也是搜索岛撑开的目标。搜索态不量（那时它是小圆）。
  useEffect(() => {
    if (open) return
    const measure = () => {
      const el = navRef.current
      if (!el) return
      const w = Math.round(el.getBoundingClientRect().width)
      if (w > 0) setNavW(w)
    }
    measure()
    // 路由变化后当前胶囊会过渡着撑开，等它稳定再量一次
    const t = setTimeout(measure, 600)
    window.addEventListener('resize', measure)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', measure)
    }
  }, [open, pathname])

  // Esc 关闭；点底栏以外的地方也关
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') close()
    }
    const onDown = (e) => {
      if (!e.target.closest?.('.dock') && !e.target.closest?.('.search-panel')) close()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [open, close])

  return (
    <>
      <div
        className={`dock dock--${surface}${open ? ' is-searching' : ''}`}
        style={navW ? { '--nav-w': `${navW}px` } : undefined}
      >
        {/* 主岛（导航）：搜索态里缩成和原来那颗搜索圆一样大的小圆，
            里面换成「← 回导航」。宽度互换见 global.css 的 .dock.is-searching。 */}
        <Island surface={surface} shape="pill" className="dock-island--nav">
          {open ? (
            <button type="button" className="dock-back" aria-label="返回导航" onClick={close}>
              <svg {...ICON_PROPS}>{ICON.back}</svg>
            </button>
          ) : (
            <nav className="dotnav" aria-label="主导航" ref={navRef}>
              <ul className="dotnav__items">
                {TABS.map((tab) => {
                  const active = isTabActive(tab, pathname)
                  return (
                    <li className="dotnav__item" key={tab.to}>
                      <NavLink
                        to={tab.to}
                        end={tab.end}
                        className={`dotnav__link${active ? ' is-current' : ''}`}
                      >
                        <svg
                          className={`dotnav__icon${tab.small ? ' dotnav__icon--sm' : ''}`}
                          {...ICON_PROPS}
                        >
                          {tab.icon}
                        </svg>
                        {/* 栏名平时宽度为 0 收在芯片里，当前那枚撑开时才看得见 */}
                        <span className="dotnav__label">{tab.label}</span>
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </nav>
          )}
        </Island>

        {/* 搜索岛：平时是一颗圆按钮（图标不变）；搜索态撑成与导航岛等宽的大岛，
            里面直接就是输入框 —— 边打边出结果。
            结果浮层挂在这座岛里面（岛是定位上下文），右边缘自然对齐。 */}
        <Island surface={surface} shape="circle" className="dock-island--search">
          {open ? (
            <>
              <div className="search-island search-island--open">
                <svg className="search-island__icon" {...ICON_PROPS}>
                  {ICON.search}
                </svg>
                <input
                  ref={inputRef}
                  className="search-island__input"
                  type="search"
                  placeholder="搜索标题或标签…"
                  aria-label="搜索标题或标签"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              {/* 输入框还是空的时候不渲染浮层 —— 别一打开就顶一个「输入关键词…」的框在那儿 */}
              {q.trim() !== '' && (
                <div className="search-panel" ref={panelRef} role="dialog" aria-label="搜索结果">
                  {results.length === 0 ? (
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
                            {item.where && (
                              <span className="search-panel__where">{item.where}</span>
                            )}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          ) : (
            <button
              type="button"
              className="search-island"
              aria-label="搜索文章"
              ref={triggerRef}
              onClick={() => setOpen(true)}
            >
              <svg {...ICON_PROPS}>{ICON.search}</svg>
            </button>
          )}
        </Island>
      </div>
    </>
  )
}
