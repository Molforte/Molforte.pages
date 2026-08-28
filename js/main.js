// ===== main.js —— 主题 / 内容块渲染 + 分页 / README 渲染 =====

/* ---------- 主题：默认跟随系统，手动切换后 localStorage 记住 ---------- */
(function () {
  const KEY = 'theme';
  const btn = document.getElementById('themeToggle');
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const saved = localStorage.getItem(KEY);
  const apply = (t) => {
    document.body.classList.toggle('dark', t === 'dark');
    if (btn) btn.textContent = t === 'dark' ? '浅色' : '深色';
  };
  apply(saved || (mq.matches ? 'dark' : 'light'));
  btn?.addEventListener('click', () => {
    const next = document.body.classList.contains('dark') ? 'light' : 'dark';
    localStorage.setItem(KEY, next);
    apply(next);
  });
  mq.addEventListener('change', (e) => {
    if (!localStorage.getItem(KEY)) apply(e.matches ? 'dark' : 'light');
  });
})();

/* ---------- 工具 ---------- */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* 悬浮标签：跟随鼠标位置（用于分页段悬停提示） */
const pageTip = document.createElement('div');
pageTip.className = 'tip';
document.body.appendChild(pageTip);
function showPageTip(text, x, y) {
  pageTip.textContent = text;
  pageTip.style.left = x + 14 + 'px';
  pageTip.style.top = y + 14 + 'px';
  pageTip.classList.add('is-visible');
}
function hidePageTip() { pageTip.classList.remove('is-visible'); }

/* ---------- 文章浮窗（类窗口式：红绿灯 + 渲染整篇 md） ---------- */
const overlay = document.createElement('div');
overlay.className = 'overlay';
overlay.innerHTML = `
  <div class="window">
    <div class="window-bar">
      <div class="lights">
        <span class="light r" data-act="close" title="关闭" role="button"></span>
        <span class="light y" data-act="min" title="最小化" role="button"></span>
        <span class="light g" data-act="max" title="缩放" role="button"></span>
      </div>
    </div>
    <div class="window-body"></div>
  </div>`;
document.body.appendChild(overlay);
const winEl = overlay.querySelector('.window');
const winBody = overlay.querySelector('.window-body');

function closeArticle() {
  overlay.classList.remove('is-open');
  document.body.style.overflow = '';
}
async function openArticle(md) {
  if (!md) return;
  try {
    const res = await fetch(md);
    if (!res.ok) throw new Error(res.status);
    winBody.innerHTML = marked.parse(await res.text());
  } catch (e) {
    winBody.innerHTML = '<p class="muted">文章加载失败。</p>';
  }
  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
  history.pushState({ article: true }, '');
  // 手机端取消预览窗：打开即整页
  if (window.matchMedia('(max-width: 720px)').matches) winEl.classList.add('max');
}
overlay.querySelector('[data-act="close"]').addEventListener('click', closeArticle);
overlay.querySelector('[data-act="max"]').addEventListener('click', () => winEl.classList.toggle('max'));
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeArticle(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeArticle(); });
window.addEventListener('popstate', () => { if (overlay.classList.contains('is-open')) closeArticle(); });

// 读取某篇 md 的前三行正文作为摘要（跳过标题行 # 与空行、去 md 标记）
async function excerptFor(it) {
  if (!it.md) return { ...it, excerpt: '' };
  try {
    const res = await fetch(it.md);
    if (!res.ok) throw new Error(res.status);
    const text = await res.text();
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length && !/^#/.test(l))
      .map((l) => l.replace(/^[*\-+]\s*|^>\s*/g, ''));
    return { ...it, excerpt: lines.slice(0, 3).join('\n') };
  } catch {
    return { ...it, excerpt: '' };
  }
}

/* 每项竖线高度 = 标题区高 + 3 行正文（避开预留的第 4 个空行） */
function sizeLines(container) {
  container.querySelectorAll('.item').forEach((item) => {
    const head = item.querySelector('.item-head');
    const intro = item.querySelector('.item-intro');
    if (!head || !intro) return;
    const headH = head.offsetHeight;
    const lineH = parseFloat(getComputedStyle(intro).lineHeight) || 27;
    item.style.setProperty('--line-h', headH + lineH * 3 + 'px');
  });
}

/* ---------- 内容块渲染 + 分页 ---------- */
async function renderItems(listId, pagerId, items, perPage) {
  const target = document.getElementById(listId);
  const pager = document.getElementById(pagerId);
  const data = await Promise.all(items.map(excerptFor));
  const pages = Math.max(1, Math.ceil(data.length / perPage));
  let current = 1;

  function itemHtml(it) {
    return `<a class="item" href="${esc(it.url || '#')}" data-md="${esc(it.md || '')}">
      <div class="item-head"><span class="item-title">${esc(it.title)}</span><span class="item-cat">${esc(it.cat || '')}</span></div>
      <p class="item-intro">${esc(it.excerpt || '')}</p>
    </a>`;
  }

  function draw() {
    const start = (current - 1) * perPage;
    target.innerHTML = data.slice(start, start + perPage).map(itemHtml).join('');
    sizeLines(target);

    // 分页器：细线分段（当前橙、其余白），非按钮；悬停分段显示跟随鼠标的页号标签
    if (pages <= 1) { pager.hidden = true; pager.innerHTML = ''; hidePageTip(); return; }
    pager.hidden = false;
    hidePageTip();
    let segs = '';
    for (let i = 0; i < pages; i++) {
      const p = i + 1;
      segs += `<span class="p-seg${p === current ? ' cur' : ''}" data-p="${p}" data-label="${p}" aria-label="第 ${p} 页"></span>`;
    }
    pager.innerHTML = `
      <span class="p-arrow${current === 1 ? ' disabled' : ''}" data-p="${current - 1}" aria-label="上一页">‹</span>
      <div class="p-track">
        <span class="p-num">${current}</span>
        ${segs}
      </div>
      <span class="p-arrow${current === pages ? ' disabled' : ''}" data-p="${current + 1}" aria-label="下一页">›</span>`;
    pager.querySelectorAll('[data-p]').forEach((el) =>
      el.addEventListener('click', () => {
        const p = parseInt(el.dataset.p, 10);
        if (el.classList.contains('disabled')) return;
        if (p >= 1 && p <= pages) { current = p; draw(); }
      }));
    // 悬停分段 → 跟随鼠标的页号标签
    pager.querySelectorAll('.p-seg[data-label]').forEach((seg) => {
      seg.addEventListener('mousemove', (e) => showPageTip(seg.dataset.label, e.clientX, e.clientY));
      seg.addEventListener('mouseleave', hidePageTip);
    });
    // 当前页号定位到当前橙色段上方
    const curSeg = pager.querySelector('.p-seg.cur');
    const num = pager.querySelector('.p-num');
    if (curSeg && num) num.style.left = (curSeg.offsetLeft + curSeg.offsetWidth / 2) + 'px';
  }
  // 点击条目 → 打开文章浮窗（渲染整篇 md）
  target.addEventListener('click', (e) => {
    const item = e.target.closest('.item');
    if (!item) return;
    e.preventDefault();
    openArticle(item.dataset.md);
  });
  draw();
}

renderItems('recent-cards', 'recent-pager', RECENT, 5);
renderItems('project-cards', 'project-pager', PROJECTS, 3);

/* ---------- 友链 ---------- */
(function () {
  const ul = document.getElementById('friends-list');
  if (!ul) return;
  ul.innerHTML = FRIENDS.map((f) =>
    `<li><span class="plus">·</span><a href="${esc(f.url || '#')}">${esc(f.name)}</a></li>`).join('');
})();

/* ---------- README 导入（标题降级 h1→h2→h3…） ---------- */
function demoteHeadings(html) {
  return html
    .replace(/<h(\d)([^>]*)>/g, (m, n, attrs) => `<h${+n + 1}${attrs}>`)
    .replace(/<\/h(\d)>/g, (m, n) => `</h${+n + 1}>`);
}

async function loadMarkdown(elId, file) {
  const el = document.getElementById(elId);
  if (!el) return;
  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error(res.status);
    const md = await res.text();
    el.innerHTML = demoteHeadings(marked.parse(md));
  } catch (e) {
    el.innerHTML = '<p class="muted">内容加载失败——请通过本地 HTTP 服务器预览（如 <code>node serve.mjs</code>），或直接打开部署后的站点。</p>';
  }
}
loadMarkdown('intro', 'intro.md');
loadMarkdown('friends-intro', 'friends.md');
