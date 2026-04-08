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
const generateTicks = (min: number, max: number, numTicks: number): number[] => {
  const ticks = [];
  if (max - min === 0) { // Proteção contra divisão por zero se min == max
    ticks.push(min);
    return ticks;
  }
  const step = (max - min) / numTicks;
  for (let i = 0; i <= numTicks; i++) {
    ticks.push(min + i * step);
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
  const Y_AXIS_LABEL_WIDTH = Math.round(60 * scale); // Espaço para labels do eixo Y (ajustado para valores de 2 dígitos)

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

  // Calcular min/max para X e Y
  const allX = data.map(d => d.x);
  const allY = data.map(d => d.y);

  const rawMinX = Math.min(...allX);
  const rawMaxX = Math.max(...allX);
  const rawMinY = Math.min(...allY);
  const rawMaxY = Math.max(...allY);

  // Adicionar um buffer para os eixos para que os pontos não fiquem na borda
  const xBuffer = (rawMaxX - rawMinX) * 0.1 || 1; // Mínimo de 1 se o range for 0
  const yBuffer = (rawMaxY - rawMinY) * 0.1 || 1; // Mínimo de 1 se o range for 0

  // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0 (exceto scatter com range específico)
  // Para scatter, eixos podem não começar em 0 para melhor visualização da distribuição.
  const effectiveMinX = Math.max(0, rawMinX - xBuffer); // Wait time deve ser >= 0
  const effectiveMaxX = rawMaxX + xBuffer;

  const effectiveMinY = Math.max(0, rawMinY - yBuffer); // Satisfação deve ser >= 0
  const effectiveMaxY = rawMaxY + yBuffer;

  const xRange = effectiveMaxX - effectiveMinX;
  const yRange = effectiveMaxY - effectiveMinY;

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // Cores [REGRAS DE CORES]
  const pointColor = '#7CB5EC'; // Paleta padrão GiantAnimator - Série 1
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)'; // Destacada

  // Calcular tick marks para os eixos
  const numXTicks = 5;
  const xTickValues = generateTicks(effectiveMinX, effectiveMaxX, numXTicks);
  const numYTicks = 5;
  const yTickValues = generateTicks(effectiveMinY, effectiveMaxY, numYTicks);

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
          const yPos = yRange > 0 
            ? plotAreaY + plotHeight - ((tickValue - effectiveMinY) / yRange) * plotHeight
            : plotAreaY + plotHeight; // If range is 0, all ticks at base (handled by generateTicks for safety)

          // [EDGE CASES E ROBUSTEZ] - Proteção para NaN
          const safeYPos = isNaN(yPos) ? plotAreaY + plotHeight : yPos;

          // Check for actual zero line if it's within range and near zero
          const isZeroLine = Math.abs(tickValue) < 0.001 && effectiveMinY <= 0 && effectiveMaxY >= 0; 
          
          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`grid-y-${index}`}>
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
              {/* Labels do Eixo Y [REGRAS DE TIPOGRAFIA E LABELS] */}
              <text
                x={plotAreaX - Math.round(8 * scale)} // 8px de padding à direita
                y={safeYPos + Math.round(axisLabelFontSize / 3)} // Ajuste vertical para centralizar
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
          const xPos = xRange > 0 
            ? plotAreaX + ((tickValue - effectiveMinX) / xRange) * plotWidth
            : plotAreaX; // If range is 0, all ticks at start (handled by generateTicks for safety)

          // [EDGE CASES E ROBUSTEZ] - Proteção para NaN
          const safeXPos = isNaN(xPos) ? plotAreaX : xPos;

          // Check for actual zero line if it's within range and near zero
          const isZeroLine = Math.abs(tickValue) < 0.001 && effectiveMinX <= 0 && effectiveMaxX >= 0; 

          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`grid-x-${index}`}>
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
              {/* Labels do Eixo X [REGRAS DE TIPOGRAFIA E LABELS] */}
              <text
                x={safeXPos}
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
          const cx = xRange > 0 
            ? plotAreaX + ((point.x - effectiveMinX) / xRange) * plotWidth
            : plotAreaX;
          const cy = yRange > 0 
            ? plotAreaY + plotHeight - ((point.y - effectiveMinY) / yRange) * plotHeight
            : plotAreaY + plotHeight;

          // [EDGE CASES E ROBUSTEZ] - Proteção para NaN
          const safeCx = isNaN(cx) ? plotAreaX : cx;
          const safeCy = isNaN(cy) ? plotAreaY + plotHeight : cy;

          // Animação dos pontos: scale 0->1 em sequência (stagger 2 frames) [REGRAS DE ANIMAÇÃO]
          const pointScale = interpolate(
            frame,
            [20 + index * 2, 40 + index * 2], // Staggered start (2 frames de delay entre pontos)
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          const pointOpacity = interpolate(
            frame,
            [20 + index * 2, 40 + index * 2],
            [0, 0.7], // End opacity 0.7 as per rules
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          // [SCATTER PLOT] - Tamanho do ponto: 8px raio. Forma: círculo sólido com opacity: 0.7
          const pointRadius = Math.round(8 * scale); 

          return (
            <circle
              key={`point-${index}`}
              cx={safeCx}
              cy={safeCy}
              r={pointRadius * pointScale} // Animating radius
              fill={pointColor}
              opacity={pointOpacity}
            />
          );
        })}
      </svg>
    </div>
  );
};
