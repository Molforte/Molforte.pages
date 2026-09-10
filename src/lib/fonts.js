// 代码字体：Sarasa Mono SC 精简子集（自托管）。
// 为什么要用 JS 显式加载：浏览器对「声明了但尚未用到」的 @font-face 会延迟加载，
// 而代码块的字体栈里第一个族名（用户本机可能装的完整版 Sarasa Mono SC）通常不存在，
// 于是子集经常一直停在 unloaded。这里在启动时主动 load 一次，渲染即可稳定用上。
//
// 许可见 third_party/sarasa-gothic/；子集由 scripts/build-font-subset.mjs 生成。
import codeFontUrl from '../assets/fonts/sarasa-mono-sc-subset.woff2?url'

const FAMILY = 'Sarasa Mono SC Web'

export function loadCodeFont() {
  if (typeof window === 'undefined' || typeof FontFace === 'undefined') return
  try {
    const face = new FontFace(FAMILY, `url(${codeFontUrl}) format('woff2')`, {
      style: 'normal',
      weight: '400',
      display: 'swap',
    })
    face.load().then(
      (loaded) => document.fonts.add(loaded),
      () => {
        /* 加载失败就回落到系统等宽，不打扰用户 */
      },
    )
  } catch {
    /* 同上 */
  }
}

export const CODE_FONT_FAMILY = FAMILY
