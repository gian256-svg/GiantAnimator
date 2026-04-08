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

interface DataPoint {
  x: number;
  y: number;
}

interface ScatterChartProps {
  title: string;
  data: DataPoint[];
  xAxisLabel?: string; // Rótulo opcional para o eixo X
  yAxisLabel?: string; // Rótulo opcional para o eixo Y
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

// Helper para gerar um range de números para os ticks do eixo
const generateAxisTicks = (min: number, max: number, numTicks: number): number[] => {
  if (max === min) return [min];
  const ticks = [];
  // Garantir que o passo seja um número limpo para evitar dízimas periódicas no display
  const step = (max - min) / numTicks;
  for (let i = 0; i <= numTicks; i++) {
    ticks.push(min + i * step);
  }
  return ticks;
};

export const ScatterChart: React.FC<ScatterChartProps> = ({
  title,
  data,
  xAxisLabel = 'Wait Time', // Padrão para os dados fornecidos
  yAxisLabel = 'Satisfaction (%)', // Padrão para os dados fornecidos
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Plot Area dimensions e margens [REGRAS DE ESTRUTURA E LAYOUT]
  const PLOT_AREA_PADDING = Math.round(40 * scale); // mínimo 40px
  const TITLE_HEIGHT = Math.round(24 * scale); // +24px quando título presente
  const X_AXIS_LABEL_HEIGHT = Math.round(32 * scale); // +32px para labels do eixo X na base
  const Y_AXIS_LABEL_WIDTH = Math.round(80 * scale); // Espaço estimado para labels do eixo Y

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT - X_AXIS_LABEL_HEIGHT;

  const plotAreaX = PLOT_AREA_PADDING + Y_AXIS_LABEL_WIDTH;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT;
  const plotWidth = chartWidth - Y_AXIS_LABEL_WIDTH;
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

  // Determinar min/max para os eixos
  const minXValue = Math.min(...data.map(d => d.x));
  const maxXValue = Math.max(...data.map(d => d.x));
  const minYValue = Math.min(...data.map(d => d.y));
  const maxYValue = Math.max(...data.map(d => d.y));

  // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0 (exceto candlestick e scatter com range específico)
  // Para Scatter, X pode começar de 0 se minXValue for positivo, ou do próprio minXValue se for negativo.
  const numXTicks = 5; // Número de ticks desejados
  const numYTicks = 5;

  const effectiveMinX = Math.floor(Math.min(0, minXValue));
  // Adiciona uma pequena margem e arredonda para o múltiplo mais próximo do passo do tick para eixos limpos
  const effectiveMaxX = Math.ceil((maxXValue + (maxXValue - effectiveMinX) * 0.1) / numXTicks) * numXTicks;
  
  const effectiveMinY = 0; // Escala Y sempre começa em 0
  const effectiveMaxY = Math.ceil((maxYValue + (maxYValue - effectiveMinY) * 0.1) / numYTicks) * numYTicks;
  
  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const subLabelFontSize = Math.round(13 * scale);

  // Cores [REGRAS DE CORES]
  const pointColor = '#7CB5EC'; // Paleta padrão GiantAnimator - Série 1
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)'; // Linha zero destacada
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // Calcular tick marks para ambos os eixos
  const xTickValues = generateAxisTicks(effectiveMinX, effectiveMaxX, numXTicks);
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

        {/* Eixo Y Grid e Labels [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const y = (effectiveMaxY - effectiveMinY) > 0
            ? plotAreaY + plotHeight - ((tickValue - effectiveMinY) / (effectiveMaxY - effectiveMinY)) * plotHeight
            : plotAreaY + plotHeight; // Se o range é 0, todos os pontos ficam na base

          // [EDGE CASES E ROBUSTEZ] - Garantir que y não seja NaN
          const safeY = isNaN(y) ? plotAreaY + plotHeight : y;

          const isZeroLine = Math.abs(tickValue) < 0.001; // Considera valores muito próximos de zero como zero

          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`y-grid-line-${index}`}>
              <line
                x1={plotAreaX}
                y1={safeY}
                x2={plotAreaX + plotWidth}
                y2={safeY}
                stroke={isZeroLine ? zeroLineColor : gridColor}
                strokeWidth={isZeroLine ? 1.5 : 1}
                strokeDasharray={isZeroLine ? '' : '4 4'} // Sólida para zero, tracejada para outros
                opacity={gridLineOpacity}
              />
              <text
                x={plotAreaX - Math.round(8 * scale)} // 8px de padding à direita
                y={safeY + Math.round(axisLabelFontSize / 3)} // Ajuste vertical para centralizar
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

        {/* Eixo X Grid e Labels [REGRAS DE ESTRUTURA E LAYOUT] */}
        {xTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const x = (effectiveMaxX - effectiveMinX) > 0
            ? plotAreaX + ((tickValue - effectiveMinX) / (effectiveMaxX - effectiveMinX)) * plotWidth
            : plotAreaX; // Se o range é 0, todos os pontos ficam no início

          // [EDGE CASES E ROBUSTEZ] - Garantir que x não seja NaN
          const safeX = isNaN(x) ? plotAreaX : x;

          const isZeroLine = Math.abs(tickValue) < 0.001;

          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`x-grid-line-${index}`}>
              <line
                x1={safeX}
                y1={plotAreaY}
                x2={safeX}
                y2={plotAreaY + plotHeight}
                stroke={isZeroLine ? zeroLineColor : gridColor}
                strokeWidth={isZeroLine ? 1.5 : 1}
                strokeDasharray={isZeroLine ? '' : '4 4'} // Sólida para zero, tracejada para outros
                opacity={gridLineOpacity}
              />
              <text
                x={safeX}
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

        {/* Label do Eixo Y (título) [REGRAS DE TIPOGRAFIA E LABELS] */}
        <text
          x={PLOT_AREA_PADDING + Math.round(15 * scale)}
          y={plotAreaY + plotHeight / 2}
          textAnchor="middle"
          fontSize={subLabelFontSize}
          fontWeight={400}
          fill={axisTextColor}
          transform={`rotate(-90 ${PLOT_AREA_PADDING + Math.round(15 * scale)} ${plotAreaY + plotHeight / 2})`}
          opacity={interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_SUBTLE })}
        >
          {yAxisLabel}
        </text>

        {/* Label do Eixo X (título) [REGRAS DE TIPOGRAFIA E LABELS] */}
        <text
          x={plotAreaX + plotWidth / 2}
          y={plotAreaY + plotHeight + X_AXIS_LABEL_HEIGHT + Math.round(10 * scale)}
          textAnchor="middle"
          fontSize={subLabelFontSize}
          fontWeight={400}
          fill={axisTextColor}
          opacity={interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_SUBTLE })}
        >
          {xAxisLabel}
        </text>

        {/* Pontos do Scatter Plot [REGRAS POR TIPO DE GRÁFICO -> Scatter Plot] */}
        {data.map((point, index) => {
          // Calcular a posição X
          const cx = (effectiveMaxX - effectiveMinX) > 0
            ? plotAreaX + ((point.x - effectiveMinX) / (effectiveMaxX - effectiveMinX)) * plotWidth
            : plotAreaX;
          // Calcular a posição Y (lembrar que Y em SVG cresce para baixo, então inverte para o gráfico)
          const cy = (effectiveMaxY - effectiveMinY) > 0
            ? plotAreaY + plotHeight - ((point.y - effectiveMinY) / (effectiveMaxY - effectiveMinY)) * plotHeight
            : plotAreaY + plotHeight;

          // [EDGE CASES E ROBUSTEZ] - Proteção contra NaN
          const safeCx = isNaN(cx) ? plotAreaX : cx;
          const safeCy = isNaN(cy) ? plotAreaY + plotHeight : cy;

          // Animação do ponto: scale de 0 a 1 em sequência (stagger 2 frames)
          const pointScale = interpolate(
            frame,
            [20 + index * 2, 40 + index * 2], // Início escalonado (2 frames de delay entre pontos)
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          
          const pointRadius = Math.round(8 * scale); // 8px raio padrão

          return (
            <circle
              key={`point-${index}`}
              cx={safeCx}
              cy={safeCy}
              r={pointRadius}
              fill={pointColor}
              opacity={0.7} // Círculo sólido com opacity: 0.7
              transform={`scale(${pointScale})`}
              transformOrigin={`${safeCx}px ${safeCy}px`} // Animação de escala do centro do ponto
            />
          );
        })}
      </svg>
    </div>
  );
};
