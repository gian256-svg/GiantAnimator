import React from "react";
import { useCurrentFrame, useVideoConfig, Easing } from "remotion";

export interface ZoomPoint {
  x: number; // normalized 0–1
  y: number; // normalized 0–1
}

interface Props {
  zoomPoints?: ZoomPoint[];
  children: React.ReactNode;
}

const ZOOM_SCALE = 2.5;
const ZOOM_START = 120;   // frame 4s @ 30fps
const ZOOM_IN   = 50;     // ~1.67s smooth ease-in
const DWELL     = 60;     // 2s per point
const PAN       = 50;     // ~1.67s smooth camera pan between points
const ZOOM_OUT  = 70;     // ~2.33s slow reveal back to full chart

function easeInOut(t: number): number {
  return Easing.inOut(Easing.ease)(Math.max(0, Math.min(1, t)));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

interface Transform {
  tx: number;
  ty: number;
  scale: number;
}

function computeTarget(p: ZoomPoint, W: number, H: number): Transform {
  return {
    tx: W / 2 - p.x * W * ZOOM_SCALE,
    ty: H / 2 - p.y * H * ZOOM_SCALE,
    scale: ZOOM_SCALE,
  };
}

function getTransform(frame: number, points: ZoomPoint[], W: number, H: number): Transform {
  const N = points.length;

  if (frame < ZOOM_START) return { tx: 0, ty: 0, scale: 1 };

  let cursor = ZOOM_START;
  const p0 = computeTarget(points[0], W, H);

  // Zoom-in to first point
  if (frame < cursor + ZOOM_IN) {
    const t = easeInOut((frame - cursor) / ZOOM_IN);
    return { tx: lerp(0, p0.tx, t), ty: lerp(0, p0.ty, t), scale: lerp(1, ZOOM_SCALE, t) };
  }
  cursor += ZOOM_IN;

  let prev = p0;

  for (let i = 0; i < N; i++) {
    const curr = computeTarget(points[i], W, H);

    if (i > 0) {
      // Pan from prev to curr
      if (frame < cursor + PAN) {
        const t = easeInOut((frame - cursor) / PAN);
        return { tx: lerp(prev.tx, curr.tx, t), ty: lerp(prev.ty, curr.ty, t), scale: ZOOM_SCALE };
      }
      cursor += PAN;
    }

    // Dwell at curr
    if (frame < cursor + DWELL) {
      return { tx: curr.tx, ty: curr.ty, scale: ZOOM_SCALE };
    }
    cursor += DWELL;
    prev = curr;
  }

  // Zoom-out from last point back to full view
  const last = computeTarget(points[N - 1], W, H);
  if (frame < cursor + ZOOM_OUT) {
    const t = easeInOut((frame - cursor) / ZOOM_OUT);
    return { tx: lerp(last.tx, 0, t), ty: lerp(last.ty, 0, t), scale: lerp(ZOOM_SCALE, 1, t) };
  }

  return { tx: 0, ty: 0, scale: 1 };
}

export const ZoomWrapper: React.FC<Props> = ({ zoomPoints, children }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  if (!zoomPoints || zoomPoints.length === 0) {
    return <>{children}</>;
  }

  const { tx, ty, scale } = getTransform(frame, zoomPoints, width, height);

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
