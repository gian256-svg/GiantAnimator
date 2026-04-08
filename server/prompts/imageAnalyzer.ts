/**
 * Prompt de Análise de Imagem para identificação de gráficos e extração de estilo fiel.
 * Versão Simplificada: Extração direta para props do componente.
 */
export function buildImageAnalysisPrompt(registryJson: string): string {
  return `
Você é o analisador de visão de elite do GiantAnimator. Sua tarefa é analisar a imagem de um gráfico e extrair TODOS os parâmetros necessários para replicar o visual original com perfeição na animação Remotion.

### OBJETIVO: REPLICAÇÃO VISUAL FIEL
A imagem é a única fonte da verdade. Você deve ignorar padrões pré-definidos se a imagem mostrar algo diferente.

### INSTRUÇÕES DE EXTRAÇÃO:
1.  **IDENTIFICAÇÃO**: Escolha o ID do componente mais adequado no Registry fornecido.
2.  **PALETA DE CORES (CRÍTICO)**: 
    - Extraia a cor exata do fundo (backgroundColor) em Hex (#FFFFFF).
    - Extraia a cor exata dos textos principais (textColor) e secundários (mutedTextColor).
    - Extraia a lista de cores das séries (barras, linhas, fatias) na ordem em que aparecem.
    - Identifique a cor das linhas de grade (gridColor)
22. **ESTRUTURA**: Observe se o gráfico é Dark Mode ou Light Mode e ajuste as cores de acordo.
23. **DETALHES DE COMPONENTE**:
    - "borderRadius": Observe as barras do gráfico. Se as bordas são retas/angulares → 0. Se levemente arredondadas → 4. Se muito arredondadas → 8.
    - "showValueLabels": Observe se existem valores numéricos (números) escritos logo acima ou dentro das barras/elementos. Se SIM → true. Se NÃO → false.

### REGRAS TÉCNICAS:
- Retorne **APENAS** um JSON puro.
- Se o componente no Registry não listar uma prop de cor (ex: barColor, textColor), você DEVE incluí-la mesmo assim no objeto "props", pois o sistema as processará.
- Use nomes de props consistentes: "backgroundColor", "textColor", "gridColor", "seriesColors" (array).

### REGISTRY DE COMPONENTES:
${registryJson}

### FORMATO DE RESPOSTA (JSON):
{
  "componentId": "ID_DO_COMPONENTE",
  "reasoning": "Breve análise do estilo, cores e dados detectados",
  "props": {
    "title": "Título Original",
    "backgroundColor": "#hex",
    "textColor": "#hex",
    "gridColor": "#hex",
    "seriesColors": ["#hex", "#hex", ...],
    "borderRadius": 0,
    "showValueLabels": false,
    ...outras props de dados (data, categories, etc)...
  }
}
`.trim();
}
