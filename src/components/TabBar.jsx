import { NavLink } from 'react-router-dom'

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
}

const TABS = [
  { to: '/', label: '主页', end: true, icon: ICON.home },
  { to: '/archive', label: '归档', icon: ICON.archive },
  { to: '/friends', label: '友链', icon: ICON.friends },
  { to: '/about', label: '关于', icon: ICON.about },
]

export default function TabBar() {
  return (
    <nav className="apptabbar" aria-label="主导航">
      <div className="apptabbar__tabs">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `apptabbar__tab${isActive ? ' is-active' : ''}`
            }
          >
            <svg
              className="apptabbar__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {tab.icon}
            </svg>
            <span className="apptabbar__label">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
