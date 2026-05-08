# build-desktop.ps1 — Builds GiantAnimator portable Windows app
# Usage: powershell -ExecutionPolicy Bypass -File scripts/build-desktop.ps1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ROOT = Resolve-Path "$PSScriptRoot\.."
Set-Location $ROOT

Write-Host "`n=== [1/5] Instalando dependencias ===" -ForegroundColor Cyan
npm install

Write-Host "`n=== [2/5] Compilando servidor TypeScript ===" -ForegroundColor Cyan
Set-Location "$ROOT\server"
npx tsc -p tsconfig.server.json
Set-Location $ROOT

Write-Host "`n=== [3/5] Pre-compilando bundle Remotion ===" -ForegroundColor Cyan
node scripts/prebundle.mjs

Write-Host "`n=== [4/5] Construindo app Electron ===" -ForegroundColor Cyan
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"
npx electron-builder --win dir --publish never

Write-Host "`n=== [5/5] Criando arquivo ZIP ===" -ForegroundColor Cyan
$unpackedDir = "$ROOT\dist\electron-out\win-unpacked"
$zipPath     = "$ROOT\GiantAnimator-win-x64.zip"

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path "$unpackedDir\*" -DestinationPath $zipPath

Write-Host "`n✅ Pronto! ZIP gerado em: $zipPath" -ForegroundColor Green
Write-Host "   Extraia e execute GiantAnimator.exe" -ForegroundColor Green
Write-Host "   Coloque o arquivo .env na pasta resources\app\ antes de iniciar" -ForegroundColor Yellow
