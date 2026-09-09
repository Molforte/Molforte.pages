import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { posts, formatDate, readingMinutes } from '../lib/content.js'
import { SITE } from '../site.js'

export default function Home() {
  useEffect(() => {
    document.title = `${SITE.title} · ${SITE.author}`
  }, [])

  return (
    <>
      <header className="masthead">
        <h1 className="masthead__title">{SITE.title}</h1>
        <p className="masthead__tagline">{SITE.tagline}</p>
      </header>

      <ol className="post-index">
        {posts.map((post) => (
          <li className="timeline-item" key={post.slug}>
            <span className="timeline-item__dot" aria-hidden="true" />
            <div className="timeline-item__body">
              <time className="timeline-item__date" dateTime={post.date}>
                {formatDate(post.date)}
              </time>
              <h2 className="timeline-item__title">
                <Link to={`/post/${post.slug}`}>{post.title}</Link>
              </h2>
              <p className="timeline-item__summary">{post.summary}</p>
              <p className="timeline-item__meta">
                {post.tags.length > 0 && (
                  <>
                    <span>{post.tags.join(' · ')}</span>
                    <span className="sep">·</span>
                  </>
                )}
                <span>约 {readingMinutes(post.content)} 分钟</span>
              </p>
            </div>
          </li>
        ))}
      </ol>

      {posts.length === 0 && (
        <p className="home-foot">还没有文章。往 content/ 里放一篇 Markdown 就有了。</p>
      )}

      {posts.length > 0 && (
        <p className="home-foot">共 {posts.length} 篇文章 · 按时间倒序</p>
      )}
    </>
  )
}
