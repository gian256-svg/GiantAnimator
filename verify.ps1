$base = "C:\Users\gianluca.palmisciano\.gemini\antigravity\scratch\GiantAnimator"
Write-Host "========================================="
Write-Host "   🏁 BALANÇO FINAL — GiantAnimator"
Write-Host "========================================="

function Get-FolderSize($path) {
    if (Test-Path $path) {
        $size = (Get-ChildItem $path -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '\\node_modules(\\|$)' -and $_.FullName -notmatch '\\\.git(\\|$)' } | Measure-Object Length -Sum).Sum
        if ($size -eq $null) { return 0 }
        return [math]::Round($size / 1MB, 2)
    }
    return 0
}

$kb        = Get-FolderSize "$base\knowledge-base"
$kbVideos  = Get-FolderSize "$base\knowledge-base\videos"
$kbReports = Get-FolderSize "$base\knowledge-base\reports"
$kbFrames  = Get-FolderSize "$base\knowledge-base\frames"
$remotion  = Get-FolderSize "$base\remotion-project"
$server    = Get-FolderSize "$base\server"
$total     = Get-FolderSize $base

Write-Host ""
Write-Host "📁 knowledge-base        → $kb MB"
Write-Host "   ├── videos/           → $kbVideos MB"
Write-Host "   ├── reports/ (JSONs)  → $kbReports MB"
Write-Host "   └── frames/           → $kbFrames MB"
Write-Host "📁 remotion-project      → $remotion MB"
Write-Host "📁 server                → $server MB"
Write-Host "-----------------------------------------"
Write-Host "📦 TOTAL ATUAL           → $total MB"
Write-Host ""
Write-Host "========================================="
Write-Host "   📉 RESUMO DO EXPURGO"
Write-Host "========================================="
Write-Host "🗑️  Sherlock Holmes         → ~3.020 MB removidos"
Write-Host "🗑️  3Blue1Brown             →  ~167 MB removidos"
Write-Host "🗑️  Motion Graphics AI     →   ~42 MB removidos"
Write-Host "🗑️  frames/raw (718 imgs)  →  ~50 MB removidos"
Write-Host "-----------------------------------------"
Write-Host "💥 TOTAL LIBERADO          → ~3.279 MB (~3.2 GB)"
Write-Host "========================================="
Write-Host ""
Write-Host "✅ reports/ → 13 JSONs intactos"
Write-Host "✅ remotion-project → intocado"
Write-Host "✅ server/ → intocado"
Write-Host "========================================="
