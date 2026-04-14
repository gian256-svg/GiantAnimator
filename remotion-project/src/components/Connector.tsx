import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

export const Connector: React.FC<{ from: [number, number]; to: [number, number]; delay: number }> = ({ from, to, delay }) => {
  const frame = useCurrentFrame();
  const T = resolveTheme(theme ?? 'dark');

  const progress = interpolate(Math.max(0, frame - delay), [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  const x1 = from[0];
  const y1 = from[1];
  const x2 = to[0];
  const y2 = to[1];

  const dx = x2 - x1;
  const dy = y2 - y1;

  // We slightly shorten the stroke so it starts/ends outside the colored blocks
  // Default block size is 320x320. Half is 160. Arrow padding = 20 -> 180.
  let sStart = 200;
  if (from[0] === 1920 && from[1] === 1080) {
     sStart = Math.abs(dx) > Math.abs(dy) ? 380 : 230;
  }
  
  let sEnd = 240; // Needs more padding for the arrowhead to not plunge inside the target
  if (to[0] === 1920 && to[1] === 1080) {
     sEnd = Math.abs(dx) > Math.abs(dy) ? 390 : 250;
  }

  const length = Math.sqrt(dx * dx + dy * dy);
  
  // If the nodes overlap or are too close, safety check
  if (length <= sStart + sEnd) return null;

  const startP = sStart / length;
  const endP = 1 - (sEnd / length);

  const effX1 = x1 + dx * startP;
  const effY1 = y1 + dy * startP;
  const effX2 = x1 + dx * endP;
  const effY2 = y1 + dy * endP;

  const currentX2 = effX1 + (effX2 - effX1) * progress;
  const currentY2 = effY1 + (effY2 - effY1) * progress;

  return (
    <line
      x1={effX1}
      y1={effY1}
      x2={currentX2}
      y2={currentY2}
      stroke="#000000"
      strokeWidth={6}
      strokeDasharray="20, 20"
      opacity={progress > 0 ? 0.4 : 0}
      markerEnd="url(#arrowhead)"
      strokeLinecap="round"
    />
  );
};
