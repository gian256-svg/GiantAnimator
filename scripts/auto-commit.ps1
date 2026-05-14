$repoPath = "c:\Users\gianluca.palmisciano\.gemini\antigravity\scratch\GiantAnimator"
Set-Location $repoPath

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
