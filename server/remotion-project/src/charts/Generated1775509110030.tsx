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

interface ScatterChartProps {
  title: string;
  data: Array<{ x: number; y: number }>;
  xAxisLabel?: string;
  yAxisLabel?: string;
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

// Helper para gerar um range de números para os ticks dos eixos
const generateAxisTicks = (minVal: number, maxVal: number, numTicks: number): number[] => {
  const range = maxVal - minVal;
  if (range <= 0) return [minVal]; // Handle cases where range is invalid

  const roughStep = range / numTicks;
  const stepMagnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  let step = Math.ceil(roughStep / stepMagnitude) * stepMagnitude;

  // Ajustar para valores mais "bonitos" se necessário
  if (step * 0.5 > roughStep) step *= 0.5; // Tenta 0.5, 1, 2, 5 * 10^n

  const ticks = [];
  let currentTick = Math.ceil(minVal / step) * step;
  while (currentTick <= maxVal) {
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

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT - AXIS_LABEL_SPACING - X_AXIS_TICK_LABEL_HEIGHT;

  const plotAreaX = PLOT_AREA_PADDING + Y_AXIS_TICK_LABEL_WIDTH;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT;
  const plotWidth = chartWidth - Y_AXIS_TICK_LABEL_WIDTH;
  const plotHeight = chartHeight;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(data) || data.length === 0) {
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

  // Determinar min/max valores para os eixos
  const minDataX = Math.min(...data.map(d => d.x));
  const maxDataX = Math.max(...data.map(d => d.x));
  const minDataY = Math.min(...data.map(d => d.y));
  const maxDataY = Math.max(...data.map(d => d.y));

  // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0 (para scatter, se os dados permitirem)
  // Para este exemplo de Wait Time e Satisfaction, 0 faz sentido como base.
  const effectiveMinX = 0; // minDataX < 0 ? minDataX : 0; // Se houver valores negativos, ajustar.
  const effectiveMaxX = maxDataX;
  const effectiveMinY = 0; // minDataY < 0 ? minDataY : 0; // Se houver valores negativos, ajustar.
  const effectiveMaxY = maxDataY;

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const axisTitleFontSize = Math.round(12 * scale);

  // Cores [REGRAS DE CORES]
  const pointColor = '#7CB5EC'; // Paleta padrão GiantAnimator - Série 1
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)'; // Destacada
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // Calcular tick marks dos eixos
  const numXTicks = 5;
  const xTickValues = generateAxisTicks(effectiveMinX, effectiveMaxX, numXTicks);
  const numYTicks = 5;
  const yTickValues = generateAxisTicks(effectiveMinY, effectiveMaxY, numYTicks);

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

        {/* Eixo Y Labels e Grid Horizontais [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const yPos = (effectiveMaxY - effectiveMinY) > 0
            ? plotAreaY + plotHeight - ((tickValue - effectiveMinY) / (effectiveMaxY - effectiveMinY)) * plotHeight
            : plotAreaY + plotHeight; // Se range é 0, todos os pontos ficam na base

          const isZeroLine = tickValue === 0;

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

        {/* Eixo X Labels e Grid Verticais [REGRAS DE ESTRUTURA E LAYOUT] */}
        {xTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const xPos = (effectiveMaxX - effectiveMinX) > 0
            ? plotAreaX + ((tickValue - effectiveMinX) / (effectiveMaxX - effectiveMinX)) * plotWidth
            : plotAreaX; // Se range é 0, todos os pontos ficam na esquerda

          const isZeroLine = tickValue === 0;

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
                strokeDasharray={isZeroLine ? '' : '4 4'} // solid para zero, dashed para outros
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

        {/* Pontos de Scatter [REGRAS POR TIPO DE GRÁFICO -> Scatter Plot] */}
        {data.map((point, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero e NaN
          const xRatio = (effectiveMaxX - effectiveMinX) > 0 ? (point.x - effectiveMinX) / (effectiveMaxX - effectiveMinX) : 0;
          const yRatio = (effectiveMaxY - effectiveMinY) > 0 ? (point.y - effectiveMinY) / (effectiveMaxY - effectiveMinY) : 0;

          const cx = plotAreaX + xRatio * plotWidth;
          const cy = plotAreaY + plotHeight - yRatio * plotHeight; // Y-axis invertido para SVG

          const safeCx = isNaN(cx) ? plotAreaX : cx;
          const safeCy = isNaN(cy) ? plotAreaY + plotHeight : cy;

          // Animação de aparição dos pontos [REGRAS DE ANIMAÇÃO]
          // Pontos aparecem com scale 0->1 em sequência (stagger 2 frames)
          const pointAppearProgress = interpolate(
            frame,
            [20 + index * 2, 40 + index * 2], // staggered start (2 frames de delay entre pontos)
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          
          // [SCATTER PLOT] - Tamanho do ponto: 8px raio padrão, Forma: círculo sólido com opacity: 0.7
          const initialRadius = Math.round(4 * scale); // 8px diâmetro = 4px raio
          const animatedRadius = interpolate(pointAppearProgress, [0, 1], [0, initialRadius], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_MAIN,
          });
          const animatedOpacity = interpolate(pointAppearProgress, [0, 1], [0, 0.7], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_MAIN,
          });

          return (
            <circle
              key={`point-${index}`}
              cx={safeCx}
              cy={safeCy}
              r={animatedRadius}
              fill={pointColor}
              opacity={animatedOpacity}
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
