# Training Log — GiantAnimator
> Fonte única de verdade do conhecimento do agente.
> Atualizado sempre que algo novo é ensinado ou uma regra é revisada.
> **Hierarquia ativa:** Filosofia 4K > Padrões Multi-Fonte (Mango / Lychee / Papaya) > Dados Originais

---
### REGRA PERMANENTE — SISTEMA DE TEMAS (OBRIGATÓRIA)
Data: 2026-04-14
Escopo: TODOS os componentes Remotion do GiantAnimator

**Regra**: Componentes NUNCA devem usar `Theme.colors.background` ou `Theme.chartColors` diretamente.
**API obrigatória**: `import { resolveTheme } from '../theme'` → `const T = resolveTheme(theme ?? 'dark')`

Os 6 temas suportados (`dark`, `neon`, `ocean`, `sunset`, `minimal`, `corporate`) têm identidades visuais 
completamente distintas definidas no `THEMES` map em `theme.ts`. A função `resolveTheme(theme)` é a única
fonte de verdade para cores, grid, eixos e backgrounds.

**Props obrigatórias em todo componente chart:**
- `theme?: string` — string do tema (default: `'dark'`)
- `backgroundColor?: string` — override opcional (fallback para `T.background`)
- `textColor?: string` — override opcional (fallback para `T.text`)
- `colors?: string[]` — override opcional (fallback para `T.colors`)

**PROIBIDO:**
- `backgroundColor = Theme.colors.background` (hardcode dark)
- `colors = Theme.chartColors` (hardcode paleta dark)
- Qualquer cor inline que não seja via `T.*` ou prop explícita

---
### REGRA PERMANENTE — ROTEAMENTO DE COMPONENTES NO Root.tsx (OBRIGATÓRIA)
Data: 2026-04-14

**Problema histórico**: O `Root.tsx` importava `./components/PieChart` (versão antiga) em vez de `./charts/PieChart` (versão atual). Toda reescrita de um componente PRECISA ser acompanhada de atualização do import no `Root.tsx`.

**Regra**: Ao reescrever ou criar um novo componente chart em `src/charts/`, verificar SEMPRE se o `Root.tsx` está importando do path correto. Nunca presumir que o import já está atualizado.

---
### REGRA PERMANENTE — TIPOGRAFIA EM PIECHART e COMPONENTES CIRCULARES (OBRIGATÓRIA)
Data: 2026-04-14

**Problema histórico**: PieChart usava `fontSize = 28 * sc` para título e `11 * sc` para legenda — valores muito pequenos que tornavam os textos invisíveis.

**Tamanhos corretos (base 720p, sc = min(w/1280, h/720)):**
| Elemento       | Multiplicador | Resultado 720p | Notas |
|---------------|---------------|----------------|-------|
| Título         | `42 * sc`     | 42px           | +50% do antigo |
| Subtítulo      | `22 * sc`     | 22px           | +65% do antigo |
| Label legenda  | `19 * sc`     | 19px           | +65% do antigo |
| Valor legenda  | `17 * sc`     | 17px           | +55% do antigo |
| Valor s/fatia  | `17 * sc`     | 17px           | com drop-shadow |
| Valor c/guia   | `15 * sc`     | 15px           | fora de fatias pequenas |

**NUNCA** usar valores fixos em pixels. Sempre multiplicar por `sc`.

---
### REGRA PERMANENTE — SAFE ZONE E LEGENDA SEM SOBREPOSIÇÃO (OBRIGATÓRIA)
Data: 2026-04-14

**Problema histórico**: Legenda do PieChart usava espaçamento fixo (`i * 40 * scale`) sem levar em conta o número de itens, causando sobreposição. O valor era posicionado em `width - 12px` sem verificar colisão com o label.

**Regra do layout de legenda (PieChart e similares):**
1. `SAFE_PAD_X = width * 0.05` — margem lateral mínima (5%)
2. `SAFE_PAD_Y = height * 0.07` — margem superior/inferior mínima (7%)
3. `ITEM_H = max(LEGEND_LABEL + gap + 4, SWATCH + gap)` — altura dinâmica por item
4. Label truncado com `…` para caber em `VALUE_X - LABEL_X - 50*sc` px
5. Valor alinhado em `VALUE_X = width - SAFE_PAD_X` (nunca na margem crua)
6. **Label dentro da fatia** quando `pct >= 8%` + `progress > 0.8`; fora com linha guia quando menor

---
Data: 2026-04-14
Escopo: TODOS os componentes e interfaces do GiantAnimator

Todo trabalho visual DEVE seguir os padrões do UI/UX Pro Max:
1. **Ícones**: PROIBIDO uso de emojis como ícones. Usar apenas SVG (Lucide / Heroicons).
2. **Interação**: Todo elemento clicável DEVE ter `cursor: pointer`.
3. **Transições**: Transições de hover devem ter entre 150-300ms (ex: `transition: all 0.2s ease`).
4. **Estabilidade**: PROIBIDO usar `transform: scale()` que cause deslocamento de layout (layout shift) no hover.
5. **Contraste**: Texto em Light Mode deve ter contraste mínimo de 4.5:1 (Slate-900 para corpo, Slate-600 para muted).
6. **Responsividade**: Validar em 4 breakpoints: 375px, 768px, 1024px, 1440px.
7. **Acessibilidade**: Focar estados visíveis (`:focus`) e respeitar `prefers-reduced-motion`.

---
### FLUXO OBRIGATÓRIO — GERAÇÃO DE GRÁFICOS
Data: 2026-04-14

Sempre que gerar um novo tipo de gráfico ou refatorar um existente, o Agente DEVE:
1. Executar `python .agent/skills/ui-ux-pro-max/scripts/search.py "<tipo_do_grafico> <estilo>" --design-system` para obter recomendações.
2. Aplicar a paleta de cores (Heuristic Palettes) e tipografia sugeridas no `theme.ts` ou via props.
3. Seguir os Atos de Animação do DNA Mango (Ato 1: Estrutura, Ato 2: Dados, Ato 3: Labels).

---
### REGRA PERMANENTE — Animação Fluida (obrigatória em todos os componentes)
Data: 2026-04-09
Escopo: TODOS os componentes presentes e futuros do GiantAnimator

OBRIGATÓRIO em qualquer componente novo ou editado:
1. spring() sempre com { damping: 80, stiffness: 200, overshoot_clamp: true }
2. Nunca usar Easing.linear em animações visuais
3. count/progress sempre clampado com stableCount
4. Stagger de elementos individuais: i * 3 frames (máx i * 5)
5. Delay de entrada do componente: entre 10-20 frames

PROIBIDO:
- spring() sem overshoot_clamp
- Math.floor() para calcular contagem de elementos visíveis
- Interpolação linear em transições visuais
- progress sem clamping no estado final

---
### REGRA PERMANENTE — Validação Visual via Stills
Data: 2026-04-09
Sempre que gerar um `remotion still` para validação, o frame deve ser >= 30.
Fórmula: `frameVal = (numElementos * framesStagger) + 20`
Tabela de referência:
- Bar/Stacked/Pie/Donut: --frame=30
- Line/Area/Radar/Waterfall: --frame=45
- Scatter/Bubble: --frame=60

---
### [2026-04-09] Padrão de Animação Definitivo
- spring({ damping: 80, stiffness: 200, overshoot_clamp: true })
- count = Math.ceil(progress * total), clampado ao máximo
- stableCount: força valor final quando progress >= 1
- Aplicado em: LineChart ✅

---
## [2026-04-09] Gauntlet T03 (StackedBarChart) — APROVADO

### Resultado
3/3 modelos com 100% de fidelidade.
Primeiro teste com múltiplas séries — pipeline manteve precisão total.

### Modelos Testados
- modelo_1.png → Vendas por Canal e Trimestre → 100% ✅
- modelo_2.png → Budget vs Realizado por Área → 100% ✅
- modelo_3.png → Uso de Recursos por Servidor → 100% ✅

### Configuração Validada
- Modelo de visão: gemini-2.5-flash-lite (GEMINI_MODEL_VISION)
- Componente: StackedBarChart
- Séries múltiplas: até 3 séries extraídas com 100% de precisão

---
## [2026-04-09] Gauntlet T02 (VerticalBarChart) — APROVADO

### Resultado
3/3 modelos com 100% de fidelidade.

### Modelos Testados
- modelo_1.png → Receita Mensal 2024 → 100% ✅
- modelo_2.png → NPS por Departamento → 100% ✅
- modelo_3.png → Consumo de Energia (KWh) → 100% ✅

### Configuração Validada
- Modelo de visão: gemini-2.5-flash-lite (GEMINI_MODEL_VISION)
- Componente: BarChart (vertical)
- Delay entre testes: 10s (rate limit safety)

---
## [2026-04-09] Gauntlet T01 (HorizontalBarChart) — APROVADO

### Resultado
3/3 modelos com 100% de fidelidade.
Pipeline de visão + renderização totalmente estável.

### Modelos Testados
- modelo_1.png → Drivers de Eficiência → 100% ✅
- modelo_2.png → Vendas por Região 2024 → 100% ✅
- modelo_3.png → Market Share Big Tech 2024 → 100% ✅

### Configuração Validada
- Modelo de visão: gemini-2.5-flash-lite (GEMINI_MODEL_VISION)
- Componente: HorizontalBarChart
- SDK: @google/genai v1.48.0

---
## [2026-04-09] Bug Fix — visionService.ts ignorava GEMINI_MODEL_VISION

### Problema
O `visionService.ts` importava `GEMINI_MODEL` ao invés de
`GEMINI_MODEL_VISION`, fazendo com que todas as alterações
na constante de visão fossem ignoradas silenciosamente.
O modelo real usado era sempre o de texto, não o de visão.

### Root Cause
Import incorreto na linha 6 de `server/visionService.ts`.
A constante `GEMINI_MODEL_VISION` existia em `constants.ts`
mas nunca havia sido referenciada no serviço de visão.

### Fix Aplicado
- Import: `GEMINI_MODEL` → `GEMINI_MODEL_VISION`
- Chamada SDK: `GEMINI_MODEL` → `GEMINI_MODEL_VISION`
- Arquivo: `server/visionService.ts`

### Resultado
Fidelidade 100% no modelo_1.png (bar_h) após correção.

### Lição
Sempre verificar se uma constante de configuração está
de fato sendo IMPORTADA e USADA no serviço correto,
não apenas definida em constants.ts.

---

## HIERARQUIA DE DECISÃO

| Prioridade | Camada | Domínio |
|------------|--------|---------|
| 1 | Filosofia 4K UHD | Resolução, safe zones, aproveitamento de área |
| 2 | DNA Mango / Lychee / Papaya | Animações, easings, stagger, tipografia |
| 3 | Dados Originais | Valores, labels, títulos (fidelidade absoluta) |

---

## [2026-04-06] INFRAESTRUTURA

**Regra:** Sempre usar `--transpile-only` no ts-node para iniciar o servidor rapidamente.
Sem esse flag, o ts-node faz verificação completa de tipos e pode falhar ou demorar.
**Aplicar quando:** Scripts de start, INICIAR.bat, comandos npm.

---

## [2026-04-06] DETECÇÃO DE ARQUIVOS (WINDOWS)

**Regra:** No Windows, usar 3 camadas de detecção: `chokidar` + `fs.watch` + polling `setInterval` a cada 5s.
O chokidar sozinho não é suficiente — arquivos no `input/` podem não ser detectados.
**Aplicar quando:** Qualquer modificação no sistema de watching de arquivos.

---

## [2026-04-06] INICIALIZAÇÃO (INICIAR.bat)

**Regra:** Verificar nesta ordem: Node.js instalado → ts-node existe → .env existe → porta livre → instalar deps → iniciar servidor → health check com timeout de 60s.
**Aplicar quando:** Qualquer alteração no INICIAR.bat ou processo de boot.

---

## [2026-04-06] ESTRUTURA DE PASTAS

**Regra:** A pasta `shared/` fica **dentro** do repositório GiantAnimator (confirmado em 2026-04-09).
Caminhos: `input/`, `output/`, `shared/references/`.
**Aplicar quando:** Qualquer referência a input/, output/ ou processed/.

---

## [2026-04-06] ARQUITETURA DE COMPONENTES REMOTION

**Regra:** O `Root.tsx` usa Named Imports — TODOS os componentes devem usar `export const NomeDoComponente`.
NUNCA usar `export default` em componentes Remotion.
**Aplicar quando:** Criar ou editar qualquer componente em `remotion-project/src/`.

---

## [2026-04-06] REMOTION API v4.0

**Regra:** `spring()` retorna o valor diretamente (`number`). Não existe mais `.value`.
Usar `spring().value` causa erro silencioso (NaN/undefined).
**Aplicar quando:** Qualquer animação com `spring()`, `interpolate()` ou `useCurrentFrame()`.

---

## [2026-04-06] TEMA DE CORES

**Regra:** As cores dos gráficos ficam em `Theme.colors.chartColors[0]`, `[1]`, etc.
Não existe `THEME.colors.series1` ou estrutura similar.
**Fonte única:** `remotion-project/src/theme.ts` — não duplicar em nenhum outro lugar.
**Aplicar quando:** Qualquer componente que use cores de séries / barras / linhas.

---

## [2026-04-06] REGRAS DE OURO DA CALIBRAÇÃO

| Regra | Detalhe |
|-------|---------|
| **DADOS** | Valores, labels e porcentagens 100% idênticos ao original. Nunca inventar, arredondar ou omitir. |
| **FONTES** | Sempre usar a mesma fonte ou similar disponível. Fonte complementar apenas para símbolos especiais. |
| **TEXTO** | Title Case (primeira letra maiúscula por palavra). Exceções: preposições e artigos curtos. |
| **OVERLAP** | Proibido overlap não intencional. Permitido: linhas cruzando em LineChart, dados dentro de Pie/Donut. |
| **SAFE ZONE** | Todos os elementos dentro da safe zone (128px lateral, 160px topo, 80px rodapé). |
| **DOUBLE CHECK** | Todo gráfico passa pelo checklist antes do render. Só renderiza se STATUS = APROVADO. |
| **CORREÇÃO** | Erros corrigidos automaticamente quando possível. Após 2 tentativas sem sucesso: reportar ao usuário. |
| **ASSETS** | Liberdade total para baixar logos, ícones, fontes. Salvar em `shared/references/{tipo}/`. |

---

## [2026-04-06] CICLOS DE CALIBRAÇÃO INICIAIS

| Ciclo | Componente | Aprendizado-chave |
|-------|-----------|-------------------|
| 1 | BarChart Vertical | Spring animation + remoção de overflow-hidden para efeito elástico |
| 2 | LineChart | `stroke-dashoffset` + `pathLength` para compatibilidade v4.0 |
| 3 | HorizontalBarChart | Padding esquerdo obrigatório de 250px para labels de ranking |
| 4 | AreaChart | `<path>` fechado + gradiente de profundidade |
| 5 | PieChart | `(value / total) * 360` para ângulos. Efeito Donut via `innerRadius` |
| 6 | DonutChart | Centro sempre com informação (Total ou Destaque) |
| 7 | ScatterChart | Opacidade reduzida para Heat zones de densidade |
| 8 | RadarChart | Trigonometria sin/cos por número de eixos. Animação síncrona dos vértices |
| 9 | BubbleChart | 3 dimensões (X, Y, Z). Animação individual por bolha |
| 10 | HeatmapChart | Color Lerp. Animação espiral > linha-a-linha |
| 11 | TreemapChart | Algoritmo Squarified. Pai surge antes dos filhos |
| 12 | GanttChart | Sidebar (labels) + Canvas (tempo). Scroll sincronizado |
| 13 | FunnelChart | Trapézios contíguos. Animação top-down |
| 14 | Lote Analítico | Waterfall, Sankey, BoxPlot, Candle, Gauge |
| 15 | Lote Distribuição | Polar, Bullet, Timeline, Network, Histogram, Stacked, Grouped |
| 16 | Lote Complexo | Mekko, Chord, Sunburst, Pareto, Sparkline |

---

## [2026-04-07] CICLOS DE VALIDAÇÃO AVANÇADA

| Ciclo | Componente | Aprendizado-chave |
|-------|-----------|-------------------|
| 17 | AreaChart | `clipPath` animado para wave-reveal. `spring(14, 60)` para consistência elástica |
| 18 | MultiLineChart | Stagger individual de 8 frames entre séries. `evolvePath` + surgimento sincronizado de dots |
| 19 | Donut + Pie | Arcos SVG manuais (`M/A/L/Z`) mais precisos que `stroke-dasharray`. Stagger de 6 frames |
| 20 | ScatterPlot | Escalas numéricas contínuas mapeadas manualmente. Rain-pop com stagger de 3 frames. Opacidade 0.75 |
| 21 | WaterfallChart | Acumulação rigorosa. Barra de Total parte do zero. Linhas pontilhadas de conexão |
| 22 | CandlestickChart | Animação Wick antes do Body. Fundo escuro `#020617` obrigatório |
| 23 | GaugeChart | Semicírculo -90° a +90°. Needle-swing com damping 12. Zonas via SVG arc |
| 24 | BubbleChart | Raio via `Math.sqrt` (área proporcional). Bounce damping 10. Labels só com raio > 20px |
| 25 | StackedBarChart | Stagger duplo: entre categorias (4f) e entre segmentos (2f) |
| 26 | GroupedBarChart | Espaçamento entre grupos 20% > interno 5%. Stagger de 3 frames por grupo |
| 27 | RadarChart | Radial-stretch síncrono. Preenchimento 30% opacidade. Até 3 séries comparativas |
| 28 | FunnelChart | Trapézios com base = topo do próximo. Drop-off calculado dinamicamente |
| 29 | SankeyChart | Motor de layout personalizado. Bezier cúbico. Nodes (Fade) → Links (Stroke Growth) |
| 30 | TreemapChart | Squarified algorithm. Nested-zoom do centro. Labels condicionais por área |
| 31 | HeatmapChart | Escala divergente (DeepBlue → White → DeepGold). Labels inclinados no eixo X |
| 32 | BulletChart | Camadas: faixas qualitativas → barra performance → marcador de meta |
| 33 | PolarChart | Arcos SVG radiais. Animação radial-growth com stagger espiral |
| 34 | BoxPlotChart | Whiskers primeiro, depois boxes, depois outliers (pontos vermelhos por último) |
| 35 | SparklineChart | Ultra-minimalista, sem eixos. Wave-reveal + ponto de destaque no último valor |
| 36 | NetworkChart | Posições predefinidas. Nodes (Pop) → Edges (Stroke Growth). Markers SVG para direção |
| 37 | HistogramChart | Barras contíguas. Bins dinâmicos. Curva KDE sobreposta |
| 38 | MekkoChart | `totalMarketValue` para larguras. Animação bottom-to-top com stagger de 8f |
| 39 | ChordChart | Ângulos de arco meticulosos. Bezier quadrático (Q). Radial-twist (arcos → ribbons) |
| 40 | SunburstChart | Implementação recursiva de ângulos. Center-out nível a nível. Brilho crescente por nível |
| 41 | ParetoChart | Eixos Y duplos. Ordenação automática obrigatória. Barras → Linha acumulada. Destaque 80% |
| 42 | ComparativeBar | Escala simétrica central. Labels centralizados. Outward growth do eixo central |
| 43 | BarChartRace | Posição Y recalculada por frame. Contadores animados. Escala X dinâmica |

---

## [v0.91] LABELS DENTRO DE FATIAS (PIE / DONUT)

Quando a referência mostrar percentuais ou labels DENTRO das fatias, posicionar no centróide (raio ~65%):

```ts
const midAngle = startAngle + sweepAngle / 2;
const x = cx + radius * 0.65 * Math.cos(midAngle);
const y = cy + radius * 0.65 * Math.sin(midAngle);
```

- Cor do texto: branco, negrito
- Fidelidade visual à referência tem prioridade sobre "limpeza" do layout
- Se a referência mostrar sobreposição intencional (label sobre borda), replicar esse comportamento

---

## [v0.92] PAINEL DE PROPRIEDADES (UI)

Categorias em accordion:
- 📊 Dados (valores, labels, título)
- 🎨 Cores (color pickers nativos `<input type="color">`, gerados dinamicamente por `data.length`)
- 📐 Dimensões e Posição (X, Y, Width, Height, Scale slider)
- ✏️ Tipografia (fonte, tamanho, peso)
- 🎬 Animação (duração, delay, easing, FPS)
- 🖼️ Aparência (toggles para legenda, grid, eixos)

**Padrões:**
- Debounce 300ms em todos os campos
- Accordion com estado open/closed por categoria
- Botão "Copiar props como JSON" no topo
- Botão "Resetar para padrão" por categoria
- Interface `EditableProps` em `server/types/editableProps.ts`
- Props: `elementColors`, `x`, `y`, `width`, `height`, `scale`

---

## [v0.93] COLOR PICKERS DINÂMICOS + POSIÇÃO/TAMANHO

- Color pickers gerados dinamicamente com base em `data.length`
- Atualiza `colors[]` na posição correta com debounce 300ms
- Label usa nome do item se disponível, senão "Item N"
- Props `elementColors`, `x`, `y`, `width`, `height`, `scale` adicionados às interfaces dos componentes
- Container principal usa `position: absolute` + `transform: scale`

---

## [v0.93-fix] BUGFIX: PAINEL + MARGEM DE SEGURANÇA DO TÍTULO

**Corrigido:**
- Grupos "📐 Posição e Tamanho" e "🎨 Cores do Gráfico" agora aparecem corretamente no painel
- Título do PieChart e HorizontalBarChart corrigido para respeitar margem de segurança

**Regra registrada — títulos SEMPRE devem ter:**
- `maxWidth: 3400px` (para frame 3840px)
- `paddingLeft / paddingRight: mínimo 80px`
- `textAlign: center`
- `wordBreak: break-word`
- Nunca alterar cor / fonte / peso — apenas layout

---

## [v0.94] LINECHART — PADRÃO VISUAL TÉCNICO/FINANCEIRO

```
fundo:    #f8f9fa ou #ffffff
linha:    strokeWidth 1.5–2px, cor #1a5276
grid:     #e0e0e0, horizontal obrigatório
eixo Y:   valores numéricos reais — escala automática (min - 5% / max + 5%, NUNCA força zero)
eixo X:   labels de categoria / data
dots:     prop showDots (desligado por padrão)
curva:    prop curveType (bezier ou linear)
padding:  top 40 / bottom 60 / left 70 / right 60
animação: clipPath reveal (único polyline)
```

**Regra global adicionada:** Todos os gráficos devem ter `durationInFrames: 600` (20s a 30fps).
Animação completa e gráfico permanece visível e estático até o fim.

---

## [v0.95] HOTFIX CRÍTICO: LINECHART (BUG DE MÚLTIPLOS PATHS)

**Root cause:** LineChart gerava múltiplos paths SVG sobrepostos durante animação.

**Solução:**
- Técnica de animação: `clipPath` com `<rect>` de largura crescente
- Escala Y: `yMin = dataMin * 0.9`, `yMax = dataMax * 1.1` — nunca força zero
- Um único `<polyline>` para a linha — sem duplicação

**Regra técnica permanente:**
> Animações de linha em SVG devem usar `clipPath`, NÃO `stroke-dashoffset` complexo.
> `clipPath` com `<rect width={revealWidth}>` é seguro e sem bugs no Remotion.

---

## [v0.97] HOTFIX: DURAÇÃO 600F + SCALE FIX + CLIPPATH ID ÚNICO

**Root causes identificados:**
- `app.js` linha 196: `durationInFrames` hardcoded como `150`
- `renderService.ts`: passava `durationInFrames` via `--props` sem validação

**Correções aplicadas:**
1. `app.js`: `durationInFrames: 150` → `600`
2. `renderService.ts`: validação antes do render (força mínimo 600)
3. `LineChart`: `clipPath` id agora único por instância

**Regras permanentes:**
- NUNCA usar `durationInFrames < 600` em nenhum arquivo
- SEMPRE validar `durationInFrames` no `renderService` antes de renderizar
- `clipPath` IDs SEMPRE únicos — nunca string fixa `"reveal"`
- `transform: scale()` no LineChart: **PROIBIDO**

---

## [v0.98] HOTFIX ARQUITETURAL: durationInFrames NA COMPOSITION

**Root cause definitivo:**
`durationInFrames` dentro de `inputProps` é uma prop React — não controla duração do vídeo.
A duração real é controlada por `composition.durationInFrames` no `renderMedia`.

**Correção:**
```ts
// renderService.ts — OBRIGATÓRIO antes do renderMedia
composition.durationInFrames = 600;
```

**Regra permanente crítica:**
> `composition.durationInFrames = 600` SEMPRE antes do `renderMedia`.
> NUNCA tentar controlar duração do vídeo via `inputProps` — não funciona.

---

## [v0.99] REGRAS GLOBAIS: TEXTOS + ANIMATION_FRAMES + TEMA

**Problemas corrigidos:**
- Textos de eixo ilegíveis: cores claras como padrão foram banidas
- Animação termina em 4s (120 frames) em TODOS os gráficos
- Eixo Y de barras ancorado em 0 quando todos os valores são positivos

**Regras permanentes:**
- `fill` de textos de eixo SEMPRE `Theme.colors.text` — nunca variável de prop
- `ANIMATION_FRAMES = 120` em TODOS os componentes
- Todo novo componente DEVE importar de `theme.ts`
- NUNCA usar cores claras como padrão para qualquer texto

---

## [2026-04-07] REGRAS TÉCNICAS REMOTION / SVG

| Regra | Detalhe |
|-------|---------|
| `clipPath` para animação de linha | Usar `<rect width={revealWidth}>` — nunca `strokeDashoffset` com muitos pontos |
| `clipPath` IDs únicos | Sempre únicos por instância (ex: `clip-${Math.random()}`). Nunca string fixa `"reveal"` |
| `transform: scale()` em LineChart | **PROIBIDO** — causa artefatos visuais |
| `durationInFrames` no render | Via `composition.durationInFrames = 600` no `renderService.ts`. NUNCA via `inputProps` |
| `export default` em componentes | **PROIBIDO** — Root.tsx usa Named Imports |
| `spring().value` | **PROIBIDO** — v4.0 retorna number diretamente |

---

## [2026-04-07] REGRA GLOBAL: DURAÇÃO

- `durationInFrames` = **600** em TODOS os componentes e no `Root.tsx`
- `composition.durationInFrames = 600` forçado no `renderService.ts` antes do `renderMedia`
- Animação de entrada termina em **120 frames (4s)** — gráfico permanece estático e legível até o fim
- NUNCA usar `durationInFrames < 600` em nenhum arquivo do projeto

---

## [2026-04-08] FILOSOFIA 4K UHD (ATIVA)

Autonomia criativa total sobre design. Apenas dados, labels, títulos, tipo e ordem vêm da referência.
O agente eleva o design ao padrão 4K Premium / Mango / Lychee.

### Canvas e Safe Zones

| Medida | Valor |
|--------|-------|
| Resolução | 3840 × 2160 |
| Safe zone lateral | 128px (cada lado) |
| Safe zone topo | 160px |
| Safe zone rodapé | 80px |
| Largura útil | 3584px |
| Altura útil | 1920px |
| Centro X (cx) | 1920px |
| Centro Y (cy) | 1120px |

### Cálculos obrigatórios por tipo

```ts
// Gráficos circulares (Pie, Donut, Radar, Polar, Gauge)
const legendWidth = usableWidth * 0.25;  // 896px
const chartArea   = usableWidth * 0.75;  // 2688px
const radius      = Math.min(chartArea, usableHeight) * 0.42;

// Gráficos cartesianos (Bar, Line, Area, Scatter, Histogram)
const chartWidth  = usableWidth;          // 3584px
const chartHeight = usableHeight * 0.85;  // 1632px

// Gráficos de fluxo (Sankey, Funnel, Chord)
const chartWidth  = usableWidth;   // 3584px
const chartHeight = usableHeight;  // 1920px
```

### Regras de Design (D1–D10)

| # | Regra |
|---|-------|
| D1 | Fundo premium escuro (`#0f1117`) obrigatório |
| D2 | Hierarquia visual: Background → Título → Eixos → Dados → Labels |
| D3 | Gridlines com opacidade ≤ 0.06 (nunca competem com dados) |
| D4 | Tipografia escalada 4K: título 72px, eixos 30px, labels 36px |
| D5 | Cores com propósito: `chartColors[]` do Theme, sem cores aleatórias |
| D6 | Gradiente em barras e áreas para percepção de profundidade |
| D7 | Bordas arredondadas (`borderRadius`) em elementos retangulares |
| D8 | Label inteligente: interno se espaço ≥ threshold, externo caso contrário |
| D9 | Animação em 3 atos: Estrutura (0–30f) → Dados (30–150f) → Labels (150–210f) |
| D10 | Sem elementos desnecessários: remover o que não agrega informação |

### Checklist pré-render obrigatório

1. [ ] O gráfico ocupa ≥ 80% da área útil?
2. [ ] Nenhum tamanho hardcoded foi usado?
3. [ ] Legenda fora do gráfico e dentro da safe zone?
4. [ ] Labels legíveis e proporcionais (mínimo 28px)?
5. [ ] Centro calculado dinamicamente (`cx` e `cy` do Theme)?
6. [ ] `composition.durationInFrames = 600` no renderService?
7. [ ] Todos os IDs de `clipPath` são únicos?
8. [ ] STATUS = APROVADO?

---

## [2026-04-08] DNA MANGO — ANIMAÇÕES

### Padrões consolidados

| Padrão | Valor |
|--------|-------|
| Stagger entre elementos | 2 frames (≈ 50ms @ 30fps) |
| Easing padrão | `cubic-bezier(0.1, 0, 0.1, 1)` |
| Easing com overshoot | `backOut` (bolhas, pontos, dots) |
| Eixos / grid opacity | 0.15 |
| Labels mínimos | 28px |
| Duração de entrada (Ato 2) | 120 frames |

### Hierarquia de entrada (obrigatória)

```
Ato 1 (0–30f):   Background → Título → Eixos → Grid
Ato 2 (30–150f): Dados (barras, linhas, fatias, pontos)
Ato 3 (150–210f): Labels → Legenda → Anotações
```

### Sequências por tipo

| Tipo | Sequência de animação |
|------|-----------------------|
| Bar / HorizontalBar | Ease-out 600ms, stagger 50ms, gradientes, eixos ghost |
| Line / MultiLine | ClipPath reveal → dots surgem APÓS a linha passar por eles |
| Area | Preenchimento 0.25 opacidade, revelação com curva |
| Pie / Donut | Expansão do centro → fatias radialmente → legenda slide-in |
| Scatter | Rain-pop: scale 0→1 com stagger aleatório |
| Waterfall | Linhas pontilhadas entre topo/base de barras adjacentes |
| Candlestick | Wick primeiro (4f delay) → Body escala |
| Gauge | Needle-swing with recoil elástico (damping alto) |
| Bubble | Packed circles expandindo. Overshoot 10% |
| Stacked / Grouped | Stagger duplo: grupo → barra individual |
| Radar | Inflar concêntrico mantendo forma geométrica |
| Funnel | Top-down simulando fluxo |
| Sankey | `stroke-dashoffset` individual por link |
| Treemap | Pai expande → filhos nascem dentro |
| Heatmap | Stagger espiral (0.5f por célula) |
| BoxPlot | Whiskers → Boxes → Outliers |
| Network | Bloom controlado: Nodes → Edges |
| Bar Race | Interpolação de posição Y e valor numérico frame-a-frame |
| Comparative | Outward growth a partir do eixo central |

---

## [2026-04-08] PADRÕES MULTI-FONTE (Lychee / Papaya / Durian)

### Smart Scaling (Lychee)
Se valor mínimo > 20% do máximo: eixo Y não precisa começar em zero.
Sempre usar `min = dataMin * 0.9` e `max = dataMax * 1.1` para evitar achatamento.

### Transição Dinâmica (Papaya)
Duração de transição entre dados < duração de entrada: `800ms` vs `1200ms`.

### Ghost Axis (Global)
Opacidade do eixo reduzida para `0.15` para não competir com os dados.

### Overshoot (Durian Pattern)
Recoil de 10% em animações de entrada de círculos/bolhas aumenta percepção de vida.

---

## [2026-04-08] ANÁLISE PROFUNDA — DNA MANGO (31 TIPOS)

### [1–5] Bars, Lines, Area
- **Bar/HorizontalBar:** `ease-out` 600ms, stagger 50ms real, gradientes sutis, eixos ghost (opacidade 0.1)
  - *Implementar:* Incorporar eixos ghost e stagger de 50ms real na calibração 4K
- **Line/MultiLine:** ClipPath reveal linear (Ato 1) → dots surgem via `backOut` APÓS a linha passar por eles
- **Area:** Preenchimento opacidade 0.25 interpolando com a curva. Revelação sequencial em Stacked

### [6–7] Pie & Donut
- Expansão do centro (Ato 1) → revelação de fatias radialmente (Ato 2) → legenda slide-in
- `popProgress` do centro para cada fatia individualmente com overshoot

### [8–12] Scatter, Waterfall, Financial, Gauge, Bubble
- **Scatter:** Rain-pop (scale 0→1) com stagger aleatório
- **Waterfall:** Linhas pontilhadas rigorosas entre topo/base de barras adjacentes
- **Candlestick:** Wick-first (pavio antes do corpo, 4f delay)
- **Gauge:** Oscilação com recoil elástico (damping alto)
- **Bubble:** Packed circles expandindo gradualmente. Overshoot 10%

### [13–18] Stacked, Grouped, Radar, Funnel, Sankey, Treemap
- **Stacked/Grouped:** Stagger em dois níveis (grupo → barra individual)
- **Radar:** Inflar concêntrico mantendo proporções do polígono
- **Funnel:** Top-down simulando fluxo de dados
- **Sankey:** `stroke-dashoffset` individual por link
- **Treemap:** Pai expande → filhos nascem dentro

### [19–31] Heatmap ao Bar Race
- **Heatmap:** Stagger espiral ou diagonal (superior ao row-by-row)
- **BoxPlot:** Whiskers como "antenas" antes da mediana
- **Network:** Bloom (explosão controlada) force-directed
- **Bar Race:** Reordenamento com interpolação de posição Y e valor numérico
- **Comparative:** Espelhamento com animação do eixo central para fora

---

## [2026-04-08] ANÁLISE MULTI-FONTE (Lychee / Papaya / Durian)

### DNA de Configuração (Lychee)
- Uso extensivo do componente `graphic` para elementos customizados
- `animationDuration: 1000ms`, `animationEasing: cubicOut`
- **Diferencial:** Escala Y inteligente — nunca ancora no zero se dados forem muito altos (`scale: true`)
- Referência absoluta para: Sankey, Chord, Sunburst — requerem `nodes` + `links` com `stroke-dashoffset` individual

### DNA de Interatividade (Papaya)
- Tooltips persistentes e `dynamicAnimation` para transições fluidas (800ms)
- Gradientes lineares em barras e preenchimento `pattern` para áreas
- **Diferencial:** Sparklines ultra-leves incorporadas em tabelas/cards
- Referência para: Candlestick (layout OHLC, `wick` separado com delay 4f), Pareto (`axisPointer` sincronizado)

### DNA de Criatividade (Durian)
- Gráficos irregulares e experimentais
- Easing elástico agressivo para entrada de pontos

### Delta dos 31 Gráficos (Multi-Fonte)
- **Bar Race:** Interpolação `rank` frame-a-frame (padrão Mango + Lychee)
- **Pareto:** Unificação de eixos com pointer sincronizado
- **Sankey/Chord/Sunburst:** Lychee como referência absoluta

---

## [2026-04-08] ESPECIALIZAÇÃO 4K — COMPONENTES BASE

### Especialização 01: BarChart Vertical
- **Fonte:** Spring Overshooting + Smart Value Labels
- Bounce/assentamento (overshoot): chave da fluidez Mango
- Labels internos em barras grandes economizam espaço
- Sobreposição de retângulos para arredondamento apenas no topo (SVG limpo)
- **Props adicionadas:** `highlightMax`, `highlightIndex`
- **Animação:** Spring elástico (damping 10, mass 0.8) com stagger de 4 frames

### Especialização 02: HorizontalBarChart
- **Fonte:** Dynamic Left Padding + Elastic Horizontal Growth
- `leftPadding` dinâmico baseado no `longestLabel` — essencial para harmonia visual
- Separadores horizontais para dados densos
- `AbsoluteFill` garante preenchimento correto do canvas
- **Props adicionadas:** `showRanking`, `xAxisPosition`
- **Animação:** Spring elástico (stiffness 90) com fade-in tardio do valor

### Especialização 03: LineChart
- **Fonte:** ClipPath Reveal + Dot Seguidor Pulsante + Staggered Point Pop
- Dot seguidor durante o reveal eleva o dinamismo
- Animação individual dos pontos (spring pop) SOMENTE após linha completa
- Escala Y adaptativa: 10% de padding evita achatamento visual
- **Props adicionadas:** `showDots`, `showArea`, `strokeWidth` (default 2px)
- **Animação:** Reveal linear (0–120f) → staggered spring pop dos dots

### Resumo 4K — Todos os Componentes

| Componente | Melhoria-chave |
|------------|----------------|
| BarChart | Gradientes premium, labels internos inteligentes, padding adaptativo |
| HorizontalBarChart | `leftPadding` dinâmico por `longestLabel`. `showRanking`, `xAxisPosition` |
| LineChart | Linhas 4–6px, ClipPath reveal, dot seguidor pulsante durante reveal |
| MultiLineChart | Stagger 8f entre séries, dots surgem após linha passar |
| AreaChart | Gradiente 0.25, wave-reveal progressivo |
| Donut + Pie | Legenda lateral premium, `popProgress` do centro com overshoot |
| ScatterPlot | Rain-pop estocástico, labels dinâmicos |
| WaterfallChart | Conectores pontilhados entre fluxos |
| CandlestickChart | Wicks reforçados, corpos com gradientes semânticos |
| HeatmapChart | Grid alta densidade, stagger ultra-rápido (0.5f), interpolação térmica |

---

## [2026-04-08] REGRAS DE TIPOGRAFIA

| Elemento | Tamanho | Peso | Cor |
|----------|---------|------|-----|
| Título principal | 72px | 700 | `Theme.colors.text` |
| Subtítulo | 40px | 400 | `Theme.colors.textMuted` |
| Label de dado | 36px | 600 | `Theme.colors.text` |
| Label de eixo | 30px | 400 | `Theme.colors.textMuted` |
| Legenda | 28px | 400 | `Theme.colors.text` |
| Timestamp / destaque | 56px | 800 | opacidade 0.15 |

- **Regra de contraste:** Algoritmo de luminância para labels sobre cores escuras vs claras
- **Regra de colisão:** NUNCA esconder labels por sobreposição — aplicar collision avoidance vertical ou leader lines
- **Fill de eixos:** SEMPRE `Theme.colors.text` diretamente — nunca variável de prop

---

## [2026-04-08] REVISÃO DE CONFLITOS (AUDITORIA FINAL)

| Conflito | Resolução |
|----------|-----------|
| Fidelidade visual ao original | **REVOGADA** — agente tem autonomia criativa total sobre design |
| Durações curtas (150f) | **UNIFICADAS** para 600 frames globais |
| Escala Y forçada em zero | **FLEXÍVEL** — Smart Scaling (Lychee): se mínimo > 20% do máximo, pode iniciar acima de zero |
| Easing variado por componente | **UNIFICADO** para `Theme.animation.easing` (`[0.1, 0, 0.1, 1]`), exceto onde `backOut` é explícito |
| Paletas locais de componentes antigos | **SUBSTITUIR** pela paleta dinâmica do `Theme.ts` em refatorações |

**Hierarquia Final confirmada:** Filosofia 4K > Padrões Multi-Fonte (Mango/Lychee/Papaya/Durian) > Dados Originais

---

## [2026-04-09] ARQUITETURA — TEMA ÚNICO

1. Arquivo: `remotion-project/src/theme.ts`
2. Este é o **único** arquivo de tema do projeto
3. Não existe `theme.ts` na raiz nem em qualquer outro local
4. Todos os componentes importam via `import { Theme } from '../theme'`
5. Alias `THEME` disponível para retrocompatibilidade
6. Localização `shared/`: confirmada **dentro** do repositório (não em `../shared/`)

## [2026-04-09] REGRA DE CODINOMES — FONTES EXTERNAS

**Tipo:** Regra de Segurança / Ofuscação Permanente

### Regra:
Todo site, ferramenta ou biblioteca externa usada como referência de treinamento
deve ter seu nome real substituído por um **codinome de fruta** em TODOS os
arquivos do projeto (código, markdown, comentários, logs).

### Mapeamento atual

| Nome real | Codinome | Fruta |
|-----------|----------|-------|
| Flourish  | Mango    | 🥭    |
| ECharts   | Lychee   | 🍈    |
| ApexCharts / Apex | Papaya | 🍈  |
| EvilCharts | Durian  | 🍈    |

### Regras de atribuição:

1. **Aleatoriedade:** Cada nova fonte recebe uma fruta aleatória ainda não usada
2. **Permanência:** Uma vez atribuído, o codinome nunca muda
3. **Escopo total:** Substituir em `.ts`, `.tsx`, `.md`, `.json`, `.txt`, `.bat`, `.js`
4. **Prioridade de substituição:** Nomes compostos primeiro (ex: `ApexCharts` antes de `Apex`)
5. **Registro obrigatório:** Todo novo codinome deve ser adicionado à tabela acima antes de usar
6. **Sem exceções:** Nem em comentários, nem em strings, nem em nomes de variáveis

### Frutas disponíveis (ainda não usadas)
Lemon 🍋 · Kiwi 🥝 · Fig 🍑 · Grape 🍇 · Plum 🍑 · Coconut 🥥 · Peach 🍑 ·
Lime 🍋 · Guava · Jackfruit · Starfruit · Dragonfruit · Persimmon · Tamarind ·
Loquat · Rambutan · Sapodilla · Ackee · Cherimoya · Feijoa

### Como aplicar em novos casos:
```powershell
# 1. Escolher a próxima fruta disponível da lista acima
# 2. Registrar na tabela de mapeamento
# 3. Rodar o script de substituição:

$newName  = "NomeDaSite"      # nome real a substituir
$codename = "NomeDaFruta"     # codinome atribuído

Get-ChildItem -Recurse -Include "*.ts","*.tsx","*.md","*.json","*.txt","*.bat","*.js" |
  Where-Object { $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch ".git" } |
  ForEach-Object {
    $content = Get-Content $_.FullName -Raw -Encoding UTF8
    if ($content -match [regex]::Escape($newName)) {
      $content = $content -replace [regex]::Escape($newName), $codename
      Set-Content $_.FullName -Value $content -Encoding UTF8 -NoNewline
      Write-Host "✅ $($_.Name)"
    }
  }
```

## [2026-04-09] — CONVENCÃO
**Aprendi:** Hierarquia de pastas de input separada por tipo de arquivo.
**Contexto:** Imagens ficam em \input/images/\ e planilhas em \input/tables/\.
O \paths.ts\ é a fonte de verdade de todos os caminhos e cria as pastas
automaticamente no boot via \s.mkdirSync(p, { recursive: true })\.
**Aplicar quando:** Ao adicionar novo tipo de input ao sistema (áudio, PDF, etc.).

---

## [2026-04-09] — INFRAESTRUTURA
**Aprendi:** Pipeline completo para upload de tabelas via rota POST /upload-table.
**Contexto:** O fluxo é: Parse (tableParserService) → Análise IA (agent.analyzeTable)
→ Render (renderService.render) → Histórico (historyService.add) → SSE (broadcast render_complete).
Diferente do fluxo de imagem (que usa visão), tabelas já têm os dados — o Gemini
apenas decide o tipo de gráfico e o layout visual.
**Aplicar quando:** Ao modificar ou estender o pipeline de ingestão de dados.

---

## [2026-04-09] — AGENTE
**Aprendi:** Lógica de decisão do Gemini para escolha de gráfico a partir de dados tabulares.
**Contexto:** O método analyzeTable() no agent.ts envia ao Gemini um resumo
estatístico da tabela (colunas, tipos, amostra de 5 linhas) e regras de decisão:
- 1 col categórica + 1 numérica -> BarChart ou HorizontalBarChart
- 1 col temporal + 1 numérica   -> LineChart
- Valores que somam ~100%       -> PieChart ou DonutChart
- Múltiplas séries numéricas    -> GroupedBarChart ou LineChart
O modelo usado é gemini-2.5-flash (via constants), sem necessidade de visão.
**Aplicar quando:** Ao adicionar novos tipos de gráfico ao componentRegistry.

---

## [2026-04-09] — CONVENCÃO
**Aprendi:** componentRegistry expõe getTypes() e getEntry() como interface pública.
**Contexto:** O agent.ts usa componentRegistry.getTypes() para listar os tipos
disponíveis no prompt do Gemini, garantindo que a IA nunca sugira um componente
inexistente. Ao adicionar novo gráfico, sempre registrar no componentRegistry.
**Aplicar quando:** Sempre que criar um novo componente Remotion de gráfico.

---

## [2026-04-09] — CONVENCÃO
**Aprendi:** sseService.broadcast(data: object) é o método correto para eventos SSE.
**Contexto:** O sseService não expõe send() nem emit() — apenas broadcast().
Eventos padrão do sistema: processing_start | status | render_complete | error.
Sempre incluir jobId e source ('image' | 'table') nos payloads.
**Aplicar quando:** Ao criar novas rotas que precisam notificar o frontend em tempo real.

---

## [2026-04-09] — BUG CORRIGIDO
**Aprendi:** O codec do Remotion renderMedia() deve ser "h264", não "h244".
**Contexto:** Typo crítico que derruba silenciosamente o render. O codec "h244"
não existe — o Remotion rejeita com erro de runtime, não de compilação.
**Aplicar quando:** Ao configurar qualquer nova chamada a renderMedia().

---

## [2026-04-09] 🎓 APRENDIZADO — INTEGRIDADE DE DADOS & LAYOUT
**Aprendi:** Dados categóricos e escalas devem ser preservados sem manipulação artificial.
**Contexto:** 
1. **Truncamento Proibido:** Labels de categorias (eixo X ou Y) NUNCA devem ser truncados com `.slice()` ou `...`. Se o texto for longo, o layout deve se adaptar (ex: `labelAreaWidth` dinâmico).
2. **Escala Y Real:** Remover inflação artificial da escala (`* 1.15`). O gráfico deve terminar exatamente no valor máximo ou em um round-number amigável próximo, sem espaço vazio arbitrário no topo.
3. **Fallbacks de Título:** Nomes de arquivos devem ser sanitizados para Title Case (ex: `vendas-2024.png` -> `Vendas 2024`) antes de serem usados como título.
**Aplicar quando:** No `buildInputProps` do servidor e no cálculo de `maxVal` / renderização de labels em qualquer componente de gráfico.

---

## [2026-04-09] 🎓 APRENDIZADO — SUBTÍTULOS REAIS
**Aprendi:** NUNCA inventar metadados que não existam no gráfico original.
**Contexto:** O Agente estava gerando subtítulos automáticos como "5 registros · tema dark". Isso deve ser evitado se o arquivo original não possuir um subtítulo explícito. Preferir string vazia para manter a neutralidade e proximidade com o print original.
**Aplicar quando:** Na lógica de montagem de props no servidor.


