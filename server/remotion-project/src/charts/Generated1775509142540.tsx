import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, SpringConfig, AbsoluteFill } from 'remotion';

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
const formatNumber = (num: number, unit: string = '', decimals: number = 0): string => {
  if (Math.abs(num) < 1000) {
    return `${num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${unit}`;
  }
  if (Math.abs(num) < 1000000) {
    return `${(num / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k${unit}`;
  }
  return `${(num / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M${unit}`;
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

// Função para calcular os pontos de controle para uma curva cubic Bezier
// Gera o segmento de Path 'C cx1,cy1 cx2,cy2 x,y' para a curva entre dois pontos
// [REGRAS POR TIPO DE GRÁFICO -> Line Chart -> Smooth/curva: usar cubic-bezier]
const getSmoothPathSegmentD = (points: { x: number; y: number }[], tension: number = 0.5): string => {
  if (points.length < 2) {
    return "";
  }
  let path = "";
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i === 0 ? points[0] : points[i - 1]; // Ponto anterior (ou o primeiro ponto se for o início)
    const p1 = points[i];                           // Ponto atual (start of segment)
    const p2 = points[i + 1];                       // Próximo ponto (end of segment)
    const p3 = i === points.length - 2 ? points[i + 1] : points[i + 2]; // Ponto posterior (ou o último se for o fim)

    // Cálculo dos pontos de controle (abordagem Catmull-Rom para Bezier)
    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;

    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

    // [EDGE CASES E ROBUSTEZ] - Proteger contra NaN em SVG (embora os cálculos acima devam ser numéricos)
    const safeCp1x = isNaN(cp1x) ? p1.x : cp1x;
    const safeCp1y = isNaN(cp1y) ? p1.y : cp1y;
    const safeCp2x = isNaN(cp2x) ? p2.x : cp2x;
    const safeCp2y = isNaN(cp2y) ? p2.y : cp2y;
    const safeP2x = isNaN(p2.x) ? p1.x : p2.x;
    const safeP2y = isNaN(p2.y) ? p1.y : p2.y;

    path += ` C ${safeCp1x} ${safeCp1y}, ${safeCp2x} ${safeCp2y}, ${safeP2x} ${safeP2y}`;
  }
  return path;
};

// Helper para estimar o comprimento de um path (linha reta + bezier) para strokeDashoffset
// [REGRAS DE ANIMAÇÃO] - strokeDashoffset precisa de pathLength
const estimatePathLength = (points: { x: number; y: number }[], tension: number = 0.5): number => {
  if (points.length < 2) {
    return 0;
  }
  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    // Adiciona a distância euclidiana direta (aproximação)
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    length += Math.sqrt(dx * dx + dy * dy);

    // Para bezier, a estimativa precisa ser mais sofisticada, mas para Remotion e performance
    // a soma das cordas é um bom ponto de partida. Uma integração numérica seria mais precisa.
    // Para animação, essa aproximação costuma ser aceitável.
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
  const TITLE_HEIGHT = Math.round(24 * scale);      // +24px quando título presente
  const X_AXIS_LABEL_HEIGHT = Math.round(32 * scale); // +32px para labels do eixo X na base
  const Y_AXIS_LABEL_WIDTH = Math.round(80 * scale);  // Espaço para labels do eixo Y

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
      <AbsoluteFill style={{
        backgroundColor: '#1a1a2e',
        color: '#FFFFFF',
        fontSize: Math.round(24 * scale),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
      }}>
        Sem dados para exibir.
      </AbsoluteFill>
    );
  }

  // Cores [REGRAS DE CORES]
  // Paleta padrão GiantAnimator
  const defaultColors = ['#7CB5EC', '#F7A35C', '#90ED7D', '#E4D354', '#8085E9', '#F15C80', '#2B908F', '#E75480'];
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)'; // Destacada
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const legendFontSize = Math.round(12 * scale);

  // Calcular máximo valor cumulativo para o eixo Y em stacked area chart
  const cumulativeValuesPerLabel: number[] = Array(labels.length).fill(0);
  series.forEach(s => {
    s.data.forEach((value, index) => {
      cumulativeValuesPerLabel[index] += value;
    });
  });
  const effectiveMaxValue = Math.max(...cumulativeValuesPerLabel, 0);

  const numYTicks = 5; // Exemplo de 5 ticks principais
  const yTickValues = generateYAxisTicks(effectiveMaxValue, numYTicks);

  // Preparar dados para rendering, incluindo stacking e coordenadas
  const allSeriesRenderData: {
    label: string;
    color: string;
    points: { x: number; y: number; originalValue: number; baseY: number; isVisible: boolean }[];
    areaPathD: string;
    linePathD: string;
    pathLength: number;
  }[] = [];

  const currentCumulativeYValues: number[] = Array(labels.length).fill(0); // Store cumulative values for stacking

  const horizontalSpacing = labels.length > 1 ? plotWidth / (labels.length - 1) : 0; // Spacing between points

  series.forEach((s, seriesIndex) => {
    const seriesColor = defaultColors[seriesIndex % defaultColors.length];
    const pointsForSeries: { x: number; y: number; originalValue: number; baseY: number; isVisible: boolean }[] = [];

    s.data.forEach((value, index) => {
      const x = plotAreaX + index * horizontalSpacing;
      
      const currentBaseCumulative = currentCumulativeYValues[index];
      const newCumulative = currentBaseCumulative + value;

      // Calcular y coordinate (topo da série atual)
      const y = effectiveMaxValue > 0
        ? plotAreaY + plotHeight - (newCumulative / effectiveMaxValue) * plotHeight
        : plotAreaY + plotHeight; // Se max é 0, todos os pontos na base

      // Calcular base Y coordinate (base da série atual)
      const baseY = effectiveMaxValue > 0
        ? plotAreaY + plotHeight - (currentBaseCumulative / effectiveMaxValue) * plotHeight
        : plotAreaY + plotHeight;

      // [EDGE CASES E ROBUSTEZ] - Proteção contra NaN em coordenadas
      pointsForSeries.push({ 
        x: isNaN(x) ? 0 : x, 
        y: isNaN(y) ? 0 : y, 
        originalValue: value, 
        baseY: isNaN(baseY) ? 0 : baseY,
        isVisible: true // Assumimos visível, pode ser ajustado para clipping
      });
      currentCumulativeYValues[index] = newCumulative; // Atualiza cumulativo para a próxima série
    });

    // Gerar Path Data para a linha superior curva e para a área preenchida
    let areaPathD = "";
    let linePathD = "";
    let pathLength = 0;

    if (pointsForSeries.length > 0) {
      const firstPoint = pointsForSeries[0];
      const lastPoint = pointsForSeries[pointsForSeries.length - 1];

      // Segmento da linha superior (apenas os comandos 'C ...')
      const topPathSegment = getSmoothPathSegmentD(pointsForSeries);

      // Path completo para a área
      areaPathD = `M ${firstPoint.x} ${firstPoint.baseY}
        L ${firstPoint.x} ${firstPoint.y}
        ${topPathSegment}
        L ${lastPoint.x} ${lastPoint.baseY}
        Z`;
      
      // Path para a linha de contorno
      linePathD = `M ${firstPoint.x} ${firstPoint.y} ${topPathSegment}`;

      // Estimar comprimento do path para animação strokeDashoffset
      pathLength = estimatePathLength(pointsForSeries);
    }

    allSeriesRenderData.push({ 
      label: s.label, 
      color: seriesColor, 
      points: pointsForSeries, 
      areaPathD, 
      linePathD, 
      pathLength 
    });
  });

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
    <AbsoluteFill
      style={{
        backgroundColor: '#1a1a2e', // Fundo do canvas padrão dark
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        transform: `scale(${chartScale})`,
        opacity: chartEntrance,
        transformOrigin: 'center center',
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Definições de Gradientes para o Preenchimento das Áreas [REGRAS DE CORES] */}
        <defs>
          {allSeriesRenderData.map((s, index) => (
            <linearGradient key={`grad-${index}`} id={`areaGradient-${index}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.4" /> {/* Opacidade topo: 0.4 */}
              <stop offset="100%" stopColor={s.color} stopOpacity="0.0" /> {/* Opacidade base: 0.0 */}
            </linearGradient>
          ))}
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
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const y = effectiveMaxValue > 0 
            ? plotAreaY + plotHeight - (tickValue / effectiveMaxValue) * plotHeight
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
                {formatNumber(tickValue, ' Mbps', 1)}
              </text>
            </React.Fragment>
          );
        })}

        {/* Áreas Preenchidas e Linhas de Contorno [REGRAS POR TIPO DE GRÁFICO -> Area Chart] */}
        {allSeriesRenderData.map((seriesData, seriesIndex) => {
          // Animação da linha primeiro, depois o fill aparece
          const lineAnimationStart = 10 + seriesIndex * 15; // Staggered start
          const lineAnimationEnd = lineAnimationStart + 50;

          const fillAnimationStart = lineAnimationEnd - 10; // Começa antes da linha terminar
          const fillAnimationEnd = fillAnimationStart + 30;

          // Animação de desenho da linha (strokeDashoffset)
          const animatedDashoffset = interpolate(
            frame,
            [lineAnimationStart, lineAnimationEnd],
            [seriesData.pathLength, 0], // Do comprimento total a 0
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          // Animação de opacidade do preenchimento da área
          const animatedFillOpacity = interpolate(
            frame,
            [fillAnimationStart, fillAnimationEnd],
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_SUBTLE,
            }
          );
          
          if (seriesData.points.length === 0) return null;

          return (
            <React.Fragment key={`series-${seriesData.label}`}>
              {/* Área Preenchida */}
              <path
                d={seriesData.areaPathD}
                fill={`url(#areaGradient-${seriesIndex})`} // Gradiente vertical
                fillOpacity={animatedFillOpacity}
                stroke="none"
              />
              {/* Linha de Contorno [REGRAS POR TIPO DE GRÁFICO -> Area Chart] */}
              <path
                d={seriesData.linePathD}
                fill="none"
                stroke={seriesData.color} // Mesma cor do fill com opacity 1.0
                strokeWidth={seriesIndex === 0 ? Math.round(2.5 * scale) : Math.round(1.5 * scale)} // Espessura da linha
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={seriesData.pathLength}
                strokeDashoffset={animatedDashoffset}
              />
            </React.Fragment>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          const x = plotAreaX + index * horizontalSpacing;
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
        <g transform={`translate(${plotAreaX + plotWidth - Math.round(10 * scale)}, ${plotAreaY + Math.round(10 * scale)})`}>
          {allSeriesRenderData.map((s, index) => {
            const legendOpacity = interpolate(frame, [60 + index * 5, 80 + index * 5], [0, 1], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            });
            return (
              <g key={`legend-${s.label}`} opacity={legendOpacity} transform={`translate(0, ${index * Math.round(20 * scale)})`}>
                <rect
                  x={-Math.round(20 * scale)}
                  y={-Math.round(8 * scale)}
                  width={Math.round(12 * scale)}
                  height={Math.round(12 * scale)}
                  fill={s.color}
                  rx={Math.round(2 * scale)}
                  ry={Math.round(2 * scale)}
                />
                <text
                  x={0}
                  y={0}
                  fontSize={legendFontSize}
                  fill="#CCCCCC" // Cor da legenda
                  alignmentBaseline="middle"
                >
                  {s.label}
                </text>
              </g>
            );
          })}
        </g>

      </svg>
    </AbsoluteFill>
  );
};
