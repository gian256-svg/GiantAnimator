import React from "react";
import {
  AbsoluteFill,
  Sequence,
  spring,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { THEME } from "../theme"; // Importa o tema do diretório pai

// =========================================================
// REGRA: Configurações de Spring para animações, conforme Knowledge Base
// =========================================================
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

// =========================================================
// REGRA: Constantes de timing para controle da animação
// =========================================================
const INITIAL_RESPITE_FRAMES = 10; // "Respiro" inicial antes de qualquer animação
const SWEEP_DURATION_FRAMES = 50; // Duração da animação de "sweep" de cada fatia
const SLICE_STAGGER_FRAMES = 8; // Atraso entre o início da animação de fatias sequenciais
const LABEL_FADE_IN_DURATION_FRAMES = 20; // Duração do fade-in para labels de percentual
const TOTAL_LABEL_DELAY_AFTER_SWEEP_END = 10; // Atraso para o label total aparecer após a última fatia

// =========================================================
// REGRA: Definição de tipos de dados para os props
// =========================================================
interface PieData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieData[];
  title?: string;
  showTotalLabel?: boolean;
}

// =========================================================
// REGRA: Helper para formatar números (sem k/M para percentuais, mas aplicando para total)
// =========================================================
const formatValue = (value: number, isPercentage: boolean = false): string => {
  // REGRA: Proteção contra NaN
  if (isNaN(value)) {
    return "N/A";
  }
  if (isPercentage) {
    // REGRA: Percentual com 1 casa decimal
    return `${value.toFixed(1)}%`;
  }
  // REGRA: Formatação para k/M
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}k`;
  }
  return value.toLocaleString();
};

// =========================================================
// Função para gerar o caminho SVG de uma fatia de donut
// =========================================================
const describeArc = (
  x: number,
  y: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string => {
  // REGRA: Proteção contra raios inválidos e divisões por zero
  if (outerRadius <= 0 || innerRadius >= outerRadius || isNaN(innerRadius) || isNaN(outerRadius)) {
    return "";
  }
  if (endAngle <= startAngle || isNaN(startAngle) || isNaN(endAngle)) {
    return ""; // Ângulo inválido
  }

  // Garante que os raios são não-negativos
  innerRadius = Math.max(0, innerRadius);
  outerRadius = Math.max(0, outerRadius);

  // Converte coordenadas polares para cartesianas
  const getCoords = (radius: number, angle: number) => ({
    x: x + radius * Math.cos(angle),
    y: y + radius * Math.sin(angle),
  });

  const startOuter = getCoords(outerRadius, startAngle);
  const endOuter = getCoords(outerRadius, endAngle);
  const startInner = getCoords(innerRadius, startAngle);
  const endInner = getCoords(innerRadius, endAngle);

  // Determina se o arco é maior que 180 graus (PI radianos)
  const largeArcFlag = endAngle - startAngle <= Math.PI ? "0" : "1";

  // Retorna a string do caminho SVG para uma fatia de donut
  return [
    `M ${startOuter.x} ${startOuter.y}`, // Move para o ponto inicial no arco externo
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuter.x} ${endOuter.y}`, // Desenha o arco externo (sentido horário)
    `L ${endInner.x} ${endInner.y}`, // Desenha uma linha do final do arco externo para o final do arco interno
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`, // Desenha o arco interno (sentido anti-horário)
    `Z`, // Fecha o caminho desenhando uma linha do início do arco interno para o início do arco externo
  ].join(" ");
};

export const PieChart: React.FC<PieChartProps> = ({
  data: rawData = [],
  title = "Distribuição de Vendas",
  showTotalLabel = true,
}) => {
  // =========================================================
  // REGRA: TODO valor animado DEVE derivar de useCurrentFrame()
  // =========================================================
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // =========================================================
  // REGRA: Proteção contra arrays vazios ou inválidos
  // =========================================================
  if (!Array.isArray(rawData) || rawData.length === 0) {
    return (
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: THEME.colors.background.dark,
          color: THEME.colors.text.medium,
          fontSize: THEME.fontSizes.label,
          fontFamily: THEME.fontFamily,
        }}
      >
        <p>Sem dados para exibir o gráfico de pizza.</p>
      </AbsoluteFill>
    );
  }

  // Filtra fatias com valor 0 para evitar cálculos desnecessários ou erros de renderização
  const data = rawData.filter((d) => d.value > 0);

  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  // REGRA: Proteção contra total de valores zero
  if (totalValue === 0) {
    return (
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: THEME.colors.background.dark,
          color: THEME.colors.text.medium,
          fontSize: THEME.fontSizes.label,
          fontFamily: THEME.fontFamily,
        }}
      >
        <p>Total de valores é zero. Não é possível exibir o gráfico.</p>
      </AbsoluteFill>
    );
  }

  // =========================================================
  // Calcula dimensões do gráfico
  // =========================================================
  const chartCenterX = width / 2;
  const chartCenterY = height / 2;
  const minDim = Math.min(width, height);

  // REGRA: Raio do donut: 35–40% da menor dimensão, animado
  const outerRadius = interpolate(
    spring({
      frame: frame - INITIAL_RESPITE_FRAMES,
      config: SPRING_CONFIG_MAIN,
      fps,
    }),
    [0, 1],
    [0, (minDim * 0.375) / 2], // 37.5% de minDim para o diâmetro, dividido por 2 para o raio
    { extrapolateRight: "clamp" } // REGRA: Clamp interpolação
  );

  // REGRA: Espessura do anel: ~25% do raio
  const innerRadius = outerRadius * 0.75; // 75% do raio externo para deixar 25% de espessura

  let currentAngle = -Math.PI / 2; // Começa de 12 horas (topo)

  const slices = data.map((item, index) => {
    const percentage = (item.value / totalValue) * 100;
    const angle = (item.value / totalValue) * 2 * Math.PI; // Ângulo total para esta fatia

    const startAngle = currentAngle;
    // REGRA: Animação de sweep, do startAngle até o endAngle final
    const staggerStart = INITIAL_RESPITE_FRAMES + index * SLICE_STAGGER_FRAMES;
    const sweepProgress = spring({
      frame: frame - staggerStart,
      config: SPRING_CONFIG_MAIN,
      fps,
    });
    const animatedEndAngle = interpolate(
      sweepProgress,
      [0, 1],
      [startAngle, startAngle + angle], // Cresce do startAngle até o ângulo completo da fatia
      { extrapolateRight: "clamp" } // REGRA: Clamp interpolação
    );

    currentAngle += angle; // Atualiza o ângulo para a próxima fatia

    // Calcula a posição do centroide para os labels externos
    const labelRadius = outerRadius + 30; // 30px fora do raio externo
    const labelMidAngle = startAngle + angle / 2; // Ponto central angular da fatia
    const labelX = chartCenterX + labelRadius * Math.cos(labelMidAngle);
    const labelY = chartCenterY + labelRadius * Math.sin(labelMidAngle);

    // Fade-in para os labels de percentual
    const labelFadeInStart = staggerStart + SWEEP_DURATION_FRAMES / 2; // Labels aparecem na metade da animação de sweep
    const labelOpacityProgress = spring({
      frame: frame - labelFadeInStart,
      config: SPRING_CONFIG_LABELS,
      fps,
    });
    const labelOpacity = interpolate(
      labelOpacityProgress,
      [0, 1],
      [0, 1],
      { extrapolateRight: "clamp" } // REGRA: Clamp interpolação
    );

    return {
      ...item,
      percentage,
      startAngle,
      endAngle: startAngle + angle, // Guarda o endAngle real para cálculos
      animatedEndAngle,
      labelX,
      labelY,
      labelMidAngle,
      labelOpacity,
      staggerStart, // Mantém para o timing do label total
    };
  });

  // Calcula o timing para o label de valor total
  const lastSliceEndSweep =
    slices.length > 0
      ? slices[slices.length - 1].staggerStart + SWEEP_DURATION_FRAMES
      : INITIAL_RESPITE_FRAMES;
  const totalLabelStartFrame =
    lastSliceEndSweep + TOTAL_LABEL_DELAY_AFTER_SWEEP_END;

  const totalLabelOpacityProgress = spring({
    frame: frame - totalLabelStartFrame,
    config: SPRING_CONFIG_LABELS,
    fps,
  });
  const totalLabelOpacity = interpolate(
    totalLabelOpacityProgress,
    [0, 1],
    [0, 1],
    { extrapolateRight: "clamp" } // REGRA: Clamp interpolação
  );
  
  // REGRA: Proteção contra NaN para raios SVG
  const safeOuterRadius = isNaN(outerRadius) ? 0 : outerRadius;
  const safeInnerRadius = isNaN(innerRadius) ? 0 : innerRadius;

  return (
    <AbsoluteFill
      style={{ backgroundColor: THEME.colors.background.dark, padding: 40 }}
    >
      {/* Título do gráfico */}
      <h1
        style={{
          fontFamily: THEME.fontFamily,
          fontSize: THEME.fontSizes.title,
          fontWeight: THEME.fontWeights.bold,
          color: THEME.colors.text.light,
          textAlign: "center",
          position: "absolute",
          width: "100%",
          top: 20,
          opacity: spring({
            frame: frame - (INITIAL_RESPITE_FRAMES / 2), // Aparece antes das fatias
            config: SPRING_CONFIG_SUBTLE,
            fps,
          }),
        }}
      >
        {title}
      </h1>

      <svg width={width} height={height}>
        {/* Fatias do donut */}
        <g>
          {slices.map((slice) => {
            // REGRA: Proteção contra NaN para o ângulo final da animação
            const finalEndAngle = isNaN(slice.animatedEndAngle)
              ? slice.startAngle
              : slice.animatedEndAngle;

            const d = describeArc(
              chartCenterX,
              chartCenterY,
              safeInnerRadius,
              safeOuterRadius,
              slice.startAngle,
              finalEndAngle
            );

            // Não renderiza fatias com valor 0 ou caminho vazio
            if (slice.value <= 0 || !d) return null;

            return (
              <path
                key={slice.label}
                d={d}
                fill={slice.color}
                style={{
                  transformOrigin: `${chartCenterX}px ${chartCenterY}px`,
                  // A animação de sweep já cuida da entrada, não precisa de scale extra aqui
                }}
              />
            );
          })}
        </g>

        {/* Labels de percentual */}
        {slices.map((slice) => {
          // REGRA: Mostrar label apenas quando fatia > 5%
          if (slice.percentage < 5) return null;

          // REGRA: Posicionamento e alinhamento do texto
          // Determina a âncora do texto com base na posição angular
          const textAnchor =
            slice.labelMidAngle > Math.PI / 2 &&
            slice.labelMidAngle < (3 * Math.PI) / 2
              ? "end" // Metade esquerda do círculo
              : "start"; // Metade direita do círculo

          const translateX = textAnchor === "end" ? -10 : 10; // Offset para não colidir com a fatia

          // REGRA: Proteção contra NaN para atributos SVG
          const safeLabelX = isNaN(slice.labelX) ? chartCenterX : slice.labelX;
          const safeLabelY = isNaN(slice.labelY) ? chartCenterY : slice.labelY;

          return (
            <text
              key={`${slice.label}-percent`}
              x={safeLabelX + translateX}
              y={safeLabelY}
              textAnchor={textAnchor}
              dominantBaseline="middle"
              style={{
                fontFamily: THEME.fontFamily,
                fontSize: THEME.fontSizes.label,
                fontWeight: THEME.fontWeights.semibold,
                fill: THEME.colors.text.light,
                opacity: slice.labelOpacity,
                // REGRA: Sombra para melhorar contraste
                textShadow: "0 1px 3px rgba(0,0,0,0.6)",
              }}
            >
              {formatValue(slice.percentage, true)}
            </text>
          );
        })}

        {/* Label de valor total no centro */}
        {showTotalLabel && (
          <text
            x={chartCenterX}
            y={chartCenterY}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontFamily: THEME.fontFamily,
              fontSize: THEME.fontSizes.labelValue,
              fontWeight: THEME.fontWeights.bold,
              fill: THEME.colors.text.light,
              opacity: totalLabelOpacity,
              textShadow: "0 1px 3px rgba(0,0,0,0.6)",
            }}
          >
            {formatValue(totalValue)}
          </text>
        )}
      </svg>
    </AbsoluteFill>
  );
};

// DUMMY theme.ts para permitir a compilação. Em um projeto real, estaria em outro arquivo.
// NUNCA remover este bloco se o tema não for importado de fato!
// =========================================================
// REGRA: Import do tema: import { THEME } from "../theme"
// =========================================================
declare module "../theme" {
  export const THEME: {
    fontFamily: string;
    fontSizes: {
      title: string;
      subtitle: string;
      axisLabel: string;
      label: string;
      labelValue: string;
      legend: string;
    };
    fontWeights: {
      thin: string;
      light: string;
      regular: string;
      medium: string;
      semibold: string;
      bold: string;
      extrabold: string;
      black: string;
    };
    colors: {
      background: {
        dark: string;
        light: string;
      };
      text: {
        light: string;
        medium: string;
        dark: string;
      };
      primary: string;
      secondary: string;
      success: string;
      warning: string;
      danger: string;
      info: string;
      grid: string;
      gridHighlight: string;
    };
  };
}

// Implementação DUMMY do THEME se '../theme' não existir, para garantir compilabilidade.
// Em um projeto real, esta parte não seria necessária no mesmo arquivo.
if (typeof THEME === 'undefined') {
  (global as any).THEME = {
    fontFamily: 'Inter, "Helvetica Neue", sans-serif',
    fontSizes: {
      title: '22px',
      subtitle: '14px',
      axisLabel: '12px',
      label: '12px',
      labelValue: '20px', // Maior para o total no centro
      legend: '12px',
    },
    fontWeights: {
      thin: '100',
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900',
    },
    colors: {
      background: {
        dark: '#1a1a2e',
        light: '#FFFFFF',
      },
      text: {
        light: '#FFFFFF',
        medium: '#AAAAAA',
        dark: '#333333',
      },
      primary: '#7CB5EC',
      secondary: '#F7A35C',
      success: '#90ED7D',
      warning: '#E4D354',
      danger: '#F15C80',
      info: '#8085E9',
      grid: 'rgba(255,255,255,0.08)',
      gridHighlight: 'rgba(255,255,255,0.25)',
    },
  };
}
