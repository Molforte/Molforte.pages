// 多源测速 + 后台下载官方 Sarasa Mono SC（断点续传，输出精简）
import { createWriteStream, mkdirSync, statSync, existsSync, renameSync, unlinkSync } from 'node:fs'
import https from 'node:https'

const GH =
  'https://github.com/be5invis/Sarasa-Gothic/releases/download/v1.0.41/SarasaMonoSC-TTF-1.0.41.7z'
const candidates = [
  'https://ghfast.top/' + GH,
  'https://gh-proxy.com/' + GH,
  'https://ghproxy.net/' + GH,
  'https://mirrors.tuna.tsinghua.edu.cn/github-release/be5invis/Sarasa-Gothic/Sarasa%20Gothic%2C%20Version%201.0.41/SarasaMonoSC-TTF-1.0.41.7z',
]

const outDir = 'D:\\MolforteFiles\\deepseek harness\\_fontsrc'
const finalFile = `${outDir}\\SarasaMonoSC-TTF-1.0.41.7z`
const partFile = finalFile + '.part'
mkdirSync(outDir, { recursive: true })

const req = (url, headers = {}, method = 'GET', redirects = 0) =>
  new Promise((resolve, reject) => {
    if (redirects > 6) return reject(new Error('too many redirects'))
    const r = https.request(
      url,
      { method, headers: { 'User-Agent': 'Mozilla/5.0', ...headers }, timeout: 90000 },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume()
          return resolve(
            req(new URL(res.headers.location, url).href, headers, method, redirects + 1),
          )
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

// —— 1. 测速：各取 2MB 看谁快 ——
console.log('测速（各取 2MB）：')
const speeds = []
for (const url of candidates) {
  const t0 = Date.now()
  try {
    const res = await req(url, { Range: 'bytes=0-2097151' })
    if (res.statusCode !== 200 && res.statusCode !== 206) {
      console.log(`  ${res.statusCode}  ${url.slice(0, 40)}`)
      res.resume()
      continue
    }
    let got = 0
    await new Promise((resolve) => {
      res.on('data', (c) => {
        got += c.length
        if (got >= 2097152) resolve()
      })
      res.on('end', resolve)
      res.on('error', resolve)
    })
    const secs = (Date.now() - t0) / 1000
    const kbps = got / 1024 / secs
    console.log(`  ${kbps.toFixed(0)} KB/s  ${url.slice(0, 40)}`)
    speeds.push({ url, kbps })
    res.destroy()
  } catch (e) {
    console.log(`  ERR ${e.message}  ${url.slice(0, 40)}`)
  }
}
speeds.sort((a, b) => b.kbps - a.kbps)
if (!speeds.length) {
  console.error('所有源都不可用')
  process.exit(1)
}
const best = speeds[0]
console.log(`\n选用（${best.kbps.toFixed(0)} KB/s）: ${best.url}`)

// —— 2. 下载（支持续传）——
let start = 0
if (existsSync(partFile)) start = statSync(partFile).size
const res = await req(best.url, start > 0 ? { Range: `bytes=${start}-` } : {})
if (res.statusCode !== 200 && res.statusCode !== 206) {
  console.error('下载失败 HTTP', res.statusCode)
  process.exit(1)
}
const total = Number(res.headers['content-length'] || 0) + start
console.log(
  `开始下载：${(start / 1048576).toFixed(1)}MB 起，共约 ${(total / 1048576).toFixed(1)}MB`,
)
const ws = createWriteStream(partFile, { flags: start > 0 ? 'a' : 'w' })
let got = start
let lastLog = 0
await new Promise((resolve, reject) => {
  res.on('data', (c) => {
    got += c.length
    if (got - lastLog > 5 * 1048576) {
      lastLog = got
      console.log(`  ${(got / 1048576).toFixed(1)} / ${(total / 1048576).toFixed(1)} MB`)
    }
  })
  res.pipe(ws)
  ws.on('finish', resolve)
  ws.on('error', reject)
})
if (existsSync(finalFile)) unlinkSync(finalFile)
renameSync(partFile, finalFile)
console.log('完成:', finalFile, (statSync(finalFile).size / 1048576).toFixed(1) + 'MB')
