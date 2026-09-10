import { useEffect } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Post from './pages/Post.jsx'
import Archive from './pages/Archive.jsx'
import Volume from './pages/Volume.jsx'
import Note from './pages/Note.jsx'
import Fragment from './pages/Fragment.jsx'
import StaticPage from './pages/StaticPage.jsx'
import NotFound from './pages/NotFound.jsx'
import Footer from './components/Footer.jsx'
import BottomDock from './components/BottomDock.jsx'

/** 路由切换时回到顶部 */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

/** Markdown 里的站内链接走前端路由，不整页刷新（外链/新窗口/修饰键不拦） */
function useInternalLinks() {
  const navigate = useNavigate()
  useEffect(() => {
    const base = import.meta.env.BASE_URL
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return
      const a = e.target.closest?.('a[href]')
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return
      const href = a.getAttribute('href')
      if (!href || !href.startsWith(base)) return
      e.preventDefault()
      navigate(href.slice(base.length - 1))
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [navigate])
}

export default function App() {
  const { pathname } = useLocation()
  useInternalLinks()
  return (
    <>
      <div className="site-frame">
        <main className="site-main">
          <ScrollToTop />
          {/* key = 路径：每次路由切换重放一次入场动效 */}
          <div className="page-enter" key={pathname}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/notes/:volume" element={<Volume />} />
              <Route path="/notes/:volume/:note" element={<Note />} />
              <Route path="/fragment/:slug" element={<Fragment />} />
              <Route path="/friends" element={<StaticPage slug="friends" />} />
              <Route path="/about" element={<StaticPage slug="about" />} />
              <Route path="/post/:slug" element={<Post />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </main>
        <Footer />
      </div>
      <BottomDock />
    </>
  )
}
