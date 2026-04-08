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

interface LineChartProps {
  title: string;
  labels: string[]; // X-axis labels
  series: Array<{
    label: string;
    data: number[];
  }>;
}

// Helper para gerar um caminho SVG suave (cubic-bezier)
// Adaptação de https://stackoverflow.com/questions/65004740/how-to-create-svg-smooth-line-chart-with-react-and-d3
const getSmoothLinePath = (points: { x: number; y: number }[]) => {
  if (points.length < 2) return '';

  let path = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[0];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const tension = 0.5; // Controla a suavidade da curva

    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;

    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

    path += ` C ${cp1x},${cp1y}, ${cp2x},${cp2y}, ${p2.x},${p2.y}`;
  }
  return path;
};

export const LineChart: React.FC<LineChartProps> = ({
  title,
  labels,
  series,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // [REGRA #1 - REPLIQUE FIELMENTE] - Extração de cores do gráfico de referência
  const chartBgColor = '#F1F1F1'; // Light gray background
  const lineColor = '#7381A5'; // Muted blue line
  const gridLineColor = '#D3D3D3'; // Light gray grid lines
  const titleColor = '#333333'; // Dark gray title
  const axisLabelColor = '#555555'; // Slightly lighter dark gray for axis labels
  const highestMarkerColor = '#FF0000'; // Red for highest arrow
  const lowestMarkerColor = '#555555'; // Dark gray for lowest cross (matching axis labels)
  const markerLabelColor = '#333333'; // Dark gray for marker labels

  // Plot Area dimensions e margens (ajustadas visualmente para replicar a imagem)
  const PLOT_AREA_MARGIN_TOP = Math.round(80 * scale);
  const PLOT_AREA_MARGIN_BOTTOM = Math.round(80 * scale);
  const PLOT_AREA_MARGIN_LEFT = Math.round(80 * scale); // Para labels do eixo Y
  const PLOT_AREA_MARGIN_RIGHT = Math.round(40 * scale); // Respiro à direita

  const plotWidth = width - PLOT_AREA_MARGIN_LEFT - PLOT_AREA_MARGIN_RIGHT;
  const plotHeight = height - PLOT_AREA_MARGIN_TOP - PLOT_AREA_MARGIN_BOTTOM;

  const plotAreaX = PLOT_AREA_MARGIN_LEFT;
  const plotAreaY = PLOT_AREA_MARGIN_TOP;

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

  const data = series[0].data; // Usando a primeira série para um Line Chart simples
  const numDataPoints = data.length;

  // [REGRA #1 - REPLIQUE FIELMENTE] - Eixo Y começa em 400, termina em 550
  const minYValue = 400;
  const maxYValue = 550;
  
  const yScale = plotHeight / (maxYValue - minYValue);
  const xScale = plotWidth / (numDataPoints > 1 ? numDataPoints - 1 : 1); // Evitar divisão por zero se houver apenas um ponto

  // Encontrar pontos de maior e menor valor para os marcadores
  const maxDataValue = Math.max(...data);
  let maxDataIndex = data.indexOf(maxDataValue);
  
  const minDataValue = Math.min(...data);
  let minDataIndexToMark = data.indexOf(minDataValue);
  // [REGRA #1 - REPLIQUE FIELMENTE] - A imagem marca o índice 8 como o menor valor, mesmo que o índice 1 tenha o mesmo valor.
  if (data[8] === minDataValue) {
    minDataIndexToMark = 8;
  }

  // Converter pontos de dados para coordenadas SVG
  const points: { x: number; y: number }[] = data.map((value, index) => ({
    x: plotAreaX + index * xScale,
    y: plotAreaY + plotHeight - (value - minYValue) * yScale,
  }));

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

  // Animação da linha (desenho)
  const linePath = getSmoothLinePath(points);
  // [REGRA #1 / SEM WINDOW/DOCUMENT] - Estimativa para pathLength, pois getTotalLength() não é disponível em ambiente Node.js.
  const ESTIMATED_PATH_LENGTH = 1100 * scale; 

  const animatedLineDashoffset = interpolate(
    frame,
    [10, 70], // Animação do frame 10 ao 70
    [ESTIMATED_PATH_LENGTH, 0],
    {
      extrapolateRight: 'clamp',
      config: SPRING_CONFIG_MAIN,
    }
  );

  // Animação dos pontos
  const dotOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_LABELS,
  });

  // Animação dos marcadores Highest/Lowest
  const markerOpacity = interpolate(frame, [70, 90], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_LABELS,
  });
  const markerScale = interpolate(frame, [70, 90], [0.5, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_LABELS,
  });

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering LineChart frame ${frame}.`);

  // [TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(22 * scale); // Tamanho do título da imagem
  const axisLabelFontSize = Math.round(13 * scale); // Tamanho dos labels dos eixos da imagem
  const markerLabelFontSize = Math.round(11 * scale); // Tamanho dos labels Highest/Lowest da imagem
  const dotRadius = Math.round(6 * scale); // [Line Chart] - Tamanho do ponto: 6px raio

  return (
    <AbsoluteFill style={{
      backgroundColor: chartBgColor,
      fontFamily: 'Inter, "Helvetica Neue", sans-serif',
      transform: `scale(${chartScale})`,
      opacity: chartEntrance,
      transformOrigin: 'center center',
    }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Título do Gráfico [REGRAS DE TIPOGRAFIA E LABELS] */}
        <text
          x={width / 2}
          y={plotAreaY / 2 + Math.round(10 * scale)} // Ajuste visual para corresponder à imagem
          textAnchor="middle"
          fontSize={titleFontSize}
          fontWeight={600} // O título da imagem parece ser bold
          fill={titleColor}
        >
          {title}
        </text>

        {/* Grid Horizontais e Labels do Eixo Y [REGRA #1 - REPLIQUE FIELMENTE] */}
        {/* Ticks do eixo Y da imagem: 400, 450, 500, 550 */}
        {[400, 450, 500, 550].map((tickValue, index) => {
          const y = plotAreaY + plotHeight - (tickValue - minYValue) * yScale;
          
          const gridLineOpacity = interpolate(frame, [10, 30], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <React.Fragment key={`grid-y-${index}`}>
              <line
                x1={plotAreaX}
                y1={y}
                x2={plotAreaX + plotWidth}
                y2={y}
                stroke={gridLineColor}
                strokeWidth={1}
                strokeDasharray={''} // [REGRA #1] - Linhas sólidas conforme a imagem
                opacity={gridLineOpacity}
              />
              {/* Labels do Eixo Y [REGRA #1 - REPLIQUE FIELMENTE] - Alinhados à direita do número, mas à esquerda do plotAreaX */}
              <text
                x={plotAreaX - Math.round(10 * scale)} // Padding à esquerda do plotAreaX
                y={y + Math.round(axisLabelFontSize / 3)} // Ajuste vertical
                textAnchor="end" // Alinhado à direita do texto
                fontSize={axisLabelFontSize}
                fill={axisLabelColor}
                opacity={gridLineOpacity}
              >
                {tickValue}
              </text>
            </React.Fragment>
          );
        })}
        
        {/* Labels do Eixo X [REGRA #1 - REPLIQUE FIELMENTE] - Apenas 0, 2, 4, 6, 8, 10 */}
        {labels.map((label, index) => {
          // Renderizar apenas labels que são múltiplos de 2 (0, 2, 4, etc.) para corresponder à imagem
          if (parseInt(label, 10) % 2 !== 0 && parseInt(label, 10) !== 0) return null;

          const x = plotAreaX + index * xScale;
          const y = plotAreaY + plotHeight + Math.round(20 * scale); // Posição abaixo do eixo

          const labelOpacity = interpolate(frame, [40, 60], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <text
              key={`label-x-${index}`}
              x={x}
              y={y}
              textAnchor="middle" // Centralizado sob cada ponto
              fontSize={axisLabelFontSize}
              fill={axisLabelColor}
              opacity={labelOpacity}
            >
              {label}
            </text>
          );
        })}

        {/* Linha do Gráfico [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth={Math.round(2.5 * scale)} // Espessura da linha: 2.5px
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={ESTIMATED_PATH_LENGTH}
          strokeDashoffset={animatedLineDashoffset}
        />

        {/* Pontos da Linha [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
        {points.map((point, index) => (
          <circle
            key={`dot-${index}`}
            cx={point.x}
            cy={point.y}
            r={dotRadius}
            fill={lineColor}
            opacity={dotOpacity}
            transform={`scale(${dotOpacity})`} // Animação de scale junto com opacity
            transformOrigin={`${point.x}px ${point.y}px`}
          />
        ))}

        {/* Marcador de Maior Valor (Highest) */}
        {points.length > 0 && (
          <g
            opacity={markerOpacity}
            transform={`translate(${points[maxDataIndex].x}, ${points[maxDataIndex].y - dotRadius - Math.round(5 * scale)}) scale(${markerScale})`}
            transformOrigin="center center" // Escala a partir do seu próprio centro
          >
            {/* Seta para cima (↑) [REGRA #1 - REPLIQUE FIELMENTE] */}
            <path
              d={`M 0 0 L ${Math.round(-5 * scale)} ${Math.round(-10 * scale)} L ${Math.round(5 * scale)} ${Math.round(-10 * scale)} Z`}
              fill={highestMarkerColor}
              transform={`translate(0, ${Math.round(5 * scale)})`} // Ajusta a posição do path dentro do G
            />
            {/* Texto "↑ highest" [REGRA #1 - REPLIQUE FIELMENTE] */}
            <text
              x={0}
              y={Math.round(-15 * scale)} // Texto acima da seta
              textAnchor="middle"
              fontSize={markerLabelFontSize}
              fill={markerLabelColor}
              style={{
                filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.3))' // Imita o texto um pouco mais nítido
              }}
            >
              ↑ highest
            </text>
          </g>
        )}

        {/* Marcador de Menor Valor (Lowest) */}
        {points.length > 0 && (
          <g
            opacity={markerOpacity}
            transform={`translate(${points[minDataIndexToMark].x}, ${points[minDataIndexToMark].y + dotRadius + Math.round(5 * scale)}) scale(${markerScale})`}
            transformOrigin="center center" // Escala a partir do seu próprio centro
          >
            {/* Cruz (X) [REGRA #1 - REPLIQUE FIELMENTE] */}
            <path
              d={`M ${Math.round(-5 * scale)} ${Math.round(-5 * scale)} L ${Math.round(5 * scale)} ${Math.round(5 * scale)} M ${Math.round(-5 * scale)} ${Math.round(5 * scale)} L ${Math.round(5 * scale)} ${Math.round(-5 * scale)}`}
              stroke={lowestMarkerColor}
              strokeWidth={Math.round(1.5 * scale)}
              strokeLinecap="round"
              transform={`translate(0, ${Math.round(-5 * scale)})`} // Ajusta a posição do path dentro do G
            />
            {/* Texto "↓ lowest" [REGRA #1 - REPLIQUE FIELMENTE] */}
            <text
              x={0}
              y={Math.round(15 * scale)} // Texto abaixo da cruz
              textAnchor="middle"
              fontSize={markerLabelFontSize}
              fill={markerLabelColor}
              style={{
                filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.3))'
              }}
            >
              ↓ lowest
            </text>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
