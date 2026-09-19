import { useId, useMemo, useRef, useState } from 'react'
import MarkdownBody from './MarkdownBody.jsx'

/** 把渲染好的整页 HTML 按 <h1> 切成若干段：一个 H1 = 一个标签页 */
function splitSections(html) {
  return String(html)
    .split(/(?=<h1[^>]*>)/i)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part, i) => {
      const m = /^<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(part)
      const title = m ? m[1].replace(/<[^>]+>/g, '').trim() : `第 ${i + 1} 节`
      return { id: `s${i}`, title, body: m ? part.slice(m[0].length) : part }
    })
}

/**
 * 卡片内部的标签页：一页一份内容，标题取自 markdown 里的 H1。
 *
 * 视觉照 Uiverse 那份 radio tabs 移植：一条浅灰标签栏，选中的标签底色与下面的
 * 面板一致，两侧用两块「缺口」小方块（box-shadow 补反向圆角）把标签和面板接成一张纸。
 *
 * 与那份实现的三处不同：
 *  1. 颜色换成站点 token，不再是写死的绿 + 灰；
 *  2. 面板走正常文档流。原实现是 position: absolute，卡片撑不开高度，
 *     换个长一点的标签页就会盖到下面的内容上；
 *  3. 交互用真正的 ARIA 标签页（role="tab"/"tabpanel" + 左右方向键），
 *     不是隐藏的 radio。这里本来就是「切内容面板」，tab 语义是对的。
 */
export default function WhoamiTabs({ html, label = 'Whoami' }) {
  const sections = useMemo(() => splitSections(html), [html])
  const [active, setActive] = useState(0)
  const barRef = useRef(null)
  const uid = useId()

  if (sections.length === 0) return null

  const onKeyDown = (e) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (active + step + sections.length) % sections.length
    setActive(next)
    // 焦点跟着走，否则方向键按了没反馈
    barRef.current?.querySelectorAll('[role="tab"]')[next]?.focus()
  }

  return (
    <div className="wtabs">
      <div
        className="wtabs__bar"
        role="tablist"
        aria-label={label}
        ref={barRef}
        onKeyDown={onKeyDown}
      >
        {sections.map((s, i) => {
          const selected = i === active
          return (
            <button
              key={s.id}
              type="button"
              role="tab"
              id={`${uid}-${s.id}`}
              aria-selected={selected}
              aria-controls={`${uid}-${s.id}-panel`}
              tabIndex={selected ? 0 : -1}
              className="wtabs__tab"
              onClick={() => setActive(i)}
            >
              {/* 这两块小方块是让标签和面板「连成一张纸」的缺口 */}
              <span className="wtabs__name">
                <span className="wtabs__notch wtabs__notch--pre" aria-hidden="true" />
                <span className="wtabs__notch wtabs__notch--pos" aria-hidden="true" />
                <span className="wtabs__label">{s.title}</span>
              </span>
            </button>
          )
        })}
      </div>

      {/* 三块面板叠在同一个网格格里（见 .wtabs__panels）：容器高度 = 最高的那块，
          切页签时卡片不跳。非活动的用 visibility 藏——它既能从无障碍树里消失、
          里面的链接也拿不到焦点，同时**仍然占位**（display:none / hidden 会塌掉高度）。 */}
      <div className="wtabs__panels">
        {sections.map((s, i) => (
          <div
            key={s.id}
            className={`wtabs__panel${i === active ? ' is-active' : ''}`}
            role="tabpanel"
            id={`${uid}-${s.id}-panel`}
            aria-labelledby={`${uid}-${s.id}`}
          >
            {/* 复用文章正文那套排版，只在外面收一档字号（见 .wtabs__body） */}
            <MarkdownBody html={s.body} className="post-body wtabs__body" />
          </div>
        ))}
      </div>
    </div>
  )
}
