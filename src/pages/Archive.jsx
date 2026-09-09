import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { posts, formatDate, groupByProject, readingMinutes } from '../lib/content.js'
import { SITE } from '../site.js'

export default function Archive() {
  useEffect(() => {
    document.title = `归档 · ${SITE.title}`
  }, [])

  const groups = groupByProject()
  const projectCount = groups.filter((g) => g.name !== '未分类').length
  const totalChars = posts.reduce(
    (sum, p) => sum + (p.content.match(/[\u4e00-\u9fff]/g) || []).length,
    0,
  )

  return (
    <div className="archive">
      {/* 巨大的卡片（页面感 hero） */}
      <section className="archive-hero">
        <h1 className="archive-hero__title">归档</h1>
        <p className="archive-hero__desc">
          {projectCount > 0
            ? '按项目归档，项目内按时间倒序。'
            : '按项目归档。给文章的 frontmatter 加上 project 字段（例如 project: 本站搭建），这里就会分好类。'}
        </p>
        <dl className="archive-hero__stats">
          <div className="archive-stat">
            <dt>文章</dt>
            <dd>{posts.length}</dd>
          </div>
          <div className="archive-stat">
            <dt>项目</dt>
            <dd>{projectCount}</dd>
          </div>
          <div className="archive-stat">
            <dt>字数</dt>
            <dd>{totalChars.toLocaleString('zh-CN')}</dd>
          </div>
        </dl>
      </section>

      {posts.length === 0 && <p className="archive-empty">还没有文章。</p>}

      {/* 每个项目一张大卡片，标题与条目都包在里面 */}
      {groups.map((group) => (
        <section className="archive-group-card" key={group.name}>
          <header className="archive-group-card__head">
            <h2 className="archive-group-card__name">{group.name}</h2>
            <span className="archive-group-card__count">{group.items.length} 篇</span>
          </header>
          <ol className="archive-rows">
            {group.items.map((post) => (
              <li className="archive-row" key={post.slug}>
                <Link className="archive-row__link" to={`/post/${post.slug}`}>
                  <time className="archive-row__date" dateTime={post.date}>
                    {formatDate(post.date)}
                  </time>
                  <span className="archive-row__title">{post.title}</span>
                  <span className="archive-row__meta">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span className="archive-row__tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                    <span className="archive-row__read">
                      约 {readingMinutes(post.content)} 分钟
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
