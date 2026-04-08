import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig, SpringConfig } from 'remotion';

// [REGRAS DE ANIMAÇÃO] - Spring Configs (IMUTÁVEIS)
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

interface LinePoint {
  x: number;
  y: number;
}

interface LineChartProps {
  title: string;
  data: LinePoint[]; // Dados inferidos da imagem
  annotations: { // Anotações inferidas da imagem
    highest?: { x: number; y: number; label: string; arrowColor: string; textColor: string };
    lowest?: { x: number; y: number; label: string; arrowColor: string; textColor: string };
  };
}

// Helper para formatação de números [REGRAS DE TIPOGRAFIA E LABELS]
const formatNumber = (num: number, decimals: number = 0): string => {
  return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

// Helper para gerar um range de números para os ticks dos eixos
const generateAxisTicks = (minVal: number, maxVal: number, numTicks: number): number[] => {
  if (minVal === maxVal) return [minVal]; // Evita divisão por zero
  
  const step = (maxVal - minVal) / numTicks;
  const ticks = [];
  let currentTick = Math.floor(minVal / step) * step;
  if (currentTick < minVal) currentTick += step; // Garante que o primeiro tick não seja menor que min

  while (currentTick <= maxVal + step * 0.1) { // Adiciona um pequeno buffer para incluir o último tick
    ticks.push(parseFloat(currentTick.toFixed(2))); // Formata para evitar dízimas
    currentTick += step;
  }
  return ticks;
};

// Helper para gerar um path SVG suave (cubic-bezier) a partir de pontos
// Baseado em: https://stackoverflow.com/questions/52176214/svg-line-chart-with-smooth-line
const linePath = (points: { x: number, y: number }[]): string => {
  if (points.length < 2) return '';

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[0];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const tension = 0.5; // Ajusta a suavidade da curva
    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;

    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return path;
};

export const LineChart: React.FC<LineChartProps> = ({
  title = "Simple Line Chart", // Título inferido da imagem
  data = [ // Dados inferidos da imagem
    { x: 0, y: 450 }, { x: 1, y: 410 }, { x: 2, y: 520 }, { x: 3, y: 460 },
    { x: 4, y: 450 }, { x: 5, y: 500 }, { x: 6, y: 480 }, { x: 7, y: 480 },
    { x: 8, y: 410 }, { x: 9, y: 500 }, { x: 10, y: 480 }, { x: 11, y: 510 }
  ],
  annotations = { // Anotações inferidas da imagem
    highest: { x: 2, y: 520, label: "↑ highest", arrowColor: "#FF0000", textColor: "#333333" },
    lowest: { x: 8, y: 410, label: "↓ lowest", arrowColor: "#66AA66", textColor: "#333333" },
  }
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080); // Base em 1920x1080

  // Cores extraídas da imagem de referência [REGRA #1 - Paleta de cores exatas]
  const containerBgColor = '#F0F0F0'; // Cor de fundo do container quadrado
  const plotAreaBgColor = '#FFFFFF'; // Cor de fundo da área de plotagem
  const gridColor = '#E0E0E0'; // Cor das linhas do grid
  const axisLabelColor = '#606060'; // Cor dos labels dos eixos
  const titleColor = '#333333'; // Cor do título
  const lineColor = '#7788AA'; // Cor da linha principal
  const lineStrokeWidth = Math.round(2.5 * scale); // Espessura da linha

  // Margem interna para o container externo [REGRAS DE ESTRUTURA E LAYOUT]
  const CONTAINER_PADDING = Math.round(20 * scale);
  const CONTAINER_BORDER_RADIUS = Math.round(16 * scale); // Cantos arredondados do container

  // Plot Area dimensions e margens
  const PLOT_AREA_PADDING_VERTICAL = Math.round(30 * scale); // Mais padding em cima e embaixo da área de plotagem
  const PLOT_AREA_PADDING_HORIZONTAL = Math.round(20 * scale); // Padding nas laterais da área de plotagem
  const TITLE_SPACE_HEIGHT = Math.round(40 * scale); // Espaço para o título
  const X_AXIS_LABEL_SPACE = Math.round(30 * scale); // Espaço para labels do eixo X
  const Y_AXIS_LABEL_SPACE = Math.round(40 * scale); // Espaço para labels do eixo Y

  const chartAreaWidth = width - 2 * CONTAINER_PADDING;
  const chartAreaHeight = height - 2 * CONTAINER_PADDING;

  const plotWidth = chartAreaWidth - Y_AXIS_LABEL_SPACE - PLOT_AREA_PADDING_HORIZONTAL;
  const plotHeight = chartAreaHeight - TITLE_SPACE_HEIGHT - X_AXIS_LABEL_SPACE - PLOT_AREA_PADDING_VERTICAL;

  const plotX = CONTAINER_PADDING + Y_AXIS_LABEL_SPACE;
  const plotY = CONTAINER_PADDING + TITLE_SPACE_HEIGHT;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(data) || data.length < 2) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: Dados insuficientes para o Line Chart. Exibindo fallback.`);
    return (
      <div style={{
        backgroundColor: containerBgColor,
        borderRadius: CONTAINER_BORDER_RADIUS,
        color: titleColor,
        fontSize: Math.round(24 * scale),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width,
        height,
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
      }}>
        Sem dados para exibir o Line Chart.
      </div>
    );
  }

  // Encontrar min/max valores para os eixos com base nos dados inferidos
  const minXVal = Math.min(...data.map(d => d.x));
  const maxXVal = Math.max(...data.map(d => d.x));
  const minYVal = Math.min(...data.map(d => d.y));
  const maxYVal = Math.max(...data.map(d => d.y));

  // Range de exibição dos eixos (da imagem)
  const effectiveMinX = 0; // X-axis starts at 0
  const effectiveMaxX = 11; // X-axis goes up to 11 (inferred from point 10)
  const effectiveMinY = 400; // Y-axis starts at 400
  const effectiveMaxY = 550; // Y-axis goes up to 550

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(20 * scale); // 18-22px
  const axisLabelFontSize = Math.round(11 * scale); // 11-12px
  const annotationFontSize = Math.round(11 * scale); // 11-12px

  // Calcular tick marks para os eixos (inferidos da imagem)
  const xTickValues = [0, 2, 4, 6, 8, 10]; // Baseado na imagem
  const yTickValues = [400, 450, 500, 550]; // Baseado na imagem

  // ANIMAÇÃO - [REGRAS DE ANIMAÇÃO]
  // Entrada geral do gráfico (fade + scale)
  const chartEntranceOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });

  const chartScale = interpolate(frame, [0, 20], [0.8, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_MAIN,
  });

  console.log(`[${new Date().toISOString()}] GiantAnimator: Renderizando LineChart frame ${frame}.`);

  // Mapear pontos de dados para coordenadas SVG
  const svgPoints = data.map(point => {
    // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
    const xRatio = (effectiveMaxX - effectiveMinX) > 0 ? (point.x - effectiveMinX) / (effectiveMaxX - effectiveMinX) : 0;
    const yRatio = (effectiveMaxY - effectiveMinY) > 0 ? (point.y - effectiveMinY) / (effectiveMaxY - effectiveMinY) : 0;

    const svgX = plotX + xRatio * plotWidth;
    const svgY = plotY + plotHeight - yRatio * plotHeight; // Y é invertido no SVG

    return { x: svgX, y: svgY };
  });

  const linePathD = linePath(svgPoints);
  const pathLength = linePathD ? document.createElementNS("http://www.w3.org/2000/svg", "path").getTotalLength() : 0;

  const animatedDashoffset = interpolate(
    frame,
    [20, 80], // Animação de "desenho" da linha (frames 20 a 80)
    [pathLength, 0],
    {
      extrapolateRight: 'clamp',
      config: SPRING_CONFIG_MAIN,
    }
  );

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: containerBgColor, // Cor de fundo do container externo (fiel à referência)
        borderRadius: CONTAINER_BORDER_RADIUS, // Cantos arredondados do container externo (fiel à referência)
        overflow: 'hidden', // Para garantir que o borderRadius seja visível
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        transform: `scale(${chartScale})`,
        opacity: chartEntranceOpacity,
        transformOrigin: 'center center',
        position: 'relative', // Para posicionamento absoluto da área de plotagem se necessário
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Container da Área de Plotagem (fiel à referência) */}
        <rect
          x={plotX - PLOT_AREA_PADDING_HORIZONTAL / 2} // Ajustar para o padding horizontal da área de plotagem
          y={plotY - PLOT_AREA_PADDING_VERTICAL / 2} // Ajustar para o padding vertical da área de plotagem
          width={plotWidth + PLOT_AREA_PADDING_HORIZONTAL}
          height={plotHeight + PLOT_AREA_PADDING_VERTICAL}
          fill={plotAreaBgColor} // Cor de fundo da área de plotagem (fiel à referência)
        />

        {/* Título do Gráfico [REGRAS DE TIPOGRAFIA E LABELS] */}
        <text
          x={width / 2}
          y={CONTAINER_PADDING + TITLE_SPACE_HEIGHT / 2}
          textAnchor="middle"
          fontSize={titleFontSize}
          fontWeight={700}
          fill={titleColor}
        >
          {title}
        </text>

        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          const yPos = plotY + plotHeight - ((tickValue - effectiveMinY) / (effectiveMaxY - effectiveMinY)) * plotHeight;
          const isZeroLine = tickValue === effectiveMinY; // A linha 400 é a "zero" da escala visível

          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`y-grid-${index}`}>
              <line
                x1={plotX}
                y1={yPos}
                x2={plotX + plotWidth}
                y2={yPos}
                stroke={gridColor} // Cor do grid (fiel à referência)
                strokeWidth={isZeroLine ? Math.round(1.5 * scale) : Math.round(1 * scale)} // Linha zero um pouco mais grossa
                opacity={gridLineOpacity}
              />
              <text
                x={plotX - Math.round(10 * scale)} // Espaçamento à esquerda
                y={yPos + Math.round(axisLabelFontSize / 3)}
                textAnchor="end"
                fontSize={axisLabelFontSize}
                fill={axisLabelColor} // Cor dos labels (fiel à referência)
                opacity={gridLineOpacity}
              >
                {formatNumber(tickValue)}
              </text>
            </React.Fragment>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {xTickValues.map((tickValue, index) => {
          const xPos = plotX + ((tickValue - effectiveMinX) / (effectiveMaxX - effectiveMinX)) * plotWidth;
          
          const labelOpacity = interpolate(frame, [40, 60], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <text
              key={`x-label-${index}`}
              x={xPos}
              y={plotY + plotHeight + Math.round(15 * scale)} // Posição abaixo do eixo
              textAnchor="middle"
              fontSize={axisLabelFontSize}
              fill={axisLabelColor} // Cor dos labels (fiel à referência)
              opacity={labelOpacity}
            >
              {formatNumber(tickValue)}
            </text>
          );
        })}

        {/* Linha da Série [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
        <path
          d={linePathD}
          fill="none"
          stroke={lineColor} // Cor da linha (fiel à referência)
          strokeWidth={lineStrokeWidth} // Espessura da linha
          strokeDasharray={pathLength}
          strokeDashoffset={animatedDashoffset}
        />

        {/* Anotações Highest e Lowest [REGRAS DE TIPOGRAFIA E LABELS] */}
        {annotations.highest && (() => {
          const highestPoint = svgPoints.find(p => p.x === svgPoints[2].x && p.y === svgPoints[2].y); // Ponto (2, 520)
          if (!highestPoint) return null;

          const annotationOpacity = interpolate(frame, [70, 80], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_LABELS,
          });

          return (
            <g opacity={annotationOpacity}>
              {/* Seta Highest (↑) */}
              <path
                d={`M ${highestPoint.x} ${highestPoint.y - Math.round(10 * scale)} L ${highestPoint.x} ${highestPoint.y - Math.round(25 * scale)} M ${highestPoint.x} ${highestPoint.y - Math.round(25 * scale)} L ${highestPoint.x - Math.round(4 * scale)} ${highestPoint.y - Math.round(20 * scale)} M ${highestPoint.x} ${highestPoint.y - Math.round(25 * scale)} L ${highestPoint.x + Math.round(4 * scale)} ${highestPoint.y - Math.round(20 * scale)}`}
                stroke={annotations.highest?.arrowColor} // Vermelho (fiel à referência)
                strokeWidth={Math.round(2 * scale)}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Texto Highest */}
              <text
                x={highestPoint.x}
                y={highestPoint.y - Math.round(30 * scale)}
                textAnchor="middle"
                fontSize={annotationFontSize}
                fill={annotations.highest?.textColor} // Cinza escuro (fiel à referência)
              >
                {annotations.highest?.label}
              </text>
            </g>
          );
        })()}

        {annotations.lowest && (() => {
          const lowestPoint = svgPoints.find(p => p.x === svgPoints[8].x && p.y === svgPoints[8].y); // Ponto (8, 410)
          if (!lowestPoint) return null;

          const annotationOpacity = interpolate(frame, [70, 80], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_LABELS,
          });

          return (
            <g opacity={annotationOpacity}>
              {/* Seta Lowest (↓) */}
              <path
                d={`M ${lowestPoint.x} ${lowestPoint.y + Math.round(10 * scale)} L ${lowestPoint.x} ${lowestPoint.y + Math.round(25 * scale)} M ${lowestPoint.x} ${lowestPoint.y + Math.round(25 * scale)} L ${lowestPoint.x - Math.round(4 * scale)} ${lowestPoint.y + Math.round(20 * scale)} M ${lowestPoint.x} ${lowestPoint.y + Math.round(25 * scale)} L ${lowestPoint.x + Math.round(4 * scale)} ${lowestPoint.y + Math.round(20 * scale)}`}
                stroke={annotations.lowest?.arrowColor} // Verde (fiel à referência)
                strokeWidth={Math.round(2 * scale)}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* O "X" em cima da seta de lowest */}
               <text
                x={lowestPoint.x}
                y={lowestPoint.y + Math.round(16 * scale)} // Posição do X
                textAnchor="middle"
                fontSize={Math.round(8 * scale)} // Tamanho menor
                fill={annotations.lowest?.textColor} // Cinza escuro
                fontWeight={700} // Bold para o X
              >
                x
              </text>
              {/* Texto Lowest */}
              <text
                x={lowestPoint.x}
                y={lowestPoint.y + Math.round(30 * scale)}
                textAnchor="middle"
                fontSize={annotationFontSize}
                fill={annotations.lowest?.textColor} // Cinza escuro (fiel à referência)
              >
                {annotations.lowest?.label}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
};
