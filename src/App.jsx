import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Post from './pages/Post.jsx'
import Archive from './pages/Archive.jsx'
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

export default function App() {
  return (
    <>
      <div className="site-frame">
        <main className="site-main">
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/friends" element={<StaticPage slug="friends" />} />
            <Route path="/about" element={<StaticPage slug="about" />} />
            <Route path="/post/:slug" element={<Post />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <BottomDock />
    </>
  )
}
