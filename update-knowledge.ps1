# update-knowledge.ps1
# Execute para adicionar novos vídeos à base

param(
  [string]$SearchQuery = "charts animation data visualization motion graphics",
  [int]   $NumVideos   = 5,
  [int]   $MaxDuration = 180
)

$base      = "C:\Users\gianluca.palmisciano\.gemini\antigravity\scratch\GiantAnimator\knowledge-base"
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "🔍 Query: $SearchQuery"
Write-Host "📥 Quantidade: $NumVideos vídeos (máx ${MaxDuration}s)"

$newVideosDir = "$base\videos\batch_$timestamp"
mkdir $newVideosDir -Force

yt-dlp `
  "ytsearch${NumVideos}:$SearchQuery" `
  --output "$newVideosDir\%(autonumber)s_%(title)s.%(ext)s" `
  --format "bestvideo[height<=720][ext=mp4]+bestaudio/best[height<=720]" `
  --match-filter "duration < $MaxDuration" `
  --merge-output-format mp4 `
  --no-playlist

$newFramesDir = "$base\frames\raw\batch_$timestamp"
mkdir $newFramesDir -Force

Get-ChildItem $newVideosDir -Filter "*.mp4" | ForEach-Object {
  $videoName = $_.BaseName -replace '[^a-zA-Z0-9]', '_'
  $outputDir = "$newFramesDir\$videoName"
  mkdir $outputDir -Force

  ffmpeg -i $_.FullName `
    -vf "fps=0.5,scale=1280:-1" `
    -q:v 2 `
    "$outputDir\frame_%04d.jpg" `
    -hide_banner -loglevel warning

  Write-Host "✅ $($_.Name) → $((Get-ChildItem $outputDir).Count) frames"
}

Write-Host ""
Write-Host "✅ Batch $timestamp pronto para análise!"
Write-Host "👉 Rode o agente e peça para analisar: $newFramesDir"
Write-Host "   e consolidar no animation-knowledge.md (qualityScore >= 7 apenas)"
