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
          <li className="post-card" key={post.slug}>
            <Link className="post-card__link" to={`/post/${post.slug}`}>
              <h2 className="post-card__title">{post.title}</h2>
              <p className="post-card__summary">{post.summary}</p>
              <p className="post-card__meta">
                <time className="post-card__date" dateTime={post.date}>
                  {formatDate(post.date)}
                </time>
                {post.tags.map((tag) => (
                  <span className="post-card__tag" key={tag}>
                    {tag}
                  </span>
                ))}
                <span className="post-card__read">
                  约 {readingMinutes(post.content)} 分钟
                </span>
              </p>
            </Link>
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
