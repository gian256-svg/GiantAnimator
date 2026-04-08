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

interface MultiLineChartProps {
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

// Helper para gerar o path SVG com curvas cúbicas de Bezier
// [LINE CHART] - Smooth/curva: usar cubic-bezier — nunca linhas retas anguladas
const getSmoothLinePath = (points: { x: number; y: number }[]): string => {
  if (points.length < 2) return "";

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    // Control points for a cubic Bezier that ensures horizontal tangency at P1 and P2
    // This provides a smooth, flowing curve through the points.
    // [REGRA ABSOLUTA #1] - Replica fielmente: se não há referência, Highcharts default é smooth.
    // Este é um método comum para gerar curvas suaves no SVG com a instrução 'C'.
    const controlPoint1X = p1.x + (p2.x - p1.x) / 3;
    const controlPoint1Y = p1.y;
    const controlPoint2X = p2.x - (p2.x - p1.x) / 3;
    const controlPoint2Y = p2.y;

    path += ` C ${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${p2.x},${p2.y}`;
  }
  return path;
};


export const MultiLineChart: React.FC<MultiLineChartProps> = ({
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
  const Y_AXIS_LABEL_WIDTH = Math.round(80 * scale); // Espaço para labels do eixo Y (ajustado para $XXXX.Xk)
  const LEGEND_HEIGHT = Math.round(30 * scale); // Espaço para a legenda

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT - X_AXIS_LABEL_HEIGHT - LEGEND_HEIGHT;

  const plotAreaX = PLOT_AREA_PADDING + Y_AXIS_LABEL_WIDTH;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT + LEGEND_HEIGHT; // Ajusta Y para incluir legenda
  const plotWidth = chartWidth - Y_AXIS_LABEL_WIDTH;
  const plotHeight = chartHeight;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(series) || series.length === 0 || series.every(s => !Array.isArray(s.data) || s.data.length === 0)) {
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

  // Encontrar o valor máximo em todas as séries para o eixo Y
  const allDataPoints = series.flatMap(s => s.data);
  // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  const maxValue = Math.max(...allDataPoints, 0); 
  const numDataPoints = labels.length;

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const legendFontSize = Math.round(12 * scale);
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // Cores [REGRAS DE CORES]
  // Paleta padrão GiantAnimator (quando sem referência)
  const colors = [
    '#7CB5EC', '#F7A35C', '#90ED7D', '#E4D354', '#8085E9', '#F15C80', '#2B908F', '#E75480'
  ];
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)';
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const legendTextColor = '#CCCCCC';

  // Calcular tick marks do eixo Y
  const numYTicks = 5;
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

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering MultiLineChart frame ${frame}.`);

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

        {/* Legenda [MULTI-LINE CHART] - sempre visível, posicionada no topo ou à direita */}
        {/* Posicionada no canto superior direito da área do gráfico, abaixo do título */}
        <g transform={`translate(${plotAreaX + plotWidth - Math.round(10 * scale)}, ${PLOT_AREA_PADDING + TITLE_HEIGHT})`}>
          {series.map((s, i) => {
            const legendOpacity = interpolate(frame, [60 + i * 5, 80 + i * 5], [0, 1], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            });
            const legendTranslateY = interpolate(frame, [60 + i * 5, 80 + i * 5], [Math.round(10 * scale), 0], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            });

            const itemX = 0; // Alinhar à direita
            const itemY = i * Math.round(20 * scale) - legendTranslateY; // Espaçamento vertical

            return (
              <g key={s.label} opacity={legendOpacity} transform={`translate(${itemX}, ${itemY})`}>
                <rect
                  x={-Math.round(20 * scale)} // Ajustar para alinhamento à direita
                  y={-Math.round(8 * scale)}
                  width={Math.round(10 * scale)}
                  height={Math.round(10 * scale)}
                  fill={colors[i % colors.length]}
                  rx={Math.round(2 * scale)} // Pequeno arredondamento
                />
                <text
                  x={-Math.round(5 * scale)} // Ajustar para texto
                  y={0}
                  textAnchor="end" // Alinhado à direita
                  fontSize={legendFontSize}
                  fill={legendTextColor}
                >
                  {s.label}
                </text>
              </g>
            );
          })}
        </g>


        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
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

        {/* Linhas e Pontos de Dados [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
        {series.map((s, seriesIndex) => {
          const points = s.data.map((value, dataIndex) => {
            // [EDGE CASES E ROBUSTEZ] - Evitar divisão por zero para `numDataPoints - 1`
            const x = plotAreaX + (dataIndex / (numDataPoints > 1 ? numDataPoints - 1 : 1)) * plotWidth;
            // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
            const y = maxValue > 0 ? plotAreaY + plotHeight - (value / maxValue) * plotHeight : plotAreaY + plotHeight;
            return { x: isNaN(x) ? 0 : x, y: isNaN(y) ? plotAreaY + plotHeight : y }; // Fallback para NaN
          });

          const pathD = getSmoothLinePath(points);

          // Aproximação do comprimento do path para animação de strokeDashoffset
          // Em um ambiente sem DOM (como o worker do Remotion), `getTotalLength()` não está disponível.
          // Uma aproximação é somar as distâncias euclidianas entre os pontos.
          // Para Bezier cúbicas, isso é uma simplificação, mas é a abordagem mais segura sem DOM APIs.
          let approximatedPathLength = 0;
          if (points.length > 1) {
            for (let i = 0; i < points.length - 1; i++) {
              const p1 = points[i];
              const p2 = points[i+1];
              approximatedPathLength += Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
            }
          }
          const safePathLength = approximatedPathLength > 0 ? approximatedPathLength : 1000; // Fallback para 0 length

          // Animação de "desenho" da linha [REGRAS DE ANIMAÇÃO]
          // strokeDashoffset de comprimento total para 0, com stagger por série
          const lineAnimationStart = 10 + seriesIndex * 10; 
          const lineAnimationEnd = 60 + seriesIndex * 10;

          const animatedDashoffset = interpolate(
            frame,
            [lineAnimationStart, lineAnimationEnd],
            [safePathLength, 0],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          
          // [LINE CHART] - Dots/pontos: mostrar apenas em hover OU quando < 20 pontos
          // Aqui, estamos mostrando, pois data.length é 6 (< 20).
          const dotRadius = Math.round(6 * scale); // [LINE CHART] - Tamanho do ponto: 6px raio (12px diâmetro)
          const dotOpacity = interpolate(
            frame,
            [lineAnimationEnd - 10, lineAnimationEnd + 10], // Aparecem ligeiramente depois que a linha é desenhada
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            }
          );

          // [LINE CHART] - Espessura da linha: 2.5px
          const strokeWidth = Math.round(2.5 * scale);

          return (
            <g key={`series-${seriesIndex}`}>
              <path
                d={pathD}
                stroke={colors[seriesIndex % colors.length]}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={safePathLength}
                strokeDashoffset={animatedDashoffset}
              />
              {/* Pontos nos dados */}
              {points.map((point, pointIndex) => (
                <circle
                  key={`point-${seriesIndex}-${pointIndex}`}
                  cx={point.x}
                  cy={point.y}
                  r={dotRadius / 2} // Raio do SVG circle é metade do diâmetro total
                  fill={colors[seriesIndex % colors.length]}
                  opacity={dotOpacity}
                />
              ))}
            </g>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          // [EDGE CASES E ROBUSTEZ] - Evitar divisão por zero para `numDataPoints - 1`
          const x = plotAreaX + (index / (numDataPoints > 1 ? numDataPoints - 1 : 1)) * plotWidth;
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
      </svg>
    </div>
  );
};
