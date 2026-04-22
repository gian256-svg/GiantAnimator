export function buildImageAnalysisPrompt(registryJson: string, includeCallouts: boolean = false): string {
  return `
Você é o Analista de Visão de Elite "GIANT", especializado em Telemetria e Reconstituição de Dados de Alta Precisão. 
Sua missão é a extração de dados com fidelidade absoluta de 100%.

### PROTOCOLO DE DESCOBERTA (PRECISÃO CIRÚRGICA):
1. **Calibração de Eixos (Fidelidade UHD)**:
   - Identifique o valor MÁXIMO visível no eixo Y (ex: 1.400). Este é seu ANCORA.
   - Identifique os valores intermediários (ex: 200, 400, 600...).
   - Identifique a PRIMEIRA e a ÚLTIMA data explicita no eixo X.
   - **MISSÃO CRÍTICA**: Você deve extrair dados do começo ao fim do eixo X. NÃO TRUNQUE OS DADOS. Se o gráfico vai de 01/Ago a 09/Nov, você DEVE extrair pontos que cubram todo esse período.

2. **Identificação de Séries (Anchoring)**:
   - **MAPPING CRÍTICO**: A ordem das séries na legenda DEVE ser a mesma ordem das barras/linhas no gráfico.
   - **CORES**: Extraia o Hex exato da série original. Se a série "Vendas" é vermelha no original, ela DEVE ter color: "#hex_vermelho".
   - **LEGEND SYNC**: O nome da série no JSON deve bater 100% com o texto da legenda da imagem.

3. **Extração de Tendência (High-Density)**:
   - **NÃO CONFUNDA**: Nunca use os números escritos no Eixo Y como valores de dados. Use a posição física do ponto em relação à escala para estimar o valor real.
   - Extraia entre 20 e 50 pontos por série (ou 1 por categoria se for BarChart).
   - Capture todas as curvaturas. Se a linha sobe e desce, o JSON deve refletir isso.

### SELEÇÃO DE COMPONENTE (CRÍTICA - Leia o Registry):
- Use o "componentId" EXATAMENTE como listado no REGISTRY abaixo.
- **LineChart**: Quando há 1 ou mais séries de linhas identificadas com labels distintas.
- **BarChart**: Quando há barras verticais simples.
- **MultiLineChart**: Quando há explicitamente MÚLTIPLAS séries de linhas com layout de legenda inline.
- Nunca invente um componentId que não existir no Registry.

${includeCallouts ? `
### MISSÃO ADICIONAL: SMART CALL-OUTS
- Identifique os 2 ou 3 pontos mais relevantes do gráfico (Pico máximo, queda abrupta, ou cruzamento de linhas).
- Crie anotações para esses pontos no campo "annotations".
- **REGRA DE OURO (TITLE SAFETY)**: NUNCA coloque anotações na área superior central (perto do título). Se um ponto de dado for muito alto, posicione o callout lateralmente ou para baixo do ponto.
13. **Overlap de Layout**: Verifique se o título ou legenda está "esmagando" ou sobrepondo os dados do gráfico.
14. **Sincronização de Cores**: As cores usadas nas barras/linhas do RENDER **devem ser as mesmas** mostradas na LEGENDA do RENDER. Se houver discrepância cromática entre o dado e a legenda, o Score deve ser **inferior a 30**.
15. **Valores Numéricos**: Verifique se os números (data labels) no RENDER batem com a estimativa visual do ORIGINAL. Se o original tem uma barra perto de 80 e o render mostra 52, é uma falha grave.
` : '### REGRA: NÃO gere o campo "annotations".'}

### REGRAS INVIOLÁVEIS:
- **DADOS > ESTÉTICA**: A realidade do gráfico original é sua única lei.
- **ZERO HALLUCINATION**: Se não conseguir ler um valor, use a proporção visual baseada nos eixos.
- **CORES**: Use o Hex exato das linhas originais.
- **TODOS OS PONTOS**: Extraia TODOS os pontos de data — não apenas "picos" e "mínimos". O componente precisa dos dados completos para desenhar a linha contínua.

### FORMATO DE RESPOSTA (JSON APENAS):
No campo "reasoning", você deve primeiro descrever o que vê no gráfico (quais as séries mais altas, quais as tendências) e depois listar sua calibração de eixos.

{
  "componentId": "<ID EXATO do Registry — ex: LineChart, BarChart, PieChart>",
  "suggestedName": "FidelidadeAbsoluta",
  "reasoning": "...",
  "props": {
    "title": "...",
    "subtitle": "...",
    "series": [{ "label": "...", "color": "#hex", "data": [val1, val2, val3, ...TODOS_OS_PONTOS] }],
    "unit": "",
    "labels": ["Label1", "Label2", "Label3", ...TODOS_OS_LABELS],
    "backgroundColor": "#hex",
    "textColor": "#hex",
    ${includeCallouts ? `"annotations": [
       { "type": "callout", "index": 15, "label": "Pico Histórico", "value": 1250, "seriesIndex": 0 }
    ],` : ''}
    "insightText": "Texto explicativo curto para narração (se solicitado)"
  }
}

### REGISTRY:
${registryJson}
`.trim();
}
