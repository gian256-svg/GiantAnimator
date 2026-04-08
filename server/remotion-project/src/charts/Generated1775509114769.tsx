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

interface MultiLineChartProps {
  title: string;
  labels: string[]; // Rótulos para o eixo X (categorias/datas)
  series: Array<{
    label: string; // Nome da série (ex: "Organic Search")
    data: number[]; // Valores da série
  }>;
}

// Paleta de cores padrão GiantAnimator para múltiplas séries [REGRAS DE CORES]
const GA_PALETTE = [
  '#7CB5EC', // Azul
  '#F7A35C', // Laranja
  '#90ED7D', // Verde
  '#E4D354', // Amarelo
  '#8085E9', // Roxo
  '#F15C80', // Rosa
  '#2B908F', // Teal
  '#E75480', // Magenta
];

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

// Helper para gerar o path SVG para uma linha suave (curva cúbica de Bezier simplificada)
// [LINE CHART] - Smooth/curva: usar cubic-bezier
const getSmoothLinePath = (
  points: { x: number; y: number }[],
  tension: number = 0.3 // Ajuste a tensão para controlar a curvatura (0.0 a 1.0)
): string => {
  if (points.length < 2) return "";

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]; // Ponto anterior para cálculo da tangência
    const p1 = points[i];                 // Ponto atual
    const p2 = points[i + 1];             // Próximo ponto
    const p3 = points[Math.min(points.length - 1, i + 2)]; // Ponto posterior para cálculo da tangência

    // Ponto de controle 1 (para p1)
    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;

    // Ponto de controle 2 (para p2)
    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
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
  const LEGEND_HEIGHT = Math.round(30 * scale); // Espaço para a legenda
  const X_AXIS_LABEL_HEIGHT = Math.round(32 * scale); // +32px para labels do eixo X na base
  const Y_AXIS_LABEL_WIDTH = Math.round(80 * scale); // Espaço para labels do eixo Y (ajustado para USD $XXXX.Xk)

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT - LEGEND_HEIGHT - X_AXIS_LABEL_HEIGHT;

  const plotAreaX = PLOT_AREA_PADDING + Y_AXIS_LABEL_WIDTH;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT + LEGEND_HEIGHT;
  const plotWidth = chartWidth - Y_AXIS_LABEL_WIDTH;
  const plotHeight = chartHeight;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(series) || series.length === 0 || !Array.isArray(series[0].data) || series[0].data.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided or data is empty. Displaying fallback.`);
    return (
      <AbsoluteFill style={{
        backgroundColor: '#1a1a2e',
        color: '#FFFFFF',
        fontSize: Math.round(24 * scale),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
      }}>
        Sem dados para exibir.
      </AbsoluteFill>
    );
  }

  // Encontrar o valor máximo em todas as séries para escala do eixo Y
  const allValues = series.flatMap(s => s.data);
  const maxValue = Math.max(...allValues, 0); // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  
  const numDataPoints = labels.length;
  const xPointSpacing = plotWidth / (numDataPoints > 1 ? numDataPoints - 1 : 1);

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const legendFontSize = Math.round(12 * scale);
  const dataPointLabelFontSize = Math.round(10 * scale); // Menor para não sobrepor em multi-line

  // Cores [REGRAS DE CORES]
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

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering MultiLineChart frame ${frame}.`);

  return (
    <AbsoluteFill
      style={{
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
        <g transform={`translate(${plotAreaX}, ${PLOT_AREA_PADDING + TITLE_HEIGHT + Math.round(8 * scale)})`}>
          {series.map((s, sIndex) => {
            const legendItemOpacity = interpolate(frame, [60 + sIndex * 5, 80 + sIndex * 5], [0, 1], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            });
            const legendX = (sIndex * Math.round(120 * scale)); // Posição horizontal para cada item da legenda
            const color = GA_PALETTE[sIndex % GA_PALETTE.length];

            return (
              <g key={s.label} opacity={legendItemOpacity} transform={`translate(${legendX}, 0)`}>
                <rect x={0} y={-Math.round(8 * scale)} width={Math.round(16 * scale)} height={Math.round(4 * scale)} fill={color} />
                <text x={Math.round(24 * scale)} y={0} fontSize={legendFontSize} fill={legendTextColor}>
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

        {/* Linhas e Pontos de Dados [LINE CHART] */}
        {series.map((s, sIndex) => {
          const color = GA_PALETTE[sIndex % GA_PALETTE.length];
          const lineThickness = Math.round(2.5 * scale); // [LINE CHART] - Espessura da linha: 2.5px

          const points = s.data.map((value, dataIndex) => {
            // [EDGE CASES E ROBUSTEZ] - Proteção contra divisão por zero
            const yPosition = maxValue > 0
              ? plotAreaY + plotHeight - (value / maxValue) * plotHeight
              : plotAreaY + plotHeight; // Se maxValue é 0, todos os pontos ficam na base

            const xPosition = plotAreaX + dataIndex * xPointSpacing;
            return { x: xPosition, y: yPosition };
          });

          // Gerar o path SVG para a linha suave
          const linePath = getSmoothLinePath(points);

          // Animação de "desenho" da linha [REGRAS DE ANIMAÇÃO]
          const pathLength = linePath ? document.createElementNS("http://www.w3.org/2000/svg", "path").getTotalLength() : 0;
          // [EDGE CASES E ROBUSTEZ] - Prevenção de `document` em Remotion, getTotalLength não é disponível aqui.
          // Para Remotion, `pathLength` precisa ser pré-calculado ou estimado,
          // ou a animação do `strokeDashoffset` será um fade ou scale de opacidade, não um desenho.
          // **Aviso**: `document.createElementNS` não funciona em ambiente Remotion fora do browser.
          // Para esta implementação, vamos simular a animação como um fade e crescimento se `getTotalLength` não for viável no ambiente.
          // Uma alternativa seria usar um componente que pré-calcula isso no browser para uso posterior.
          // Por enquanto, usarei uma estimativa para `pathLength` para a animação do strokeDashoffset.
          // Uma forma mais robusta seria estimar baseado na quantidade de pontos e na largura do plot.
          const estimatedPathLength = Math.max(plotWidth * 1.2, 100); // Estimativa generosa

          const lineDraw = interpolate(
            frame,
            [10 + sIndex * 5, 60 + sIndex * 5], // Staggered start (5 frames de delay entre séries)
            [estimatedPathLength, 0], // strokeDashoffset de comprimento total até 0
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );

          // Animação dos pontos [REGRAS DE ANIMAÇÃO]
          const dotRadius = Math.round(6 * scale); // [LINE CHART] - Tamanho do ponto: 6px raio (12px diâmetro)

          return (
            <React.Fragment key={`series-${sIndex}`}>
              <path
                d={linePath}
                fill="none"
                stroke={color}
                strokeWidth={lineThickness}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={estimatedPathLength}
                strokeDashoffset={lineDraw}
              />
              {/* Dots/pontos: mostrar apenas em hover OU quando < 20 pontos. (Aqui temos 6 pontos) */}
              {points.map((p, pIndex) => {
                const dotScale = interpolate(
                  frame,
                  [50 + sIndex * 5 + pIndex * 2, 70 + sIndex * 5 + pIndex * 2], // Staggered entry for dots
                  [0, 1],
                  {
                    extrapolateRight: 'clamp',
                    config: SPRING_CONFIG_LABELS,
                  }
                );
                return (
                  <React.Fragment key={`dot-${sIndex}-${pIndex}`}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={dotRadius}
                      fill={color}
                      transform={`scale(${dotScale})`}
                      transformOrigin={`${p.x}px ${p.y}px`}
                    />
                     {/* Label de Valor para cada ponto [TIPOGRAFIA E LABELS] */}
                    <text
                      x={p.x}
                      y={p.y - Math.round(10 * scale)} // Acima do ponto
                      textAnchor="middle"
                      fontSize={dataPointLabelFontSize}
                      fontWeight={600}
                      fill={textColor}
                      opacity={dotScale} // Usa a mesma animação de escala/opacidade do dot
                      style={{ textShadow: labelTextShadow }}
                    >
                      {formatNumber(s.data[pIndex])}
                    </text>
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          const x = plotAreaX + index * xPointSpacing;
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
    </AbsoluteFill>
  );
};
