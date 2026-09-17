// 首页那排圆形社交按钮（Bilibili / GitHub / Email）。
// 样式来源：Uiverse.io by GigioBagigi0 的 .card / .social-icons——
//   一排等距图标；指向某一枚时它浮出名字气泡，同时**其余几枚模糊并缩小**，
//   视线自然被拉到指针那一枚上。颜色换成站点 token，气泡用的也是站点的浮层配色。
// 内容来自 src/site.js 的 SITE.social；href 留空的那项会自动不显示。
import { SITE } from '../site.js'

// GitHub 标记：品牌图形，取自 Simple Icons 的官方路径（本站没有图标库，
// 与其他图标一样内联 SVG，不为了一个标记引依赖）
const GITHUB_PATH =
  'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'

const ICON = {
  // B 站：圆角电视 + 两根天线 + 两只眼睛（描边版，和站内其他图标同一套画法）
  bilibili: (
    <>
      <path d="M6.6 4.3 9 6.7" />
      <path d="M17.4 4.3 15 6.7" />
      <rect x="3.2" y="6.7" width="17.6" height="12.6" rx="3.2" />
      <circle cx="9.2" cy="12.6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.8" cy="12.6" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  github: <path d={GITHUB_PATH} fill="currentColor" stroke="none" />,
  email: (
    <>
      <rect x="3.2" y="5.6" width="17.6" height="12.8" rx="2.4" />
      <path d="m3.9 7.2 7.2 5.4a1.5 1.5 0 0 0 1.8 0l7.2-5.4" />
    </>
  ),
}

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.7',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
}

export default function SocialLinks() {
  const items = (SITE.social || []).filter((s) => s && s.href && ICON[s.key])
  if (items.length === 0) return null

  return (
    <div className="social-card">
      {items.map((s) => {
        const external = !s.href.startsWith('mailto:')
        return (
          <a
            key={s.key}
            className={`social-card__item social-card__item--${s.key}`}
            href={s.href}
            aria-label={s.label}
            {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
          >
            <svg className="social-card__icon" {...ICON_PROPS}>
              {ICON[s.key]}
            </svg>
            {/* 名字气泡：指针停在上面时浮出来（读屏另有 aria-label，不重复念） */}
            <span className="social-card__label" aria-hidden="true">
              {s.label}
            </span>
          </a>
        )
      })}
    </div>
  )
}
