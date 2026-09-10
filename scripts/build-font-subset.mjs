// 生成「只含站点实际用到的字符」的精简等宽字体子集（Sarasa Mono SC）。
//
// 版权：Sarasa Gothic © be5invis，SIL OFL 1.1（见 third_party/sarasa-gothic/OFL.txt）。
// 用法：
//   1) 从清华镜像下载官方 TTF 包并解压（脚本 _get-font.mjs 会做下载）：
//      https://mirrors.tuna.tsinghua.edu.cn/github-release/be5invis/Sarasa-Gothic/LatestRelease/
//   2) node scripts/build-font-subset.mjs "<SarasaMonoSC-Regular.ttf 的路径>"
//   3) 产物写入 src/assets/fonts/，页面按需加载；缺字自动回落到系统等宽字体。
//
// 字符集 = ASCII / 常用标点 / CJK 标点 / 制表符 / 箭头 / 几何图形 / 全角
//        + content/ 与 src/ 里出现的所有字符 + 可选的 scripts/font-extra-chars.txt
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import subsetFont from 'subset-font'

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const srcTtf = process.argv[2]
if (!srcTtf || !existsSync(srcTtf)) {
  console.error('用法: node scripts/build-font-subset.mjs "<SarasaMonoSC-Regular.ttf 路径>"')
  process.exit(1)
}

// —— 基础字符集 ——
const base = (() => {
  let s = ''
  const add = (from, to) => {
    for (let cp = from; cp <= to; cp++) s += String.fromCodePoint(cp)
  }
  add(0x20, 0x7e) // ASCII
  add(0xa0, 0xff) // Latin-1
  add(0x2000, 0x206f) // 常用标点
  add(0x20a0, 0x20bf) // 货币
  add(0x2190, 0x21ff) // 箭头
  add(0x2500, 0x257f) // 制表符
  add(0x2580, 0x259f) // 方块元素
  add(0x25a0, 0x25ff) // 几何图形
  add(0x3000, 0x303f) // CJK 标点
  add(0xff00, 0xffef) // 全角
  return s
})()

// —— 收集站点里出现的字符 ——
const exts = new Set(['.md', '.js', '.jsx', '.css', '.html', '.json'])
const chars = new Set(base)
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue
      walk(p)
    } else if (exts.has(extname(name))) {
      for (const ch of readFileSync(p, 'utf8')) chars.add(ch)
    }
  }
}
for (const d of ['content', 'src']) walk(join(root, d))

// 可选：额外字符（一行一个，或直接一串）
const extra = join(root, 'scripts', 'font-extra-chars.txt')
if (existsSync(extra)) {
  for (const ch of readFileSync(extra, 'utf8').replace(/\s/g, '')) chars.add(ch)
}

const text = [...chars].join('')
const srcBuf = readFileSync(srcTtf)
const out = await subsetFont(srcBuf, text, { targetFormat: 'woff2' })

const outDir = join(root, 'src', 'assets', 'fonts')
mkdirSync(outDir, { recursive: true })
const outFile = join(outDir, 'sarasa-mono-sc-subset.woff2')
writeFileSync(outFile, out)

console.log(`源字体: ${(srcBuf.length / 1048576).toFixed(2)} MB`)
console.log(`字符数: ${chars.size}`)
console.log(`子集: ${outFile} → ${(out.length / 1024).toFixed(1)} KB`)
