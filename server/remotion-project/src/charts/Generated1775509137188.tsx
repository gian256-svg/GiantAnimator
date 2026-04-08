import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, SpringConfig } from 'remotion';

// [REGRAS DE ANIMAÇÃO] - Spring Configs (IMUTÁVEIS)
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

// Interface para os dados do ponto
interface ScatterPoint {
  x: number;
  y: number;
}

// Interface para as propriedades do componente ScatterChart
interface ScatterChartProps {
  title: string;
  data: ScatterPoint[];
  xAxisLabel?: string; // Título opcional para o eixo X
  yAxisLabel?: string; // Título opcional para o eixo Y
}

// Helper para formatação de números [REGRAS DE TIPOGRAFIA E LABELS]
const formatNumber = (num: number, decimals: number = 0): string => {
  if (isNaN(num)) return ''; // [EDGE CASES E ROBUSTEZ]

  const absNum = Math.abs(num);
  if (absNum < 1000) {
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  if (absNum < 1000000) {
    return `${(num / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k`;
  }
  return `${(num / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
};

// Helper para gerar um range de números para os ticks dos eixos
const generateAxisTicks = (minVal: number, maxVal: number, numTicks: number): number[] => {
  const range = maxVal - minVal;
  if (range <= 0 || numTicks <= 0) return [minVal]; // Handle edge cases

  const roughStep = range / numTicks;
  // Encontra uma "escala bonita" para o passo (1, 2, 5, 10, 20, 50, etc.)
  const stepMagnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  let step = Math.ceil(roughStep / stepMagnitude) * stepMagnitude;

  // Se o step for muito grande, tenta um step menor bonito (e.g. de 10 para 5)
  if (step * 0.5 >= roughStep) {
    if (stepMagnitude > 1) step *= 0.5; // Reduz para 5, 25, etc.
  }
  
  const ticks = [];
  let currentTick = Math.floor(minVal / step) * step;
  // Garante que o primeiro tick seja >= minVal
  while (currentTick < minVal) {
    currentTick += step;
  }

  while (currentTick <= maxVal + step * 0.1) { // Adiciona uma pequena margem para incluir o último tick
    ticks.push(currentTick);
    currentTick += step;
  }
  return ticks;
};

export const ScatterChart: React.FC<ScatterChartProps> = ({
  title,
  data,
  xAxisLabel = 'Wait Time',
  yAxisLabel = 'Customer Satisfaction',
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Plot Area dimensions e margens [REGRAS DE ESTRUTURA E LAYOUT]
  const PLOT_AREA_PADDING = Math.round(40 * scale); // mínimo 40px
  const TITLE_HEIGHT = Math.round(24 * scale); // +24px quando título presente
  const AXIS_LABEL_SPACING = Math.round(20 * scale); // Espaço para o texto 'X Axis Label'
  const X_AXIS_TICK_LABEL_HEIGHT = Math.round(15 * scale); // Espaço para labels do eixo X (números)
  const Y_AXIS_TICK_LABEL_WIDTH = Math.round(50 * scale); // Espaço para labels do eixo Y (números)

  // Cálculo da altura e largura da área do gráfico, levando em conta todos os textos
  const chartHeightSpace = height - (2 * PLOT_AREA_PADDING) - TITLE_HEIGHT - X_AXIS_TICK_LABEL_HEIGHT - AXIS_LABEL_SPACING;
  const chartWidthSpace = width - (2 * PLOT_AREA_PADDING);

  const plotAreaX = PLOT_AREA_PADDING + Y_AXIS_TICK_LABEL_WIDTH;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT;
  const plotWidth = chartWidthSpace - Y_AXIS_TICK_LABEL_WIDTH;
  const plotHeight = chartHeightSpace;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(data) || data.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided for Scatter Chart. Displaying fallback.`);
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
        Sem dados para exibir o Scatter Plot.
      </div>
    );
  }

  // Determinar min/max valores para os eixos
  const minDataX = Math.min(...data.map(d => d.x));
  const maxDataX = Math.max(...data.map(d => d.x));
  const minDataY = Math.min(...data.map(d => d.y));
  const maxDataY = Math.max(...data.map(d => d.y));

  // Determinar range efetivo para os eixos (com padding)
  // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0 (para scatter, se range de dados positivos)
  const xRangePadding = (maxDataX - minDataX) * 0.1;
  const yRangePadding = (maxDataY - minDataY) * 0.1;

  const effectiveMinX = Math.floor((minDataX - xRangePadding) / 5) * 5; // Arredonda para baixo para o múltiplo de 5 mais próximo
  const effectiveMaxX = Math.ceil((maxDataX + xRangePadding) / 5) * 5; // Arredonda para cima para o múltiplo de 5 mais próximo
  const effectiveMinY = Math.floor((minDataY - yRangePadding) / 10) * 10; // Arredonda para baixo para o múltiplo de 10
  const effectiveMaxY = Math.ceil((maxDataY + yRangePadding) / 10) * 10; // Arredonda para cima para o múltiplo de 10

  // Garante que o mínimo não seja negativo se todos os dados são positivos
  const finalMinX = Math.min(effectiveMinX, 0); // Ajusta para 0 se necessário
  const finalMaxX = Math.max(effectiveMaxX, finalMinX + 1); // Garante que Max > Min
  const finalMinY = Math.min(effectiveMinY, 0); // Ajusta para 0 se necessário
  const finalMaxY = Math.max(effectiveMaxY, finalMinY + 1); // Garante que Max > Min

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const axisTitleFontSize = Math.round(12 * scale);

  // Cores [REGRAS DE CORES]
  const pointColor = '#7CB5EC'; // Paleta padrão GiantAnimator - Série 1
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)';
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // Calcular tick marks dos eixos
  const numXTicks = 5;
  const xTickValues = generateAxisTicks(finalMinX, finalMaxX, numXTicks);
  const numYTicks = 5;
  const yTickValues = generateAxisTicks(finalMinY, finalMaxY, numYTicks);

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

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering ScatterChart frame ${frame}.`);

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
          const yPos = (finalMaxY - finalMinY) > 0
            ? plotAreaY + plotHeight - ((tickValue - finalMinY) / (finalMaxY - finalMinY)) * plotHeight
            : plotAreaY + plotHeight; // Fallback se range for zero

          const isZeroLine = Math.abs(tickValue) < 0.001; // Considera ~0 como linha zero

          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`y-grid-line-${index}`}>
              <line
                x1={plotAreaX}
                y1={yPos}
                x2={plotAreaX + plotWidth}
                y2={yPos}
                stroke={isZeroLine ? zeroLineColor : gridColor}
                strokeWidth={isZeroLine ? 1.5 : 1}
                strokeDasharray={isZeroLine ? '' : '4 4'} // solid para zero, dashed para outros
                opacity={gridLineOpacity}
              />
              <text
                x={plotAreaX - Math.round(8 * scale)} // 8px de padding à direita
                y={yPos + Math.round(axisLabelFontSize / 3)} // Ajuste vertical para centralizar
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

        {/* Grid Verticais e Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {xTickValues.map((tickValue, index) => {
          const xPos = (finalMaxX - finalMinX) > 0
            ? plotAreaX + ((tickValue - finalMinX) / (finalMaxX - finalMinX)) * plotWidth
            : plotAreaX; // Fallback se range for zero

          const isZeroLine = Math.abs(tickValue) < 0.001;

          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`x-grid-line-${index}`}>
              <line
                x1={xPos}
                y1={plotAreaY}
                x2={xPos}
                y2={plotAreaY + plotHeight}
                stroke={isZeroLine ? zeroLineColor : gridColor}
                strokeWidth={isZeroLine ? 1.5 : 1}
                strokeDasharray={isZeroLine ? '' : '4 4'}
                opacity={gridLineOpacity}
              />
              <text
                x={xPos}
                y={plotAreaY + plotHeight + Math.round(15 * scale)} // Posição abaixo do eixo
                textAnchor="middle" // Centralizado sob cada tick
                fontSize={axisLabelFontSize}
                fill={axisTextColor}
                opacity={gridLineOpacity}
              >
                {formatNumber(tickValue)}
              </text>
            </React.Fragment>
          );
        })}

        {/* Pontos de Dispersão [REGRAS POR TIPO DE GRÁFICO -> Scatter Plot] */}
        {data.map((point, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero e NaN
          const xRatio = (finalMaxX - finalMinX) > 0 ? (point.x - finalMinX) / (finalMaxX - finalMinX) : 0;
          const yRatio = (finalMaxY - finalMinY) > 0 ? (point.y - finalMinY) / (finalMaxY - finalMinY) : 0;

          const cx = plotAreaX + xRatio * plotWidth;
          const cy = plotAreaY + plotHeight - yRatio * plotHeight; // Y-axis invertido para SVG (origem no topo esquerdo)

          const safeCx = isNaN(cx) ? plotAreaX : cx;
          const safeCy = isNaN(cy) ? plotAreaY + plotHeight : cy;

          // Animação: pontos aparecem com scale 0->1 em sequência (stagger 2 frames) [REGRAS DE ANIMAÇÃO]
          const pointAnimationStart = 20 + index * 2; // Staggered start (2 frames de delay entre pontos)
          const pointAnimationEnd = pointAnimationStart + 20; // Duração da animação do ponto

          const animatedScale = interpolate(
            frame,
            [pointAnimationStart, pointAnimationEnd],
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          
          // [SCATTER PLOT] - Tamanho do ponto: 8px raio padrão, Forma: círculo sólido com opacity: 0.7
          const pointRadius = Math.round(8 * scale);
          const animatedOpacity = interpolate(
            frame,
            [pointAnimationStart, pointAnimationEnd],
            [0, 0.7], // Opacidade final 0.7 para permitir ver sobreposições
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_SUBTLE,
            }
          );

          return (
            <circle
              key={`point-${index}`}
              cx={safeCx}
              cy={safeCy}
              r={pointRadius} // Raio final (animado via escala)
              fill={pointColor}
              opacity={animatedOpacity}
              transform={`scale(${animatedScale})`}
              transformOrigin={`${safeCx}px ${safeCy}px`}
            />
          );
        })}

        {/* Título do Eixo X [REGRAS DE TIPOGRAFIA E LABELS] */}
        <text
          x={plotAreaX + plotWidth / 2}
          y={plotAreaY + plotHeight + X_AXIS_TICK_LABEL_HEIGHT + AXIS_LABEL_SPACING / 2}
          textAnchor="middle"
          fontSize={axisTitleFontSize}
          fill={axisTextColor}
          opacity={interpolate(frame, [50, 70], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_SUBTLE })}
        >
          {xAxisLabel}
        </text>

        {/* Título do Eixo Y [REGRAS DE TIPOGRAFIA E LABELS] */}
        <text
          x={PLOT_AREA_PADDING + Math.round(Y_AXIS_TICK_LABEL_WIDTH / 2)}
          y={plotAreaY + plotHeight / 2}
          textAnchor="middle"
          fontSize={axisTitleFontSize}
          fill={axisTextColor}
          opacity={interpolate(frame, [50, 70], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_SUBTLE })}
          transform={`rotate(-90, ${PLOT_AREA_PADDING + Math.round(Y_AXIS_TICK_LABEL_WIDTH / 2)}, ${plotAreaY + plotHeight / 2})`}
        >
          {yAxisLabel}
        </text>
      </svg>
    </div>
  );
};
