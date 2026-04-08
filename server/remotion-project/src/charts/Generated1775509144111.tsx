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
  labels: string[]; // Rótulos do eixo X (categorias)
  series: Array<{
    label: string; // Nome da série para a legenda
    data: number[]; // Pontos de dados para a linha
  }>;
}

// Helper para formatação de números [REGRAS DE TIPOGRAFIA E LABELS]
const formatNumber = (num: number, prefix: string = '', decimals: number = 0): string => {
  // [EDGE CASES E ROBUSTEZ] - Proteger contra NaN
  if (isNaN(num)) return '';

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

// Função para gerar dados de caminho "suave" (atributo 'd') usando curvas de Bezier cúbicas.
// Isso tenta criar um spline semelhante ao Catmull-Rom.
// O fator de tensão controla o quanto a curva se dobra. 0 = reto, maior = mais curva.
const getSmoothLinePath = (points: { x: number; y: number }[], tension: number = 0.4): string => {
  if (points.length < 2) {
    return "";
  }

  let pathData = `M${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];

    // Determina pontos anteriores e posteriores virtuais para o cálculo da tangente
    const pMinus1 = i > 0 ? points[i - 1] : p0; // Se no início, o ponto anterior é o atual
    const pPlus2 = i < points.length - 2 ? points[i + 2] : p1; // Se no final, o próximo ponto é o atual

    // Calcula os pontos de controle para o segmento Bezier de p0 a p1
    // Ponto de controle 1 (para p0)
    const cp1x = p0.x + (p1.x - pMinus1.x) * tension;
    const cp1y = p0.y + (p1.y - pMinus1.y) * tension;

    // Ponto de controle 2 (para p1)
    const cp2x = p1.x - (pPlus2.x - p0.x) * tension;
    const cp2y = p1.y - (pPlus2.y - p0.y) * tension;

    pathData += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p1.x},${p1.y}`;
  }
  return pathData;
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
  const Y_AXIS_LABEL_WIDTH = Math.round(80 * scale); // Espaço para labels do eixo Y
  const LEGEND_HEIGHT = Math.round(40 * scale); // Espaço para legenda (ajustado para múltiplas séries)

  const chartWidth = width - 2 * PLOT_AREA_PADDING;
  const chartHeight = height - 2 * PLOT_AREA_PADDING - TITLE_HEIGHT - X_AXIS_LABEL_HEIGHT - LEGEND_HEIGHT;

  const plotAreaX = PLOT_AREA_PADDING + Y_AXIS_LABEL_WIDTH;
  const plotAreaY = PLOT_AREA_PADDING + TITLE_HEIGHT + LEGEND_HEIGHT; // Deslocado para baixo para a legenda
  const plotWidth = chartWidth - Y_AXIS_LABEL_WIDTH;
  const plotHeight = chartHeight;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(series) || series.length === 0 || !Array.isArray(series[0].data) || series[0].data.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided or data is empty. Displaying fallback.`);
    return (
      <AbsoluteFill
        style={{
          backgroundColor: '#1a1a2e',
          color: '#FFFFFF',
          fontSize: Math.round(24 * scale),
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        }}
      >
        Sem dados para exibir.
      </AbsoluteFill>
    );
  }

  // Determinar o valor máximo em todas as séries para escala do eixo Y
  const allDataPoints = series.flatMap(s => s.data);
  const maxValue = Math.max(...allDataPoints, 0); // Eixo Y sempre começa em 0
  
  // X-axis point spacing
  const numPoints = labels.length;
  
  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const legendFontSize = Math.round(12 * scale);
  const dotRadius = Math.round(6 * scale); // [Line Chart] 6px raio (12px diâmetro)

  // Cores [REGRAS DE CORES] - Paleta padrão GiantAnimator
  const palette = [
    '#7CB5EC', // Azul
    '#F7A35C', // Laranja
    '#90ED7D', // Verde
    '#E4D354', // Amarelo
    '#8085E9', // Roxo
    '#F15C80', // Rosa
    '#2B908F', // Teal
    '#E75480', // Magenta
  ];
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)'; // Destacada
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const legendTextColor = '#CCCCCC';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // Calcular tick marks para o eixo Y
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

        {/* Legenda [REGRAS DE ESTRUTURA E LAYOUT] & [REGRAS DE TIPOGRAFIA E LABELS] */}
        {/* Posição no topo-direita */}
        <g 
          transform={`translate(${width - PLOT_AREA_PADDING - Math.round(150 * scale)}, ${PLOT_AREA_PADDING + TITLE_HEIGHT + Math.round(10 * scale)})`}
        >
          {series.map((s, sIndex) => {
            const legendOpacity = interpolate(frame, [60 + sIndex * 5, 80 + sIndex * 5], [0, 1], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            });

            const legendColor = palette[sIndex % palette.length];
            const itemY = sIndex * Math.round(20 * scale); // Espaçamento vertical para itens da legenda

            return (
              <g key={`legend-${s.label}`} opacity={legendOpacity}>
                <rect
                  x={0}
                  y={itemY - Math.round(8 * scale)} // Ajustado para alinhar com a linha de base do texto
                  width={Math.round(16 * scale)}
                  height={Math.round(2 * scale)} // Indicador de linha
                  fill={legendColor}
                />
                 <circle
                  cx={Math.round(8 * scale)}
                  cy={itemY - Math.round(7 * scale)} // Alinhar com o indicador de linha e texto
                  r={Math.round(3 * scale)} // Ponto menor para a legenda
                  fill={legendColor}
                />
                <text
                  x={Math.round(24 * scale)} // Deslocamento do marcador
                  y={itemY}
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
                strokeDasharray={isZeroLine ? '' : '4 4'} // Sólido para zero, tracejado para outros
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

        {/* Linhas e Pontos de Dados [REGRAS POR TIPO DE GRÁFICO -> Multi-Line Chart] */}
        {series.map((s, sIndex) => {
          const lineColor = palette[sIndex % palette.length];
          
          // Converte pontos de dados para coordenadas SVG
          const points = s.data.map((value, index) => {
            // [EDGE CASES E ROBUSTEZ] - Proteção para `numPoints` <= 1
            const pointX = numPoints <= 1 
              ? plotAreaX + plotWidth / 2 
              : plotAreaX + index * (plotWidth / (numPoints - 1));

            const pointY = maxValue > 0 
              ? plotAreaY + plotHeight - (value / maxValue) * plotHeight 
              : plotAreaY + plotHeight; // Se maxValue é 0, todos os pontos ficam na base
            
            // [EDGE CASES E ROBUSTEZ] - Garantir que X e Y não sejam NaN
            const safeX = isNaN(pointX) ? 0 : pointX;
            const safeY = isNaN(pointY) ? 0 : pointY;

            return { x: safeX, y: safeY };
          });

          const pathData = getSmoothLinePath(points);
          
          // Estima o comprimento do caminho para a animação de strokeDashoffset
          // Não é possível usar SVGPathElement.getTotalLength() no contexto Node do Remotion.
          // Usando uma diagonal máxima da área do gráfico como um limite superior seguro.
          const maxApproxPathLength = Math.sqrt(plotWidth * plotWidth + plotHeight * plotHeight);

          // Animação de desenho da linha [REGRAS DE ANIMAÇÃO]
          const lineDrawingProgress = interpolate(
            frame,
            [10 + sIndex * 10, 70 + sIndex * 10], // Início escalonado por série
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          );
          const strokeDashoffset = maxApproxPathLength * (1 - lineDrawingProgress);
          
          // Animação dos pontos [REGRAS DE ANIMAÇÃO]
          const pointScale = interpolate(
            frame,
            [50 + sIndex * 10, 75 + sIndex * 10], // Pontos aparecem depois que a linha começa a desenhar, escalonado
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            }
          );

          return (
            <g key={`series-${s.label}`}>
              <path
                d={pathData}
                fill="none"
                stroke={lineColor}
                strokeWidth={Math.round(2.5 * scale)} // [Line Chart] 2.5px para série principal
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={maxApproxPathLength}
                strokeDashoffset={strokeDashoffset}
              />
              {/* Dots/pontos: mostrar quando < 20 pontos (aqui temos 6) [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
              {points.map((p, pIndex) => (
                <circle
                  key={`point-${s.label}-${pIndex}`}
                  cx={p.x}
                  cy={p.y}
                  r={dotRadius} // [Line Chart] 6px raio
                  fill={lineColor}
                  transform={`scale(${pointScale})`}
                  transformOrigin={`${p.x}px ${p.y}px`}
                  opacity={pointScale} // Também esmaece com a escala
                />
              ))}
            </g>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          // [EDGE CASES E ROBUSTEZ] - Proteção para `numPoints` <= 1
          const x = numPoints <= 1 
            ? plotAreaX + plotWidth / 2 
            : plotAreaX + index * (plotWidth / (numPoints - 1));
          
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
              textAnchor="middle" // Centralizado sob cada ponto do eixo X
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
