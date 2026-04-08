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

interface ScatterPoint {
  x: number;
  y: number;
}

interface ScatterChartProps {
  title: string;
  data: ScatterPoint[];
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

// Helper para gerar um range de números para os ticks dos eixos
const generateAxisTicks = (min: number, max: number, numTicks: number): number[] => {
  if (min === max) return [min]; // Evita divisão por zero
  const ticks = [];
  const start = min;
  const end = max;
  const step = (end - start) / numTicks;

  for (let i = 0; i <= numTicks; i++) {
    ticks.push(start + i * step);
  }
  return ticks;
};

export const ScatterChart: React.FC<ScatterChartProps> = ({
  title,
  data,
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

  // Encontrar min/max para os eixos X e Y
  const allX = data.map(d => d.x);
  const allY = data.map(d => d.y);

  // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0, a menos que haja negativos.
  // Para scatter, geralmente a escala se adapta aos dados. Adicionar um pequeno padding.
  const minXData = Math.min(...allX);
  const maxXData = Math.max(...allX);
  const minYData = Math.min(...allY);
  const maxYData = Math.max(...allY);

  const effectiveMinX = minXData > 0 ? 0 : minXData - (maxXData - minXData) * 0.1; // Começa em 0 ou abaixo do mínimo
  const effectiveMaxX = maxXData + (maxXData - minXData) * 0.1; // Adiciona 10% de padding
  const effectiveMinY = minYData > 0 ? 0 : minYData - (maxYData - minYData) * 0.1; // Começa em 0 ou abaixo do mínimo
  const effectiveMaxY = maxYData + (maxYData - minYData) * 0.1; // Adiciona 10% de padding

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);

  // Cores [REGRAS DE CORES]
  const pointColor = '#7CB5EC'; // Paleta padrão GiantAnimator - Série 1
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)'; // Destacada
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // Calcular tick marks dos eixos X e Y
  const numXTicks = 5;
  const numYTicks = 5;
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

        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const y = effectiveMaxY > effectiveMinY
            ? plotAreaY + plotHeight - ((tickValue - effectiveMinY) / (effectiveMaxY - effectiveMinY)) * plotHeight
            : plotAreaY + plotHeight; // Fallback se o range for zero

          // [EDGE CASES E ROBUSTEZ] - Proteção para NaN
          const safeY = isNaN(y) ? plotAreaY + plotHeight : y;

          const isZeroLine = Math.abs(tickValue) < 0.001; // Considera ~0 como linha zero
          
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
                strokeDasharray={isZeroLine ? '' : '4 4'} // solid para zero, dashed para outros
                opacity={gridLineOpacity}
              />
              {/* Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
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

        {/* Grid Verticais e Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {xTickValues.map((tickValue, index) => {
          const x = effectiveMaxX > effectiveMinX
            ? plotAreaX + ((tickValue - effectiveMinX) / (effectiveMaxX - effectiveMinX)) * plotWidth
            : plotAreaX; // Fallback se o range for zero
          
          // [EDGE CASES E ROBUSTEZ] - Proteção para NaN
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
                strokeDasharray={isZeroLine ? '' : '4 4'} // solid para zero, dashed para outros
                opacity={gridLineOpacity}
              />
              {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
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

        {/* Pontos de Dispersão [REGRAS POR TIPO DE GRÁFICO -> Scatter Plot] */}
        {data.map((point, index) => {
          const cx = effectiveMaxX > effectiveMinX
            ? plotAreaX + ((point.x - effectiveMinX) / (effectiveMaxX - effectiveMinX)) * plotWidth
            : plotAreaX;
          const cy = effectiveMaxY > effectiveMinY
            ? plotAreaY + plotHeight - ((point.y - effectiveMinY) / (effectiveMaxY - effectiveMinY)) * plotHeight
            : plotAreaY + plotHeight;

          // [EDGE CASES E ROBUSTEZ] - Proteção para NaN
          const safeCx = isNaN(cx) ? plotAreaX : cx;
          const safeCy = isNaN(cy) ? plotAreaY + plotHeight : cy;

          // [SCATTER PLOT] - Tamanho do ponto: 8px raio padrão
          const pointRadius = Math.round(8 * scale);

          // Animação de aparição do ponto [REGRAS DE ANIMAÇÃO]
          // Pontos aparecem com scale 0->1 em sequência (stagger 2 frames)
          const pointAnimationStart = 10 + index * 2; // Staggered start (2 frames de delay entre pontos)
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
              r={pointRadius}
              fill={pointColor}
              opacity={animatedOpacity}
              transform={`scale(${animatedScale})`}
              transformOrigin={`${safeCx}px ${safeCy}px`}
            />
          );
        })}
      </svg>
    </div>
  );
};
