// ============================================================
// 站点设置 —— 改这里即可，不需要动任何组件
// ============================================================

export const SITE = {
  // 主标题（浏览器标题、页脚署名；首页大字改由下面的 welcome 承担）
  title: '札记',

  // 文末印章上的字（建议与标题呼应）
  sealChar: '札',

  // 作者署名（页脚版权）
  author: 'Molforte',

  // 首页首屏 · 欢迎语（大字标题）。数组 = 一行一句，断行由你说了算；
  // 想只写一行就写成普通字符串（'Hi' 或 ['Hi'] 都行）。
  // 撇号用的是弯引号 ’（放大到 80px 时直引号 ' 会很像一根竖棍）。
  welcome: ['Hi, Welcome to my Lab!', 'I’m Molforte'],

  // 首页首屏 · 会朝鼠标方向偏出去的那个词（必须是 welcome 里出现过的一段，
  // 比如 'Molforte'）：它朝指针平移，偏走的地方露出原位那层蓝色残影；
  // 留空字符串就完全没有这个效果。
  magnetic: 'Molforte',

  // 首页首屏 · 格言（标题下的第一行小字）
  motto: '已是悬崖百丈冰，犹有花枝俏。',

  // 首页首屏 · 主按钮。默认点了**往下滑一屏**（也就是「主页第二页」），不是跳路由；
  // 想让它跳某个页面就补一个 to: '/archive'——有 to 的时候优先跳转。
  start: { label: 'Get Started' },

  // 首页首屏 · 联系方式（一排圆形社交按钮，替掉原来那个 GitHub 按钮）。
  // key 决定用哪个图标：bilibili / github / email；href 留空字符串就自动不显示那一项。
  // TODO：把 B 站 UID 和邮箱换成你自己的。
  social: [
    { key: 'bilibili', label: 'Bilibili', href: 'https://space.bilibili.com/1234567890' },
    { key: 'github', label: 'GitHub', href: 'https://github.com/Molforte/Molforte.pages' },
    { key: 'email', label: 'Email', href: 'mailto:molforte@example.com' },
  ],

  // 页脚一句话说明
  footerNote: '用 Markdown 写作 · 用 React 构建 · 部署在 GitHub Pages',

  // 建站年份（页脚版权起始）
  since: 2026,
}
