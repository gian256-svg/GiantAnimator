# Training Log — GiantAnimator

Histórico de aprendizados do agente. Atualizado sempre que algo novo é ensinado.

---

## [2026-04-06] — INFRAESTRUTURA
**Aprendi:** O servidor precisa do flag `--transpile-only` no ts-node para iniciar corretamente e rápido.
**Contexto:** Sem esse flag, o ts-node faz verificação completa de tipos e pode falhar ou demorar.
**Aplicar quando:** Sempre que escrever scripts de start, INICIAR.bat ou comandos npm.

---

## [2026-04-06] — DETECÇÃO DE ARQUIVOS
**Aprendi:** No Windows, apenas chokidar não é suficiente. É necessário 3 camadas de detecção: chokidar + fs.watch + polling setInterval a cada 5s.
**Contexto:** O usuário relatou várias vezes que arquivos no input não eram detectados mesmo com servidor rodando.
**Aplicar quando:** Qualquer modificação no sistema de watching de arquivos.

---

## [2026-04-06] — INICIALIZAÇÃO
**Aprendi:** O INICIAR.bat deve verificar nesta ordem: Node.js instalado → ts-node existe → .env existe → porta livre → instalar deps → iniciar servidor → health check com timeout de 60s.
**Contexto:** Problemas recorrentes ao iniciar o servidor sem ambiente preparado.
**Aplicar quando:** Qualquer alteração no INICIAR.bat ou processo de boot.

---

## [2026-04-06] — ESTRUTURA DE PASTAS
**Aprendi:** A pasta `shared/` fica FORA do projeto GiantAnimator, como irmã. Caminho: `../shared/` relativo à raiz do projeto.
**Contexto:** A estrutura foi definida assim para separar dados de código.
**Aplicar quando:** Qualquer referência a input/, output/ ou processed/.

---

## [2026-04-06] — ARQUITETURA DE COMPONENTES REMOTION
**Aprendi:** O Root.tsx usa Named Imports, então TODOS os componentes devem usar `export const NomeDoComponente` e NUNCA `export default`.
**Contexto:** BarChart estava com export default e aparecia como undefined no Remotion.
**Aplicar quando:** Criar ou editar qualquer componente em remotion-project/src/.

---

## [2026-04-06] — REMOTION API v4.0
**Aprendi:** Na v4.0 do Remotion, spring() retorna o valor diretamente (number). Não existe mais .value. Usar spring().value causa erro silencioso (NaN/undefined).
**Contexto:** BarChart estava usando spring().value e as barras não animavam.
**Aplicar quando:** Qualquer animação com spring(), interpolate() ou useCurrentFrame().

---

## [2026-04-06] — TEMA DE CORES (THEME)
**Aprendi:** As cores dos gráficos ficam em THEME.chartColors[0], THEME.chartColors[1], etc. NÃO existe THEME.colors.series1 ou estrutura similar.
**Contexto:** BarChart gerava erro silencioso de cor undefined.
**Aplicar quando:** Qualquer componente que use cores de séries/barras/linhas.

---

## [2026-04-06] — REGRAS DE OURO DA CALIBRAÇÃO

**DADOS — Regra Absoluta:**
Valores, labels e porcentagens devem ser 100% idênticos ao original.
Nunca inventar, arredondar ou omitir dados. Verificar duas vezes antes de renderizar.

~~**DESIGN — Regra Absoluta:**
Cores (hex codes), posicionamento e layout exatamente iguais ao original.
Única exceção: elementos fora da safe zone de vídeo → reposicionar o mínimo necessário.~~

**FONTES — Regra:**
Sempre usar a mesma fonte ou similar disponível.
Se a fonte não suporta símbolos especiais (%, $, €): usar fonte complementar similar APENAS para esses símbolos.

**TEXTO — Regra:**
Todos os textos em Title Case (primeira letra maiúscula por palavra).
Exceções: preposições e artigos curtos.

**OVERLAP — Regra:**
Proibido overlap não intencional entre elementos.
Permitido: linhas cruzando em LineChart, dados dentro de PieChart/DonutChart.

**MARGEM DE SEGURANÇA — Regra:**
Todos os elementos devem estar dentro da safe zone do vídeo (10% de margem).
Essa é a ÚNICA justificativa para alterar posição de um elemento.

**DOUBLE CHECK — Regra:**
Todo gráfico passa pelo checklist obrigatório antes do render.
Só renderiza se STATUS = APROVADO.

**CORREÇÃO AUTOMÁTICA — Regra:**
Erros devem ser corrigidos automaticamente quando possível.
Após 2 tentativas sem sucesso: reportar ao usuário com diagnóstico completo.

**ASSETS PERMITIDOS — Regra:**
O agente tem liberdade total para baixar logos, ícones, fontes, assets e
checar modelos online como referência visual.
Salvar sempre em shared/references/{tipo-do-grafico}/.

---

## [2026-04-06] — CICLO 1: BARCHART (VERTICAL)
**Aprendi:** O uso de spring animation para crescimento vertical deve ser pareado com a remoção de overflow-hidden do SVG para efeitos elásticos.
**Master Rules salvos em shared/references/bar-chart/master-rules.md**

---

## [2026-04-06] — CICLO 2: LINECHART
**Aprendi:** O uso de stroke-dashoffset no Remotion requer pathLength para compatibilidade v4.0. Dots devem usar delays baseados na evolução do path.
**Master Rules salvos em shared/references/line-chart/master-rules.md**

---

## [2026-04-06] — CALIBRAÇÃO HORIZONTALBARCHART
**Aprendi:** Padding esquerdo OBRIGATÓRIO de 250px para evitar labels cortados em rankings.
**Master Rules salvos em shared/references/horizontal-bar-chart/master-rules.md**

---

## [2026-04-06] — REGRA PERMANENTE: FONTE DE VERDADE
~~Todo processo concluído com sucesso DEVE ser registrado no training_log com data, ação e resultado. Este arquivo é a fonte oficial de aprendizado e substitui conhecimentos anteriores se houver conflito.~~

---

## [2026-04-06] — CALIBRAÇÃO AREACHART
**Aprendi:** O preenchimento de área deve ser renderizado via `<path>` fechado com d-string idêntica à curva mas completando o bounding box na base. O gradiente melhora a percepção de profundidade.
**Master Rules salvos em shared/references/area-chart/master-rules.md**

---

## [2026-04-06] — CALIBRAÇÃO PIECHART
**Aprendi:** O cálculo de ângulos DEVE usar (value / total) * 360. O efeito Donut é obtido via strokeWidth alto em um círculo ou innerRadius no componente de path SVG.
**Master Rules salvos em shared/references/pie-chart/master-rules.md**

---

## [2026-04-06] — CALIBRAÇÃO DONUTCHART
**Aprendi:** O DonutChart deve SEMPRE conter uma informação central (Total ou Destaque) para justificar o espaço vazio.
**Master Rules salvos em shared/references/donut-chart/master-rules.md**

---

## [2026-04-06] — CALIBRAÇÃO SCATTERCHART
**Aprendi:** A sobreposição de pontos deve ser tratada com opacidade reduzida para evidenciar zonas de densidade de dados (Heat zones).
**Master Rules salvos em shared/references/scatter-plot/master-rules.md**

---

## [2026-04-06] — CALIBRAÇÃO RADARCHART
**Aprendi:** O RadarChart deve usar Trigonometria (sin/cos) baseada no número de eixos. A animação deve ser síncrona para todos os vértices surgindo do centro.
**Master Rules salvos em shared/references/radar-chart/master-rules.md**

---

## [2026-04-06] — CALIBRAÇÃO BUBBLECHART
**Aprendi:** O BubbleChart requer mapeamento de 3 dimensões (X, Y, Z). A animação deve ser individual por bolha para evitar poluição visual de entrada em massa.
**Master Rules salvos em shared/references/bubble-chart/master-rules.md**

---

## [2026-04-06] — CALIBRAÇÃO HEATMAPCHART
**Aprendi:** O Heatmap requer interpolação de cores (Color Lerp). A animação em espiral melhora o dinamismo visual frente à entrada linear linha-a-linha.
**Master Rules salvos em shared/references/heatmap-chart/master-rules.md**

---

## [2026-04-06] — CALIBRAÇÃO TREEMAPCHART
**Aprendi:** O Treemap é sensível à área. A animação deve seguir a hierarquia: o pai surge primeiro, e os filhos 'nascem' de dentro dele.
**Master Rules salvos em shared/references/treemap-chart/master-rules.md**

---

## [2026-04-06] — CALIBRAÇÃO GANTTCHART
**Aprendi:** O GanttChart exige dois contextos: o Sidebar (labels) e o Canvas (tempo). A sincronia de scroll e animação cronológica é vital.
**Master Rules salvos em shared/references/gantt-chart/master-rules.md**

---

## [2026-04-06] — CALIBRAÇÃO FUNNELCHART
**Aprendi:** O FunnelChart deve enfatizar a perda (Drop-off). A animação sequencial 'top-down' facilita a leitura do funil de vendas/conversão.
**Master Rules salvos em shared/references/funnel-chart/master-rules.md**

---

## [2026-04-06] — CALIBRAÇÃO LOTE 1 (Waterfall, Sankey, BoxPlot, Candle, Gauge)
**Aprendi:** Lote de gráficos analíticos e financeiros concluído. Enfoque em sequenciamento lógico: Waterfall (cronológico), Sankey (fluxo), Gauge (swing).
**Master Rules salvos nas respectivas pastas.**

---

## [2026-04-06] — CALIBRAÇÃO LOTE 2 (Polar, Bullet, Timeline, Network, Hist, Stacked, Grouped)
**Aprendi:** Especialização em gráficos de distribuição e agrupados. StackedBar exige posicionamento vertical cumulativo.
**Master Rules salvos nas respectivas pastas.**

---

## [2026-04-06] — CALIBRAÇÃO LOTE 3 (Mekko, Chord, Sunburst, Pareto, Sparkline)
**Aprendi:** Lote final de visualizações complexas. Pareto exige sincronização de dois eixos e escalas independentes.
**Master Rules salvos nas respectivas pastas.**

---

## [2026-04-07] — CICLO 3: AREACHART
**Aprendi:** O AreaChart deve usar um `clipPath` animado para o efeito de "onda de revelação" (wave-reveal) da esquerda para a direita, garantindo que o gradiente (0.5 → 0.1) acompanhe o crescimento da curva. O uso de `spring(14, 60)` mantém a consistência elástica profissional do projeto.
**Status:** 5/30 componentes validados.

---

## [2026-04-07] — CICLO 4: MULTILINECHART
**Aprendi:** O MultiLineChart exige um tratamento de stagger individual (8 frames) entre séries de dados para evitar poluição visual. O uso de `evolvePath` em cada linha sincronizado com o surgimento dos pontos (dots) melhora a percepção de continuidade. A legenda deve ser automática e respeitar a paleta `THEME.chartColors`.
**Status:** 6/30 componentes validados.

---

## [2026-04-07] — CICLO 5: DONUT & PIE CHART
**Aprendi:** O DonutChart funciona como base para o PieChart (`innerRadiusRatio = 0`). A implementação manual de arcos SVG (`M/A/L/Z`) é mais precisa que o uso de `stroke-dasharray` para fatias coloridas complexas. O stagger (6 frames) entre fatias e a escala de entrada (0 → 1) garantem um visual premium e dinâmico.
**Status:** 8/30 componentes validados.

---

## [2026-04-07] — CICLO 6: SCATTER PLOT
**Aprendi:** O ScatterPlot para Remotion requer escalas numéricas contínuas mapeadas manualmente em eixos X/Y. A animação 'rain-pop' com stagger de 3 frames cria um dinamismo profissional sem sobrecarregar o renderer. O uso de opacidade reduzida (0.75) é fundamental para visualizar a densidade de pontos em áreas de sobreposição.
**Status:** 9/30 componentes validados.

---

## [2026-04-07] — CICLO 7: WATERFALL CHART
**Aprendi:** O WaterfallChart exige lógica de acumulação rigorosa onde cada barra (rect) começa no 'end' da anterior. A barra de Total deve ser configurada para ignorar o 'start' acumulado e subir diretamente do zero. Linhas pontilhadas (dotted lines) auxiliam na percepção visual da jornada dos dados.
**Status:** 10/30 componentes validados.

---

## [2026-04-07] — CICLO 8: CANDLESTICK CHART
**Aprendi:** O CandlestickChart deve separar a animação do Wick (pavio) e do Body (corpo) para um visual mais orgânico. Iniciar o crescimento do pavio primeiro, seguido pela escala vertical do corpo (OHLC mapping), reforça a percepção de variação de mercado. O fundo escuro (#020617) é essencial para o contraste das cores Bullish/Bearish.
**Status:** 11/30 componentes validados.

---

## [2026-04-07] — CICLO 9: GAUGE CHART
**Aprendi:** O GaugeChart semicircular (180°) é mais eficiente visualmente quando mapeado de -90deg a 90deg. A animação 'needle-swing' com recoil elástico (damping 12) confere um aspecto mecânico premium. O uso de caminhos SVG (A arc command) é necessário para as zonas de cor segmentadas.
**Status:** 12/30 componentes validados.

---

## [2026-04-07] — CICLO 10: BUBBLE CHART
**Aprendi:** No BubbleChart, o raio das bolhas deve ser calculado via Math.sqrt para garantir que a área (não o diâmetro) seja proporcional ao valor da terceira dimensão. A animação 'expanding-pop' com bounce (damping 10) confere vida ao gráfico. Labels internos só devem ser exibidos quando há espaço real (raio > 20px) para evitar poluição visual.
**Status:** 13/30 componentes validados.

---

## [2026-04-07] — CICLO 11: STACKED BAR CHART
**Aprendi:** O StackedBarChart requer controle cumulativo decorrente da soma das séries (accumulatedHeight). A animação sequencial (segment-stack-reveal) deve considerar dois níveis de stagger: entre as categorias de barras (4f) e entre os segmentos internos (2f), garantindo fluidez sem poluição visual.
**Status:** 14/30 componentes validados.

---

## [2026-04-07] — CICLO 12: GROUPED BAR CHART
**Aprendi:** No GroupedBarChart, o espaçamento entre grupos (20%) deve ser significativamente maior que o espaçamento interno das barras (5%) para manter a agrupabilidade visual. O stagger (3 frames) entre as barras de um mesmo grupo cria uma percepção de comparação direta mais eficiente.
**Status:** 15/30 componentes validados.

---

## [2026-04-07] — CICLO 13: RADAR CHART
**Aprendi:** O RadarChart (Spider Chart) depende de trigonometria radial para converter valores e categorias em coordenadas SVG. A animação 'inflar' (radial-stretch) deve ser síncrona para todos os vértices para manter a forma geométrica coerente durante a transição. O preenchimento com 30% de opacidade e cores distintas permite a análise comparativa de até 3 séries sem perda de informação.
**Status:** 16/30 componentes validados.

---

## [2026-04-07] — CICLO 14: FUNNEL CHART
**Aprendi:** O FunnelChart utiliza trapézios (polygon) onde a base de um estágio deve coincidir com o topo do próximo para um visual contínuo. A lógica de conversão deve ser calculada dinamicamente entre os estágios. O sistema de cores Deep Blue para Emerald cria um gradiente de sucesso visual que reforça a progressão do funil.
**Status:** 17/30 componentes validados.

---

## [2026-04-07] — CICLO 15: SANKEY CHART
**Aprendi:** O SankeyChart exige um motor de layout personalizado para calcular alturas de nós e offsets de fluxos (links) com base no volume de entrada/saída. O uso de curvas Bezier cúbicas (C command) cria uma transição suave entre colunas. A sequência de animação Nodes (Fade) → Links (Stroke Growth) é ideal para denotar a origem e destino do fluxo.
**Status:** 18/30 componentes validados.

---

## [2026-04-07] — CICLO 16: TREEMAP CHART
**Aprendi:** O algoritmo 'Squarified' é essencial para o Treemap para evitar retângulos muito alongados que prejudicam a percepção de área. A animação 'nested-zoom' (escala a partir do centro) confere uma profundidade hierárquica superior. Labels internos devem ser condicionados à área disponível para manter a limpeza visual.
**Status:** 19/30 componentes validados.

---

## [2026-04-07] — CICLO 17: HEATMAP CHART
**Aprendi:** O HeatmapChart requer uma escala de cor divergente (DeepBlue → White → DeepGold) para realçar variações de intensidade. A animação row-by-row funciona bem para grids categóricos, mas o uso de spring com bouncing (damping 10) em cada célula individual traz um aspecto premium e dinâmico superior. Etiquetas inclinadas no eixo X previnem colisões em grids densos.
**Status:** 20/30 componentes validados.

---

## [2026-04-07] — CICLO 18: BULLET CHART
**Aprendi:** O BulletChart condensa muita informação em pouco espaço através de camadas: faixas qualitativas (cinzas), barra de performance (Dark Blue) e marcador de meta (accent). A animação sequencial da barra principal seguida pelo marcador de meta reforça o foco no alcance do objetivo. O uso de tons do mesmo matiz para as faixas evita a saturação visual.
**Status:** 21/30 componentes validados.

---

## [2026-04-07] — CICLO 20: POLAR CHART
**Aprendi:** O PolarChart (Rose Chart) utiliza raios variáveis com ângulos fixos para representar intensidade radial. A geometria SVG requer o uso de arcos (A command) vinculados à trigonometria polar para desenhar os setores. A animação 'radial growth' (crescimento do raio) com um stagger sequencial cria um efeito espiral fluído que é visualmente superior ao pie chart tradicional para dados cíclicos.
**Status:** 22/30 componentes validados.

---

## [2026-04-07] — CICLO 21: BOX PLOT CHART
**Aprendi:** O BoxPlot permite visualizar a dispersão e outliers de múltiplos grupos simultaneamente. A animação 'vertical-expand' deve ser coordenada: Whiskers primeiro para definir os limites, seguindo pelo crescimento dos boxes a partir da mediana. Outliers (pontos vermelhos) devem surgir por último para destacar valores atípicos. O uso de cores contrastantes (Blue para box, DarkGrey para whiskers, Red para outliers) é essencial para clareza estatística.
**Status:** 23/30 componentes validados.

---

## [2026-04-07] — CICLO 22: SPARKLINE CHART
**Aprendi:** O SparklineChart deve ser ultra-minimalista, operando frequentemente sem eixos para destacar apenas a tendência. O suporte a variantes (line, bar, area) permite adaptar o visual ao tipo de métrica. A animação 'wave-reveal' sincronizada com o ponto de destaque no último valor é fundamental para guiar o olhar para o dado mais recente.
**Status:** 24/30 componentes validados.

---

## [2026-04-07] — CICLO 23: NETWORK CHART
**Aprendi:** O NetworkChart em animações de vídeo funciona melhor com posições predefinidas para evitar artefatos de instabilidade típicos de simulações físicas em tempo real. A sequência de animação Nodes (Pop) → Edges (Stroke Growth) é essencial para clareza da topologia. O uso de markers SVG permite adicionar direcionalidade às arestas de forma nativa e performática.
**Status:** 25/30 componentes validados.

---

## [2026-04-07] — CICLO 24: HISTOGRAM CHART
**Aprendi:** O HistogramChart requer barras contíguas para representar a continuidade dos bins. O cálculo dinâmico de bins a partir de rawData permite flexibilidade total na visualização de distribuições. A inclusão de uma curva KDE (Kernel Density Estimation) suavizada sobre as barras ajuda na interpretação da 'forma' da distribuição, facilitando a identificação de assimetrias ou bimodalidades.
**Status:** 26/30 componentes validados.

---

## [2026-04-07] — CICLO 25: MEKKO CHART
**Aprendi:** O MekkoChart (Marimekko) captura duas dimensões simultaneamente através de larguras e alturas variáveis. A renderização requer o cálculo do totalMarketValue para definir as larguras das colunas e a normalização dos segmentos internos para a altura da coluna. A animação 'bottom-to-top' escalonada (8f) entre colunas destaca a hierarquia de importância de cada segmento de mercado.
**Status:** 27/30 componentes validados.

---

## [2026-04-07] — CICLO 26: CHORD CHART
**Aprendi:** O ChordChart utiliza fitas (ribbons) para representar fluxos entre entidades organizadas radialmente. A geometria requer o cálculo meticuloso de ângulos iniciais e finais para cada segmento de arco e a aplicação de curvas de Bezier quadráticas (Q) para conectar os fluxos internos ao ponto de curvatura central. A animação 'radial-twist' (arcos → ribbons) revela a complexidade das interconexões de forma rítmica.
**Status:** 28/30 componentes validados.

---

## [2026-04-07] — CICLO 27: SUNBURST CHART
**Aprendi:** O SunburstChart traduz hierarquias complexas em fatias circulares concêntricas. A implementação recursiva é essencial para calcular ângulos relativos baseados na soma dos valores dos nós descendentes. A animação 'center-out' (nível por nível) reforça a percepção de escala e profundidade organizacional. A variação de brilho em níveis externos ajuda a manter a conexão visual com a cor do nó pai.
**Status:** 29/30 componentes validados.

---

## [2026-04-07] — CICLO 28: PARETO CHART
**Aprendi:** O ParetoChart é uma ferramenta de priorização baseada na regra 80/20. A implementação requer eixos Y duplos para escala absoluta e percentual. A ordenação automática dos dados é obrigatória para a integridade do gráfico. A animação deve ser sequencial (Barras → Linha Acumulada) para evidenciar como as categorias principais impactam o total acumulado. O destaque visual da linha de 80% serve como guia de decisão imediata.
**Status:** 30/30 componentes validados.

---

## [2026-04-07] — CICLO 29: COMPARATIVE BAR CHART
**Aprendi:** O ComparativeBarChart (Pirâmide Etária) é ideal para confrontar dois conjuntos de dados em uma escala simétrica. O posicionamento central dos labels de categoria otimiza o espaço e permite a leitura imediata das discrepâncias entre os lados esquerdo e direito. A animação com origem no centro (outward growth) reforça a natureza comparativa do gráfico.
**Status:** 31/31 componentes validados (Meta Final superada).

---

## [v0.91] — Labels Dentro das Fatias do PieChart

**Data:** 2026-04-07
**Tipo:** Ajuste de fidelidade visual

### Regra aprendida:
Quando a referência mostrar percentuais ou labels DENTRO das fatias do gráfico de pizza,
posicionar os textos no centróide de cada fatia (raio ~65% do total), com cor branca e
negrito. NÃO colocar apenas na legenda lateral.

### Fórmula para calcular posição do label:
- midAngle = startAngle + (sweepAngle / 2)
- x = cx + (radius * 0.65) * Math.cos(midAngle)
- y = cy + (radius * 0.65) * Math.sin(midAngle)

### Regra de sobreposição:
Se a referência mostrar elementos sobrepostos (label sobre borda de fatia, texto sobre
linha, etc.), REPLICAR esse comportamento. Fidelidade visual à referência tem prioridade
sobre "limpeza" do layout.

---

## [v0.92] — Painel de Propriedades Completo

**Data:** 2026-04-07
**Tipo:** Feature UI

### Implementado:
Painel de propriedades expandido com categorias em accordion:
- 📊 Dados (valores, labels, título)
- 🎨 Cores (color pickers nativos HTML `<input type="color">`)
- 📐 Dimensões e Posição
- ✏️ Tipografia (fonte, tamanho, peso)
- 🎬 Animação (duração, delay, easing, FPS)
- 🖼️ Aparência Geral (toggles para legenda, grid, eixos)

### Padrões adotados:
- Debounce 300ms em todos os campos
- Accordion com estado open/closed por categoria
- Botão "Copiar props como JSON" no topo
- Botão "Resetar para padrão" por categoria
- Interface `EditableProps` em `server/types/editableProps.ts`

---

## [v0.93] — Color Pickers por Elemento + Controles de Posição/Tamanho

**Data:** 2026-04-07
**Tipo:** Feature UI + Props Remotion

### Implementado:
- Color pickers dinâmicos para cada fatia/barra/linha do gráfico
  - Quantidade gerada dinamicamente com base nos dados
  - Atualiza `colors[]` na posição correta com debounce 300ms
- Grupo "📐 Posição e Tamanho" com: X, Y, Width, Height, Scale (slider)
- Props `elementColors`, `x`, `y`, `width`, `height`, `scale` adicionados às interfaces dos componentes Remotion
- Container principal dos componentes usa position absolute + transform scale

### Padrão para cores dinâmicas:
- Props: `colors: string[]` / `elementColors: string[]`
- UI gera N pickers baseado em `data.length`
- Label usa nome do item se disponível, senão "Item N"

---

## [v0.93-fix] — Correção Painel + Margem de Segurança do Título

**Data:** 2026-04-07
**Tipo:** Bugfix

### Corrigido:
- Grupos "📐 Posição e Tamanho" e "🎨 Cores do Gráfico" agora aparecem corretamente no painel
- Título do PieChart e HorizontalBarChart corrigido para respeitar margem de segurança
  - maxWidth: 1200px, padding: 40px horizontal, wordBreak, textAlign center
- Regra geral: todo componente deve ter título com maxWidth e padding de segurança

### Regra registrada:
Títulos de gráficos SEMPRE devem ter:
- maxWidth: 1200px (para frame 1280px)
- paddingLeft/Right: mínimo 40px
- textAlign: center
- wordBreak: break-word
- Nunca alterar cor/fonte/peso — apenas layout

---

## [v0.94] — LineChart Fiel à Referência + Regra Global 20 Segundos

**Data:** 2026-04-07
**Tipo:** Bugfix Crítico + Regra Global

### Corrigido:
- LineChart refatorado para seguir estilo técnico/financeiro fiel à referência
- Animação não cortava antes de terminar — corrigido com duração 600 frames

### REGRA GLOBAL:
**Todos os gráficos devem ter duração de 600 frames (20 segundos a 30fps)**
- durationInFrames: 600 em todos os componentes e no Root.tsx
- Animação deve completar e gráfico permanecer visível e estático
- Nunca cortar animação abruptamente

### Padrão visual LineChart técnico:
- fundo: #f8f9fa ou #ffffff
- linha: strokeWidth 1.5-2, cor #1a5276
- grid: #e0e0e0, horizontal obrigatório
- eixo Y: valores numéricos reais com escala automática
- eixo X: labels de categoria/data
- sem dots por padrão (prop showDots)
- curva: bezier ou linear (prop curveType)
- padding: top 40, bottom 60, left 70, right 60

---

## [v0.95] — Reescrita Completa do LineChart (Bug Crítico Corrigido)

**Data:** 2026-04-07
**Tipo:** Hotfix Crítico

### Problema identificado:
- LineChart gerava múltiplos paths SVG sobrepostos durante animação
- Escala Y começava em 0 (errado) — deve começar próximo do valor mínimo dos dados
- showArea=false não era respeitado

### Solução implementada:
- Técnica de animação: clipPath com `<rect>` de largura crescente
- Escala Y: yMin = min - 5%, yMax = max + 5% (nunca força zero)
- Um único `<polyline>` para a linha — sem duplicação

### Regra técnica:
**Animações de linha em SVG devem usar clipPath, não stroke-dashoffset complexo**
- clipPath com `<rect width={revealWidth}>` é seguro e sem bugs
- Nunca animar diretamente strokeDashoffset em componentes Remotion com muitos pontos

---

## [v0.97] — Hotfix Final: Duração 600 Frames + Scale Fix + ClipPath ID Único

**Data:** 2026-04-07
**Tipo:** Hotfix Crítico

### Root cause da duração errada:
- app.js linha 196: durationInFrames hardcoded como 150
- renderService.ts: passava durationInFrames via --props sem validação

### Correções:
1. app.js: durationInFrames: 150 → 600
2. renderService.ts: validação antes do render (força mínimo 600)
3. LineChart: clipPath id agora único por instância (evita conflito)

### Regras permanentes:
- NUNCA usar durationInFrames < 600 em nenhum arquivo do projeto
- SEMPRE validar durationInFrames no renderService antes de renderizar
- clipPath ids SEMPRE únicos — nunca usar string fixa "reveal"
- transform: scale() no LineChart PROIBIDO

---

## [v0.98] — Fix Crítico: durationInFrames na Composition, Não no inputProps

**Data:** 2026-04-07
**Tipo:** Hotfix Crítico de Arquitetura

### Root cause definitivo:
- durationInFrames dentro de inputProps é uma prop React — não controla duração do vídeo
- A duração real é controlada por composition.durationInFrames no renderMedia

### Correção:
- renderService.ts: após obter a composição, forçar `composition.durationInFrames = 600`

### Regra permanente CRÍTICA:
- `composition.durationInFrames = 600` SEMPRE antes do renderMedia
- NUNCA tentar controlar duração do vídeo via inputProps — não funciona

---

## [v0.99] — Regras Globais: Textos Legíveis + Animação 4s + Tema Central

**Data:** 2026-04-07
**Tipo:** Hotfix Visual + Nova Regra Arquitetural

### Problemas corrigidos:
- Textos de eixo ilegíveis: cores claras como padrão foram banidas
- Animação agora termina em 4s (120 frames) em TODOS os gráficos
- Eixo Y de barras ancorado em 0 quando todos os valores são positivos

### Regras permanentes:
- Cores seguem sempre a referência visual como primeira opção
- fill de textos de eixo SEMPRE '#1a1a2e' — nunca variável de prop
- ANIMATION_FRAMES = 120 em TODOS os componentes
- theme.ts criado como fonte única de verdade para cores e timing

### Padrão obrigatório:
- Todo novo componente DEVE importar de theme.ts
- Todo texto de eixo DEVE usar Theme.colors.text diretamente
- Toda animação DEVE usar Theme.animation.animationFrames
- NUNCA usar cores claras como padrão para qualquer texto

---

## [2026-04-08] — CICLO 35: REGRAS AVANÇADAS DE ANIMAÇÃO (Flourish Patterns)
**Aprendi:** O Flourish utiliza 3 tipos de animação (Entrada, Transição, Reveal) com easings específicos. A entrada deve seguir uma hierarquia visual: Background → Título → Eixos → Dados → Labels.
**Padrão Flourish:** Entry durations de 600-800ms e Hierarquia Contexto → Estrutura → Dados → Interpretação.
**Regra chave:** Respeitar o "Breathing Room" de 10% de margem (64px) e stagger obrigatório entre níveis de informação.
**Master Rules salvos em:** shared/references/global-patterns/animation-rules.md
**Status:** 32/40 componentes validados.

---

## [2026-04-08] — CICLO 39: REGRAS DE TIPOGRAFIA FLOURISH
**Aprendi:** A tipografia profissional exige contrastes de peso e tamanho rígidos. Títulos em 700/Bold 28px+, Eixos em 400/Regular 11px, e Timestamps em 800/ExtraBold 56px com baixa opacidade.
**Padrão Flourish:** Uso de cores neutras escuras (#1a1a2e) para máxima legibilidade e algoritmo de contraste baseado em luminância para labels sobre cores.
**Regra chave:** NUNCA esconder labels por sobreposição; aplicar collision avoidance vertical ou leader lines se necessário.
**Master Rules salvos em:** shared/references/global-patterns/typography-rules.md
**Status:** 33/40 componentes validados.

---

## [2026-04-08] — CICLO 30: BAR CHART RACE
**Aprendi:** Implementação de rankings dinâmicos onde a posição Y é recalculada a cada frame e interpolada suavemente. O uso de contadores de valor animados é essencial para o dinamismo.
**Padrão Flourish:** Racing bars com transições de posição suaves e timestamp âncora no canto inferior.
**Regra chave:** O valor numérico e a largura da barra devem estar em sincronia absoluta com a escala do eixo X, que também é dinâmica.
**Master Rules salvos em:** shared/references/bar-chart-race/master-rules.md
**Status:** 34/40 componentes validados.

---

## [2026-04-08] — ESPECIALIZAÇÃO 01: BARCHART (VERTICAL)
**Fonte Flourish:** Spring Overshooting + Smart Value Labels.
**Aprendi:** O efeito de "bounce" ou assentamento (overshoot) é a chave para a fluidez do Flourish. Labels internos em barras grandes economizam espaço e aumentam a legibilidade. A técnica de sobreposição de retângulos permite arredondamento apenas no topo de forma limpa em SVG.
**Props adicionadas:** `highlightMax`, `highlightIndex`.
**Padrão de animação:** Spring elástico (damping 10, mass 0.8) com stagger de 4 frames.
**Status:** Componente base ESPECIALIZADO ✅

---

## [2026-04-08] — ESPECIALIZAÇÃO 02: HORIZONTALBARCHART
**Fonte Flourish:** Dynamic Left Padding + Elastic Horizontal Growth.
**Aprendi:** O cálculo dinâmico do `leftPadding` com base no `longestLabel` é crucial para manter a harmonia visual independentemente do conteúdo. Separadores horizontais ajudam na leitura de dados densos. O uso de `AbsoluteFill` garante o preenchimento correto do canvas Remotion.
**Props adicionadas:** `showRanking`, `xAxisPosition`.
**Padrão de animação:** Spring elástico (stiffness 90) com fade-in tardio do valor.
**Status:** Componente base ESPECIALIZADO ✅

---

## [2026-04-08] — ESPECIALIZAÇÃO 03: LINECHART
**Fonte Flourish:** ClipPath Reveal + Seguidor Dot pulsante + Staggered Point Pop.
**Aprendi:** O dinamismo do LineChart é elevado por um "dot seguidor" durante o reveal e pela animação individual dos pontos (spring pop) que ocorre somente após a linha estar completa. A escala Y deve ser adaptativa (10% de padding) para evitar achatamento visual.
**Props adicionadas:** `showDots`, `showArea`, `strokeWidth` (default 2px).
**Padrão de animação:** Reveal linear (0-120f) seguido por staggered spring pop dos dots.
**Status:** Componente base ESPECIALIZADO ✅

---

## [2026-04-08] — ATUALIZAÇÃO CRÍTICA: NOVA FILOSOFIA DE DESIGN 4K

**Mudança principal:** O agente agora tem autonomia criativa total sobre design.
Apenas dados, labels, títulos, tipo e ordem vêm da referência.

**Resolução:** Todos os gráficos agora em 4K UHD (3840x2160).

**Design system:** THEME.ts atualizado com paleta premium escura,
tipografia escalada para 4K, espaçamentos e efeitos visuais definidos.

**Regras revogadas:** Fidelidade ao design original (cores, posição, fontes).

**Regras mantidas:** Fidelidade aos dados, regras técnicas Remotion,
durationInFrames, ANIMATION_FRAMES, safe zone (agora 128px),
double-check, correção automática.

**Regras novas:** D1 a D10 (fundo premium, hierarquia, gridlines,
tipografia 4K, cores com propósito, gradiente em barras,
arredondamento, label inteligente, animação em 3 atos, sem elementos desnecessários).

**Status:** Nova filosofia ATIVA.

---

## [2026-04-08] — ESPECIALIZAÇÃO 4K: CICLO 01-10 (DESIGN SYSTEM COMPLIANCE)
- BarChart & HorizontalBarChart: Gradientes premium, labels inteligentes e padding adaptativo.
- LineChart & MultiLineChart: Linhas de 4-6px, revelação por ClipPath e colisão de labels inline.
- AreaChart: Gradiente de opacidade 0.25 e revelação progressiva.
- Donut & PieChart: Legendas laterais premium e animação de fatias com overshoot (popProgress).
- ScatterPlot: Animação estocástica e labels de dados dinâmicos.
- WaterfallChart: Conectores pontilhados entre fluxos e animação sequencial.
- CandlestickChart: Design OHLC com Wicks reforçados e corpos com gradientes semânticos.
- HeatmapChart: Grid de alta densidade com stagger ultra-rápido (0.5f) e interpolação de cores térmica.
**Status:** Componente base ESPECIALIZADO ✅

---

## [2026-04-08] — REGRA GLOBAL: APROVEITAMENTO DE ESPAÇO 4K

**Tipo:** Regra Global Permanente

### Problema identificado:
Gráficos renderizados pequenos e centralizados, desperdiçando grande área
útil da tela 4K (ex: PieChart ocupando ~30% da área disponível).

### Regra obrigatória:
Todo componente deve ocupar o MÁXIMO de espaço disponível dentro das safe zones.
NUNCA usar tamanho fixo arbitrário para o gráfico. O visual deve ser IMPONENTE.

### Área útil 4K:
- Resolução total:    3840 x 2160
- Safe zone lateral:  128px (cada lado)
- Safe zone vertical: 160px (topo) / 80px (rodapé)
- Largura útil:       3584px
- Altura útil:        1920px
- Origem útil:        x=128, y=160

### Cálculos obrigatórios por tipo:
```ts
const usableWidth  = 3584;
const usableHeight = 1920;

// Gráficos circulares (Pie, Donut, Radar, Polar, Gauge)
const legendWidth = usableWidth * 0.25;
const chartArea   = usableWidth * 0.75;
const radius      = Math.min(chartArea, usableHeight) * 0.42;

// Gráficos cartesianos (Bar, Line, Area, Scatter, Histogram)
const chartWidth  = usableWidth;
const chartHeight = usableHeight * 0.85; // 15% para labels eixo X

// Gráficos de fluxo (Sankey, Funnel, Chord)
const chartWidth  = usableWidth;
const chartHeight = usableHeight;

---

## [2026-04-08] — REGRAS COMPLEMENTARES: LAYOUT E LEGENDA 4K

**Tipo:** Refinamento de Layout e Checklist de Qualidade

### Regras de Posicionamento de Legenda:
- **Legenda forçada:** Sempre fora do gráfico, NUNCA sobreposta aos dados, e rigorosamente dentro da safe zone.
- **Gráficos Circulares:** Legenda OBRIGATORIAMENTE à direita, ocupando 25% da `usableWidth`.
- **Gráficos Cartesianos:** Legenda no topo ou rodapé (conforme melhor aproveitamento de espaço).
- **Dimensões Mínimas:** Fonte da legenda ≥ 28px | Ícone da legenda ≥ 32x32px.

### Regras de Dimensionamento e Centro:
- **Labels Internos:** `fontSize = radius * 0.08` (mínimo absoluto de 24px).
- **Centro Geométrico Correto:** 
  - `cx = 128 + usableWidth / 2`
  - `cy = 160 + usableHeight / 2`
- **Aproveitamento de Área:** O gráfico deve preencher visualmente ≥ 80% da área útil disponível.

### Checklist Obrigatório (Pré-Render):
1. [ ] O gráfico ocupa ≥ 80% da área útil?
2. [ ] Nenhum tamanho fixo arbitrário (hardcoded) foi usado?
3. [ ] A legenda está fora do gráfico e dentro da safe zone (128px laterais / 160px topo)?
4. [ ] Labels estão legíveis e proporcionais ao tamanho do gráfico (ex: regra do radius)?
5. [ ] O centro foi calculado dinamicamente baseado na usable area (não fixo em 1920x1080)?

**Aplicar quando:** Desenvolvimento de qualquer novo componente ou refatoração de componentes existentes para o padrão 4K.

---

## [2026-04-08] — FLOURISH DEEP ANALYSIS: CONSOLIDATED (31 TYPES)

**Missão:** Extrair DNA visual e técnico do Flourish para os 31 tipos de gráficos suportados.

### 📊 [1-5] BARS, LINES, AREA
*   **Bar/Horizontal Bar:** Flourish usa `ease-out` em escalas de 600ms com stagger de 50ms. As barras têm gradientes sutis e eixos "ghost" (opacidade 0.1).
    *   *Delta:* Nossa calibração 4K já usa gradientes premium; incorporar eixos ghost e stagger de 50ms real.
*   **Line/MultiLine:** Revelação via `clipPath` linear (Ato 1) seguida de surgimento de dots via `backOut` (Ato 2).
    *   *Delta:* Sincronizar dots para surgirem APÓS a linha passar por eles, não todos ao mesmo tempo.
*   **Area:** Preenchimento de área com opacidade 0.25 interpolando com a curva. Revelação sequencial em empilhamento (Stacked).

### 🥧 [6-7] PIE & DONUT
*   **Pie/Donut:** Expansão a partir do centro (`Ato 1`) com revelação de fatias radialmente (`Ato 2`). Legendas aparecem à direita com slide-in.
    *   *Delta:* Implementar `popProgress` do centro para cada fatia individualmente com overshoot.

### 📉 [8-12] SCATTER, WATERFALL, FINANCIAL, GAUGE, BUBBLE
*   **Scatter Plot:** Animação "rain-pop" onde pontos surgem do nada (scale 0->1) com stagger aleatório.
*   **Waterfall:** Rigor na conexão de linhas pontilhadas entre o topo/base das barras adjacentes.
*   **Financial (Candle):** Efeito "wick-first" (pavio aparece antes do corpo).
*   **Gauge:** Oscilação da agulha com recoil elástico (damping alto).
*   **Bubble:** Círculos embalados (packed) que expandem ocupando o volume visual gradualmente.

### 📂 [13-18] STACKED, GROUPED, RADAR, FUNNEL, SANKEY, TREEMAP
*   **Stacked/Grouped:** Stagger em dois níveis (grupo -> barra individual).
*   **Radar:** Inflar concêntrico (Ato 1) mantendo proporções do polígono.
*   **Funnel:** Revelação top-down simulando o fluxo de dados.
*   **Sankey:** Fluxos bezieresque desenhados dinamicamente (`stroke-dashoffset`).
*   **Treemap:** Expansão de retângulos pais seguida de subdivisões de filhos.

### 🔥 [19-31] HEATMAP, BULLET, POLAR, BOXPLOT, SPARK, NETWORK, HISTOGRAM, MEKKO, CHORD, SUNBURST, PARETO, COMP/RACE
*   **Heatmap:** Stagger em espiral ou diagonal (mais "Flourish" que rad-by-row).
*   **BoxPlot:** Whiskers surgindo como "antenas" antes da mediana.
*   **Network:** Animação de "bloom" (explosão controlada) force-directed.
*   **Bar Chart Race:** Reordenamento em tempo real com interpolação de posição Y e valor numérico.
*   **Comparative Bar:** Espelhamento perfeito com animação de expansão a partir do eixo central.

### 🛠️ Regras Refinadas GiantAnimator (DNA Flourish):
1.  **Stagger Standard:** 50ms entre elementos de dados.
2.  **Easing Standard:** `cubic-bezier(0.1, 0, 0.1, 1)`.
3.  **Visual DNA:** Eixos com opacidade 0.15, labels 28px mín, cores vibrantes sem strokes.
4.  **Ato 1-2-3:** Estrutura -> Dados -> Labels (Hierarquia obrigatória).

**Status:** Conhecimento Flourish INTEGRADO ✅

---

## [2026-04-08] — REVISÃO DE CONFLITOS

**Ação:** Auditoria completa do log para garantir consistência após adoção da "Filosofia 4K" e "DNA Flourish".

**Conflitos resolvidos:**
1.  **Fidelidade Visual:** A regra de 2026-04-06 (Fidelidade Absoluta ao Original) foi REVOGADA pela atualização de 2026-04-08. O agente agora tem autonomia para elevar o design ao padrão 4K Premium/Flourish, mantendo apenas a fidelidade aos DADOS.
2.  **Duração:** Conflitos de durações curtas (150f) foram todos unificados para o padrão GLOBAL de 600 frames (20s).
3.  **Cores:** Paletas locais de componentes antigos foram marcadas para serem substituídas pela paleta dinâmica do `Theme.ts` e padrões Flourish em caso de refatoração.

**Conclusão:** O sistema agora opera sob uma hierarquia clara: **Filosofia 4K > DNA Flourish > Dados Originais**.

---

## [2026-04-08] — MULTI-SOURCE DEEP ANALYSIS (EvilCharts | ECharts | ApexCharts)

**Missão:** Expandir o conhecimento técnico extraindo configurações e padrões de 3 bibliotecas líderes para os 31 tipos de gráficos.

### 🔬 [Aprendizados por Fonte]

*   **ECharts (DNA de Configuração):**
    *   *Técnica:* Uso extensivo do componente `graphic` para elementos customizados.
    *   *Animação:* `animationDuration` (1000ms padrão) e `animationEasing` (`cubicOut`). 
    *   *Diferencial:* Escala Y inteligente que nunca ancora no zero se os dados forem muito altos (ex: `scale: true`).
*   **ApexCharts (DNA de Interatividade):**
    *   *Técnica:* Tooltips persistentes e `dynamicAnimation` para transições de dados fluidas (800ms).
    *   *Design:* Gradientes lineares em barras e preenchimento `pattern` para áreas.
    *   *Diferencial:* Sparklines ultra-leves incorporadas em tabelas/cards.
*   **EvilCharts (DNA de Criatividade):**
    *   *Técnica:* Gráficos "irregulares" e experimentais.
    *   *Animação:* Easing elástico agressivo para entrada de pontos.

### 🛠️ Novas Melhores Práticas Consolidadas:

1.  **Escala Inteligente (ECharts Pattern):** SEMPRE usar `min` e `max` dinâmicos com 10% de padding. Se todos os dados > 1000, o eixo Y NÃO deve começar em 0 (evita achatamento).
2.  **Transição Dinâmica (Apex Pattern):** Quando os dados mudam (ex: Bar Chart Race), a duração da transição deve ser menor que a de entrada (800ms vs 1200ms).
3.  **Ghost Axis (Global Pattern):** Opacidade do eixo reduzida para 0.15 para não competir com os dados.
4.  **Overshoot (Evil Pattern):** Pequeno recoil (10%) em animações de entrada de círculos/bolhas aumenta a percepção de "vida".

### 📊 Delta dos 31 Gráficos:

*   **Sankey/Chord/Sunburst:** ECharts é a referência absoluta. Requerem mapeamento de `nodes` e `links` com animação de `stroke-dashoffset` individual.
*   **Candlestick:** ApexCharts domina o layout OHLC. Implementar `wick` separado com delay de 4 frames.
*   **Pareto:** Unificação de eixos com `axisPointer` sincronizado.
*   **Bar Race:** Interpolação de `rank` frame-a-frame (padrão Flourish + ECharts).

**Status:** Conhecimento MULTI-FONTE INTEGRADO ✅

---

## [2026-04-08] — REVISÃO DE CONFLITOS 2

**Ação:** Segunda auditoria de consistência integrando padrões de 4 fontes externas (Flourish, ECharts, Apex, EvilCharts).

**Conflitos resolvidos:**
1.  **Escala Y:** A regra anterior que às vezes forçava o eixo em 0 para barras agora é flexível ("Smart Scaling"). Se o valor mínimo for > 20% do máximo, o eixo Y pode começar acima de zero para dar clareza aos dados (padrão ECharts).
2.  **Easing:** Unificação para `Theme.animation.easing` (`[0.1, 0, 0.1, 1]`) para todos os componentes, exceto onde `backOut` é explicitamente solicitado para overshoot.
3.  **Duração:** Mantida a duração global de 600f (20s) no render, mas a animação interna de *entrada* (reveal) deve ser concluída em 120f-150f (4-5s) para permitir observação estática do dado.

**Hierarquia Final:** **Filosofia 4K > Padrões Multi-Fonte > Dados Originais**.
