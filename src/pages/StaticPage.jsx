import { useEffect, useMemo } from 'react'
import { getPage } from '../lib/content.js'
import { renderMarkdown } from '../lib/markdown.js'
import { SITE } from '../site.js'
import NotFound from './NotFound.jsx'
import Reveal from '../components/Reveal.jsx'
import MarkdownBody from '../components/MarkdownBody.jsx'

/** 通用静态单页：渲染 content/pages/<slug>.md */
export default function StaticPage({ slug }) {
  const page = useMemo(() => getPage(slug), [slug])
  const html = useMemo(() => (page ? renderMarkdown(page.content) : ''), [page])

  useEffect(() => {
    if (!page) return
    document.title = `${page.title} · ${SITE.title}`
  }, [page])

  if (!page) return <NotFound />

  return (
    <Reveal as="div" className="static-page">
      <header>
        <h1 className="page__title">{page.title}</h1>
      </header>
      <MarkdownBody html={html} />
    </Reveal>
  )
}
