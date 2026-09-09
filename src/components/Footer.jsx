import { SITE } from '../site.js'

export default function Footer() {
  const year = new Date().getFullYear()
  const since = SITE.since
  return (
    <footer className="site-footer">
      <p className="site-footer__line">
        © {since === year ? year : `${since}–${year}`} {SITE.author} · {SITE.footerNote}
      </p>
    </footer>
  )
}
