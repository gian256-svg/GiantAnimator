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
// Adaptação para a regra "mostrar inteiro" < 1000, mas permitindo decimal se o número não for inteiro.
const formatNumber = (num: number, unit: string = ''): string => {
  const absoluteNum = Math.abs(num);
  if (absoluteNum < 1000) {
    const hasDecimal = num % 1 !== 0;
    // Se o número tem decimal (ex: 1.5), mostra 1 casa decimal. Senão (ex: 10), mostra inteiro.
    return `${num.toLocaleString('en-US', { minimumFractionDigits: hasDecimal ? 1 : 0, maximumFractionDigits: hasDecimal ? 1 : 0 })}${unit}`;
  }
  if (absoluteNum < 1000000) {
    return `${(num / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k${unit}`;
  }
  return `${(num / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M${unit}`;
};

// Helper para gerar um range de números para os ticks do eixo Y
const generateYAxisTicks = (maxValue: number, numTicks: number): number[] => {
  const ticks = [];
  if (maxValue <= 0) { // Garante que 0 é sempre um tick se maxValue for 0 ou negativo
    ticks.push(0);
    return ticks;
  }
  // Para garantir que o maxValue seja atingido ou ultrapassado no último tick,
  // ajustamos o 'step' para ser um valor "arredondado" superior.
  const roughStep = maxValue / numTicks;
  const niceStep = Math.pow(10, Math.floor(Math.log10(roughStep))); // Power of 10
  const finalStep = niceStep * Math.ceil(roughStep / niceStep); // Adjusted step to be "nice"

  for (let i = 0; (i * finalStep) <= maxValue * 1.05; i++) { // Garante que o max_value esteja visível
    ticks.push(i * finalStep);
  }
  // Se maxValue não for 0, mas ticks está vazio, adiciona 0
  if (ticks.length === 0 && maxValue > 0) ticks.push(0);
  return ticks;
};

// Helper para gerar o path SVG para uma curva smooth (Cubic Bezier)
// Implementação baseada em Catmull-Rom para Bezier.
// O "tension" controla o quão "curva" a linha será.
const getSmoothLinePath = (points: { x: number; y: number }[], tension: number = 0.4): string => {
  if (points.length < 2) return "";
  
  let path = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[0];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

    // [EDGE CASES E ROBUSTEZ] - Proteger contra NaN em SVG path
    const safeCp1x = isNaN(cp1x) ? p1.x : cp1x;
    const safeCp1y = isNaN(cp1y) ? p1.y : cp1y;
    const safeCp2x = isNaN(cp2x) ? p2.x : cp2x;
    const safeCp2y = isNaN(cp2y) ? p2.y : cp2y;
    const safeP2x = isNaN(p2.x) ? p1.x : p2.x;
    const safeP2y = isNaN(p2.y) ? p1.y : p2.y;

    path += ` C ${safeCp1x},${safeCp1y}, ${safeCp2x},${safeCp2y}, ${safeP2x},${safeP2y}`;
  }
  return path;
};

// Helper para estimar o comprimento de um path. Necessário para strokeDashoffset em SSR.
const getEstimatedPathLength = (points: { x: number; y: number }[]): number => {
  if (points.length < 2) return 0;
  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    length += Math.sqrt(
      Math.pow(points[i + 1].x - points[i].x, 2) +
      Math.pow(points[i + 1].y - points[i].y, 2)
    );
  }
  return length;
};

// [REGRAS DE CORES] - Paleta padrão GiantAnimator
const GIANT_ANIMATOR_COLORS = [
  '#7CB5EC', // Série 1: azul suave
  '#F7A35C', // Série 2: laranja
  '#90ED7D', // Série 3: verde
  '#E4D354', // Série 4: amarelo
  '#8085E9', // Série 5: roxo
  '#F15C80', // Série 6: rosa
  '#2B908F', // Série 7: teal
  '#E75480', // Série 8: magenta
];

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
  const Y_AXIS_LABEL_WIDTH = Math.round(80 * scale); // Espaço para labels do eixo Y (ajustado para USD $XXXX.Xk)
  const LEGEND_HEIGHT = series.length > 0 ? Math.round(20 * scale) : 0; // Espaço para a legenda

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT - X_AXIS_LABEL_HEIGHT - LEGEND_HEIGHT;

  const plotAreaX = PLOT_AREA_PADDING + Y_AXIS_LABEL_WIDTH;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT + LEGEND_HEIGHT; // Ajuste para a legenda
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

  // Encontrar o valor máximo global para a escala do eixo Y
  const allDataPoints = series.flatMap(s => s.data);
  const maxValue = Math.max(...allDataPoints, 0); // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  
  const numDataPoints = labels.length;
  // [EDGE CASES E ROBUSTEZ] - Prevenir divisão por zero
  const xInterval = numDataPoints > 1 ? plotWidth / (numDataPoints - 1) : 0;

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const legendFontSize = Math.round(12 * scale);
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // Cores [REGRAS DE CORES]
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)';
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const legendTextColor = '#CCCCCC';

  // Calcular tick marks do eixo Y
  const numYTicks = 5;
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
        {/* Definições de Gradiente para as Áreas [REGRAS DE CORES] */}
        <defs>
          {series.map((s, seriesIndex) => {
            const seriesColor = GIANT_ANIMATOR_COLORS[seriesIndex % GIANT_ANIMATOR_COLORS.length];
            // Transparência em área charts: rgba(cor, 0.4) para fill (topo), rgba(cor, 0.0) para base
            // ID único para cada gradiente
            const gradientId = `areaGradient-${seriesIndex}`; 
            return (
              <linearGradient
                key={gradientId}
                id={gradientId}
                x1="0%" y1="0%" x2="0%" y2="100%"
              >
                <stop offset="0%" stopColor={seriesColor} stopOpacity="0.4" /> {/* opacity topo: 0.4 */}
                <stop offset="100%" stopColor={seriesColor} stopOpacity="0.0" /> {/* opacity base: 0.0 */}
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

        {/* Legenda [REGRAS POR TIPO DE GRÁFICO -> Multi-Line Chart (aplicado a Area)] */}
        <g transform={`translate(${width / 2}, ${PLOT_AREA_PADDING + TITLE_HEIGHT + Math.round(10 * scale)})`}
           opacity={interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_LABELS })}
        >
          {series.map((s, seriesIndex) => {
            const seriesColor = GIANT_ANIMATOR_COLORS[seriesIndex % GIANT_ANIMATOR_COLORS.length];
            const legendItemWidth = Math.round(80 * scale); // Largura estimada para cada item da legenda
            const totalLegendWidth = series.length * legendItemWidth;
            const startX = -totalLegendWidth / 2 + seriesIndex * legendItemWidth + Math.round(10 * scale);

            return (
              <g key={`legend-${seriesIndex}`} transform={`translate(${startX}, 0)`}>
                <rect x="0" y={-Math.round(6 * scale)} width={Math.round(12 * scale)} height={Math.round(12 * scale)} fill={seriesColor} rx={Math.round(2 * scale)} ry={Math.round(2 * scale)} />
                <text x={Math.round(18 * scale)} y={Math.round(3 * scale)} fontSize={legendFontSize} fill={legendTextColor} textAnchor="start">
                  {s.label}
                </text>
              </g>
            );
          })}
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
                {formatNumber(tickValue, '')}
              </text>
            </React.Fragment>
          );
        })}

        {/* Linhas e Áreas [REGRAS POR TIPO DE GRÁFICO -> Area Chart] */}
        {series.map((s, seriesIndex) => {
          const seriesColor = GIANT_ANIMATOR_COLORS[seriesIndex % GIANT_ANIMATOR_COLORS.length];
          const gradientId = `areaGradient-${seriesIndex}`;

          const points = s.data.map((value, i) => {
            const x = plotAreaX + i * xInterval;
            // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
            const y = maxValue > 0
              ? plotAreaY + plotHeight - (value / maxValue) * plotHeight
              : plotAreaY + plotHeight; // Se maxValue é 0, todos os pontos ficam na base

            return { x, y };
          });

          // Gerar o path da linha suave
          const linePath = getSmoothLinePath(points);
          
          // Gerar o path da área (fechando na base Y=0)
          // [AREA CHART] - Área zero-baseline: fill vai até y=0, nunca "flutua"
          const areaPath = linePath + ` L ${points[points.length - 1].x},${plotAreaY + plotHeight} L ${points[0].x},${plotAreaY + plotHeight} Z`;

          // Animação da linha (strokeDashoffset) [REGRAS DE ANIMAÇÃO]
          // Usamos um comprimento estimado para garantir determinismo em SSR
          const estimatedPathLength = getEstimatedPathLength(points); 
          
          const lineAnimationStart = 10 + seriesIndex * 15; // Staggered start (delay entre séries)
          const lineAnimationEnd = lineAnimationStart + 40; // 40 frames para desenhar

          const strokeDashoffset = interpolate(
            frame,
            [lineAnimationStart, lineAnimationEnd],
            [estimatedPathLength, 0],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          // Animação da área (fade) [REGRAS DE ANIMAÇÃO]
          // [AREA CHART] - linha primeiro, depois fill aparece com fade
          const fillAnimationStart = lineAnimationEnd - 10; // Começa a aparecer um pouco antes da linha terminar
          const fillAnimationEnd = fillAnimationStart + 30; // 30 frames para aparecer

          const fillOpacity = interpolate(
            frame,
            [fillAnimationStart, fillAnimationEnd],
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_SUBTLE,
            }
          );
          
          // [EDGE CASES E ROBUSTEZ] - Proteção contra NaN para atributos SVG
          const safePathLength = isNaN(estimatedPathLength) ? 1000 : estimatedPathLength;
          const safeStrokeDashoffset = isNaN(strokeDashoffset) ? safePathLength : strokeDashoffset;

          return (
            <React.Fragment key={`series-${seriesIndex}`}>
              {/* Área preenchida */}
              <path
                d={areaPath}
                fill={`url(#${gradientId})`}
                fillOpacity={fillOpacity}
              />
              {/* Linha do contorno [REGRAS POR TIPO DE GRÁFICO -> Area Chart] */}
              <path
                d={linePath}
                stroke={seriesColor} // mesma cor do fill com opacity: 1.0
                strokeWidth={Math.round(2.5 * scale)} // Espessura da linha
                fill="none"
                strokeDasharray={safePathLength}
                strokeDashoffset={safeStrokeDashoffset}
                // Garante que a linha aparece junto ou antes da área
                opacity={interpolate(frame, [lineAnimationStart, fillAnimationEnd], [0, 1], { extrapolateRight: 'clamp' })} 
              />
            </React.Fragment>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          const x = plotAreaX + index * xInterval;
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
