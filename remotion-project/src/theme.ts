// remotion-project/src/theme.ts
// Novo Design System GiantAnimator 4K (Filosofia 4K UHD)

export const Theme = {
  // CANVAS
  canvas: {
    width: 3840,
    height: 2160,
    background: '#0f1117',         // Fundo escuro premium (padrão)
    backgroundLight: '#f8f9fc',    // Fundo claro (alternativo)
  },

  // CORES DAS SÉRIES (ordem de uso)
  chartColors: [
    '#4f8ef7',   // Azul primário — série 1
    '#f97316',   // Laranja — série 2
    '#22d3a5',   // Turquesa — série 3
    '#a78bfa',   // Violeta — série 4
    '#fb7185',   // Rosa — série 5
    '#facc15',   // Amarelo dourado — série 6
    '#38bdf8',   // Azul céu — série 7
    '#4ade80',   // Verde — série 8
  ],

  colors: {
    background: '#0f1117',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    grid: '#1e2433',
    axis: '#2d3548',
    accent: '#4f8ef7',
    
    categorical: [
      '#4f8ef7', '#f97316', '#22d3a5', '#a78bfa',
      '#fb7185', '#facc15', '#38bdf8', '#4ade80'
    ],

    semantic: {
      positive: '#22c55e',
      negative: '#ef4444',
      neutral:  '#64748b',
      highlight: '#fbbf24',
      warning:  '#f97316',
    },

    ui: {
      gridline:     '#1e2433',
      gridlineLight:'#e5e7eb',
      axisLine:     '#2d3548',
      axisText:     '#94a3b8',
      axisTextLight:'#64748b',
      border:       '#1e2433',
    },
  },

  // TIPOGRAFIA (escalada para 4K)
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    titleSize: 72,
    titleWeight: 700,
    titleColor: '#f1f5f9',
    subtitleSize: 42,
    subtitleWeight: 400,
    subtitleColor: '#94a3b8',
    dataLabelSize: 36,
    axisLabelSize: 30,
    axisTitleSize: 32,
    legendSize: 34,
    
    // Objetos mantidos para compatibilidade com o que já fiz
    title: { size: 72, weight: 700, color: '#f1f5f9' },
    subtitle: { size: 42, weight: 400, color: '#94a3b8' },
    value: { size: 36, weight: 700, color: '#f1f5f9' },
    axis: { size: 30, weight: 400, color: '#94a3b8' },
    axisTitle: { size: 32, weight: 500, color: '#64748b' },
    legend: { size: 34, weight: 500, color: '#cbd5e1' },
    category: { size: 36, weight: 600, color: '#f1f5f9' },
  },

  // ESPAÇAMENTOS (escalados para 4K)
  spacing: {
    safeZone: 128,         // Safe Zone Lateral 4K
    safeZoneVertical: {
      top: 160,
      bottom: 80,
    },
    usableWidth: 3584,     // 3840 - (128 * 2)
    usableHeight: 1920,    // 2160 - 160 - 80
    cx: 1920,              // 128 + 3584 / 2
    cy: 1120,              // 160 + 1920 / 2
    
    padding: 128,          
    titleHeight: 160,
    legendHeight: 80,
    axisLeft: 160,
    axisBottom: 100,
    barRadius: 6,
    dotRadius: 10,
    gap: 12,
  },

  // ANIMAÇÃO
  animation: {
    durationInFrames: 600,
    animationFrames: 120,
    fps: 30,
    transitionFrames: 18,
    easing: [0.1, 0, 0.1, 1], // Flourish Standard: [x1, y1, x2, y2]
  },

  // EFEITOS VISUAIS
  effects: {
    shadowColor: 'rgba(0,0,0,0.4)',
    shadowBlur: 20,
    areaOpacity: 0.25,
    barGradient: true,
    highlightScale: 1.04,
    legendIconSize: 32,    // Mínimo 32px
    minLegendFont: 28,     // Mínimo 28px
    internalLabelMin: 24,  // Mínimo 24px
    internalLabelFactor: 0.08, // fontSize = radius * factor
  },
} as const;

export const THEME = Theme;
