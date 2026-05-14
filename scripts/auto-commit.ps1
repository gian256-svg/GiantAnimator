$repoPath = "c:\Users\gianluca.palmisciano\.gemini\antigravity\scratch\GiantAnimator"
Set-Location $repoPath

# ── Sync static files into packaged app ──────────────────────────────────────
$src = "$repoPath\server\public"
$dst = "$repoPath\GiantAnimator-win-x64\resources\app\server\public"

if (Test-Path $dst) {
    $staticFiles = @("app.js", "style.css", "auth.css", "auth.js", "index.html")
    foreach ($f in $staticFiles) {
        $srcFile = "$src\$f"
        $dstFile = "$dst\$f"
        if ((Test-Path $srcFile) -and (Test-Path $dstFile)) {
            $srcTime = (Get-Item $srcFile).LastWriteTime
            $dstTime = (Get-Item $dstFile).LastWriteTime
            if ($srcTime -gt $dstTime) {
                Copy-Item $srcFile $dstFile -Force
                Write-Output "[$(Get-Date -Format 'HH:mm')] Sincronizado: $f"
            }
        }
    }
}

# ── Git commit + push se houver alterações ────────────────────────────────────
$status = git status --porcelain 2>&1
if ($status) {
    git add -A
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    git commit -m "chore(auto): auto-commit $timestamp"
    git push
    Write-Output "[$timestamp] Auto-commit e push realizados."
} else {
    Write-Output "[$(Get-Date -Format 'HH:mm')] Sem alteracoes."
}
