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
const formatNumber = (num: number, unit: string = '', decimals?: number): string => {
  const options: Intl.NumberFormatOptions = { minimumFractionDigits: 0, maximumFractionDigits: 1 };
  if (decimals !== undefined) {
    options.minimumFractionDigits = decimals;
    options.maximumFractionDigits = decimals;
  }

  if (Math.abs(num) < 1000) {
    return `${num.toLocaleString('en-US', options)}${unit}`;
  }
  if (Math.abs(num) < 1000000) {
    return `${(num / 1000).toLocaleString('en-US', { ...options, maximumFractionDigits: 1 })}k${unit}`;
  }
  return `${(num / 1000000).toLocaleString('en-US', { ...options, maximumFractionDigits: 1 })}M${unit}`;
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

// Helper para calcular smooth line path 'd' attribute using cubic Bezier
// [REGRAS POR TIPO DE GRÁFICO -> Line Chart] - Smooth/curva: usar cubic-bezier
const getLinePathD = (points: { x: number; y: number }[], tension: number = 0.3): string => {
  if (points.length < 2) return '';

  let path = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : points[i + 1];

    // Cálculo de pontos de controle (simplificado, tipo Catmull-Rom)
    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;

    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;
    
    // [EDGE CASES E ROBUSTEZ] - Proteger contra NaN em SVG path
    const safeCp1x = isNaN(cp1x) ? p1.x : cp1x;
    const safeCp1y = isNaN(cp1y) ? p1.y : cp1y;
    const safeCp2x = isNaN(cp2x) ? p2.x : cp2x;
    const safeCp2y = isNaN(cp2y) ? p2.y : cp2y;
    const safeP2x = isNaN(p2.x) ? 0 : p2.x; // Garantir que o ponto de destino seja seguro
    const safeP2y = isNaN(p2.y) ? 0 : p2.y; // Garantir que o ponto de destino seja seguro

    path += ` C ${safeCp1x},${safeCp1y} ${safeCp2x},${safeCp2y} ${safeP2x},${safeP2y}`;
  }
  return path;
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
  
  // Processamento de dados para áreas empilhadas
  const numDataPoints = labels.length;
  // stackedData[seriesIndex][pointIndex] armazena a soma cumulativa até aquela série naquele ponto
  const stackedData: number[][] = Array(series.length)
    .fill(0)
    .map(() => Array(numDataPoints).fill(0));
  
  let maxTotalValue = 0;
  const currentStack = Array(numDataPoints).fill(0); // Para calcular o máximo total

  for (let sIdx = 0; sIdx < series.length; sIdx++) {
    for (let dIdx = 0; dIdx < numDataPoints; dIdx++) {
      const value = series[sIdx].data[dIdx] || 0; // Fallback para 0 se o ponto de dado estiver faltando
      currentStack[dIdx] += value;
      stackedData[sIdx][dIdx] = currentStack[dIdx];
    }
  }
  // [REGRAS DE ESTRUTURA E LAYOUT] - Escala Y sempre começa em 0
  maxTotalValue = Math.max(...currentStack, 0); 

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(18 * scale);
  const axisLabelFontSize = Math.round(11 * scale);
  const legendFontSize = Math.round(12 * scale);
  const textColor = '#FFFFFF';
  const axisTextColor = '#999999';
  const labelTextShadow = '0 1px 3px rgba(0,0,0,0.6)';

  // Cores [REGRAS DE CORES]
  // Paleta padrão GiantAnimator (quando sem referência)
  const defaultColors = ['#7CB5EC', '#F7A35C', '#90ED7D', '#E4D354', '#8085E9', '#F15C80', '#2B908F', '#E75480'];
  const gridColor = 'rgba(255,255,255,0.08)';
  const zeroLineColor = 'rgba(255,255,255,0.25)'; // Destacada

  // Calcular tick marks do eixo Y
  const numYTicks = 5; // Exemplo de 5 ticks principais
  const yTickValues = generateYAxisTicks(maxTotalValue, numYTicks);

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

        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const y = maxTotalValue > 0 
            ? plotAreaY + plotHeight - (tickValue / maxTotalValue) * plotHeight
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
                {formatNumber(tickValue, '', 1)} {/* Usando 1 casa decimal para largura de banda */}
              </text>
            </React.Fragment>
          );
        })}

        {/* Áreas e Linhas [REGRAS POR TIPO DE GRÁFICO -> Area Chart] */}
        {series.map((s, sIdx) => {
          const seriesColor = defaultColors[sIdx % defaultColors.length];
          const topPoints: { x: number; y: number }[] = [];
          const bottomPoints: { x: number; y: number }[] = [];

          for (let dIdx = 0; dIdx < numDataPoints; dIdx++) {
            // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero se numDataPoints for 1
            const x = numDataPoints > 1 
              ? plotAreaX + (dIdx / (numDataPoints - 1)) * plotWidth
              : plotAreaX + plotWidth / 2; // Centraliza se houver apenas um ponto
            
            // [EDGE CASES E ROBUSTEZ] - Proteger contra NaN
            const safeX = isNaN(x) ? plotAreaX : x;

            const topValue = stackedData[sIdx][dIdx];
            const bottomValue = sIdx > 0 ? stackedData[sIdx - 1][dIdx] : 0; // Base para a área atual

            const topY = maxTotalValue > 0 
              ? plotAreaY + plotHeight - (topValue / maxTotalValue) * plotHeight
              : plotAreaY + plotHeight; // Se maxTotalValue é 0, renderiza na linha de base

            const bottomY = maxTotalValue > 0 
              ? plotAreaY + plotHeight - (bottomValue / maxTotalValue) * plotHeight
              : plotAreaY + plotHeight;

            const safeTopY = isNaN(topY) ? plotAreaY + plotHeight : topY;
            const safeBottomY = isNaN(bottomY) ? plotAreaY + plotHeight : bottomY;

            topPoints.push({ x: safeX, y: safeTopY });
            bottomPoints.push({ x: safeX, y: safeBottomY });
          }

          // Gerar path para a linha superior (suavizada com Bezier)
          const linePathD = getLinePathD(topPoints);
          
          // Gerar path para o preenchimento da área
          // Começa no ponto inferior esquerdo, traça a linha superior (suavizada),
          // depois traça a linha inferior para trás (linear).
          let areaPathD = `M ${bottomPoints[0].x},${bottomPoints[0].y}`; // Começa no ponto inferior esquerdo
          areaPathD += getLinePathD(topPoints).replace('M', ' L'); // Traça a curva superior (substituindo M por L para conectar)
          areaPathD += ` L ${bottomPoints[numDataPoints - 1].x},${bottomPoints[numDataPoints - 1].y}`; // Conecta ao ponto inferior direito
          for (let i = numDataPoints - 2; i >= 0; i--) { // Traça os pontos inferiores para trás (linear)
            areaPathD += ` L ${bottomPoints[i].x},${bottomPoints[i].y}`;
          }
          areaPathD += ` Z`; // Fecha o caminho
          
          // Animação: Linha primeiro, depois preenchimento
          const lineDrawingStart = 10 + sIdx * 5; // Início escalonado do desenho da linha
          const lineDrawingEnd = 60 + sIdx * 5;

          const fillFadeStart = lineDrawingEnd - 10; // O preenchimento começa a aparecer antes do final do desenho da linha
          const fillFadeEnd = lineDrawingEnd + 10;

          // strokeDasharray com um valor generoso para cobrir qualquer comprimento de caminho
          const lineDashoffset = interpolate(frame, [lineDrawingStart, lineDrawingEnd], [plotWidth * 2, 0], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_MAIN,
          });

          // [REGRAS DE CORES] - Transparência em área charts: rgba(cor, 0.3) para fill
          const fillOpacity = interpolate(frame, [fillFadeStart, fillFadeEnd], [0, 0.3], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`series-${sIdx}`}>
              {/* Preenchimento da Área */}
              <path
                d={areaPathD}
                fill={seriesColor}
                fillOpacity={fillOpacity}
              />
              
              {/* Contorno da Linha [REGRAS POR TIPO DE GRÁFICO -> Area Chart] - mesma cor do fill com opacity: 1.0 */}
              <path
                d={linePathD}
                stroke={seriesColor}
                strokeWidth={Math.round(2.5 * scale)} // Espessura da linha: 2.5px para série principal
                fill="none"
                strokeDasharray={plotWidth * 2} // Usa um valor generoso para dasharray
                strokeDashoffset={lineDashoffset}
                strokeLinecap="round" // Para uma aparência suave
                strokeLinejoin="round" // Para uma aparência suave
              />
            </React.Fragment>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {labels.map((label, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero se numDataPoints for 1
          const x = numDataPoints > 1 
            ? plotAreaX + (index / (numDataPoints - 1)) * plotWidth
            : plotAreaX + plotWidth / 2; // Centralize se houver apenas um ponto
            
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

        {/* Legenda [REGRAS POR TIPO DE GRÁFICO -> Multi-Line Chart (aplicável aqui)] */}
        {/* Posicionada no topo ou à direita. Escolhida a posição superior direita. */}
        <g transform={`translate(${plotAreaX + plotWidth - Math.round(10 * scale)}, ${plotAreaY + Math.round(10 * scale)})`}>
          {series.map((s, sIdx) => {
            const seriesColor = defaultColors[sIdx % defaultColors.length];
            const legendItemY = sIdx * Math.round(20 * scale); // Espaçamento de 20px por item

            const legendOpacity = interpolate(frame, [60 + sIdx * 5, 80 + sIdx * 5], [0, 1], {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            });

            return (
              <g key={`legend-${sIdx}`} transform={`translate(0, ${legendItemY})`} opacity={legendOpacity}>
                <rect
                  x={0}
                  y={-Math.round(8 * scale)} // Ajustado para alinhar com o texto
                  width={Math.round(14 * scale)}
                  height={Math.round(14 * scale)}
                  fill={seriesColor}
                  rx={Math.round(2 * scale)}
                  ry={Math.round(2 * scale)}
                />
                <text
                  x={Math.round(20 * scale)}
                  y={0}
                  alignmentBaseline="middle"
                  fontSize={legendFontSize}
                  fill={textColor}
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
