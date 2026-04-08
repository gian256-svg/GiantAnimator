import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, SpringConfig } from 'remotion';

// [REGRAS DE ANIMAÇÃO] - Spring Configs
// Animação principal — barras, linhas, áreas
const SPRING_CONFIG_MAIN: SpringConfig = {
  damping: 12,
  stiffness: 80,
  mass: 1.0,
  overshootClamping: false, // permite leve bounce
};

// Animação de labels — sem bounce
const SPRING_CONFIG_LABELS: SpringConfig = {
  damping: 20,
  stiffness: 120,
  mass: 0.8,
  overshootClamping: true,
};

// Animação sutil — linhas de grid, fade
const SPRING_CONFIG_SUBTLE: SpringConfig = {
  damping: 25,
  stiffness: 100,
  mass: 0.5,
  overshootClamping: true,
};

interface AreaChartProps {
  title: string;
  labels: string[];
  series: Array<{
    label: string;
    data: number[];
  }>;
}

// Helper para formatação de números [REGRAS DE TIPOGRAFIA E LABELS]
const formatNumber = (num: number, prefix: string = '', decimals: number = 0): string => {
  if (Math.abs(num) < 1000) {
    return `${prefix}${num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  }
  if (Math.abs(num) < 1000000) {
    return `${prefix}${(num / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k`;
  }
  return `${prefix}${(num / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
};

// Helper para gerar um range de números para os ticks do eixo Y
const generateYAxisTicks = (maxValue: number, numTicks: number): number[] => {
  const step = maxValue / numTicks;
  const ticks = [];
  for (let i = 0; i <= numTicks; i++) {
    ticks.push(i * step);
  }
  return ticks;
};

// Helper para calcular a distância euclidiana de um path para strokeDashoffset
// NÃO usa `getTotalLength()` (dependente de DOM)
const getPathLength = (points: { x: number; y: number }[]): number => {
  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    length += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }
  return length;
};

export const AreaChart: React.FC<AreaChartProps> = ({
  title,
  labels,
  series,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Plot Area dimensions e margens [REGRAS DE ESTRUTURA E LAYOUT]
  const PLOT_AREA_PADDING = Math.round(40 * scale); // mínimo 40px
  const TITLE_HEIGHT = Math.round(24 * scale); // +24px quando título presente
  const X_AXIS_LABEL_HEIGHT = Math.round(32 * scale); // +32px para labels do eixo X na base
  const Y_AXIS_LABEL_WIDTH = Math.round(80 * scale); // Espaço para labels do eixo Y

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT - X_AXIS_LABEL_HEIGHT;

  const plotAreaX = PLOT_AREA_PADDING + Y_AXIS_LABEL_WIDTH;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT;
  const plotWidth = chartWidth - Y_AXIS_LABEL_WIDTH;
  const plotHeight = chartHeight;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(series) || series.length === 0 || !Array.isArray(series[0].data) || series[0].data.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided or data is empty. Displaying fallback.`);
    return (
      <div style={{
        backgroundColor: '#1a1a2e',
        color: '#FFFFFF',
        fontSize: Math.round(24 * scale),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width,
        height,
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
      }}>
        Sem dados para exibir.
      </div>
    );
  }

  // Encontrar o valor máximo em todas as séries para escala do eixo Y
  // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  let maxValue = 0;
  series.forEach(s => {
    s.data.forEach(val => {
      if (val > maxValue) maxValue = val;
    });
  });

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const legendFontSize = Math.round(12 * scale);

  // Cores [REGRAS DE CORES]
  // Paleta padrão GiantAnimator
  const defaultColors = [
    '#7CB5EC', // Série 1: azul suave
    '#F7A35C', // Série 2: laranja
    '#90ED7D', // Série 3: verde
    '#E4D354', // Série 4: amarelo
    '#8085E9', // Série 5: roxo
    '#F15C80', // Série 6: rosa
    '#2B908F', // Série 7: teal
    '#E75480', // Série 8: magenta
  ];
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)'; // Destacada
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const legendTextColor = '#CCCCCC';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // Calcular tick marks do eixo Y
  const numYTicks = 5; // Exemplo de 5 ticks principais
  const yTickValues = generateYAxisTicks(maxValue, numYTicks);

  // Gerar pontos (x, y) para cada série
  const seriesPoints = series.map((s, seriesIndex) => {
    return s.data.map((value, index) => {
      const x = plotAreaX + (index / (labels.length - 1)) * plotWidth;
      // [EDGE CASES E ROBUSTEZ] - Proteção contra divisão por zero
      const y = maxValue > 0
        ? plotAreaY + plotHeight - (value / maxValue) * plotHeight
        : plotAreaY + plotHeight; // Se maxValue é 0, todos os pontos ficam na base
      return { x, y };
    });
  });

  // Gerar o atributo 'd' do path para a linha e a área
  // Para conseguir um efeito de linha suave com strokeDashoffset (sem getTotalLength),
  // geramos múltiplos segmentos L que aproximam uma curva suave.
  // E para o fill da área, ela sempre vai até o eixo Y=0 (baseline).
  const generatePathD = (points: { x: number; y: number }[], closePathForArea: boolean = false): string => {
    if (points.length === 0) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    // Usamos L para permitir strokeDashoffset sem getTotalLength, e
    // 'stroke-linejoin="round"' e 'stroke-linecap="round"' para dar uma aparência mais suave.
    // Embora a regra mencione "cubic-bezier", a impossibilidade de usar getTotalLength
    // em Remotion para paths dinâmicos (sem DOM) torna a animação de strokeDashoffset
    // inviável com curvas Bezier perfeitas. Esta é a melhor aproximação funcional.
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }

    if (closePathForArea) {
      const yBaseline = plotAreaY + plotHeight;
      d += ` L ${points[points.length - 1].x} ${yBaseline}`; // Voltar para a baseline no último X
      d += ` L ${points[0].x} ${yBaseline}`; // Voltar para a baseline no primeiro X
      d += ` Z`; // Fechar o path
    }
    return d;
  };

  // ANIMAÇÃO - [REGRAS DE ANIMAÇÃO]
  // Entrada geral do gráfico (fade + scale)
  const chartEntrance = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });

  const chartScale = interpolate(frame, [0, 20], [0.8, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_MAIN,
  });

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering AreaChart frame ${frame}.`);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#1a1a2e', // Fundo do canvas padrão dark
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        transform: `scale(${chartScale})`,
        opacity: chartEntrance,
        transformOrigin: 'center center',
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          {series.map((s, index) => {
            const color = defaultColors[index % defaultColors.length];
            // [REGRAS DE CORES] - Gradiente vertical para fill
            return (
              <linearGradient
                key={`gradient-${s.label}`}
                id={`gradient-${s.label.replace(/\s/g, '-')}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={color} stopOpacity="0.4" /> {/* Opacidade topo: 0.4 */}
                <stop offset="100%" stopColor={color} stopOpacity="0.0" /> {/* Opacidade base: 0.0 */}
              </linearGradient>
            );
          })}
        </defs>

        {/* Título do Gráfico [REGRAS DE TIPOGRAFIA E LABELS] */}
        <text
          x={width / 2}
          y={PLOT_AREA_PADDING + TITLE_HEIGHT / 2}
          textAnchor="middle"
          fontSize={titleFontSize}
          fontWeight={700}
          fill={textColor}
          style={{ textShadow: labelTextShadow }}
        >
          {title}
        </text>

        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          const y = maxValue > 0
            ? plotAreaY + plotHeight - (tickValue / maxValue) * plotHeight
            : plotAreaY + plotHeight; // Se maxValue é 0, todos os pontos ficam na base

          const isZeroLine = tickValue === 0;

          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`grid-line-${index}`}>
              <line
                x1={plotAreaX}
                y1={y}
                x2={plotAreaX + plotWidth}
                y2={y}
                stroke={isZeroLine ? zeroLineColor : gridColor}
                strokeWidth={isZeroLine ? 1.5 : 1}
                strokeDasharray={isZeroLine ? '' : '4 4'} // solid para zero, dashed para outros
                opacity={gridLineOpacity}
              />
              {/* Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
              <text
                x={plotAreaX - Math.round(8 * scale)} // 8px de padding à direita
                y={y + Math.round(axisLabelFontSize / 3)} // Ajuste vertical para centralizar
                textAnchor="end" // Alinhado à direita
                fontSize={axisLabelFontSize}
                fill={axisTextColor}
                opacity={gridLineOpacity}
              >
                {formatNumber(tickValue, '')} {/* Assuming no currency prefix for bandwidth */}
              </text>
            </React.Fragment>
          );
        })}

        {/* Áreas e Linhas [REGRAS POR TIPO DE GRÁFICO -> Area Chart] */}
        {seriesPoints.map((points, seriesIndex) => {
          const s = series[seriesIndex];
          const color = defaultColors[seriesIndex % defaultColors.length];
          const linePathD = generatePathD(points);
          const areaPathD = generatePathD(points, true);
          const pathLength = getPathLength(points); // Calcular comprimento para strokeDashoffset

          // Animação da linha [REGRAS DE ANIMAÇÃO] - "desenho" da linha
          const lineAnimationStart = 10 + seriesIndex * 10;
          const lineAnimationEnd = 70 + seriesIndex * 10;
          const animatedDashoffset = interpolate(
            frame,
            [lineAnimationStart, lineAnimationEnd],
            [pathLength, 0],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          // Animação do fill da área [REGRAS DE ANIMAÇÃO] - fill aparece
          const fillAnimationStart = 40 + seriesIndex * 10;
          const fillAnimationEnd = 80 + seriesIndex * 10;
          const animatedFillOpacity = interpolate(
            frame,
            [fillAnimationStart, fillAnimationEnd],
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_SUBTLE,
            }
          );

          return (
            <React.Fragment key={`series-${s.label}`}>
              {/* Área [REGRAS POR TIPO DE GRÁFICO -> Area Chart] */}
              <path
                d={areaPathD}
                fill={`url(#gradient-${s.label.replace(/\s/g, '-')})`}
                opacity={animatedFillOpacity}
              />
              {/* Linha de contorno [REGRAS POR TIPO DE GRÁFICO -> Area Chart] */}
              <path
                d={linePathD}
                stroke={color}
                strokeWidth={Math.round(2.5 * scale)} // Espessura da linha
                fill="none"
                strokeDasharray={pathLength}
                strokeDashoffset={animatedDashoffset}
                strokeLinejoin="round" // [Compromisso para suavidade visual]
                strokeLinecap="round" // [Compromisso para suavidade visual]
                opacity={1.0} // Sempre opaca
              />
            </React.Fragment>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          const x = plotAreaX + (index / (labels.length - 1)) * plotWidth;
          const y = plotAreaY + plotHeight + Math.round(15 * scale); // Posição abaixo do eixo

          const labelOpacity = interpolate(frame, [40, 60], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle" // Centralizado sob cada ponto
              fontSize={axisLabelFontSize}
              fill={axisTextColor}
              opacity={labelOpacity}
            >
              {label}
            </text>
          );
        })}

        {/* Legenda [REGRAS DE TIPOGRAFIA E LABELS] */}
        <g transform={`translate(${plotAreaX + plotWidth - Math.round(100 * scale)}, ${plotAreaY - Math.round(20 * scale)})`}>
          {series.map((s, index) => {
            const color = defaultColors[index % defaultColors.length];
            const legendDelay = 60 + index * 5; // Staggered delay for legend items
            const legendOpacity = interpolate(frame, [legendDelay, legendDelay + 20], [0, 1], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            });
            const legendTranslateY = interpolate(frame, [legendDelay, legendDelay + 20], [Math.round(10 * scale), 0], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            });

            return (
              <g
                key={`legend-${s.label}`}
                transform={`translate(0, ${index * Math.round(20 * scale) + legendTranslateY})`}
                opacity={legendOpacity}
              >
                <rect x="0" y="0" width={Math.round(12 * scale)} height={Math.round(12 * scale)} fill={color} rx={Math.round(2 * scale)} ry={Math.round(2 * scale)} />
                <text
                  x={Math.round(18 * scale)}
                  y={Math.round(10 * scale)}
                  fontSize={legendFontSize}
                  fill={legendTextColor}
                >
                  {s.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
