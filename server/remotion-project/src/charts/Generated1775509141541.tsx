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
const formatNumber = (num: number, unit: string = '', decimals: number = 0): string => {
  if (Math.abs(num) < 1000 && num !== 0) { // Para números pequenos (como bandwidth 1.5, 8.5)
    return `${num.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}${unit}`;
  }
  if (Math.abs(num) < 1000) {
    return `${num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${unit}`;
  }
  if (Math.abs(num) < 1000000) {
    return `${(num / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k${unit}`;
  }
  return `${(num / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M${unit}`;
};

// Helper para gerar um range de números para os ticks do eixo Y
const generateYAxisTicks = (maxValue: number, numTicks: number): number[] => {
  if (maxValue <= 0) return [0]; // Garante que a linha 0 sempre esteja presente
  const step = maxValue / numTicks;
  const ticks = [];
  for (let i = 0; i <= numTicks; i++) {
    ticks.push(i * step);
  }
  return ticks;
};

// [REGRAS DE CORES] - Paleta padrão GiantAnimator
const SERIES_COLORS = [
  '#7CB5EC', // Azul para Série 1 (Upload)
  '#F7A35C', // Laranja para Série 2 (Download)
  '#90ED7D', // Verde
  '#E4D354', // Amarelo
  '#8085E9', // Roxo
  '#F15C80', // Rosa
  '#2B908F', // Teal
  '#E75480', // Magenta
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

  // Encontrar o valor máximo em todas as séries para escala do eixo Y
  const allData = series.flatMap(s => s.data);
  const maxValue = Math.max(...allData, 0); // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  
  const numDataPoints = labels.length;
  // Para linhas/áreas, a largura do segmento é entre os pontos (N-1 segmentos)
  const segmentWidth = numDataPoints > 1 ? plotWidth / (numDataPoints - 1) : plotWidth; 

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const legendFontSize = Math.round(12 * scale);
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // Cores [REGRAS DE CORES]
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)'; // Destacada
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const legendTextColor = '#CCCCCC';

  // Calcular tick marks do eixo Y
  const numYTicks = 5; // Exemplo de 5 ticks principais
  const yTickValues = generateYAxisTicks(maxValue, numYTicks);

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
        <defs>
          {series.map((s, sIndex) => {
            const color = SERIES_COLORS[sIndex % SERIES_COLORS.length];
            return (
              <linearGradient
                key={`gradient-${sIndex}`}
                id={`areaGradient-${sIndex}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                {/* [REGRAS DE CORES] - Transparência em área charts: opacity topo: 0.4, opacity base: 0.0 */}
                <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                <stop offset="100%" stopColor={color} stopOpacity="0.0" />
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
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero e NaN
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
                {formatNumber(tickValue, '')}
              </text>
            </React.Fragment>
          );
        })}

        {/* Áreas e Linhas de Contorno [REGRAS POR TIPO DE GRÁFICO -> Area Chart] */}
        {series.map((s, sIndex) => {
          const color = SERIES_COLORS[sIndex % SERIES_COLORS.length];

          // Construir o path para a área (inclui fechamento à linha de base)
          let areaPathD = `M ${plotAreaX} ${plotAreaY + plotHeight}`; // Inicia no canto inferior esquerdo da área do plot
          s.data.forEach((value, index) => {
            const x = plotAreaX + index * segmentWidth;
            // [EDGE CASES E ROBUSTEZ] - Proteção contra divisão por zero e NaN
            const y = maxValue > 0 ? plotAreaY + plotHeight - (value / maxValue) * plotHeight : plotAreaY + plotHeight;
            areaPathD += ` L ${x} ${y}`;
          });
          // Fecha o path para o canto inferior direito e de volta para o inferior esquerdo
          areaPathD += ` L ${plotAreaX + (numDataPoints - 1) * segmentWidth} ${plotAreaY + plotHeight} Z`;

          // Construir o path para a linha de contorno (apenas a linha superior)
          let linePathD = '';
          s.data.forEach((value, index) => {
            const x = plotAreaX + index * segmentWidth;
            const y = maxValue > 0 ? plotAreaY + plotHeight - (value / maxValue) * plotHeight : plotAreaY + plotHeight;
            if (index === 0) {
              linePathD += `M ${x} ${y}`; // Move para o primeiro ponto
            } else {
              linePathD += ` L ${x} ${y}`; // Desenha linhas para os pontos seguintes
            }
          });

          // Calcular o comprimento aproximado da linha para a animação strokeDashoffset
          let pathLength = 0;
          if (numDataPoints > 1) {
            for (let i = 0; i < numDataPoints - 1; i++) {
              const x1 = plotAreaX + i * segmentWidth;
              const y1 = maxValue > 0 ? plotAreaY + plotHeight - (s.data[i] / maxValue) * plotHeight : plotAreaY + plotHeight;
              const x2 = plotAreaX + (i + 1) * segmentWidth;
              const y2 = maxValue > 0 ? plotAreaY + plotHeight - (s.data[i + 1] / maxValue) * plotHeight : plotAreaY + plotHeight;
              pathLength += Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            }
          } else if (numDataPoints === 1) { // Se houver apenas 1 ponto, ele será um ponto único, sem comprimento de linha
              pathLength = 0;
          }

          // Animação para linha de contorno (strokeDashoffset)
          const lineDrawingProgress = interpolate(
            frame,
            [10 + sIndex * 5, 60 + sIndex * 5], // Início escalonado para múltiplas séries
            [1, 0], // Do deslocamento total para 0 (linha totalmente desenhada)
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          const animatedStrokeDashoffset = pathLength * lineDrawingProgress;
          
          // Animação para opacidade do preenchimento
          const fillOpacity = interpolate(
            frame,
            [50 + sIndex * 5, 80 + sIndex * 5], // O preenchimento começa a aparecer depois do desenho da linha
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_SUBTLE,
            }
          );
          
          // Animação para opacidade da linha - também fade-in, mas começa mais cedo
          const lineOpacity = interpolate(
            frame,
            [5 + sIndex * 5, 30 + sIndex * 5], // A linha de contorno fade-in um pouco antes do desenho começar
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_SUBTLE,
            }
          );

          return (
            <React.Fragment key={`series-${sIndex}`}>
              {/* Preenchimento da Área */}
              <path
                d={areaPathD}
                fill={`url(#areaGradient-${sIndex})`}
                opacity={fillOpacity}
              />
              {/* Linha de Contorno */}
              <path
                d={linePathD}
                stroke={color}
                strokeWidth={Math.round(2.5 * scale)} // [LINE CHART] - Espessura da linha
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={pathLength}
                strokeDashoffset={animatedStrokeDashoffset}
                opacity={lineOpacity}
              />
            </React.Fragment>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          const x = plotAreaX + index * segmentWidth;
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

        {/* Legenda [REGRAS DE TIPOGRAFIA E LABELS] */}
        <g
          transform={`translate(${plotAreaX}, ${PLOT_AREA_PADDING + TITLE_HEIGHT + Math.round(10 * scale)})`} // Posição abaixo do título, dentro da plotArea
          opacity={interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_LABELS })}
        >
          {series.map((s, sIndex) => {
            const legendItemX = 0; // Relativo à transformação do grupo 'g'
            const legendItemY = sIndex * Math.round(20 * scale); // Espaçamento vertical de 20px

            return (
              <g key={`legend-${sIndex}`} transform={`translate(${legendItemX}, ${legendItemY})`}>
                <rect
                  x={0}
                  y={-Math.round(legendFontSize / 2)}
                  width={Math.round(10 * scale)}
                  height={Math.round(10 * scale)}
                  fill={SERIES_COLORS[sIndex % SERIES_COLORS.length]}
                  rx={Math.round(2 * scale)}
                  ry={Math.round(2 * scale)}
                />
                <text
                  x={Math.round(15 * scale)}
                  y={Math.round(legendFontSize / 3)} // Ajuste vertical para alinhamento do texto
                  fontSize={legendFontSize}
                  fontWeight={400}
                  fill={legendTextColor}
                >
                  {s.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
