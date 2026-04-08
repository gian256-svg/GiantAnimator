import { useMemo } from "react";

export interface PieSliceData {
  label: string;
  value: number;
  color: string;
}

export interface PieLabel {
  slice: PieSliceData;
  percentage: number;
  midAngle: number;
  cx: number;
  cy: number;
  isInternal: boolean;
  x: number;
  y: number;
  lineStart?: { x: number; y: number };
  lineElbow?: { x: number; y: number };
  lineEnd?:   { x: number; y: number };
  textAnchor?: "start" | "middle" | "end";
  clamped?: boolean;
}

export interface UsePieChartLabelsResult {
  labels: PieLabel[];
  finalRadius: number;      // raio final usado (pode ter sido reduzido)
  radiusReduced: boolean;   // indica se houve redução automática
  reductionSteps: number;   // quantas vezes o raio foi reduzido
}

interface UsePieChartLabelsOptions {
  slices: PieSliceData[];
  cx: number;
  cy: number;
  radius: number;           // raio inicial sugerido
  internalThreshold?: number;
  fontSize: number;
  safeMinX: number;
  safeMaxX: number;
  safeMinY: number;
  safeMaxY: number;
  // ── Configurações de auto-redução ──
  maxClampedLabels?: number;  // máximo de labels clamped tolerados (default: 1)
  radiusStepDown?: number;    // fator de redução por iteração (default: 0.05 = 5%)
  maxReductions?: number;     // limite de tentativas (default: 8)
}

const LABEL_PADDING  = 6;
const CALLOUT_OFFSET = 28;
const ELBOW_LENGTH   = 12;

/**
 * Função pura que calcula o posicionamento de labels para um dado raio fixo.
 */
function computeLabels(
  slices: PieSliceData[],
  cx: number,
  cy: number,
  radius: number,
  internalThreshold: number,
  fontSize: number,
  safeMinX: number,
  safeMaxX: number,
  safeMinY: number,
  safeMaxY: number,
): PieLabel[] {
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  const clampLabel = (label: PieLabel): PieLabel => {
    const halfLine = fontSize * 0.5;
    const textW    = Math.min(label.slice.label.length + 6, 20) * fontSize * 0.55;

    let newX    = label.x;
    let newY    = label.y;
    let clamped = false;

    if (newY - halfLine < safeMinY) { newY = safeMinY + halfLine; clamped = true; }
    if (newY + halfLine > safeMaxY) { newY = safeMaxY - halfLine; clamped = true; }

    if (label.textAnchor === "start") {
      if (newX + textW > safeMaxX) { newX = safeMaxX - textW; clamped = true; }
      if (newX         < safeMinX) { newX = safeMinX;         clamped = true; }
    } else if (label.textAnchor === "end") {
      if (newX - textW < safeMinX) { newX = safeMinX + textW; clamped = true; }
      if (newX         > safeMaxX) { newX = safeMaxX;         clamped = true; }
    } else {
      if (newX - textW / 2 < safeMinX) { newX = safeMinX + textW / 2; clamped = true; }
      if (newX + textW / 2 > safeMaxX) { newX = safeMaxX - textW / 2; clamped = true; }
    }

    return clamped
      ? { ...label, x: newX, y: newY, clamped: true,
          lineEnd: label.lineEnd ? { x: newX, y: newY } : undefined }
      : label;
  };

  const resolveCollisions = (group: PieLabel[]) => {
    group.sort((a, b) => a.y - b.y);
    const lineHeight = fontSize * 1.5 + LABEL_PADDING;

    for (let i = 1; i < group.length; i++) {
        const prev = group[i - 1];
        const curr = group[i];
        const overlap = prev.y + lineHeight - curr.y;
        if (overlap > 0) {
          curr.y += overlap;
          if (curr.lineEnd) curr.lineEnd = { x: curr.x, y: curr.y };
        }
    }
    for (let i = group.length - 2; i >= 0; i--) {
        const curr = group[i];
        const next = group[i + 1];
        const overlap = curr.y + lineHeight - next.y;
        if (overlap > 0) {
          curr.y -= overlap / 2;
          next.y += overlap / 2;
          if (curr.lineEnd) curr.lineEnd = { x: curr.x, y: curr.y };
          if (next.lineEnd) next.lineEnd = { x: next.x, y: next.y };
        }
    }
  };

  let currentAngle = -Math.PI / 2;

  const labels: PieLabel[] = slices.map((slice) => {
    const percentage = (slice.value / total) * 100;
    const sliceAngle = (slice.value / total) * 2 * Math.PI;
    const midAngle   = currentAngle + sliceAngle / 2;
    currentAngle    += sliceAngle;

    const isInternal = percentage >= internalThreshold;
    const r = isInternal ? radius * 0.65 : radius + CALLOUT_OFFSET;

    const x = cx + Math.cos(midAngle) * r;
    const y = cy + Math.sin(midAngle) * r;

    const lineStart = isInternal ? undefined : {
      x: cx + Math.cos(midAngle) * (radius * 0.98),
      y: cy + Math.sin(midAngle) * (radius * 0.98),
    };
    const lineElbow = isInternal ? undefined : {
      x: cx + Math.cos(midAngle) * (radius + CALLOUT_OFFSET - ELBOW_LENGTH),
      y: cy + Math.sin(midAngle) * (radius + CALLOUT_OFFSET - ELBOW_LENGTH),
    };

    const textAnchor = isInternal
      ? "middle"
      : Math.cos(midAngle) >= 0 ? "start" : "end";

    return {
      slice, percentage, midAngle, cx, cy, isInternal,
      x, y,
      lineStart,
      lineElbow,
      lineEnd: isInternal ? undefined : { x, y },
      textAnchor,
    };
  });

  const leftSide  = labels.filter((l) => !l.isInternal && Math.cos(l.midAngle) <  0);
  const rightSide = labels.filter((l) => !l.isInternal && Math.cos(l.midAngle) >= 0);
  resolveCollisions(leftSide);
  resolveCollisions(rightSide);

  const internal = labels.filter((l) => l.isInternal);
  for (let i = 0; i < internal.length; i++) {
    for (let j = i + 1; j < internal.length; j++) {
      const a = internal[i], b = internal[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = fontSize * 2.8 + LABEL_PADDING;
      if (dist < minDist && dist > 0) {
        const push = (minDist - dist) / 2;
        a.x -= (dx / dist) * push; a.y -= (dy / dist) * push;
        b.x += (dx / dist) * push; b.y += (dy / dist) * push;
      }
    }
  }

  return labels.map((l) => clampLabel(l));
}

/**
 * Hook v4.2 — Posicionamento de labels com REDUÇÃO AUTOMÁTICA DE RAIO.
 * Se muitos labels encostarem na borda (clamped), o raio do gráfico é reduzido e tudo é recalculado.
 */
export function usePieChartLabels({
  slices,
  cx,
  cy,
  radius,
  internalThreshold = 8,
  fontSize,
  safeMinX,
  safeMaxX,
  safeMinY,
  safeMaxY,
  maxClampedLabels = 1,
  radiusStepDown   = 0.05,
  maxReductions    = 8,
}: UsePieChartLabelsOptions): UsePieChartLabelsResult {
  return useMemo(() => {
    let currentRadius  = radius;
    let reductionSteps = 0;
    let labels: PieLabel[] = [];

    for (let attempt = 0; attempt <= maxReductions; attempt++) {
      labels = computeLabels(
        slices, cx, cy, currentRadius,
        internalThreshold, fontSize,
        safeMinX, safeMaxX, safeMinY, safeMaxY,
      );

      const clampedCount = labels.filter((l) => l.clamped).length;

      // Se o número de labels prensados for aceitável, paramos
      if (clampedCount <= maxClampedLabels) break;

      // Se ainda temos muito aperto, reduzimos o raio e tentamos de novo
      if (attempt < maxReductions) {
        currentRadius = currentRadius * (1 - radiusStepDown);
        reductionSteps++;
      }
    }

    return {
      labels,
      finalRadius:    currentRadius,
      radiusReduced:  reductionSteps > 0,
      reductionSteps,
    };
  }, [
    slices, cx, cy, radius, internalThreshold, fontSize,
    safeMinX, safeMaxX, safeMinY, safeMaxY,
    maxClampedLabels, radiusStepDown, maxReductions,
  ]);
}
