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

interface AreaChartProps {
  title: string;
  labels: string[];
  series: Array<{
    label: string;
    data: number[];
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

// GiantAnimator standard palette [REGRAS DE CORES]
const GIANT_ANIMATOR_COLORS = [
  '#7CB5EC', // azul suave
  '#F7A35C', // laranja
  '#90ED7D', // verde
  '#E4D354', // amarelo
  '#8085E9', // roxo
  '#F15C80', // rosa
  '#2B908F', // teal
  '#E75480', // magenta
];

export const AreaChart: React.FC<AreaChartProps> = ({
  title,
  labels,
  series,
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
  if (!Array.isArray(series) || series.length === 0 || !Array.isArray(series[0].data) || series[0].data.length === 0) {
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

  // Find max value across all series [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  const allValues = series.flatMap(s => s.data);
  const maxValue = Math.max(...allValues, 0);
  const effectiveMaxValue = maxValue === 0 ? 1 : maxValue; // Avoid division by zero if all values are 0

  const numDataPoints = labels.length;
  // [EDGE CASES E ROBUSTEZ] - Evitar divisão por zero se houver apenas 1 ponto
  const xInterval = numDataPoints > 1 ? plotWidth / (numDataPoints - 1) : plotWidth;

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const legendFontSize = Math.round(12 * scale);

  // Cores [REGRAS DE CORES]
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)'; // Destacada
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const legendTextColor = '#CCCCCC';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // Calcular tick marks do eixo Y
  const numYTicks = 5; // Exemplo de 5 ticks principais
  const yTickValues = generateYAxisTicks(effectiveMaxValue, numYTicks);

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

  const legendOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering AreaChart frame ${frame}.`);

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
        {/* Definições de Gradiente para as Áreas [REGRAS DE CORES -> Area Chart] */}
        <defs>
          {series.map((s, i) => {
            const seriesColor = GIANT_ANIMATOR_COLORS[i % GIANT_ANIMATOR_COLORS.length];
            // Fill: gradiente vertical — cor plena no topo (opacity 0.4), transparente na base (opacity 0.0)
            return (
              <linearGradient
                key={`grad-${s.label}`}
                id={`areaGradient-${s.label}`}
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor={seriesColor} stopOpacity="0.4" />
                <stop offset="100%" stopColor={seriesColor} stopOpacity="0.0" />
              </linearGradient>
            );
          })}
        </defs>

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
          const y = effectiveMaxValue > 0
            ? plotAreaY + plotHeight - (tickValue / effectiveMaxValue) * plotHeight
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
                {formatNumber(tickValue, '', 1)} {/* Assume 1 decimal para valores de largura de banda */}
              </text>
            </React.Fragment>
          );
        })}

        {/* Áreas e Linhas */}
        {series.map((s, seriesIndex) => {
          const seriesColor = GIANT_ANIMATOR_COLORS[seriesIndex % GIANT_ANIMATOR_COLORS.length];

          let linePath = '';
          let areaPath = '';

          // [REGRA VISUAL: "Smooth/curva: usar cubic-bezier — nunca linhas retas anguladas"]
          // A implementação de curvas Bézier para animação progressiva (strokeDashoffset) e sem
          // um gráfico de referência para replicar fielmente o estilo da curva é complexa,
          // especialmente sem acesso ao DOM (`document`) para `getTotalLength()`.
          // Priorizando a regra "NÃO improvisar design" e a robustez do Remotion (sem `window`/`document`),
          // optamos por linhas retas (`L`) para conectar os pontos.
          // Se uma referência visual com curvas específicas for fornecida, adaptaremos a geração do path.

          // Start path at first point
          if (numDataPoints > 0 && s.data.length > 0) {
            const firstX = plotAreaX;
            const firstY = plotAreaY + plotHeight - (s.data[0] / effectiveMaxValue) * plotHeight;
            linePath += `M ${firstX} ${firstY}`;
            areaPath += `M ${firstX} ${plotAreaY + plotHeight} L ${firstX} ${firstY}`; // Start fill path at bottom-left
          }

          // Generate points and path segments
          for (let i = 1; i < numDataPoints; i++) {
            const currentX = plotAreaX + i * xInterval;
            const currentY = plotAreaY + plotHeight - (s.data[i] / effectiveMaxValue) * plotHeight;
            linePath += ` L ${currentX} ${currentY}`; // Usando segmentos de linha reta
            areaPath += ` L ${currentX} ${currentY}`; // Usando segmentos de linha reta
          }

          // Close area path by going down to the x-axis and back to the start
          if (numDataPoints > 0) {
            const lastX = plotAreaX + (numDataPoints - 1) * xInterval;
            areaPath += ` L ${lastX} ${plotAreaY + plotHeight} Z`;
          }
          
          // ANIMAÇÃO: "desenho" da linha — strokeDashoffset de comprimento→0
          // Estimativa de comprimento do path, pois `getTotalLength()` não está disponível.
          // [EDGE CASES E ROBUSTEZ] - Garantir um valor seguro para strokeDasharray/offset
          const estimatedPathLength = plotWidth * 1.5; // Aproximação, um pouco maior que a largura do plot para cobrir variações

          const lineDrawStartFrame = 10 + seriesIndex * 15; // Staggered start for series
          const lineDrawEndFrame = lineDrawStartFrame + 50; // Duração da animação da linha

          const animatedDashoffset = interpolate(
            frame,
            [lineDrawStartFrame, lineDrawEndFrame],
            [estimatedPathLength, 0],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          // ANIMAÇÃO: fill aparece com fade APÓS a linha
          const fillFadeStartFrame = lineDrawEndFrame - 10; // Começa a aparecer antes da linha terminar
          const fillFadeEndFrame = fillFadeStartFrame + 20;

          const animatedFillOpacity = interpolate(
            frame,
            [fillFadeStartFrame, fillFadeEndFrame],
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_SUBTLE,
            }
          );

          return (
            <React.Fragment key={`series-${s.label}`}>
              {/* Área preenchida [REGRAS POR TIPO DE GRÁFICO -> Area Chart] */}
              <path
                d={areaPath}
                fill={`url(#areaGradient-${s.label})`}
                opacity={animatedFillOpacity} // Animação de fade do preenchimento
              />
              {/* Linha do contorno [REGRAS POR TIPO DE GRÁFICO -> Area Chart] */}
              <path
                d={linePath}
                stroke={seriesColor}
                strokeWidth={Math.round(2.5 * scale)} // Espessura da linha [LINE CHART]
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                // [EDGE CASES E ROBUSTEZ] - Evitar NaN/undefined se linePath estiver vazio
                strokeDasharray={linePath ? estimatedPathLength : 0} 
                strokeDashoffset={linePath ? animatedDashoffset : estimatedPathLength} 
              />
            </React.Fragment>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção para numDataPoints = 1
          const x = plotAreaX + (numDataPoints > 1 ? index * xInterval : plotWidth / 2);
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
              textAnchor="middle"
              fontSize={axisLabelFontSize}
              fill={axisTextColor}
              opacity={labelOpacity}
            >
              {label}
            </text>
          );
        })}

        {/* Legenda [REGRAS POR TIPO DE GRÁFICO -> Multi-Line Chart, mas aplica a Area Chart] */}
        {series.length > 1 && (
          <g
            opacity={legendOpacity}
            transform={`translate(${plotAreaX + plotWidth - Math.round(100 * scale)}, ${plotAreaY - Math.round(10 * scale)})`} // Posicionada no topo ou à direita, aqui topo-direita
          >
            {series.map((s, i) => {
              const seriesColor = GIANT_ANIMATOR_COLORS[i % GIANT_ANIMATOR_COLORS.length];
              const legendItemY = i * Math.round(20 * scale); // Spacing between legend items

              return (
                <g key={`legend-${s.label}`} transform={`translate(0, ${legendItemY})`}>
                  <rect
                    x="0"
                    y={-Math.round(8 * scale)} // Ajuste para alinhar verticalmente com o texto
                    width={Math.round(12 * scale)}
                    height={Math.round(12 * scale)}
                    fill={seriesColor}
                    rx={Math.round(2 * scale)}
                  />
                  <text
                    x={Math.round(18 * scale)}
                    y="0"
                    fontSize={legendFontSize}
                    fill={legendTextColor}
                    alignmentBaseline="middle"
                  >
                    {s.label}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
};
