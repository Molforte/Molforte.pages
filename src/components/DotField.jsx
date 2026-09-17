// React Bits —— DotField（JavaScript + CSS 变体）
// 来源：https://reactbits.dev/ ｜ 按集成说明引入。
// 相对上游的改动只有一处，且是性能上的：
//   上游每帧无条件重画整块点阵（rAF 永远在跑），页面闲置时也一直 60fps 重绘。
//   这里加了一个「静止就跳过重绘」的短路：上一帧若有任何点还没归位、或指针
//   还在附近（eng > 0）才画；开着 waveAmplitude / sparkle 时不跳（点一直在动）。
//   视觉与交互与上游一致。
import { useEffect, useRef, memo } from 'react'

import './DotField.css'

const TWO_PI = Math.PI * 2

const DotField = memo(
  ({
    dotRadius = 1.5,
    dotSpacing = 14,
    cursorRadius = 500,
    cursorForce = 0.1,
    bulgeOnly = true,
    bulgeStrength = 67,
    glowRadius = 160,
    sparkle = false,
    waveAmplitude = 0,
    gradientFrom = 'rgba(168, 85, 247, 0.35)',
    gradientTo = 'rgba(180, 151, 207, 0.25)',
    glowColor = '#120F17',
    // 本站在上游基础上加的：指针影响点的方式。留空则完全走上游那套
    // （bulgeOnly ? 'bulge' : 'push'）。可取值：
    //   bulge   朝远处顶开（上游默认）   push   给速度撞开、自己弹回（上游另一态）
    //   attract 吸向指针                 vortex 沿切向绕指针转
    //   ripple  按距离做行波，一圈圈荡出去   magnify 点不挪窝，近处的变大
    mode = '',
    ...rest
  }) => {
    const canvasRef = useRef(null)
    const svgRef = useRef(null)
    const glowRef = useRef(null)
    const dotsRef = useRef([])
    const mouseRef = useRef({ x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 })
    const rafRef = useRef(null)
    const sizeRef = useRef({ w: 0, h: 0, offsetX: 0, offsetY: 0 })
    const glowOpacity = useRef(0)
    const engagement = useRef(0)
    const propsRef = useRef({})
    propsRef.current = {
      dotRadius,
      dotSpacing,
      cursorRadius,
      cursorForce,
      bulgeOnly,
      bulgeStrength,
      sparkle,
      waveAmplitude,
      gradientFrom,
      gradientTo,
      mode,
    }
    const rebuildRef = useRef(null)
    const glowIdRef = useRef(`dot-field-glow-${Math.random().toString(36).slice(2, 9)}`)
    // 本站加的：上一帧是否还有点没归位（用来决定这一帧要不要重画）
    const movingRef = useRef(true)

    useEffect(() => {
      const canvas = canvasRef.current
      const glowEl = glowRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d', { alpha: true })
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      let resizeTimer

      function resize() {
        clearTimeout(resizeTimer)
        resizeTimer = setTimeout(doResize, 100)
      }

      function doResize() {
        const rect = canvas.parentElement.getBoundingClientRect()
        const w = rect.width
        const h = rect.height

        canvas.width = w * dpr
        canvas.height = h * dpr
        canvas.style.width = `${w}px`
        canvas.style.height = `${h}px`
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

        sizeRef.current = {
          w,
          h,
          offsetX: rect.left + window.scrollX,
          offsetY: rect.top + window.scrollY,
        }

        buildDots(w, h)
        movingRef.current = true
      }

      function buildDots(w, h) {
        const p = propsRef.current
        const step = p.dotRadius + p.dotSpacing
        const cols = Math.floor(w / step)
        const rows = Math.floor(h / step)
        const padX = (w % step) / 2
        const padY = (h % step) / 2
        const dots = new Array(rows * cols)
        let idx = 0

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const ax = padX + col * step + step / 2
            const ay = padY + row * step + step / 2
            dots[idx++] = { ax, ay, sx: ax, sy: ay, vx: 0, vy: 0, x: ax, y: ay }
          }
        }
        dotsRef.current = dots
      }

      function onMouseMove(e) {
        const s = sizeRef.current
        mouseRef.current.x = e.pageX - s.offsetX
        mouseRef.current.y = e.pageY - s.offsetY
      }

      function updateMouseSpeed() {
        const m = mouseRef.current
        const dx = m.prevX - m.x
        const dy = m.prevY - m.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        m.speed += (dist - m.speed) * 0.5
        if (m.speed < 0.001) m.speed = 0
        m.prevX = m.x
        m.prevY = m.y
      }

      const speedInterval = setInterval(updateMouseSpeed, 20)

      let frameCount = 0

      function tick() {
        frameCount++
        const dots = dotsRef.current
        const m = mouseRef.current
        const { w, h } = sizeRef.current
        const p = propsRef.current
        const len = dots.length
        const t = frameCount * 0.02

        const targetEngagement = Math.min(m.speed / 5, 1)
        engagement.current += (targetEngagement - engagement.current) * 0.06
        if (engagement.current < 0.001) engagement.current = 0
        const eng = engagement.current

        glowOpacity.current += (eng - glowOpacity.current) * 0.08

        if (glowEl) {
          glowEl.setAttribute('cx', m.x)
          glowEl.setAttribute('cy', m.y)
          glowEl.style.opacity = glowOpacity.current
        }

        // 本站加的短路：没有指针参与、上一帧也已经全部归位时，这一帧不必重画。
        // 注意 waveAmplitude / sparkle 开着时点阵本身一直在动，不能跳过。
        if (eng < 0.001 && !movingRef.current && p.waveAmplitude <= 0 && !p.sparkle) {
          rafRef.current = requestAnimationFrame(tick)
          return
        }

        ctx.clearRect(0, 0, w, h)

        const grad = ctx.createLinearGradient(0, 0, w, h)
        grad.addColorStop(0, p.gradientFrom)
        grad.addColorStop(1, p.gradientTo)
        ctx.fillStyle = grad

        const cr = p.cursorRadius
        const crSq = cr * cr
        const rad = p.dotRadius / 2
        const isBulge = p.bulgeOnly
        // 本站在上游基础上加的：把「指针怎么影响点」抽成一个 mode。
        // 不传 mode 就完全走上游那套（bulgeOnly ? 顶开 : 推挤）。
        const mode = p.mode || (isBulge ? 'bulge' : 'push')
        const isPush = mode === 'push'
        let stillMoving = false

        ctx.beginPath()

        for (let i = 0; i < len; i++) {
          const d = dots[i]
          const dx = m.x - d.ax
          const dy = m.y - d.ay
          const distSq = dx * dx + dy * dy
          let magnified = 1

          if (distSq < crSq && eng > 0.01) {
            const dist = Math.sqrt(distSq) || 1
            const angle = Math.atan2(dy, dx)
            const tt = 1 - dist / cr
            const force = tt * tt * p.bulgeStrength * eng

            if (isPush) {
              // 物理推挤：给速度，撞开之后自己弹回
              const move = (500 / dist) * (m.speed * p.cursorForce)
              d.vx += Math.cos(angle) * -move
              d.vy += Math.sin(angle) * -move
            } else if (mode === 'attract') {
              // 吸：把点朝指针方向拉（负号的另一面），靠近了就聚成一团
              d.sx += (d.ax + Math.cos(angle) * force - d.sx) * 0.15
              d.sy += (d.ay + Math.sin(angle) * force - d.sy) * 0.15
            } else if (mode === 'vortex') {
              // 旋涡：位移方向沿切向（把径向向量转 90°），点绕着指针转
              d.sx += (d.ax - Math.sin(angle) * force - d.sx) * 0.15
              d.sy += (d.ay + Math.cos(angle) * force - d.sy) * 0.15
            } else if (mode === 'ripple') {
              // 涟漪：位移按到指针的距离做行波，一圈圈荡出去
              const wave = Math.sin(dist / 26 - t * 2.2) * force
              d.sx += (d.ax - Math.cos(angle) * wave - d.sx) * 0.15
              d.sy += (d.ay - Math.sin(angle) * wave - d.sy) * 0.15
            } else if (mode === 'magnify') {
              // 放大镜：点不挪窝，只是近处的点变大
              magnified = 1 + tt * 2.4 * eng
              d.sx += (d.ax - d.sx) * 0.1
              d.sy += (d.ay - d.sy) * 0.1
            } else {
              // bulge（上游默认）：把点朝离指针的方向顶开
              d.sx += (d.ax - Math.cos(angle) * force - d.sx) * 0.15
              d.sy += (d.ay - Math.sin(angle) * force - d.sy) * 0.15
            }
          } else if (!isPush) {
            d.sx += (d.ax - d.sx) * 0.1
            d.sy += (d.ay - d.sy) * 0.1
          }

          if (isPush) {
            d.vx *= 0.9
            d.vy *= 0.9
            d.x = d.ax + d.vx
            d.y = d.ay + d.vy
            d.sx += (d.x - d.sx) * 0.1
            d.sy += (d.y - d.sy) * 0.1
          }

          // 还有没归位的点 → 下一帧还得画
          if (!stillMoving && Math.abs(d.sx - d.ax) + Math.abs(d.sy - d.ay) > 0.05) {
            stillMoving = true
          }

          let drawX = d.sx
          let drawY = d.sy
          if (p.waveAmplitude > 0) {
            drawY += Math.sin(d.ax * 0.03 + t) * p.waveAmplitude
            drawX += Math.cos(d.ay * 0.03 + t * 0.7) * p.waveAmplitude * 0.5
          }

          const r = rad * magnified
          if (p.sparkle) {
            const hash = ((i * 2654435761) ^ (frameCount >> 3)) >>> 0
            if (hash % 100 < 3) {
              ctx.moveTo(drawX + r * 1.8, drawY)
              ctx.arc(drawX, drawY, r * 1.8, 0, TWO_PI)
            } else {
              ctx.moveTo(drawX + r, drawY)
              ctx.arc(drawX, drawY, r, 0, TWO_PI)
            }
          } else {
            ctx.moveTo(drawX + r, drawY)
            ctx.arc(drawX, drawY, r, 0, TWO_PI)
          }
        }

        ctx.fill()
        movingRef.current = stillMoving

        rafRef.current = requestAnimationFrame(tick)
      }

      doResize()
      window.addEventListener('resize', resize)
      window.addEventListener('mousemove', onMouseMove, { passive: true })
      rafRef.current = requestAnimationFrame(tick)

      rebuildRef.current = () => {
        const { w, h } = sizeRef.current
        if (w > 0 && h > 0) {
          buildDots(w, h)
          movingRef.current = true
        }
      }

      return () => {
        cancelAnimationFrame(rafRef.current)
        clearInterval(speedInterval)
        clearTimeout(resizeTimer)
        window.removeEventListener('resize', resize)
        window.removeEventListener('mousemove', onMouseMove)
      }
      // 上游这里有一行 eslint-disable react-hooks/exhaustive-deps；
      // 本项目的 ESLint 配置不会报这条，去掉以免留下「无效的 disable」警告。
    }, [])

    useEffect(() => {
      rebuildRef.current?.()
    }, [dotRadius, dotSpacing])

    return (
      <div className="dot-field-container" {...rest}>
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        />
        <svg
          ref={svgRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <defs>
            <radialGradient id={glowIdRef.current}>
              <stop offset="0%" stopColor={glowColor} />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle
            ref={glowRef}
            cx="-9999"
            cy="-9999"
            r={glowRadius}
            fill={`url(#${glowIdRef.current})`}
            style={{ opacity: 0, willChange: 'opacity' }}
          />
        </svg>
      </div>
    )
  },
)

DotField.displayName = 'DotField'

export default DotField
