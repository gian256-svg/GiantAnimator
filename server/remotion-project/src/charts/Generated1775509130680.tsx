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

interface LineChartProps {
  title: string;
  data: number[];
  xLabels?: string[]; // Optional, will default to indices if not provided
  yAxisRange?: [number, number]; // [minY, maxY] to define the axis scale
}

// Helper para gerar um path 'd' para curvas suaves (cubic-bezier)
// Adaptado de uma abordagem comum de Catmull-Rom para Bezier
function getSmoothLinePath(points: { x: number; y: number }[], tension: number = 0.5): string {
    if (points.length < 2) return '';

    let d = `M${points[0].x},${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = i > 0 ? points[i - 1] : points[0];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = i < points.length - 2 ? points[i + 2] : points[i + 1];

        // Calculate control points for cubic Bezier (C) command
        // cp1 for segment (p1 -> p2)
        const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
        const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;

        // cp2 for segment (p1 -> p2)
        const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
        const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

        d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }
    return d;
}

export const LineChart: React.FC<LineChartProps> = ({
  title,
  data,
  xLabels,
  yAxisRange,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Plot Area dimensions e margens (ajustado para o layout da imagem)
  const PLOT_AREA_PADDING_TOP = Math.round(50 * scale); // Topo para título
  const PLOT_AREA_PADDING_BOTTOM = Math.round(50 * scale); // Base para labels X
  const PLOT_AREA_PADDING_LEFT = Math.round(50 * scale); // Esquerda para labels Y
  const PLOT_AREA_PADDING_RIGHT = Math.round(30 * scale); // Direita para respiro

  const chartWidth = width; // Ocupa largura total, mas o plot area tem padding
  const chartHeight = height;

  const plotAreaX = PLOT_AREA_PADDING_LEFT;
  const plotAreaY = PLOT_AREA_PADDING_TOP;
  const plotWidth = chartWidth - PLOT_AREA_PADDING_LEFT - PLOT_AREA_PADDING_RIGHT;
  const plotHeight = chartHeight - PLOT_AREA_PADDING_TOP - PLOT_AREA_PADDING_BOTTOM;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(data) || data.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided or data is empty. Displaying fallback.`);
    return (
      <div style={{
        backgroundColor: '#EBEBEB', // Cor de fundo da referência
        color: '#333333',
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

  // Determine o range do eixo Y baseado na imagem de referência ou nos dados
  // A imagem mostra de 400 a 550, mesmo que os dados não atinjam esses extremos.
  const effectiveMinY = yAxisRange ? yAxisRange[0] : Math.floor(Math.min(...data) / 50) * 50;
  const effectiveMaxY = yAxisRange ? yAxisRange[1] : Math.ceil(Math.max(...data) / 50) * 50;
  
  // Se não foi fornecido yAxisRange, garantir que os dados estejam visíveis
  const dataMin = Math.min(...data);
  const dataMax = Math.max(...data);
  const finalMinY = yAxisRange ? yAxisRange[0] : Math.min(effectiveMinY, dataMin - (dataMax - dataMin) * 0.1);
  const finalMaxY = yAxisRange ? yAxisRange[1] : Math.max(effectiveMaxY, dataMax + (dataMax - dataMin) * 0.1);

  // Forçar o range da imagem: [400, 550]
  const chartMinY = 400;
  const chartMaxY = 550;
  const yAxisTicks = [400, 450, 500, 550]; // Ticks explícitos da imagem

  const numPoints = data.length;
  const xStep = plotWidth / (numPoints - 1); // Espaçamento entre os pontos no eixo X

  // Cores (extraídas da imagem de referência)
  const backgroundColor = '#EBEBEB';
  const chartLineColor = '#6B8DD2'; // Muted blue da linha
  const pointColor = '#6B8DD2';
  const gridLineColor = '#D3D3D3'; // Linhas de grid da imagem
  const titleColor = '#333333';
  const axisLabelColor = '#666666';
  const highestLabelColor = '#333333';
  const highestArrowColor = '#FF0000'; // Red
  const lowestLabelColor = '#333333';
  const lowestCrossColor = '#008000'; // Green

  // Tipografia (extraída da imagem de referência)
  const titleFontSize = Math.round(20 * scale); // Mais grosso que o padrão GiantAnimator se necessário. A imagem parece 20px.
  const axisLabelFontSize = Math.round(12 * scale);
  const specialLabelFontSize = Math.round(12 * scale);

  // ANIMAÇÃO - [REGRAS DE ANIMAÇÃO]
  // Entrada geral do gráfico (fade + scale)
  const chartEntranceOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_SUBTLE,
  });
  const chartEntranceScale = interpolate(frame, [0, 20], [0.8, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_MAIN,
  });

  // Calculate coordinates for all points
  const pointsData = data.map((value, index) => {
    // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
    const x = plotAreaX + index * xStep;
    const y = chartMaxY === chartMinY 
      ? plotAreaY + plotHeight / 2 // Evita divisão por zero se range for 0
      : plotAreaY + plotHeight - ((value - chartMinY) / (chartMaxY - chartMinY)) * plotHeight;
    return { x: isNaN(x) ? 0 : x, y: isNaN(y) ? 0 : y, value }; // [EDGE CASES E ROBUSTEZ] NaN protection
  });

  // Find highest and lowest points
  let highestPointIndex = 0;
  let lowestPointIndex = 0;
  if (data.length > 0) {
    let highestValue = -Infinity;
    let lowestValue = Infinity;
    data.forEach((value, index) => {
      if (value > highestValue) {
        highestValue = value;
        highestPointIndex = index;
      }
      if (value < lowestValue) {
        lowestValue = value;
        lowestPointIndex = index;
      }
    });
  }

  // Path for the line (animated drawing)
  const linePath = getSmoothLinePath(pointsData);
  const pathLength = linePath.length; // Placeholder, real path length requires SVG PathElement.getTotalLength()
                                   // For Remotion, we can approximate or use a fixed large value.
                                   // A common way is to make it an arbitrary large number.
  const animatedStrokeDashoffset = interpolate(
    frame,
    [10, 60], // Start drawing later, finish drawing
    [pathLength, 0], // From full length to 0
    {
      extrapolateRight: 'clamp',
      config: SPRING_CONFIG_MAIN,
    }
  );

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering LineChart frame ${frame}.`);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: backgroundColor,
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        transform: `scale(${chartEntranceScale})`,
        opacity: chartEntranceOpacity,
        transformOrigin: 'center center',
      }}
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Título do Gráfico [REGRAS DE TIPOGRAFIA E LABELS] */}
        <text
          x={width / 2}
          y={PLOT_AREA_PADDING_TOP - Math.round(10 * scale)} // Ajuste baseado na referência
          textAnchor="middle"
          fontSize={titleFontSize}
          fontWeight={700} // A imagem parece usar um peso maior
          fill={titleColor}
        >
          {title}
        </text>

        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yAxisTicks.map((tickValue, index) => {
          // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
          const y = chartMaxY === chartMinY 
            ? plotAreaY + plotHeight / 2
            : plotAreaY + plotHeight - ((tickValue - chartMinY) / (chartMaxY - chartMinY)) * plotHeight;
          
          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`grid-line-${tickValue}`}>
              <line
                x1={plotAreaX}
                y1={y}
                x2={plotAreaX + plotWidth}
                y2={y}
                stroke={gridLineColor}
                strokeWidth={1}
                strokeDasharray={0} // Solid line as per reference image
                opacity={gridLineOpacity}
              />
              {/* Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
              <text
                x={plotAreaX - Math.round(10 * scale)} // Padding à esquerda da linha
                y={y + Math.round(axisLabelFontSize / 3)} // Ajuste vertical
                textAnchor="end" // Alinhado à direita
                fontSize={axisLabelFontSize}
                fill={axisLabelColor}
                opacity={gridLineOpacity}
              >
                {tickValue}
              </text>
            </React.Fragment>
          );
        })}

        {/* Linha do Gráfico (animada) [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
        <path
          d={linePath}
          fill="none"
          stroke={chartLineColor}
          strokeWidth={Math.round(2.5 * scale)} // Espessura da linha 2.5px
          strokeDasharray={pathLength} // Necessário para a animação de "desenho"
          strokeDashoffset={animatedStrokeDashoffset}
          strokeLinecap="round" // Suaviza as pontas da linha
          strokeLinejoin="round" // Suaviza os cantos
        />

        {/* Pontos do Gráfico [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
        {pointsData.map((point, index) => {
          const pointScale = interpolate(
            frame,
            [50 + index * 2, 70 + index * 2], // Staggered entry
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            }
          );
          const pointOpacity = interpolate(
            frame,
            [50 + index * 2, 70 + index * 2],
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_SUBTLE,
            }
          );

          // Tamanho do ponto: 6px raio (12px diâmetro)
          const pointRadius = Math.round(6 * scale); 

          return (
            <circle
              key={`point-${index}`}
              cx={point.x}
              cy={point.y}
              r={pointRadius}
              fill={pointColor}
              transform={`scale(${pointScale})`}
              transformOrigin={`${point.x}px ${point.y}px`}
              opacity={pointOpacity}
            />
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {pointsData.map((point, index) => {
          const displayLabel = xLabels && xLabels[index] !== "" ? xLabels[index] : (index % 2 === 0 ? String(index) : ""); // Mostra só os pares como na imagem
          if (!displayLabel) return null;

          const labelOpacity = interpolate(frame, [40, 60], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <text
              key={`xlabel-${index}`}
              x={point.x}
              y={plotAreaY + plotHeight + Math.round(20 * scale)} // Posição abaixo do eixo
              textAnchor="middle" // Centralizado sob cada ponto
              fontSize={axisLabelFontSize}
              fill={axisLabelColor}
              opacity={labelOpacity}
            >
              {displayLabel}
            </text>
          );
        })}

        {/* Label "highest" [REGRA #1: Replicar Fielmente] */}
        {data.length > 0 && (
          <g>
            <text
              x={pointsData[highestPointIndex].x}
              y={pointsData[highestPointIndex].y - Math.round(30 * scale)} // Posição acima do ponto
              textAnchor="middle"
              fontSize={specialLabelFontSize}
              fill={highestLabelColor}
              opacity={interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_LABELS })}
            >
              <tspan fill={highestArrowColor}>↑</tspan> highest
            </text>
          </g>
        )}

        {/* Label "lowest" [REGRA #1: Replicar Fielmente] */}
        {data.length > 0 && (
          <g>
            <text
              x={pointsData[lowestPointIndex].x}
              y={pointsData[lowestPointIndex].y + Math.round(30 * scale)} // Posição abaixo do ponto
              textAnchor="middle"
              fontSize={specialLabelFontSize}
              fill={lowestLabelColor}
              opacity={interpolate(frame, [60, 80], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_LABELS })}
            >
              <tspan fill={lowestCrossColor} style={{ fontWeight: 800 }}>⤫</tspan> lowest
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

// Exemplo de uso para o Composition.tsx (não faz parte do componente, apenas para referência)
/*
import { Composition } from 'remotion';
import { LineChart } from './LineChart';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="LineChart"
      component={LineChart}
      durationInFrames={90}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        title: "Simple Line Chart",
        data: [450, 410, 515, 460, 450, 500, 475, 475, 410, 500, 475, 510],
        xLabels: ["0", "", "2", "", "4", "", "6", "", "8", "", "10", ""], // Explicitly handling sparse labels
        yAxisRange: [400, 550] // Manualmente definido para corresponder ao eixo Y da imagem
      }}
    />
  );
};
*/
