// Obsidian → 站点 同步器
//   默认 **dry-run**：只读 vault、只打印报告、只在 .qa/ 里放转换预览，不写任何内容文件。
//   加 --write 才真正写入文章库：articles/Projects/<册>/（笔记 md + index.md + img/ + files/）
//   --volume=<slug> 只跑某一册；--preview=<文件名> 指定要导出的预览笔记
//
// 站内占位符（渲染时由站点替换，避免把部署 base 写死进内容）：
//   {{IMG:<文件名>}}          → <base>images/<册>/<文件名>
//   {{FILE:<文件名>}}         → <base>files/<册>/<文件名>
//   {{NOTE:<册>/<笔记 slug>}} → <base>notes/<册>/<笔记 slug>（册为空表示该册首页）
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  statSync,
  existsSync as exists,
  mkdirSync,
  copyFileSync,
} from 'node:fs'
import { join, extname, basename, relative, dirname } from 'node:path'
// 与站点同一套字数规则：围栏代码块（``` / ~~~，语言任意）与行内代码都不计入
import { countChars } from '../src/lib/text.js'

const CONFIG = new URL('./obsidian.config.mjs', import.meta.url)
if (!exists(CONFIG)) {
  console.error(
    '缺少 scripts/obsidian.config.mjs（该文件被 gitignore，属于私有配置）。\n' +
      '复制模板即可：  cp scripts/obsidian.config.example.mjs scripts/obsidian.config.mjs',
  )
  process.exit(1)
}
const { VAULT, volumes, singles = [] } = await import(CONFIG.href)

const WRITE = process.argv.includes('--write')
const ONLY = (process.argv.find((a) => a.startsWith('--volume=')) || '').split('=')[1]
const PREVIEW = (process.argv.find((a) => a.startsWith('--preview=')) || '').split('=')[1]

const IMG_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.emf', '.avif'])
const TEXT_EXT = new Set(['.c', '.h', '.m', '.py', '.js', '.ts', '.json', '.txt', '.log', '.csv'])
const RE_FM = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/

// ---------- vault 索引（用于判断链接是「没发布」还是「根本不存在」）----------
const vaultNotes = new Set()
;(function walkNotes(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (['.obsidian', '.trash', '.git', '.smart-env', '.stfolder'].includes(e.name)) continue
    const p = join(dir, e.name)
    if (e.isDirectory()) walkNotes(p)
    else if (extname(e.name).toLowerCase() === '.md') vaultNotes.add(key(e.name))
  }
})(VAULT)

function key(name) {
  return basename(name)
    .replace(/\.[a-z0-9]+$/i, '')
    .toLowerCase()
    .trim()
}
const webName = (name) => name.replace(/\s+/g, '-')

/**
 * 从文件名里拆出「顺序」与「标题」，两种编号都认：
 *   01-LED指示灯的基本操作 / 0a-准备 / 16-DS18B20…     → order=01|0a|16
 *   第一章-前备知识汇总 / 第9章-点亮一个LED / 第十二章-…  → order=1|9|12
 * 角标统一显示成可排序的短编号，标题不带前缀。
 */
const CN_DIGIT = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }
function cnNumber(s) {
  if (/^\d+$/.test(s)) return Number(s)
  if (!/^[一二三四五六七八九十]+$/.test(s)) return null
  if (s === '十') return 10
  if (s.includes('十')) {
    const [a, b] = s.split('十')
    return (a ? CN_DIGIT[a] : 1) * 10 + (b ? CN_DIGIT[b] : 0)
  }
  return CN_DIGIT[s] ?? null
}
function parseOrderTitle(name) {
  // 第X章 / 第X节 / 第X讲（X 是阿拉伯或中文数字）
  const cn = /^第\s*([0-9]+|[一二三四五六七八九十]+)\s*([章节讲课篇])\s*[-_—·.、:：]?\s*(.*)$/.exec(
    name,
  )
  if (cn) {
    const n = cnNumber(cn[1])
    if (n) return { order: String(n), title: (cn[3] || `第${n}${cn[2]}`).trim() }
  }
  const ascii = /^(\d+[a-z]?)\s*[-_—·.、]\s*(.+)$/i.exec(name)
  if (ascii) return { order: ascii[1].toLowerCase(), title: ascii[2].trim() }
  return { order: '', title: name }
}
const yaml = (v) => {
  const s = String(v)
  return /^[[\]{}:#&*!|>'"%@`]|:\s|\s$/.test(s) ? `"${s.replace(/"/g, "'")}"` : s
}
/** 摘要：取第一行「像人话」的正文，去掉链接语法/裸 URL/代码行，压成单行 */
const firstParagraph = (md) => {
  for (const raw of md.split(/\r?\n/)) {
    let line = raw.trim()
    if (!line) continue
    if (/^[|>#`]|^[-*+]\s|\d+\.\s/.test(line)) continue // 标题/引用/列表/代码行
    line = line
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\\([#*_`[\]])/g, '$1') // 还原被转义的行首标签
      .replace(/[*_~`]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/^#+\s*/, '')
      .trim()
    const cjk = (line.match(/[\u4e00-\u9fff]/g) || []).length
    // 寄存器定义/代码/纯标签行：CJK 太少又带代码符号 → 跳过
    if (cjk < 6 && /[{};=()<>]|\bvoid\b|\bunsigned\b|\bsfr\b|\bdefine\b/i.test(line)) continue
    if (cjk < 4) continue
    return line.length > 140 ? `${line.slice(0, 137)}…` : line
  }
  return ''
}
const isoDate = (ms) => new Date(ms).toISOString().slice(0, 10)

// ---------- 单册处理 ----------
function loadVolume(v) {
  const dir = join(VAULT, v.vaultPath)
  if (!exists(dir)) return { error: `目录不存在: ${dir}` }
  const notes = []
  const assets = new Map() // 文件名(小写) → 绝对路径
  const unused = []
  ;(function walk(d) {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.isFile()) {
        if (extname(e.name).toLowerCase() === '.md') {
          if (!v.exclude?.includes(e.name)) notes.push(p)
        } else assets.set(basename(e.name).toLowerCase(), p)
      }
    }
  })(dir)

  const items = notes.map((p) => {
    const raw = readFileSync(p, 'utf8')
    const name = basename(p, '.md')
    const { order, title } = parseOrderTitle(name)
    const fm = RE_FM.exec(raw)
    const fields = {}
    if (fm) {
      for (const line of fm[1].split(/\r?\n/)) {
        const i = line.indexOf(':')
        if (i > 0) fields[line.slice(0, i).trim()] = line.slice(i + 1).trim()
      }
    }
    return {
      path: p,
      file: basename(p),
      name,
      title,
      order,
      slug: name,
      isIndex: /^readme$/i.test(name) || name.startsWith('@'),
      body: fm ? raw.slice(fm[0].length) : raw,
      created: (fields.created || fields.date || '').replace(/["']/g, '').slice(0, 10),
      tags: fields.tags
        ? fields.tags
            .replace(/^\[|\]$/g, '')
            .split(',')
            .map((s) => s.trim().replace(/^["']|["']$/g, ''))
            .filter(Boolean)
        : [],
      mtime: statSync(p).mtimeMs,
    }
  })

  const sortKey = (n) => {
    const m = /^(\d+)([a-z]?)$/.exec(n.order)
    return m ? [0, +m[1], m[2]] : [1, 0, n.name]
  }
  items.sort((a, b) => {
    const [ka, na, sa] = sortKey(a)
    const [kb, nb, sb] = sortKey(b)
    if (ka !== kb) return ka - kb
    if (na !== nb) return na - nb
    return String(sa).localeCompare(String(sb), 'zh')
  })
  return { dir, items, assets, unused }
}

function convert(item, vol, others) {
  const warn = []
  const imgJobs = []
  const fileJobs = []
  let linksOk = 0
  const degraded = []
  const dead = []
  let mathInline
  let mathBlock
  let mermaid

  // 保护代码（行内 + 围栏，反引号与波浪号两种围栏都要），避免把里面的 [[ ]] == # 也改了
  const kept = []
  let out = item.body.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`/g, (m) => {
    kept.push(m)
    return `\uE000${kept.length - 1}\uE000`
  })

  out = out.replace(/%%[\s\S]*?%%/g, '') // Obsidian 注释
  mathBlock = (out.match(/\$\$/g) || []).length
  mathInline = (out.match(/(?<!\$)\$[^$\n]+\$(?!\$)/g) || []).length
  mermaid = (item.body.match(/^\s*(?:```|~~~)mermaid/gm) || []).length // 围栏已被保护，改从原文数

  // 正文首个 H1 与文件名标题重复时去掉，避免页面上重复出现
  const h1 = /^[ \t]*#[ \t]+(.+?)[ \t]*$/m.exec(out)
  if (h1 && h1[1].replace(/\s+/g, '') === item.title.replace(/\s+/g, '')) {
    out = out.replace(h1[0], '')
    warn.push('正文首个 H1 与标题重复，已去掉')
  }

  const resolveNote = (target) => {
    const k = key(target)
    return others.get(k) // { volume, slug, title } 已发布
  }

  // ![[...]] 嵌入
  out = out.replace(/!\[\[([^\]]+)\]\]/g, (m, inner) => {
    const [t0, ...rest] = inner.split('|')
    const target = t0.split('#')[0].trim()
    const asset = vol.assets.get(basename(target).toLowerCase())
    const ext = extname(target).toLowerCase()
    if (asset && IMG_EXT.has(ext)) {
      imgJobs.push(asset)
      return `![${rest.join('|') || basename(target, ext)}]({{IMG:${webName(basename(asset))}}})`
    }
    if (asset && !IMG_EXT.has(ext)) {
      fileJobs.push(asset)
      const inlined = TEXT_EXT.has(ext)
      if (inlined) warn.push(`代码附件 ${basename(asset)} 需要人工决定：内联成代码块还是下载链接`)
      return `[${basename(asset)}]({{FILE:${webName(basename(asset))}}})`
    }
    const hit = resolveNote(target)
    if (hit) {
      warn.push(`整篇嵌入 ![[${target}]] 已降级为链接`)
      linksOk++
      return `[${rest.join('|') || target}]({{NOTE:${hit.volume}/${hit.slug}}})`
    }
    warn.push(`嵌入目标不存在：${target}`)
    return `（缺失：${target}）`
  })

  // [[...]] 链接
  out = out.replace(/\[\[([^\]]+)\]\]/g, (m, inner) => {
    const [t0, ...rest] = inner.split('|')
    const alias = rest.join('|').trim()
    const raw = t0.trim()
    const anchor = raw.includes('#') ? raw.split('#')[1] : ''
    const target = raw.split('#')[0].trim()
    if (!target) return alias || '' // [[#同页锚点]]
    const hit = resolveNote(target)
    if (hit) {
      linksOk++
      if (anchor) warn.push(`锚点 #${anchor} 已丢弃（站内标题 id 还没做）`)
      return `[${alias || hit.title || target}]({{NOTE:${hit.volume}/${hit.slug}}})`
    }
    const display = alias || basename(target)
    if (vaultNotes.has(key(target))) {
      degraded.push(display)
      return display // 目标存在但这册/这篇没发布 → 降级为纯文本，避免泄露标题
    }
    dead.push(display)
    return display
  })

  out = out.replace(/==([^=\n]+)==/g, '<mark>$1</mark>')
  out = out.replace(/^#([\p{L}\p{N}_/-]+)/gmu, '\\#$1') // 行首 #tag → 转义，别被当成标题
  out = out.replace(
    /^>\s*\[!([a-zA-Z]+)\][+-]?\s*(.*)$/gm,
    (m, kind, title) =>
      `> **${kind[0].toUpperCase()}${kind.slice(1)}**${title ? ` · ${title}` : ''}`,
  )
  out = out.replace(/\uE000(\d+)\uE000/g, (m, i) => kept[+i])

  return {
    body: out.trim() + '\n',
    imgJobs: [...new Set(imgJobs)],
    fileJobs: [...new Set(fileJobs)],
    linksOk,
    degraded,
    dead,
    mathInline,
    mathBlock: mathBlock / 2,
    mermaid,
    warn,
  }
}

// ---------- 主流程 ----------
const report = { vault: VAULT, mode: WRITE ? 'write' : 'dry-run', volumes: [] }
const volList = volumes.filter((v) => !ONLY || v.slug === ONLY)
if (!volList.length) {
  console.error(ONLY ? `配置里没有 slug=${ONLY} 的册` : '配置里一册都没有')
  process.exit(1)
}

for (const v of volList) {
  const loaded = loadVolume(v)
  if (loaded.error) {
    console.error(`✗ ${v.slug}: ${loaded.error}`)
    continue
  }
  // 已发布笔记索引（本册 + 其他册）
  const others = new Map()
  for (const w of volList) {
    const other = w.slug === v.slug ? loaded : loadVolume(w)
    if (other.error) continue
    for (const it of other.items)
      others.set(key(it.name), {
        volume: w.slug,
        slug: it.isIndex ? '' : it.slug,
        title: it.title,
      })
  }

  const rows = []
  const noteMeta = []
  const allImages = new Set()
  const allFiles = new Set()
  let previewText = ''
  let indexFull = '' // 册首页（README / @ 索引页）
  for (const item of loaded.items) {
    const conv = convert(item, { ...v, assets: loaded.assets }, others)
    conv.imgJobs.forEach((p) => allImages.add(p))
    conv.fileJobs.forEach((p) => allFiles.add(p))
    const summary = firstParagraph(conv.body)
    const date = item.created || isoDate(item.mtime)
    const isIndex = item.isIndex
    const outPath = isIndex
      ? `articles/Projects/${v.slug}/index.md`
      : `articles/Projects/${v.slug}/${item.slug}.md`
    const title = isIndex ? v.title || basename(v.vaultPath) : item.title
    const fm = [
      '---',
      `title: ${yaml(title)}`,
      `date: ${date}`,
      `series: ${yaml(v.series || '')}`,
      `project: ${yaml(v.project || v.title || '')}`,
      `volume: ${v.slug}`,
      !isIndex && item.order ? `order: "${item.order}"` : null,
      `tags: [${item.tags.join(', ')}]`,
      `summary: ${yaml(summary)}`,
      `source: ${yaml(relative(VAULT, item.path).replace(/\\/g, '/'))}`,
      '---',
      '',
      '',
    ]
      .filter((x) => x !== null)
      .join('\n')
    const full = fm + conv.body
    if (isIndex) indexFull = full
    else
      noteMeta.push({
        slug: item.slug,
        title,
        order: item.order || '',
        date,
        tags: item.tags,
        summary,
      })
    rows.push({
      order: isIndex ? '—' : item.order || '—',
      file: item.file,
      title,
      chars: countChars(conv.body),
      img: conv.imgJobs.length,
      file2: conv.fileJobs.length,
      links: conv.linksOk,
      degraded: conv.degraded.length,
      dead: conv.dead.length,
      math: conv.mathInline + conv.mathBlock * 2,
      mermaid: conv.mermaid,
      out: outPath,
      warn: conv.warn,
    })
    if (PREVIEW ? item.file === PREVIEW : !previewText && !isIndex) previewText = full
    if (WRITE && !isIndex) {
      const abs = join(process.cwd(), outPath)
      mkdirSync(join(abs, '..'), { recursive: true })
      writeFileSync(abs, full, 'utf8')
    }
    if (WRITE) {
      // 图片/附件跟着册走：articles/Projects/<册>/img|files/
      // （构建期由 vite 的 materialize-images 插件物化到 public/images|files/）
      for (const p of conv.imgJobs) {
        const dst = join(process.cwd(), 'articles/Projects', v.slug, 'img', webName(basename(p)))
        mkdirSync(join(dst, '..'), { recursive: true })
        copyFileSync(p, dst)
      }
      for (const p of conv.fileJobs) {
        const dst = join(process.cwd(), 'articles/Projects', v.slug, 'files', webName(basename(p)))
        mkdirSync(join(dst, '..'), { recursive: true })
        copyFileSync(p, dst)
      }
    }
  }

  // 册首页：vault 里没有 README/@ 索引页时也要有一个（否则栏目没有落地页）
  if (!indexFull) {
    indexFull = [
      '---',
      `title: ${yaml(v.title || basename(v.vaultPath))}`,
      `date: ${noteMeta.at(0)?.date || isoDate(Date.now())}`,
      `series: ${yaml(v.series || '')}`,
      `project: ${yaml(v.project || v.title || '')}`,
      `volume: ${v.slug}`,
      `tags: []`,
      `summary: ${yaml(`《${v.title || basename(v.vaultPath)}》共 ${noteMeta.length} 篇笔记。`)}`,
      'source: (自动生成)',
      '---',
      '',
    ].join('\n')
  }
  // 说明：册清单（标题/顺序/日期/摘要）不落盘，改由 vite 插件在构建期扫 frontmatter 生成，
  // 所以内容目录里只要多一个 .md 就会出现，不需要重跑同步脚本。
  if (WRITE) {
    const dir = join(process.cwd(), 'articles/Projects', v.slug)
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'index.md'), indexFull, 'utf8')
  }

  const imgBytes = [...allImages].reduce((n, p) => n + statSync(p).size, 0)
  report.volumes.push({
    slug: v.slug,
    title: v.title || basename(v.vaultPath),
    vaultPath: v.vaultPath,
    notes: rows.length,
    images: { count: allImages.size, mb: +(imgBytes / 1048576).toFixed(1) },
    files: allFiles.size,
    rows,
  })

  console.log(`\n=== ${v.title || v.slug}  (${v.vaultPath}) ===`)
  console.log(
    `  ${rows.length} 篇 · 图片 ${allImages.size} 张/${(imgBytes / 1048576).toFixed(1)}MB · 附件 ${allFiles.size} 个 · ${WRITE ? '已写入' : 'dry-run（未写任何文件）'}`,
  )
  console.log('  顺序 笔记                                    字    图 链 降 死 公式 出路径')
  for (const r of rows) {
    console.log(
      `  ${r.order.padEnd(4)} ${r.file.padEnd(40).slice(0, 40)} ${String(r.chars).padStart(4)} ${String(r.img).padStart(3)} ${String(r.links).padStart(2)} ${String(r.degraded).padStart(2)} ${String(r.dead).padStart(2)} ${String(r.math).padStart(4)} ${r.out}`,
    )
  }
  const warns = rows.flatMap((r) => r.warn.map((w) => `${r.file}: ${w}`))
  if (warns.length) {
    console.log('  --- 需要注意 ---')
    warns.slice(0, 20).forEach((w) => console.log('   ', w))
    if (warns.length > 20)
      console.log(`    …还有 ${warns.length - 20} 条，见 .qa/obsidian-report.json`)
  }
  if (previewText) {
    mkdirSync('.qa', { recursive: true })
    const f = `.qa/preview-${v.slug}.md`
    writeFileSync(f, previewText, 'utf8')
    console.log(`  转换预览（第一篇）→ ${f}`)
  }
}

// ---------- 孤品：单篇指定文件（可跨 vault）----------
if (singles.length && !ONLY) {
  // 已发布笔记索引，供 [[链接]] 解析
  const allNotes = new Map()
  for (const w of volList) {
    const other = loadVolume(w)
    if (other.error) continue
    for (const it of other.items)
      allNotes.set(key(it.name), {
        volume: w.slug,
        slug: it.isIndex ? '' : it.slug,
        title: it.title,
      })
  }

  console.log('\n=== 孤品（单篇）===')
  for (const s of singles) {
    const abs = s.file
    if (!exists(abs)) {
      console.error(`  ✗ 找不到文件: ${abs}`)
      continue
    }
    const where = s.as === 'fragment' ? 'Fragments' : 'Articles'
    // 同目录（含子目录，如 img/）里的图片/附件
    const assets = new Map()
    ;(function scan(d, depth = 0) {
      for (const e of readdirSync(d, { withFileTypes: true })) {
        if (e.name.startsWith('.')) continue
        const p = join(d, e.name)
        if (e.isDirectory()) {
          if (depth < 2) scan(p, depth + 1)
        } else assets.set(basename(e.name).toLowerCase(), p)
      }
    })(dirname(abs))

    const raw = readFileSync(abs, 'utf8')
    const fm = RE_FM.exec(raw)
    const fields = {}
    if (fm) {
      for (const line of fm[1].split(/\r?\n/)) {
        const i = line.indexOf(':')
        if (i > 0) fields[line.slice(0, i).trim()] = line.slice(i + 1).trim()
      }
    }
    const name = basename(abs, '.md')
    const item = {
      path: abs,
      file: basename(abs),
      name,
      title: s.title || parseOrderTitle(name).title,
      order: '',
      slug: s.slug || name,
      isIndex: false,
      body: fm ? raw.slice(fm[0].length) : raw,
      created: (s.date || fields.created || fields.date || '').replace(/["']/g, '').slice(0, 10),
      tags:
        s.tags ||
        (fields.tags
          ? fields.tags
              .replace(/^\[|\]$/g, '')
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : []),
      mtime: statSync(abs).mtimeMs,
    }
    const conv = convert(item, { slug: where.toLowerCase(), assets }, allNotes)
    const outPath = `articles/${where}/${item.slug}.md`
    const full =
      [
        '---',
        `title: ${yaml(item.title)}`,
        `date: ${item.created || isoDate(item.mtime)}`,
        `tags: [${item.tags.join(', ')}]`,
        `summary: ${yaml(firstParagraph(conv.body))}`,
        `source: ${yaml(s.vault ? relative(s.vault, abs).replace(/\\/g, '/') : basename(abs))}`,
        '---',
        '',
        '',
      ].join('\n') + conv.body

    console.log(
      `  ${where}/${item.slug}.md  ${countChars(conv.body)} 字 · 图 ${conv.imgJobs.length} · 链 ${conv.linksOk} 降 ${conv.degraded.length} 死 ${conv.dead.length} · 公式 ${conv.mathInline + conv.mathBlock * 2}`,
    )
    conv.warn.forEach((w) => console.log('    !', w))

    if (WRITE) {
      const out = join(process.cwd(), outPath)
      mkdirSync(dirname(out), { recursive: true })
      writeFileSync(out, full, 'utf8')
      for (const p of conv.imgJobs) {
        const dst = join(process.cwd(), 'articles', where, 'img', webName(basename(p)))
        mkdirSync(dirname(dst), { recursive: true })
        copyFileSync(p, dst)
      }
      for (const p of conv.fileJobs) {
        const dst = join(process.cwd(), 'articles', where, 'files', webName(basename(p)))
        mkdirSync(dirname(dst), { recursive: true })
        copyFileSync(p, dst)
      }
    }
    report.singles = report.singles || []
    report.singles.push({
      file: abs,
      as: s.as || 'article',
      out: outPath,
      chars: countChars(conv.body),
    })
  }
}

mkdirSync('.qa', { recursive: true })
writeFileSync('.qa/obsidian-report.json', JSON.stringify(report, null, 2), 'utf8')
console.log(
  `\n完整报告 → .qa/obsidian-report.json${WRITE ? '' : '（dry-run：没有写入 content/ 与 public/）'}`,
)
