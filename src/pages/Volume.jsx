import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getVolume, getVolumeIntro, formatDate } from '../lib/content.js'
import { renderMarkdown } from '../lib/markdown.js'
import { SITE } from '../site.js'
import NotFound from './NotFound.jsx'
import Reveal from '../components/Reveal.jsx'
import MarkdownBody from '../components/MarkdownBody.jsx'

/** 册首页：一册 = 归档里的一个栏目。上面是它的 README/目录内容，下面是按编号排的笔记 */
export default function Volume() {
  const { volume } = useParams()
  const vol = getVolume(volume)
  const intro = useMemo(() => (vol ? getVolumeIntro(vol.slug) : ''), [vol])
  const html = useMemo(
    () => (intro ? renderMarkdown(intro, { volume: vol.slug }) : ''),
    [intro, vol],
  )

  useEffect(() => {
    if (vol) document.title = `${vol.title} · ${SITE.title}`
  }, [vol])

  if (!vol) return <NotFound />

  return (
    <article className="volume">
      <Link className="post__back" to="/archive">
        全部栏目
      </Link>

      <header className="volume__head">
        {vol.series && <p className="volume__series">{vol.series}</p>}
        <h1 className="volume__title">{vol.title}</h1>
        <p className="volume__meta">
          <span>{vol.notes.length} 篇</span>
          {vol.updated && (
            <>
              <span className="sep">·</span>
              <span>
                最后更新 <time dateTime={vol.updated}>{formatDate(vol.updated)}</time>
              </span>
            </>
          )}
        </p>
      </header>

      {html && (
        <Reveal as="section" className="volume__intro">
          <MarkdownBody html={html} className="post-body volume__intro-body" />
        </Reveal>
      )}

      <ol className="note-list">
        {vol.notes.map((note, index) => (
          <Reveal as="li" className="note-row" key={note.slug} i={Math.min(index, 8)}>
            <Link className="note-row__link" to={`/notes/${vol.slug}/${note.slug}`}>
              <span className="note-row__order" aria-hidden="true">
                {note.order || '·'}
              </span>
              <span className="note-row__title">{note.title}</span>
              <span className="note-row__date">
                <time dateTime={note.date}>{formatDate(note.date)}</time>
              </span>
            </Link>
          </Reveal>
        ))}
      </ol>
    </article>
  )
}
