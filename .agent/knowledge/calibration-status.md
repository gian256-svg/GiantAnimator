# GiantAnimator — Status de Calibração
> Atualizado: 2026-04-06
> Este arquivo é a fonte da verdade sobre o que está pronto para produção.

---

## 🟢 Prontos para Produção

### Vertical Bar Chart
- Fase B | Testado com: Amostra Financeira 3
- barW 58%, spring damping:14 stiffness:60, stagger 6f
- Labels k/M, rotação -90° automática, ocultar < 30px

### Line Chart
- ❌ Problema | Placeholder em `src/charts/LineChart.tsx`
- Implementação real necessária (draw esquerda→direita, 1500-2000ms, dots pop 300ms)
- clipPath obrigatório, labels só em extremos

### Horizontal Bar Chart
- ❌ Problema | Placeholder em `src/charts/HorizontalBarChart.tsx`
- Implementação real necessária (MIN_ROW_HEIGHT 52px, multi-dataset automático)
- 4 posições de label suportadas

### Area Chart
- Fase B | Calibrado (Ciclo 3)
- Gradiente 0.5 -> 0.1, animação revealClip L-to-R
- Spring (14, 60), Safe Zone 192px (utilizada em Axis/Padding)

### Multi-Line Chart
- Fase B | Calibrado (Ciclo 4)
- 2-6 linhas, stagger individual (8f), evolvePath draw efeito
- Legenda auto-superior-direita, cores dinâmicas via THEME

### Donut & Pie Chart
- Fase B | Calibrado (Ciclo 5)
- Fatias calculadas via SVG arc (M/A/L/Z), stagger 6f
- Donut hole 55% com label total central, Pie hole 0%

### Scatter Plot
- Fase B | Calibrado (Ciclo 6)
- Eixos contínuos, entrada rain-pop individual (stagger 3f)
- Suporte a colorização por grupo e tamanho por valor (bubble)

### Waterfall Chart
- Fase B | Calibrado (Ciclo 7)
- Floating bars (acumulação automática), barras Total neutras
- Conexões pontilhadas, stagger 6f entre etapas

### Candlestick Chart
- Fase B | Calibrado (Ciclo 8)
- OHLC Mapping (Open, High, Low, Close)
- Sequência: Wick (pavio) escala primeiro, Body (corpo) escala depois

### Gauge Chart
- Fase B | Calibrado (Ciclo 9)
- Semicírculo 180°, ponteiro (needle) animado com swing elástico
- Zonas de cor (G/Y/R) e label centralizado

### Bubble Chart
- Fase B | Calibrado (Ciclo 10)
- 3 dimensões (X, Y, Size), escala de área (sqrt)
- Animação expanding-pop individual, labels internos dinâmicos

### Stacked Bar Chart
- Fase B | Calibrado (Ciclo 11)
- Empilhamento vertical acumulado (2-6 séries)
- Animação segment-stack-reveal (duplo stagger: barra e segmento)

### Grouped Bar Chart
- Fase B | Calibrado (Ciclo 12)
- Barras lado a lado (2-5 por grupo), gaps diferenciados (20% vs 5%)
- Animação vertical sequencial por grupo

### Radar Chart
- Fase B | Calibrado (Ciclo 13)
- Polígono radial (3-10 eixos) com trigonometria manual
- Animação 'inflar' (radial-stretch), suporte a multisséries semitransparentes

### Funnel Chart
- Fase B | Calibrado (Ciclo 14)
- Trapézios empilhados (geometria proporcional por estágio)
- Animação top-down sequencial, cálculo de taxas de conversão automáticas

### Sankey Chart
- Fase B | Calibrado (Ciclo 15)
- Nós e fluxos proporcionais (Sankey layout engine manual)
- Nós com fade-in, fluxos com crescimento de stroke (bezier paths)

### Treemap Chart
- Fase B | Calibrado (Ciclo 16)
- Divisão Squarified (Bruls' algo), áreas proporcionais
- Animação nested-zoom individual, labels condicionados à área

### Heatmap Chart
- Fase B | Calibrado (Ciclo 17)
- Grid de células (MxN), escala de cor divergente (B/W/G)
- Animação row-by-row bouncy (spring individual por célula)

### Bullet Chart
- Fase B | Calibrado (Ciclo 18)
- Barra de performance sobre faixas qualitativas (cinzas)
- Marcador de meta elástico, suporte a múltiplas métricas empilhadas

### Polar Chart
- Fase B | Calibrado (Ciclo 20)
- Setores radiais (Rose Chart) com ângulo fixo e raio variável
- Animação spiral-wipe (radial growth), labels angulares automáticos

### Box Plot Chart
- Fase B | Calibrado (Ciclo 21)
- Distribuição estatística (Whiskers, Q1-Q3) e Outliers individuais
- Animação vertical-expand (Whiskers -> Mediana -> Box)

### Sparkline Chart
- Fase B | Calibrado (Ciclo 22)
- Mini-gráficos ultra-compactos (line, bar, area)
- Animação wave-reveal (L-R) com destaque no último dot

### Network Chart
- Fase B | Calibrado (Ciclo 23)
- Nós circulares e arestas direcionadas (SVG positions via props)
- Animação sequencial: Node-pop -> Edge-stroke-growth

### Histogram Chart
- Fase B | Calibrado (Ciclo 24)
- Barras contíguas (bins dinâmicos) e curva KDE (Kernel Density)
- Animação vertical-stagger-grow, labels de intervalo [min, max)

### Mekko Chart
- Fase B | Calibrado (Ciclo 25)
- Gráfico de 2 dimensões (Marimekko): largura e altura variáveis
- Animação bottom-to-top por coluna, labels de percentual interno

### Chord Chart
- Fase B | Calibrado (Ciclo 26)
- Arcos externos para entidades, fitas (ribbons) para fluxos internos
- Animação radial-twist (Arcos -> Ribbons), labels angulares externos

### Sunburst Chart
- Fase B | Calibrado (Ciclo 27)
- Hierarquia radial (empresa -> dept -> categoria) em anéis concêntricos
- Animação center-out (nível por nível), labels angulares adaptativos

### Pareto Chart
- Fase B | Calibrado (Ciclo 28)
- Barras decrescentes + Linha de % acumulada (80/20 Rule)
- Eixos Y duplos (Valores e %), animação sequencial (Barras -> Linha)

### Comparative Bar Chart
- Fase B | Calibrado (Ciclo 29)
- Barras horizontais espelhadas (Pyramid Layout) para comparação
- Animação outward-growth a partir do centro, labels centrais

---

## 🔴 Pendentes de Calibração
- Line Chart           — Placeholder detectado (Fase A)
- Horizontal Bar Chart  — Placeholder detectado (Fase A)
- Heatmap (Simples)    — Placeholder detectado (Fase A)
- Gantt Chart          — Componente ausente (Fase A)

---

## 📋 Protocolo de Calibração
Para calibrar um novo gráfico:
1. Fornecer 3 imagens de referência com dados diferentes
2. Status Global: ⚠️ Auditoria Visual Realizada (Fase A) — 14 OK / 13 Atenção / 4 Problema
3. Auditoria de 8 dimensões:
   - [ ] Proporções (barW, padding, espaçamento)
   - [ ] Cores (hex fidelidade)
   - [ ] Grid (dashes, opacidade)
   - [ ] Animação (tipo, duração, easing)
   - [ ] Labels (formato, posição, rotação)
   - [ ] Legenda (só se visível no original)
   - [ ] Edge cases (dados vazios, divisão por zero)
   - [ ] Multi-dataset (se aplicável)
4. Score 8/8 → status muda para 🟢
5. Documentar em `[nome]-rules.md`
6. Atualizar `remotion-components.md`
7. Chamar `POST /knowledge/reload`
