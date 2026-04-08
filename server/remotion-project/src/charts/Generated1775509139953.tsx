import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, SpringConfig, AbsoluteFill } from 'remotion';

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
  labels?: string[]; // E.g., ['Jan', 'Feb', 'Mar']
  series?: Array<{ // Optional, so EmptyState can handle missing data
    label: string;
    data: number[]; // E.g., [10, 20, 15]
  }>;
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

// Helper para gerar um range de números para os ticks do eixo Y
const generateYAxisTicks = (maxValue: number, numTicks: number): number[] => {
  const step = maxValue / numTicks;
  const ticks = [];
  for (let i = 0; i <= numTicks; i++) {
    ticks.push(i * step);
  }
  return ticks;
};

// Componente para estado vazio [REGRAS DE EDGE CASES]
const EmptyState: React.FC<{ message: string; scale: number; width: number; height: number }> = ({ message, scale, width, height }) => (
  <AbsoluteFill
    style={{
      backgroundColor: '#f7f7f7', // Fundo extraído da imagem
      color: '#333333', // Cor do texto extraída da imagem
      fontSize: Math.round(24 * scale),
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'Inter, "Helvetica Neue", sans-serif',
      textShadow: '0 1px 1px rgba(0,0,0,0.2)', // Sombra sutil para combinar com o título
    }}
  >
    {message}
  </AbsoluteFill>
);

export const AreaChart: React.FC<AreaChartProps> = ({
  title,
  labels = [], // Default to empty array
  series = [], // Default to empty array
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
  // O componente pode ser renderizado com o título e fundo da referência, mesmo sem dados completos.
  const hasData = Array.isArray(series) && series.length > 0 && Array.isArray(series[0]?.data) && series[0].data.length > 0;

  const data = hasData ? series[0].data : [];
  const numDataPoints = data.length;
  const maxValue = hasData ? Math.max(...data, 0) : 0;

  // [TIPOGRAFIA E LABELS] - Estilos extraídos da imagem de referência
  const titleFontSize = Math.round(22 * scale); 
  const axisLabelFontSize = Math.round(11 * scale);
  const textColor = '#333333'; // Extraído da imagem
  const axisTextColor = '#666666'; // GiantAnimator default para light theme
  const titleTextShadow = '0 1px 1px rgba(0,0,0,0.2)'; // Extraído da imagem

  // Cores [REGRAS DE CORES] - Padrões do GiantAnimator para Area Chart em tema claro
  const areaLineColor = '#7CB5EC'; // Paleta padrão GiantAnimator - Série 1 (azul suave)
  const areaFillGradientId = 'area-chart-gradient'; // ID para o gradiente
  const gridColor = 'rgba(0,0,0,0.08)'; // Grid para light theme
  const zeroLineColor = 'rgba(0,0,0,0.25)'; // Zero line para light theme

  // Calcular tick marks do eixo Y
  const numYTicks = 5; // Exemplo de 5 ticks principais
  const yTickValues = generateYAxisTicks(maxValue, numYTicks);

  // Calcular pontos para o gráfico de área (somente se houver dados)
  const points: { x: number; y: number }[] = hasData
    ? data.map((value, index) => {
        const x = plotAreaX + (numDataPoints > 1 ? (index / (numDataPoints - 1)) : 0.5) * plotWidth;
        // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
        const yRatio = maxValue > 0 ? value / maxValue : 0;
        const y = plotAreaY + plotHeight - yRatio * plotHeight;
        // [EDGE CASES E ROBUSTEZ] - Proteger NaN
        return { x: isNaN(x) ? 0 : x, y: isNaN(y) ? plotAreaY + plotHeight : y };
      })
    : [];

  // Gerar o path SVG para a linha [LINE CHART] - Smooth/curva: usar cubic-bezier
  let linePath = '';
  if (points.length > 1) {
    linePath = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i < points.length - 2 ? points[i + 2] : points[i + 1];

      // Catmull-Rom para Bezier (simplificação para smooth curve)
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      // [EDGE CASES E ROBUSTEZ] - Proteger NaN
      linePath += ` C ${isNaN(cp1x) ? p1.x : cp1x},${isNaN(cp1y) ? p1.y : cp1y} ${isNaN(cp2x) ? p2.x : cp2x},${isNaN(cp2y) ? p2.y : cp2y} ${p2.x},${p2.y}`;
    }
  } else if (points.length === 1) {
    linePath = `M ${points[0].x},${points[0].y} L ${points[0].x},${points[0].y}`; // Single point
  }

  // Gerar o path SVG para a área preenchida [AREA CHART]
  const areaPath = linePath + (hasData ? ` L ${points[numDataPoints - 1].x},${plotAreaY + plotHeight} L ${points[0].x},${plotAreaY + plotHeight} Z` : '');

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

  // Animação de desenho da linha [LINE CHART]
  // Para getTotalLength em Remotion, um valor estimado é usado, pois `document` não está disponível em Node.js.
  const estimatedPathLength = plotWidth * 1.2; 

  const lineDraw = interpolate(
    frame,
    [10, 60], // Desenho da linha: frames 10-60
    [estimatedPathLength, 0],
    {
      extrapolateRight: 'clamp',
      config: SPRING_CONFIG_MAIN,
    }
  );

  // Animação de aparição do fill da área [AREA CHART]
  const areaFillOpacity = interpolate(
    frame,
    [50, 80], // Fill aparece após a linha: frames 50-80
    [0, 1],
    {
      extrapolateRight: 'clamp',
      config: SPRING_CONFIG_SUBTLE,
    }
  );

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering AreaChart frame ${frame}.`);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#f7f7f7', // Fundo do canvas extraído da imagem de referência
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        transform: `scale(${chartScale})`,
        opacity: chartEntrance,
        transformOrigin: 'center center',
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          {/* [AREA CHART] - Gradiente vertical para o fill da área */}
          <linearGradient id={areaFillGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={areaLineColor} stopOpacity="0.4" /> {/* topo: opacity 0.4 */}
            <stop offset="100%" stopColor={areaLineColor} stopOpacity="0.0" /> {/* base: opacity 0.0 */}
          </linearGradient>
        </defs>

        {/* Título do Gráfico [REGRAS DE TIPOGRAFIA E LABELS] - Estilo fiel à imagem */}
        <text
          x={width / 2}
          y={PLOT_AREA_PADDING + TITLE_HEIGHT / 2}
          textAnchor="middle"
          fontSize={titleFontSize}
          fontWeight={400} 
          fill={textColor}
          style={{ textShadow: titleTextShadow }}
        >
          {title}
        </text>

        {/* Renderiza o resto do gráfico somente se houver dados */}
        {hasData ? (
          <React.Fragment>
            {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
            {yTickValues.map((tickValue, index) => {
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
                    {formatNumber(tickValue)}
                  </text>
                </React.Fragment>
              );
            })}

            {/* Area Path (Fill) */}
            {areaPath && (
              <path
                d={areaPath}
                fill={`url(#${areaFillGradientId})`}
                opacity={areaFillOpacity}
              />
            )}

            {/* Line Path (Stroke) */}
            {linePath && (
              <path
                d={linePath}
                stroke={areaLineColor}
                strokeWidth={Math.round(2.5 * scale)} // Espessura da linha padrão
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={estimatedPathLength}
                strokeDashoffset={lineDraw}
                opacity={1} // Linha do contorno sempre opaca
              />
            )}

            {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
            {labels.map((label, index) => {
              const x = plotAreaX + (numDataPoints > 1 ? (index / (numDataPoints - 1)) : 0.5) * plotWidth;
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
          </React.Fragment>
        ) : null /* Se não houver dados, o gráfico não é renderizado, apenas o título e o fundo */}
      </svg>
    </div>
  );
};
