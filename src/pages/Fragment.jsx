import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getFragment, loadFragment, formatDate } from '../lib/content.js'
import { renderMarkdown } from '../lib/markdown.js'
import { SITE } from '../site.js'
import NotFound from './NotFound.jsx'
import MarkdownBody from '../components/MarkdownBody.jsx'

/** 残页：articles/Fragments/ 下的单篇（正文按需加载） */
export default function Fragment() {
  const { slug } = useParams()
  const meta = getFragment(slug)
  const [content, setContent] = useState(null)

  useEffect(() => {
    let alive = true
    if (!meta) return
    loadFragment(meta.slug).then((doc) => {
      if (alive) setContent(doc ? doc.content : '')
    })
    return () => {
      alive = false
    }
  }, [meta])

  const html = useMemo(() => (content ? renderMarkdown(content) : ''), [content])

  useEffect(() => {
    if (meta) document.title = `${meta.title} · ${SITE.title}`
  }, [meta])

  if (!meta) return <NotFound />

  return (
    <article className="note">
      <header className="note__head">
        <p className="note__series">碎片</p>
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
    </article>
  )
}
