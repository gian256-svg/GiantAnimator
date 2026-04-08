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

interface LineChartDataPoint {
  value: number;
  marker?: 'highest' | 'lowest';
}

interface LineChartProps {
  title: string;
  data: LineChartDataPoint[];
  xLabelsIndices: number[]; // Índices onde os rótulos do eixo X devem ser exibidos
  yAxisMin: number;
  yAxisMax: number;
  yAxisInterval: number;
}

/**
 * Gera a string 'd' para um path SVG conectando os pontos.
 * Conforme a imagem de referência, as linhas são retas, não curvas.
 * [REGRA #1: Replique o layout FIELMENTE]
 */
const getPathD = (points: { x: number; y: number }[]): string => {
  if (points.length < 2) return '';

  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x},${points[i].y}`;
  }
  return path;
};

export const SimpleLineChart: React.FC<LineChartProps> = ({
  title,
  data,
  xLabelsIndices,
  yAxisMin,
  yAxisMax,
  yAxisInterval,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080); // Escala baseada em Full HD

  // Cores extraídas fielmente da imagem de referência
  const backgroundColor = '#EAEAEA';
  const titleAndAxisTextColor = '#333333';
  const gridLineColor = '#D0D0D0';
  const lineColor = '#7988B3';
  const highestMarkerColor = '#E0302E'; // Vermelho
  const lowestMarkerColor = '#5DBE47'; // Verde

  // Tamanhos de Fonte (ajustados proporcionalmente à escala)
  const titleFontSize = Math.round(30 * scale);
  const axisLabelFontSize = Math.round(18 * scale);
  const markerLabelFontSize = Math.round(16 * scale);

  // Dimensões da Área do Gráfico e Margens (estimadas da imagem)
  const paddingLeft = Math.round(70 * scale);
  const paddingRight = Math.round(30 * scale);
  const paddingTop = Math.round(50 * scale);
  const paddingBottom = Math.round(50 * scale);

  const titleHeightOffset = Math.round(50 * scale); // Espaço extra para o título

  const plotAreaX = paddingLeft;
  const plotAreaY = paddingTop + titleHeightOffset;
  const plotWidth = width - paddingLeft - paddingRight;
  const plotHeight = height - paddingTop - paddingBottom - titleHeightOffset;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(data) || data.length === 0) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: Nenhum dado fornecido ou os dados estão vazios. Exibindo fallback.`);
    return (
      <AbsoluteFill
        style={{
          backgroundColor: backgroundColor,
          color: titleAndAxisTextColor,
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

  // Calcular os valores dos ticks do eixo Y
  const yTickValues: number[] = [];
  for (let i = yAxisMin; i <= yAxisMax; i += yAxisInterval) {
    yTickValues.push(i);
  }

  // Mapear os pontos de dados para coordenadas SVG
  const points = data.map((d, i) => {
    // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
    const x = data.length > 1 
      ? plotAreaX + (i / (data.length - 1)) * plotWidth
      : plotAreaX + plotWidth / 2; // Centraliza se houver apenas 1 ponto
    
    const yRange = yAxisMax - yAxisMin;
    const y = yRange > 0 
      ? plotAreaY + plotHeight - ((d.value - yAxisMin) / yRange) * plotHeight
      : plotAreaY + plotHeight / 2; // Centraliza se o range Y for zero

    return { x, y, value: d.value, marker: d.marker };
  });

  // Gerar a string do caminho SVG para a linha
  const linePathD = getPathD(points);
  
  // Limitação: `getTotalLength()` não está disponível no ambiente SSR do Remotion.
  // Usaremos uma estimativa para o comprimento do caminho para a animação.
  // Para uma replicação 100% precisa da animação de "desenho", o comprimento
  // precisaria ser pré-calculado e hardcoded, ou derivado de um algoritmo preciso.
  const estimatedPathLength = plotWidth * 1.2; // Heurística

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

  // Animação de "desenho" da linha [Line Chart] - `strokeDashoffset`
  const lineDrawProgress = interpolate(frame, [20, 70], [0, 1], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_MAIN,
  });
  const strokeDashoffset = interpolate(lineDrawProgress, [0, 1], [estimatedPathLength, 0], {
    extrapolateRight: 'clamp',
  });

  console.log(`[${new Date().toISOString()}] GiantAnimator: Renderizando SimpleLineChart frame ${frame}.`);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: backgroundColor,
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
          y={paddingTop + Math.round(20 * scale)}
          textAnchor="middle"
          fontSize={titleFontSize}
          fontWeight={600}
          fill={titleAndAxisTextColor}
        >
          {title}
        </text>

        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          const y = plotAreaY + plotHeight - ((tickValue - yAxisMin) / (yAxisMax - yAxisMin)) * plotHeight;
          
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
                stroke={gridLineColor}
                strokeWidth={Math.round(1 * scale)}
                opacity={gridLineOpacity}
              />
              {/* Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
              <text
                x={plotAreaX - Math.round(15 * scale)} // Deslocamento para a esquerda da área do gráfico
                y={y + Math.round(axisLabelFontSize / 3)} // Ajuste vertical para centralizar
                textAnchor="end"
                fontSize={axisLabelFontSize}
                fill={titleAndAxisTextColor}
                opacity={gridLineOpacity}
              >
                {tickValue}
              </text>
            </React.Fragment>
          );
        })}

        {/* Caminho da Linha [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
        <path
          d={linePathD}
          fill="none"
          stroke={lineColor}
          strokeWidth={Math.round(2.5 * scale)}
          strokeLinecap="round"
          strokeLinejoin="round"
          // Animação de desenho da linha
          strokeDasharray={estimatedPathLength}
          strokeDashoffset={strokeDashoffset}
        />

        {/* Pontos de Dados e Marcadores [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
        {points.map((p, index) => {
          // Animação de aparição do ponto
          const pointOpacity = interpolate(frame, [40 + index * 3, 70 + index * 3], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_LABELS,
          });
          const pointScale = interpolate(frame, [40 + index * 3, 70 + index * 3], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_LABELS,
          });

          return (
            <React.Fragment key={`point-${index}`}>
              {/* Círculo do Ponto de Dados */}
              <circle
                cx={p.x}
                cy={p.y}
                r={Math.round(4 * scale)} // Raio de 4px (8px de diâmetro)
                fill={lineColor}
                opacity={pointOpacity}
                transform={`scale(${pointScale})`}
                transformOrigin={`${p.x}px ${p.y}px`}
              />

              {/* Marcadores de "Highest" e "Lowest" (conforme referência visual) */}
              {p.marker === 'highest' && (
                <g opacity={pointOpacity} transform={`scale(${pointScale})`} transformOrigin={`${p.x}px ${p.y}px`}>
                  {/* Seta para cima */}
                  <path
                    d={`M ${p.x},${p.y - Math.round(10 * scale)} L ${p.x - Math.round(5 * scale)},${p.y - Math.round(18 * scale)} L ${p.x + Math.round(5 * scale)},${p.y - Math.round(18 * scale)} Z`}
                    fill={highestMarkerColor}
                  />
                  {/* Texto "highest" */}
                  <text
                    x={p.x}
                    y={p.y - Math.round(25 * scale)}
                    textAnchor="middle"
                    fontSize={markerLabelFontSize}
                    fill={titleAndAxisTextColor}
                  >
                    ↑ highest
                  </text>
                </g>
              )}

              {p.marker === 'lowest' && (
                <g opacity={pointOpacity} transform={`scale(${pointScale})`} transformOrigin={`${p.x}px ${p.y}px`}>
                  {/* Símbolo "x" verde */}
                  <line x1={p.x - Math.round(4 * scale)} y1={p.y + Math.round(10 * scale)} x2={p.x + Math.round(4 * scale)} y2={p.y + Math.round(18 * scale)} stroke={lowestMarkerColor} strokeWidth={Math.round(2 * scale)} strokeLinecap="round" />
                  <line x1={p.x + Math.round(4 * scale)} y1={p.y + Math.round(10 * scale)} x2={p.x - Math.round(4 * scale)} y2={p.y + Math.round(18 * scale)} stroke={lowestMarkerColor} strokeWidth={Math.round(2 * scale)} strokeLinecap="round" />
                  
                  {/* Seta para baixo verde */}
                  <path
                    d={`M ${p.x},${p.y + Math.round(8 * scale)} L ${p.x - Math.round(4 * scale)},${p.y + Math.round(4 * scale)} L ${p.x + Math.round(4 * scale)},${p.y + Math.round(4 * scale)} Z`}
                    fill={lowestMarkerColor}
                    transform={`translate(0, ${Math.round(5 * scale)})`} // Ajuste de posição vertical
                  />

                  {/* Texto "lowest" */}
                  <text
                    x={p.x}
                    y={p.y + Math.round(30 * scale)}
                    textAnchor="middle"
                    fontSize={markerLabelFontSize}
                    fill={titleAndAxisTextColor}
                  >
                    ↓ lowest
                  </text>
                </g>
              )}
            </React.Fragment>
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {xLabelsIndices.map((labelIndex) => {
          // [EDGE CASES E ROBUSTEZ] - Verificar se o índice existe nos dados
          if (labelIndex >= data.length || labelIndex < 0) return null; 
          const p = points[labelIndex];
          const labelOpacity = interpolate(frame, [40, 60], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <text
              key={`x-label-${labelIndex}`}
              x={p.x}
              y={plotAreaY + plotHeight + Math.round(30 * scale)} // Posição abaixo da área do gráfico
              textAnchor="middle" // Centralizado sob o ponto relevante
              fontSize={axisLabelFontSize}
              fill={titleAndAxisTextColor}
              opacity={labelOpacity}
            >
              {labelIndex} {/* Exibe o índice como rótulo */}
            </text>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

// Exemplo de dados para corresponder à imagem de referência:
export const MyLineChartComposition: React.FC = () => {
  const chartProps: LineChartProps = {
    title: "Simple Line Chart",
    data: [
      { value: 450 },
      { value: 410 },
      { value: 515, marker: 'highest' },
      { value: 460 },
      { value: 450 },
      { value: 500 },
      { value: 475 },
      { value: 475 },
      { value: 410, marker: 'lowest' },
      { value: 500 },
      { value: 475 },
      { value: 510 },
    ],
    xLabelsIndices: [0, 2, 4, 6, 8, 10],
    yAxisMin: 400,
    yAxisMax: 550,
    yAxisInterval: 50,
  };

  return <SimpleLineChart {...chartProps} />;
};
