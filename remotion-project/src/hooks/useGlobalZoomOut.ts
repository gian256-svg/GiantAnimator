// ─────────────────────────────────────────
// useGlobalZoomOut.ts — Zoom desativado (Scale fixa em 1)
// ─────────────────────────────────────────

/**
 * RULE 13 — GLOBAL ZOOM OUT (v3.0) — DESATIVADO
 * Retorna scale: 1 para manter o gráfico estático em relação ao zoom.
 */
export function useGlobalZoomOut() {
  return { scale: 1 };
}
