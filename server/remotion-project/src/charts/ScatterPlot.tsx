import React from "react";
import {
  AbsoluteFill,
  spring,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { THEME } from "../theme"; // Importa o tema padrão do projeto

// --- UTILITIES & TYPES ---

/**
 * Interface para um ponto de dados em um gráfico de dispersão.
 */
interface ScatterPoint {
  x: number;
  y: number;
  label?: string;
  color?: string; // Cor opcional por ponto, sobrescreve pointColor global
}

/**
 * Propriedades para o componente ScatterPlot.
 */
interface ScatterPlotProps {
  data: ScatterPoint[];
  title?: string;
  subtitle?: string;
  showTrendLine?: boolean;
  xAxisLabel?: string;
  yAxisLabel?: string;
  pointRadius?: number; // Raio dos pontos (padrão 8px)
  pointColor?: string; // Cor padrão para todos os pontos se não especificado na data
  backgroundColor?: string;
  chartColorPalette?: string[]; // Paleta de cores para os pontos (se múltiplos ou pointColor não definido)
}

// Configurações de Spring baseadas nas Regras de Ouro de Animação
const SPRING_CONFIG_MAIN = {
  damping: 12,
  stiffness: 80,
  mass: 1.0,
  overshootClamping: false, // Permite um leve "bounce"
};

const SPRING_CONFIG_LABELS = {
  damping: 20,
  stiffness: 120,
  mass: 0.8,
  overshootClamping: true, // Sem "bounce" para labels
};

const SPRING_CONFIG_SUBTLE = {
  damping: 25,
  stiffness: 100,
  mass: 0.5,
  overshootClamping: true, // Sem "bounce" para animações sutis
};

/**
 * Função utilitária para formatar números em rótulos.
 * Suporta k/M, monetário e percentual.
 */
const formatNumber = (num: number, isCurrency = false, isPercentage = false): string => {
  if (isNaN(num)) return "";
  const absNum = Math.abs(num);
  let formatted: string;

  if (isPercentage) {
    formatted = `${absNum.toFixed(1)}%`;
  } else if (absNum < 1000) {
    formatted = absNum.toFixed(0);
  } else if (absNum < 1000000) {
    formatted = `${(absNum / 1000).toFixed(1)}k`;
  } else {
    formatted = `${(absNum / 1000000).toFixed(1)}M`;
  }

  if (isCurrency) {
    formatted = `R$ ${formatted}`;
  }

  return num < 0 ? `-${formatted}` : formatted;
};

/**
 * Componente de estado vazio para exibir quando não há dados.
 */
const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <AbsoluteFill
    style={{
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: THEME.colors.background,
      color: THEME.colors.textSecondary,
      fontFamily: THEME.fontFamilies.default,
      fontSize: THEME.fontSizes.title,
    }}
  >
    {message}
  </AbsoluteFill>
);

// --- SCATTER PLOT COMPONENT ---

export const ScatterPlot: React.FC<ScatterPlotProps> = ({
  data: rawData,
  title = "Scatter Plot",
  subtitle = "",
  showTrendLine = true,
  xAxisLabel = "X-Axis",
  yAxisLabel = "Y-Axis",
  pointRadius = 8, // Padrão 8px conforme regra
  pointColor,
  backgroundColor = THEME.colors.background,
  chartColorPalette = THEME.colors.palette,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Escala responsiva para o canvas (base 1920x1080)
  const scale = Math.min(width / 1920, height / 1080);

  // Dimensões do gráfico em coordenadas internas (não dimensionadas)
  const chartWidth = 1920;
  const chartHeight = 1080;
  const padding = 60; // Margem interna, será dimensionada pelo 'scale'
  const titleSpace = title ? 48 : 0; // Espaço para título
  const subtitleSpace = subtitle ? 30 : 0; // Espaço para subtítulo
  const xAxisLabelSpace = xAxisLabel ? 40 : 0; // Espaço para label do eixo X
  const yAxisLabelSpace = yAxisLabel ? 40 : 0; // Espaço para label do eixo Y

  // Cálculo da área de plotagem
  const plotAreaWidth = chartWidth - 2 * padding - yAxisLabelSpace;
  const plotAreaHeight = chartHeight - 2 * padding - titleSpace - subtitleSpace - xAxisLabelSpace;

  const plotX = padding + yAxisLabelSpace;
  const plotY = padding + titleSpace + subtitleSpace;

  // Validação e filtragem dos dados
  if (!Array.isArray(rawData) || rawData.length === 0) {
    return <EmptyState message="Nenhum dado para exibir." />;
  }
  const data = rawData.filter(p => !isNaN(p.x) && !isNaN(p.y));
  if (data.length === 0) {
    return <EmptyState message="Nenhum ponto de dado válido após filtrar." />;
  }

  // Encontra os valores min/max para os eixos, com um buffer para melhor visualização
  const minXValue = Math.min(...data.map((p) => p.x));
  const maxXValue = Math.max(...data.map((p) => p.x));
  const minYValue = Math.min(...data.map((p) => p.y));
  const maxYValue = Math.max(...data.map((p) => p.y));

  const xRangeData = Math.max(maxXValue - minXValue, 1);
  const yRangeData = Math.max(maxYValue - minYValue, 1);

  const xBuffer = xRangeData * 0.1;
  const yBuffer = yRangeData * 0.1;

  const scaledMinX = minXValue - xBuffer;
  const scaledMaxX = maxXValue + xBuffer;
  const scaledMinY = minYValue - yBuffer;
  const scaledMaxY = maxYValue + yBuffer;

  const effectiveXRange = Math.max(scaledMaxX - scaledMinX, 1);
  const effectiveYRange = Math.max(scaledMaxY - scaledMinY, 1);

  // Definição dos ticks para grid e labels dos eixos
  const numTicks = 5; // 5 ticks para X e Y

  const xTickValues = Array.from({ length: numTicks }).map((_, i) =>
    scaledMinX + (effectiveXRange / (numTicks - 1)) * i
  );
  const yTickValues = Array.from({ length: numTicks }).map((_, i) =>
    scaledMinY + (effectiveYRange / (numTicks - 1)) * i
  );

  // Funções de escala para mapear valores de dados para coordenadas de pixel
  const getXPos = (value: number) =>
    interpolate(
      value,
      [scaledMinX, scaledMaxX],
      [0, plotAreaWidth],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
  const getYPos = (value: number) =>
    interpolate(
      value,
      [scaledMinY, scaledMaxY],
      [plotAreaHeight, 0], // Eixo Y é invertido no SVG (0 no topo)
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

  // --- Timing de Animação ---
  const CHART_START_FRAME = 10; // Início do gráfico (respiro inicial)
  const POINT_STAGGER_DELAY = 2; // Atraso entre o pop de cada ponto (frames)
  const POINTS_ANIM_DURATION = 30; // Duração do "pop" de cada ponto (frames)
  const LABELS_APPEAR_DELAY = 10; // Atraso para labels aparecerem após o início dos pontos
  const TREND_LINE_START_DELAY = 15; // Atraso para a linha de tendência após o último ponto

  const chartGlobalAnimationStart = CHART_START_FRAME;
  const pointsFinishedFrame = chartGlobalAnimationStart + data.length * POINT_STAGGER_DELAY + POINTS_ANIM_DURATION;
  const trendLineAnimationStartFrame = pointsFinishedFrame + TREND_LINE_START_DELAY;

  const chartScaleFactor = spring({
    frame: frame - chartGlobalAnimationStart,
    config: SPRING_CONFIG_SUBTLE,
    fps,
    from: 0,
    to: 1,
  });

  const chartFadeOpacity = interpolate(
    frame,
    [chartGlobalAnimationStart, chartGlobalAnimationStart + 10],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // --- Cálculo da Linha de Tendência (Regressão Linear) ---
  let trendLinePoints: { x: number; y: number }[] = [];
  if (showTrendLine && data.length > 1) {
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const n = data.length;

    for (const p of data) {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumX2 += p.x * p.x;
    }

    const denominator = (n * sumX2 - sumX * sumX);
    const m = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
    const b = denominator !== 0 ? (sumY - m * sumX) / n : (sumY / n); // Fallback for vertical line or no slope

    const y1 = m * scaledMinX + b;
    const y2 = m * scaledMaxX + b;

    trendLinePoints = [
      { x: getXPos(scaledMinX), y: getYPos(y1) },
      { x: getXPos(scaledMaxX), y: getYPos(y2) },
    ];
  }

  // Animação da linha de tendência (strokeDashoffset)
  let trendLineLength = 0;
  if (trendLinePoints.length === 2) {
    const p1 = trendLinePoints[0];
    const p2 = trendLinePoints[1];
    trendLineLength = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }
  const trendLineDrawProgress = spring({
    frame: frame - trendLineAnimationStartFrame,
    config: SPRING_CONFIG_SUBTLE,
    fps,
    from: 0,
    to: 1,
  });
  const trendLineDashoffset = interpolate(
    trendLineDrawProgress,
    [0, 1],
    [trendLineLength, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const trendLineOpacity = interpolate(
    trendLineDrawProgress,
    [0, 0.5], // Fade in quicker
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: "hidden" }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        style={{ transform: `scale(${scale})`, transformOrigin: "0 0" }}
      >
        {/* Título do Gráfico */}
        {title && (
          <text
            x={plotX + plotAreaWidth / 2}
            y={padding + titleSpace / 2}
            textAnchor="middle"
            fontSize={THEME.fontSizes.title}
            fontWeight={THEME.fontWeights.bold}
            fill={THEME.colors.textPrimary}
            style={{
              fontFamily: THEME.fontFamilies.default,
              opacity: chartFadeOpacity,
              transform: `scale(${chartScaleFactor})`,
              transformOrigin: `${plotX + plotAreaWidth / 2}px ${padding + titleSpace / 2}px`,
            }}
          >
            {title}
          </text>
        )}

        {/* Subtítulo do Gráfico */}
        {subtitle && (
          <text
            x={plotX + plotAreaWidth / 2}
            y={padding + titleSpace + subtitleSpace / 2}
            textAnchor="middle"
            fontSize={THEME.fontSizes.subtitle}
            fill={THEME.colors.textSecondary}
            style={{
              fontFamily: THEME.fontFamilies.default,
              opacity: chartFadeOpacity,
              transform: `scale(${chartScaleFactor})`,
              transformOrigin: `${plotX + plotAreaWidth / 2}px ${padding + titleSpace + subtitleSpace / 2}px`,
            }}
          >
            {subtitle}
          </text>
        )}

        {/* Grupo da área de plotagem e eixos */}
        <g
          transform={`translate(${plotX}, ${plotY})`}
          opacity={chartFadeOpacity}
          style={{
            transform: `scale(${chartScaleFactor})`,
            transformOrigin: `${plotX}px ${plotY}px`,
          }}
        >
          {/* Definição de clipPath para garantir que o conteúdo não vaze da área de plotagem */}
          <defs>
            <clipPath id="plot-area-clip-scatter">
              <rect x={0} y={0} width={plotAreaWidth} height={plotAreaHeight} />
            </clipPath>
          </defs>

          {/* Linhas de Grid */}
          <g clipPath="url(#plot-area-clip-scatter)">
            {/* Grid Horizontal */}
            {Array.isArray(yTickValues) && yTickValues.map((value, i) => {
              const y = getYPos(value);
              const gridLineOpacity = spring({
                frame: frame - chartGlobalAnimationStart,
                config: SPRING_CONFIG_SUBTLE,
                fps,
                from: 0,
                to: 1,
              });
              const safeY = isNaN(y) ? 0 : y;
              return (
                <line
                  key={`y-grid-${i}`}
                  x1={0}
                  y1={safeY}
                  x2={plotAreaWidth}
                  y2={safeY}
                  stroke={THEME.colors.grid}
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  opacity={gridLineOpacity}
                />
              );
            })}
            {/* Grid Vertical (permitido para Scatter) */}
            {Array.isArray(xTickValues) && xTickValues.map((value, i) => {
              const x = getXPos(value);
              const gridLineOpacity = spring({
                frame: frame - chartGlobalAnimationStart,
                config: SPRING_CONFIG_SUBTLE,
                fps,
                from: 0,
                to: 1,
              });
              const safeX = isNaN(x) ? 0 : x;
              return (
                <line
                  key={`x-grid-${i}`}
                  x1={safeX}
                  y1={0}
                  x2={safeX}
                  y2={plotAreaHeight}
                  stroke={THEME.colors.grid}
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  opacity={gridLineOpacity}
                />
              );
            })}
          </g>

          {/* Labels do Eixo Y */}
          {Array.isArray(yTickValues) && yTickValues.map((value, i) => {
            const y = getYPos(value);
            const labelOpacity = spring({
              frame: frame - chartGlobalAnimationStart - LABELS_APPEAR_DELAY,
              config: SPRING_CONFIG_LABELS,
              fps,
              from: 0,
              to: 1,
            });
            const safeY = isNaN(y) ? 0 : y;
            return (
              <text
                key={`y-label-${i}`}
                x={-10} // Posição à esquerda da área de plotagem
                y={safeY}
                dominantBaseline="middle"
                textAnchor="end"
                fontSize={THEME.fontSizes.label}
                fill={THEME.colors.textSecondary}
                style={{
                  fontFamily: THEME.fontFamilies.default,
                  opacity: labelOpacity,
                }}
              >
                {formatNumber(value)}
              </text>
            );
          })}

          {/* Labels do Eixo X */}
          {Array.isArray(xTickValues) && xTickValues.map((value, i) => {
            const x = getXPos(value);
            const labelOpacity = spring({
              frame: frame - chartGlobalAnimationStart - LABELS_APPEAR_DELAY,
              config: SPRING_CONFIG_LABELS,
              fps,
              from: 0,
              to: 1,
            });
            const safeX = isNaN(x) ? 0 : x;
            return (
              <text
                key={`x-label-${i}`}
                x={safeX}
                y={plotAreaHeight + 15} // Posição abaixo da área de plotagem
                dominantBaseline="hanging"
                textAnchor="middle"
                fontSize={THEME.fontSizes.label}
                fill={THEME.colors.textSecondary}
                style={{
                  fontFamily: THEME.fontFamilies.default,
                  opacity: labelOpacity,
                }}
              >
                {formatNumber(value)}
              </text>
            );
          })}

          {/* Linha de Tendência */}
          {showTrendLine && trendLinePoints.length === 2 && (
            <line
              x1={isNaN(trendLinePoints[0].x) ? 0 : trendLinePoints[0].x}
              y1={isNaN(trendLinePoints[0].y) ? 0 : trendLinePoints[0].y}
              x2={isNaN(trendLinePoints[1].x) ? 0 : trendLinePoints[1].x}
              y2={isNaN(trendLinePoints[1].y) ? 0 : trendLinePoints[1].y}
              stroke={THEME.colors.trendLine || "#999999"} // Cor neutra padrão se não definida no tema
              strokeWidth={1.5}
              strokeDasharray={trendLineLength}
              strokeDashoffset={trendLineDashoffset}
              opacity={trendLineOpacity}
              strokeLinecap="round"
            />
          )}

          {/* Pontos de Dispersão */}
          {Array.isArray(data) && data.map((point, i) => {
            const cx = getXPos(point.x);
            const cy = getYPos(point.y);

            // Animação de "pop" escalonada para cada ponto
            const pointAnimationStart = chartGlobalAnimationStart + i * POINT_STAGGER_DELAY;
            const pointScale = spring({
              frame: frame - pointAnimationStart,
              config: SPRING_CONFIG_MAIN,
              fps,
              from: 0,
              to: 1,
            });

            // Cor do ponto: prioriza a cor específica do ponto, depois a global, depois a primeira da paleta
            const pointFillColor = point.color || pointColor || chartColorPalette[0];

            // Proteção contra NaN e raio mínimo
            const safeCx = isNaN(cx) ? 0 : cx;
            const safeCy = isNaN(cy) ? 0 : cy;
            const safeRadius = Math.max(0, pointRadius);

            return (
              <circle
                key={`point-${i}`}
                cx={safeCx}
                cy={safeCy}
                r={safeRadius}
                fill={pointFillColor}
                opacity={0.7} // Opacidade padrão 0.7 conforme regra
                style={{ transform: `scale(${pointScale})`, transformOrigin: `${safeCx}px ${safeCy}px` }}
              />
            );
          })}
        </g>

        {/* Título do Eixo X */}
        {xAxisLabel && (
          <text
            x={plotX + plotAreaWidth / 2}
            y={plotY + plotAreaHeight + xAxisLabelSpace - 10} // Posição ajustada abaixo dos labels X
            textAnchor="middle"
            fontSize={THEME.fontSizes.label}
            fill={THEME.colors.textSecondary}
            style={{
              fontFamily: THEME.fontFamilies.default,
              opacity: chartFadeOpacity,
              transform: `scale(${chartScaleFactor})`,
              transformOrigin: `${plotX + plotAreaWidth / 2}px ${plotY + plotAreaHeight + xAxisLabelSpace - 10}px`,
            }}
          >
            {xAxisLabel}
          </text>
        )}

        {/* Título do Eixo Y */}
        {yAxisLabel && (
          <text
            x={plotX - yAxisLabelSpace / 2}
            y={plotY + plotAreaHeight / 2}
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize={THEME.fontSizes.label}
            fill={THEME.colors.textSecondary}
            // Rotacionar o texto do eixo Y
            transform={`rotate(-90 ${plotX - yAxisLabelSpace / 2} ${plotY + plotAreaHeight / 2})`}
            style={{
              fontFamily: THEME.fontFamilies.default,
              opacity: chartFadeOpacity,
              transform: `scale(${chartScaleFactor}) rotate(-90deg)`,
              transformOrigin: `${plotX - yAxisLabelSpace / 2}px ${plotY + plotAreaHeight / 2}px`,
            }}
          >
            {yAxisLabel}
          </text>
        )}
      </svg>
    </AbsoluteFill>
  );
};
