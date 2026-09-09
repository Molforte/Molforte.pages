import { NavLink } from 'react-router-dom'
import { SITE } from '../site.js'

const NAV = [
  { to: '/', label: '主页', end: true },
  { to: '/archive', label: '归档' },
  { to: '/friends', label: '友链' },
  { to: '/about', label: '关于' },
]

const REPO_URL = 'https://github.com/Molforte/Molforte.pages'

export default function Footer() {
  const year = new Date().getFullYear()
  const since = SITE.since
  return (
    <footer className="site-footer">
      <nav className="site-footer__nav" aria-label="页脚导航">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? 'is-active' : undefined)}
          >
            {item.label}
          </NavLink>
        ))}
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
          GitHub ↗
        </a>
      </nav>
      <p className="site-footer__line">
        © {since === year ? year : `${since}–${year}`} {SITE.author} · {SITE.footerNote}
      </p>
    </footer>
  )
}
