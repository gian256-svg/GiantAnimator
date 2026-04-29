# ⚠️ CHECKLIST OBRIGATÓRIO — EXECUTAR ANTES DE GERAR QUALQUER COMPONENTE

Antes de escrever UMA LINHA de código de componente Remotion, responda mentalmente:

- [ ] O export está como export const NomeChart (NUNCA export default)?
- [ ] O spring está como const x = spring({...}) sem .value?
- [ ] As cores estão usando THEME.chartColors[index] (NUNCA THEME.colors.seriesX)?
- [ ] O componente tem extrapolateRight: "clamp" em todos os springs?
- [ ] O Root.tsx já tem esse componente registrado como Named Import?

Se qualquer resposta for NÃO → corrija ANTES de continuar.

---# GiantAnimator — Componentes Disponíveis
> Atualizado: 2026-04-06

---

## Status Geral
| Componente | Arquivo | Status | Composition ID |
|---|---|---|---|
| Vertical Bar | src/charts/BarChart.tsx | 🟡 Re-calibrar — export e API corrigidos em 06/04/2026 | BarChart |
| Line Chart | src/charts/LineChart.tsx | 🟡 Re-calibrar — export e API corrigidos em 06/04/2026 | LineChart |
| Horizontal Bar | src/charts/HorizontalBarChart.tsx | 🟡 Re-calibrar — export e API corrigidos em 06/04/2026 | HorizontalBar |
| Multi-Line | src/components/MultiLineChart.tsx | 🟢 Calibrado (07/04) | MultiLine, MultiLinePreview |
| Area Chart | src/components/AreaChart.tsx | 🟢 Calibrado (07/04) | AreaChart, AreaChartPreview |
| Donut/Pie | src/components/DonutChart.tsx | 🟢 Calibrado (07/04) | DonutChart, PieChart |
| Scatter Plot | src/components/ScatterPlot.tsx | 🟢 Calibrado (07/04) | ScatterPlot, ScatterPlotPreview |
| Waterfall | src/components/WaterfallChart.tsx | 🟢 Calibrado (07/04) | WaterfallChart, WaterfallChartPreview |
| Candlestick | src/components/CandlestickChart.tsx | 🟢 Calibrado (07/04) | CandlestickChart, CandlestickChartPreview |
| Gauge | src/components/GaugeChart.tsx | 🟢 Calibrado (07/04) | GaugeChart, GaugeChartPreview |
| Bubble | src/components/BubbleChart.tsx | 🟢 Calibrado (07/04) | BubbleChart, BubbleChartPreview |
| Stacked Bar | src/components/StackedBarChart.tsx | 🟢 Calibrado (07/04) | StackedBar, StackedBarPreview |
| Grouped Bar | src/components/GroupedBarChart.tsx | 🟢 Calibrado (07/04) | GroupedBar, GroupedBarPreview |
| Radar | src/components/RadarChart.tsx | 🟢 Calibrado (07/04) | RadarChart, RadarChartPreview |
| Funnel | src/components/FunnelChart.tsx | 🟢 Calibrado (07/04) | FunnelChart, FunnelChartPreview |
| Sankey | src/components/SankeyChart.tsx | 🟢 Calibrado (07/04) | SankeyChart, SankeyChartPreview |
| Treemap | src/components/TreemapChart.tsx | 🟢 Calibrado (07/04) | TreemapChart, TreemapChartPreview |
| Heatmap | src/components/HeatmapChart.tsx | 🟢 Calibrado (07/04) | HeatmapChart, HeatmapChartPreview |
| Bullet | src/components/BulletChart.tsx | 🟢 Calibrado (07/04) | BulletChart, BulletChartPreview |
| Polar | src/components/PolarChart.tsx | 🟢 Calibrado (07/04) | PolarChart, PolarChartPreview |
| Box Plot | src/components/BoxPlotChart.tsx | 🟢 Calibrado (07/04) | BoxPlotChart, BoxPlotChartPreview |
| Sparkline | src/components/SparklineChart.tsx | 🟢 Calibrado (07/04) | SparklineChart, SparklineChartPreview |
| Network | src/components/NetworkChart.tsx | 🟢 Calibrado (07/04) | NetworkChart, NetworkChartPreview |
| Histogram | src/components/HistogramChart.tsx | 🟢 Calibrado (07/04) | HistogramChart, HistogramChartPreview |
| Mekko | src/components/MekkoChart.tsx | 🟢 Calibrado (07/04) | MekkoChart, MekkoChartPreview |
| Chord | src/components/ChordChart.tsx | 🟢 Calibrado (07/04) | ChordChart, ChordChartPreview |
| Sunburst | src/components/SunburstChart.tsx | 🟢 Calibrado (07/04) | SunburstChart, SunburstChartPreview |
| Pareto | src/components/ParetoChart.tsx | 🟢 Calibrado (07/04) | ParetoChart, ParetoChartPreview |
| Comparative | src/components/ComparativeBarChart.tsx | 🟢 Calibrado (07/04) | ComparativeBarChart, ComparativeBarChartPreview |
| Gantt | src/charts/GanttChart.tsx | 🔴 Pendente | Gantt |

---

## Vertical Bar Chart (BarChart.tsx) 🟢
Props:
```typescript
interface BarChartProps {
  data: { label: string; value: number }[];
  title?: string;
  unit?: string;
  staggerFrames?: number;      // padrão: 6
  dataLabelPosition?: "top" | "inside-bar" | "hidden";
}
```
- `barW` = 58% do espaço da coluna
- Spring: `damping 14, stiffness 60`
- Labels: notação `k/M`, ocultar se `barHeight < 30px`
- Rotação: -90° automático com > 15 barras

## Line Chart (LineChart.tsx) 🟢
Props:
```typescript
interface LineChartProps {
  data: { label: string; value: number }[];
  title?: string;
  unit?: string;
  lineColor?: string;
  showDots?: boolean;          // padrão: true
  lineThickness?: number;      // padrão: 3 (range: 3-5)
}
```
- Animação: `evolvePath` (@remotion/paths)
- Dots: `pop` scale 0→1.2→1 em ~9 frames (300ms a 30fps)
- `clipPath` obrigatório nos bounds do SVG
- Labels: só em máximas/mínimas/ponto final

## Horizontal Bar Chart (HorizontalBarChart.tsx) 🟢
Props:
```typescript
interface HorizontalBarProps {
  datasets: {
    label: string;
    data: { label: string; value: number }[];
    color?: string;
  }[];
  title?: string;
  dataLabelPosition?: "below-axis" | "end-of-bar" | "inside-bar" | "center-bar";
}
```
- `MIN_ROW_HEIGHT`: 52px
- Detecta multi-dataset automaticamente
- Fallback `Array.isArray()` obrigatório

## Comparative Bar Chart (ComparativeBarChart.tsx) 🟢
Props:
```typescript
interface ComparativeItem { label: string; leftValue: number; rightValue: number; }
```
- Geometria: Barras espelhadas a partir de um eixo central
- Animação: `outward-growth` (Crescimento divergente do centro)
- Estilo: Labels de categoria no centro, labels de valor nas extremidades

## Pareto Chart (ParetoChart.tsx) 🟢
Props:
```typescript
interface ParetoItem { label: string; value: number; }
```
- Eixos: Dual Y (Valores à esquerda, % à direita)
- Animação: `vertical-pop` (Barras) -> `wave-reveal` (Linha % Acumulada)
- Destaque: Linha de referência horizontal em 80% (Accento)

## Sunburst Chart (SunburstChart.tsx) 🟢
Props:
```typescript
interface SunburstNode { label: string; value?: number; children?: SunburstNode[]; }
```
- Geometria: Anéis concêntricos com fatias proporcionais
- Animação: `center-out` (Expansão por nível hierárquico)
- Estilo: Cores do pai -> mais claras no filho

## Chord Chart (ChordChart.tsx) 🟢
Props:
```typescript
interface ChordEntity { id: string; label: string; }
interface ChordFlow { source: string; target: string; value: number; }
```
- Geometria: Arcos externos proporcional ao fluxo total
- Ribbons: Curvas Bezier ligando arcos com largura por valor
- Animação: `radial-twist` (Arcos -> Links)

## Mekko Chart (MekkoChart.tsx) 🟢
Props:
```typescript
interface MekkoColumn { label: string; totalValue: number; segments: MekkoSegment[]; }
```
- Dupla Dimensão: Largura (Tamanho de Mercado) × Altura (Market Share)
- Animação: `bottom-to-top` escalonada por coluna (8f)
- Labels: Percentuais internos e categorias no topo

## Histogram Chart (HistogramChart.tsx) 🟢
Props:
```typescript
interface HistogramChartProps { rawData: number[]; binCount: number; showKDE: boolean; }
```
- Geometria: Barras contíguas (bins calculados automaticamente)
- Animação: `vertical-stagger-grow` (stagger 4f)
- Feature: Curva de densidade (KDE) suave sobreposta

## Network Chart (NetworkChart.tsx) 🟢
Props:
```typescript
interface NetworkNode { id: string; label: string; x: number; y: number; weight: number; }
interface NetworkEdge { source: string; target: string; directed: boolean; }
```
- Posições: Relativas (0-1) via props para estabilidade
- Animação: `node-pop` seguida de `edge-stroke-growth`
- Estilo: Marcadores de seta para fluxos direcionados

## Sparkline Chart (SparklineChart.tsx) 🟢
Props:
```typescript
interface SparklineItem { label: string; data: number[]; variant: "line"|"bar"|"area"; }
```
- Estilo: Ultra-compacto sem eixos
- Animação: `wave-reveal` L-to-R com dot final
- Grid: Suporte a colunas para exibição múltipla

## Box Plot Chart (BoxPlotChart.tsx) 🟢
Props:
```typescript
interface BoxSet { label: string; min: number; q1: number; median: number; q3: number; max: number; outliers?: number[]; }
```
- Componentes: Whiskers (T-Bars) -> Box (Q1-Q3) -> Median (Line) -> Outliers (Dots)
- Animação: `vertical-expand` (Wick -> Mediana -> Box)
- Design: Box #3B82F6, Whiskers #334155, Outliers #EF4444

## Polar Chart (PolarChart.tsx) 🟢
Props:
```typescript
interface PolarData { label: string; value: number; }
```
- Geometria: Setores radiais (Rose Chart) - Raio proporcional
- Animação: `spiral-wipe` (Crescimento radial por setor)
- Layout: Labels angulares automáticos fora dos setores

## Bullet Chart (BulletChart.tsx) 🟢
Props:
```typescript
interface BulletMetric { label: string; value: number; target: number; ranges: number[]; }
```
- Camadas: Faixas (Fundo) -> Barra Performance (Frente) -> Marcador Meta
- Animação: Crescimento horizontal seguido de surge do marcador
- Design: Escala de cinzas para faixas qualitativas

## Heatmap Chart (HeatmapChart.tsx) 🟢
Props:
```typescript
interface HeatmapCell { x: string; y: string; value: number; }
```
- Eixos: Categóricos (X-Topo inclinado, Y-Esquerda)
- Cores: Escala Divergente (DeepBlue -> White -> DeepGold)
- Animação: `row-by-row` com *spring* elástico por célula

## Treemap Chart (TreemapChart.tsx) 🟢
Props:
```typescript
interface TreemapNode {
  id: string; label: string; value: number; group?: string;
}
```
- Algoritmo: `Squarified` (Bruls' implementation)
- Animação: `nested-zoom` (scale 0->1 a partir do centro do retângulo)
- Estilo: Shading por grupo e labels internos inteligentes

## Sankey Chart (SankeyChart.tsx) 🟢
Props:
```typescript
interface SankeyNode { id: string; label: string; column: number; }
interface SankeyLink { source: string; target: string; value: number; }
```
- Layout: Motor de colunas manual (Nodes L-R)
- Animação: `flow-reveal` (Nodes Fade -> Links Bezier stroke)
- Estilo: Links com 20-30% opacidade da cor do nó de origem

## Funnel Chart (FunnelChart.tsx) 🟢
Props:
```typescript
interface FunnelStage {
  label: string; value: number;
}
```
- Geometria: Trapézios (`polygon`) de largura proporcional
- Animação: `top-down` (Stagger 8f entre estágios)
- Labels: Nome (Esquerda), Valor/% (Direita)

## Radar Chart (RadarChart.tsx) 🟢
Props:
```typescript
interface RadarSeries {
  label: string; values: number[]; color?: string;
}
```
- Geometria: Polígono radial (3-10 eixos) via Trigonometria
- Animação: `radial-stretch` (inflar do centro 0->1)
- Estilo: Fill semitransparente (0.3) para multisséries comparativas

## Grouped Bar Chart (GroupedBarChart.tsx) 🟢
Props:
```typescript
interface GroupedBarData {
  label: string; values: number[];
}
```
- Séries: 2-5 barras por categoria lado a lado
- Espaçamento: Group padding 20%, series spacing 5%
- Animação: Vertical growth (Stagger 3f entre barras do grupo)

## Stacked Bar Chart (StackedBarChart.tsx) 🟢
Props:
```typescript
interface StackedBarData {
  label: string; values: number[];
}
```
- Séries: Suporte a 2-6 categorias empilhadas
- Animação: `segment-stack-reveal` (stagger 4f por barra, 2f por segmento)
- Eixos: Automáticos baseados na soma total de cada categoria

## Bubble Chart (BubbleChart.tsx) 🟢
Props:
```typescript
interface BubblePoint {
  x: number; y: number; size: number; group?: string; label?: string;
}
```
- Eixos: XY Numéricos (Grades #334155)
- Animação: `expanding-pop` (scale 0->1.1->1) + Fade
- Área: Escala `sqrt` para que o diâmetro reflita a proporção real de volume/tamanho

## Gauge Chart (GaugeChart.tsx) 🟢
Props:
```typescript
interface GaugeChartProps {
  value: number; // 0-100
  title?: string;
  label?: string;
}
```
- Ângulo: 180° (-90 a 90)
- Animação: Needle Swing com spring elástico
- Estilo: Arcos de zona (Verde/Amarelo/Vermelho) + Ponteiro triangular afiado

## Candlestick Chart (CandlestickChart.tsx) 🟢
Props:
```typescript
interface CandleData {
  label: string; open: number; high: number; low: number; close: number;
}
```
- Eixo Y: Numérico contínuo
- Animação: Sequencial (Wicks primeiro, então Body-scale)
- Cores: Bullish (#22C55E) vs Bearish (#EF4444)

## Waterfall Chart (WaterfallChart.tsx) 🟢
Props:
```typescript
interface WaterfallProps {
  data: { label: string; value: number }[];
  positiveColor?: string;
  negativeColor?: string;
  totalColor?: string;
}
```
- Lógica: Acumulação sequencial automática
- Cores: Verde (Positivo), Vermelho (Negativo), Azul (Total) por padrão
- Elementos: Barras flutuantes conectadas por linhas pontilhadas

## Scatter Plot (ScatterPlot.tsx) 🟢
Props:
```typescript
interface ScatterPlotProps {
  data: { x: number; y: number; size?: number; group?: string; label?: string }[];
  title?: string;
  sizeKey?: boolean;
  groupKey?: boolean;
}
```
- Eixos: Numéricos contínuos com mapeamento manual de extentX/Y
- Animação: `rain-pop` (escala 0->1 com stagger de 3 frames)
- Estilo: Opacidade 0.75 para evidenciar densidade (clusters)

## Donut & Pie Chart (DonutChart.tsx / PieChart.tsx) 🟢
Props:
```typescript
interface DonutChartProps {
  data: { label: string; value: number; color?: string }[];
  title?: string;
  innerRadiusRatio?: number;
}
```
- Lógica: SVG Path (Manual Arc)
- Animação: Fatias crescem sequencialmente (stagger 6f)
- Centro: Exibe total (no DonutChart) ou maior valor
- Legenda: Percentuais calculados e exibidos lateralmente

## Multi-Line Chart (MultiLineChart.tsx) 🟢
Props:
```typescript
interface MultiLineChartProps {
  series: {
    label: string;
    data: number[];
    color?: string;
  }[];
  labels: string[];
  title?: string;
}
```
- Suporte a 2-6 linhas simultâneas
- Animação: `evolvePath` individual
- Stagger: 8 frames entre séries
- Legenda: Renderização automática no canto superior direito

## Area Chart (AreaChart.tsx) 🟢
Props:
```typescript
interface AreaChartProps {
  data: { label: string; value: number }[];
  title?: string;
  color?: string;
}
```
- Gradiente: 0.5 (topo) -> 0.1 (base)
- Animação: `revealClip` horizontal (esquerda -> direita)
- Spring: `damping 14, stiffness 60`
- Safe Zone: 192px (aplicado via paddings responsivos)

## Tema (theme.ts)
```typescript
import { THEME } from "../theme";
// THEME.colors       — background, surface, text, textMuted
// THEME.chartColors  — paleta de 7 cores para séries
// THEME.spring       — { bar, snappy, smooth, bouncy, noBlur }
// THEME.font         — family, weightBold, weightRegular
```

## Como Calibrar um Novo Componente
1. Criar `remotion-project/src/charts/NomeChart.tsx`
2. Adicionar `<Composition>` no `Root.tsx`
3. Testar com 3 amostras de dados reais diferentes
4. Preencher o template de calibração em `.agent/knowledge/[nome]-rules.md`
5. Atualizar status neste arquivo para 🟢
6. Chamar `POST /knowledge/reload`

## Estrutura Obrigatória de Todo Componente
```typescript
import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { THEME } from "../theme";

export interface NomeChartProps {
  data: { label: string; value: number }[];
  title?: string;
}

export const NomeChart: React.FC<NomeChartProps> = ({ data, title }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  // Array safety sempre:
  const safeData = Array.isArray(data) ? data : [];
  // ... lógica aqui
};
```

