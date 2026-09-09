import { Link, NavLink } from 'react-router-dom'
import { SITE } from '../site.js'

const NAV = [
  { to: '/', label: '主页', end: true },
  { to: '/archive', label: '归档' },
  { to: '/friends', label: '友链' },
  { to: '/about', label: '关于' },
]

const REPO_URL = 'https://github.com/Molforte/Molforte.pages'

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <p className="sidebar__brand">
        <Link to="/">{SITE.title}</Link>
      </p>
      <p className="sidebar__author">{SITE.author}</p>

      <nav className="sidebar__nav" aria-label="主导航">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `sidebar__link${isActive ? ' is-active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <p className="sidebar__foot">
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
          GitHub ↗
        </a>
      </p>
    </aside>
  )
}
