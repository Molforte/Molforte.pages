import { posts } from '../lib/content.js'
import { SITE } from '../site.js'
import { useTheme } from '../theme.js'

// 一些常见中文作品的约略字数，用来给“已经写了多少字”找个参照
const WORKS = [
  { author: '朱自清', name: '《背影》', chars: 1300 },
  { author: '鲁迅', name: '《孔乙己》', chars: 2700 },
  { author: '鲁迅', name: '《故乡》', chars: 4400 },
  { author: '鲁迅', name: '《祝福》', chars: 5200 },
  { author: '张爱玲', name: '《倾城之恋》', chars: 23000 },
  { author: '沈从文', name: '《边城》', chars: 43000 },
  { author: '余华', name: '《活着》', chars: 120000 },
  { author: '钱锺书', name: '《围城》', chars: 230000 },
  { author: '曹雪芹', name: '《红楼梦》', chars: 960000 },
  { author: '路遥', name: '《平凡的世界》', chars: 1000000 },
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

function SunIcon() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="4.4" />
      <path d="M12 3.2v2M12 18.8v2M3.2 12h2M18.8 12h2M5.8 5.8l1.4 1.4M16.8 16.8l1.4 1.4M18.2 5.8l-1.4 1.4M7.2 16.8l-1.4 1.4" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
    </svg>
  )
}

function nearestWork(chars) {
  if (chars <= 0) return null
  return WORKS.reduce((best, w) =>
    Math.abs(w.chars - chars) < Math.abs(best.chars - chars) ? w : best,
  )
}

export default function Footer() {
  const year = new Date().getFullYear()
  const since = SITE.since
  const { theme, toggle } = useTheme()

  const total = posts.reduce(
    (sum, p) => sum + (p.content.match(/[\u4e00-\u9fff]/g) || []).length,
    0,
  )
  const work = nearestWork(total)
  const stat = work
    ? `摩尔已经写完了 ${total.toLocaleString('zh-CN')} 字，好像写完了一本 ${work.author}${work.name} 了啊。`
    : '摩尔还没有开始写……'

  return (
    <footer className="site-footer">
      <div className="site-footer__row">
        <p className="site-footer__line">
          © {since === year ? year : `${since}–${year}`} {SITE.author} · {SITE.footerNote}
        </p>
        <button
          type="button"
          className="theme-toggle"
          onClick={toggle}
          aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
          title={theme === 'dark' ? '浅色' : '深色'}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
      <p className="site-footer__stat">{stat}</p>
    </footer>
  )
}
