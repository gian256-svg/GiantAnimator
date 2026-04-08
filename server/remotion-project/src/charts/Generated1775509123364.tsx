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
const formatNumber = (num: number, decimals: number = 0): string => {
  if (Math.abs(num) < 1000) {
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  if (Math.abs(num) < 1000000) {
    return (num / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'k';
  }
  return (num / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'M';
};

// Helper para gerar um range de números para os ticks do eixo Y
const generateAxisTicks = (minVal: number, maxVal: number, numTicks: number): number[] => {
  if (maxVal === minVal) return [minVal];

  const range = maxVal - minVal;
  // Função auxiliar para encontrar um incremento "agradável" para os ticks
  const niceIncrement = (range: number, ticks: number) => {
    const roughIncrement = range / (ticks - 1);
    const exponent = Math.floor(Math.log10(roughIncrement));
    const fraction = roughIncrement / Math.pow(10, exponent);
    let niceFraction: number;

    if (fraction <= 1) niceFraction = 1;
    else if (fraction <= 2) niceFraction = 2;
    else if (fraction <= 5) niceFraction = 5;
    else niceFraction = 10;
    
    return niceFraction * Math.pow(10, exponent);
  };

  const increment = niceIncrement(range, numTicks);
  const lowerBound = Math.floor(minVal / increment) * increment;
  let upperBound = Math.ceil(maxVal / increment) * increment;

  // Garante que o upperBound cubra o maxVal se houver um pequeno arredondamento
  if (upperBound < maxVal && upperBound + increment / 2 < maxVal) {
      upperBound += increment;
  }
  
  const ticks = [];
  for (let i = lowerBound; i <= upperBound; i += increment) {
    if (i > upperBound + increment * 0.001) break; // Pequeno epsilon para evitar loop infinito por float
    ticks.push(i);
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
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided for ScatterChart. Displaying fallback.`);
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

  // Calcular min/max para o escalonamento dos eixos
  const allX = data.map(d => d.x);
  const allY = data.map(d => d.y);
  const minDataX = Math.min(...allX);
  const maxDataX = Math.max(...allX);
  const minDataY = Math.min(...allY);
  const maxDataY = Math.max(...allY);

  // Adicionar um pouco de padding à faixa dos eixos para melhor distribuição visual
  const rangeX = maxDataX - minDataX;
  const rangeY = maxDataY - minDataY;

  const paddedMinX = minDataX - (rangeX * 0.1);
  const paddedMaxX = maxDataX + (rangeX * 0.1);
  const paddedMinY = Math.max(0, minDataY - (rangeY * 0.1)); // [REGRAS DE ESTRUTURA E LAYOUT] - Y axis starts at 0 or above
  const paddedMaxY = maxDataY + (rangeY * 0.1);

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const pointRadius = Math.round(8 * scale); // [SCATTER PLOT] - 8px raio padrão
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // Cores [REGRAS DE CORES]
  const pointColor = '#7CB5EC'; // Paleta padrão GiantAnimator - Série 1
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)'; // Destacada

  // Calcular tick marks para os eixos
  const numXTicks = 5;
  const numYTicks = 5;
  const xTickValues = generateAxisTicks(paddedMinX, paddedMaxX, numXTicks);
  const yTickValues = generateAxisTicks(paddedMinY, paddedMaxY, numYTicks);

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
          const yRange = paddedMaxY - paddedMinY;
          const y = yRange > 0 
            ? plotAreaY + plotHeight - ((tickValue - paddedMinY) / yRange) * plotHeight
            : plotAreaY + plotHeight; // Se a faixa é 0, todos os pontos na base

          // Checar se é a linha do zero ou muito próximo para destacar
          const isZeroLine = Math.abs(tickValue) < (yRange / 100); // Dentro de 1% da faixa total
          
          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          // [EDGE CASES E ROBUSTEZ] - Proteção contra NaN
          const safeY = isNaN(y) ? plotAreaY + plotHeight : y;

          return (
            <React.Fragment key={`y-grid-line-${index}`}>
              <line
                x1={plotAreaX}
                y1={safeY}
                x2={plotAreaX + plotWidth}
                y2={safeY}
                stroke={isZeroLine ? zeroLineColor : gridColor}
                strokeWidth={isZeroLine ? 1.5 : 1}
                strokeDasharray={isZeroLine ? '' : '4 4'} // Sólido para zero, tracejado para outros
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
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const xRange = paddedMaxX - paddedMinX;
          const x = xRange > 0
            ? plotAreaX + ((tickValue - paddedMinX) / xRange) * plotWidth
            : plotAreaX; // Se a faixa é 0, todos os pontos à esquerda

          // Checar se é a linha do zero ou muito próximo para destacar
          const isZeroLine = Math.abs(tickValue) < (xRange / 100); // Dentro de 1% da faixa total

          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          // [EDGE CASES E ROBUSTEZ] - Proteção contra NaN
          const safeX = isNaN(x) ? plotAreaX : x;

          return (
            <React.Fragment key={`x-grid-line-${index}`}>
              <line
                x1={safeX}
                y1={plotAreaY}
                x2={safeX}
                y2={plotAreaY + plotHeight}
                stroke={isZeroLine ? zeroLineColor : gridColor}
                strokeWidth={isZeroLine ? 1.5 : 1}
                strokeDasharray={isZeroLine ? '' : '4 4'} // Sólido para zero, tracejado para outros
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

        {/* Pontos do Scatter Plot [REGRAS POR TIPO DE GRÁFICO -> Scatter Plot] */}
        {data.map((point, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const xRange = paddedMaxX - paddedMinX;
          const yRange = paddedMaxY - paddedMinY;

          const cx = xRange > 0
            ? plotAreaX + ((point.x - paddedMinX) / xRange) * plotWidth
            : plotAreaX;
          const cy = yRange > 0
            ? plotAreaY + plotHeight - ((point.y - paddedMinY) / yRange) * plotHeight
            : plotAreaY + plotHeight;

          // Animação de cada ponto: scale 0->1 em sequência (stagger 2 frames) [REGRAS DE ANIMAÇÃO]
          const pointAnimationProgress = interpolate(
            frame,
            [10 + index * 2, 30 + index * 2], // Início escalonado (2 frames de delay por ponto)
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          
          const animatedRadius = pointRadius * pointAnimationProgress;
          const animatedOpacity = interpolate(pointAnimationProgress, [0, 1], [0, 0.7], {
            extrapolateRight: 'clamp',
          });

          // [EDGE CASES E ROBUSTEZ] - Proteção contra NaN
          const safeCx = isNaN(cx) ? plotAreaX : cx;
          const safeCy = isNaN(cy) ? plotAreaY + plotHeight : cy;

          return (
            <circle
              key={`point-${index}`}
              cx={safeCx}
              cy={safeCy}
              r={animatedRadius}
              fill={pointColor}
              opacity={animatedOpacity} // [SCATTER PLOT] - Opacidade 0.7
            />
          );
        })}
      </svg>
    </div>
  );
};
