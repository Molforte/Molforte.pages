// 本地预览：模拟 GitHub Pages 行为 —— 静态托管 dist/，
// 找不到文件的路径回退 index.html（SPA 路由），404.html 以 404 返回。
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const ROOT = decodeURIComponent(new URL('../dist/', import.meta.url).pathname).replace(
  /^\/([A-Za-z]:)/,
  '$1',
)
const PORT = process.env.PORT || 4173

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    // 模拟 GitHub Pages 项目站点：子路径前缀（仓库名）之下即站点根
    let path = normalize(decodeURIComponent(url.pathname))
      .replace(/^([/\\])+/, '')
      .replace(/^Molforte\.pages[/\\]/, '')
    if (!path) path = 'index.html'

    const send = async (file, status = 200) => {
      const data = await readFile(file)
      res.writeHead(status, {
        'Content-Type': MIME[extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
      })
      res.end(data)
    }

    try {
      const s = await stat(join(ROOT, path))
      if (s.isFile()) return await send(join(ROOT, path))
      throw new Error('not file')
    } catch {
      // 真 404 交给 404.html（GitHub Pages 用 404 状态码返回它，SPA 借此接管路由）
      try {
        return await send(join(ROOT, '404.html'), 404)
      } catch {
        return await send(join(ROOT, 'index.html'), 404)
      }
    }
  } catch (e) {
    res.writeHead(500)
    res.end(String(e))
  }
})

server.listen(PORT, () =>
  console.log(`[serve-dist] http://127.0.0.1:${PORT}  (模拟 GitHub Pages) -> ${ROOT}`),
)
