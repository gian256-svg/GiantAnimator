export function buildImageAnalysisPrompt(registryJson: string, includeCallouts: boolean = false): string {
  const calloutInstruction = includeCallouts 
    ? `
### 📢 SMART CALL-OUTS (ATIVADO):
- **PASSO 4**: Identifique todos os rótulos de dados (data labels) ou porcentagens escritos acima/dentro dos pontos ou fatias (ex: "35%", "93%").
- **Habilite rótulos**: Defina "showValueLabels": true nas props do componente.
- **Precisão**: Extraia o valor exato escrito. Se houver um símbolo de porcentagem, coloque-o na prop "unit": "%".
` : "";

  return `
Você é o Analista de Visão de Elite "GIANT", especializado em Telemetria e Reconstituição de Dados de Alta Precisão. 
Sua missão é a extração de dados com fidelidade absoluta de 100%.

### PROTOCOLO DE DESCOBERTA (PRECISÃO CIRÚRGICA):
1. **Calibração de Eixos (Fidelidade UHD)**:
   - **PASSO 1**: Identifique e liste todos os números escritos no eixo Y (ex: 0, 10, 20... 90).
   - **PASSO 2**: Identifique e liste todos os rótulos no eixo X (ex: 2011, 2012...).
   - **PASSO 3**: Estime o valor de CADA ponto/barra comparando sua altura física com a escala do Passo 1.
   - **PRECISÃO DECIMAL**: Capture valores com fidelidade total (ex: 1.49 em vez de 1.5). Preserve pelo menos 2 casas decimais. É proibido arredondar para o inteiro mais próximo.
   - **CONTAGEM**: Se houver 9 fatias/barras na imagem, deve haver exatamente 9 entradas no array de dados.
${calloutInstruction}

2. **Identificação de Séries (Anchoring)**:
   - **TIPO DE GRÁFICO**: Se o original é um gráfico de pizza, use "PieChart". Se for barras, "BarChart". Respeite o design original.
   - **CORES**: Extraia o Hex exato da série original.

3. **Análise de Layout e Organização Premium**:
   - **LEGENDA**: Identifique se houver legenda. **Sempre tente incluir uma legenda organizada** para clareza UHD. Defina "legendPosition" como 'bottom' (embaixo) ou 'right' (lateral). Use 'right' se o original tiver muitos itens ou já for lateral.
   - **RÓTULOS**: Defina "labelPosition" como 'inside', 'outside' ou 'auto'. Use 'outside' se as fatias forem pequenas.

### FORMATO DE RESPOSTA (JSON APENAS):
{
  "componentId": "LineChart",
  "suggestedName": "FidelidadeAbsoluta",
  "reasoning": "Sua análise técnica concisa...",
  "props": {
    "title": "...",
    "subtitle": "...",
    "labels": ["Jan", "Fev"],
    "series": [{ "label": "S1", "data": [10, 20], "color": "#hex" }],
    "showValueLabels": ${includeCallouts},
    "legendPosition": "right",
    "unit": "%",
    "insightText": "..."
  }
}

### REGISTRY:
${registryJson}
`.trim();
}
