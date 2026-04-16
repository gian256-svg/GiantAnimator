# Sync script for mirroring project to Shared Drive K:
$Source = Get-Location
$Destination = "K:\Shared\GiantAnimator"

echo "🔄 Iniciando sincronização para $Destination..."

# Robocopy options:
# /MIR: Mirroring (deletes files in destination not in source)
# /MT: Multi-threaded
# /XD: Exclude directories
# /XF: Exclude files
# /R:0 /W:0: Don't retry/wait on busy files (good for dev)

robocopy "$Source" "$Destination" /MIR /MT:8 /XD .git node_modules cache remotion-project/node_modules output jobs uploads .gemini /XF .env *.log /R:0 /W:0

echo "✅ Sincronização concluída!"
