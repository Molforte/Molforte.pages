// 下载并解出官方 Sarasa Mono SC（供 build-font-subset.mjs 使用）。
//
// 用法：node scripts/fetch-font-source.mjs
// 产物：.fontsrc/ttf/SarasaMonoSC-Regular.ttf（.fontsrc/ 已在 .gitignore 中）
//
// 源：be5invis/Sarasa-Gothic 官方 release（v1.0.41）
//   直连 GitHub 在国内常被拦，所以按顺序试：清华镜像 → 南大镜像 → 若干 GitHub 代理。
//   解压用 7zip-bin 自带的 7za（纯 npm 依赖，不需要系统装 7-Zip）。
import {
  createWriteStream,
  mkdirSync,
  existsSync,
  renameSync,
  statSync,
  readdirSync,
} from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import https from 'node:https'
import sevenZip from '7zip-bin'

const root = fileURLToPath(new URL('..', import.meta.url))
const VERSION = '1.0.41'
const ASSET = `SarasaMonoSC-TTF-${VERSION}.7z`
const GH = `https://github.com/be5invis/Sarasa-Gothic/releases/download/v${VERSION}/${ASSET}`

const sources = [
  `https://mirrors.tuna.tsinghua.edu.cn/github-release/be5invis/Sarasa-Gothic/Sarasa%20Gothic%2C%20Version%20${VERSION}/${ASSET}`,
  `https://mirror.nju.edu.cn/github-release/be5invis/Sarasa-Gothic/Sarasa%20Gothic%2C%20Version%20${VERSION}/${ASSET}`,
  `https://ghfast.top/${GH}`,
  `https://gh-proxy.com/${GH}`,
  `https://ghproxy.net/${GH}`,
  GH,
]

const dir = join(root, '.fontsrc')
mkdirSync(join(dir, 'ttf'), { recursive: true })
const archive = join(dir, ASSET)

const request = (url, headers = {}, redirects = 0) =>
  new Promise((resolve, reject) => {
    if (redirects > 6) return reject(new Error('too many redirects'))
    const r = https.request(
      url,
      { headers: { 'User-Agent': 'Mozilla/5.0', ...headers }, timeout: 60000 },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume()
          return resolve(request(new URL(res.headers.location, url).href, headers, redirects + 1))
        }
        resolve(res)
      },
    )
    r.on('error', reject)
    r.on('timeout', () => {
      r.destroy()
      reject(new Error('timeout'))
    })
    r.end()
  })

if (!existsSync(archive)) {
  let picked = null
  for (const url of sources) {
    try {
      const res = await request(url, { Range: 'bytes=0-1048575' }) // 先取 1MB 试速度
      const ok = res.statusCode === 200 || res.statusCode === 206
      res.destroy()
      if (ok) {
        picked = url
        console.log('可用源:', url)
        break
      }
      console.log(`跳过 ${res.statusCode}: ${url}`)
    } catch (e) {
      console.log(`失败 ${e.message}: ${url}`)
    }
  }
  if (!picked) {
    console.error('所有源都不可用；可手动下载后放到 .fontsrc/' + ASSET)
    process.exit(1)
  }

  const part = archive + '.part'
  let start = existsSync(part) ? statSync(part).size : 0
  const res = await request(picked, start ? { Range: `bytes=${start}-` } : {})
  const total = Number(res.headers['content-length'] || 0) + start
  console.log(`下载中：${(start / 1048576).toFixed(1)} → ${(total / 1048576).toFixed(1)} MB`)
  const ws = createWriteStream(part, { flags: start ? 'a' : 'w' })
  let got = start
  let mark = 0
  await new Promise((resolve, reject) => {
    res.on('data', (c) => {
      got += c.length
      if (got - mark > 5 * 1048576) {
        mark = got
        console.log(`  ${(got / 1048576).toFixed(1)} / ${(total / 1048576).toFixed(1)} MB`)
      }
    })
    res.pipe(ws)
    ws.on('finish', resolve)
    ws.on('error', reject)
  })
  if (existsSync(archive)) renameSync(archive, archive + '.old')
  renameSync(part, archive)
}

console.log('解压中…')
const r = spawnSync(sevenZip.path7za, ['x', archive, '-o' + join(dir, 'ttf'), '-y'], {
  stdio: 'inherit',
})
if (r.status) process.exit(r.status)

const ttfs = readdirSync(join(dir, 'ttf')).filter((f) => /Regular\.ttf$/i.test(f))
console.log('\n可用于切子集的文件:')
ttfs.forEach((f) => console.log('  ', join(dir, 'ttf', f)))
console.log('\n下一步: node scripts/build-font-subset.mjs ".fontsrc/ttf/' + ttfs[0] + '"')
