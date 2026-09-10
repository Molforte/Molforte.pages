// 部署检查：打印 GitHub Actions 部署状态，并探测线上服务的是「源码」还是「构建产物」。
// 用法：node scripts/check-deploy.mjs
import https from 'node:https'
import { readdirSync, existsSync } from 'node:fs'

const REPO = 'Molforte/Molforte.pages'
const SITE = 'https://molforte.github.io/Molforte.pages'

const get = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent': 'molforte-deploy-check',
            Accept: 'application/vnd.github+json',
            'Cache-Control': 'no-cache',
          },
        },
        (r) => {
          let d = ''
          r.on('data', (c) => (d += c))
          r.on('end', () => resolve({ status: r.statusCode, body: d }))
        },
      )
      .on('error', reject)
  })

console.log('== 1. 最近的部署 workflow ==')
try {
  const runs = JSON.parse((await get(`https://api.github.com/repos/${REPO}/actions/runs?per_page=3`)).body)
  for (const run of runs.workflow_runs || []) {
    console.log(`  ${run.name} | ${run.status}/${run.conclusion} | ${run.head_sha.slice(0, 7)}`)
    if (run.name === 'Deploy to GitHub Pages') {
      const jobs = JSON.parse((await get(run.jobs_url)).body)
      for (const job of jobs.jobs || []) console.log(`     ${job.name} → ${job.conclusion}`)
    }
  }
} catch (e) {
  console.log('  查询失败：', e.message)
}

console.log('\n== 2. 线上实际服务的内容 ==')
const idx = await get(`${SITE}/?nocache=${Date.now()}`)
const refs = idx.body.match(/(?:src|href)="([^"]+)"/g) || []
console.log('  index.html', idx.status)
refs.forEach((r) => console.log('   ', r))

const servesSource = refs.some((r) => r.includes('/src/main.jsx'))
if (servesSource) {
  console.log('\n  ✗ 正在发布「仓库源码」（Pages Source 还是 Deploy from a branch）')
  console.log('    → 去仓库 Settings → Pages → Source 选 “GitHub Actions”，再重跑一次 workflow')
} else {
  console.log('\n  ✓ 看起来在发布构建产物')
  if (existsSync('dist/assets')) {
    for (const a of readdirSync('dist/assets')) {
      const r = await get(`${SITE}/assets/${a}`)
      console.log(`    /assets/${a} → ${r.status}`)
    }
  }
}
