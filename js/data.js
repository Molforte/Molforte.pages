// ===== data.js —— 文章 / 项目 / 友链数据（改这里即可增删内容） =====
// 每篇文章对应 posts/ 下一个 md；摘要自动读取该 md 的前三行。

// 最近（每页展示 5 个，超过自动翻页）
const RECENT = [
  { title: '占位文章 1', cat: '分类A', url: 'posts/placeholder-1.md', md: 'posts/placeholder-1.md' },
  { title: '占位文章 2', cat: '分类B', url: 'posts/placeholder-2.md', md: 'posts/placeholder-2.md' },
  { title: '占位文章 3', cat: '分类C', url: 'posts/placeholder-3.md', md: 'posts/placeholder-3.md' },
  { title: '占位文章 4', cat: '分类A', url: 'posts/placeholder-4.md', md: 'posts/placeholder-4.md' },
  { title: '占位文章 5', cat: '分类B', url: 'posts/placeholder-5.md', md: 'posts/placeholder-5.md' },
  { title: '占位文章 6', cat: '分类C', url: 'posts/placeholder-6.md', md: 'posts/placeholder-6.md' },
];

// 项目（每页展示 3 个，超过自动翻页）
const PROJECTS = [
  { title: '占位项目 1', cat: '项目', url: 'posts/placeholder-7.md', md: 'posts/placeholder-7.md' },
  { title: '占位项目 2', cat: '项目', url: 'posts/placeholder-8.md', md: 'posts/placeholder-8.md' },
  { title: '占位项目 3', cat: '项目', url: 'posts/placeholder-9.md', md: 'posts/placeholder-9.md' },
  { title: '占位项目 4', cat: '项目', url: 'posts/placeholder-10.md', md: 'posts/placeholder-10.md' },
];

// 友链（· Name 列表，Name 为链接）
const FRIENDS = [
  { name: 'Twisuki', url: 'https://blog.twis.uk/' },
];
