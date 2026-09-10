# 把本地仓库推到 GitHub 并触发 Pages 部署。
# 用法（Windows PowerShell 5.1 / PowerShell 7 都可以）：
#   powershell -ExecutionPolicy Bypass -File scripts\push-to-github.ps1
#
# 说明：本机 hosts 把 github.com 指向了 127.0.0.1（Steam++ / Watt Toolkit 写入）。
#       连通性检查失败时，请先关掉它的加速开关，或换一个能访问 GitHub 的网络。

Set-Location -Path (Split-Path -Parent $PSScriptRoot)
$repo = 'https://github.com/Molforte/Molforte.pages.git'

if (-not (Test-Path '.git')) {
    Write-Host '这里不是 git 仓库根目录，找不到 .git' -ForegroundColor Red
    exit 1
}

Write-Host '== 1/4 检查工作区 ==' -ForegroundColor Cyan
$dirty = git status --porcelain
if ($dirty) {
    Write-Host '有未提交的改动，请先 commit：' -ForegroundColor Yellow
    git status --short
    exit 1
}
Write-Host '工作区干净 OK'

Write-Host '== 2/4 检查远端 ==' -ForegroundColor Cyan
$origin = git remote get-url origin 2>$null
if (-not $origin) {
    git remote add origin $repo
    Write-Host "已添加 origin = $repo"
} else {
    Write-Host "origin = $origin"
}

Write-Host '== 3/4 检查连通性 ==' -ForegroundColor Cyan
git ls-remote origin HEAD | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host ''
    Write-Host '无法访问 GitHub。常见原因：' -ForegroundColor Red
    Write-Host '  1) Steam++ / Watt Toolkit 的加速开关开着（它把 github.com 写进了 hosts 指到 127.0.0.1）'
    Write-Host '  2) 当前网络无法直连 GitHub（需要代理）'
    Write-Host '  处理后再运行本脚本即可。'
    exit 1
}
Write-Host 'GitHub 可达 OK'

Write-Host '== 4/4 推送 main ==' -ForegroundColor Cyan
Write-Host '（如果弹出登录窗口，按提示用浏览器登录 GitHub 授权即可）'
git push -u origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host '推送失败，把上面的报错发我。' -ForegroundColor Red
    exit 1
}

Write-Host ''
Write-Host '推送完成。接着在网页上做两件事：' -ForegroundColor Green
Write-Host '  1. 仓库 Settings -> Pages -> Source 选 “GitHub Actions”'
Write-Host '  2. 打开 Actions 标签，等 “Deploy to GitHub Pages” 跑完（约 1 分钟）'
Write-Host '  站点地址：https://molforte.github.io/Molforte.pages/'
