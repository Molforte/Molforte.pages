import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPostBySlug, getNeighbors, loadArticle, formatDate } from '../lib/content.js'
import { renderMarkdown } from '../lib/markdown.js'
import { SITE } from '../site.js'
import NotFound from './NotFound.jsx'
import MarkdownBody from '../components/MarkdownBody.jsx'

function PagerItem({ to, label, title, align }) {
  if (!to) {
    return (
      <span
        className={`pager-item pager-item--empty ${align === 'right' ? 'pager-item--right' : ''}`}
        aria-hidden="true"
      >
        <span className="pager-item__label">{label}</span>
      </span>
    )
  }
  return (
    <Link className={`pager-item ${align === 'right' ? 'pager-item--right' : ''}`} to={to}>
      <span className="pager-item__label">{label}</span>
      <span className="pager-item__title">{title}</span>
    </Link>
  )
}

export default function Post() {
  const { slug } = useParams()
  const post = getPostBySlug(slug)
  const [content, setContent] = useState(null) // null = 还在加载

  // 正文惰性加载（清单来自构建期，正文只在进这一篇时下载）
  useEffect(() => {
    let alive = true
    if (!post) return
    loadArticle(post.slug).then((doc) => {
      if (alive) setContent(doc ? doc.content : '')
    })
    return () => {
      alive = false
    }
  }, [post])

  const html = useMemo(
    () => (content ? renderMarkdown(content, { volume: 'articles' }) : ''),
    [content],
  )

  useEffect(() => {
    if (!post) return
    document.title = `${post.title} · ${SITE.title}`
    const desc = document.querySelector('meta[name="description"]')
    const prev = desc?.getAttribute('content')
    if (desc && post.summary) desc.setAttribute('content', post.summary)
    return () => {
      if (desc && prev) desc.setAttribute('content', prev)
    }
  }, [post])

  if (!post) return <NotFound />

  const { left, right } = getNeighbors(slug)
  const minutes = post.minutes

  return (
    <article className="post">
      <Link className="post__back" to="/">
        全部文章
      </Link>

      <header>
        <h1 className="post__title">{post.title}</h1>
        <p className="post__meta">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          {post.tags.length > 0 && (
            <>
              <span className="sep">·</span>
              <span>{post.tags.join(' · ')}</span>
            </>
          )}
          <span className="sep">·</span>
          <span>约 {minutes} 分钟读完</span>
        </p>
      </header>

      {content === null ? (
        <p className="note__loading">正在取正文…</p>
      ) : (
        <MarkdownBody html={html} />
      )}

      <nav className="post__pager" aria-label="文章上下篇">
        <PagerItem to={left ? `/post/${left.slug}` : null} label="较新的文章" title={left?.title} />
        <PagerItem
          to={right ? `/post/${right.slug}` : null}
          label="较旧的文章"
          title={right?.title}
          align="right"
        />
      </nav>
    </article>
  )
}
