import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { THEME } from "../theme"; // Assumindo theme.ts existe no caminho '../theme'
import {
  formatValue,
  calculateResponsiveScale,
  SPRING_CONFIG_MAIN,
  SPRING_CONFIG_LABELS,
  SPRING_CONFIG_SUBTLE,
} from "../utils"; // Assumindo utils.ts existe no caminho '../utils'

// Zod schema para validação das props
export const AreaChartPropsSchema = z.object({
  data: z
    .array(
      z.object({
        label: z.string(),
        value: z.number(),
      })
    )
    .min(1, "Data array must not be empty"),
  title: z.string().optional(),
  color: z.string().optional(), // Cor principal para o gráfico
  showGrid: z.boolean().optional().default(true),
  showXAxisLabels: z.boolean().optional().default(true),
  showYAxisLabels: z.boolean().optional().default(true),
  showValues: z.boolean().optional().default(true),
});

export type AreaChartProps = z.infer<typeof AreaChartPropsSchema>;

// Constantes para o layout (base 1920x1080)
const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;
const CHART_PADDING = 80; // Margem interna mínima de 40px, aqui usamos 80px para respiro
const TITLE_OFFSET_Y = 40; // Margem extra para o título
const X_AXIS_LABEL_HEIGHT = 30; // Margem extra para labels do eixo X
const Y_AXIS_LABEL_WIDTH = 60; // Espaço reservado para labels do eixo Y

// Função auxiliar para gerar um caminho SVG suave (aproximação de cubic Bezier)
const generateSmoothPath = (points: { x: number; y: number }[]): string => {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : points[i + 1];

    // Calcula pontos de controle para uma spline Catmull-Rom (simplificada)
    const tension = 0.5; // Controla a "tensão" da curva

    const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
    const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;

    const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
    const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

    // Proteção contra NaN/Infinity para pontos de controle
    const safeCp1x = isNaN(cp1x) || !isFinite(cp1x) ? p1.x : cp1x;
    const safeCp1y = isNaN(cp1y) || !isFinite(cp1y) ? p1.y : cp1y;
    const safeCp2x = isNaN(cp2x) || !isFinite(cp2x) ? p2.x : cp2x;
    const safeCp2y = isNaN(cp2y) || !isFinite(cp2y) ? p2.y : cp2y;

    path += ` C ${safeCp1x} ${safeCp1y}, ${safeCp2x} ${safeCp2y}, ${p2.x} ${p2.y}`;
  }
  return path;
};

// Função auxiliar para calcular o comprimento aproximado do caminho para animação de strokeDashoffset
const getPathApproxLength = (points: { x: number; y: number }[]): number => {
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
  data,
  title,
  color = THEME.colors.series1,
  showGrid,
  showXAxisLabels,
  showYAxisLabels,
  showValues,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Escala responsiva baseada na configuração do vídeo
  const scale = calculateResponsiveScale(width, height, BASE_WIDTH, BASE_HEIGHT);

  const FONT_FAMILY = THEME.typography.fontFamily;

  // Dimensões do gráfico após o escalonamento
  const chartWidth = BASE_WIDTH * scale;
  const chartHeight = BASE_HEIGHT * scale;
  const padding = CHART_PADDING * scale;
  const titleOffsetY = TITLE_OFFSET_Y * scale;
  const xAxisLabelHeight = X_AXIS_LABEL_HEIGHT * scale;
  const yAxisLabelWidth = Y_AXIS_LABEL_WIDTH * scale;

  // Cálculo da área de plotagem
  const plotAreaX = padding + yAxisLabelWidth;
  const plotAreaY = padding + (title ? titleOffsetY : 0);
  const plotWidth = chartWidth - 2 * padding - yAxisLabelWidth;
  const plotHeight =
    chartHeight -
    2 * padding -
    (title ? titleOffsetY : 0) -
    xAxisLabelHeight;

  // Validação e processamento dos dados
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          fontSize: 30 * scale,
          color: THEME.colors.text.light,
          fontFamily: FONT_FAMILY,
        }}
      >
        No data to display.
      </AbsoluteFill>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));
  const effectiveMaxValue = maxValue > 0 ? maxValue : 1; // Proteção contra divisão por zero

  const numDataPoints = data.length;
  // Se houver apenas um ponto de dado, stepX é 0 para centralizar, senão distribui igualmente
  const stepX = numDataPoints > 1 ? plotWidth / (numDataPoints - 1) : 0;

  // Animação de entrada do gráfico (fade + scale)
  const entranceProgress = spring({
    frame,
    fps,
    config: SPRING_CONFIG_SUBTLE,
    from: 0,
    to: 1,
    durationInFrames: 30, // Duração da animação de entrada
  });

  const chartScale = interpolate(
    entranceProgress,
    [0, 1],
    [0.8, 1],
    { extrapolateRight: "clamp" }
  );
  const chartOpacity = interpolate(
    entranceProgress,
    [0, 1],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  // Animação de "desenho" da linha e preenchimento da área
  const drawProgress = spring({
    frame: frame - 10, // Inicia a animação após 10 frames de "respiro"
    fps,
    config: SPRING_CONFIG_MAIN,
    from: 0,
    to: 1,
    durationInFrames: 50, // Linha e área desenham por 50 frames
  });

  // Transforma os valores dos dados em coordenadas SVG
  const plotPoints = data.map((d, i) => {
    const x = plotAreaX + i * stepX;
    const y = plotAreaY + plotHeight - (d.value / effectiveMaxValue) * plotHeight;
    // Proteção contra NaN para atributos SVG
    return { x: isNaN(x) ? 0 : x, y: isNaN(y) ? 0 : y };
  });

  let areaPathCommand = "";
  let linePathCommand = "";
  let pathLength = 0;

  if (plotPoints.length > 0) {
    // Gera o caminho suave para a linha superior
    linePathCommand = generateSmoothPath(plotPoints);
    pathLength = getPathApproxLength(plotPoints); // Comprimento aproximado para a animação

    // Constrói o caminho da área: Começa na base-esquerda, segue a linha suave, fecha na base-direita
    if (plotPoints.length === 1) {
        // Para um único ponto, representa como uma linha vertical até a base
        areaPathCommand = `M ${plotPoints[0].x} ${plotAreaY + plotHeight} L ${plotPoints[0].x} ${plotPoints[0].y} L ${plotPoints[0].x} ${plotAreaY + plotHeight} Z`;
    } else {
        areaPathCommand = `M ${plotPoints[0].x} ${plotAreaY + plotHeight} ` // Começa na base-esquerda do primeiro ponto
                          + linePathCommand.substring(1) // Anexa o caminho da linha suave (removendo seu 'M' inicial)
                          + ` L ${plotPoints[plotPoints.length - 1].x} ${plotAreaY + plotHeight} Z`; // Fecha na base-direita
    }
  }

  // Garante que pathLength não seja NaN ou 0. Define um valor de fallback se necessário.
  if (isNaN(pathLength) || pathLength === 0) {
    pathLength = plotWidth; // Fallback para a largura do plot para fins de animação
  }

  const animatedLineStrokeDashoffset = interpolate(
    drawProgress,
    [0, 1],
    [pathLength, 0],
    { extrapolateRight: "clamp" }
  );

  const animatedAreaOpacity = interpolate(
    drawProgress,
    [0, 1],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  // Linhas de grade e rótulos do eixo Y
  const numYGridLines = 5; // e.g., 0, 25%, 50%, 75%, 100%
  const yStep = plotHeight / (numYGridLines - 1);
  const valueStep = effectiveMaxValue / (numYGridLines - 1);

  const gridAndLabelOpacity = interpolate(
    entranceProgress,
    [0, 1],
    [0, 1],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: THEME.colors.background.dark,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: chartWidth,
          height: chartHeight,
          transform: `scale(${chartScale})`,
          opacity: chartOpacity,
        }}
      >
        <svg
          width={chartWidth}
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          overflow="visible"
        >
          <defs>
            {/* Gradiente linear para o preenchimento da área */}
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop
                offset="0%"
                stopColor={color}
                stopOpacity={0.5} // Opacidade no topo
              />
              <stop
                offset="100%"
                stopColor={color}
                stopOpacity={0.1} // Opacidade na base
              />
            </linearGradient>
          </defs>

          {/* Título do gráfico */}
          {title && (
            <text
              x={plotAreaX + plotWidth / 2}
              y={padding + titleOffsetY / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={22 * scale}
              fontWeight={700}
              fill={THEME.colors.text.light}
              fontFamily={FONT_FAMILY}
              opacity={gridAndLabelOpacity}
            >
              {title}
            </text>
          )}

          {/* Linhas de grade e rótulos do eixo Y */}
          {showGrid &&
            Array.from({ length: numYGridLines }).map((_, i) => {
              const y = plotAreaY + plotHeight - i * yStep;
              const value = i * valueStep;
              const isZeroLine = i === 0; // Linha de base destacada

              return (
                <React.Fragment key={`grid-y-${i}`}>
                  <line
                    x1={plotAreaX}
                    y1={y}
                    x2={plotAreaX + plotWidth}
                    y2={y}
                    stroke={
                      isZeroLine
                        ? THEME.colors.grid.zeroLine // Cor para a linha zero
                        : THEME.colors.grid.line // Cor para outras linhas de grade
                    }
                    strokeDasharray="4 4" // Estilo dashed para o grid
                    strokeWidth={isZeroLine ? 1.5 * scale : 1 * scale}
                    opacity={gridAndLabelOpacity}
                  />
                  {showYAxisLabels && (
                    <text
                      x={plotAreaX - 10 * scale}
                      y={y}
                      textAnchor="end"
                      dominantBaseline="middle"
                      fontSize={11 * scale}
                      fill={THEME.colors.text.muted}
                      fontFamily={FONT_FAMILY}
                      opacity={gridAndLabelOpacity}
                    >
                      {formatValue(value)}
                    </text>
                  )}
                </React.Fragment>
              );
            })}

          {/* Caminho da área preenchida */}
          <path
            d={areaPathCommand}
            fill="url(#areaGradient)"
            opacity={animatedAreaOpacity}
          />

          {/* Caminho da linha superior */}
          <path
            d={linePathCommand}
            fill="none"
            stroke={color}
            strokeWidth={4 * scale} // Espessura da linha
            strokeDasharray={pathLength}
            strokeDashoffset={animatedLineStrokeDashoffset}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Rótulos do eixo X e Rótulos de valor */}
          {Array.isArray(data) && data.length > 0 && plotPoints.map((p, i) => {
            const d = data[i]; // Ponto de dado original para o rótulo
            const x = p.x;
            const y = p.y;

            // Animação dos rótulos de valor
            const labelProgress = spring({
              frame: frame - 50, // Inicia os rótulos mais tarde
              fps,
              config: SPRING_CONFIG_LABELS,
              from: 0,
              to: 1,
              durationInFrames: 20,
            });

            const labelScale = interpolate(
              labelProgress,
              [0, 1],
              [0.8, 1],
              { extrapolateRight: "clamp" }
            );
            const labelOpacity = interpolate(
              labelProgress,
              [0, 1],
              [0, 1],
              { extrapolateRight: "clamp" }
            );

            // Garante que a posição y seja segura para valores próximos de zero
            const safeY = isNaN(y) ? plotAreaY + plotHeight : y;

            return (
              <React.Fragment key={`point-${i}`}>
                {/* Rótulos do eixo X */}
                {showXAxisLabels && (
                  <text
                    x={x}
                    y={plotAreaY + plotHeight + xAxisLabelHeight / 2 + 5 * scale}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={11 * scale}
                    fill={THEME.colors.text.muted}
                    fontFamily={FONT_FAMILY}
                    opacity={gridAndLabelOpacity}
                  >
                    {d.label}
                  </text>
                )}

                {/* Rótulos de valor */}
                {showValues && (
                  <text
                    x={x}
                    y={safeY - 10 * scale} // Posiciona acima do ponto
                    textAnchor="middle"
                    dominantBaseline="auto"
                    fontSize={12 * scale}
                    fontWeight={600}
                    fill={THEME.colors.text.light}
                    fontFamily={FONT_FAMILY}
                    opacity={labelOpacity}
                    transform={`scale(${labelScale})`}
                    transformOrigin={`${x}px ${safeY - 10 * scale}px`} // Escala a partir da posição do rótulo
                  >
                    {formatValue(d.value)}
                  </text>
                )}
              </React.Fragment>
            );
          })}
        </svg>
      </div>
    </AbsoluteFill>
  );
};
