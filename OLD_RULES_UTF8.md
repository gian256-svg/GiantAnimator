# Training Log ÔÇö GiantAnimator
> Fonte ├║nica de verdade do conhecimento do agente.
> Atualizado sempre que algo novo ├® ensinado ou uma regra ├® revisada.
> **Hierarquia ativa:** Filosofia 4K > Padr├Áes Multi-Fonte (Mango / Lychee / Papaya) > Dados Originais

---
### REGRA PERMANENTE ÔÇö SISTEMA DE TEMAS (OBRIGAT├ôRIA)
Data: 2026-04-14
Escopo: TODOS os componentes Remotion do GiantAnimator

**Regra**: Componentes NUNCA devem usar `Theme.colors.background` ou `Theme.chartColors` diretamente.
**API obrigat├│ria**: `import { resolveTheme } from '../theme'` ÔåÆ `const T = resolveTheme(theme ?? 'dark')`

Os 6 temas suportados (`dark`, `neon`, `ocean`, `sunset`, `minimal`, `corporate`) t├¬m identidades visuais 
completamente distintas definidas no `THEMES` map em `theme.ts`. A fun├º├úo `resolveTheme(theme)` ├® a ├║nica
fonte de verdade para cores, grid, eixos e backgrounds.

**Props obrigat├│rias em todo componente chart:**
- `theme?: string` ÔÇö string do tema (default: `'dark'`)
- `backgroundColor?: string` ÔÇö override opcional (fallback para `T.background`)
- `textColor?: string` ÔÇö override opcional (fallback para `T.text`)
- `colors?: string[]` ÔÇö override opcional (fallback para `T.colors`)

**PROIBIDO:**
- `backgroundColor = Theme.colors.background` (hardcode dark)
- `colors = Theme.chartColors` (hardcode paleta dark)
- Qualquer cor inline que n├úo seja via `T.*` ou prop expl├¡cita

---
### REGRA PERMANENTE ÔÇö ROTEAMENTO DE COMPONENTES NO Root.tsx (OBRIGAT├ôRIA)
Data: 2026-04-14

**Problema hist├│rico**: O `Root.tsx` importava `./components/PieChart` (vers├úo antiga) em vez de `./charts/PieChart` (vers├úo atual). Toda reescrita de um componente PRECISA ser acompanhada de atualiza├º├úo do import no `Root.tsx`.

**Regra**: Ao reescrever ou criar um novo componente chart em `src/charts/`, verificar SEMPRE se o `Root.tsx` est├í importando do path correto. Nunca presumir que o import j├í est├í atualizado.

---
### REGRA PERMANENTE ÔÇö TIPOGRAFIA EM PIECHART e COMPONENTES CIRCULARES (OBRIGAT├ôRIA)
Data: 2026-04-14

**Problema hist├│rico**: PieChart usava `fontSize = 28 * sc` para t├¡tulo e `11 * sc` para legenda ÔÇö valores muito pequenos que tornavam os textos invis├¡veis.

**Tamanhos corretos (base 720p, sc = min(w/1280, h/720)):**
| Elemento       | Multiplicador | Resultado 720p | Notas |
|---------------|---------------|----------------|-------|
| T├¡tulo         | `42 * sc`     | 42px           | +50% do antigo |
| Subt├¡tulo      | `22 * sc`     | 22px           | +65% do antigo |
| Label legenda  | `19 * sc`     | 19px           | +65% do antigo |
| Valor legenda  | `17 * sc`     | 17px           | +55% do antigo |
| Valor s/fatia  | `17 * sc`     | 17px           | com drop-shadow |
| Valor c/guia   | `15 * sc`     | 15px           | fora de fatias pequenas |

**NUNCA** usar valores fixos em pixels. Sempre multiplicar por `sc`.

---
### REGRA PERMANENTE ÔÇö SAFE ZONE E LEGENDA SEM SOBREPOSI├ç├âO (OBRIGAT├ôRIA)
Data: 2026-04-14

**Problema hist├│rico**: Legenda do PieChart usava espa├ºamento fixo (`i * 40 * scale`) sem levar em conta o n├║mero de itens, causando sobreposi├º├úo. O valor era posicionado em `width - 12px` sem verificar colis├úo com o label.

**Regra do layout de legenda (PieChart e similares):**
1. `SAFE_PAD_X = width * 0.05` ÔÇö margem lateral m├¡nima (5%)
2. `SAFE_PAD_Y = height * 0.07` ÔÇö margem superior/inferior m├¡nima (7%)
3. `ITEM_H = max(LEGEND_LABEL + gap + 4, SWATCH + gap)` ÔÇö altura din├ómica por item
4. Label truncado com `ÔÇª` para caber em `VALUE_X - LABEL_X - 50*sc` px
5. Valor alinhado em `VALUE_X = width - SAFE_PAD_X` (nunca na margem crua)
6. **Label dentro da fatia** quando `pct >= 8%` + `progress > 0.8`; fora com linha guia quando menor

---
Data: 2026-04-14
Escopo: TODOS os componentes e interfaces do GiantAnimator

Todo trabalho visual DEVE seguir os padr├Áes do UI/UX Pro Max:
1. **├ìcones**: PROIBIDO uso de emojis como ├¡cones. Usar apenas SVG (Lucide / Heroicons).
2. **Intera├º├úo**: Todo elemento clic├ível DEVE ter `cursor: pointer`.
3. **Transi├º├Áes**: Transi├º├Áes de hover devem ter entre 150-300ms (ex: `transition: all 0.2s ease`).
4. **Estabilidade**: PROIBIDO usar `transform: scale()` que cause deslocamento de layout (layout shift) no hover.
5. **Contraste**: Texto em Light Mode deve ter contraste m├¡nimo de 4.5:1 (Slate-900 para corpo, Slate-600 para muted).
6. **Responsividade**: Validar em 4 breakpoints: 375px, 768px, 1024px, 1440px.
7. **Acessibilidade**: Focar estados vis├¡veis (`:focus`) e respeitar `prefers-reduced-motion`.

---
### FLUXO OBRIGAT├ôRIO ÔÇö GERA├ç├âO DE GR├üFICOS
Data: 2026-04-14

Sempre que gerar um novo tipo de gr├ífico ou refatorar um existente, o Agente DEVE:
1. Executar `python .agent/skills/ui-ux-pro-max/scripts/search.py "<tipo_do_grafico> <estilo>" --design-system` para obter recomenda├º├Áes.
2. Aplicar a paleta de cores (Heuristic Palettes) e tipografia sugeridas no `theme.ts` ou via props.
3. Seguir os Atos de Anima├º├úo do DNA Mango (Ato 1: Estrutura, Ato 2: Dados, Ato 3: Labels).

---
### REGRA PERMANENTE ÔÇö Anima├º├úo Fluida (obrigat├│ria em todos os componentes)
Data: 2026-04-09
Escopo: TODOS os componentes presentes e futuros do GiantAnimator

OBRIGAT├ôRIO em qualquer componente novo ou editado:
1. spring() sempre com { damping: 80, stiffness: 200, overshoot_clamp: true }
2. Nunca usar Easing.linear em anima├º├Áes visuais
3. count/progress sempre clampado com stableCount
4. Stagger de elementos individuais: i * 3 frames (m├íx i * 5)
5. Delay de entrada do componente: entre 10-20 frames

PROIBIDO:
- spring() sem overshoot_clamp
- Math.floor() para calcular contagem de elementos vis├¡veis
- Interpola├º├úo linear em transi├º├Áes visuais
- progress sem clamping no estado final

---
### REGRA PERMANENTE ÔÇö Valida├º├úo Visual via Stills
Data: 2026-04-09
Sempre que gerar um `remotion still` para valida├º├úo, o frame deve ser >= 30.
F├│rmula: `frameVal = (numElementos * framesStagger) + 20`
Tabela de refer├¬ncia:
- Bar/Stacked/Pie/Donut: --frame=30
- Line/Area/Radar/Waterfall: --frame=45
- Scatter/Bubble: --frame=60

---
### [2026-04-09] Padr├úo de Anima├º├úo Definitivo
- spring({ damping: 80, stiffness: 200, overshoot_clamp: true })
- count = Math.ceil(progress * total), clampado ao m├íximo
- stableCount: for├ºa valor final quando progress >= 1
- Aplicado em: LineChart Ô£à

---
## [2026-04-09] Gauntlet T03 (StackedBarChart) ÔÇö APROVADO

### Resultado
3/3 modelos com 100% de fidelidade.
Primeiro teste com m├║ltiplas s├®ries ÔÇö pipeline manteve precis├úo total.

### Modelos Testados
- modelo_1.png ÔåÆ Vendas por Canal e Trimestre ÔåÆ 100% Ô£à
- modelo_2.png ÔåÆ Budget vs Realizado por ├ürea ÔåÆ 100% Ô£à
- modelo_3.png ÔåÆ Uso de Recursos por Servidor ÔåÆ 100% Ô£à

### Configura├º├úo Validada
- Modelo de vis├úo: gemini-2.5-flash-lite (GEMINI_MODEL_VISION)
- Componente: StackedBarChart
- S├®ries m├║ltiplas: at├® 3 s├®ries extra├¡das com 100% de precis├úo

---
## [2026-04-09] Gauntlet T02 (VerticalBarChart) ÔÇö APROVADO

### Resultado
3/3 modelos com 100% de fidelidade.

### Modelos Testados
- modelo_1.png ÔåÆ Receita Mensal 2024 ÔåÆ 100% Ô£à
- modelo_2.png ÔåÆ NPS por Departamento ÔåÆ 100% Ô£à
- modelo_3.png ÔåÆ Consumo de Energia (KWh) ÔåÆ 100% Ô£à

### Configura├º├úo Validada
- Modelo de vis├úo: gemini-2.5-flash-lite (GEMINI_MODEL_VISION)
- Componente: BarChart (vertical)
- Delay entre testes: 10s (rate limit safety)

---
## [2026-04-09] Gauntlet T01 (HorizontalBarChart) ÔÇö APROVADO

### Resultado
3/3 modelos com 100% de fidelidade.
Pipeline de vis├úo + renderiza├º├úo totalmente est├ível.

### Modelos Testados
- modelo_1.png ÔåÆ Drivers de Efici├¬ncia ÔåÆ 100% Ô£à
- modelo_2.png ÔåÆ Vendas por Regi├úo 2024 ÔåÆ 100% Ô£à
- modelo_3.png ÔåÆ Market Share Big Tech 2024 ÔåÆ 100% Ô£à

### Configura├º├úo Validada
- Modelo de vis├úo: gemini-2.5-flash-lite (GEMINI_MODEL_VISION)
- Componente: HorizontalBarChart
- SDK: @google/genai v1.48.0

---
## [2026-04-09] Bug Fix ÔÇö visionService.ts ignorava GEMINI_MODEL_VISION

### Problema
O `visionService.ts` importava `GEMINI_MODEL` ao inv├®s de
`GEMINI_MODEL_VISION`, fazendo com que todas as altera├º├Áes
na constante de vis├úo fossem ignoradas silenciosamente.
O modelo real usado era sempre o de texto, n├úo o de vis├úo.

### Root Cause
Import incorreto na linha 6 de `server/visionService.ts`.
A constante `GEMINI_MODEL_VISION` existia em `constants.ts`
mas nunca havia sido referenciada no servi├ºo de vis├úo.

### Fix Aplicado
- Import: `GEMINI_MODEL` ÔåÆ `GEMINI_MODEL_VISION`
- Chamada SDK: `GEMINI_MODEL` ÔåÆ `GEMINI_MODEL_VISION`
- Arquivo: `server/visionService.ts`

### Resultado
Fidelidade 100% no modelo_1.png (bar_h) ap├│s corre├º├úo.

### Li├º├úo
Sempre verificar se uma constante de configura├º├úo est├í
de fato sendo IMPORTADA e USADA no servi├ºo correto,
n├úo apenas definida em constants.ts.

---

## HIERARQUIA DE DECIS├âO

| Prioridade | Camada | Dom├¡nio |
|------------|--------|---------|
| 1 | Filosofia 4K UHD | Resolu├º├úo, safe zones, aproveitamento de ├írea |
| 2 | DNA Mango / Lychee / Papaya | Anima├º├Áes, easings, stagger, tipografia |
| 3 | Dados Originais | Valores, labels, t├¡tulos (fidelidade absoluta) |

---

## [2026-04-06] INFRAESTRUTURA

**Regra:** Sempre usar `--transpile-only` no ts-node para iniciar o servidor rapidamente.
Sem esse flag, o ts-node faz verifica├º├úo completa de tipos e pode falhar ou demorar.
**Aplicar quando:** Scripts de start, INICIAR.bat, comandos npm.

---

## [2026-04-06] DETEC├ç├âO DE ARQUIVOS (WINDOWS)

**Regra:** No Windows, usar 3 camadas de detec├º├úo: `chokidar` + `fs.watch` + polling `setInterval` a cada 5s.
O chokidar sozinho n├úo ├® suficiente ÔÇö arquivos no `input/` podem n├úo ser detectados.
**Aplicar quando:** Qualquer modifica├º├úo no sistema de watching de arquivos.

---

## [2026-04-06] INICIALIZA├ç├âO (INICIAR.bat)

**Regra:** Verificar nesta ordem: Node.js instalado ÔåÆ ts-node existe ÔåÆ .env existe ÔåÆ porta livre ÔåÆ instalar deps ÔåÆ iniciar servidor ÔåÆ health check com timeout de 60s.
**Aplicar quando:** Qualquer altera├º├úo no INICIAR.bat ou processo de boot.

---

## [2026-04-06] ESTRUTURA DE PASTAS

**Regra:** A pasta `shared/` fica **dentro** do reposit├│rio GiantAnimator (confirmado em 2026-04-09).
Caminhos: `input/`, `output/`, `shared/references/`.
**Aplicar quando:** Qualquer refer├¬ncia a input/, output/ ou processed/.

---

## [2026-04-06] ARQUITETURA DE COMPONENTES REMOTION

**Regra:** O `Root.tsx` usa Named Imports ÔÇö TODOS os componentes devem usar `export const NomeDoComponente`.
NUNCA usar `export default` em componentes Remotion.
**Aplicar quando:** Criar ou editar qualquer componente em `remotion-project/src/`.

---

## [2026-04-06] REMOTION API v4.0

**Regra:** `spring()` retorna o valor diretamente (`number`). N├úo existe mais `.value`.
Usar `spring().value` causa erro silencioso (NaN/undefined).
**Aplicar quando:** Qualquer anima├º├úo com `spring()`, `interpolate()` ou `useCurrentFrame()`.

---

## [2026-04-06] TEMA DE CORES

**Regra:** As cores dos gr├íficos ficam em `Theme.colors.chartColors[0]`, `[1]`, etc.
N├úo existe `THEME.colors.series1` ou estrutura similar.
**Fonte ├║nica:** `remotion-project/src/theme.ts` ÔÇö n├úo duplicar em nenhum outro lugar.
**Aplicar quando:** Qualquer componente que use cores de s├®ries / barras / linhas.

---

## [2026-04-06] REGRAS DE OURO DA CALIBRA├ç├âO

| Regra | Detalhe |
|-------|---------|
| **DADOS** | Valores, labels e porcentagens 100% id├¬nticos ao original. Nunca inventar, arredondar ou omitir. |
| **FONTES** | Sempre usar a mesma fonte ou similar dispon├¡vel. Fonte complementar apenas para s├¡mbolos especiais. |
| **TEXTO** | Title Case (primeira letra mai├║scula por palavra). Exce├º├Áes: preposi├º├Áes e artigos curtos. |
| **OVERLAP** | Proibido overlap n├úo intencional. Permitido: linhas cruzando em LineChart, dados dentro de Pie/Donut. |
| **SAFE ZONE** | Todos os elementos dentro da safe zone (128px lateral, 160px topo, 80px rodap├®). |
| **DOUBLE CHECK** | Todo gr├ífico passa pelo checklist antes do render. S├│ renderiza se STATUS = APROVADO. |
| **CORRE├ç├âO** | Erros corrigidos automaticamente quando poss├¡vel. Ap├│s 2 tentativas sem sucesso: reportar ao usu├írio. |
| **ASSETS** | Liberdade total para baixar logos, ├¡cones, fontes. Salvar em `shared/references/{tipo}/`. |

---

## [2026-04-06] CICLOS DE CALIBRA├ç├âO INICIAIS

| Ciclo | Componente | Aprendizado-chave |
|-------|-----------|-------------------|
| 1 | BarChart Vertical | Spring animation + remo├º├úo de overflow-hidden para efeito el├ístico |
| 2 | LineChart | `stroke-dashoffset` + `pathLength` para compatibilidade v4.0 |
| 3 | HorizontalBarChart | Padding esquerdo obrigat├│rio de 250px para labels de ranking |
| 4 | AreaChart | `<path>` fechado + gradiente de profundidade |
| 5 | PieChart | `(value / total) * 360` para ├óngulos. Efeito Donut via `innerRadius` |
| 6 | DonutChart | Centro sempre com informa├º├úo (Total ou Destaque) |
| 7 | ScatterChart | Opacidade reduzida para Heat zones de densidade |
| 8 | RadarChart | Trigonometria sin/cos por n├║mero de eixos. Anima├º├úo s├¡ncrona dos v├®rtices |
| 9 | BubbleChart | 3 dimens├Áes (X, Y, Z). Anima├º├úo individual por bolha |
| 10 | HeatmapChart | Color Lerp. Anima├º├úo espiral > linha-a-linha |
| 11 | TreemapChart | Algoritmo Squarified. Pai surge antes dos filhos |
| 12 | GanttChart | Sidebar (labels) + Canvas (tempo). Scroll sincronizado |
| 13 | FunnelChart | Trap├®zios cont├¡guos. Anima├º├úo top-down |
| 14 | Lote Anal├¡tico | Waterfall, Sankey, BoxPlot, Candle, Gauge |
| 15 | Lote Distribui├º├úo | Polar, Bullet, Timeline, Network, Histogram, Stacked, Grouped |
| 16 | Lote Complexo | Mekko, Chord, Sunburst, Pareto, Sparkline |

---

## [2026-04-07] CICLOS DE VALIDA├ç├âO AVAN├çADA

| Ciclo | Componente | Aprendizado-chave |
|-------|-----------|-------------------|
| 17 | AreaChart | `clipPath` animado para wave-reveal. `spring(14, 60)` para consist├¬ncia el├ística |
| 18 | MultiLineChart | Stagger individual de 8 frames entre s├®ries. `evolvePath` + surgimento sincronizado de dots |
| 19 | Donut + Pie | Arcos SVG manuais (`M/A/L/Z`) mais precisos que `stroke-dasharray`. Stagger de 6 frames |
| 20 | ScatterPlot | Escalas num├®ricas cont├¡nuas mapeadas manualmente. Rain-pop com stagger de 3 frames. Opacidade 0.75 |
| 21 | WaterfallChart | Acumula├º├úo rigorosa. Barra de Total parte do zero. Linhas pontilhadas de conex├úo |
| 22 | CandlestickChart | Anima├º├úo Wick antes do Body. Fundo escuro `#020617` obrigat├│rio |
| 23 | GaugeChart | Semic├¡rculo -90┬░ a +90┬░. Needle-swing com damping 12. Zonas via SVG arc |
| 24 | BubbleChart | Raio via `Math.sqrt` (├írea proporcional). Bounce damping 10. Labels s├│ com raio > 20px |
| 25 | StackedBarChart | Stagger duplo: entre categorias (4f) e entre segmentos (2f) |
| 26 | GroupedBarChart | Espa├ºamento entre grupos 20% > interno 5%. Stagger de 3 frames por grupo |
| 27 | RadarChart | Radial-stretch s├¡ncrono. Preenchimento 30% opacidade. At├® 3 s├®ries comparativas |
| 28 | FunnelChart | Trap├®zios com base = topo do pr├│ximo. Drop-off calculado dinamicamente |
| 29 | SankeyChart | Motor de layout personalizado. Bezier c├║bico. Nodes (Fade) ÔåÆ Links (Stroke Growth) |
| 30 | TreemapChart | Squarified algorithm. Nested-zoom do centro. Labels condicionais por ├írea |
| 31 | HeatmapChart | Escala divergente (DeepBlue ÔåÆ White ÔåÆ DeepGold). Labels inclinados no eixo X |
| 32 | BulletChart | Camadas: faixas qualitativas ÔåÆ barra performance ÔåÆ marcador de meta |
| 33 | PolarChart | Arcos SVG radiais. Anima├º├úo radial-growth com stagger espiral |
| 34 | BoxPlotChart | Whiskers primeiro, depois boxes, depois outliers (pontos vermelhos por ├║ltimo) |
| 35 | SparklineChart | Ultra-minimalista, sem eixos. Wave-reveal + ponto de destaque no ├║ltimo valor |
| 36 | NetworkChart | Posi├º├Áes predefinidas. Nodes (Pop) ÔåÆ Edges (Stroke Growth). Markers SVG para dire├º├úo |
| 37 | HistogramChart | Barras cont├¡guas. Bins din├ómicos. Curva KDE sobreposta |
| 38 | MekkoChart | `totalMarketValue` para larguras. Anima├º├úo bottom-to-top com stagger de 8f |
| 39 | ChordChart | ├éngulos de arco meticulosos. Bezier quadr├ítico (Q). Radial-twist (arcos ÔåÆ ribbons) |
| 40 | SunburstChart | Implementa├º├úo recursiva de ├óngulos. Center-out n├¡vel a n├¡vel. Brilho crescente por n├¡vel |
| 41 | ParetoChart | Eixos Y duplos. Ordena├º├úo autom├ítica obrigat├│ria. Barras ÔåÆ Linha acumulada. Destaque 80% |
| 42 | ComparativeBar | Escala sim├®trica central. Labels centralizados. Outward growth do eixo central |
| 43 | BarChartRace | Posi├º├úo Y recalculada por frame. Contadores animados. Escala X din├ómica |

---

## [v0.91] LABELS DENTRO DE FATIAS (PIE / DONUT)

Quando a refer├¬ncia mostrar percentuais ou labels DENTRO das fatias, posicionar no centr├│ide (raio ~65%):

```ts
const midAngle = startAngle + sweepAngle / 2;
const x = cx + radius * 0.65 * Math.cos(midAngle);
const y = cy + radius * 0.65 * Math.sin(midAngle);
```

- Cor do texto: branco, negrito
- Fidelidade visual ├á refer├¬ncia tem prioridade sobre "limpeza" do layout
- Se a refer├¬ncia mostrar sobreposi├º├úo intencional (label sobre borda), replicar esse comportamento

---

## [v0.92] PAINEL DE PROPRIEDADES (UI)

Categorias em accordion:
- ­ƒôè Dados (valores, labels, t├¡tulo)
- ­ƒÄ¿ Cores (color pickers nativos `<input type="color">`, gerados dinamicamente por `data.length`)
- ­ƒôÉ Dimens├Áes e Posi├º├úo (X, Y, Width, Height, Scale slider)
- Ô£Å´©Å Tipografia (fonte, tamanho, peso)
- ­ƒÄ¼ Anima├º├úo (dura├º├úo, delay, easing, FPS)
- ­ƒû╝´©Å Apar├¬ncia (toggles para legenda, grid, eixos)

**Padr├Áes:**
- Debounce 300ms em todos os campos
- Accordion com estado open/closed por categoria
- Bot├úo "Copiar props como JSON" no topo
- Bot├úo "Resetar para padr├úo" por categoria
- Interface `EditableProps` em `server/types/editableProps.ts`
- Props: `elementColors`, `x`, `y`, `width`, `height`, `scale`

---

## [v0.93] COLOR PICKERS DIN├éMICOS + POSI├ç├âO/TAMANHO

- Color pickers gerados dinamicamente com base em `data.length`
- Atualiza `colors[]` na posi├º├úo correta com debounce 300ms
- Label usa nome do item se dispon├¡vel, sen├úo "Item N"
- Props `elementColors`, `x`, `y`, `width`, `height`, `scale` adicionados ├ás interfaces dos componentes
- Container principal usa `position: absolute` + `transform: scale`

---

## [v0.93-fix] BUGFIX: PAINEL + MARGEM DE SEGURAN├çA DO T├ìTULO

**Corrigido:**
- Grupos "­ƒôÉ Posi├º├úo e Tamanho" e "­ƒÄ¿ Cores do Gr├ífico" agora aparecem corretamente no painel
- T├¡tulo do PieChart e HorizontalBarChart corrigido para respeitar margem de seguran├ºa

**Regra registrada ÔÇö t├¡tulos SEMPRE devem ter:**
- `maxWidth: 3400px` (para frame 3840px)
- `paddingLeft / paddingRight: m├¡nimo 80px`
- `textAlign: center`
- `wordBreak: break-word`
- Nunca alterar cor / fonte / peso ÔÇö apenas layout

---

## [v0.94] LINECHART ÔÇö PADR├âO VISUAL T├ëCNICO/FINANCEIRO

```
fundo:    #f8f9fa ou #ffffff
linha:    strokeWidth 1.5ÔÇô2px, cor #1a5276
grid:     #e0e0e0, horizontal obrigat├│rio
eixo Y:   valores num├®ricos reais ÔÇö escala autom├ítica (min - 5% / max + 5%, NUNCA for├ºa zero)
eixo X:   labels de categoria / data
dots:     prop showDots (desligado por padr├úo)
curva:    prop curveType (bezier ou linear)
padding:  top 40 / bottom 60 / left 70 / right 60
anima├º├úo: clipPath reveal (├║nico polyline)
```

**Regra global adicionada:** Todos os gr├íficos devem ter `durationInFrames: 600` (20s a 30fps).
Anima├º├úo completa e gr├ífico permanece vis├¡vel e est├ítico at├® o fim.

---

## [v0.95] HOTFIX CR├ìTICO: LINECHART (BUG DE M├ÜLTIPLOS PATHS)

**Root cause:** LineChart gerava m├║ltiplos paths SVG sobrepostos durante anima├º├úo.

**Solu├º├úo:**
- T├®cnica de anima├º├úo: `clipPath` com `<rect>` de largura crescente
- Escala Y: `yMin = dataMin * 0.9`, `yMax = dataMax * 1.1` ÔÇö nunca for├ºa zero
- Um ├║nico `<polyline>` para a linha ÔÇö sem duplica├º├úo

**Regra t├®cnica permanente:**
> Anima├º├Áes de linha em SVG devem usar `clipPath`, N├âO `stroke-dashoffset` complexo.
> `clipPath` com `<rect width={revealWidth}>` ├® seguro e sem bugs no Remotion.

---

## [v0.97] HOTFIX: DURA├ç├âO 600F + SCALE FIX + CLIPPATH ID ├ÜNICO

**Root causes identificados:**
- `app.js` linha 196: `durationInFrames` hardcoded como `150`
- `renderService.ts`: passava `durationInFrames` via `--props` sem valida├º├úo

**Corre├º├Áes aplicadas:**
1. `app.js`: `durationInFrames: 150` ÔåÆ `600`
2. `renderService.ts`: valida├º├úo antes do render (for├ºa m├¡nimo 600)
3. `LineChart`: `clipPath` id agora ├║nico por inst├óncia

**Regras permanentes:**
- NUNCA usar `durationInFrames < 600` em nenhum arquivo
- SEMPRE validar `durationInFrames` no `renderService` antes de renderizar
- `clipPath` IDs SEMPRE ├║nicos ÔÇö nunca string fixa `"reveal"`
- `transform: scale()` no LineChart: **PROIBIDO**

---

## [v0.98] HOTFIX ARQUITETURAL: durationInFrames NA COMPOSITION

**Root cause definitivo:**
`durationInFrames` dentro de `inputProps` ├® uma prop React ÔÇö n├úo controla dura├º├úo do v├¡deo.
A dura├º├úo real ├® controlada por `composition.durationInFrames` no `renderMedia`.

**Corre├º├úo:**
```ts
// renderService.ts ÔÇö OBRIGAT├ôRIO antes do renderMedia
composition.durationInFrames = 600;
```

**Regra permanente cr├¡tica:**
> `composition.durationInFrames = 600` SEMPRE antes do `renderMedia`.
> NUNCA tentar controlar dura├º├úo do v├¡deo via `inputProps` ÔÇö n├úo funciona.

---

## [v0.99] REGRAS GLOBAIS: TEXTOS + ANIMATION_FRAMES + TEMA

**Problemas corrigidos:**
- Textos de eixo ileg├¡veis: cores claras como padr├úo foram banidas
- Anima├º├úo termina em 4s (120 frames) em TODOS os gr├íficos
- Eixo Y de barras ancorado em 0 quando todos os valores s├úo positivos

**Regras permanentes:**
- `fill` de textos de eixo SEMPRE `Theme.colors.text` ÔÇö nunca vari├ível de prop
- `ANIMATION_FRAMES = 120` em TODOS os componentes
- Todo novo componente DEVE importar de `theme.ts`
- NUNCA usar cores claras como padr├úo para qualquer texto

---

## [2026-04-07] REGRAS T├ëCNICAS REMOTION / SVG

| Regra | Detalhe |
|-------|---------|
| `clipPath` para anima├º├úo de linha | Usar `<rect width={revealWidth}>` ÔÇö nunca `strokeDashoffset` com muitos pontos |
| `clipPath` IDs ├║nicos | Sempre ├║nicos por inst├óncia (ex: `clip-${Math.random()}`). Nunca string fixa `"reveal"` |
| `transform: scale()` em LineChart | **PROIBIDO** ÔÇö causa artefatos visuais |
| `durationInFrames` no render | Via `composition.durationInFrames = 600` no `renderService.ts`. NUNCA via `inputProps` |
| `export default` em componentes | **PROIBIDO** ÔÇö Root.tsx usa Named Imports |
| `spring().value` | **PROIBIDO** ÔÇö v4.0 retorna number diretamente |

---

## [2026-04-07] REGRA GLOBAL: DURA├ç├âO

- `durationInFrames` = **600** em TODOS os componentes e no `Root.tsx`
- `composition.durationInFrames = 600` for├ºado no `renderService.ts` antes do `renderMedia`
- Anima├º├úo de entrada termina em **120 frames (4s)** ÔÇö gr├ífico permanece est├ítico e leg├¡vel at├® o fim
- NUNCA usar `durationInFrames < 600` em nenhum arquivo do projeto

---

## [2026-04-08] FILOSOFIA 4K UHD (ATIVA)

Autonomia criativa total sobre design. Apenas dados, labels, t├¡tulos, tipo e ordem v├¬m da refer├¬ncia.
O agente eleva o design ao padr├úo 4K Premium / Mango / Lychee.

### Canvas e Safe Zones

| Medida | Valor |
|--------|-------|
| Resolu├º├úo | 3840 ├ù 2160 |
| Safe zone lateral | 128px (cada lado) |
| Safe zone topo | 160px |
| Safe zone rodap├® | 80px |
| Largura ├║til | 3584px |
| Altura ├║til | 1920px |
| Centro X (cx) | 1920px |
| Centro Y (cy) | 1120px |

### C├ílculos obrigat├│rios por tipo

```ts
// Gr├íficos circulares (Pie, Donut, Radar, Polar, Gauge)
const legendWidth = usableWidth * 0.25;  // 896px
const chartArea   = usableWidth * 0.75;  // 2688px
const radius      = Math.min(chartArea, usableHeight) * 0.42;

// Gr├íficos cartesianos (Bar, Line, Area, Scatter, Histogram)
const chartWidth  = usableWidth;          // 3584px
const chartHeight = usableHeight * 0.85;  // 1632px

// Gr├íficos de fluxo (Sankey, Funnel, Chord)
const chartWidth  = usableWidth;   // 3584px
const chartHeight = usableHeight;  // 1920px
```

### Regras de Design (D1ÔÇôD10)

| # | Regra |
|---|-------|
| D1 | Fundo premium escuro (`#0f1117`) obrigat├│rio |
| D2 | Hierarquia visual: Background ÔåÆ T├¡tulo ÔåÆ Eixos ÔåÆ Dados ÔåÆ Labels |
| D3 | Gridlines com opacidade Ôëñ 0.06 (nunca competem com dados) |
| D4 | Tipografia escalada 4K: t├¡tulo 72px, eixos 30px, labels 36px |
| D5 | Cores com prop├│sito: `chartColors[]` do Theme, sem cores aleat├│rias |
| D6 | Gradiente em barras e ├íreas para percep├º├úo de profundidade |
| D7 | Bordas arredondadas (`borderRadius`) em elementos retangulares |
| D8 | Label inteligente: interno se espa├ºo ÔëÑ threshold, externo caso contr├írio |
| D9 | Anima├º├úo em 3 atos: Estrutura (0ÔÇô30f) ÔåÆ Dados (30ÔÇô150f) ÔåÆ Labels (150ÔÇô210f) |
| D10 | Sem elementos desnecess├írios: remover o que n├úo agrega informa├º├úo |

### Checklist pr├®-render obrigat├│rio

1. [ ] O gr├ífico ocupa ÔëÑ 80% da ├írea ├║til?
2. [ ] Nenhum tamanho hardcoded foi usado?
3. [ ] Legenda fora do gr├ífico e dentro da safe zone?
4. [ ] Labels leg├¡veis e proporcionais (m├¡nimo 28px)?
5. [ ] Centro calculado dinamicamente (`cx` e `cy` do Theme)?
6. [ ] `composition.durationInFrames = 600` no renderService?
7. [ ] Todos os IDs de `clipPath` s├úo ├║nicos?
8. [ ] STATUS = APROVADO?

---

## [2026-04-08] DNA MANGO ÔÇö ANIMA├ç├òES

### Padr├Áes consolidados

| Padr├úo | Valor |
|--------|-------|
| Stagger entre elementos | 2 frames (Ôëê 50ms @ 30fps) |
| Easing padr├úo | `cubic-bezier(0.1, 0, 0.1, 1)` |
| Easing com overshoot | `backOut` (bolhas, pontos, dots) |
| Eixos / grid opacity | 0.15 |
| Labels m├¡nimos | 28px |
| Dura├º├úo de entrada (Ato 2) | 120 frames |

### Hierarquia de entrada (obrigat├│ria)

```
Ato 1 (0ÔÇô30f):   Background ÔåÆ T├¡tulo ÔåÆ Eixos ÔåÆ Grid
Ato 2 (30ÔÇô150f): Dados (barras, linhas, fatias, pontos)
Ato 3 (150ÔÇô210f): Labels ÔåÆ Legenda ÔåÆ Anota├º├Áes
```

### Sequ├¬ncias por tipo

| Tipo | Sequ├¬ncia de anima├º├úo |
|------|-----------------------|
| Bar / HorizontalBar | Ease-out 600ms, stagger 50ms, gradientes, eixos ghost |
| Line / MultiLine | ClipPath reveal ÔåÆ dots surgem AP├ôS a linha passar por eles |
| Area | Preenchimento 0.25 opacidade, revela├º├úo com curva |
| Pie / Donut | Expans├úo do centro ÔåÆ fatias radialmente ÔåÆ legenda slide-in |
| Scatter | Rain-pop: scale 0ÔåÆ1 com stagger aleat├│rio |
| Waterfall | Linhas pontilhadas entre topo/base de barras adjacentes |
| Candlestick | Wick primeiro (4f delay) ÔåÆ Body escala |
| Gauge | Needle-swing with recoil el├ístico (damping alto) |
| Bubble | Packed circles expandindo. Overshoot 10% |
| Stacked / Grouped | Stagger duplo: grupo ÔåÆ barra individual |
| Radar | Inflar conc├¬ntrico mantendo forma geom├®trica |
| Funnel | Top-down simulando fluxo |
| Sankey | `stroke-dashoffset` individual por link |
| Treemap | Pai expande ÔåÆ filhos nascem dentro |
| Heatmap | Stagger espiral (0.5f por c├®lula) |
| BoxPlot | Whiskers ÔåÆ Boxes ÔåÆ Outliers |
| Network | Bloom controlado: Nodes ÔåÆ Edges |
| Bar Race | Interpola├º├úo de posi├º├úo Y e valor num├®rico frame-a-frame |
| Comparative | Outward growth a partir do eixo central |

---

## [2026-04-08] PADR├òES MULTI-FONTE (Lychee / Papaya / Durian)

### Smart Scaling (Lychee)
Se valor m├¡nimo > 20% do m├íximo: eixo Y n├úo precisa come├ºar em zero.
Sempre usar `min = dataMin * 0.9` e `max = dataMax * 1.1` para evitar achatamento.

### Transi├º├úo Din├ómica (Papaya)
Dura├º├úo de transi├º├úo entre dados < dura├º├úo de entrada: `800ms` vs `1200ms`.

### Ghost Axis (Global)
Opacidade do eixo reduzida para `0.15` para n├úo competir com os dados.

### Overshoot (Durian Pattern)
Recoil de 10% em anima├º├Áes de entrada de c├¡rculos/bolhas aumenta percep├º├úo de vida.

---

## [2026-04-08] AN├üLISE PROFUNDA ÔÇö DNA MANGO (31 TIPOS)

### [1ÔÇô5] Bars, Lines, Area
- **Bar/HorizontalBar:** `ease-out` 600ms, stagger 50ms real, gradientes sutis, eixos ghost (opacidade 0.1)
  - *Implementar:* Incorporar eixos ghost e stagger de 50ms real na calibra├º├úo 4K
- **Line/MultiLine:** ClipPath reveal linear (Ato 1) ÔåÆ dots surgem via `backOut` AP├ôS a linha passar por eles
- **Area:** Preenchimento opacidade 0.25 interpolando com a curva. Revela├º├úo sequencial em Stacked

### [6ÔÇô7] Pie & Donut
- Expans├úo do centro (Ato 1) ÔåÆ revela├º├úo de fatias radialmente (Ato 2) ÔåÆ legenda slide-in
- `popProgress` do centro para cada fatia individualmente com overshoot

### [8ÔÇô12] Scatter, Waterfall, Financial, Gauge, Bubble
- **Scatter:** Rain-pop (scale 0ÔåÆ1) com stagger aleat├│rio
- **Waterfall:** Linhas pontilhadas rigorosas entre topo/base de barras adjacentes
- **Candlestick:** Wick-first (pavio antes do corpo, 4f delay)
- **Gauge:** Oscila├º├úo com recoil el├ístico (damping alto)
- **Bubble:** Packed circles expandindo gradualmente. Overshoot 10%

### [13ÔÇô18] Stacked, Grouped, Radar, Funnel, Sankey, Treemap
- **Stacked/Grouped:** Stagger em dois n├¡veis (grupo ÔåÆ barra individual)
- **Radar:** Inflar conc├¬ntrico mantendo propor├º├Áes do pol├¡gono
- **Funnel:** Top-down simulando fluxo de dados
- **Sankey:** `stroke-dashoffset` individual por link
- **Treemap:** Pai expande ÔåÆ filhos nascem dentro

### [19ÔÇô31] Heatmap ao Bar Race
- **Heatmap:** Stagger espiral ou diagonal (superior ao row-by-row)
- **BoxPlot:** Whiskers como "antenas" antes da mediana
- **Network:** Bloom (explos├úo controlada) force-directed
- **Bar Race:** Reordenamento com interpola├º├úo de posi├º├úo Y e valor num├®rico
- **Comparative:** Espelhamento com anima├º├úo do eixo central para fora

---

## [2026-04-08] AN├üLISE MULTI-FONTE (Lychee / Papaya / Durian)

### DNA de Configura├º├úo (Lychee)
- Uso extensivo do componente `graphic` para elementos customizados
- `animationDuration: 1000ms`, `animationEasing: cubicOut`
- **Diferencial:** Escala Y inteligente ÔÇö nunca ancora no zero se dados forem muito altos (`scale: true`)
- Refer├¬ncia absoluta para: Sankey, Chord, Sunburst ÔÇö requerem `nodes` + `links` com `stroke-dashoffset` individual

### DNA de Interatividade (Papaya)
- Tooltips persistentes e `dynamicAnimation` para transi├º├Áes fluidas (800ms)
- Gradientes lineares em barras e preenchimento `pattern` para ├íreas
- **Diferencial:** Sparklines ultra-leves incorporadas em tabelas/cards
- Refer├¬ncia para: Candlestick (layout OHLC, `wick` separado com delay 4f), Pareto (`axisPointer` sincronizado)

### DNA de Criatividade (Durian)
- Gr├íficos irregulares e experimentais
- Easing el├ístico agressivo para entrada de pontos

### Delta dos 31 Gr├íficos (Multi-Fonte)
- **Bar Race:** Interpola├º├úo `rank` frame-a-frame (padr├úo Mango + Lychee)
- **Pareto:** Unifica├º├úo de eixos com pointer sincronizado
- **Sankey/Chord/Sunburst:** Lychee como refer├¬ncia absoluta

---

## [2026-04-08] ESPECIALIZA├ç├âO 4K ÔÇö COMPONENTES BASE

### Especializa├º├úo 01: BarChart Vertical
- **Fonte:** Spring Overshooting + Smart Value Labels
- Bounce/assentamento (overshoot): chave da fluidez Mango
- Labels internos em barras grandes economizam espa├ºo
- Sobreposi├º├úo de ret├óngulos para arredondamento apenas no topo (SVG limpo)
- **Props adicionadas:** `highlightMax`, `highlightIndex`
- **Anima├º├úo:** Spring el├ístico (damping 10, mass 0.8) com stagger de 4 frames

### Especializa├º├úo 02: HorizontalBarChart
- **Fonte:** Dynamic Left Padding + Elastic Horizontal Growth
- `leftPadding` din├ómico baseado no `longestLabel` ÔÇö essencial para harmonia visual
- Separadores horizontais para dados densos
- `AbsoluteFill` garante preenchimento correto do canvas
- **Props adicionadas:** `showRanking`, `xAxisPosition`
- **Anima├º├úo:** Spring el├ístico (stiffness 90) com fade-in tardio do valor

### Especializa├º├úo 03: LineChart
- **Fonte:** ClipPath Reveal + Dot Seguidor Pulsante + Staggered Point Pop
- Dot seguidor durante o reveal eleva o dinamismo
- Anima├º├úo individual dos pontos (spring pop) SOMENTE ap├│s linha completa
- Escala Y adaptativa: 10% de padding evita achatamento visual
- **Props adicionadas:** `showDots`, `showArea`, `strokeWidth` (default 2px)
- **Anima├º├úo:** Reveal linear (0ÔÇô120f) ÔåÆ staggered spring pop dos dots

### Resumo 4K ÔÇö Todos os Componentes

| Componente | Melhoria-chave |
|------------|----------------|
| BarChart | Gradientes premium, labels internos inteligentes, padding adaptativo |
| HorizontalBarChart | `leftPadding` din├ómico por `longestLabel`. `showRanking`, `xAxisPosition` |
| LineChart | Linhas 4ÔÇô6px, ClipPath reveal, dot seguidor pulsante durante reveal |
| MultiLineChart | Stagger 8f entre s├®ries, dots surgem ap├│s linha passar |
| AreaChart | Gradiente 0.25, wave-reveal progressivo |
| Donut + Pie | Legenda lateral premium, `popProgress` do centro com overshoot |
| ScatterPlot | Rain-pop estoc├ístico, labels din├ómicos |
| WaterfallChart | Conectores pontilhados entre fluxos |
| CandlestickChart | Wicks refor├ºados, corpos com gradientes sem├ónticos |
| HeatmapChart | Grid alta densidade, stagger ultra-r├ípido (0.5f), interpola├º├úo t├®rmica |

---

## [2026-04-08] REGRAS DE TIPOGRAFIA

| Elemento | Tamanho | Peso | Cor |
|----------|---------|------|-----|
| T├¡tulo principal | 72px | 700 | `Theme.colors.text` |
| Subt├¡tulo | 40px | 400 | `Theme.colors.textMuted` |
| Label de dado | 36px | 600 | `Theme.colors.text` |
| Label de eixo | 30px | 400 | `Theme.colors.textMuted` |
| Legenda | 28px | 400 | `Theme.colors.text` |
| Timestamp / destaque | 56px | 800 | opacidade 0.15 |

- **Regra de contraste:** Algoritmo de lumin├óncia para labels sobre cores escuras vs claras
- **Regra de colis├úo:** NUNCA esconder labels por sobreposi├º├úo ÔÇö aplicar collision avoidance vertical ou leader lines
- **Fill de eixos:** SEMPRE `Theme.colors.text` diretamente ÔÇö nunca vari├ível de prop

---

## [2026-04-08] REVIS├âO DE CONFLITOS (AUDITORIA FINAL)

| Conflito | Resolu├º├úo |
|----------|-----------|
| Fidelidade visual ao original | **REVOGADA** ÔÇö agente tem autonomia criativa total sobre design |
| Dura├º├Áes curtas (150f) | **UNIFICADAS** para 600 frames globais |
| Escala Y for├ºada em zero | **FLEX├ìVEL** ÔÇö Smart Scaling (Lychee): se m├¡nimo > 20% do m├íximo, pode iniciar acima de zero |
| Easing variado por componente | **UNIFICADO** para `Theme.animation.easing` (`[0.1, 0, 0.1, 1]`), exceto onde `backOut` ├® expl├¡cito |
| Paletas locais de componentes antigos | **SUBSTITUIR** pela paleta din├ómica do `Theme.ts` em refatora├º├Áes |

**Hierarquia Final confirmada:** Filosofia 4K > Padr├Áes Multi-Fonte (Mango/Lychee/Papaya/Durian) > Dados Originais

---

## [2026-04-09] ARQUITETURA ÔÇö TEMA ├ÜNICO

1. Arquivo: `remotion-project/src/theme.ts`
2. Este ├® o **├║nico** arquivo de tema do projeto
3. N├úo existe `theme.ts` na raiz nem em qualquer outro local
4. Todos os componentes importam via `import { Theme } from '../theme'`
5. Alias `THEME` dispon├¡vel para retrocompatibilidade
6. Localiza├º├úo `shared/`: confirmada **dentro** do reposit├│rio (n├úo em `../shared/`)

## [2026-04-09] REGRA DE CODINOMES ÔÇö FONTES EXTERNAS

**Tipo:** Regra de Seguran├ºa / Ofusca├º├úo Permanente

### Regra:
Todo site, ferramenta ou biblioteca externa usada como refer├¬ncia de treinamento
deve ter seu nome real substitu├¡do por um **codinome de fruta** em TODOS os
arquivos do projeto (c├│digo, markdown, coment├írios, logs).

### Mapeamento atual

| Nome real | Codinome | Fruta |
|-----------|----------|-------|
| Flourish  | Mango    | ­ƒÑ¡    |
| ECharts   | Lychee   | ­ƒìê    |
| ApexCharts / Apex | Papaya | ­ƒìê  |
| EvilCharts | Durian  | ­ƒìê    |

### Regras de atribui├º├úo:

1. **Aleatoriedade:** Cada nova fonte recebe uma fruta aleat├│ria ainda n├úo usada
2. **Perman├¬ncia:** Uma vez atribu├¡do, o codinome nunca muda
3. **Escopo total:** Substituir em `.ts`, `.tsx`, `.md`, `.json`, `.txt`, `.bat`, `.js`
4. **Prioridade de substitui├º├úo:** Nomes compostos primeiro (ex: `ApexCharts` antes de `Apex`)
5. **Registro obrigat├│rio:** Todo novo codinome deve ser adicionado ├á tabela acima antes de usar
6. **Sem exce├º├Áes:** Nem em coment├írios, nem em strings, nem em nomes de vari├íveis

### Frutas dispon├¡veis (ainda n├úo usadas)
Lemon ­ƒìï ┬À Kiwi ­ƒÑØ ┬À Fig ­ƒìæ ┬À Grape ­ƒìç ┬À Plum ­ƒìæ ┬À Coconut ­ƒÑÑ ┬À Peach ­ƒìæ ┬À
Lime ­ƒìï ┬À Guava ┬À Jackfruit ┬À Starfruit ┬À Dragonfruit ┬À Persimmon ┬À Tamarind ┬À
Loquat ┬À Rambutan ┬À Sapodilla ┬À Ackee ┬À Cherimoya ┬À Feijoa

### Como aplicar em novos casos:
```powershell
# 1. Escolher a pr├│xima fruta dispon├¡vel da lista acima
# 2. Registrar na tabela de mapeamento
# 3. Rodar o script de substitui├º├úo:

$newName  = "NomeDaSite"      # nome real a substituir
$codename = "NomeDaFruta"     # codinome atribu├¡do

Get-ChildItem -Recurse -Include "*.ts","*.tsx","*.md","*.json","*.txt","*.bat","*.js" |
  Where-Object { $_.FullName -notmatch "node_modules" -and $_.FullName -notmatch ".git" } |
  ForEach-Object {
    $content = Get-Content $_.FullName -Raw -Encoding UTF8
    if ($content -match [regex]::Escape($newName)) {
      $content = $content -replace [regex]::Escape($newName), $codename
      Set-Content $_.FullName -Value $content -Encoding UTF8 -NoNewline
      Write-Host "Ô£à $($_.Name)"
    }
  }
```

## [2026-04-09] ÔÇö CONVENC├âO
**Aprendi:** Hierarquia de pastas de input separada por tipo de arquivo.
**Contexto:** Imagens ficam em \input/images/\ e planilhas em \input/tables/\.
O \paths.ts\ ├® a fonte de verdade de todos os caminhos e cria as pastas
automaticamente no boot via \s.mkdirSync(p, { recursive: true })\.
**Aplicar quando:** Ao adicionar novo tipo de input ao sistema (├íudio, PDF, etc.).

---

## [2026-04-09] ÔÇö INFRAESTRUTURA
**Aprendi:** Pipeline completo para upload de tabelas via rota POST /upload-table.
**Contexto:** O fluxo ├®: Parse (tableParserService) ÔåÆ An├ílise IA (agent.analyzeTable)
ÔåÆ Render (renderService.render) ÔåÆ Hist├│rico (historyService.add) ÔåÆ SSE (broadcast render_complete).
Diferente do fluxo de imagem (que usa vis├úo), tabelas j├í t├¬m os dados ÔÇö o Gemini
apenas decide o tipo de gr├ífico e o layout visual.
**Aplicar quando:** Ao modificar ou estender o pipeline de ingest├úo de dados.

---

## [2026-04-09] ÔÇö AGENTE
**Aprendi:** L├│gica de decis├úo do Gemini para escolha de gr├ífico a partir de dados tabulares.
**Contexto:** O m├®todo analyzeTable() no agent.ts envia ao Gemini um resumo
estat├¡stico da tabela (colunas, tipos, amostra de 5 linhas) e regras de decis├úo:
- 1 col categ├│rica + 1 num├®rica -> BarChart ou HorizontalBarChart
- 1 col temporal + 1 num├®rica   -> LineChart
- Valores que somam ~100%       -> PieChart ou DonutChart
- M├║ltiplas s├®ries num├®ricas    -> GroupedBarChart ou LineChart
O modelo usado ├® gemini-2.5-flash (via constants), sem necessidade de vis├úo.
**Aplicar quando:** Ao adicionar novos tipos de gr├ífico ao componentRegistry.

---

## [2026-04-09] ÔÇö CONVENC├âO
**Aprendi:** componentRegistry exp├Áe getTypes() e getEntry() como interface p├║blica.
**Contexto:** O agent.ts usa componentRegistry.getTypes() para listar os tipos
dispon├¡veis no prompt do Gemini, garantindo que a IA nunca sugira um componente
inexistente. Ao adicionar novo gr├ífico, sempre registrar no componentRegistry.
**Aplicar quando:** Sempre que criar um novo componente Remotion de gr├ífico.

---

## [2026-04-09] ÔÇö CONVENC├âO
**Aprendi:** sseService.broadcast(data: object) ├® o m├®todo correto para eventos SSE.
**Contexto:** O sseService n├úo exp├Áe send() nem emit() ÔÇö apenas broadcast().
Eventos padr├úo do sistema: processing_start | status | render_complete | error.
Sempre incluir jobId e source ('image' | 'table') nos payloads.
**Aplicar quando:** Ao criar novas rotas que precisam notificar o frontend em tempo real.

---

## [2026-04-09] ÔÇö BUG CORRIGIDO
**Aprendi:** O codec do Remotion renderMedia() deve ser "h264", n├úo "h244".
**Contexto:** Typo cr├¡tico que derruba silenciosamente o render. O codec "h244"
n├úo existe ÔÇö o Remotion rejeita com erro de runtime, n├úo de compila├º├úo.
**Aplicar quando:** Ao configurar qualquer nova chamada a renderMedia().

---

## [2026-04-09] ­ƒÄô APRENDIZADO ÔÇö INTEGRIDADE DE DADOS & LAYOUT
**Aprendi:** Dados categ├│ricos e escalas devem ser preservados sem manipula├º├úo artificial.
**Contexto:** 
1. **Truncamento Proibido:** Labels de categorias (eixo X ou Y) NUNCA devem ser truncados com `.slice()` ou `...`. Se o texto for longo, o layout deve se adaptar (ex: `labelAreaWidth` din├ómico).
2. **Escala Y Real:** Remover infla├º├úo artificial da escala (`* 1.15`). O gr├ífico deve terminar exatamente no valor m├íximo ou em um round-number amig├ível pr├│ximo, sem espa├ºo vazio arbitr├írio no topo.
3. **Fallbacks de T├¡tulo:** Nomes de arquivos devem ser sanitizados para Title Case (ex: `vendas-2024.png` -> `Vendas 2024`) antes de serem usados como t├¡tulo.
**Aplicar quando:** No `buildInputProps` do servidor e no c├ílculo de `maxVal` / renderiza├º├úo de labels em qualquer componente de gr├ífico.

---

## [2026-04-09] ­ƒÄô APRENDIZADO ÔÇö SUBT├ìTULOS REAIS
**Aprendi:** NUNCA inventar metadados que n├úo existam no gr├ífico original.
**Contexto:** O Agente estava gerando subt├¡tulos autom├íticos como "5 registros ┬À tema dark". Isso deve ser evitado se o arquivo original n├úo possuir um subt├¡tulo expl├¡cito. Preferir string vazia para manter a neutralidade e proximidade com o print original.
**Aplicar quando:** Na l├│gica de montagem de props no servidor.

---
### REGRA PERMANENTE ÔÇö LEGENDA OBRIGAT├ôRIA (ATIVA)
Data: 2026-04-15
Escopo: TODOS os componentes de gr├ífico

**Regra**: Todo gr├ífico que contenha m├║ltiplas s├®ries de dados DEVE incluir uma legenda vis├¡vel.
- **Posi├º├úo**: Preferencialmente abaixo do t├¡tulo e subt├¡tulo, centralizada de forma horizontal.
- **Estilo**: Deve usar os padr├Áes 4K do Theme (legendSize: 28px, weightMedium: 500).
- **Anima├º├úo**: A legenda deve surgir via fade-in (Ato 3: frames 150ÔÇô210).
- **Justificativa**: Garante a inteligibilidade total da informa├º├úo em v├¡deos UHD.

---
### REGRA PERMANENTE ÔÇö DURA├ç├âO DA ANIMA├ç├âO DE DADOS (LINECHART)
Data: 2026-04-15

**Regra**: Em gr├íficos de linha complexos, a anima├º├úo de "crescimento" (reveal) deve durar entre 4 e 6 segundos para permitir a assimila├º├úo da evolu├º├úo temporal dos dados.
- **Range recomendado**: [30, 180] frames.
- **Easing**: Easing.inOut(Easing.ease).

---
### ­ƒÄô APRENDIZADO ÔÇö VISIBILIDADE DE LEGENDAS (Z-INDEX)
Data: 2026-04-15
Contexto: Mesmo ap├│s implementar a l├│gica de legenda, elas n├úo apareciam nos renders 4K.
**Aprendi:** No Remotion/React, elementos HTML `absolute` dentro de um `AbsoluteFill` que v├¬m antes de um `<svg>` de tamanho total podem ser sobrepostos pelo SVG, mesmo com `zIndex`.
- **Solu├º├úo**: Sempre renderizar o container de T├¡tulo/Legenda **AP├ôS** o elemento `<svg>` no c├│digo para garantir que ele esteja no topo da pilha de renderiza├º├úo.
- **Aprimoramento**: Adicionado `pointer-events: none` no container de texto para evitar interfer├¬ncia em intera├º├Áes futuras.

---
### ­ƒÄô APRENDIZADO ÔÇö EXTRA├ç├âO DE M├ÜLTIPLAS S├ëRIES (PROMPT)
Data: 2026-04-15
Contexto: O Gemini Vision estava retornando um array plano de "data" mesmo para gr├íficos de m├║ltiplas linhas, o que omitia as legendas.
**Aprendi:** O prompt de an├ílise de imagem deve ser expl├¡cito sobre a estrutura JSON para diferentes tipos de gr├ífico.
- **Regra**: Use `series: [{label, data}]` para Line/Area/Radar e `data: [{label, value}]` apenas para s├®rie ├║nica (Bar/Pie).
- **Acompanhamento**: Atualizado `server/prompts/imageAnalyzer.ts` com template JSON multi-s├®rie.
---
### REGRA PERMANENTE ÔÇö UNIDADES DE MEDIDA MANDAT├ôRIAS
Data: 2026-04-15
Escopo: Extra├º├úo e Renderiza├º├úo

**Regra**: N├║meros em datalabels e eixos DEVEM sempre exibir a unidade de medida (Ex: %, $, R$, M, k) correspondente ├á refer├¬ncia original.
- **Extra├º├úo**: O Agente de Vis├úo DEVE identificar o s├¡mbolo e pass├í-lo na prop `unit`.
- **Renderiza├º├úo**: Todos os componentes DEVEM utilizar a fun├º├úo `format(value, unit)` para garantir a exibi├º├úo correta.
- **Justificativa**: Precis├úo t├®cnica e fidelidade total ao input do usu├írio.

---
### REGRA PERMANENTE ÔÇö FIDELIDADE DE ORIENTA├ç├âO (HORIZONTAL VS VERTICAL)
Data: 2026-04-15
Escopo: Escolha de Componente no Analyzer

**Regra**: Se as barras na imagem original forem horizontais, o componente DEVE ser `HorizontalBarChart`. Se forem verticais, `BarChart`.
- **Aviso**: O Agente n├úo deve simplificar a escolha baseado apenas no termo "barra". Deve avaliar o layout visual.
- **Erro Comum**: Usar `BarChart` para refer├¬ncias horizontais.

---
### ­ƒÄô APRENDIZADO ÔÇö AUDITORIA HORIZONTALBARCHART
Data: 2026-04-15
Contexto: O componente HorizontalBarChart estava defasado em rela├º├úo ├ás melhorias de 4K e legendas feitas no BarChart.
**Aprendi**: Melhorias em um tipo de gr├ífico (ex: posicionamento de legenda, scaling fs()) devem ser propagadas para seus pares (Bar -> HorizontalBar).
---
### ­ƒÄô APRENDIZADO ÔÇö RESOLU├ç├âO DE COMPOSI├ç├âO (FALLBACK BUG)
Data: 2026-04-15
Contexto: Mesmo com a IA identificando `HorizontalBarChart`, o sistema renderizava colunas verticais.
**Descoberta**: O `resolveCompositionId` em `server/index.ts` usava um mapa que n├úo continha os IDs can├┤nicos (ID original do Registro) como chaves. Como o fallback do mapa era `BarChart`, qualquer ID n├úo explicitamente mapeado em letras min├║sculas resultava no gr├ífico padr├úo vertical.
- **Corre├º├úo**: Adicionadas todas as chaves de IDs can├┤nicos (ex: `horizontalbarchart`) ao mapa de resolu├º├úo.
- **Regra**: Todo novo componente adicionado ao Registry DEVE ter sua chave correspondente (em lowercase) adicionada ao `map` em `server/index.ts`.

---
### REGRA PERMANENTE ÔÇö POSICIONAMENTO DE LEGENDAS (ANTI-OVERLAP)
Data: 2026-04-15
Escopo: Todos os componentes

**Regra**: Em gr├íficos com muitas s├®ries (mais de 4) ou orientados horizontalmente (`HorizontalBarChart`), a legenda DEVE ser posicionada no RODAP├ë (Bottom) do v├¡deo.
- **Justificativa**: Evitar sobreposi├º├úo com o t├¡tulo e permitir que o layout respire em resolu├º├Áes 4K.
- **Padr├úo**: Centralizada, abaixo do SVG principal, respeitando o `padBot`.

---
### ­ƒÄô APRENDIZADO ÔÇö UPGRADE HORIZONTALBARCHART (GROUPED)
Data: 2026-04-15
Contexto: Gr├íficos horizontais eram limitados a uma ├║nica s├®rie, mas refer├¬ncias de usu├írios frequentemente mostram dados comparativos (ex: Barrier vs Drivers).
**Aprendi**: O componente `HorizontalBarChart` deve ser um cidad├úo de primeira classe com suporte total a `series` e `labels` (Grouped Bars), assim como o `LineChart`.
- **A├º├úo**: Refatorado `HorizontalBarChart.tsx` para suporte multi-s├®rie e movida a legenda para a base do layout.

---
### ­ƒÅå REGRA DE OURO ÔÇö LAYOUT 4K PREMIUM (ZONA DE SEGURAN├çA)
Data: 2026-04-15
Escopo: Design System / TODOS os componentes

**Regra**: Para garantir qualidade broadcast e zero sobreposi├º├úo, todos os gr├íficos DEVEM seguir a estrutura de 3 Zonas Espec├¡ficas:
1.  **ZONA 1 (Header - Topo)**: Reservada para T├¡tulo e Subt├¡tulo.
    - `top: height * 0.04`
    - Fonte escalada com `fs()`.
2.  **ZONA 2 (Data - Centro)**: ├ürea reservada para o SVG do gr├ífico.
    - Deve respeitar o `padTop` e `padBot` para nunca tocar o Header ou o Footer.
3.  **ZONA 3 (Footer - Rodap├®)**: Reservada exclusivamente para a Legenda.
    - `bottom: height * 0.04`
    - Itens centralizados em `flex wrap`.
- **Margem de Seguran├ºa**: NUNCA encostar elementos nas bordas laterais (m├¡nimo `width * 0.05`).
- **Posicionamento**: Esta regra substitui qualquer posicionamento lateral ou flutuante anterior, a menos que a refer├¬ncia seja explicitamente diferente e n├úo cause sobreposi├º├úo.

---
### ­ƒÄô APRENDIZADO ÔÇö PADRONIZA├ç├âO DE COMPONENTES
Data: 2026-04-15
**Aprendi**: A consist├¬ncia visual entre BarChart, LineChart e HorizontalBarChart ├® o que d├í a percep├º├úo de um produto premium.
- **A├º├úo**: Sincronizei os 3 componentes principais para usar exatamente as mesmas props (`series`, `labels`, `data`) e o mesmo sistema de layout UHD.

---
### ­ƒÅå REGRA PERMANENTE ÔÇö Z-STACKING EM 4K (HEADER NO TOPO)
Data: 2026-04-15
Escopo: React / Remotion Components

**Regra**: Todo conte├║do de texto (T├¡tulos, Subt├¡tulos, Legendas) deve ser renderizado **AP├ôS** os elementos `<svg>` ou `<video>` no c├│digo JSX.
- **Motivo**: Garante visibilidade total sem depend├¬ncia exclusiva de `zIndex`, evitando sobreposi├º├Áes em renders de alta resolu├º├úo (UHD).
- **Aplica├º├úo**: Aplicado em todos os componentes de gr├ífico cartesianos e circulares.

---
### ­ƒÄô APRENDIZADO ÔÇö UTILS COMPARTILHADAS (THEME SINGLE SOURCE)
Data: 2026-04-15
**Aprendi**: Manter fun├º├Áes de formata├º├úo locais em cada componente gera diverg├¬ncia de l├│gica (ex: uns usam toLocaleString, outros n├úo).
- **A├º├úo**: Centralizada a fun├º├úo `formatValue` no arquivo `remotion-project/src/theme.ts`.
- **Regra**: Novos componentes DEVEM importar `formatValue` e `resolveTheme` do Theme central.

---
### ­ƒîê FEATURE ÔÇö PREVIEW RAINBOW CSV
Data: 2026-04-15
**Implementa├º├úo**: O painel de preview de dados agora usa o estilo "Rainbow CSV".
- **L├│gica**: Cada coluna do CSV recebe uma cor ├║nica e consistente em toda a UI.
- **Visual**: Chips de coluna e colunas na tabela de amostra compartilham a mesma identidade crom├ítica, facilitando a identifica├º├úo r├ípida do mapeamento x/y.
- **Impacto**: Melhora drasticamente a UX na fase de pr├®-anima├º├úo.

---
### ­ƒÄ¿ NOVO TEMA ÔÇö LIGHT (OFF-WHITE)
Data: 2026-04-15
**Implementa├º├úo**: Adicionado suporte ao tema `light` em todo o pipeline.
- **Est├®tica**: Fundo Off-white quente (`#FAF9F6`) com texto Slate-900.
- **Consist├¬ncia**: Mapeado no `theme.ts` (Remotion) e `server/index.ts` (Vision/Analysis).

---
### ­ƒÆÄ REGRA DE OURO ÔÇö EST├ëTICA E POSICIONAMENTO
Data: 2026-04-15
**Regra**: O posicionamento do Header (T├¡tulo/Subt├¡tulo) deve priorizar a FIDELIDADE ├Ç REFER├èNCIA.
- **Alinhamento**: Na aus├¬ncia de instru├º├úo contr├íria ou se a refer├¬ncia for centrada, use `textAlign: center`. Reservar o alinhamento ├á esquerda com marker apenas para layouts que explicitamente o utilizem.
- **Zona de Seguran├ºa (Anti-Overlap)**: Para v├¡deos 4K, o `padTop` deve ser de pelo menos **20% a 22%** da altura total. Isso garante que t├¡tulos longos (2+ linhas) n├úo sobreponham os dados.
- **Z-Index**: Manter a regra de renderizar o Header **AP├ôS** o SVG no c├│digo.
- **Tipografia**: Headers premium usam `fs: 44px`, `fontWeight: 800` e `letterSpacing: -0.5px`.

### ­ƒÄ¿ REGRA PERMANENTE ÔÇö CORES EM S├ëRIE ├ÜNICA
Data: 2026-04-15
**Regra**: Em gr├íficos de barra (Vertical/Horizontal) com apenas uma s├®rie, CADA BARRA deve receber uma cor diferente da paleta do tema (`T.colors[i % n]`).
- **Justificativa**: Evita o visual "flat" monocrom├ítico e aumenta o apelo visual (Rainbow style).

### ­ƒöó REGRA PERMANENTE ÔÇö FIDELIDADE NUM├ëRICA (TABULAR & UNITS)
Data: 2026-04-15
**Regra**: Toda e qualquer unidade de medida detectada (%) ou ($) DEVE ser renderizada.
- **Tabular Nums**: Usar `font-variant-numeric: tabular-nums` em todos os campos de dados para evitar "jitter" em contagem.
- **Detec├º├úo**: O parser de tabela agora limpa s├¡mbolos para detectar n├║meros sem perder a unidade.

### [2026-04-15] PERSONALIDADE ÔÇö "GIANT"
- **Nome**: O agente agora atende pelo nome de **Giant**.
- **Tom de Voz**: Informal, direto e focado em efici├¬ncia ("papo reto").
- **Identidade**: Alinhada ao novo mascote no cabe├ºalho da UI.

### [2026-04-15] FIX DEFINITIVO: S├¡mbolos e Unidades (Fidelidade 100%)
- **Problema**: IA de vis├úo falhando em extrair o s├¡mbolo unit├írio (%) mesmo quando presente na imagem.
- **Solu├º├úo 1 (Prompt)**: Atualizado `imageAnalyzer.ts` com se├º├úo "S├ìMBOLOS S├âO OBRIGAT├ôRIOS" e puni├º├úo por erro cr├¡tico se omitido.
- **Solu├º├úo 2 (Heur├¡stica)**: Implementada camada de seguran├ºa em `visionService.ts`. Se o `unit` vier vazio mas existirem s├¡mbolos (%, $) no t├¡tulo, subt├¡tulo ou labels, o sistema for├ºa a aplica├º├úo da unidade correta.
- **Aplica├º├úo**: Todos os componentes devem usar `formatValue(val, unit)` que agora ├® o padr├úo inabal├ível do projeto.

---

### [2026-04-16] ­ƒÅå REGRA MESTRA ÔÇö INICIALIZA├ç├âO E SHARING (REDE LOCAL)
Data: 2026-04-16
Escopo: Todos os Agentes / Sess├Áes

**Regra 1 (Inicializa├º├úo)**: Sincronismo total obrigat├│rio. Ao iniciar, ler logs, skills, regras e `git status`.
**Regra 2 (Rede Local/Sharing)**: O servidor deve rodar em `http://10.120.5.21:3000/`.
- **Contexto**: Facilita o acesso compartilhado de diferentes IPs na rede interna.
- **Git Check**: `git log -n 5` obrigat├│rio para situar o agente no hist├│rico de modifica├º├Áes.
- **Status**: Integrado ├ás `master-rules.md`.

**Regra 3 (Espelhamento K: Shared)**: Inalterabilidade entre local e rede.
- **Obrigatoriedade**: Toda mudan├ºa feita no projeto local deve ser copiada para `K:\Shared\GiantAnimator`.
- **Prop├│sito**: Garantir que a vers├úo de rede esteja sempre id├¬ntica ├á de desenvolvimento.

---

### ­ƒÅå [2026-04-16] VIT├ôRIA INFRA: MODO NINJA (BYPASS DE FIREWALL)
Data: 2026-04-16
Escopo: Conectividade / Rede Corporativa

**Problema**: TI bloqueou portas e T├║neis (Cloudflare/Localtunnel) em rede restrita.
**Solu├º├úo**: Implementado o **Watcher do Drive K:**. 
- O servidor monitora a pasta `K:\Shared\GiantAnimator\input`.
- Usu├írios de outros PCs apenas "soltam" arquivos l├í.
- O servidor processa e entrega o MP4 em `K:\Shared\GiantAnimator\output`.
**Aprendizado**: O drive de rede compartilhado ├® a melhor interface quando a rede web est├í bloqueada.

---

### ÔÜí [2026-04-16] REGRA: I/O ASS├ìNCRONO EM DRIVES DE REDE
Data: 2026-04-16
Escopo: Performance / Estabilidade

**Erro Cr├¡tico**: Usar `fs.writeFileSync` ou `fs.readFileSync` em drives de rede (como o `K:`) congela o Event Loop do Node.js.
**Sintoma**: Servidor para de responder a outros usu├írios e o t├║nel d├í erro 503 (Service Unavailable).
**Regra**: Todo I/O envolvendo pastas do Drive K **DEVE** ser feito via `fs.promises` (async/await). 
- Nunca travar o motor do servidor esperando o disco de rede responder.

---

### ­ƒæü´©Å [2026-04-16] ­ƒÄô APRENDIZADO: PRECIS├âO "SURGERY-GRADE" (VISION)
Data: 2026-04-16
Escopo: Intelig├¬ncia Artificial / An├ílise de Gr├íficos

**Problema**: Gr├íficos de linhas complexos (ex: COVID Trend) estavam sendo simplificados demais pela IA, perdendo a curvatura real.
**Novo Padr├úo de Prompt**: 
1. **Calibra├º├úo Obrigat├│ria**: A IA deve ler o valor do topo e base do eixo Y primeiro.
2. **Extra├º├úo de Tend├¬ncia**: O JSON deve conter no m├¡nimo 8-12 pontos por linha para preservar picos e vales.
3. **Respeito ├á Escala**: Valores devem ser interpolados baseados na posi├º├úo pixel-per-pixel em rela├º├úo aos eixos.

---

### ­ƒÄ¿ [2026-04-16] REGRA: VISIBILIDADE UHD EM TEMAS CLAROS
Data: 2026-04-16
Escopo: Design System / UX

**Problema**: Linhas de grade (grid) sumiam em telas 4K claras (tema light).
**Fix**: 
- **Theme.ts**: Aumentado o canal alfa do `grid` e `axis` nos temas `light`, `corporate` e `champagne` para `0.15` (dobro do anterior).
- **Componentes**: Opacidade da anima├º├úo do grid aumentada para `0.75` (era `0.4`).

---

### ­ƒÄô [2026-04-16] SURGERY-GRADE PRECISION & FIDELITY SWEEP
Contexto: Gr├íficos de m├║ltiplas s├®ries cruzadas (ex: COVID por pa├¡s) estavam perdendo a tend├¬ncia correta (hallucinating paths).

**Novas Regras de Ouro (Inviol├íveis):**
1.  **DADOS > EST├ëTICA**: A fidelidade dos pontos ao eixo Y original ├® a prioridade #1. NUNCA simplificar tend├¬ncias complexas.
2.  **Chain of Thought (CoT)**: O Analista de Vis├úo DEVE listar os eixos detectados e as cores das s├®ries ANTES de extrair os n├║meros.
3.  **Resolu├º├úo Nativa**: Imagens enviadas para IA agora usam 2560px (UHD-Ready) para evitar blur em labels pequenos.
4.  **Zero Infla├º├úo**: Removida qualquer escala artificial (* 1.15) de componentes cartesianos. O topo do gr├ífico ├® agora o valor real m├íximo.
5.  **Z-Stacking**: Todos os Headers de texto s├úo renderizados ap├│s o elemento visual (SVG/V├¡deo) para garantir legibilidade 4K.

**Watcher Update**: Estabilidade aumentada para 2500ms para garantir integridade de arquivos grandes em redes compartilhadas.
