import React, { useId } from "react";
import {
  spring,
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  interpolate
} from "remotion";
import { Theme, resolveTheme, getNiceScale } from '../theme';
import { DynamicBackground } from "../layout/DynamicBackground";

export interface GroupedBarSeries {
  name: string;
  values: number[];
  color?: string;
}

export interface GroupedBarChartProps {
  categories: string[];
  series: GroupedBarSeries[];
  title: string;
  subtitle?: string;
  yLabel?: string;
  showLegend?: boolean;
  showValues?: boolean;
  highlightGroup?: number;
  backgroundColor?: string;
  theme?: string;
  colors?: string[];
  seriesColors?: string[];
  textColor?: string;
  bgStyle?: 'none' | 'mesh' | 'grid';
}

// Quebra texto longo em linhas respeitando maxChars por linha
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export const GroupedBarChart: React.FC<GroupedBarChartProps> = ({
  categories = [],
  series = [],
  title,
  subtitle,
  yLabel,
  showLegend = true,
  showValues = true,
  highlightGroup,
  backgroundColor,
  theme = 'dark',
  colors,
  seriesColors,
  bgStyle = 'none',
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const T = resolveTheme(theme ?? 'dark', backgroundColor, undefined, seriesColors || colors);
  const instanceId = useId().replace(/:/g, "");

  // ── Layout base ─────────────────────────────────────────────
  const margin      = Theme.spacing.padding   || 128;
  const titleHeight = Theme.spacing.titleHeight || 160;

  // ── Legenda: acima do gráfico, centralizada ──────────────────
  // Calcula quantas linhas cada label precisa (max ~28 chars/linha a 4K)
  const LEGEND_FONT_SIZE  = Theme.typography.axis.size || 30;
  const LEGEND_LINE_H     = LEGEND_FONT_SIZE * 1.35;
  const MAX_CHARS_PER_LINE = 28;
  const ICON_SIZE         = 36;
  const ICON_TEXT_GAP     = 16;

  // Largura disponível por item de legenda
  const plotWidth      = width - margin * 2;
  const legendItemW    = plotWidth / series.length;

  // Máximo de linhas necessárias entre todos os itens (para padronizar altura)
  const legendLinesPerItem = series.map(s => wrapText(s.name, MAX_CHARS_PER_LINE));
  const maxLegendLines     = Math.max(...legendLinesPerItem.map(l => l.length), 1);
  const legendBlockH       = ICON_SIZE + (maxLegendLines - 1) * LEGEND_LINE_H + 20; // +20 gap bottom
  const legendGapTop       = 24; // espaço entre subtitle e legenda

  // ── Dimensões do plot ────────────────────────────────────────
  const legendTop  = margin + titleHeight + legendGapTop;
  const chartTop   = legendTop + legendBlockH + 32; // 32px gap legenda→gráfico
  const plotHeight = height - chartTop - margin - 80; // 80px para labels do eixo X

  if (categories.length === 0 || series.length === 0) {
    return (
      <AbsoluteFill style={{ backgroundColor: backgroundColor ?? T.background, justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: T.text }}>Dados insuficientes.</p>
      </AbsoluteFill>
    );
  }

  const maxValueRaw = Math.max(...series.flatMap(s => s.values), 1);
  const dataMinRaw  = Math.min(...series.flatMap(s => s.values), 0);
  const niceScale   = getNiceScale(maxValueRaw * 1.15, dataMinRaw, 5);
  const maxValue    = niceScale[niceScale.length - 1];
  const dataMin     = niceScale[0];
  const range       = maxValue - dataMin || 0.0001;

  const groupGap     = 0.3;
  const barGap       = 0.1;
  const categoryWidth = plotWidth / categories.length;
  const groupWidth    = categoryWidth * (1 - groupGap);
  const barWidth      = groupWidth / series.length * (1 - barGap);

  const formatValue = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000)    return (num / 1000).toFixed(1) + "k";
    return num.toString();
  };

  const legendOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ fontFamily: Theme.typography.fontFamily }}>
      <DynamicBackground
        style={bgStyle}
        baseColor={backgroundColor ?? T.background}
        accentColor={T.colors[0]}
      />

      {/* Título e Subtítulo */}
      <div style={{
        position: 'absolute', top: margin, width: '100%', textAlign: 'center',
        opacity: interpolate(frame, [0, 15], [0, 1])
      }}>
        {title && <div style={{
          fontSize: Theme.typography.title.size,
          fontWeight: Theme.typography.title.weight,
          color: Theme.typography.title.color,
          fontFamily: Theme.typography.fontFamily,
          marginBottom: 10
        }}>{title}</div>}
        {subtitle && <div style={{
          fontSize: Theme.typography.subtitle.size,
          fontWeight: Theme.typography.subtitle.weight,
          color: Theme.typography.subtitle.color,
          fontFamily: Theme.typography.fontFamily
        }}>{subtitle}</div>}
      </div>

      <svg width={width} height={height} style={{ overflow: 'visible', position: 'relative', zIndex: 1 }}>
        <defs>
          {series.map((s, si) => (
            <linearGradient key={si} id={`groupGrad-${si}-${instanceId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={s.color || T.colors[si % T.colors.length]} />
              <stop offset="100%" stopColor={s.color || T.colors[si % T.colors.length]} stopOpacity={0.85} />
            </linearGradient>
          ))}
        </defs>

        {/* ── Legenda: acima do gráfico, centralizada por item ── */}
        {showLegend && (
          <g opacity={legendOpacity}>
            {series.map((s, si) => {
              const itemX    = margin + si * legendItemW;
              const centerX  = itemX + legendItemW / 2;
              const lines    = legendLinesPerItem[si];
              // Centraliza o bloco [ícone + texto] horizontalmente
              const blockW   = ICON_SIZE + ICON_TEXT_GAP + MAX_CHARS_PER_LINE * LEGEND_FONT_SIZE * 0.55;
              const startX   = centerX - blockW / 2;

              return (
                <g key={si} transform={`translate(${startX}, ${legendTop})`}>
                  {/* Quadrado colorido alinhado ao centro vertical do texto */}
                  <rect
                    x={0} y={(maxLegendLines * LEGEND_LINE_H - ICON_SIZE) / 2}
                    width={ICON_SIZE} height={ICON_SIZE}
                    fill={`url(#groupGrad-${si}-${instanceId})`} rx={5}
                  />
                  {/* Texto com wrap */}
                  <text
                    x={ICON_SIZE + ICON_TEXT_GAP}
                    style={{
                      fontSize: LEGEND_FONT_SIZE,
                      fill: T.textMuted,
                      fontWeight: 500,
                      fontFamily: Theme.typography.fontFamily,
                    }}
                  >
                    {lines.map((line, li) => (
                      <tspan key={li} x={ICON_SIZE + ICON_TEXT_GAP} dy={li === 0 ? LEGEND_FONT_SIZE : LEGEND_LINE_H}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              );
            })}
          </g>
        )}

        {/* ── Grid Y ── */}
        <g opacity={0.4}>
          {niceScale.map(val => {
            const y = chartTop + plotHeight - ((val - dataMin) / range) * plotHeight;
            return (
              <React.Fragment key={val}>
                <line x1={margin} y1={y} x2={width - margin} y2={y} stroke={T.grid} strokeWidth={1} />
                <text
                  x={margin - 20} y={y}
                  textAnchor="end" dominantBaseline="middle"
                  style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.ui?.axisText || T.textMuted, fontFamily: Theme.typography.fontFamily }}
                >{formatValue(val)}</text>
              </React.Fragment>
            );
          })}
        </g>

        {/* ── Barras agrupadas + labels do eixo X ── */}
        {categories.map((cat, ci) => {
          const groupX       = margin + ci * categoryWidth + (categoryWidth * groupGap) / 2;
          const groupProgress = spring({ frame: frame - 30 - ci * 8, fps, config: { damping: 14, stiffness: 60 } });

          return (
            <g key={ci}>
              {series.map((s, si) => {
                const x = groupX + si * (barWidth / (1 - barGap));
                const h = ((s.values[ci] - dataMin) / range) * plotHeight * groupProgress;
                const y = chartTop + plotHeight - h;
                const isGroupHighlighted = highlightGroup === ci;

                return (
                  <g key={si}>
                    <rect
                      x={x} y={y} width={barWidth} height={Math.max(h, 2)}
                      fill={`url(#groupGrad-${si}-${instanceId})`} rx={Theme.spacing.barRadius}
                      style={{ filter: isGroupHighlighted ? `brightness(${Theme.effects.highlightScale})` : 'none' }}
                    />
                    {showValues && groupProgress > 0.9 && (
                      <text
                        x={x + barWidth / 2} y={y - 15}
                        textAnchor="middle"
                        style={{ fontSize: Theme.typography.axis.size, fill: T.text, fontWeight: 700, fontFamily: Theme.typography.fontFamily }}
                      >{formatValue(s.values[ci])}</text>
                    )}
                  </g>
                );
              })}
              {/* Label eixo X — sem sobreposição garantida pelo plotHeight */}
              <text
                x={groupX + groupWidth / 2}
                y={chartTop + plotHeight + 60}
                textAnchor="middle"
                style={{ fontSize: Theme.typography.axis.size, fill: Theme.colors.ui.axisText, fontWeight: 600, fontFamily: Theme.typography.fontFamily }}
              >{cat}</text>
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
