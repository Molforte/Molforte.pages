/**
 * 极简 frontmatter 解析（站点运行时与构建期共用，够用就好，不引依赖）。
 * 约定：frontmatter 在文件头部 --- 之间，字段单行书写：
 *   title: 标题
 *   date: 2026-09-08
 *   project: 某项目    （用于归档分组）
 *   tags: [随笔, 界面]
 *   draft: false
 * 字符串值两端的引号会被剥掉；[a, b] 会被拆成数组。
 */
export function parseFrontMatter(raw) {
  const body = raw.replace(/^\uFEFF/, '')
  const data = {}
  const m = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/.exec(body)
  if (!m) return { data, content: body }
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(':')
    if (idx <= 0) continue
    const key = line.slice(0, idx).trim()
    if (!key) continue
    let val = line.slice(idx + 1).trim()
    if (val.startsWith('[') && val.endsWith(']')) {
      data[key] = val
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
    } else {
      val = val.replace(/^['"]|['"]$/g, '')
      if (val === 'true') data[key] = true
      else if (val === 'false') data[key] = false
      else if (val !== '') data[key] = val
    }
  }
  return { data, content: body.slice(m[0].length) }
}
