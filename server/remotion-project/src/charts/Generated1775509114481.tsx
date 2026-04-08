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

// Helper para gerar um range de números para os ticks do eixo
const generateAxisTicks = (min: number, max: number, numTicks: number): number[] => {
  if (max <= min) return [min]; // Handle edge case
  const step = (max - min) / numTicks;
  const ticks = [];
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
  const X_AXIS_LABEL_HEIGHT = Math.round(40 * scale); // +32px para labels do eixo X na base, ajustado para ser um pouco maior para incluir o label do eixo X
  const Y_AXIS_LABEL_WIDTH = Math.round(90 * scale); // Espaço para labels do eixo Y

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

  // Determinar ranges dos eixos X e Y
  const minXData = Math.min(...data.map(d => d.x));
  const maxXData = Math.max(...data.map(d => d.x));
  const minYData = Math.min(...data.map(d => d.y));
  const maxYData = Math.max(...data.map(d => d.y));

  // Para Scatter, definir ranges dos eixos que abranjam os dados + um pouco de padding,
  // ou começando em 0 se os valores forem positivos (como tempo e satisfação).
  // Assumindo que "Wait Time" e "Customer Satisfaction" são sempre não-negativos.
  const xAxisPadding = (maxXData - minXData) * 0.1;
  const yAxisPadding = (maxYData - minYData) * 0.1;

  const effectiveMinX = 0; // Wait time geralmente começa em 0
  const effectiveMaxX = Math.max(maxXData + xAxisPadding, 15); // Garantir que cubra até pelo menos 15 se os dados forem menores
  const effectiveMinY = 0; // Satisfação geralmente começa em 0%
  const effectiveMaxY = Math.max(maxYData + yAxisPadding, 100); // Satisfação geralmente vai até 100%

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const valueLabelFontSize = Math.round(12 * scale); // Para labels de pontos se fossem visíveis
  const xAxisTitleFontSize = Math.round(12 * scale);
  const yAxisTitleFontSize = Math.round(12 * scale);

  // Cores [REGRAS DE CORES]
  const pointColor = '#7CB5EC'; // Paleta padrão GiantAnimator - Série 1
  const gridColor = 'rgba(255,255,255,0.08)';
  const axisTextColor = '#999999';
  const textColor = '#FFFFFF';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // Inferir labels dos eixos a partir do título
  const xAxisLabelText = "Wait Time";
  const yAxisLabelText = "Customer Satisfaction";

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

        {/* Eixo Y - Grid Horizontais e Labels [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const ySvg = effectiveMaxY > effectiveMinY
            ? plotAreaY + plotHeight - ((tickValue - effectiveMinY) / (effectiveMaxY - effectiveMinY)) * plotHeight
            : plotAreaY + plotHeight; // Se range é zero, todos os pontos na base

          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`y-grid-line-${index}`}>
              <line
                x1={plotAreaX}
                y1={ySvg}
                x2={plotAreaX + plotWidth}
                y2={ySvg}
                stroke={gridColor}
                strokeWidth={1}
                strokeDasharray="4 4"
                opacity={gridLineOpacity}
              />
              <text
                x={plotAreaX - Math.round(8 * scale)} // 8px de padding à direita do eixo
                y={ySvg + Math.round(axisLabelFontSize / 3)} // Ajuste vertical para centralizar
                textAnchor="end" // Alinhado à direita
                fontSize={axisLabelFontSize}
                fill={axisTextColor}
                opacity={gridLineOpacity}
              >
                {formatNumber(tickValue, '', tickValue === 0 ? 0 : 0)} {/* Ajustar decimals se necessário, ex: para percentual */}
              </text>
            </React.Fragment>
          );
        })}

        {/* Eixo X - Grid Verticais e Labels [REGRAS DE ESTRUTURA E LAYOUT] */}
        {xTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const xSvg = effectiveMaxX > effectiveMinX
            ? plotAreaX + ((tickValue - effectiveMinX) / (effectiveMaxX - effectiveMinX)) * plotWidth
            : plotAreaX; // Se range é zero, todos os pontos no início

          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`x-grid-line-${index}`}>
              <line
                x1={xSvg}
                y1={plotAreaY}
                x2={xSvg}
                y2={plotAreaY + plotHeight}
                stroke={gridColor}
                strokeWidth={1}
                strokeDasharray="4 4"
                opacity={gridLineOpacity}
              />
              <text
                x={xSvg}
                y={plotAreaY + plotHeight + Math.round(8 * scale) + Math.round(axisLabelFontSize / 2)} // 8px de padding abaixo do eixo
                textAnchor="middle" // Centralizado sob o tick
                fontSize={axisLabelFontSize}
                fill={axisTextColor}
                opacity={gridLineOpacity}
              >
                {formatNumber(tickValue, '', 0)}
              </text>
            </React.Fragment>
          );
        })}

        {/* Pontos do Scatter Plot [REGRAS POR TIPO DE GRÁFICO -> Scatter Plot] */}
        {data.map((point, index) => {
          // [EDGE CASES E ROBUSTEZ] - Proteção contra divisão por zero para mapeamento
          const xRatio = effectiveMaxX > effectiveMinX ? (point.x - effectiveMinX) / (effectiveMaxX - effectiveMinX) : 0;
          const yRatio = effectiveMaxY > effectiveMinY ? (point.y - effectiveMinY) / (effectiveMaxY - effectiveMinY) : 0;

          const cx = plotAreaX + xRatio * plotWidth;
          const cy = plotAreaY + plotHeight - yRatio * plotHeight; // SVG Y-axis é invertido

          // [EDGE CASES E ROBUSTEZ] - Proteger contra NaN nos atributos SVG
          const safeCx = isNaN(cx) ? plotAreaX : cx;
          const safeCy = isNaN(cy) ? plotAreaY + plotHeight : cy;

          // Animação dos pontos: scale 0->1 em sequência (stagger 2 frames) [REGRAS DE ANIMAÇÃO]
          const pointRadius = Math.round(8 * scale); // [SCATTER PLOT] - 8px raio padrão

          const pointAnimationStart = 20 + index * 4; // stagger de 4 frames
          const pointAnimationEnd = pointAnimationStart + 20; // Duração de 20 frames

          const animatedScale = interpolate(frame, [pointAnimationStart, pointAnimationEnd], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_MAIN,
          });
          const animatedOpacity = interpolate(frame, [pointAnimationStart, pointAnimationEnd], [0, 0.7], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_MAIN,
          });

          return (
            <circle
              key={`point-${index}`}
              cx={safeCx}
              cy={safeCy}
              r={pointRadius * animatedScale} // Animar o raio para o efeito de scale
              fill={pointColor}
              opacity={animatedOpacity} // [SCATTER PLOT] - opacidade 0.7
            />
          );
        })}

        {/* Label do Eixo X (Título) */}
        <text
          x={plotAreaX + plotWidth / 2}
          y={plotAreaY + plotHeight + X_AXIS_LABEL_HEIGHT - Math.round(5 * scale)} // Posição abaixo dos labels dos ticks
          textAnchor="middle"
          fontSize={xAxisTitleFontSize}
          fill={axisTextColor}
          fontWeight={600}
          opacity={interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_SUBTLE })}
        >
          {xAxisLabelText}
        </text>

        {/* Label do Eixo Y (Título) */}
        <text
          x={PLOT_AREA_PADDING + Math.round(15 * scale)} // Ajustar para o lado esquerdo do plot area
          y={plotAreaY + plotHeight / 2}
          textAnchor="middle"
          fontSize={yAxisTitleFontSize}
          fill={axisTextColor}
          fontWeight={600}
          transform={`rotate(-90 ${PLOT_AREA_PADDING + Math.round(15 * scale)} ${plotAreaY + plotHeight / 2})`} // Rotacionar para vertical
          opacity={interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_SUBTLE })}
        >
          {yAxisLabelText}
        </text>

      </svg>
    </div>
  );
};
