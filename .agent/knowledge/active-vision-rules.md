# ACTIVE VISION RULES (Surgery-Grade Precision)

Estas são as diretrizes ABSOLUTAS e ATIVAS para a extração de dados da IA de Visão. 
Nunca viole estas regras.

1. **Supremacia dos Dados (Data-First)**: O modelo deve priorizar a precisão matemática em relação a qualquer formatação estética. Extrair 100% dos dados reais.
2. **Nomes Fidedignos (No Generic Labels)**: Extraia obrigatoriamente os nomes originais do eixo categórico e das séries. Se a imagem original não possuir legenda explícita para as séries, você DEVE desativar a legenda (`"showLegend": false`) no JSON e deixar a label delas vazias `""`. É FALHA CRÍTICA INACEITÁVEL inventar "Item 1", "Série 1", "Series 1", etc.
3. **Unidades — Anti-Redundância (CRÍTICO)**: Siga esta hierarquia:
   - Se a unidade (ex: "thousands", "millions", "percent") **já está escrita no `yAxisTitle` ou no `title`**, deixe `"unit": ""`. O eixo comunica a escala — repetir em cada ponto é poluição visual.
   - Se a unidade **não aparece em nenhum texto do gráfico**, coloque-a em `unit` (ex: `"unit": "%"`, `"unit": "M"`).
   - Símbolos de prefixo monetário ($, €, £, R$) **sempre** podem ir em `unit`, pois são renderizados como prefixo limpo sem repetição textual.
5. **Protocolo de Contagem Forense**: Antes de gerar o JSON, conte fisicamente o número de barras, fatias ou pontos na imagem. 10 barras na referência = 10 itens no array de dados. Erros de contagem ou de "Data Shape" (ex: transformar barras simples em agrupadas) são falhas fatais.
6. **Textos Exatos (valueStr)**: Valores em labels explícitos (ex: `-$10M`) devem ser copiados textualmente para o campo `valueStr`. O campo numérico `value` serve apenas para o cálculo de escala.
7. **Precisão Decimal**: Mantenha pelo menos 2 casas decimais (ex: `1.49`). É estritamente proibido arredondar.
8. **Detecção de Totais (Waterfall)**: Para WaterfallCharts, identifique quais colunas representam o 'Total' (geralmente a última ou a primeira) e adicione a propriedade `"isTotal": true` explicitamente.
9. **Smart Call-outs (Anotações)**: Se a flag de anotações estiver ativa (`showValueLabels: true`), crie o array `annotations`. A propriedade `seriesIndex` deve corresponder EXATAMENTE ao índice da série afetada no array `series`, e a propriedade `index` ao índice no array `labels`. Um erro de índice fará a anotação flutuar no lugar errado.
10. **Cores das Séries (seriesColors)**: As cores extraídas da imagem original DEVEM ser retornadas SEMPRE na propriedade `seriesColors` (array de strings hex). Esta propriedade é o único canal de fidelidade de cor do sistema — omiti-la causa 100% das falhas de cor na auditoria. Nunca use `colors` como nome alternativo na raiz do JSON; use exclusivamente `seriesColors`.
11. **Escala do Eixo Y (yMin / yMax) — CRÍTICO**: Inspecione o eixo Y da imagem original e extraia o valor mínimo e máximo EXATAMENTE como exibido. Retorne `"yMin": <valor>` e `"yMax": <valor>` nas props. NUNCA assuma que o eixo começa em zero — se o eixo começa em 255, retorne `"yMin": 255`. Um eixo começando em 0 quando a imagem mostra 255 é uma FALHA CRÍTICA que torna os dados visualmente irreconhecíveis. Na dúvida, siga a referência.
12. **Legenda vs. Direct Labels**: Se a imagem original exibe rótulos de série no final das linhas (direct labeling) em vez de uma legenda separada, retorne `"showLegend": false`. Se possuir legenda centralizada/inferior, retorne `"showLegend": true`. Nunca ative ambos simultaneamente.

13. **Barras Empilhadas (Stacked) vs. Agrupadas (Grouped) — CRÍTICO**:
    - EMPILHADO: cada categoria = uma única barra particionada em segmentos coloridos contíguos → `"stacked": true`.
    - AGRUPADO: cada categoria = múltiplas barras paralelas separadas → `"stacked": false`.
    - **EXTRAÇÃO DE VALOR EM STACKED**: Extraia a LARGURA INDIVIDUAL de cada segmento. NUNCA a posição final/cumulativa. Se segmento A vai de 0→10k e B vai de 10k→18k, B vale 8k, NÃO 18k. Erro aqui dobra todos os dados.
    - **xMax para HorizontalBarChart**: sempre use `"xMax"` (não `"yMax"`). O valor = maior soma total de segmentos entre todas as categorias.
    - **Cores**: cada série de um stacked chart DEVE ter cor distinta e vibrante, extraída diretamente da imagem original.
