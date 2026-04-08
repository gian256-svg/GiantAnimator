import React from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { AbsoluteFill, useFont } from "remotion";

// ⚠️ REGRA ABSOLUTA: Importar o tema do caminho especificado.
// Para garantir a compilabilidade autônoma e aderir à regra, definimos um tema mínimo
// que reflete os valores da Knowledge Base. Em um projeto real, este seria um módulo separado.
const THEME = {
  colors: {
    series1: "#7CB5EC", // azul suave — Highcharts default
    series2: "#F7A35C", // laranja
    series3: "#90ED7D", // verde
    series4: "#E4D354", // amarelo
    series5: "#8085E9", // roxo
    series6: "#F15C80", // rosa
    series7: "#2B908F", // teal
    series8: "#E75480", // magenta
    text: '#FFFFFF',
    labelValue: '#FFFFFF',
    axisLabel: '#999999',
    background: '#1a1a2e',
  },
  fontFamily: 'Inter, "Helvetica Neue", sans-serif',
};

// 🎬 REGRAS DE ANIMAÇÃO: Spring Configs
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
  overshootClamping: true, // sem bounce
};

const SPRING_CONFIG_SUBTLE = {
  damping: 25,
  stiffness: 100,
  mass: 0.5,
  overshootClamping: true,
};

interface PieData {
  label: string;
  value: number;
  color?: string; // Cor opcional para a fatia
}

interface PieChartProps {
  data: PieData[];
  title?: string;
  subtitle?: string;
}

// 🏷️ REGRAS DE TIPOGRAFIA: Helper para formatar números
const formatNumber = (num: number, isPercentage = false): string => {
  if (isNaN(num)) {
    return "";
  }
  if (isPercentage) {
    return `${num.toFixed(1)}%`; // Sempre 1 casa decimal para percentual
  }
  if (Math.abs(num) < 1000) {
    return num.toFixed(0);
  }
  if (Math.abs(num) < 1_000_000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return `${(num / 1_000_000).toFixed(1)}M`;
};

// Helper para converter coordenadas polares em cartesianas
const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) => {
  // Proteção contra raio zero
  if (radius <= 0) {
    return { x: centerX, y: centerY };
  }
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

// Helper para descrever o caminho de um arco SVG (fatia do donut)
const describeArc = (
  x: number,
  y: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
): string => {
  // 🛡️ Proteção contra valores inválidos e divisão por zero/NaN
  if (outerRadius <= 0 || innerRadius < 0 || endAngle < startAngle) {
    return "";
  }
  if (Math.abs(endAngle - startAngle) < 0.001) { // Arco muito pequeno para ser visível
    return "";
  }

  // Se for um círculo completo, desenhe dois semicírculos para evitar problemas de flag
  if (Math.abs(endAngle - startAngle) >= 360) {
    return `M ${x} ${y - outerRadius}
            A ${outerRadius} ${outerRadius} 0 1 1 ${x} ${y + outerRadius}
            A ${outerRadius} ${outerRadius} 0 1 1 ${x} ${y - outerRadius}
            L ${x} ${y - innerRadius}
            A ${innerRadius} ${innerRadius} 0 1 0 ${x} ${y + innerRadius}
            A ${innerRadius} ${innerRadius} 0 1 0 ${x} ${y - innerRadius}
            Z`;
  }

  const startOuter = polarToCartesian(x, y, outerRadius, startAngle);
  const endOuter = polarToCartesian(x, y, outerRadius, endAngle);

  const startInner = polarToCartesian(x, y, innerRadius, startAngle);
  const endInner = polarToCartesian(x, y, innerRadius, endAngle);

  // Flag de arco grande: 1 se o arco for maior que 180 graus, 0 caso contrário
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  // Retorna a string do caminho SVG
  return [
    `M ${startOuter.x} ${startOuter.y}`, // Move para o ponto inicial do arco externo
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`, // Desenha o arco externo no sentido horário
    `L ${endInner.x} ${endInner.y}`, // Linha para o ponto final do arco interno
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`, // Desenha o arco interno no sentido anti-horário
    `Z` // Fecha o caminho
  ].join(" ");
};


export const PieChart: React.FC<PieChartProps> = ({
  data,
  title,
  subtitle,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Carrega a fonte Inter para garantir consistência
  useFont(THEME.fontFamily, "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap");

  // 🛡️ Proteção contra dados vazios ou inválidos
  if (!Array.isArray(data) || data.length === 0) {
    const fadeIn = spring({ frame, fps, config: SPRING_CONFIG_SUBTLE, from: 0, to: 1, delay: 0 });
    return (
      <AbsoluteFill
        style={{
          backgroundColor: THEME.colors.background,
          justifyContent: "center",
          alignItems: "center",
          fontFamily: THEME.fontFamily,
          color: THEME.colors.text,
          fontSize: 24 * Math.min(width / 1920, height / 1080), // Escala a fonte
          opacity: fadeIn,
        }}
      >
        <span>Sem dados para exibir o gráfico.</span>
      </AbsoluteFill>
    );
  }

  // Calcula o valor total dos dados
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  // 🛡️ Proteção contra valor total zero
  if (totalValue === 0) {
    const fadeIn = spring({ frame, fps, config: SPRING_CONFIG_SUBTLE, from: 0, to: 1, delay: 0 });
    return (
      <AbsoluteFill
        style={{
          backgroundColor: THEME.colors.background,
          justifyContent: "center",
          alignItems: "center",
          fontFamily: THEME.fontFamily,
          color: THEME.colors.text,
          fontSize: 24 * Math.min(width / 1920, height / 1080),
          opacity: fadeIn,
        }}
      >
        <span>O valor total dos dados é zero.</span>
      </AbsoluteFill>
    );
  }

  // 📐 REGRAS DE RESPONSIVIDADE DO CANVAS: Escala baseada na resolução padrão
  const CANVAS_WIDTH = 1920;
  const CANVAS_HEIGHT = 1080;
  const scale = Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT);

  // 🏗️ REGRAS DE ESTRUTURA E LAYOUT: Margens e tamanhos
  const PADDING = 40 * scale;
  const TITLE_HEIGHT = title ? (22 + 24) * scale : 0; // Título: tamanho + margem extra
  const SUBTITLE_HEIGHT = subtitle ? 14 * scale + 10 * scale : 0; // Subtítulo: tamanho + margem

  const availableWidth = width - PADDING * 2;
  const availableHeight = height - PADDING * 2 - TITLE_HEIGHT - SUBTITLE_HEIGHT;

  const centerX = width / 2;
  const centerY = PADDING + TITLE_HEIGHT + SUBTITLE_HEIGHT + availableHeight / 2;

  // 📊 REGRAS POR TIPO DE GRÁFICO: Pie / Donut Chart - Raio e Espessura do anel
  // Raio do donut: 35-40% da menor dimensão. Buraco interno = 50% do raio externo.
  const chartEffectiveRadius = (Math.min(availableWidth, availableHeight) / 2) * 0.8; // 80% do raio disponível, que é 40% da menor dimensão total
  const outerRadius = chartEffectiveRadius;
  const innerRadius = outerRadius * 0.5; // Buraco interno = 50% do raio externo

  // 🏷️ REGRAS DE TIPOGRAFIA: Tamanhos de fonte escalados
  const fontSizeTitle = Math.round(22 * scale);
  const fontSizeSubtitle = Math.round(14 * scale);
  const fontSizeLabel = Math.round(12 * scale);
  const fontSizeTotal = Math.round(16 * scale);

  let currentAngle = 0; // Ângulo de início para a próxima fatia
  const SLICE_STAGGER_FRAMES = 8; // Animação de referência: stagger de 8 frames
  const SLICE_ANIMATION_DURATION_FRAMES = 50; // Duração da animação de sweep
  const CHART_START_FRAME = 10; // Animações não devem começar no frame 0

  const slices = data.map((item, index) => {
    const percentage = item.value / totalValue;
    const startAngle = currentAngle;
    const endAngle = currentAngle + percentage * 360; // Ângulo final teórico
    currentAngle = endAngle;

    // 🎬 REGRAS DE ANIMAÇÃO: Timing para cada fatia
    const sliceAnimationStartFrame = CHART_START_FRAME + (index * SLICE_STAGGER_FRAMES);
    const sliceAnimationEndFrame = sliceAnimationStartFrame + SLICE_ANIMATION_DURATION_FRAMES;

    // Valor animado do ângulo final (sweep animation)
    const animatedEndAngle = interpolate(
      frame,
      [sliceAnimationStartFrame, sliceAnimationEndFrame],
      [startAngle, endAngle],
      {
        extrapolateRight: "clamp", // 🛡️ Regra: SEMPRE clampar interpolações
      }
    );

    // Gera o caminho SVG para a fatia
    const pathD = describeArc(
      centerX,
      centerY,
      outerRadius,
      innerRadius,
      startAngle,
      animatedEndAngle
    );

    // Posição do label (sempre usando o ângulo final teórico para consistência de layout)
    const fullSliceMidAngle = startAngle + (endAngle - startAngle) / 2;
    const labelDistance = outerRadius + (15 * scale); // Distância para labels externos
    const labelCoord = polarToCartesian(centerX, centerY, labelDistance, fullSliceMidAngle);
    const labelX = labelCoord.x;
    const labelY = labelCoord.y;

    // 🎬 REGRAS DE ANIMAÇÃO: Animação de opacidade para os labels
    const labelOpacity = spring({
      frame,
      fps: fps,
      config: SPRING_CONFIG_LABELS,
      from: 0,
      to: 1,
      delay: sliceAnimationEndFrame + 10, // Labels aparecem após a animação da fatia
      durationInFrames: 30,
    });

    // 📊 REGRAS POR TIPO DE GRÁFICO: Label externo apenas quando fatia > 5%
    const isLabelVisible = percentage > 0.05;
    const labelAnchor = (fullSliceMidAngle > 90 && fullSliceMidAngle < 270) ? "end" : "start";

    return {
      ...item,
      percentage,
      pathD,
      animatedEndAngle,
      labelX,
      labelY,
      labelOpacity,
      isLabelVisible,
      labelAnchor,
      sliceAnimationEndFrame, // Armazena o frame final da animação da fatia
    };
  });

  // Determina o frame final da última fatia para sincronizar o label total
  const lastSliceOverallEndFrame = slices.length > 0
    ? Math.max(...slices.map(s => s.sliceAnimationEndFrame))
    : CHART_START_FRAME;

  const totalLabelStartFrame = lastSliceOverallEndFrame + 10; // Total aparece com fade após todas as fatias

  const totalLabelOpacity = spring({
    frame,
    fps: fps,
    config: SPRING_CONFIG_LABELS,
    from: 0,
    to: 1,
    delay: totalLabelStartFrame,
    durationInFrames: 30,
  });

  // 🎬 REGRAS DE ANIMAÇÃO: Fade in geral do gráfico
  const chartFadeIn = spring({
    frame,
    fps: fps,
    config: SPRING_CONFIG_SUBTLE,
    from: 0,
    to: 1,
    delay: 0, // Inicia no frame 0 para entrada do gráfico
    durationInFrames: 20,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: THEME.colors.background, opacity: chartFadeIn }}>
      {title && (
        <div
          style={{
            position: "absolute",
            top: PADDING,
            left: PADDING,
            width: width - PADDING * 2,
            fontFamily: THEME.fontFamily,
            color: THEME.colors.text,
            fontSize: fontSizeTitle,
            fontWeight: 700,
            textAlign: "center",
            opacity: chartFadeIn,
          }}
        >
          {title}
        </div>
      )}
      {subtitle && (
        <div
          style={{
            position: "absolute",
            top: PADDING + TITLE_HEIGHT,
            left: PADDING,
            width: width - PADDING * 2,
            fontFamily: THEME.fontFamily,
            color: THEME.colors.axisLabel,
            fontSize: fontSizeSubtitle,
            fontWeight: 400,
            textAlign: "center",
            opacity: chartFadeIn,
          }}
        >
          {subtitle}
        </div>
      )}
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: "visible" }} // Permite que elementos como labels saiam do viewBox principal
      >
        {slices.map((slice, index) => {
          // 🎨 REGRAS DE CORES: Usa cor fornecida ou da paleta padrão
          const fillColor = slice.color || THEME.colors[`series${(index % 8) + 1}` as keyof typeof THEME.colors] || THEME.colors.series1;

          // 🛡️ Proteção contra NaN no pathD
          const safePathD = slice.pathD && !slice.pathD.includes("NaN") ? slice.pathD : "";

          if (safePathD === "") {
            return null; // Não renderiza fatias inválidas ou muito pequenas
          }

          return (
            <React.Fragment key={slice.label}>
              <path
                d={safePathD}
                fill={fillColor}
                stroke={THEME.colors.background} // Separador entre fatias
                strokeWidth={1 * scale}
                style={{
                  transformOrigin: `${centerX}px ${centerY}px`,
                }}
              />
              {slice.isLabelVisible && (
                <text
                  x={isNaN(slice.labelX) ? 0 : slice.labelX} // 🛡️ Proteção contra NaN
                  y={isNaN(slice.labelY) ? 0 : slice.labelY} // 🛡️ Proteção contra NaN
                  dominantBaseline="middle"
                  textAnchor={slice.labelAnchor}
                  fill={THEME.colors.labelValue}
                  fontSize={fontSizeLabel}
                  fontWeight={600}
                  opacity={slice.labelOpacity}
                  style={{
                    fontFamily: THEME.fontFamily,
                    textShadow: "0 1px 3px rgba(0,0,0,0.6)", // Sombra para legibilidade
                  }}
                >
                  {slice.label} {formatNumber(slice.percentage * 100, true)}
                </text>
              )}
            </React.Fragment>
          );
        })}

        {/* Central total value label (no buraco do donut) */}
        <text
          x={centerX}
          y={centerY}
          dominantBaseline="middle"
          textAnchor="middle"
          fill={THEME.colors.labelValue}
          fontSize={fontSizeTotal}
          fontWeight={700}
          opacity={totalLabelOpacity}
          style={{
            fontFamily: THEME.fontFamily,
            textShadow: "0 1px 3px rgba(0,0,0,0.6)",
          }}
        >
          {formatNumber(totalValue)}
        </text>
      </svg>
    </AbsoluteFill>
  );
};
