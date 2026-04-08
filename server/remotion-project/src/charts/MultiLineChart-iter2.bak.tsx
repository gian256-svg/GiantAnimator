import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { THEME } from "../theme";

// Spring configurations baseadas nas regras de animação
const SPRING_CONFIG_MAIN = {
  damping: 12,
  stiffness: 80,
  mass: 1.0,
  overshootClamping: false, // permite leve bounce
};

const SPRING_CONFIG_LABELS = {
  damping: 20,
  stiffness: 120,
  mass: 0.8,
  overshootClamping: true,
};

const SPRING_CONFIG_SUBTLE = {
  damping: 25,
  stiffness: 100,
  mass: 0.5,
  overshootClamping: true,
};

interface SeriesData {
  label: string;
  color?: string; // Cor opcional, caso contrário usa a paleta THEME
  data: number[];
}

interface MultiLineChartProps {
  series: SeriesData[];
  labels: string[]; // Rótulos do eixo X
  title?: string;
  showLegend?: boolean;
}

export const MultiLineChart: React.FC<MultiLineChartProps> = ({
  series: rawSeries,
  labels: rawLabels,
  title = "Multi-Line Chart",
  showLegend = true,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Proteção contra dados inválidos
  const series = Array.isArray(rawSeries) ? rawSeries : [];
  const labels = Array.isArray(rawLabels) ? rawLabels : [];

  if (series.length === 0 || labels.length === 0) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: THEME.colors.background,
          justifyContent: "center",
          alignItems: "center",
          color: THEME.colors.text,
          fontSize: 30 * Math.min(width / 1920, height / 1080),
          fontFamily: THEME.fontFamily,
        }}
      >
        <div style={{ padding: 40 }}>No data to display.</div>
      </AbsoluteFill>
    );
  }

  // Calcula a escala para responsividade
  const scale = Math.min(width / 1920, height / 1080);

  // Dimensões do gráfico e preenchimento
  const chartPadding = 40 * scale;
  const titleHeight = title ? 24 * scale : 0;
  const xAxisLabelHeight = 32 * scale; // Margem extra para labels do eixo X
  const legendWidth = showLegend ? 150 * scale : 0; // Largura estimada para a legenda

  const plotAreaWidth = width - chartPadding * 2 - legendWidth;
  const plotAreaHeight =
    height - chartPadding * 2 - titleHeight - xAxisLabelHeight;

  const chartX = chartPadding;
  const chartY = chartPadding + titleHeight;

  // Calcula os valores mínimo/máximo para o eixo Y
  let allValues: number[] = [];
  series.forEach((s) => {
    if (Array.isArray(s.data)) {
      allValues = allValues.concat(s.data);
    }
  });

  const maxValue = Math.max(...allValues, 0); // Garante que o eixo Y começa em 0

  // Grid e rótulos do eixo Y
  const numGridLines = 5; // Exemplo: 5 linhas de grade horizontais (incluindo a linha zero)
  // Proteção contra divisão por zero se maxValue for 0
  const gridLineInterval = maxValue > 0 ? maxValue / (numGridLines - 1) : 0;

  const yAxisLabels = Array.from({ length: numGridLines }).map((_, i) => {
    const value = gridLineInterval * i;
    // Formata números de acordo com as regras (k/M)
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
    return Math.round(value).toString();
  });

  // Calcula as posições dos pontos no eixo X
  const numPoints = labels.length;
  // Proteção contra divisão por zero se houver apenas 1 ponto
  const pointSpacing = numPoints > 1 ? plotAreaWidth / (numPoints - 1) : 0;
  const xPositions = labels.map((_, i) => chartX + i * pointSpacing);
  // Se houver apenas 1 ponto, centraliza-o
  if (numPoints === 1) {
    xPositions[0] = chartX + plotAreaWidth / 2;
  }

  // Timing da animação
  const initialDelay = 10; // frames
  const lineDrawDuration = 50; // frames
  const staggerDelayPerSeries = 5; // frames de atraso entre cada série

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.colors.background }}>
      {/* Título */}
      {title && (
        <h1
          style={{
            position: "absolute",
            top: chartPadding / 2,
            width: "100%",
            textAlign: "center",
            fontSize: 20 * scale,
            fontWeight: 700,
            color: THEME.colors.text,
            fontFamily: THEME.fontFamily,
            opacity: spring({
              frame,
              fps,
              config: SPRING_CONFIG_SUBTLE,
              from: 0,
              to: 1,
              durationInFrames: 30,
              delay: initialDelay,
            }),
            transform: `translateY(${interpolate(
              spring({
                frame,
                fps,
                config: SPRING_CONFIG_SUBTLE,
                from: 0,
                to: 1,
                durationInFrames: 30,
                delay: initialDelay,
              }),
              [0, 1],
              [20 * scale, 0],
              { extrapolateRight: "clamp" }
            )}px)`,
          }}
        >
          {title}
        </h1>
      )}

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ fontFamily: THEME.fontFamily }}
      >
        {/* clipPath para a área de plotagem */}
        <defs>
          <clipPath id="plotAreaClip">
            <rect
              x={chartX}
              y={chartY}
              width={plotAreaWidth}
              height={plotAreaHeight}
            />
          </clipPath>
        </defs>

        {/* Linhas de Grade */}
        {yAxisLabels.map((label, i) => {
          // Se maxValue for 0, todas as linhas estariam na base; exibe apenas a linha zero
          if (maxValue === 0 && i > 0) return null;

          const y =
            chartY + plotAreaHeight - (i / (numGridLines - 1)) * plotAreaHeight;
          const isZeroLine = i === 0;

          const animatedOpacity = spring({
            frame,
            fps,
            config: SPRING_CONFIG_SUBTLE,
            from: 0,
            to: 1,
            durationInFrames: 30,
            delay: initialDelay + 10,
          });

          return (
            <React.Fragment key={`grid-${i}`}>
              <line
                x1={chartX}
                y1={y}
                x2={chartX + plotAreaWidth}
                y2={y}
                stroke={
                  isZeroLine
                    ? THEME.colors.gridZeroLine
                    : THEME.colors.gridLine
                }
                strokeDasharray={isZeroLine ? "none" : "4 4"}
                strokeWidth={isZeroLine ? 1.5 : 1}
                opacity={animatedOpacity}
              />
              {/* Rótulo do eixo Y */}
              <text
                x={chartX - 10 * scale} // Alinhado à direita da área de plotagem
                y={y + 4 * scale} // Ajuste para centralização vertical
                fill={THEME.colors.label}
                fontSize={11 * scale}
                textAnchor="end"
                opacity={animatedOpacity}
              >
                {label}
              </text>
            </React.Fragment>
          );
        })}

        {/* Rótulos do eixo X */}
        {labels.map((label, i) => {
          const x = xPositions[i];
          const y = chartY + plotAreaHeight + 15 * scale; // Abaixo da área de plotagem

          const animatedOpacity = spring({
            frame,
            fps,
            config: SPRING_CONFIG_SUBTLE,
            from: 0,
            to: 1,
            durationInFrames: 30,
            delay: initialDelay + 20,
          });

          return (
            <text
              key={`x-label-${i}`}
              x={isNaN(x) ? 0 : x} // Proteção contra NaN
              y={isNaN(y) ? 0 : y} // Proteção contra NaN
              fill={THEME.colors.label}
              fontSize={11 * scale}
              textAnchor="middle"
              opacity={animatedOpacity}
            >
              {label}
            </text>
          );
        })}

        {/* Linhas */}
        {series.map((s, seriesIndex) => {
          // Proteção contra dados de série inválidos
          if (!Array.isArray(s.data) || s.data.length === 0) return null;

          const pathPoints = s.data.map((value, i) => {
            const x = xPositions[i];
            // Proteção contra divisão por zero para valor máximo
            const yRatio = maxValue > 0 ? value / maxValue : 0;
            const y = chartY + plotAreaHeight - yRatio * plotAreaHeight;
            return { x, y };
          });

          // Gera dados do caminho suavizados (Catmull-Rom para Bezier Cúbica simplificada)
          let pathData = "";
          if (numPoints > 1) {
            pathData = pathPoints
              .map((point, i) => {
                if (i === 0) return `M ${point.x} ${point.y}`;

                const p0 = pathPoints[i - 2] || pathPoints[i - 1]; // Ponto anterior ao anterior, ou o próprio anterior
                const p1 = pathPoints[i - 1]; // Ponto anterior
                const p2 = pathPoints[i]; // Ponto atual
                const p3 = pathPoints[i + 1] || pathPoints[i]; // Próximo ponto, ou o próprio atual

                // Coeficiente de tensão da curva
                const tension = 0.5;

                const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
                const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;

                const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
                const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

                return `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
              })
              .join(" ");
          } else if (numPoints === 1) {
            // Se houver apenas 1 ponto, desenha um pequeno segmento horizontal para visibilidade
            pathData = `M ${pathPoints[0].x - 5} ${pathPoints[0].y} L ${pathPoints[0].x + 5} ${pathPoints[0].y}`;
          }

          // Comprimento do caminho (fallback fixo para animação de strokeDashoffset)
          const pathLength = 1000;

          // Animação para o desenho da linha
          const lineStartFrame =
            initialDelay + 20 + seriesIndex * staggerDelayPerSeries;
          const lineDrawProgress = spring({
            frame,
            fps,
            config: SPRING_CONFIG_MAIN,
            from: 0,
            to: 1,
            durationInFrames: lineDrawDuration,
            delay: lineStartFrame,
          });

          const strokeDashoffset = interpolate(
            lineDrawProgress,
            [0, 1],
            [pathLength, 0],
            { extrapolateRight: "clamp" }
          );

          // Usa a cor fornecida ou a cor da paleta padrão
          const color =
            s.color || THEME.chartColors[seriesIndex % THEME.chartColors.length];

          return (
            <React.Fragment key={`series-${seriesIndex}`}>
              <path
                d={pathData}
                fill="none"
                stroke={color}
                strokeWidth={2.5 * scale} // Espessura da linha
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={pathLength}
                strokeDashoffset={
                  isNaN(strokeDashoffset) ? pathLength : strokeDashoffset
                } // Proteção contra NaN
                clipPath="url(#plotAreaClip)" // clippath obrigatório
              />
              {/* Pontos nas linhas, visíveis apenas se o número de pontos for pequeno (< 20) */}
              {numPoints < 20 &&
                pathPoints.map((point, i) => {
                  const dotScale = interpolate(
                    lineDrawProgress,
                    [0, 1],
                    [0, 1],
                    { extrapolateRight: "clamp" }
                  );
                  const dotOpacity = interpolate(
                    lineDrawProgress,
                    [0.8, 1], // Aparece no final do desenho da linha
                    [0, 1],
                    { extrapolateRight: "clamp" }
                  );

                  return (
                    <circle
                      key={`dot-${seriesIndex}-${i}`}
                      cx={isNaN(point.x) ? 0 : point.x} // Proteção contra NaN
                      cy={isNaN(point.y) ? 0 : point.y} // Proteção contra NaN
                      r={6 * scale} // Raio do ponto (6px)
                      fill={color}
                      opacity={dotOpacity}
                      transform={`scale(${dotScale})`}
                      transformOrigin={`${point.x}px ${point.y}px`}
                      clipPath="url(#plotAreaClip)"
                    />
                  );
                })}
            </React.Fragment>
          );
        })}

        {/* Legenda */}
        {showLegend && (
          <g
            style={{
              transform: `translateX(${interpolate(
                spring({
                  frame,
                  fps,
                  config: SPRING_CONFIG_SUBTLE,
                  from: 0,
                  to: 1,
                  durationInFrames: 30,
                  delay: initialDelay + 30, // Inicia o fade da legenda após algumas linhas começarem
                }),
                [0, 1],
                [-30 * scale, 0], // Animação da esquerda para o centro
                { extrapolateRight: "clamp" }
              )}px)`,
            }}
          >
            {series.map((s, seriesIndex) => {
              const legendItemStartFrame =
                initialDelay + 30 + seriesIndex * staggerDelayPerSeries;

              const legendOpacity = spring({
                frame,
                fps,
                config: SPRING_CONFIG_LABELS,
                from: 0,
                to: 1,
                durationInFrames: 20,
                delay: legendItemStartFrame,
              });

              return (
                <g
                  key={`legend-${seriesIndex}`}
                  transform={`translate(${chartX + plotAreaWidth + 20 * scale}, ${
                    chartY - titleHeight + 20 * scale + seriesIndex * (20 * scale)
                  })`} // Posiciona a legenda à direita da área de plotagem
                  opacity={legendOpacity}
                >
                  <rect
                    x={0}
                    y={0}
                    width={10 * scale}
                    height={10 * scale}
                    fill={
                      s.color ||
                      THEME.chartColors[seriesIndex % THEME.chartColors.length]
                    }
                    rx={2 * scale} // Leve arredondamento para o swatch de cor
                  />
                  <text
                    x={15 * scale}
                    y={9 * scale} // Ajuste para centralização vertical
                    fill={THEME.colors.legendText}
                    fontSize={12 * scale}
                    fontWeight={400}
                  >
                    {s.label}
                  </text>
                </g>
              );
            })}
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
};
