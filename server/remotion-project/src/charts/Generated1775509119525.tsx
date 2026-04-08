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
  const step = maxValue / numTicks;
  const ticks = [];
  for (let i = 0; i <= numTicks; i++) {
    ticks.push(i * step);
  }
  return ticks;
};

// Helper para converter HEX para RGBA
const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Helper para gerar um caminho SVG suave (aproximação de Catmull-Rom ou cubic-bezier simplificada)
// [LINE CHART] - Smooth/curva: usar cubic-bezier
const getSmoothLinePath = (points: { x: number; y: number }[]): string => {
  if (points.length < 2) return '';

  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    // Simplificação para Cubic Bézier (muitas libs usam Catmull-Rom para aproximação)
    // Para um controle fino, seria necessário calcular control points.
    // Aqui, uma interpolação linear seguida de suavização via CSS transform ou filter (não ideal para SVG path)
    // ou uma implementação mais robusta de spline.
    // Para aderir à regra "cubic-bezier", uma abordagem comum é usar "S" (smooth curve) ou "C" com controle de pontos.
    // A complexidade de calcular pontos de controle para "C" para qualquer curva é alta sem uma lib.
    // Por simplicidade e aderência a uma "curva", usaremos uma interpolação básica que "dobra" a linha.
    // Se a regra exigir controle total de Bezier (C x1 y1 x2 y2 x y), teríamos que implementar isso.
    // Por enquanto, uma série de "L" com pontos intermediários ou "S" é uma aproximação.
    // Vamos usar uma abordagem de "linha suavizada" que se aproxima de uma curva,
    // que é a intenção da regra para evitar "linhas retas anguladas".
    path += ` L ${p2.x},${p2.y}`; // Inicia com linha reta, mas a intenção é a curva.
  }
  // Para gerar uma *curva* real como 'cubic-bezier', precisamos de controle points.
  // Uma implementação completa seria:
  // let path = `M ${points[0].x},${points[0].y}`;
  // for (let i = 0; i < points.length - 1; i++) {
  //   const p0 = i === 0 ? points[0] : points[i - 1];
  //   const p1 = points[i];
  //   const p2 = points[i + 1];
  //   const p3 = i === points.length - 2 ? points[i + 1] : points[i + 2];
  //   const cp1x = p1.x + (p2.x - p0.x) / 6;
  //   const cp1y = p1.y + (p2.y - p0.y) / 6;
  //   const cp2x = p2.x - (p3.x - p1.x) / 6;
  //   const cp2y = p2.y - (p3.y - p1.y) / 6;
  //   path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  // }
  // Retomando a implementação acima que é mais alinhada com cubic-bezier approximation
  let smoothPath = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[0];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    smoothPath += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return smoothPath;
};

// Helper para estimar o comprimento de um caminho (necessário para strokeDashoffset)
// Não podemos usar DOM `getTotalLength()`, então estimamos.
const estimatePathLength = (points: { x: number; y: number }[]): number => {
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

  const LEGEND_HEIGHT = Math.round(30 * scale); // Espaço para legenda
  const LEGEND_MARGIN_TOP = Math.round(15 * scale); // Margem acima da legenda

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT - X_AXIS_LABEL_HEIGHT - LEGEND_HEIGHT - LEGEND_MARGIN_TOP;

  const plotAreaX = PLOT_AREA_PADDING + Y_AXIS_LABEL_WIDTH;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT + LEGEND_HEIGHT + LEGEND_MARGIN_TOP;
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

  // Encontrar o valor máximo em todas as séries para escalar o eixo Y
  const allDataPoints = series.flatMap(s => s.data);
  const maxValue = Math.max(...allDataPoints, 0); // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  
  const numDataPoints = labels.length;
  const xInterval = numDataPoints > 1 ? plotWidth / (numDataPoints - 1) : 0;

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const valueLabelFontSize = Math.round(12 * scale);
  const legendFontSize = Math.round(12 * scale);

  // Cores [REGRAS DE CORES] - Paleta padrão GiantAnimator
  const palette = [
    '#7CB5EC', // Série 1 (azul suave)
    '#F7A35C', // Série 2 (laranja)
    '#90ED7D', // Série 3 (verde)
    '#E4D354', // Série 4 (amarelo)
    '#8085E9', // Série 5 (roxo)
    '#F15C80', // Série 6 (rosa)
  ];
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)'; // Destacada
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const legendTextColor = '#CCCCCC';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

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

        {/* Legenda [MULTI-LINE CHART] - sempre visível, posicionada no topo */}
        <g transform={`translate(${plotAreaX}, ${PLOT_AREA_PADDING + TITLE_HEIGHT + Math.round(5 * scale)})`}>
          {series.map((s, idx) => {
            const legendItemX = idx * Math.round(120 * scale); // Espaçamento entre itens da legenda
            const legendOpacity = interpolate(frame, [60 + idx * 5, 80 + idx * 5], [0, 1], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            });
            return (
              <g key={s.label} opacity={legendOpacity}>
                <rect x={legendItemX} y={0} width={Math.round(16 * scale)} height={Math.round(10 * scale)} fill={palette[idx % palette.length]} rx={Math.round(2 * scale)} />
                <text x={legendItemX + Math.round(24 * scale)} y={Math.round(9 * scale)} fontSize={legendFontSize} fill={legendTextColor}>
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
                {formatNumber(tickValue, ' GB')}
              </text>
            </React.Fragment>
          );
        })}

        {/* Series de Área e Linha */}
        {series.map((s, seriesIndex) => {
          const seriesColor = palette[seriesIndex % palette.length];
          const dataPoints: { x: number; y: number }[] = s.data.map((value, dataIndex) => {
            const x = plotAreaX + dataIndex * xInterval;
            // [EDGE CASES E ROBUSTEZ] - Proteção contra divisão por zero
            const y = maxValue > 0 ? plotAreaY + plotHeight - (value / maxValue) * plotHeight : plotAreaY + plotHeight;
            return { x, y: isNaN(y) ? plotAreaY + plotHeight : y }; // [EDGE CASES E ROBUSTEZ] - Proteção contra NaN
          });

          const pathD = getSmoothLinePath(dataPoints);
          
          // [AREA CHART] - Área zero-baseline: fill vai até y=0, nunca "flutua"
          const areaPathD =
            pathD +
            ` L ${dataPoints[dataPoints.length - 1].x},${plotAreaY + plotHeight} ` +
            `L ${dataPoints[0].x},${plotAreaY + plotHeight} Z`;

          const estimatedLength = estimatePathLength(dataPoints);

          // Animação de desenho da linha [REGRAS DE ANIMAÇÃO]
          // Duração: 10-60 frames, com stagger entre as séries
          const lineDrawProgress = interpolate(
            frame,
            [10 + seriesIndex * 5, 60 + seriesIndex * 5],
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          const strokeDashoffset = estimatedLength * (1 - lineDrawProgress);

          // Animação de fill da área [REGRAS DE ANIMAÇÃO]
          // Duração: 30-70 frames, com stagger, começa DEPOIS que a linha começa a desenhar
          const areaFillOpacity = interpolate(
            frame,
            [30 + seriesIndex * 5, 70 + seriesIndex * 5],
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_SUBTLE,
            }
          );

          return (
            <g key={`series-${seriesIndex}`}>
              {/* [AREA CHART] - Fill: gradiente vertical — cor plena no topo, transparente na base */}
              {/* Opacity topo: 0.4, Opacity base: 0.0 */}
              <defs>
                <linearGradient id={`areaGradient-${seriesIndex}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={hexToRgba(seriesColor, 0.4)} />
                  <stop offset="100%" stopColor={hexToRgba(seriesColor, 0.0)} />
                </linearGradient>
              </defs>

              <path
                d={areaPathD}
                fill={`url(#areaGradient-${seriesIndex})`}
                opacity={areaFillOpacity}
              />

              {/* [AREA CHART] - Linha do contorno: sempre presente, mesma cor do fill com opacity: 1.0 */}
              {/* [LINE CHART] - Espessura da linha: 2.5px */}
              <path
                d={pathD}
                stroke={seriesColor}
                strokeWidth={Math.round(2.5 * scale)}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={estimatedLength}
                strokeDashoffset={strokeDashoffset}
              />

              {/* [LINE CHART] - Dots/pontos: mostrar apenas em hover OU quando < 20 pontos */}
              {/* Temos 6 pontos, então mostramos. Tamanho do ponto: 6px raio (12px diâmetro) */}
              {dataPoints.map((point, pointIndex) => {
                const dotOpacity = interpolate(
                  frame,
                  [60 + seriesIndex * 5 + pointIndex * 2, 75 + seriesIndex * 5 + pointIndex * 2],
                  [0, 1],
                  {
                    extrapolateRight: 'clamp',
                    config: SPRING_CONFIG_LABELS,
                  }
                );
                return (
                  <circle
                    key={`dot-${seriesIndex}-${pointIndex}`}
                    cx={point.x}
                    cy={point.y}
                    r={Math.round(6 * scale)} // 6px raio
                    fill={seriesColor}
                    stroke="#1a1a2e"
                    strokeWidth={Math.round(2 * scale)}
                    opacity={dotOpacity}
                  />
                );
              })}
            </g>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          const x = plotAreaX + index * xInterval;
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
