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
  if (Math.abs(num) < 1000) {
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  if (Math.abs(num) < 1000000) {
    return `${(num / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k`;
  }
  return `${(num / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
};

// Helper para gerar um range de números para os ticks do eixo
const generateTicks = (min: number, max: number, numTicks: number, roundStep: number): number[] => {
  const range = max - min;
  const idealStep = range / numTicks;
  // Arredonda o step para um número "bonito" (múltiplo de roundStep)
  const step = Math.ceil(idealStep / roundStep) * roundStep;

  const ticks = [];
  let currentTick = Math.floor(min / step) * step;
  if (currentTick < min) currentTick += step; // Garante que o primeiro tick não seja menor que min

  while (currentTick <= max) {
    ticks.push(currentTick);
    currentTick += step;
  }
  return ticks;
};

export const ScatterChart: React.FC<ScatterChartProps> = ({
  title,
  data,
  xAxisLabel = "Wait Time", // Default para este caso
  yAxisLabel = "Customer Satisfaction", // Default para este caso
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Plot Area dimensions e margens [REGRAS DE ESTRUTURA E LAYOUT]
  const PLOT_AREA_PADDING = Math.round(40 * scale);
  const TITLE_HEIGHT = Math.round(24 * scale);
  const X_AXIS_LABEL_HEIGHT = Math.round(32 * scale); // Para labels do eixo X na base
  const Y_AXIS_LABEL_WIDTH = Math.round(50 * scale); // Espaço para labels do eixo Y

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT - X_AXIS_LABEL_HEIGHT;

  const plotAreaX = PLOT_AREA_PADDING + Y_AXIS_LABEL_WIDTH;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT;
  const plotWidth = chartWidth - Y_AXIS_LABEL_WIDTH;
  const plotHeight = chartHeight;

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

  // Encontrar min/max valores para os eixos
  const minXVal = Math.min(...data.map(d => d.x));
  const maxXVal = Math.max(...data.map(d => d.x));
  const minYVal = Math.min(...data.map(d => d.y));
  const maxYVal = Math.max(...data.map(d => d.y));

  // Determinar range efetivo para os eixos (com padding e iniciando em 0 se todos os valores forem positivos)
  const effectiveMinX = Math.max(0, Math.floor(minXVal * 0.9)); // 90% do min, mas não menos que 0
  const effectiveMaxX = Math.ceil(maxXVal * 1.1); // 110% do max
  const effectiveMinY = Math.max(0, Math.floor(minYVal * 0.9)); // 90% do min, mas não menos que 0
  const effectiveMaxY = Math.ceil(maxYVal * 1.1); // 110% do max

  // Gerar ticks para os eixos (5 ticks para X, 5-6 para Y)
  const numXTicks = 5;
  const numYTicks = 5;
  const xTickValues = generateTicks(effectiveMinX, effectiveMaxX, numXTicks, 5); // Arredondar steps para múltiplos de 5
  const yTickValues = generateTicks(effectiveMinY, effectiveMaxY, numYTicks, 10); // Arredondar steps para múltiplos de 10

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const axisTitleFontSize = Math.round(13 * scale);

  // Cores [REGRAS DE CORES]
  const pointColor = '#7CB5EC'; // Paleta padrão GiantAnimator - Série 1
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)';
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

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

        {/* Título do Eixo Y */}
        {yAxisLabel && (
          <text
            x={PLOT_AREA_PADDING + Y_AXIS_LABEL_WIDTH / 2}
            y={plotAreaY + plotHeight / 2}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={axisTitleFontSize}
            fill={axisTextColor}
            transform={`rotate(-90, ${PLOT_AREA_PADDING + Y_AXIS_LABEL_WIDTH / 2}, ${plotAreaY + plotHeight / 2})`}
            opacity={interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_SUBTLE })}
          >
            {yAxisLabel}
          </text>
        )}

        {/* Título do Eixo X */}
        {xAxisLabel && (
          <text
            x={plotAreaX + plotWidth / 2}
            y={plotAreaY + plotHeight + X_AXIS_LABEL_HEIGHT - Math.round(5 * scale)}
            textAnchor="middle"
            fontSize={axisTitleFontSize}
            fill={axisTextColor}
            opacity={interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_SUBTLE })}
          >
            {xAxisLabel}
          </text>
        )}

        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const yPos = effectiveMaxY > effectiveMinY
            ? plotAreaY + plotHeight - ((tickValue - effectiveMinY) / (effectiveMaxY - effectiveMinY)) * plotHeight
            : plotAreaY + plotHeight; // Se range é zero, todos os pontos ficam na base

          // [EDGE CASES E ROBUSTEZ] - Proteção contra NaN
          const safeYPos = isNaN(yPos) ? plotAreaY + plotHeight : yPos;

          const isZeroLine = tickValue === 0;

          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`y-grid-line-${index}`}>
              <line
                x1={plotAreaX}
                y1={safeYPos}
                x2={plotAreaX + plotWidth}
                y2={safeYPos}
                stroke={isZeroLine ? zeroLineColor : gridColor}
                strokeWidth={isZeroLine ? 1.5 : 1}
                strokeDasharray={isZeroLine ? '' : '4 4'}
                opacity={gridLineOpacity}
              />
              <text
                x={plotAreaX - Math.round(8 * scale)}
                y={safeYPos + Math.round(axisLabelFontSize / 3)}
                textAnchor="end"
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
          const xPos = effectiveMaxX > effectiveMinX
            ? plotAreaX + ((tickValue - effectiveMinX) / (effectiveMaxX - effectiveMinX)) * plotWidth
            : plotAreaX; // Se range é zero, todos os pontos ficam à esquerda

          // [EDGE CASES E ROBUSTEZ] - Proteção contra NaN
          const safeXPos = isNaN(xPos) ? plotAreaX : xPos;

          const isZeroLine = tickValue === 0;

          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`x-grid-line-${index}`}>
              <line
                x1={safeXPos}
                y1={plotAreaY}
                x2={safeXPos}
                y2={plotAreaY + plotHeight}
                stroke={isZeroLine ? zeroLineColor : gridColor}
                strokeWidth={isZeroLine ? 1.5 : 1}
                strokeDasharray={isZeroLine ? '' : '4 4'}
                opacity={gridLineOpacity}
              />
              <text
                x={safeXPos}
                y={plotAreaY + plotHeight + Math.round(15 * scale)}
                textAnchor="middle"
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
          const x = effectiveMaxX > effectiveMinX
            ? plotAreaX + ((point.x - effectiveMinX) / (effectiveMaxX - effectiveMinX)) * plotWidth
            : plotAreaX;
          const y = effectiveMaxY > effectiveMinY
            ? plotAreaY + plotHeight - ((point.y - effectiveMinY) / (effectiveMaxY - effectiveMinY)) * plotHeight
            : plotAreaY + plotHeight;

          // [EDGE CASES E ROBUSTEZ] - Proteção contra NaN
          const safeX = isNaN(x) ? plotAreaX : x;
          const safeY = isNaN(y) ? plotAreaY + plotHeight : y;

          // Animação: pontos aparecem com scale 0→1 em sequência (stagger 2 frames)
          const pointScale = interpolate(
            frame,
            [10 + index * 2, 40 + index * 2], // Staggered start
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          // [SCATTER PLOT] - Tamanho do ponto: 8px raio padrão, forma: círculo sólido com opacity: 0.7
          const pointRadius = Math.round(8 * scale);

          return (
            <circle
              key={`point-${index}`}
              cx={safeX}
              cy={safeY}
              r={pointRadius}
              fill={pointColor}
              opacity={interpolate(frame, [10 + index * 2, 40 + index * 2], [0, 0.7], {
                extrapolateRight: 'clamp',
                config: SPRING_CONFIG_SUBTLE,
              })}
              transform={`scale(${pointScale})`}
              transformOrigin={`${safeX}px ${safeY}px`}
            />
          );
        })}
      </svg>
    </div>
  );
};
