# audit.ps1 — GiantAnimator Chart Audit
# Detecta: fontes hardcoded, layouts fixos, inflação de escala de dados

Select-String `
  -Path remotion-project/src/components/*.tsx `
  -Pattern `
    "fontSize:\s*\d+[^*]", `
    "usableWidth\s*=\s*\d{4}", `
    "(maxV?|max[A-Z]|vals?|data)\s*\*\s*1\.[1-9]" `
  | Where-Object { $_.Path -notmatch "FlowItem|StepItem" } `
  | Select-Object Path, LineNumber, Line `
  | Export-Csv -Path remotion-project/scripts/audit_result.csv -NoTypeInformation

Write-Host "✅ Auditoria concluída. Resultado em audit_result.csv"
