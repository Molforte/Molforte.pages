import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { SITE } from '../site.js'

export default function NotFound() {
  useEffect(() => {
    document.title = `页面不存在 · ${SITE.title}`
  }, [])

  return (
    <div className="notfound">
      <p className="notfound__code">404</p>
      <p className="notfound__text">没有这篇文章，或者地址写错了。</p>
      <Link className="notfound__back" to="/">
        回到主页
      </Link>
    </div>
  )
}
