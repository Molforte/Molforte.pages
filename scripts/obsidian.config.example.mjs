// Obsidian 同步配置的模板：复制成 obsidian.config.mjs 再改（那个文件已 gitignore，不会进公开库）。
// **只有列在 volumes 里的「册」会被同步**——白名单即发布闸门，默认全部拒绝。
// 一「册」= vault 里的一个叶子目录（含 README.md / 编号笔记 / img/ 的那个）。
export const VAULT = 'D:\\path\\to\\your\\ObsidianVault'

export const volumes = [
  {
    // vault 里相对 VAULT 的路径（正斜杠）
    vaultPath: '学习笔记/领域/项目/册目录名',
    // 站内 slug：决定 URL /notes/<slug>/<note> 与图片目录 public/images/<slug>/
    slug: 'my-volume',
    // 册的标题（留空则用目录名）
    title: '册标题',
    // 归档用：领域 / 项目
    series: '领域',
    project: '项目',
    // 可选：排除某些文件（写文件名即可）
    exclude: [],
  },
]
