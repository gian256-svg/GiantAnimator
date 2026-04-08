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

// [REGRAS DE CORES] - Paleta padrão GiantAnimator (quando sem referência)
const GIANT_ANIMATOR_PALETTE = [
  '#7CB5EC', // Azul suave
  '#F7A35C', // Laranja
  '#90ED7D', // Verde
  '#E4D354', // Amarelo
  '#8085E9', // Roxo
  '#F15C80', // Rosa
  '#2B908F', // Teal
  '#E75480', // Magenta
];

// Helper para formatação de números [REGRAS DE TIPOGRAFIA E LABELS]
const formatNumber = (num: number, decimals: number = 0): string => {
  if (Math.abs(num) < 1000) {
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  if (Math.abs(num) < 1000000) {
    return `${(num / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k`;
  }
  return `${(num / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
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

// Helper para aproximar o comprimento do path para animação strokeDashoffset
// [REGRAS DE ANIMAÇÃO] - Sem window/document, usamos aproximação Euclidiana
const approximatePathLength = (points: { x: number; y: number }[]): number => {
  let length = 0;
  if (points.length < 2) return 0;
  for (let i = 0; i < points.length - 1; i++) {
    length += Math.sqrt(
      Math.pow(points[i + 1].x - points[i].x, 2) +
      Math.pow(points[i + 1].y - points[i].y, 2)
    );
  }
  return length;
};

// Helper para gerar o caminho SVG de uma curva cúbica de Bezier [REGRAS POR TIPO DE GRÁFICO -> Line Chart]
const getBezierPath = (points: { x: number; y: number }[], tension: number = 0.4): string => {
  if (points.length < 2) return '';

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i === 0 ? points[0] : points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i === points.length - 2 ? points[i + 1] : points[i + 2];

    // Calculando pontos de controle para uma curva suave (aproximação Catmull-Rom)
    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;

    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
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
  const Y_AXIS_LABEL_WIDTH = Math.round(50 * scale); // Espaço para labels do eixo Y

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
  
  // Calcular valor máximo para o eixo Y, sempre começando em 0 [REGRAS DE ESTRUTURA E LAYOUT]
  const allDataPoints = series.flatMap(s => s.data);
  const maxValue = Math.max(...allDataPoints, 0); 
  
  const numDataPoints = labels.length;
  const xStep = numDataPoints > 1 ? plotWidth / (numDataPoints - 1) : 0;

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const legendFontSize = Math.round(12 * scale);
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // Cores [REGRAS DE CORES]
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)'; // Destacada
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const legendTextColor = '#CCCCCC';

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

        {/* Legenda [REGRAS POR TIPO DE GRÁFICO -> Multi-Line Chart] */}
        <g 
          transform={`translate(${plotAreaX + plotWidth - Math.round(10 * scale)}, ${plotAreaY - Math.round(10 * scale)})`}
          opacity={interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_LABELS })}
        >
          {series.map((s, idx) => (
            <g key={s.label} transform={`translate(0, ${idx * Math.round(20 * scale)})`}>
              <rect 
                x={-Math.round(20 * scale)} 
                y={-Math.round(8 * scale)} 
                width={Math.round(12 * scale)} 
                height={Math.round(12 * scale)} 
                fill={GIANT_ANIMATOR_PALETTE[idx % GIANT_ANIMATOR_PALETTE.length]} 
                rx={Math.round(2 * scale)}
              />
              <text 
                x={0} 
                y={0} 
                fontSize={legendFontSize} 
                fill={legendTextColor} 
                alignmentBaseline="middle"
                textAnchor="end" // Alinhado à direita do ícone
              >
                {s.label}
              </text>
            </g>
          ))}
        </g>


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

        {/* Linhas e Pontos das Séries [REGRAS POR TIPO DE GRÁFICO -> Multi-Line Chart] */}
        {series.map((s, seriesIndex) => {
          const seriesColor = GIANT_ANIMATOR_PALETTE[seriesIndex % GIANT_ANIMATOR_PALETTE.length];
          const lineThickness = Math.round(2.5 * scale); // [Line Chart] - Espessura da linha

          // Mapear dados para pontos X, Y no plot area
          const points = s.data.map((value, dataIndex) => {
            const x = plotAreaX + dataIndex * xStep;
            // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
            const y = maxValue > 0 
              ? plotAreaY + plotHeight - (value / maxValue) * plotHeight
              : plotAreaY + plotHeight;
            return { x, y };
          });

          // Gerar o caminho SVG para a curva Bezier
          const pathD = getBezierPath(points);
          const pathLength = approximatePathLength(points); // Aproximar comprimento da linha

          // Animação de "desenho" da linha [REGRAS DE ANIMAÇÃO]
          const lineAnimationStart = 10 + seriesIndex * 10; // Staggered start
          const lineAnimationEnd = lineAnimationStart + 50; // Duração de 50 frames
          
          const animatedDashoffset = interpolate(
            frame,
            [lineAnimationStart, lineAnimationEnd],
            [pathLength, 0], // Do comprimento total até 0
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          // Animação dos pontos (dots) [REGRAS DE ANIMAÇÃO]
          const dotRadius = Math.round(6 * scale); // [Line Chart] - Tamanho do ponto
          const dotAnimationStart = lineAnimationEnd - 10; // Aparecem no final do desenho da linha

          return (
            <g key={`series-${seriesIndex}`}>
              <path
                d={pathD}
                stroke={seriesColor}
                strokeWidth={lineThickness}
                fill="none"
                strokeDasharray={pathLength}
                strokeDashoffset={animatedDashoffset}
              />
              {/* Pontos (dots) [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
              {points.map((p, dataIndex) => {
                const dotOpacity = interpolate(
                  frame,
                  [dotAnimationStart + dataIndex * 2, dotAnimationStart + dataIndex * 2 + 10], // Staggered + fade in
                  [0, 1],
                  {
                    extrapolateRight: 'clamp',
                    config: SPRING_CONFIG_LABELS,
                  }
                );
                const dotScale = interpolate(
                  frame,
                  [dotAnimationStart + dataIndex * 2, dotAnimationStart + dataIndex * 2 + 10], // Staggered + scale up
                  [0, 1],
                  {
                    extrapolateRight: 'clamp',
                    config: SPRING_CONFIG_LABELS,
                  }
                );
                // [EDGE CASES E ROBUSTEZ] - Proteger NaN nos atributos SVG
                const safeX = isNaN(p.x) ? 0 : p.x;
                const safeY = isNaN(p.y) ? 0 : p.y;
                return (
                  <circle
                    key={`dot-${seriesIndex}-${dataIndex}`}
                    cx={safeX}
                    cy={safeY}
                    r={dotRadius}
                    fill={seriesColor}
                    opacity={dotOpacity}
                    transform={`scale(${dotScale})`}
                    transformOrigin={`${safeX}px ${safeY}px`}
                  />
                );
              })}
            </g>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          const x = plotAreaX + index * xStep;
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
      </svg>
    </div>
  );
};
