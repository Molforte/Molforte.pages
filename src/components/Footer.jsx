import { Link } from 'react-router-dom'
import { SITE } from '../site.js'

const REPO_URL = 'https://github.com/Molforte/Molforte.pages'

export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="col">
        <div className="site-footer__row">
          <p className="site-footer__brand">
            {SITE.title}
            <span className="sep">·</span>
            <span style={{ fontWeight: 400, color: 'var(--text-2)' }}>
              {SITE.author}
            </span>
          </p>
          <nav className="site-footer__nav" aria-label="页脚导航">
            <Link to="/">全部文章</Link>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </nav>
        </div>
        <p className="site-footer__note">
          © {Math.max(year, SITE.since) === year ? year : `${SITE.since}–${year}`}{' '}
          {SITE.author} · {SITE.footerNote}
        </p>
      </div>
    </footer>
  )
}
