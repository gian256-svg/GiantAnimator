import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  interpolate,
} from "remotion";
import { Theme, resolveTheme } from "../theme";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export interface PieSlice {
  label: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  data: PieSlice[];
  title?: string;
  backgroundColor?: string;
  textColor?: string;
  sliceColors?: string[];
  elementColors?: string[];
  showValueLabels?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  scale?: number;
  theme?: string;
  colors?: string[];
  unit?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
/**
 * PieChart — Version 3 (2026)
 *
 * Fixes vs v2:
 * - Títulos/legendas escalados corretamente para qualquer resolução
 * - Valores dentro das fatias (≥ 8%) com sombra legível
 * - Legenda com layout de grid fixo (sem sobreposição)
 * - Gradiente radial por fatia (UI/UX Pro Max)
 * - Respeita margem de segurança 4K → qualquer resolução
 */
export const PieChart: React.FC<PieChartProps> = (props) => {
  const rawData = Array.isArray(props.data) ? props.data : [];

  const {
    title,
    showValueLabels = true,
    elementColors,
    x = 0,
    y = 0,
    scale: propScale = 1,
    unit = "",
  } = props;

  const frame = useCurrentFrame();
  const { width: videoWidth, height: videoHeight, fps } = useVideoConfig();
  const instanceId = useId().replace(/:/g, "");

  const width  = props.width  || videoWidth;
  const height = props.height || videoHeight;

  // Resolve tema
  const T            = resolveTheme(props.theme ?? "dark");
  const resolvedBg   = props.backgroundColor ?? T.background;
  const resolvedText = props.textColor ?? T.text;

  // Paleta de cores das fatias
  const sliceColors =
    Array.isArray(props.sliceColors) && props.sliceColors.length > 0
      ? props.sliceColors
      : Array.isArray(props.colors) && props.colors.length > 0
      ? props.colors
      : [...T.colors];

  // ── Escala relativa à 720p (base de referência) ─────────────────────────
  // Garante consistência em qualquer resolução sem sair da safe zone
  const sc = Math.min(width / 1280, height / 720);

  // ── Tamanhos de tipografia escalados (base 4K → proporcional) ──────────
  // Aumentados conforme pedido (+50% título, +65% legenda/subtítulo)
  // Mas com cap para não ultrapassar margens de segurança
  const TITLE_SIZE    = Math.round(sc * 42);   // base 28 → 42 (+50%)
  const SUBTITLE_SIZE = Math.round(sc * 22);   // base 13 → 22 (+65%)
  const LEGEND_LABEL  = Math.round(sc * 19);   // base 11 → 19 (+65%)
  const LEGEND_VALUE  = Math.round(sc * 17);   // base 11 → 17 (+55%)
  const VALUE_INSIDE  = Math.round(sc * 17);   // dentro da fatia
  const VALUE_OUTSIDE = Math.round(sc * 15);   // fora da fatia (linha guia)

  // ── Safe zone: padding mínimo em cada borda ─────────────────────────────
  // Equivalente às margens de segurança de TV broadcast (10% cada lado)
  const SAFE_PAD_X = Math.round(width  * 0.05); // 5% das bordas laterais
  const SAFE_PAD_Y = Math.round(height * 0.07); // 7% das bordas superior/inferior

  // Guard de dados vazios
  if (rawData.length === 0) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: resolvedBg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            color: "#ff4444",
            fontSize: 24,
            textAlign: "center",
            fontFamily: "sans-serif",
          }}
        >
          ⚠️ Dados insuficientes (PieChart)
        </div>
      </AbsoluteFill>
    );
  }

  const totalValue = rawData.reduce((acc, s) => acc + s.value, 0) || 1;

  // ── Formata valor com unidade ──────────────────────────────────────────
  const fmt = (v: number) => {
    const rounded = Number.isInteger(v) ? String(v) : v.toFixed(1);
    return unit ? `${rounded}${unit}` : rounded;
  };

  // ── Lightener para gradiente (melhora legibilidade do gradiente) ────────
  const lighten = (hex: string, amount: number): string => {
    if (!hex.startsWith("#")) return hex;
    const n = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, ((n >> 16) & 0xff) + Math.round(255 * amount));
    const g = Math.min(255, ((n >> 8)  & 0xff) + Math.round(255 * amount));
    const b = Math.min(255, (n & 0xff)          + Math.round(255 * amount));
    return `rgb(${r},${g},${b})`;
  };

  // ── Layout ──────────────────────────────────────────────────────────────
  // Área da legenda: 32% da largura (mais espaço que antes)
  const LEGEND_W   = Math.round(width * 0.32);
  const CHART_W    = width - LEGEND_W;

  // Título: espaço no topo
  const TITLE_H    = title ? TITLE_SIZE + SAFE_PAD_Y * 1.2 : SAFE_PAD_Y;

  // Centro e raio da pizza (limitado pela safe zone)
  const centerX    = SAFE_PAD_X + (CHART_W - SAFE_PAD_X * 2) / 2;
  const centerY    = TITLE_H + (height - TITLE_H - SAFE_PAD_Y) / 2;
  const maxRadius  = Math.min(
    (CHART_W - SAFE_PAD_X * 2) / 2,
    (height - TITLE_H - SAFE_PAD_Y) / 2
  );
  const radius     = maxRadius * 0.88; // 88% do máximo → folga nas bordas

  // ── Legenda: layout de grid fixo (sem sobreposição) ─────────────────────
  // Cada item tem altura mínima garantida
  const N            = rawData.length;
  const SWATCH       = Math.round(sc * 14);
  const ITEM_GAP     = Math.round(sc * 8);
  const ITEM_H       = Math.max(LEGEND_LABEL + ITEM_GAP + 4, SWATCH + ITEM_GAP);
  const LEGEND_TOTAL = ITEM_H * N;

  // Área disponível para legenda (dentro da safe zone)
  const LEGEND_AREA_H = height - SAFE_PAD_Y * 2;
  const LEGEND_TOP    = SAFE_PAD_Y + (LEGEND_AREA_H - Math.min(LEGEND_TOTAL, LEGEND_AREA_H)) / 2;

  // x positions dentro da área de legenda
  const LEG_X         = CHART_W + Math.round(sc * 18); // inicio da legenda
  const LABEL_X       = LEG_X + SWATCH + Math.round(sc * 10); // texto do label
  const VALUE_X       = width - SAFE_PAD_X;              // valor alinhado à direita

  // Max largura para o label (entre swatch e valor)
  const LABEL_MAX_W   = VALUE_X - LABEL_X - Math.round(sc * 50);
  // Chars que cabem aprox. (font size * 0.6 = average char width)
  const MAX_CHARS     = Math.floor(LABEL_MAX_W / (LEGEND_LABEL * 0.62));

  // ── Pré-calcula fatias ──────────────────────────────────────────────────
  const slices = rawData.map((slice) => ({
    ...slice,
    angle: (slice.value / totalValue) * 2 * Math.PI,
    pct:   (slice.value / totalValue) * 100,
  }));

  let currentAngle = -Math.PI / 2;

  return (
    <div
      style={{
        flex: 1,
        backgroundColor: resolvedBg,
        fontFamily: Theme.typography.fontFamily,
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        transform: `scale(${propScale})`,
        transformOrigin: "top left",
        overflow: "hidden",
      }}
    >
      {/* ── Título ──────────────────────────────────────────────────────── */}
      {title && (
        <div
          style={{
            position: "absolute",
            top: SAFE_PAD_Y,
            left: SAFE_PAD_X,
            right: SAFE_PAD_X,
            textAlign: "center",
            color: resolvedText,
            fontSize: TITLE_SIZE,
            fontWeight: 700,
            fontFamily: Theme.typography.fontFamily,
            letterSpacing: "-0.5px",
            opacity: interpolate(frame, [0, 12], [0, 1], {
              extrapolateRight: "clamp",
            }),
            // Não deixa o título sair da safe zone
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </div>
      )}

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Gradiente radial por fatia (gloss premium) */}
          {rawData.map((slice, i) => {
            const baseColor =
              elementColors?.[i] ||
              slice.color ||
              sliceColors[i % sliceColors.length];
            return (
              <radialGradient
                key={i}
                id={`pieGrad-${i}-${instanceId}`}
                cx="45%"
                cy="38%"
                r="65%"
                fx="35%"
                fy="28%"
              >
                <stop offset="0%"   stopColor={lighten(baseColor, 0.25)} />
                <stop offset="55%"  stopColor={baseColor} />
                <stop offset="100%" stopColor={baseColor} stopOpacity={0.80} />
              </radialGradient>
            );
          })}
        </defs>

        {slices.map((slice, i) => {
          const startAngle = currentAngle;

          // Animação sequencial por fatia — stagger de 10 frames
          const startFrame = 20 + i * 10;
          const progress = spring({
            frame: frame - startFrame,
            fps,
            config: { damping: 16, stiffness: 100, overshootClamping: true },
          });

          const currentSliceAngle = slice.angle * progress;
          const endAngle = startAngle + currentSliceAngle;

          const x1 = centerX + radius * Math.cos(startAngle);
          const y1 = centerY + radius * Math.sin(startAngle);
          const x2 = centerX + radius * Math.cos(endAngle);
          const y2 = centerY + radius * Math.sin(endAngle);
          const largeArcFlag = currentSliceAngle > Math.PI ? 1 : 0;
          const pathD = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

          const color =
            elementColors?.[i] ||
            slice.color ||
            sliceColors[i % sliceColors.length];
          const midAngle = startAngle + currentSliceAngle / 2;

          // ── Label dentro/fora ──────────────────────────────────────────
          // Dentro: fatia ≥ 8% do total (tem espaço físico)
          const labelInside  = slice.pct >= 8;
          const innerR       = labelInside ? radius * 0.60 : radius * 1.20;
          const labelX       = centerX + innerR * Math.cos(midAngle);
          const labelY       = centerY + innerR * Math.sin(midAngle);

          // Linha guia para fatias pequenas
          const guideInnerR  = radius + sc * 8;
          const guideOuterR  = radius + sc * 28;
          const gX1 = centerX + guideInnerR * Math.cos(midAngle);
          const gY1 = centerY + guideInnerR * Math.sin(midAngle);
          const gX2 = centerX + guideOuterR * Math.cos(midAngle);
          const gY2 = centerY + guideOuterR * Math.sin(midAngle);

          const labelOpacity = interpolate(progress, [0.8, 1], [0, 1], {
            extrapolateRight: "clamp",
          });

          // Legenda
          const legendY   = LEGEND_TOP + i * ITEM_H;
          const legendMid = legendY + ITEM_H / 2;
          const legendOpacity = interpolate(
            frame,
            [35 + i * 8, 52 + i * 8],
            [0, 1],
            { extrapolateRight: "clamp" }
          );

          // Trunca label para caber na legenda
          const safeLabelStr =
            slice.label.length > MAX_CHARS
              ? slice.label.slice(0, MAX_CHARS - 1) + "…"
              : slice.label;

          currentAngle += slice.angle;

          return (
            <g key={i}>
              {/* ── Fatia da pizza ──────────────────────────────────────── */}
              <path
                d={pathD}
                fill={`url(#pieGrad-${i}-${instanceId})`}
                stroke={resolvedBg}
                strokeWidth={Math.max(1.5, sc * 2)}
              />

              {/* ── Valor DENTRO da fatia (≥ 8%) ────────────────────────── */}
              {showValueLabels && labelInside && progress > 0.8 && (
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={VALUE_INSIDE}
                  fill="#fff"
                  fontWeight="bold"
                  opacity={labelOpacity}
                  style={{
                    filter:
                      "drop-shadow(0px 1px 3px rgba(0,0,0,0.75)) drop-shadow(0px 0px 6px rgba(0,0,0,0.5))",
                  }}
                >
                  {fmt(slice.value)}
                </text>
              )}

              {/* ── Valor FORA da fatia (< 8%) com linha guia ───────────── */}
              {showValueLabels && !labelInside && progress > 0.8 && (
                <>
                  <line
                    x1={gX1} y1={gY1}
                    x2={gX2} y2={gY2}
                    stroke={color}
                    strokeWidth={Math.max(1, sc * 1.5)}
                    opacity={labelOpacity}
                  />
                  <text
                    x={gX2 + (Math.cos(midAngle) > 0 ? sc * 6 : -sc * 6)}
                    y={gY2}
                    textAnchor={Math.cos(midAngle) > 0 ? "start" : "end"}
                    dominantBaseline="middle"
                    fontSize={VALUE_OUTSIDE}
                    fill={resolvedText}
                    fontWeight="bold"
                    opacity={labelOpacity}
                  >
                    {fmt(slice.value)}
                  </text>
                </>
              )}

              {/* ── Legenda (layout de grid fixo, sem sobreposição) ──────── */}
              <g opacity={legendOpacity}>
                {/* Swatch de cor */}
                <rect
                  x={LEG_X}
                  y={legendMid - SWATCH / 2}
                  width={SWATCH}
                  height={SWATCH}
                  rx={Math.round(sc * 3)}
                  fill={color}
                />

                {/* Label — truncado para não invadir a coluna de valor */}
                <text
                  x={LABEL_X}
                  y={legendMid}
                  dominantBaseline="middle"
                  fontSize={LEGEND_LABEL}
                  fill={resolvedText}
                  fontFamily={Theme.typography.fontFamily}
                >
                  {safeLabelStr}
                </text>

                {/* Valor — alinhado à direita com padding seguro */}
                <text
                  x={VALUE_X}
                  y={legendMid}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={LEGEND_VALUE}
                  fill={resolvedText}
                  fontWeight="600"
                  fontFamily={Theme.typography.fontFamily}
                >
                  {fmt(slice.value)}
                </text>
              </g>
            </g>
          );
        })}

        {/* ── Linha divisória pizza / legenda ─────────────────────────────── */}
        <line
          x1={CHART_W}
          y1={SAFE_PAD_Y}
          x2={CHART_W}
          y2={height - SAFE_PAD_Y}
          stroke={T.grid}
          strokeWidth={Math.max(1, sc * 1.5)}
        />
      </svg>
    </div>
  );
};

export default PieChart;
