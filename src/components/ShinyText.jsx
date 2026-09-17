// React Bits —— ShinyText（JavaScript + CSS 变体）
// 来源：https://reactbits.dev/text-animations/shiny-text
//       https://github.com/DavidHDev/react-bits（src/content/TextAnimations/ShinyText）
//
// 上游的 JS 变体用 motion/react 的 useAnimationFrame 逐帧算 background-position，
// 本站没有（也不打算）引 motion，所以换成一条等价的 CSS keyframes 动画：
// 渐变角度 120deg、background-size 200%、位移区间 150% → -50% 都照上游数值，
// 只是把「逐帧 set」换成「一条无限循环的动画」。渐变的两个颜色由使用处给
// （见 global.css 里 .hero-btn--primary 的 --shiny-base / --shiny-shine）。
export default function ShinyText({ text, className = '' }) {
  return <span className={`shiny-text${className ? ` ${className}` : ''}`}>{text}</span>
}
