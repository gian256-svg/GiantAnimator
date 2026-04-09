// =============================================================================
// 🎨 GIANT ANIMATOR — DESIGN SYSTEM
// =============================================================================
// FONTE ÚNICA DE VERDADE para cores, tipografia, espaçamento e animação.
//
// ⚠️  REGRA ARQUITETURAL:
//     Este é o ÚNICO arquivo de tema do projeto.
//     Não existe (nem deve existir) theme.ts na raiz ou em qualquer outro lugar.
//     Todos os componentes importam via: import { Theme } from '../theme'
//
// 🚫  NÃO DUPLICAR este arquivo.
// 🚫  NÃO criar theme.ts na raiz do projeto.
// 🚫  NÃO hardcodar cores, tamanhos ou durações nos componentes.
// =============================================================================

// ---------------------------------------------------------------------------
// CANVAS — Resolução 4K UHD
// ---------------------------------------------------------------------------
export const CANVAS = {
  width: 3840,
  height: 2160,

  // Área útil (descontando safe zones)
  safeZoneX: 128,   // lateral (cada lado)
  safeZoneTop: 160, // topo
  safeZoneBottom: 80, // rodapé

  get usableWidth()  { return this.width  - this.safeZoneX * 2; },   // 3584px
  get usableHeight() { return this.height - this.safeZoneTop - this.safeZoneBottom; }, // 1920px

  // Centro geométrico correto (sempre usar estes valores, nunca hardcodar)
  get cx() { return this.safeZoneX + this.usableWidth  / 2; }, // 1920
  get cy() { return this.safeZoneTop + this.usableHeight / 2; }, // 1120
} as const;

// ---------------------------------------------------------------------------
// CORES
// ---------------------------------------------------------------------------
export const COLORS = {
  // Fundo
  background: '#0f1117',
  backgroundCard: '#1a1d27',
  backgroundMuted: '#13151f',

  // Texto
  text: '#e8eaf6',
  textMuted: '#8892b0',
  textSubtle: '#4a5568',

  // Eixos e grid
  axis: 'rgba(232, 234, 246, 0.15)',
  grid: 'rgba(232, 234, 246, 0.06)',

  // Semânticas
  positive: '#00e5a0',
  negative: '#ff4d6d',
  neutral:  '#8892b0',
  highlight: '#ffd166',

  // Paleta principal — 8 cores premium
  chartColors: [
    '#4f8ef7', // Azul elétrico
    '#00e5a0', // Verde esmeralda
    '#ffd166', // Âmbar premium
    '#ff6b9d', // Rosa vibrante
    '#a78bfa', // Violeta suave
    '#38bdf8', // Céu ciano
    '#fb923c', // Laranja quente
    '#34d399', // Verde menta
  ],
} as const;

// ---------------------------------------------------------------------------
// TIPOGRAFIA — Escalada para 4K
// ---------------------------------------------------------------------------
export const TYPOGRAPHY = {
  fontFamily: "'Inter', 'Segoe UI', sans-serif",

  // Tamanhos
  titleSize:    72,  // Título principal do gráfico
  subtitleSize: 40,  // Subtítulo / descrição
  labelSize:    36,  // Labels de dados
  axisSize:     30,  // Labels de eixos
  legendSize:   28,  // Legenda
  captionSize:  24,  // Notas de rodapé / captions

  // Pesos
  weightLight:     300,
  weightRegular:   400,
  weightMedium:    500,
  weightSemiBold:  600,
  weightBold:      700,
  weightExtraBold: 800,

  // Regra: título com maxWidth e padding de segurança (nunca cortar)
  titleMaxWidth:   3400,
  titlePaddingX:   80,
} as const;

// ---------------------------------------------------------------------------
// ESPAÇAMENTO
// ---------------------------------------------------------------------------
export const SPACING = {
  xs:  16,
  sm:  32,
  md:  64,
  lg:  96,
  xl:  128,
  xxl: 192,

  // Padding interno padrão de gráficos cartesianos
  chartPadding: {
    top:    80,
    bottom: 120,
    left:   140,
    right:  80,
  },

  // Legenda
  legendItemHeight: 56,
  legendIconSize:   32,
  legendGap:        24,
} as const;

// ---------------------------------------------------------------------------
// ANIMAÇÃO — Padrão Mango + Lychee (3 Atos)
// ---------------------------------------------------------------------------
export const ANIMATION = {
  // Duração total do vídeo
  durationInFrames: 600, // 20 segundos @ 30fps

  // Ato 1: Estrutura (background, eixos, título)
  act1Start:  0,
  act1End:    30,

  // Ato 2: Dados (barras, linhas, pontos, fatias)
  act2Start:  30,
  act2End:    150,

  // Ato 3: Labels e legenda
  act3Start:  150,
  act3End:    210,

  // Conveniência: duração do reveal de dados (Ato 2)
  animationFrames: 120,

  // Stagger padrão entre elementos (50ms @ 30fps ≈ 1.5 frames)
  staggerFrames: 2,

  // Easing padrão (Mango cubic-bezier)
  easing: [0.1, 0, 0.1, 1] as [number, number, number, number],

  // Spring padrão (com overshoot suave)
  spring: {
    damping:   12,
    stiffness: 90,
    mass:      0.8,
  },

  // Spring com bounce mais agressivo (bolhas, pontos)
  springBounce: {
    damping:   10,
    stiffness: 100,
    mass:      0.6,
  },
} as const;

// ---------------------------------------------------------------------------
// HELPERS DE LAYOUT — Cálculos obrigatórios por tipo de gráfico
// ---------------------------------------------------------------------------
export const LAYOUT = {
  // Gráficos circulares (Pie, Donut, Radar, Polar, Gauge)
  circular: {
    legendWidth: Math.round(CANVAS.usableWidth * 0.25), // 896px
    chartArea:   Math.round(CANVAS.usableWidth * 0.75), // 2688px
    get radius() {
      return Math.round(Math.min(this.chartArea, CANVAS.usableHeight) * 0.42);
    },
  },

  // Gráficos cartesianos (Bar, Line, Area, Scatter, Histogram)
  cartesian: {
    chartWidth:  CANVAS.usableWidth,
    chartHeight: Math.round(CANVAS.usableHeight * 0.85),
  },

  // Gráficos de fluxo (Sankey, Funnel, Chord)
  flow: {
    chartWidth:  CANVAS.usableWidth,
    chartHeight: CANVAS.usableHeight,
  },
} as const;

// ---------------------------------------------------------------------------
// EXPORT PRINCIPAL — Objeto unificado (compatibilidade com ambos os padrões)
// ---------------------------------------------------------------------------
// Uso: import { Theme } from '../theme'
// Uso: import { THEME } from '../theme'  (alias para retrocompatibilidade)
export const Theme = {
  canvas:     CANVAS,
  colors:     COLORS,
  typography: TYPOGRAPHY,
  spacing:    SPACING,
  animation:  ANIMATION,
  layout:     LAYOUT,

  // Atalhos de retrocompatibilidade (não usar em código novo)
  chartColors:     COLORS.chartColors,
  durationInFrames: ANIMATION.durationInFrames,
  animationFrames:  ANIMATION.animationFrames,
} as const;

export const THEME = Theme; // alias retrocompatível

