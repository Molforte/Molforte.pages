import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { SITE } from '../site.js'
import BlendCursor from '../components/BlendCursor.jsx'
import DotField from '../components/DotField.jsx'
import MagneticWord from '../components/MagneticWord.jsx'
import ShinyText from '../components/ShinyText.jsx'
import SocialLinks from '../components/SocialLinks.jsx'

// 点阵用哪一种「指针推挤」：push = 给速度把点撞开、再自己弹回。
// 这正好是上游 DotField 的 bulgeOnly: false 那一态，所以没偏离上游。
// 同族还有 bulge（顶开）/ attract（吸）/ vortex（绕）/ ripple（行波）/ magnify（放大），
// 都在组件的 mode prop 里（见 DotField.jsx 顶部）；想换只改下面这一个词。
const DOTS_MODE = 'push'

export default function Home() {
  useEffect(() => {
    document.title = `${SITE.title} · ${SITE.author}`
  }, [])

  // welcome 写字符串（一行）或数组（一行一句）都行
  const welcomeLines = [].concat(SITE.welcome)
  // 朝向鼠标的那个词认的是「整块首屏」，指针在整个首屏里动它都有反应
  const heroRef = useRef(null)

  /* 主按钮：往下滑一屏（位移取首屏底边，也就等于「主页第二页」）。
     不跳路由，所以底栏那第二个栏目不会被选中——它本来就不是一次导航。
     减弱动态效果时不用平滑滚动（那条规则是给动画的，不该管这里的滚动，
     但平滑滚动对前庭敏感的人同样难受，所以一起关掉）。 */
  const scrollToNextScreen = () => {
    const hero = heroRef.current
    const top = hero ? hero.getBoundingClientRect().bottom + window.scrollY : window.innerHeight
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <div className="home">
      {/* 铺满**整个主页**的一层点阵：指针快速掠过时点会被「顶开」
          （React Bits 的 <DotField />）。只挂在这一页，别的页面没有。
          颜色压得很低只当底纹；上游默认那套紫渐变 + 深色光晕是给深底用的，
          这里换成中性灰与一层极淡的主蓝光晕。 */}
      <DotField
        className="home__dots"
        mode={DOTS_MODE}
        dotRadius={3}
        dotSpacing={15}
        cursorForce={0.1}
        /* 关掉跟着指针的那圈光晕：推挤的时候只该看到点被撞开，
           不该额外糊一层蓝雾。半径 0 + 透明，双保险。 */
        glowRadius={0}
        gradientFrom="rgba(110, 118, 138, 0.4)"
        gradientTo="rgba(110, 118, 138, 0.18)"
        glowColor="transparent"
      />

      {/* 首屏：欢迎语 → 格言 → 两个按钮，一屏之内读完 */}
      <header className="home-hero" ref={heroRef}>
        <BlendCursor>
          <h1 className="home-hero__title" style={{ '--i': 0 }}>
            {welcomeLines.map((line, i) => {
              // 把 welcome 里那个词单独挑出来交给 <MagneticWord />
              const at = SITE.magnetic ? line.indexOf(SITE.magnetic) : -1
              return (
                // 行尾那个空格只为 textContent 连着读得通，块级行尾空白不渲染
                <span className="home-hero__line" key={i} data-cursor="blend">
                  {at < 0 ? (
                    line
                  ) : (
                    <>
                      {line.slice(0, at)}
                      <MagneticWord areaRef={heroRef} word={SITE.magnetic} />
                      {line.slice(at + SITE.magnetic.length)}
                    </>
                  )}
                  {i < welcomeLines.length - 1 ? ' ' : ''}
                </span>
              )
            })}
          </h1>
        </BlendCursor>
        <p className="home-hero__motto" style={{ '--i': 1 }}>
          {SITE.motto}
        </p>
        <div className="home-hero__actions" style={{ '--i': 2 }}>
          {/* 主按钮：默认往下滑一屏；site.js 里给了 to 就变成跳转 */}
          {SITE.start.to ? (
            <Link className="hero-btn hero-btn--primary" to={SITE.start.to}>
              {/* 主按钮文案走 ShinyText：一道高光反复扫过（见 components/ShinyText.jsx） */}
              <ShinyText text={SITE.start.label} />
            </Link>
          ) : (
            <button
              type="button"
              className="hero-btn hero-btn--primary"
              onClick={scrollToNextScreen}
            >
              <ShinyText text={SITE.start.label} />
            </button>
          )}
          {/* 副按钮换成一排联系方式（Bilibili / GitHub / Email），
              内容在 site.js 的 SITE.social 里改 */}
          <SocialLinks />
        </div>
      </header>

      {/* —— 首屏以下先留空，内容等你往里塞 ——
           原来那两段（文章列表 / 项目两栏卡）已整段移除，需要时从这两处找回：
           备份在 molforte-home/Home.before-strip.jsx（工作区），
           或 git 历史里的 src/pages/Home.jsx。
           往里塞的时候：section 用 <Reveal as="section" className="home-section">，
           标题用 .home-section__title，样式在 global.css 的「首页文章流 / 项目」那几段。 */}
    </div>
  )
}
