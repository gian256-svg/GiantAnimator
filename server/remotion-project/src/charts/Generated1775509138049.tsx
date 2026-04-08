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

interface MultiLineChartProps {
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

// Helper para gerar o path SVG com cubic-bezier [REGRAS POR TIPO DE GRÁFICO -> Line Chart -> Smooth/curva]
const getSmoothPath = (points: { x: number; y: number }[]): string => {
  if (points.length < 2) {
    return '';
  }

  let path = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];

    // Control points for a "cubic-bezier" effect with horizontal tangency approximation
    // This creates a smooth curve without complex slope calculations.
    const controlPointXOffset = (p1.x - p0.x) * 0.3; // Adjust this factor (e.g., 0.3 to 0.5) for more or less curve

    const c1x = p0.x + controlPointXOffset;
    const c1y = p0.y; // First control point keeps same Y as P0
    const c2x = p1.x - controlPointXOffset;
    const c2y = p1.y; // Second control point keeps same Y as P1

    path += ` C ${c1x},${c1y} ${c2x},${c2y} ${p1.x},${p1.y}`;
  }
  return path;
};

export const MultiLineChart: React.FC<MultiLineChartProps> = ({
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

  // Legenda [REGRAS POR TIPO DE GRÁFICO -> Multi-Line Chart -> Legenda]
  const LEGEND_WIDTH = Math.round(180 * scale);
  const LEGEND_PADDING = Math.round(15 * scale);
  const LEGEND_ITEM_HEIGHT = Math.round(20 * scale);
  const LEGEND_X = width - PLOT_AREA_PADDING - LEGEND_WIDTH;
  const LEGEND_Y = PLOT_AREA_PADDING + TITLE_HEIGHT;

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT - X_AXIS_LABEL_HEIGHT;

  const plotAreaX = PLOT_AREA_PADDING + Y_AXIS_LABEL_WIDTH;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT;
  // Ajusta plotWidth para deixar espaço para a legenda à direita
  const plotWidth = chartWidth - Y_AXIS_LABEL_WIDTH - LEGEND_WIDTH - LEGEND_PADDING;
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
  const allDataPoints = series.flatMap(s => s.data);
  const maxValue = Math.max(...allDataPoints, 0); // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  const numPoints = labels.length;

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const legendFontSize = Math.round(12 * scale);
  // const valueLabelFontSize = Math.round(12 * scale); // Para labels dos pontos, se ativados

  // Cores [REGRAS DE CORES]
  const defaultColors = [
    '#7CB5EC', '#F7A35C', '#90ED7D', '#E4D354', '#8085E9', '#F15C80', '#2B908F', '#E75480',
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

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering MultiLineChart frame ${frame}.`);

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
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
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
                {formatNumber(tickValue)}
              </text>
            </React.Fragment>
          );
        })}

        {/* Linhas e Pontos [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
        {series.map((s, seriesIndex) => {
          const lineColor = defaultColors[seriesIndex % defaultColors.length];
          const points = s.data.map((value, dataIndex) => {
            // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
            const x = numPoints > 1
              ? plotAreaX + dataIndex * (plotWidth / (numPoints - 1))
              : plotAreaX + plotWidth / 2; // Centraliza se só há 1 ponto

            const y = maxValue > 0
              ? plotAreaY + plotHeight - (value / maxValue) * plotHeight
              : plotAreaY + plotHeight; // Se maxValue é 0, todos os pontos ficam na base

            // [EDGE CASES E ROBUSTEZ] - NaN protection
            const safeX = isNaN(x) ? 0 : x;
            const safeY = isNaN(y) ? 0 : y;

            return { x: safeX, y: safeY };
          });

          const pathD = getSmoothPath(points);
          // Estimativa do comprimento do path para strokeDashoffset [REGRAS DE ANIMAÇÃO]
          // Usamos um valor grande o suficiente para cobrir qualquer linha no plot,
          // evitando `getTotalLength()` que exige acesso ao DOM.
          const estimatedPathLength = 2 * Math.max(width, height);

          // Animação de desenho da linha (strokeDashoffset)
          const lineDrawStart = 20 + seriesIndex * 15; // Staggered start para cada linha
          const lineDrawEnd = lineDrawStart + 50;
          const animatedDashoffset = interpolate(
            frame,
            [lineDrawStart, lineDrawEnd],
            [estimatedPathLength, 0],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          // Animação dos pontos
          const dotAppearStart = lineDrawEnd - 10; // Os pontos aparecem no final do desenho da linha
          const dotRadius = Math.round(6 * scale); // [Line Chart] 6px raio
          const showDotsThreshold = 20; // [Line Chart] mostra pontos apenas quando < 20 pontos
          const shouldShowDots = numPoints < showDotsThreshold;

          return (
            <React.Fragment key={`series-${seriesIndex}`}>
              {/* Linha da série */}
              <path
                d={pathD}
                fill="none"
                stroke={lineColor}
                strokeWidth={Math.round(2.5 * scale)} // [Line Chart] 2.5px para série principal
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={estimatedPathLength}
                strokeDashoffset={animatedDashoffset}
                opacity={1}
              />
              {/* Pontos da série */}
              {shouldShowDots && points.map((point, pointIndex) => {
                const dotOpacity = interpolate(
                  frame,
                  [dotAppearStart + pointIndex * 2, dotAppearStart + pointIndex * 2 + 15], // Aparência escalonada dos pontos
                  [0, 1],
                  {
                    extrapolateRight: 'clamp',
                    config: SPRING_CONFIG_LABELS,
                  }
                );
                const dotScale = interpolate(
                  frame,
                  [dotAppearStart + pointIndex * 2, dotAppearStart + pointIndex * 2 + 15],
                  [0, 1],
                  {
                    extrapolateRight: 'clamp',
                    config: SPRING_CONFIG_LABELS,
                  }
                );
                return (
                  <circle
                    key={`dot-${seriesIndex}-${pointIndex}`}
                    cx={point.x}
                    cy={point.y}
                    r={dotRadius}
                    fill={lineColor}
                    opacity={dotOpacity}
                    transform={`scale(${dotScale})`}
                    transformOrigin={`${point.x}px ${point.y}px`}
                  />
                );
              })}
            </React.Fragment>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const x = numPoints > 1
            ? plotAreaX + index * (plotWidth / (numPoints - 1))
            : plotAreaX + plotWidth / 2; // Centraliza se só há 1 ponto

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

        {/* Legenda [REGRAS POR TIPO DE GRÁFICO -> Multi-Line Chart] */}
        <g transform={`translate(${LEGEND_X}, ${LEGEND_Y})`}>
          {series.map((s, index) => {
            const legendOpacity = interpolate(frame, [60 + index * 5, 80 + index * 5], [0, 1], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            });
            const legendColor = defaultColors[index % defaultColors.length];
            return (
              <g key={`legend-${index}`} transform={`translate(0, ${index * LEGEND_ITEM_HEIGHT})`} opacity={legendOpacity}>
                <rect x={0} y={Math.round(4 * scale)} width={Math.round(10 * scale)} height={Math.round(10 * scale)} fill={legendColor} />
                <text
                  x={Math.round(18 * scale)}
                  y={Math.round(12 * scale)}
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
