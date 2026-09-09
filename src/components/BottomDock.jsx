import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { posts, formatDate } from '../lib/content.js'

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

export default function BottomDock() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const inputRef = useRef(null)

  const results = useMemo(() => {
    const key = q.trim().toLowerCase()
    if (!key) return []
    return posts
      .filter((p) =>
        `${p.title} ${p.tags.join(' ')} ${p.slug}`.toLowerCase().includes(key),
      )
      .slice(0, 12)
  }, [q])

  // 打开时聚焦输入框、锁滚动
  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const prevOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prevOverflow
    }
  }, [open])

  // Esc 关闭
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => {
    setOpen(false)
    setQ('')
  }

  return (
    <>
      <div className="dock">
        {/* 主岛：仅图标；文字在悬浮/聚焦时浮现 */}
        <nav className="apptabbar" aria-label="主导航">
          <div className="apptabbar__tabs">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                aria-label={tab.label}
                className={({ isActive }) =>
                  `apptabbar__tab${isActive ? ' is-active' : ''}`
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

        {/* 搜索副岛：独立小圆岛，与主岛分离（横“感叹号”的圆点） */}
        <button
          type="button"
          className="search-island"
          aria-label="搜索文章"
          onClick={() => setOpen(true)}
        >
          <svg {...ICON_PROPS}>{ICON.search}</svg>
        </button>
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
          <div className="search-panel">
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
                {results.map((post) => (
                  <li className="search-panel__item" key={post.slug}>
                    <Link to={`/post/${post.slug}`} onClick={close}>
                      <time dateTime={post.date}>{formatDate(post.date)}</time>
                      <span>{post.title}</span>
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
