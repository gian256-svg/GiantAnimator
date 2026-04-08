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

// Paleta padrão GiantAnimator [REGRAS DE CORES]
const GIANT_ANIMATOR_COLORS = [
  '#7CB5EC', // Série 1: azul suave
  '#F7A35C', // Série 2: laranja
  '#90ED7D', // Série 3: verde
  '#E4D354', // Série 4: amarelo
  '#8085E9', // Série 5: roxo
  '#F15C80', // Série 6: rosa
  '#2B908F', // Série 7: teal
  '#E75480', // Série 8: magenta
];

interface AreaChartProps {
  title: string;
  labels: string[];
  series: Array<{
    label: string;
    data: number[];
  }>;
}

// Helper para formatação de números [REGRAS DE TIPOGRAFIA E LABELS]
const formatNumber = (num: number, prefix: string = '', suffix: string = '', decimals: number = 0): string => {
  if (Math.abs(num) < 1000) {
    return `${prefix}${num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  }
  if (Math.abs(num) < 1000000) {
    return `${prefix}${(num / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k${suffix}`;
  }
  return `${prefix}${(num / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M${suffix}`;
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

// Helper para calcular o comprimento de um path SVG (aproximado, sem DOM)
const getPathLength = (points: { x: number; y: number }[]): number => {
  if (points.length < 2) return 0;
  let length = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    length += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }
  return length;
};

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

  // Preprocessar dados para empilhamento e encontrar o valor máximo
  const numDataPoints = labels.length;
  const stackedData: number[][] = Array(series.length).fill(0).map(() => Array(numDataPoints).fill(0));
  const cumulativeStack: number[] = Array(numDataPoints).fill(0);
  let totalMaxValue = 0;

  series.forEach((s, seriesIndex) => {
    s.data.forEach((val, dataIndex) => {
      // [EDGE CASES E ROBUSTEZ] - Proteger contra NaN ou valores inválidos
      const safeVal = isNaN(val) ? 0 : val;
      cumulativeStack[dataIndex] += safeVal;
      stackedData[seriesIndex][dataIndex] = cumulativeStack[dataIndex];
    });
  });

  totalMaxValue = Math.max(...cumulativeStack, 0); // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0

  const pointHorizontalSpacing = plotWidth / (numDataPoints - 1); // Espaçamento entre pontos no eixo X

  // Cores [REGRAS DE CORES]
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)'; // Destacada
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // Calcular tick marks do eixo Y
  const numYTicks = 5; // Exemplo de 5 ticks principais
  const yTickValues = generateYAxisTicks(totalMaxValue, numYTicks);

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
        {/* Definições de Gradientes [REGRAS DE CORES] */}
        <defs>
          {series.map((s, seriesIndex) => {
            const baseColor = GIANT_ANIMATOR_COLORS[seriesIndex % GIANT_ANIMATOR_COLORS.length];
            // [AREA CHART] - Fill: gradiente vertical — cor plena no topo, transparente na base
            // opacity topo: 0.4, opacity base: 0.0
            return (
              <linearGradient
                key={`grad-${seriesIndex}`}
                id={`areaGradient-${seriesIndex}`}
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor={baseColor} stopOpacity="0.4" />
                <stop offset="100%" stopColor={baseColor} stopOpacity="0.0" />
              </linearGradient>
            );
          })}
        </defs>

        {/* Título do Gráfico [REGRAS DE TIPOGRAFIA E LABELS] */}
        <text
          x={width / 2}
          y={PLOT_AREA_PADDING + Math.round(24 * scale) / 2} // Title height is 24px, position in middle
          textAnchor="middle"
          fontSize={Math.round(18 * scale)}
          fontWeight={700}
          fill={textColor}
          style={{ textShadow: labelTextShadow }}
        >
          {title}
        </text>

        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const yCoord = totalMaxValue > 0
            ? plotAreaY + plotHeight - (tickValue / totalMaxValue) * plotHeight
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
                y1={yCoord}
                x2={plotAreaX + plotWidth}
                y2={yCoord}
                stroke={isZeroLine ? zeroLineColor : gridColor}
                strokeWidth={isZeroLine ? 1.5 : 1}
                strokeDasharray={isZeroLine ? '' : '4 4'} // solid para zero, dashed para outros
                opacity={gridLineOpacity}
              />
              {/* Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
              <text
                x={plotAreaX - Math.round(8 * scale)} // 8px de padding à direita
                y={yCoord + Math.round(11 * scale) / 3} // Ajuste vertical para centralizar
                textAnchor="end" // Alinhado à direita
                fontSize={Math.round(11 * scale)}
                fill={axisTextColor}
                opacity={gridLineOpacity}
              >
                {formatNumber(tickValue, '', '', 1)} {/* Ex: 10.0k, 50.0M */}
              </text>
            </React.Fragment>
          );
        })}

        {/* Áreas Empilhadas e Linhas de Contorno [REGRAS POR TIPO DE GRÁFICO -> Area Chart] */}
        {series.map((s, seriesIndex) => {
          const areaPoints: { x: number; y: number }[] = [];
          const linePoints: { x: number; y: number }[] = []; // Only for the top line of the area

          // Calcular os pontos para a área e a linha
          for (let i = 0; i < numDataPoints; i++) {
            const currentStackValue = stackedData[seriesIndex][i];
            const previousStackValue = seriesIndex > 0 ? stackedData[seriesIndex - 1][i] : 0;
            
            // Y para o topo da área atual
            const yTop = totalMaxValue > 0
              ? plotAreaY + plotHeight - (currentStackValue / totalMaxValue) * plotHeight
              : plotAreaY + plotHeight;
            // Y para a base da área atual (topo da área anterior ou base do gráfico se for a primeira série)
            const yBottom = totalMaxValue > 0
              ? plotAreaY + plotHeight - (previousStackValue / totalMaxValue) * plotHeight
              : plotAreaY + plotHeight;

            const xCoord = plotAreaX + i * pointHorizontalSpacing;

            // Pontos para a linha de contorno (apenas o topo da área)
            linePoints.push({ x: xCoord, y: yTop });
            
            // Pontos para o preenchimento da área
            areaPoints.push({ x: xCoord, y: yTop });
          }

          // Inverter para desenhar a parte inferior da área até a base da série anterior
          for (let i = numDataPoints - 1; i >= 0; i--) {
            const previousStackValue = seriesIndex > 0 ? stackedData[seriesIndex - 1][i] : 0;
            const yBottom = totalMaxValue > 0
              ? plotAreaY + plotHeight - (previousStackValue / totalMaxValue) * plotHeight
              : plotAreaY + plotHeight;
            const xCoord = plotAreaX + i * pointHorizontalSpacing;
            areaPoints.push({ x: xCoord, y: yBottom });
          }

          // Fechar o path da área
          const areaPathD = areaPoints.length > 0
            ? `M ${areaPoints[0].x} ${areaPoints[0].y} ` +
              areaPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') +
              ' Z'
            : '';

          // Path da linha de contorno (smooth/curva)
          const linePathD = linePoints.length > 0
            ? `M ${linePoints[0].x} ${linePoints[0].y} ` +
              linePoints.slice(1).map((p, i) => {
                const prev = linePoints[i];
                // Simples bezier para smooth, pode ser mais complexo se necessário
                const midX = (prev.x + p.x) / 2;
                return `C ${midX} ${prev.y}, ${midX} ${p.y}, ${p.x} ${p.y}`;
              }).join(' ')
            : '';

          const baseColor = GIANT_ANIMATOR_COLORS[seriesIndex % GIANT_ANIMATOR_COLORS.length];

          // Animação da linha de contorno (desenho) [REGRAS DE ANIMAÇÃO]
          const pathLength = getPathLength(linePoints);
          const animatedStrokeDashoffset = interpolate(
            frame,
            [10 + seriesIndex * 5, 60 + seriesIndex * 5], // staggered start (5 frames de delay entre séries)
            [pathLength, 0],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          // Animação do fill da área (fade) [REGRAS DE ANIMAÇÃO]
          const animatedFillOpacity = interpolate(
            frame,
            [40 + seriesIndex * 5, 80 + seriesIndex * 5], // Atraso para o fill aparecer depois da linha
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_SUBTLE,
            }
          );

          // [EDGE CASES E ROBUSTEZ] - Proteger contra NaN em atributos SVG
          const safeAnimatedStrokeDashoffset = isNaN(animatedStrokeDashoffset) ? 0 : animatedStrokeDashoffset;
          const safePathLength = isNaN(pathLength) ? 0 : pathLength;

          return (
            <React.Fragment key={`series-${seriesIndex}`}>
              {/* Preenchimento da área */}
              {areaPathD && (
                <path
                  d={areaPathD}
                  fill={`url(#areaGradient-${seriesIndex})`}
                  opacity={animatedFillOpacity}
                />
              )}
              {/* Linha de contorno [REGRAS POR TIPO DE GRÁFICO -> Area Chart] */}
              {linePathD && (
                <path
                  d={linePathD}
                  fill="none"
                  stroke={baseColor}
                  strokeWidth={seriesIndex === series.length - 1 ? Math.round(2.5 * scale) : Math.round(1.5 * scale)} // Mais espessa para a linha principal (última série no topo)
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={safePathLength}
                  strokeDashoffset={safeAnimatedStrokeDashoffset}
                  opacity={1.0} // Sempre opaca para a linha de contorno
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          const x = plotAreaX + index * pointHorizontalSpacing;
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
              fontSize={Math.round(11 * scale)}
              fill={axisTextColor}
              opacity={labelOpacity}
            >
              {label}
            </text>
          );
        })}

        {/* Legenda [REGRAS DE TIPOGRAFIA E LABELS] */}
        <g transform={`translate(${plotAreaX + plotWidth - Math.round(120 * scale)}, ${plotAreaY - Math.round(30 * scale)})`}>
          {series.map((s, seriesIndex) => {
            const legendItemOpacity = interpolate(frame, [60 + seriesIndex * 5, 80 + seriesIndex * 5], [0, 1], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            });
            const color = GIANT_ANIMATOR_COLORS[seriesIndex % GIANT_ANIMATOR_COLORS.length];
            return (
              <g key={`legend-${seriesIndex}`} transform={`translate(0, ${seriesIndex * Math.round(20 * scale)})`}>
                <circle cx={0} cy={-Math.round(6 * scale)} r={Math.round(4 * scale)} fill={color} opacity={legendItemOpacity} />
                <text
                  x={Math.round(10 * scale)}
                  y={-Math.round(4 * scale)}
                  fontSize={Math.round(12 * scale)}
                  fill={'#CCCCCC'}
                  opacity={legendItemOpacity}
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
