# Watch Sync script - Keeps K: drive updated in real-time
$Source = Get-Location
$Destination = "K:\Shared\GiantAnimator"

echo "📡 WATCHER ATIVO: Sincronizando alterações para $Destination..."
echo "Pressione Ctrl+C para parar."

# /MON:1 -> Roda novamente após 1 alteração
# /MOT:1 -> Tempo de espera de 1 minuto entre checagens se houver alteração
robocopy "$Source" "$Destination" /MIR /MT:8 /XD .git node_modules cache remotion-project/node_modules output jobs uploads .gemini /XF .env *.log /R:0 /W:0 /MON:1 /MOT:1
