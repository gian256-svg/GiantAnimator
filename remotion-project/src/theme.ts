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

  // Tamanhos (Flat - para retrocompatibilidade rápida se necessário)
  titleSize:    72,
  subtitleSize: 40,
  labelSize:    36,
  axisSize:     30,
  legendSize:   28,
  captionSize:  24,

  // Estruturas de objeto (Usadas por componentes modernos)
  title: {
    size: 72,
    weight: 700,
    color: '#e8eaf6',
  },
  subtitle: {
    size: 40,
    weight: 400,
    color: '#8892b0',
  },
  label: {
    size: 36,
    weight: 600,
    color: '#e8eaf6',
  },
  tabularNums: { fontVariantNumeric: 'tabular-nums' as const },
  axis: {
    size: 30,
    weight: 400,
    color: '#8892b0',
  },

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

// ---------------------------------------------------------------------------
// SISTEMA DE TEMAS — 6 paletas visuais completas (UI/UX Pro Max)
// ---------------------------------------------------------------------------
// ⚠️  REGRA:
//     Componentes NUNCA devem usar Theme.colors.background ou Theme.chartColors
//     diretamente. Usem resolveTheme(theme) para obter a identidade visual correta.
//
// Como usar num componente:
//   const T = resolveTheme(theme);
//   fill={T.colors[0]}
//   backgroundColor={T.background}
// ---------------------------------------------------------------------------

export interface ThemeConfig {
  background:  string;
  surface:     string;
  text:        string;
  textMuted:   string;
  grid:        string;
  axis:        string;
  colors:      readonly string[];
  positive:    string;
  negative:    string;
}

export const THEMES: Record<string, ThemeConfig> = {

  // ── Dark Premium (padrão — inspirado em Financial Dashboard) ──────────────
  dark: {
    background: '#0f1117',
    surface:    '#1a1d27',
    text:       '#e8eaf6',
    textMuted:  '#8892b0',
    grid:       'rgba(232,234,246,0.07)',
    axis:       'rgba(232,234,246,0.15)',
    colors: [
      '#7c3aed', // violeta
      '#06b6d4', // ciano
      '#a855f7', // roxo
      '#22c55e', // verde
      '#f59e0b', // âmbar
      '#ef4444', // vermelho
      '#3b82f6', // azul
      '#f97316', // laranja
    ],
    positive: '#22c55e',
    negative: '#ef4444',
  },

  // ── Neon Glow (Gaming — neon purple + rose, fundo ultra escuro) ──────────
  neon: {
    background: '#060614',
    surface:    '#0d0d28',
    text:       '#f0fff4',
    textMuted:  '#a0aec0',
    grid:       'rgba(0,255,136,0.08)',
    axis:       'rgba(0,255,136,0.25)',
    colors: [
      '#00ff88', // verde neon
      '#00e5ff', // ciano elétrico
      '#ff00ff', // magenta
      '#f9f871', // amarelo cyber
      '#ff6600', // laranja neon
      '#bf5fff', // roxo elétrico
      '#00ffcc', // menta neon
      '#ff4090', // rosa hot
    ],
    positive: '#00ff88',
    negative: '#ff4090',
  },

  // ── Ocean Deep (Sustainability/ESG — nature green + ocean blue) ──────────
  ocean: {
    background: '#0c1b33',
    surface:    '#0f2644',
    text:       '#e0f2fe',
    textMuted:  '#7dd3fc',
    grid:       'rgba(14,165,233,0.1)',
    axis:       'rgba(14,165,233,0.3)',
    colors: [
      '#0ea5e9', // sky blue
      '#22d3ee', // ciano vivo
      '#38bdf8', // azul claro
      '#059669', // verde-mar
      '#0891b2', // azul-petróleo
      '#7dd3fc', // azul ice
      '#34d399', // esmeralda
      '#a5f3fc', // azul quase branco
    ],
    positive: '#34d399',
    negative: '#f87171',
  },

  // ── Sunset (E-commerce / Podcast — warm accent, drama dark) ─────────────
  sunset: {
    background: '#1a0800',
    surface:    '#2d0f00',
    text:       '#fff7ed',
    textMuted:  '#fbbf24',
    grid:       'rgba(249,115,22,0.1)',
    axis:       'rgba(249,115,22,0.25)',
    colors: [
      '#f97316', // laranja
      '#ef4444', // vermelho
      '#ec4899', // rosa
      '#f59e0b', // âmbar
      '#fb923c', // laranja claro
      '#fbbf24', // dourado
      '#dc2626', // vermelho escuro
      '#e879f9', // fúcsia
    ],
    positive: '#fbbf24',
    negative: '#ef4444',
  },

  // ── Minimal (Architecture / Interior — black + gold, high contrast) ──────
  minimal: {
    background: '#f8fafc',
    surface:    '#ffffff',
    text:       '#0f172a',
    textMuted:  '#475569',
    grid:       'rgba(15,23,42,0.07)',
    axis:       'rgba(15,23,42,0.15)',
    colors: [
      '#334155', // slate escuro
      '#475569', // slate médio
      '#0f172a', // quase preto
      '#64748b', // slate
      '#94a3b8', // slate claro
      '#1e293b', // slate profundo
      '#cbd5e1', // slate muito claro
      '#D4AF37', // ouro (accent)
    ],
    positive: '#059669',
    negative: '#dc2626',
  },

  // ── Corporate (SaaS / Financial — trust blue + orange CTA) ──────────────
  corporate: {
    background: '#ffffff',
    surface:    '#f8fafc',
    text:       '#0f172a',
    textMuted:  '#1e293b',
    grid:       'rgba(30,64,175,0.08)',
    axis:       'rgba(30,64,175,0.2)',
    colors: [
      '#1e40af', // azul institucional
      '#3b82f6', // azul médio
      '#0891b2', // ciano-azul
      '#1d4ed8', // azul forte
      '#6366f1', // índigo
      '#0c4a6e', // azul-petróleo
      '#2563eb', // azul vivo
      '#f97316', // laranja accent
    ],
    positive: '#059669',
    negative: '#dc2626',
  },

  // ── Light (Professional Off-white — Clean & Balanced) ──────────────────
  light: {
    background: '#FAF9F6', // Off-white warm
    surface:    '#ffffff',
    text:       '#0f172a', // Slate 900
    textMuted:  '#475569', // Slate 600
    grid:       'rgba(15,23,42,0.06)',
    axis:       'rgba(15,23,42,0.12)',
    colors: [
      '#2563eb', // Blue 600
      '#059669', // Emerald 600
      '#d97706', // Amber 600
      '#dc2626', // Red 600
      '#7c3aed', // Violet 600
      '#0891b2', // Cyan 600
      '#db2777', // Pink 600
      '#4f46e5', // Indigo 600
    ],
    positive: '#059669',
    negative: '#dc2626',
  },
};

/**
 * resolveTheme — Retorna a configuração de tema correta.
 * Uso: const T = resolveTheme(theme);
 *
 * @param theme - string do tema ('dark'|'neon'|'ocean'|'sunset'|'minimal'|'corporate')
 * @returns ThemeConfig com todas as cores necessárias
 */
export function resolveTheme(theme?: string): ThemeConfig {
  return THEMES[theme ?? 'dark'] ?? THEMES['dark'];
}

/**
 * formatValue — Utilitário padrão para formatação de números UHD 4K.
 * Suporta abreviação (k, M) se não houver unidade, e toLocaleString para milhares.
 */
export const formatValue = (n: number, unit = '') => {
  if (!unit) {
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (Math.abs(n) >= 1_000)     return (n / 1_000).toFixed(1) + 'k';
  }
  const rounded = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return unit ? `${rounded}${unit}` : n.toLocaleString('pt-BR');
};
