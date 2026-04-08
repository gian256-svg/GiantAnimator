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

interface ScatterPlotDataPoint {
  x: number;
  y: number;
}

interface ScatterPlotProps {
  title: string;
  data: ScatterPlotDataPoint[];
  // Opcional: Adicionar labels para os eixos se a referência visual indicar
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

// Helper para gerar um range de números para os ticks do eixo
const generateAxisTicks = (minVal: number, maxVal: number, numTicks: number): number[] => {
  const range = maxVal - minVal;
  const step = range / numTicks;
  const ticks = [];
  for (let i = 0; i <= numTicks; i++) {
    ticks.push(minVal + i * step);
  }
  return ticks;
};

export const ScatterPlot: React.FC<ScatterPlotProps> = ({
  title,
  data,
  xAxisLabel, // Usado se fornecido, senão omitido
  yAxisLabel, // Usado se fornecido, senão omitido
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Plot Area dimensions e margens [REGRAS DE ESTRUTURA E LAYOUT]
  const PLOT_AREA_PADDING = Math.round(40 * scale); // mínimo 40px
  const TITLE_HEIGHT = Math.round(24 * scale); // +24px quando título presente
  // Adicionar espaço extra para os labels dos eixos X e Y se eles existirem
  const effectiveXAxisLabelHeight = xAxisLabel ? Math.round(32 * scale) : 0; // +32px para labels do eixo X
  const effectiveYAxisLabelWidth = yAxisLabel ? Math.round(30 * scale) : 0; // Espaço para o label do eixo Y
  const Y_AXIS_TICK_LABEL_WIDTH = Math.round(80 * scale); // Espaço para os valores dos ticks do eixo Y

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT - effectiveXAxisLabelHeight;

  const plotAreaX = PLOT_AREA_PADDING + Y_AXIS_TICK_LABEL_WIDTH + effectiveYAxisLabelWidth;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT;
  const plotWidth = chartWidth - Y_AXIS_TICK_LABEL_WIDTH - effectiveYAxisLabelWidth;
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

  // Determine min/max values for axes
  const allX = data.map(d => d.x);
  const allY = data.map(d => d.y);

  const rawMinX = Math.min(...allX);
  const rawMaxX = Math.max(...allX);
  const rawMinY = Math.min(...allY);
  const rawMaxY = Math.max(...allY);

  // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0, exceto se range específico (como scatter)
  // Para Scatter, é comum que os eixos se ajustem ao range dos dados, mas se todos os valores forem positivos,
  // é bom que o eixo comece em 0 para melhor comparação visual.
  const minX = rawMinX > 0 ? 0 : rawMinX;
  const maxX = rawMaxX * 1.1; // Adiciona 10% de padding ao valor máximo para respiro visual

  const minY = rawMinY > 0 ? 0 : rawMinY;
  const maxY = rawMaxY * 1.1; // Adiciona 10% de padding ao valor máximo para respiro visual

  const rangeX = maxX - minX;
  const rangeY = maxY - minY;

  // Typography settings [REGRAS DE TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const axisTitleFontSize = Math.round(13 * scale); // Para os labels "Wait Time", "Satisfaction"
  
  // Point radius [REGRAS POR TIPO DE GRÁFICO -> Scatter Plot]
  const pointRadius = Math.round(8 * scale); // 8px raio
  const pointColor = '#7CB5EC'; // Paleta padrão GiantAnimator - Série 1
  const pointOpacity = 0.7; // 0.7 para permitir ver sobreposições

  // Cores [REGRAS DE CORES]
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)'; // Destacada
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // Calcular tick marks para os eixos
  const numXTicks = 5;
  const numYTicks = 5;
  const xTickValues = generateAxisTicks(minX, maxX, numXTicks);
  const yTickValues = generateAxisTicks(minY, maxY, numYTicks);

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

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering ScatterPlot frame ${frame}.`);

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

        {/* Labels dos Títulos dos Eixos (se fornecidos) */}
        {yAxisLabel && (
          <text
            x={PLOT_AREA_PADDING + effectiveYAxisLabelWidth / 2}
            y={plotAreaY + plotHeight / 2}
            textAnchor="middle"
            fontSize={axisTitleFontSize}
            fontWeight={400}
            fill={axisTextColor}
            transform={`rotate(-90 ${PLOT_AREA_PADDING + effectiveYAxisLabelWidth / 2} ${plotAreaY + plotHeight / 2})`}
            opacity={chartEntrance}
          >
            {yAxisLabel}
          </text>
        )}
        {xAxisLabel && (
          <text
            x={plotAreaX + plotWidth / 2}
            y={plotAreaY + plotHeight + effectiveXAxisLabelHeight - Math.round(5 * scale)} // Ajuste para posicionar corretamente
            textAnchor="middle"
            fontSize={axisTitleFontSize}
            fontWeight={400}
            fill={axisTextColor}
            opacity={chartEntrance}
          >
            {xAxisLabel}
          </text>
        )}

        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const y = rangeY > 0 
            ? plotAreaY + plotHeight - ((tickValue - minY) / rangeY) * plotHeight
            : plotAreaY + plotHeight; // Se rangeY for 0, todos os pontos ficam na base

          // [EDGE CASES E ROBUSTEZ] - Proteção contra NaN
          const safeY = isNaN(y) ? plotAreaY + plotHeight : y;

          const isZeroLine = tickValue === 0;
          
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
          const x = rangeX > 0 
            ? plotAreaX + ((tickValue - minX) / rangeX) * plotWidth
            : plotAreaX; // Se rangeX for 0, todos os pontos ficam na base

          // [EDGE CASES E ROBUSTEZ] - Proteção contra NaN
          const safeX = isNaN(x) ? plotAreaX : x;

          const isZeroLine = tickValue === 0;

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

        {/* Pontos do Scatter Plot [REGRAS POR TIPO DE GRÁFICO -> Scatter Plot] */}
        {data.map((point, index) => {
          const xPos = rangeX > 0
            ? plotAreaX + ((point.x - minX) / rangeX) * plotWidth
            : plotAreaX;

          const yPos = rangeY > 0
            ? plotAreaY + plotHeight - ((point.y - minY) / rangeY) * plotHeight
            : plotAreaY + plotHeight;

          // [EDGE CASES E ROBUSTEZ] - Proteção contra NaN
          const safeXPos = isNaN(xPos) ? plotAreaX : xPos;
          const safeYPos = isNaN(yPos) ? plotAreaY + plotHeight : yPos;

          // Animação: pontos aparecem com scale 0->1 em sequência (stagger 2 frames) [REGRAS DE ANIMAÇÃO]
          const pointScale = interpolate(
            frame,
            [20 + index * 2, 40 + index * 2], // Staggered start (2 frames delay por ponto)
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          
          const pointAnimatedOpacity = interpolate(
            frame,
            [20 + index * 2, 30 + index * 2], // Opacidade animada para um fade-in mais suave
            [0, pointOpacity],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_SUBTLE,
            }
          );

          return (
            <circle
              key={`point-${index}`}
              cx={safeXPos}
              cy={safeYPos}
              r={pointRadius * pointScale} // Raio animado
              fill={pointColor}
              opacity={pointAnimatedOpacity} // Opacidade animada
            />
          );
        })}
      </svg>
    </div>
  );
};
