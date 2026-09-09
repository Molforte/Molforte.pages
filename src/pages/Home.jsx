import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { posts, formatDate, readingMinutes } from '../lib/content.js'
import { SITE } from '../site.js'

export default function Home() {
  useEffect(() => {
    document.title = `${SITE.title} · ${SITE.author}`
  }, [])

  return (
    <div className="col">
      <header className="masthead">
        <h1 className="masthead__title">{SITE.title}</h1>
        <p className="masthead__tagline">{SITE.tagline}</p>
      </header>

      <ol className="post-index">
        {posts.map((post) => (
          <li className="post-item" key={post.slug}>
            <h2 className="post-item__title">
              <Link to={`/post/${post.slug}`}>{post.title}</Link>
            </h2>
            <p className="post-item__meta">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span className="sep">·</span>
              {post.tags.length > 0 && (
                <>
                  <span>{post.tags.join(' · ')}</span>
                  <span className="sep">·</span>
                </>
              )}
              <span>阅读约 {readingMinutes(post.content)} 分钟</span>
            </p>
          </li>
        ))}
      </ol>

      {posts.length === 0 && (
        <p className="home-foot">还没有文章。往 content/ 里放一篇 Markdown 就有了。</p>
      )}

      <p className="home-foot">
        共 {posts.length} 篇文章 · 按时间倒序
      </p>
    </div>
  )
}
