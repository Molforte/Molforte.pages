import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getVolume, getNoteNeighbors, loadNote, formatDate } from '../lib/content.js'
import { renderMarkdown } from '../lib/markdown.js'
import { SITE } from '../site.js'
import NotFound from './NotFound.jsx'
import MarkdownBody from '../components/MarkdownBody.jsx'

/** 单篇笔记：正文按需加载（骨架先用清单里的标题/顺序/日期，正文到了再替换） */
export default function Note() {
  const { volume, note } = useParams()
  const vol = getVolume(volume)
  const meta = vol?.notes.find((n) => n.slug === note) || null
  const [content, setContent] = useState(null) // null = 还在加载

  useEffect(() => {
    // 路由外层带 key，切换笔记会重挂载，所以这里不用手动把 content 重置为 null
    let alive = true
    if (!vol || !meta) return
    loadNote(vol.slug, meta.slug).then((doc) => {
      if (alive) setContent(doc ? doc.content : '')
    })
    return () => {
      alive = false
    }
  }, [vol, meta])

  const html = useMemo(
    () => (content ? renderMarkdown(content, { volume: vol.slug }) : ''),
    [content, vol],
  )

  useEffect(() => {
    if (meta) document.title = `${meta.title} · ${SITE.title}`
  }, [meta])

  if (!vol || !meta) return <NotFound />

  const { prev, next } = getNoteNeighbors(vol.slug, meta.slug)

  return (
    <article className="note">
      <Link className="post__back" to={`/notes/${vol.slug}`}>
        {vol.title}
      </Link>

      <header className="note__head">
        <p className="note__series">
          {vol.series && <span>{vol.series}</span>}
          {meta.order && <span className="note__order">{meta.order}</span>}
        </p>
        <h1 className="note__title">{meta.title}</h1>
        <p className="note__meta">
          <span>
            最后更新 <time dateTime={meta.date}>{formatDate(meta.date)}</time>
          </span>
          {meta.tags.length > 0 && (
            <>
              <span className="sep">·</span>
              <span>{meta.tags.join(' · ')}</span>
            </>
          )}
        </p>
      </header>

      {content === null ? (
        <p className="note__loading">正在取正文…</p>
      ) : (
        <MarkdownBody html={html} />
      )}

      <nav className="post__pager" aria-label="册内上下篇">
        <PagerItem
          to={prev ? `/notes/${vol.slug}/${prev.slug}` : null}
          label="上一篇"
          note={prev}
        />
        <PagerItem
          to={next ? `/notes/${vol.slug}/${next.slug}` : null}
          label="下一篇"
          note={next}
          align="right"
        />
      </nav>
    </article>
  )
}

function PagerItem({ to, label, note, align }) {
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
      <span className="pager-item__label">
        {label}
        {note.order ? ` · ${note.order}` : ''}
      </span>
      <span className="pager-item__title">{note.title}</span>
    </Link>
  )
}
