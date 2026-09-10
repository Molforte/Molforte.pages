import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { posts, formatDate, volumes, getVolumeIntro } from '../lib/content.js'
import { SITE } from '../site.js'
import BlendCursor from '../components/BlendCursor.jsx'

/** 去掉 Markdown 语法取纯文本摘要（与归档页栏目卡一致） */
function excerpt(md, n = 84) {
  const t = String(md)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\$\$?[^$\n]*\$\$?/g, ' ')
    .replace(/^\s*#+\s*/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/[*_`>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return t.length > n ? `${t.slice(0, n)}…` : t
}

const HOME_COLUMNS = 2 // 首页只放最近两个项目，其余去归档

export default function Home() {
  useEffect(() => {
    document.title = `${SITE.title} · ${SITE.author}`
  }, [])

  const shown = volumes.slice(0, HOME_COLUMNS)
  const restColumns = volumes.length - shown.length

  return (
    <>
      <header className="masthead">
        <BlendCursor>
          <h1 className="masthead__title">
            <span data-cursor="blend">{SITE.title}</span>
          </h1>
        </BlendCursor>
        <p className="masthead__tagline">{SITE.tagline}</p>
      </header>

      {/* 一、文章在前 */}
      {posts.length > 0 && (
        <section className="home-section">
          <h2 className="home-section__title">文章</h2>
          <ol className="post-index">
            {posts.map((post, index) => (
              <li className="post-card" key={post.slug} style={{ '--i': Math.min(index, 8) }}>
                <Link className="post-card__link" to={`/post/${post.slug}`}>
                  <h3 className="post-card__title">{post.title}</h3>
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
                    <span className="post-card__read">约 {post.minutes} 分钟</span>
                  </p>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 二、项目（栏目）只放最近两个，其余去归档 */}
      {shown.length > 0 && (
        <section className="home-section">
          <h2 className="home-section__title">项目</h2>
          <div className="columns">
            {shown.map((v, index) => (
              <article className="column-card" key={v.slug} style={{ '--i': Math.min(index, 6) }}>
                <Link className="column-card__link" to={`/notes/${v.slug}`}>
                  <p className="column-card__series">
                    {v.series && <span>{v.series}</span>}
                    <span className="column-card__count">{v.notes.length} 篇</span>
                  </p>
                  <h3 className="column-card__title">{v.title}</h3>
                  <p className="column-card__excerpt">{excerpt(getVolumeIntro(v.slug))}</p>
                  <p className="column-card__foot">
                    <span>
                      最后更新 <time dateTime={v.updated}>{formatDate(v.updated)}</time>
                    </span>
                  </p>
                </Link>
              </article>
            ))}
          </div>
          <p className="home-foot">
            <Link to="/archive">
              {restColumns > 0 ? `还有 ${restColumns} 个项目 · 全部项目 →` : '全部项目 →'}
            </Link>
          </p>
        </section>
      )}

      {volumes.length > 0 && (
        <p className="home-foot">
          {volumes.length > HOME_COLUMNS ? (
            <Link to="/archive">共 {volumes.length} 个栏目 · 全部栏目 →</Link>
          ) : (
            <Link to="/archive">共 {volumes.length} 个栏目 · 去归档 →</Link>
          )}
        </p>
      )}
    </>
  )
}
