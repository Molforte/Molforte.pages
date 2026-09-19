import { Fragment, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { formatDate, getPage, recentItems } from '../lib/content.js'
import { renderMarkdown } from '../lib/markdown.js'
import { SITE } from '../site.js'
import BlendCursor from '../components/BlendCursor.jsx'
import DotField from '../components/DotField.jsx'
import MagneticWord from '../components/MagneticWord.jsx'
import Reveal from '../components/Reveal.jsx'
import ShinyText from '../components/ShinyText.jsx'
import SocialLinks from '../components/SocialLinks.jsx'
import WhoamiTabs from '../components/WhoamiTabs.jsx'

// 首页第三屏「最近更新」放几条
const RECENT_COUNT = 3

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
  // 「会飞的那个 W」在首屏标题里；它落到第二屏标题那串文字的第一个字上
  const heroWRef = useRef(null)
  // 第二屏那个标题（一个盒子，W 与 hoami 是同一段文字的前后两截）
  const titleRef = useRef(null)
  // 第二屏卡片里的内容：content/pages/<page>.md 渲染成 HTML，
  // 交给 <WhoamiTabs /> 按 H1 切成标签页
  const whoamiHtml = useMemo(() => {
    const page = SITE.whoami?.page ? getPage(SITE.whoami.page) : null
    return page ? renderMarkdown(page.content) : ''
  }, [])
  // 第三屏「最近更新」：笔记与文章混排取最新的几条
  const recent = useMemo(() => recentItems(RECENT_COUNT), [])

  /* —— 让首屏那个 W 自己飞到第二屏，再由它「长出」 Whoami ——
     首屏动的那个 <span> 不复制、不叠层，往回滚就原样飞回去。
     第二屏的标题是**一个盒子**（整串 Whoami 都在里面），靠裁切宽度决定露多少：
       飞行期间 0 → W 落定瞬间一个 W 宽 → 下一帧长到整串宽。
     所以 W 和 hoami 天生是同一段文字的前后两截，不是两个东西。

     用 JS 逐帧推进（只写一个 CSS 变量 --w-p，0→1），**不用 CSS 滚动时间轴**：
     后者支持度不齐，遇到不支持会整段静悄悄不执行（第一版就是这么"没动"的）。 */
  useEffect(() => {
    const w = heroWRef.current
    const title = titleRef.current
    const hero = heroRef.current
    if (!w || !title || !hero) return

    // 减弱动态效果：不飞，标题直接是完整的
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const measure = () => {
      // 标题里第一个字（W）与整串文字各自的盒子：用 Range 量，不用额外包 span
      const text = title.firstChild
      if (!text || !text.length) return
      const range = document.createRange()
      const ra = w.getBoundingClientRect()

      range.setStart(text, 0)
      range.setEnd(text, 1)
      const rw = range.getBoundingClientRect() // 第一个字：飞行的落点，也是「只露一个 W」的宽度
      range.setEnd(text, text.length)
      const rf = range.getBoundingClientRect() // 整串：长到头时的宽度

      const root = document.documentElement.style
      // 按中心对齐：两端字号、行高都不同，中心对齐比左上角对齐稳
      root.setProperty('--w-dx', `${rw.left + rw.width / 2 - (ra.left + ra.width / 2)}px`)
      root.setProperty('--w-dy', `${rw.top + rw.height / 2 - (ra.top + ra.height / 2)}px`)
      // 缩放按**渲染宽度**之比：两端 letter-spacing 不同，按字号算会宽 4px
      root.setProperty('--w-scale', (rw.width / ra.width).toFixed(4))
      root.setProperty('--tw-from', `${rw.width.toFixed(2)}px`)
      root.setProperty('--tw-to', `${(rf.left + rf.width - rw.left).toFixed(2)}px`)
    }

    let raf = 0
    let landed = false
    const update = () => {
      raf = 0
      const h = hero.getBoundingClientRect().height || window.innerHeight
      const p = Math.min(1, Math.max(0, window.scrollY / h))
      w.style.setProperty('--w-p', p.toFixed(4))

      // 落地那一刻：先让标题露成一个 W（就是刚落下的那个），再长成整串。
      // 中间必须强制结算一次（读一下 offsetWidth）——两个 class 同一帧加下去，
      // 浏览器会当成一步，宽度直接从 0 补到整串，那个「先立住 W」就丢了。
      const nowLanded = p >= 0.995
      if (nowLanded === landed) return
      landed = nowLanded
      document.documentElement.classList.toggle('is-w-landed', nowLanded)
      if (!nowLanded) {
        title.classList.remove('is-landed', 'is-expanded')
        return
      }
      title.classList.add('is-landed')
      void title.offsetWidth
      title.classList.add('is-expanded')
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    const remeasure = () => {
      measure()
      update()
    }

    // 标题让位给飞过来的那个 W；JS 没跑（或减弱动效）时它就是普通标题
    document.documentElement.classList.add('has-flying-w')

    measure()
    update()
    // 字体换上来、首屏入场动效 settle 之后尺寸还会变，补两次重量
    const timers = [300, 1200].map((t) => window.setTimeout(remeasure, t))
    if (document.fonts?.ready) document.fonts.ready.then(remeasure).catch(() => {})
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', remeasure)

    return () => {
      timers.forEach(window.clearTimeout)
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('has-flying-w', 'is-w-landed')
      title.classList.remove('is-landed', 'is-expanded')
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', remeasure)
    }
  }, [])

  /* 首屏标题按「要单独包起来的片段」渲染：
     第一个 W 交给飞行动画（只有第一行那个 W 是「Welcome 的 W」），
     SITE.magnetic 那个词交给 <MagneticWord />。两者按先后依次切分。 */
  const renderHeroLine = (line, i) => {
    const parts = []
    let rest = line
    let key = 0

    if (i === 0) {
      const w = rest.indexOf('W')
      if (w >= 0) {
        parts.push(rest.slice(0, w))
        parts.push(
          <span className="home-hero__w" ref={heroWRef} key="w">
            W
          </span>,
        )
        rest = rest.slice(w + 1)
      }
    }

    const m = SITE.magnetic ? rest.indexOf(SITE.magnetic) : -1
    if (m >= 0) {
      parts.push(rest.slice(0, m))
      parts.push(<MagneticWord areaRef={heroRef} word={SITE.magnetic} key="magnetic" />)
      parts.push(rest.slice(m + SITE.magnetic.length))
    } else {
      parts.push(rest)
    }

    return parts.map((p) => <Fragment key={key++}>{p}</Fragment>)
  }

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
            {welcomeLines.map((line, i) => (
              // 行尾那个空格只为 textContent 连着读得通，块级行尾空白不渲染
              <span className="home-hero__line" key={i} data-cursor="blend">
                {renderHeroLine(line, i)}
                {i < welcomeLines.length - 1 ? ' ' : ''}
              </span>
            ))}
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

      {/* —— 第二屏：Whoami ——
          规矩的一页：左上角是标题（一个盒子，W 与 hoami 是同一段文字的前后两截，
          靠裁切宽度从「一个 W」长成整串，见 .whoami__title），
          下面一张卡片，卡片内部是标签页（见 WhoamiTabs.jsx）。
          **千万不要在这块外面套 <Reveal />**：入场动效会给祖先加 transform，
          而 transform 会让飞行 W 的定位（绝对坐标）算出错。 */}
      <section className="whoami" id="whoami">
        {/* **一个盒子**：整串 Whoami 就在这个 h2 里（W 与 hoami 是同一段文字的
            前后两截），靠裁切宽度决定露多少：
            飞行期间宽度 0（这一页没有标题）→ W 落定瞬间露成一个 W 宽
            → 再长到整串宽，于是「由 W 长出 hoami」。 */}
        <h2 className="whoami__title" ref={titleRef}>
          {SITE.whoami?.title || 'Whoami'}
        </h2>

        <article className="whoami__card">
          <WhoamiTabs html={whoamiHtml} label={SITE.whoami?.title || 'Whoami'} />
        </article>
      </section>

      {/* —— 第三屏：最近更新 ——
          三张卡片 + 一个 More →。条目是笔记与文章混排、按日期倒序取的，
          全部由内容库生成，写了新东西首页自己会变。 */}
      {recent.length > 0 && (
        <Reveal as="section" className="home-recent">
          <h2 className="home-recent__title">Recent</h2>
          <ul className="home-recent__list">
            {recent.map((item) => (
              <li key={item.to}>
                <Link className="recent-card" to={item.to}>
                  <p className="recent-card__meta">
                    <span className="recent-card__where">
                      {item.kind === 'post' ? '文章' : item.volumeTitle}
                    </span>
                    <time dateTime={item.date}>{formatDate(item.date)}</time>
                  </p>
                  <h3 className="recent-card__title">{item.title}</h3>
                  {item.summary && <p className="recent-card__summary">{item.summary}</p>}
                </Link>
              </li>
            ))}
          </ul>
          <p className="home-recent__more">
            <Link to="/archive">More →</Link>
          </p>
        </Reveal>
      )}
    </div>
  )
}
