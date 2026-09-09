import { posts } from '../lib/content.js'
import { SITE } from '../site.js'

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

function nearestWork(chars) {
  if (chars <= 0) return null
  return WORKS.reduce((best, w) =>
    Math.abs(w.chars - chars) < Math.abs(best.chars - chars) ? w : best,
  )
}

export default function Footer() {
  const year = new Date().getFullYear()
  const since = SITE.since

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
      <p className="site-footer__line">
        © {since === year ? year : `${since}–${year}`} {SITE.author} · {SITE.footerNote}
      </p>
      <p className="site-footer__stat">{stat}</p>
    </footer>
  )
}
