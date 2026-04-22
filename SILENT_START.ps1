# SILENT_START.ps1
# Inicia o GiantAnimator em segundo plano, sem janelas de CMD aparecendo.

$RootDir = Get-Location
$ServerDir = Join-Path $RootDir "server"
$LogFile = Join-Path $RootDir "logs\server.log"
$ErrFile = Join-Path $RootDir "logs\server_error.log"

Write-Host "🚀 Encerrando instâncias anteriores..." -ForegroundColor Cyan
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

if (!(Test-Path (Join-Path $RootDir "logs"))) { New-Item -ItemType Directory -Path (Join-Path $RootDir "logs") }

Write-Host "🌐 Iniciando servidor em segundo plano (Portal 3000)..." -ForegroundColor Green
# Usa -WindowStyle Hidden para não mostrar a janela de comando
# Redirecionamos para arquivos diferentes para evitar erro do PowerShell
Start-Process "node" -ArgumentList "node_modules\tsx\dist\cli.mjs", "watch", "index.ts" `
    -WorkingDirectory $ServerDir `
    -WindowStyle Hidden `
    -RedirectStandardOutput $LogFile `
    -RedirectStandardError $ErrFile

Write-Host "✅ GiantAnimator está rodando em segundo plano!" -ForegroundColor Yellow
Write-Host "Acompanhe os logs em: Get-Content logs\server.log -Wait"
