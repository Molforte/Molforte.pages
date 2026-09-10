# 把本地仓库推到 GitHub 并触发 Pages 部署。
# 用法：pwsh -File scripts/push-to-github.ps1
# 说明：本机 hosts 把 github.com 指向了 127.0.0.1（Steam++/Watt Toolkit 写入），
#       连通性检查失败时请先关掉它的加速开关，或用能访问 GitHub 的网络。

$ErrorActionPreference = 'Stop'
$repo = 'https://github.com/Molforte/Molforte.pages.git'

Write-Host '== 1/4 检查工作区 ==' -ForegroundColor Cyan
$dirty = git status --porcelain
if ($dirty) {
  Write-Host '有未提交的改动，请先 commit（我不想替你决定提交内容）：' -ForegroundColor Yellow
  git status --short
  exit 1
}
Write-Host '工作区干净 ✓'

Write-Host '== 2/4 检查远端 ==' -ForegroundColor Cyan
$origin = (git remote get-url origin 2>$null)
if (-not $origin) {
  git remote add origin $repo
  Write-Host "已添加 origin = $repo"
} else {
  Write-Host "origin = $origin"
}

Write-Host '== 3/4 检查连通性 ==' -ForegroundColor Cyan
git -c http.sslBackend=openssl ls-remote origin HEAD | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host '无法访问 GitHub。请先关闭 Steam++ 加速 / 检查 hosts 里的 github.com 条目。' -ForegroundColor Red
  exit 1
}
Write-Host 'GitHub 可达 ✓'

Write-Host '== 4/4 推送 main ==' -ForegroundColor Cyan
git push -u origin main
Write-Host ''
Write-Host '推送完成。接下来在网页上做两件事：' -ForegroundColor Green
Write-Host '  1. 仓库 Settings → Pages → Source 选 “GitHub Actions”'
Write-Host '  2. 打开 Actions 标签页，等 “Deploy to GitHub Pages” 跑完'
Write-Host '  站点地址：https://molforte.github.io/Molforte.pages/'
