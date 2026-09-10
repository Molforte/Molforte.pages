import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  posts,
  fragments,
  formatDate,
  groupByProject,
  countAllChars,
  volumes,
  getVolumeIntro,
} from '../lib/content.js'
import { SITE } from '../site.js'
import Reveal from '../components/Reveal.jsx'

/** 去掉 Markdown 语法，给栏目卡片取一段纯文本摘要 */
function plain(md) {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\$\$?[^$\n]*\$\$?/g, ' ')
    .replace(/^\s*#+\s*/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/[*_`>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function excerpt(md, n = 84) {
  const t = plain(md)
  return t.length > n ? `${t.slice(0, n)}…` : t
}

export default function Archive() {
  useEffect(() => {
    document.title = `归档 · ${SITE.title}`
  }, [])

  const groups = groupByProject()
  const noteCount = volumes.reduce((sum, v) => sum + v.notes.length, 0)
  // 字数 = 文章 + 笔记，口径统一：只算正文（围栏代码块与行内代码不计）
  const totalChars = countAllChars()

  return (
    <div className="archive">
      <section className="archive-hero">
        <h1 className="archive-hero__title">归档</h1>
        <p className="archive-hero__desc">一册一个栏目：栏目首页是它的目录，笔记按编号顺序排。</p>
        <dl className="archive-hero__stats">
          <div className="archive-stat">
            <dt>栏目</dt>
            <dd>{volumes.length}</dd>
          </div>
          <div className="archive-stat">
            <dt>笔记</dt>
            <dd>{noteCount}</dd>
          </div>
          {posts.length > 0 && (
            <div className="archive-stat">
              <dt>文章</dt>
              <dd>{posts.length}</dd>
            </div>
          )}
          {fragments.length > 0 && (
            <div className="archive-stat">
              <dt>碎片</dt>
              <dd>{fragments.length}</dd>
            </div>
          )}
          <div className="archive-stat">
            <dt>字数</dt>
            <dd>{totalChars.toLocaleString('zh-CN')}</dd>
          </div>
        </dl>
      </section>

      {volumes.length > 0 && (
        <section className="columns">
          {volumes.map((v, index) => (
            <Reveal as="article" className="column-card" key={v.slug} i={Math.min(index, 6)}>
              <Link className="column-card__link" to={`/notes/${v.slug}`}>
                <p className="column-card__series">
                  {v.series && <span>{v.series}</span>}
                  <span className="column-card__count">{v.notes.length} 篇</span>
                </p>
                <h2 className="column-card__title">{v.title}</h2>
                <p className="column-card__excerpt">{excerpt(getVolumeIntro(v.slug))}</p>
                <p className="column-card__foot">
                  <span>
                    最后更新 <time dateTime={v.updated}>{formatDate(v.updated)}</time>
                  </span>
                </p>
              </Link>
            </Reveal>
          ))}
        </section>
      )}

      {posts.length === 0 && <p className="archive-empty">还没有文章。</p>}

      {groups.length > 0 && (
        <section className="archive-posts">
          <h2 className="archive-section-title">文章</h2>
          {groups.map((group, index) => (
            <Reveal
              as="section"
              className="archive-group-card"
              key={group.name}
              i={Math.min(index, 6)}
            >
              <header className="archive-group-card__head">
                <h3 className="archive-group-card__name">{group.name}</h3>
                <span className="archive-group-card__count">{group.items.length} 篇</span>
              </header>
              <ol className="archive-rows">
                {group.items.map((post) => (
                  <li className="archive-row" key={post.slug}>
                    <Link className="archive-row__link" to={`/post/${post.slug}`}>
                      <span className="archive-row__title">{post.title}</span>
                      <span className="archive-row__meta">
                        {post.tags.slice(0, 2).map((tag) => (
                          <span className="archive-row__tag" key={tag}>
                            {tag}
                          </span>
                        ))}
                        <span className="archive-row__read">约 {post.minutes} 分钟</span>
                        <time className="archive-row__date" dateTime={post.date}>
                          {formatDate(post.date)}
                        </time>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </Reveal>
          ))}
        </section>
      )}

      {fragments.length > 0 && (
        <section className="archive-posts">
          <h2 className="archive-section-title">碎片</h2>
          <ol className="note-list">
            {fragments.map((f, index) => (
              <Reveal as="li" className="note-row" key={f.slug} i={Math.min(index, 8)}>
                <Link className="note-row__link" to={`/fragment/${f.slug}`}>
                  <span className="note-row__title">{f.title}</span>
                  <span className="note-row__date">
                    <time dateTime={f.date}>{formatDate(f.date)}</time>
                  </span>
                </Link>
              </Reveal>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
