import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, Easing } from "remotion";

export interface ZoomPoint {
  x: number; // normalized 0–1
  y: number; // normalized 0–1
}

interface Segment {
  start: number; end: number;
  fromTx: number; fromTy: number; fromScale: number;
  toTx:   number; toTy:   number; toScale:   number;
}

interface Props {
  zoomPoints?:      ZoomPoint[];
  zoomStartFrame?:  number;
  durationInFrames?: number;
  children:         React.ReactNode;
}

const ZOOM_SCALE = 2.5;
const DEFAULT_ZOOM_START = 120; // 4s fallback
const ZOOM_IN  = 50;  // ~1.67s
const DWELL    = 60;  // 2s per point
const PAN      = 50;  // ~1.67s between points
const ZOOM_OUT = 70;  // ~2.33s reveal

const ease = (t: number) =>
  Easing.inOut(Easing.ease)(Math.max(0, Math.min(1, t)));

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function target(p: ZoomPoint, W: number, H: number) {
  return { tx: W / 2 - p.x * W * ZOOM_SCALE, ty: H / 2 - p.y * H * ZOOM_SCALE };
}

function buildSegments(
  points: ZoomPoint[],
  W: number,
  H: number,
  zoomStart: number,
  durationInFrames: number,
): Segment[] {
  const segs: Segment[] = [];

  // Budget: reserve ZOOM_IN + ZOOM_OUT + 30 frames (1s hold) at the end
  const budget = durationInFrames - 1 - zoomStart - ZOOM_IN - ZOOM_OUT - 30;
  const nDwells = points.length;
  const nPans = points.length - 1;
  const rawBudget = nDwells * DWELL + nPans * PAN;
  const scaleFactor = budget > 0 && rawBudget > budget ? budget / rawBudget : 1;
  const effectiveDwell = Math.max(10, Math.round(DWELL * scaleFactor));
  const effectivePan   = Math.max(10, Math.round(PAN   * scaleFactor));

  let cursor = zoomStart;
  const p0 = target(points[0], W, H);

  segs.push({ start: cursor, end: cursor + ZOOM_IN, fromTx: 0, fromTy: 0, fromScale: 1, toTx: p0.tx, toTy: p0.ty, toScale: ZOOM_SCALE });
  cursor += ZOOM_IN;

  let prevTx = p0.tx, prevTy = p0.ty;

  for (let i = 0; i < points.length; i++) {
    const curr = target(points[i], W, H);

    if (i > 0) {
      segs.push({ start: cursor, end: cursor + effectivePan, fromTx: prevTx, fromTy: prevTy, fromScale: ZOOM_SCALE, toTx: curr.tx, toTy: curr.ty, toScale: ZOOM_SCALE });
      cursor += effectivePan;
    }

    segs.push({ start: cursor, end: cursor + effectiveDwell, fromTx: curr.tx, fromTy: curr.ty, fromScale: ZOOM_SCALE, toTx: curr.tx, toTy: curr.ty, toScale: ZOOM_SCALE });
    cursor += effectiveDwell;
    prevTx = curr.tx;
    prevTy = curr.ty;
  }

  // zoom out — always ends at least 30 frames before the video ends
  const last = target(points[points.length - 1], W, H);
  const zoomOutEnd = Math.min(cursor + ZOOM_OUT, durationInFrames - 1 - 30);
  segs.push({ start: cursor, end: zoomOutEnd, fromTx: last.tx, fromTy: last.ty, fromScale: ZOOM_SCALE, toTx: 0, toTy: 0, toScale: 1 });

  return segs;
}

export const ZoomWrapper: React.FC<Props> = ({ zoomPoints, zoomStartFrame, children }) => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  // Pre-compute once — never recalculated during playback
  const segments = useMemo<Segment[] | null>(() => {
    if (!zoomPoints || zoomPoints.length === 0) return null;
    return buildSegments(zoomPoints, width, height, zoomStartFrame ?? DEFAULT_ZOOM_START, durationInFrames);
  }, [zoomPoints, width, height, zoomStartFrame, durationInFrames]);

  if (!segments) return <>{children}</>;

  const zoomStart = zoomStartFrame ?? DEFAULT_ZOOM_START;

  let tx = 0, ty = 0, scale = 1;

  if (frame >= zoomStart) {
    const lastSeg = segments[segments.length - 1];

    // After zoom-out ends, lock to identity — chart stays fully visible
    if (frame > lastSeg.end) {
      tx = 0; ty = 0; scale = 1;
    } else {
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const isLast = i === segments.length - 1;

        if (frame <= seg.end || isLast) {
          const rawT = seg.end === seg.start ? 1 : (frame - seg.start) / (seg.end - seg.start);
          const t = ease(rawT);
          tx    = lerp(seg.fromTx,    seg.toTx,    t);
          ty    = lerp(seg.fromTy,    seg.toTy,    t);
          scale = lerp(seg.fromScale, seg.toScale,  t);
          break;
        }
      }
    }
  }

  return (
    <div style={{ width, height, overflow: "hidden", position: "relative" }}>
      <div
        style={{
          width,
          height,
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          transformOrigin: "0 0",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
};
