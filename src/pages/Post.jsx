import { useEffect, useMemo, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPostBySlug, getNeighbors, formatDate, readingMinutes } from '../lib/content.js'
import { renderMarkdown } from '../lib/markdown.js'
import hljs from '../lib/highlight.js'
import { SITE } from '../site.js'
import NotFound from './NotFound.jsx'

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
    <Link
      className={`pager-item ${align === 'right' ? 'pager-item--right' : ''}`}
      to={to}
    >
      <span className="pager-item__label">{label}</span>
      <span className="pager-item__title">{title}</span>
    </Link>
  )
}

export default function Post() {
  const { slug } = useParams()
  const post = getPostBySlug(slug)
  const bodyRef = useRef(null)

  const html = useMemo(() => (post ? renderMarkdown(post.content) : ''), [post])

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

  // 渲染完成后对代码块做语法高亮
  useEffect(() => {
    if (!bodyRef.current) return
    bodyRef.current.querySelectorAll('pre code').forEach((el) => {
      try {
        hljs.highlightElement(el)
      } catch {
        /* 未知语言时保持原样 */
      }
    })
  }, [html])

  if (!post) return <NotFound />

  const { left, right } = getNeighbors(slug)
  const minutes = readingMinutes(post.content)

  return (
    <article className="col col--post post">
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

      <div
        ref={bodyRef}
        className="post-body"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <nav className="post__pager" aria-label="文章上下篇">
        <PagerItem
          to={left ? `/post/${left.slug}` : null}
          label="较新的文章"
          title={left?.title}
        />
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
