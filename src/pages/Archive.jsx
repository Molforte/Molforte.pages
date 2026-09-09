import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { posts, formatDate, groupByProject } from '../lib/content.js'
import { SITE } from '../site.js'

export default function Archive() {
  useEffect(() => {
    document.title = `归档 · ${SITE.title}`
  }, [])

  const groups = groupByProject()
  const hasProjects = groups.some((g) => g.name !== '未分类')

  return (
    <div className="archive">
      <h1 className="archive__title">归档</h1>
      <p className="archive__note">
        共 {posts.length} 篇文章，按项目分组{hasProjects ? '' : '（目前还没有分类）'}。
        {!hasProjects &&
          '给文章的 frontmatter 加上 project 字段（例如 project: 本站搭建），这里就会按项目归档。'}
      </p>

      {posts.length === 0 && (
        <p className="archive-empty">还没有文章。</p>
      )}

      {groups.map((group) => (
        <section className="project-group" key={group.name}>
          <h2 className="project-group__name">
            {group.name}
            <span className="project-group__count">{group.items.length}</span>
          </h2>
          <ul className="archive-list">
            {group.items.map((post) => (
              <li className="archive-item" key={post.slug}>
                <time dateTime={post.date}>
                  {post.date ? formatDate(post.date) : ''}
                </time>
                <Link to={`/post/${post.slug}`}>{post.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
