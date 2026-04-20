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
  safeZoneX: 192,   // lateral (cada lado) - 10% total de margem (5% cada lado)
  safeZoneTop: 144, // topo (espaço para header)
  safeZoneBottom: 72, // rodapé (espaço para legenda)

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
    grid:       'rgba(232,234,246,0.12)', // Aumentado para visibilidade UHD (Preferência Estética)
    axis:       'rgba(232,234,246,0.25)',
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
    grid:       'rgba(30,64,175,0.15)', // Aumentado contraste (era 0.08)
    axis:       'rgba(30,64,175,0.35)', // Aumentado contraste (era 0.2)
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
    grid:       'rgba(15,23,42,0.22)', // Mais escuro para fundo claro (Preferência Estética)
    axis:       'rgba(15,23,42,0.4)',  // Mais escuro para fundo claro
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

  // ── Obsidian (Cyber Financial — Bloomberg/Terminal Style) ────────────────
  obsidian: {
    background: '#080808',
    surface:    '#121212',
    text:       '#00ffea', // Ciano elétrico
    textMuted:  '#5d5d5d',
    grid:       'rgba(0,255,234,0.05)',
    axis:       'rgba(0,255,234,0.2)',
    colors: [
      '#00ffea', // Ciano
      '#ff0055', // Magenta
      '#00ffa2', // Menta
      '#7000ff', // Roxo
      '#ffd500', // Sol
      '#0084ff', // Azul
      '#ff6200', // Laranja
      '#ffffff', // Branco
    ],
    positive: '#00ffa2',
    negative: '#ff0055',
  },

  // ── Champagne (Executive Luxury — WSJ / High-End Finance) ───────────────
  champagne: {
    background: '#F9F5F0',
    surface:    '#ffffff',
    text:       '#1A1A1A',
    textMuted:  '#666666',
    grid:       'rgba(26,26,26,0.12)', // Aumentado contraste (era 0.06)
    axis:       'rgba(26,26,26,0.3)',  // Aumentado contraste (era 0.15)
    colors: [
      '#003366', // Marinho Real
      '#C5A021', // Ouro Velho
      '#4A4A4A', // Grafite
      '#800000', // Bordeaux
      '#006600', // Hunter Green
      '#666666', // Cinza
      '#996633', // Bronze
      '#333333', // Preto
    ],
    positive: '#006600',
    negative: '#800000',
  },

  // ── Emerald (ESG Eco-Growth — Nature & Sustainability) ──────────────────
  emerald: {
    background: '#0B1A12',
    surface:    '#122A1E',
    text:       '#E2F3E7',
    textMuted:  '#4ADE80',
    grid:       'rgba(74,222,128,0.08)',
    axis:       'rgba(74,222,128,0.2)',
    colors: [
      '#10B981', // Esmeralda
      '#4ADE80', // Lima
      '#34D399', // Menta
      '#059669', // Floresta
      '#D1FAE5', // Menta gelo
      '#14B8A6', // Teal
      '#84CC16', // Citrus
      '#FACC15', // Amarelo sol
    ],
    positive: '#4ADE80',
    negative: '#F87171',
  },

  // ── Volcano (Social Impact / Hot News — Breaking Impact) ───────────────
  volcano: {
    background: '#1C0505',
    surface:    '#2D0808',
    text:       '#FFFFFF',
    textMuted:  '#FFA500',
    grid:       'rgba(255,165,0,0.1)',
    axis:       'rgba(255,165,0,0.25)',
    colors: [
      '#FF4500', // Laranja Vulcão
      '#FF0000', // Vermelho Sangue
      '#FFD700', // Ouro
      '#8B0000', // Dark Red
      '#FFA500', // Orange
      '#FF6347', // Tomato
      '#FF7F50', // Coral
      '#FFFFFF', // White
    ],
    positive: '#FFD700',
    negative: '#FF4500',
  },

  // ── Frost (Tech Startup Clean — Stripe / Modern Minimal) ───────────────
  frost: {
    background: '#F0F4F8',
    surface:    '#FFFFFF',
    text:       '#1E293B',
    textMuted:  '#64748B',
    grid:       'rgba(30,41,59,0.05)',
    axis:       'rgba(30,41,59,0.15)',
    colors: [
      '#0061FF', // Azul Cobalto
      '#6366F1', // Lavanda
      '#3B82F6', // Azul Sky
      '#10B981', // Esmeralda
      '#0EA5E9', // Ciano
      '#8B5CF6', // Roxo
      '#F43F5E', // Rose
      '#F59E0B', // Amber
    ],
    positive: '#10B981',
    negative: '#F43F5E',
  },

  // ── Glass (Glassmorphism — Blurred glass, frosted UI, luxury tech) ────────
  glass: {
    background: '#0D1117',
    surface:    '#161B22',
    text:       '#F0F6FC',
    textMuted:  '#8B949E',
    grid:       'rgba(240,246,252,0.06)',
    axis:       'rgba(240,246,252,0.18)',
    colors: [
      '#58A6FF', // Azul cristal
      '#3FB950', // Verde verde
      '#E3B341', // Dourado
      '#F78166', // Coral
      '#D2A8FF', // Lilás translúcido
      '#79C0FF', // Azul gelo
      '#56D364', // Verde menta
      '#FFA657', // Laranja suave
    ],
    positive: '#3FB950',
    negative: '#F78166',
  },

  // ── Bloomberg (Cyber Financial — Terminal grade, high precision) ──────────
  bloomberg: {
    background: '#000000',
    surface:    '#0A0A0A',
    text:       '#FF6600',    // Laranja terminal Bloomberg
    textMuted:  '#CC5200',
    grid:       'rgba(255,102,0,0.08)',
    axis:       'rgba(255,102,0,0.3)',
    colors: [
      '#FF6600', // Bloomberg Orange
      '#00FFAA', // Teal positivo
      '#FFDD00', // Amarelo cotação
      '#FF3333', // Vermelho queda
      '#00CCFF', // Ciano análise
      '#AA66FF', // Roxo volume
      '#FF9900', // Âmbar alerta
      '#FFFFFF', // Branco destaque
    ],
    positive: '#00FFAA',
    negative: '#FF3333',
  },

  // ── Aurora (Northern Lights — Gradient sky, ethereal data beauty) ─────────
  aurora: {
    background: '#030712',
    surface:    '#0A0F1E',
    text:       '#E2E8F0',
    textMuted:  '#94A3B8',
    grid:       'rgba(99,102,241,0.07)',
    axis:       'rgba(99,102,241,0.2)',
    colors: [
      '#818CF8', // Índigo aurora
      '#34D399', // Verde boreal
      '#F472B6', // Rosa polar
      '#60A5FA', // Azul ártico
      '#A78BFA', // Violeta
      '#2DD4BF', // Turquesa
      '#FBBF24', // Amarelo estrela
      '#FB7185', // Rosa quente
    ],
    positive: '#34D399',
    negative: '#FB7185',
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
  const normalizedTheme = (theme || 'dark').toLowerCase();
  return THEMES[normalizedTheme] ?? THEMES['dark'];
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
