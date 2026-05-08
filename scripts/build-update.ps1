# build-update.ps1
# Compila, bumpa versão, cria GitHub Release com o zip de atualização, faz push.
#
# Uso: powershell -ExecutionPolicy Bypass -File scripts/build-update.ps1 [-Version "1.0.2"]
#
# Requer: GITHUB_TOKEN no ambiente ou hardcoded abaixo.

param([string]$Version = "")

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ROOT        = Resolve-Path "$PSScriptRoot\.."
$REPO_OWNER  = "gian256-svg"
$REPO_NAME   = "GiantAnimator"
$GITHUB_TOKEN = $env:GITHUB_TOKEN
if (-not $GITHUB_TOKEN) {
  # Extrai o token do remote URL do git (caso esteja embutido)
  $remoteUrl = git -C $ROOT remote get-url origin 2>$null
  if ($remoteUrl -match 'https://([^@]+)@') { $GITHUB_TOKEN = $Matches[1] }
}
if (-not $GITHUB_TOKEN) {
  Write-Error "GITHUB_TOKEN não encontrado. Defina a variável de ambiente GITHUB_TOKEN."
  exit 1
}

$headers = @{
  Authorization = "token $GITHUB_TOKEN"
  Accept        = "application/vnd.github.v3+json"
  "User-Agent"  = "GiantAnimator-Updater"
}

Set-Location $ROOT

# ── 1. Compilar TypeScript ────────────────────────────────────────
Write-Host "`n=== [1/5] Compilando servidor TypeScript ===" -ForegroundColor Cyan
Set-Location "$ROOT\server"
npx tsc -p tsconfig.server.json
Set-Location $ROOT

# ── 2. Determinar nova versão ─────────────────────────────────────
Write-Host "`n=== [2/5] Calculando versão ===" -ForegroundColor Cyan
$versionData = Get-Content "$ROOT\version.json" | ConvertFrom-Json
$currentVersion = $versionData.version

if ($Version -eq "") {
  $parts = $currentVersion.Split('.')
  $parts[2] = [int]$parts[2] + 1
  $Version = $parts -join '.'
}
$tag = "v$Version"
Write-Host "   $currentVersion  →  $Version"

# ── 3. Criar zip de atualização ───────────────────────────────────
Write-Host "`n=== [3/5] Criando zip de atualização ===" -ForegroundColor Cyan
$zipPath = "$ROOT\update-$Version.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

$tmpDir = "$ROOT\.update-tmp"
if (Test-Path $tmpDir) { Remove-Item $tmpDir -Recurse -Force }
New-Item -ItemType Directory -Path $tmpDir | Out-Null

# Arquivos atualizáveis (sem node_modules, sem remotion-bundle, sem .env)
$foldersToInclude = @('electron', 'server\dist', 'server\public', 'server\prompts')
foreach ($folder in $foldersToInclude) {
  $src = "$ROOT\$folder"
  $dst = "$tmpDir\$folder"
  if (Test-Path $src) {
    New-Item -ItemType Directory -Path (Split-Path $dst) -Force | Out-Null
    Copy-Item $src $dst -Recurse -Force
  }
}
Copy-Item "$ROOT\version.json" "$tmpDir\version.json"

Compress-Archive -Path "$tmpDir\*" -DestinationPath $zipPath
Remove-Item $tmpDir -Recurse -Force
$zipSize = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
Write-Host "   ZIP: $zipPath ($zipSize MB)"

# ── 4. Publicar GitHub Release ────────────────────────────────────
Write-Host "`n=== [4/5] Publicando GitHub Release $tag ===" -ForegroundColor Cyan

# Cria release
$releaseBody = @{
  tag_name         = $tag
  target_commitish = "master"
  name             = "GiantAnimator $Version"
  body             = "Atualização automática $Version — $(Get-Date -Format 'yyyy-MM-dd')"
  draft            = $false
  prerelease       = $false
} | ConvertTo-Json

$release = Invoke-RestMethod `
  -Uri "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases" `
  -Method POST `
  -Headers $headers `
  -Body $releaseBody `
  -ContentType "application/json"

Write-Host "   Release criada: $($release.html_url)"

# Faz upload do zip como asset
$uploadUrl = $release.upload_url -replace '\{.*\}', "?name=update.zip"
$zipBytes  = [System.IO.File]::ReadAllBytes($zipPath)
Invoke-RestMethod `
  -Uri $uploadUrl `
  -Method POST `
  -Headers $headers `
  -Body $zipBytes `
  -ContentType "application/zip" | Out-Null

Write-Host "   Asset 'update.zip' publicado."

# ── 5. Atualizar version.json e fazer push ────────────────────────
Write-Host "`n=== [5/5] Atualizando version.json e fazendo push ===" -ForegroundColor Cyan

$newVersionData = @{
  version = $Version
  date    = (Get-Date -Format "yyyy-MM-dd")
  zipUrl  = "https://github.com/$REPO_OWNER/$REPO_NAME/releases/download/$tag/update.zip"
}
$newVersionData | ConvertTo-Json | Set-Content "$ROOT\version.json" -Encoding UTF8

# Sincroniza os arquivos compilados no app local (GiantAnimator-win-x64)
$appDir = "$ROOT\GiantAnimator-win-x64\resources\app"
if (Test-Path $appDir) {
  Write-Host "   Sincronizando app local..." -ForegroundColor Gray
  foreach ($folder in $foldersToInclude) {
    $src = "$ROOT\$folder"
    $dst = "$appDir\$folder"
    if (Test-Path $src) { Copy-Item "$src\*" $dst -Recurse -Force }
  }
  Copy-Item "$ROOT\version.json" "$appDir\version.json" -Force
}

git -C $ROOT add version.json server/dist electron
git -C $ROOT commit -m "chore: release $Version"
git -C $ROOT push

Remove-Item $zipPath -Force

Write-Host "`n✅ Versão $Version publicada com sucesso!" -ForegroundColor Green
Write-Host "   GitHub Release: https://github.com/$REPO_OWNER/$REPO_NAME/releases/tag/$tag" -ForegroundColor Cyan
Write-Host "   Manifest:       https://raw.githubusercontent.com/$REPO_OWNER/$REPO_NAME/master/version.json" -ForegroundColor Cyan
