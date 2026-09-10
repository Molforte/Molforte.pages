import https from 'node:https'

const get = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 25000 }, (r) => {
        let d = ''
        r.on('data', (c) => (d += c))
        r.on('end', () => resolve({ s: r.statusCode, d }))
      })
      .on('error', reject)
  })

const urls = [
  'https://mirrors.tuna.tsinghua.edu.cn/github-release/be5invis/Sarasa-Gothic/',
  'https://mirrors.tuna.tsinghua.edu.cn/github-release/be5invis/Sarasa-Gothic/LatestRelease/',
  'https://mirror.nju.edu.cn/github-release/be5invis/Sarasa-Gothic/',
]

for (const u of urls) {
  try {
    const r = await get(u)
    console.log('\n==', u, '→', r.s)
    if (r.s !== 200) continue
    const hrefs = [...r.d.matchAll(/href="([^"]+)"/g)].map((m) => m[1])
    const dirs = hrefs.filter(
      (h) => h.endsWith('/') && !h.startsWith('http') && !h.startsWith('/') && h !== '../',
    )
    console.log('  子目录:', dirs.slice(0, 10).join(', ') || '(无)')
    const mono = hrefs.filter((h) => /MonoSC/i.test(h))
    if (mono.length) console.log('  MonoSC 资产:', mono.slice(0, 8).join('\n                '))
  } catch (e) {
    console.log('\n==', u, 'ERR', e.message)
  }
}

console.log('\n== npm 上的 7z 工具 ==')
for (const n of ['7zip-bin', '7z-wasm', 'node-7z']) {
  try {
    const r = await get(`https://registry.npmmirror.com/${n}`)
    if (r.s !== 200) {
      console.log(' ', n, '→', r.s)
      continue
    }
    const j = JSON.parse(r.d)
    const v = j['dist-tags'].latest
    console.log(
      ' ',
      n,
      '→',
      v,
      '| unpacked:',
      ((j.versions[v].dist.unpackedSize || 0) / 1048576).toFixed(1) + 'MB',
    )
  } catch (e) {
    console.log(' ', n, 'ERR', e.message)
  }
}
