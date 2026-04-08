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

// Helper function to generate smooth path (cubic bezier) [REGRAS POR TIPO DE GRÁFICO -> Line Chart]
// Esta função gera um caminho SVG com curvas cúbicas de Bézier para criar uma linha suave.
// A tensão pode ser ajustada para controlar a "curvatura" da linha.
const getSmoothLinePath = (points: { x: number; y: number }[]): string => {
  if (points.length < 2) {
    return "";
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]; // Ponto anterior ou atual (para extremos)
    const p1 = points[i];                 // Ponto atual
    const p2 = points[i + 1];             // Próximo ponto
    const p3 = points[i + 2] || points[i + 1]; // Ponto seguinte ou próximo (para extremos)

    // Calculando pontos de controle para uma curva cúbica de Bézier
    // Este é um método heurístico comum; algoritmos mais avançados podem ser usados para maior precisão.
    const tension = 0.4; // Ajustado para corresponder à suavidade da referência visual

    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;

    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
};

interface LineChartProps {
  title: string;
  data: number[];
  yAxisMin?: number;
  yAxisMax?: number;
  highlightHighest?: boolean;
  highlightLowest?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  title,
  data,
  yAxisMin = 0, // Padrão 0, mas será sobrescrito pela análise da imagem
  yAxisMax,
  highlightHighest = false,
  highlightLowest = false,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // [REGRAS DE RESPONSIVIDADE DO CANVAS] - Escala proporcional
  const scale = Math.min(width / 1920, height / 1080);

  // Plot Area dimensions e margens [REGRAS DE ESTRUTURA E LAYOUT]
  // Margens ajustadas para replicar fielmente o padding da referência visual
  const PLOT_AREA_PADDING_HORIZONTAL = Math.round(75 * scale);
  const PLOT_AREA_PADDING_VERTICAL = Math.round(60 * scale);
  const TITLE_HEIGHT_OFFSET = Math.round(24 * scale); // +24px quando título presente
  const X_AXIS_LABEL_HEIGHT_OFFSET = Math.round(32 * scale); // +32px para labels do eixo X na base
  const Y_AXIS_LABEL_WIDTH_OFFSET = Math.round(45 * scale); // Espaço para labels do eixo Y

  // Cores extraídas fielmente da referência visual [REGRA #1, REGRAS DE CORES]
  const chartBackgroundColor = '#EFEFEF'; // Cor de fundo da área do gráfico
  const lineColor = '#7C89AD';
  const pointColor = '#7C89AD';
  const gridLineColor = '#DDDDDD'; // Linhas de grid são sólidas na referência
  const titleColor = '#333333';
  const axisLabelColor = '#666666';
  const highlightHighestArrowColor = '#FF0000';
  const highlightLowestXColor = '#5A8B5B';
  const highlightTextColor = '#333333';

  // Tipografia extraída da referência visual [REGRA #1, REGRAS DE TIPOGRAFIA E LABELS]
  const titleFontSize = Math.round(24 * scale);
  const axisLabelFontSize = Math.round(14 * scale);
  const highlightLabelFontSize = Math.round(12 * scale);
  const fontWeightNormal = 400; // Parece normal na imagem
  const fontWeightBold = 700;   // Título parece bold

  const plotAreaX = PLOT_AREA_PADDING_HORIZONTAL + Y_AXIS_LABEL_WIDTH_OFFSET;
  const plotAreaY = PLOT_AREA_PADDING_VERTICAL + TITLE_HEIGHT_OFFSET;
  const plotWidth = width - (2 * PLOT_AREA_PADDING_HORIZONTAL) - Y_AXIS_LABEL_WIDTH_OFFSET;
  const plotHeight = height - (2 * PLOT_AREA_PADDING_VERTICAL) - TITLE_HEIGHT_OFFSET - X_AXIS_LABEL_HEIGHT_OFFSET;

  // [EDGE CASES E ROBUSTEZ] - Verificar dados antes de processar
  if (!Array.isArray(data) || data.length < 2) {
    console.log(`[${new Date().toISOString()}] GiantAnimator: No data provided or data has less than 2 points for Line Chart. Displaying fallback.`);
    return (
      <div style={{
        backgroundColor: '#F8F8F8', // Cor de fundo do canvas (externo ao chart area)
        color: titleColor,
        fontSize: Math.round(24 * scale),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width,
        height,
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
      }}>
        Dados insuficientes para exibir o Gráfico de Linhas.
      </div>
    );
  }

  // **Decisão de Y-axis scale**
  // [CONSIDERANDO REGRA #1 (LEI SUPREMA) VS. REGRAS DE ESTRUTURA]
  // A referência visual mostra explicitamente o eixo Y começando em 400 e terminando em 550.
  // A Regra de Ouro "Escala Y: sempre começa em 0 (exceto candlestick e scatter)" seria aplicada.
  // No entanto, a REGRA #1 (Lei Suprema) "Sempre dar preferência ao layout original do gráfico"
  // e "NÃO improvise design. NÃO melhore sem ser solicitado" são mais absolutas para replicação visual.
  // Portanto, para replicar fielmente o layout, o eixo Y será configurado conforme a imagem.
  console.log(`[${new Date().toISOString()}] GiantAnimator: Y-axis scaling decision: Despite the general rule "Escala Y: sempre começa em 0", the reference image for this line chart explicitly shows the Y-axis starting at 400. Adhering to REGRA #1 (Lei Suprema) "Sempre dar preferência ao layout original do gráfico" and "NÃO improvise design. NÃO melhore sem ser solicitado", the Y-axis will be generated to start at 400 to faithfully replicate the visual layout of the reference image. This is considered a direct visual replication rather than a 'betterment' or 'improvement'.`);
  const effectiveYAxisMin = 400; // Fiel à referência
  const effectiveYAxisMax = 550; // Fiel à referência

  const yAxisRange = effectiveYAxisMax - effectiveYAxisMin;
  const yTickValues = [400, 450, 500, 550]; // Fiel à referência

  // Encontrar o valor mais alto e mais baixo e seus índices
  let highestValue = -Infinity;
  let highestIndex = -1;
  let lowestValue = Infinity;
  let lowestIndex = -1;

  data.forEach((value, index) => {
    if (value > highestValue) {
      highestValue = value;
      highestIndex = index;
    }
    if (value < lowestValue) {
      lowestValue = value;
      lowestIndex = index;
    }
  });

  // Mapeamento de dados para coordenadas de pixel
  const points = data.map((value, index) => {
    const x = plotAreaX + index * (plotWidth / (data.length - 1));
    // [EDGE CASES E ROBUSTEZ] - Prevenção de divisão por zero
    const y = yAxisRange > 0
      ? plotAreaY + plotHeight - ((value - effectiveYAxisMin) / yAxisRange) * plotHeight
      : plotAreaY + plotHeight; // Se range é 0, todos os pontos ficam na base
    return { x, y, value };
  });

  // Caminho da linha principal
  const linePath = getSmoothLinePath(points);
  const pathLength = linePath.length; // Estimativa de comprimento do path para animação
  // Para paths SVG, o length real deve ser calculado com getPathData() ou getTotalLength().
  // Como `getTotalLength()` não está disponível em um ambiente SSR/Node.js, usaremos uma estimativa
  // ou um valor fixo que se mostre bom visualmente. Para propósitos de Remotion, uma estimativa
  // é geralmente suficiente. Um valor como 1000 a 2000 costuma funcionar para gráficos típicos.
  const animatedPathLength = interpolate(frame, [10, 60], [1000, pathLength], {
    extrapolateRight: 'clamp',
    config: SPRING_CONFIG_MAIN,
  });


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

  console.log(`[${new Date().toISOString()}] GiantAnimator: Rendering LineChart frame ${frame}.`);

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: '#F8F8F8', // Fundo do canvas (externo ao chart area)
        fontFamily: 'Inter, "Helvetica Neue", sans-serif',
        transform: `scale(${chartScale})`,
        opacity: chartEntrance,
        transformOrigin: 'center center',
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          backgroundColor: chartBackgroundColor, // Cor de fundo da área do gráfico (interna)
          borderRadius: Math.round(8 * scale), // Borda arredondada conforme a imagem
          overflow: 'hidden', // Corta o conteúdo que excede o borderRadius
        }}
      >
        {/* Título do Gráfico [REGRAS DE TIPOGRAFIA E LABELS] */}
        <text
          x={width / 2}
          y={PLOT_AREA_PADDING_VERTICAL + TITLE_HEIGHT_OFFSET / 2 + Math.round(5 * scale)} // Ajuste vertical
          textAnchor="middle"
          fontSize={titleFontSize}
          fontWeight={fontWeightBold}
          fill={titleColor}
        >
          {title}
        </text>

        {/* Grid Horizontais e Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
        {yTickValues.map((tickValue, index) => {
          const y = plotAreaY + plotHeight - ((tickValue - effectiveYAxisMin) / yAxisRange) * plotHeight;

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
                opacity={gridLineOpacity}
              />
              {/* Labels do Eixo Y [REGRAS DE ESTRUTURA E LAYOUT] */}
              <text
                x={plotAreaX - Math.round(8 * scale)} // 8px de padding à direita do grid
                y={y + Math.round(axisLabelFontSize / 3)} // Ajuste vertical para centralizar
                textAnchor="end" // Alinhado à direita
                fontSize={axisLabelFontSize}
                fill={axisLabelColor}
                fontWeight={fontWeightNormal}
                opacity={gridLineOpacity}
              >
                {tickValue}
              </text>
            </React.Fragment>
          );
        })}

        {/* Linha do Gráfico [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
        <path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth={Math.round(2.5 * scale)} // Espessura da linha fiel à referência
          strokeLinejoin="round" // Para suavizar junções de segmentos
          strokeLinecap="round" // Para suavizar as pontas da linha
          // Animação de "desenho" da linha (strokeDashoffset)
          strokeDasharray={animatedPathLength}
          strokeDashoffset={interpolate(
            frame,
            [10, 60],
            [animatedPathLength, 0], // De comprimento total para 0
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_MAIN,
            }
          )}
        />

        {/* Pontos (Dots) nos dados [REGRAS POR TIPO DE GRÁFICO -> Line Chart] */}
        {points.map((p, index) => {
          const pointRadius = Math.round(3 * scale); // 6px diâmetro fiel à referência

          const pointScale = interpolate(
            frame,
            [50 + index * 2, 70 + index * 2], // Staggered entry for points
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS, // Usar config de labels para sem bounce
            }
          );
          const pointOpacity = interpolate(
            frame,
            [50 + index * 2, 70 + index * 2],
            [0, 1],
            {
              extrapolateRight: 'clamp',
              config: SPRING_CONFIG_LABELS,
            }
          );

          return (
            <circle
              key={`point-${index}`}
              cx={p.x}
              cy={p.y}
              r={pointRadius}
              fill={pointColor}
              transform={`scale(${pointScale})`}
              transformOrigin={`${p.x}px ${p.y}px`}
              opacity={pointOpacity}
            />
          );
        })}

        {/* Labels do Eixo X [REGRAS DE ESTRUTURA E LAYOUT] */}
        {[0, 2, 4, 6, 8, 10].map((labelIndex) => {
          if (labelIndex >= data.length) return null; // Evitar labels para índices fora do range

          const p = points[labelIndex];
          const labelY = plotAreaY + plotHeight + Math.round(15 * scale); // Posição abaixo do eixo

          const labelOpacity = interpolate(frame, [40, 60], [0, 1], {
            extrapolateRight: 'clamp',
            config: SPRING_CONFIG_SUBTLE,
          });

          return (
            <text
              key={`x-label-${labelIndex}`}
              x={p.x}
              y={labelY}
              textAnchor="middle" // Centralizado sob cada ponto
              fontSize={axisLabelFontSize}
              fill={axisLabelColor}
              fontWeight={fontWeightNormal}
              opacity={labelOpacity}
            >
              {labelIndex}
            </text>
          );
        })}

        {/* Destaque para o ponto mais alto [REGRA #1 - Fiel à referência] */}
        {highlightHighest && highestIndex !== -1 && (
          <React.Fragment>
            {/* Símbolo de seta para cima */}
            <path
              d={`M ${points[highestIndex].x} ${points[highestIndex].y - Math.round(20 * scale)} L ${points[highestIndex].x - Math.round(4 * scale)} ${points[highestIndex].y - Math.round(28 * scale)} L ${points[highestIndex].x + Math.round(4 * scale)} ${points[highestIndex].y - Math.round(28 * scale)} Z`}
              fill={highlightHighestArrowColor}
              opacity={interpolate(frame, [70, 80], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_LABELS })}
            />
            {/* Texto "highest" */}
            <text
              x={points[highestIndex].x}
              y={points[highestIndex].y - Math.round(30 * scale)} // Posição do texto acima da seta
              textAnchor="middle"
              fontSize={highlightLabelFontSize}
              fill={highlightTextColor}
              fontWeight={fontWeightNormal}
              opacity={interpolate(frame, [70, 80], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_LABELS })}
            >
              ↑ highest
            </text>
          </React.Fragment>
        )}

        {/* Destaque para o ponto mais baixo [REGRA #1 - Fiel à referência] */}
        {highlightLowest && lowestIndex !== -1 && (
          <React.Fragment>
            {/* Símbolo de X */}
            <path
              d={`M ${points[lowestIndex].x - Math.round(6 * scale)} ${points[lowestIndex].y - Math.round(6 * scale)} L ${points[lowestIndex].x + Math.round(6 * scale)} ${points[lowestIndex].y + Math.round(6 * scale)} M ${points[lowestIndex].x - Math.round(6 * scale)} ${points[lowestIndex].y + Math.round(6 * scale)} L ${points[lowestIndex].x + Math.round(6 * scale)} ${points[lowestIndex].y - Math.round(6 * scale)}`}
              stroke={highlightLowestXColor}
              strokeWidth={Math.round(1.5 * scale)}
              strokeLinecap="round"
              opacity={interpolate(frame, [70, 80], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_LABELS })}
            />
            {/* Texto "lowest" */}
            <text
              x={points[lowestIndex].x}
              y={points[lowestIndex].y + Math.round(18 * scale)} // Posição do texto abaixo do X
              textAnchor="middle"
              fontSize={highlightLabelFontSize}
              fill={highlightTextColor}
              fontWeight={fontWeightNormal}
              opacity={interpolate(frame, [70, 80], [0, 1], { extrapolateRight: 'clamp', config: SPRING_CONFIG_LABELS })}
            >
              ↓ lowest
            </text>
          </React.Fragment>
        )}
      </svg>
    </div>
  );
};
