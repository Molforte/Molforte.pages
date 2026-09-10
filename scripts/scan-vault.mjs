// Obsidian vault 全库盘点（只读）：给同步做「候选清单」用
//   node scripts/scan-vault.mjs "D:\\path\\to\\vault"
//  - wiki 链接按 basename 解析，区分「图片嵌入」与「整篇嵌入(transclusion)」
//  - 统计被引用的附件总体积、最大的几张
//  - 按顶层/二级领域汇总笔记数与字数，便于决定先同步哪个项目
import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs'
import { join, extname, relative, basename } from 'node:path'

const ROOT = process.argv[2]
const IGNORE = new Set([
  '.obsidian',
  '.trash',
  '.git',
  '.smart-env',
  'node_modules',
  '.DS_Store',
  '.stfolder',
])
const IMG = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.emf'])

const allFiles = []
const md = []
function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.has(e.name)) continue
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (e.isFile()) {
      allFiles.push(p)
      if (extname(p).toLowerCase() === '.md') md.push(p)
    }
  }
}
walk(ROOT)

// 索引：文件名（不含扩展名，小写）→ 路径；同名以第一个为准
const byName = new Map()
for (const p of allFiles) {
  const key = basename(p, extname(p)).toLowerCase()
  if (!byName.has(key)) byName.set(key, p)
}

const RE_FM = /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---/
const RE_LINK = /(!?)\[\[([^\]]+)\]\]/g
const stats = {
  links: { total: 0, resolved: 0, missing: 0, headingOnly: 0 },
  embeds: { image: 0, note: 0, imageMissing: 0, imageFiles: new Set(), noteFiles: new Set() },
  referencedAssets: new Set(),
  missingSamples: [],
  transclusionSources: new Set(),
  withH1: 0,
  withCreated: 0,
  categories: {},
}
const cat = (rel) => {
  const parts = rel.split('\\')
  const a = parts.length > 1 ? parts[0] : '(根目录散页)'
  const b = parts.length > 2 ? `${parts[0]} / ${parts[1]}` : a
  return { a, b }
}

for (const p of md) {
  const raw = readFileSync(p, 'utf8')
  const rel = relative(ROOT, p)
  const { a, b } = cat(rel)
  const chars = (raw.match(/[\u4e00-\u9fff]/g) || []).length
  for (const [key, label] of [
    [a, 'a'],
    [b, 'b'],
  ]) {
    stats.categories[key] = stats.categories[key] || { level: label, notes: 0, chars: 0 }
    stats.categories[key].notes++
    stats.categories[key].chars += chars
  }
  if (/^#\s+\S/m.test(raw)) stats.withH1++
  if (RE_FM.test(raw) && /^created\s*:/m.test(raw)) stats.withCreated++

  let m
  RE_LINK.lastIndex = 0
  while ((m = RE_LINK.exec(raw))) {
    const bang = m[1] === '!'
    const body = m[2]
    const [targetRaw, ...rest] = body.split('|')
    const target = targetRaw.split('#')[0].trim()
    const alias = rest.join('|').trim()
    if (!target) {
      stats.links.headingOnly++
      continue
    }
    stats.links.total++
    const baseNoExt = basename(target)
      .replace(/\.[a-z0-9]+$/i, '')
      .toLowerCase()
    const found = byName.get(baseNoExt)
    const isImage = IMG.has(extname(target).toLowerCase())
    const isAsset = !isImage && /\.[a-z0-9]+$/i.test(target) && !/\.md$/i.test(target)
    if (bang) {
      if (isImage) {
        stats.embeds.image++
        if (found) {
          stats.embeds.imageFiles.add(found)
          stats.referencedAssets.add(found)
        } else stats.embeds.imageMissing++
      } else {
        stats.embeds.note++
        if (found) {
          stats.embeds.noteFiles.add(found)
          stats.transclusionSources.add(relative(ROOT, p))
        }
      }
    } else if (isAsset) {
      if (found) {
        stats.referencedAssets.add(found)
        stats.assetRefs = (stats.assetRefs || 0) + 1
      } else stats.assetMissing = (stats.assetMissing || 0) + 1
      if (!stats.assetExts) stats.assetExts = {}
      const e = extname(target).toLowerCase()
      stats.assetExts[e] = (stats.assetExts[e] || 0) + 1
    } else if (found) stats.links.resolved++
    else {
      stats.links.missing++
      if (stats.missingSamples.length < 12)
        stats.missingSamples.push(`${rel} → ${target}${alias ? ` (${alias})` : ''}`)
    }
  }
}

// 附件体积
let assetBytes = 0
let assetCount = 0
const biggest = []
for (const f of stats.referencedAssets) {
  const s = statSync(f).size
  assetBytes += s
  assetCount++
  biggest.push({ f: relative(ROOT, f), mb: +(s / 1048576).toFixed(2) })
}
const allAssetBytes = allFiles
  .filter((f) => IMG.has(extname(f).toLowerCase()))
  .reduce((n, f) => n + statSync(f).size, 0)

const report = {
  notes: md.length,
  withH1: stats.withH1,
  withCreated: stats.withCreated,
  links: { ...stats.links, samplesOfMissing: stats.missingSamples },
  embeds: {
    image: stats.embeds.image,
    note: stats.embeds.note,
    imageMissing: stats.embeds.imageMissing,
    distinctImagesReferenced: stats.embeds.imageFiles.size,
    distinctNotesTranscluded: stats.embeds.noteFiles.size,
  },
  assets: {
    referencedCount: assetCount,
    referencedMB: +(assetBytes / 1048576).toFixed(1),
    allImagesMB: +(allAssetBytes / 1048576).toFixed(1),
    nonImageRefs: stats.assetRefs || 0,
    nonImageMissing: stats.assetMissing || 0,
    nonImageExts: stats.assetExts || {},
    biggest: biggest.sort((a, b) => b.mb - a.mb).slice(0, 12),
  },
  categories: Object.fromEntries(
    Object.entries(stats.categories).sort((a, b) => b[1].notes - a[1].notes),
  ),
}
mkdirSync('.qa', { recursive: true })
writeFileSync('.qa/vault-deep.json', JSON.stringify(report, null, 2), 'utf8')

console.log('=== 链接 ===')
console.log(
  `  共 ${report.links.total} 条，解析到笔记 ${report.links.resolved}，未解析 ${report.links.missing}，纯锚点 ${report.links.headingOnly}`,
)
report.links.samplesOfMissing.forEach((s) => console.log('    未解析:', s))
console.log('=== 嵌入 ===')
console.log(
  `  图片嵌入 ${report.embeds.image}（缺文件 ${report.embeds.imageMissing}）→ 涉及 ${report.embeds.distinctImagesReferenced} 张图`,
)
console.log(
  `  整篇嵌入 ${report.embeds.note} → 涉及 ${report.embeds.distinctNotesTranscluded} 篇笔记（transclusion，需要展开或降级）`,
)
console.log('=== 附件体积 ===')
console.log(
  `  被引用图片 ${report.assets.referencedCount} 张 / ${report.assets.referencedMB} MB；vault 内图片总量 ${report.assets.allImagesMB} MB`,
)
console.log(
  `  非图片附件引用 ${report.assets.nonImageRefs} 条（缺失 ${report.assets.nonImageMissing}）: ${JSON.stringify(report.assets.nonImageExts)}`,
)
report.assets.biggest.forEach((b) => console.log(`    ${String(b.mb).padStart(6)} MB  ${b.f}`))
console.log('=== 领域分档（笔记数 / 中文字数）===')
Object.entries(report.categories)
  .filter(([, v]) => v.level === 'b')
  .slice(0, 30)
  .forEach(([k, v]) =>
    console.log(`  ${String(v.notes).padStart(4)} 篇 ${String(v.chars).padStart(7)} 字  ${k}`),
  )
console.log('  （详细: .qa/vault-deep.json）')
