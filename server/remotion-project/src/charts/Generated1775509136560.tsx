import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, SpringConfig } from 'remotion';

// [REGRAS DE ANIMAÇÃO] - Spring Configs (IMUTÁVEIS)
const SPRING_CONFIG_MAIN: SpringConfig = {
  damping: 12,
  stiffness: 80,
  mass: 1.0,
  overshootClamping: false, // permite leve bounce
};

const SPRING_CONFIG_LABELS: SpringConfig = {
  damping: 20,
  stiffness: 120,
  mass: 0.8,
  overshootClamping: true,
};

const SPRING_CONFIG_SUBTLE: SpringConfig = {
  damping: 25,
  stiffness: 100,
  mass: 0.5,
  overshootClamping: true,
};

interface AreaSeries {
  label: string;
  data: number[];
}

interface AreaChartProps {
  title: string;
  labels: string[]; // Rótulos para o eixo X (categorias)
  series: AreaSeries[];
  yAxisLabel?: string; // Adicionado para clareza no eixo Y
}

// [REGRAS DE CORES] - Paleta padrão GiantAnimator (quando sem referência)
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

// Helper para formatação de números [REGRAS DE TIPOGRAFIA E LABELS]
const formatNumber = (num: number, decimals: number = 0, suffix: string = ''): string => {
  if (Math.abs(num) < 1000) {
    return `${num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;
  }
  if (Math.abs(num) < 1000000) {
    return `${(num / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k${suffix}`;
  }
  return `${(num / 1000000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M${suffix}`;
};

// Helper para gerar um range de números para os ticks do eixo Y
const generateYAxisTicks = (maxValue: number, numTicks: number): number[] => {
  if (maxValue <= 0 || numTicks <= 0) return [0]; // Garante pelo menos um tick em 0
  const ticks = [];
  const step = maxValue / numTicks;
  for (let i = 0; i <= numTicks; i++) {
    ticks.push(i * step);
  }
  return ticks;
};

// Helper para gerar o caminho SVG da linha (stroke)
const getLinePath = (
  points: { x: number; y: number }[],
  frame: number,
  animationStart: number,
  animationDuration: number,
  pathLength: number
): string => {
  if (points.length === 0) return '';
  
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

  // Animação de "desenho" da linha (strokeDashoffset de comprimento total até 0)
  const animatedDashoffset = interpolate(
    frame,
    [animationStart, animationStart + animationDuration],
    [pathLength, 0],
    {
      extrapolateRight: 'clamp',
      config: SPRING_CONFIG_MAIN,
    }
  );
  return d;
};

// Helper para gerar o caminho SVG da área (fill)
const getAreaPath = (
  points: { x: number; y: number }[],
  plotAreaX: number,
  plotAreaBottom: number
): string => {
  if (points.length === 0) return '';
  
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  // Fechar o caminho para formar a área, descendo até a linha de base (plotAreaBottom)
  return `${linePath} L ${points[points.length - 1].x},${plotAreaBottom} L ${points[0].x},${plotAreaBottom} Z`;
};


export const AreaChart: React.FC<AreaChartProps> = ({
  title,
  labels,
  series,
  yAxisLabel = "Consumption (Mbps)", // Label default para o eixo Y
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
  const plotAreaBottom = plotAreaY + plotHeight; // Linha de base para a área

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(series) || series.length === 0 || series.some(s => !Array.isArray(s.data) || s.data.length === 0)) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No series data provided or data is empty. Displaying fallback.`);
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
        Sem dados para exibir o gráfico de área.
      </div>
    );
  }

  // Encontrar o valor máximo em todas as séries para escala do eixo Y
  const allValues = series.flatMap(s => s.data);
  const maxYValue = Math.max(...allValues, 0); // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  const effectiveMaxY = maxYValue;

  // Calcular tick marks do eixo Y
  const numYTicks = 5;
  const yTickValues = generateYAxisTicks(effectiveMaxY, numYTicks);

  // Calcular posições X para cada ponto (centralizado sob o label)
  const xPositions = labels.map((_, i) => plotAreaX + (plotWidth / (labels.length - 1)) * i);
  
  // Mapear dados para coordenadas SVG
  const seriesPaths = series.map((s, seriesIndex) => {
    const points = s.data.map((value, dataIndex) => {
      const x = xPositions[dataIndex];
      // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
      const y = effectiveMaxY > 0 ? plotAreaY + plotHeight - (value / effectiveMaxY) * plotHeight : plotAreaY + plotHeight;
      return { x: isNaN(x) ? 0 : x, y: isNaN(y) ? 0 : y };
    });

    const lineColor = GIANT_ANIMATOR_COLORS[seriesIndex % GIANT_ANIMATOR_COLORS.length];
    // [REGRAS DE CORES] - Transparência em área charts: rgba(cor, 0.3) para fill, 1.0 para stroke
    const areaFillColor = `${lineColor.slice(0, 7)}4D`; // Adiciona opacidade 0.3 (hex 4D)

    return {
      points,
      lineColor,
      areaFillColor,
      label: s.label,
    };
  });

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const axisTitleFontSize = Math.round(13 * scale);
  const legendFontSize = Math.round(12 * scale);

  // Cores [REGRAS DE CORES]
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)';
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const legendTextColor = '#CCCCCC';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

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

        {/* Título do Eixo Y (opcional) */}
        {yAxisLabel && (
          <text
            x={PLOT_AREA_PADDING + Math.round(Y_AXIS_LABEL_WIDTH / 2)}
            y={plotAreaY + plotHeight / 2}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={axisTitleFontSize}
            fill={axisTextColor}
            transform={`rotate(-90, ${PLOT_AREA_PADDING + Math.round(Y_AXIS_LABEL_WIDTH / 2)}, ${plotAreaY + plotHeight / 2})`}
            opacity={interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_SUBTLE })}
          >
            {yAxisLabel}
          </text>
        )}

        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          const yPos = effectiveMaxY > 0 ? plotAreaY + plotHeight - (tickValue / effectiveMaxY) * plotHeight : plotAreaY + plotHeight;
          const isZeroLine = tickValue === 0;
          
          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`y-grid-line-${index}`}>
              <line
                x1={plotAreaX}
                y1={yPos}
                x2={plotAreaX + plotWidth}
                y2={yPos}
                stroke={isZeroLine ? zeroLineColor : gridColor}
                strokeWidth={isZeroLine ? 1.5 : 1}
                strokeDasharray={isZeroLine ? '' : '4 4'}
                opacity={gridLineOpacity}
              />
              <text
                x={plotAreaX - Math.round(8 * scale)}
                y={yPos + Math.round(axisLabelFontSize / 3)}
                textAnchor="end"
                fontSize={axisLabelFontSize}
                fill={axisTextColor}
                opacity={gridLineOpacity}
              >
                {formatNumber(tickValue, 0, 'Mbps')}
              </text>
            </React.Fragment>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          const x = xPositions[index];
          const y = plotAreaY + plotHeight + Math.round(15 * scale); // Posição abaixo do eixo

          const labelOpacity = interpolate(frame, [40, 60], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <text
              key={`x-label-${index}`}
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
        
        {/* Renderiza Áreas e Linhas [REGRAS POR TIPO DE GRÁFICO -> Area Chart] */}
        {seriesPaths.map((s, seriesIndex) => {
          const linePathLength = seriesPaths[seriesIndex].points.reduce((acc, p, i, arr) => {
            if (i === 0) return acc;
            const prev = arr[i - 1];
            return acc + Math.sqrt(Math.pow(p.x - prev.x, 2) + Math.pow(p.y - prev.y, 2));
          }, 0);

          const lineAnimationStart = 10 + seriesIndex * 15; // Linhas aparecem com stagger
          const lineAnimationDuration = 60; // Duração do "desenho" da linha
          
          // Animação de "desenho" da linha: strokeDashoffset de comprimento→0
          const animatedDashoffset = interpolate(
            frame,
            [lineAnimationStart, lineAnimationStart + lineAnimationDuration],
            [linePathLength, 0],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          // Animação do fill da área: linha primeiro, depois fill aparece com fade
          const areaFillAnimationStart = lineAnimationStart + lineAnimationDuration / 2; // Começa na metade da animação da linha
          const areaFillAnimationDuration = 40;

          const animatedAreaFillOpacity = interpolate(
            frame,
            [areaFillAnimationStart, areaFillAnimationStart + areaFillAnimationDuration],
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_SUBTLE,
            }
          );

          return (
            <g key={`series-${seriesIndex}`}>
              {/* Área preenchida */}
              <path
                d={getAreaPath(s.points, plotAreaX, plotAreaBottom)}
                fill={s.areaFillColor}
                opacity={animatedAreaFillOpacity}
              />
              {/* Linha do contorno */}
              <path
                d={getLinePath(s.points, frame, lineAnimationStart, lineAnimationDuration, linePathLength)}
                stroke={s.lineColor}
                strokeWidth={Math.round(2.5 * scale)} // 2.5px para série principal
                fill="none"
                strokeDasharray={linePathLength}
                strokeDashoffset={animatedDashoffset}
                strokeLinecap="round" // Borda da linha arredondada
                strokeLinejoin="round" // Junções da linha arredondadas
              />
            </g>
          );
        })}

        {/* Legenda [REGRAS POR TIPO DE GRÁFICO -> Multi-Line Chart / Area Chart] */}
        {/* Posição: sempre visível, posicionada no topo ou à direita. Optamos por topo-direita. */}
        <g transform={`translate(${plotAreaX + plotWidth - Math.round(100 * scale)}, ${PLOT_AREA_PADDING + Math.round(10 * scale)})`}>
          {series.map((s, index) => {
            const legendOpacity = interpolate(frame, [60 + index * 10, 80 + index * 10], [0, 1], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            });
            const color = GIANT_ANIMATOR_COLORS[index % GIANT_ANIMATOR_COLORS.length];
            const rectSize = Math.round(10 * scale);

            return (
              <g key={`legend-${index}`} opacity={legendOpacity} transform={`translate(0, ${index * Math.round(20 * scale)})`}>
                <rect
                  x={0}
                  y={0}
                  width={rectSize}
                  height={rectSize}
                  fill={color}
                  rx={Math.round(2 * scale)}
                  ry={Math.round(2 * scale)}
                />
                <text
                  x={rectSize + Math.round(8 * scale)}
                  y={rectSize - Math.round(2 * scale)} // Ajuste para alinhar verticalmente
                  fontSize={legendFontSize}
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
