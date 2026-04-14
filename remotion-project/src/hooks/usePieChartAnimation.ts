import { useMemo } from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";

export interface PieChartAnimationState {
  /** 0 to 1 progress for each slice arc drawing */
  sliceProgress: number[];
  /** 0 to 1 progress for each callout line drawing (dashoffset) */
  calloutProgress: number[];
  /** 0 to 1 opacity for each label fade-in */
  labelOpacity: number[];
}

interface UsePieChartAnimationOptions {
  sliceCount: number;
  /** Frame when the animation starts (default: 10) */
  startFrame?: number;
  /** Duration of one slice formation (default: 30 frames) */
  sliceDuration?: number;
  /** Stagger between slices starting (default: 8 frames) */
  sliceStagger?: number;
  /** Delay after slice finishes before callout starts (default: 5 frames) */
  calloutDelay?: number;
  /** Duration of callout line drawing (default: 15 frames) */
  calloutDuration?: number;
}

/**
 * Hook to manage high-fidelity sequential animation for Pie Charts.
 * Timeline: Slice Arcs (Staggered) -> Callout Lines (Staggered) -> Labels (Fade-in)
 * v4.3 — Gold Standard Animation
 */
export function usePieChartAnimation({
  sliceCount,
  startFrame = 10,
  sliceDuration = 40, // ~1.3s total for formation
  sliceStagger = 10,
  calloutDelay = 5,
  calloutDuration = 20,
}: UsePieChartAnimationOptions): PieChartAnimationState {
  const frame = useCurrentFrame();
  const T = resolveTheme(theme ?? 'dark');

  return useMemo(() => {
    const BEZIER = Easing.bezier(0.25, 0.1, 0.25, 1.0);

    // ── 1. Slice Arcs ────────────────────────────────────────────────────────
    const sliceProgress = Array.from({ length: sliceCount }, (_, i) => {
      const start = startFrame + i * sliceStagger;
      const end = start + sliceDuration;
      return interpolate(frame, [start, end], [0, 1], {
        extrapolateRight: "clamp",
        easing: BEZIER,
      });
    });

    // ── 2. Callout Lines ─────────────────────────────────────────────────────
    // Lines start drawing after their respective slice finishes
    const calloutProgress = Array.from({ length: sliceCount }, (_, i) => {
      const sliceEnd = startFrame + i * sliceStagger + sliceDuration;
      const start = sliceEnd + calloutDelay;
      const end = start + calloutDuration;
      return interpolate(frame, [start, end], [0, 1], {
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      });
    });

    // ── 3. Label Opacity ─────────────────────────────────────────────────────
    // Labels fade in after their respective callout finishes (or slice finishes for internal)
    const labelOpacity = Array.from({ length: sliceCount }, (_, i) => {
      const calloutEnd = startFrame + i * sliceStagger + sliceDuration + calloutDelay + calloutDuration;
      const start = calloutEnd;
      const end = start + 10; // Quicker fade-in
      return interpolate(frame, [start, end], [0, 1], {
        extrapolateRight: "clamp",
      });
    });

    return {
      sliceProgress,
      calloutProgress,
      labelOpacity,
    };
  }, [frame, sliceCount, startFrame, sliceDuration, sliceStagger, calloutDelay, calloutDuration]);
}
