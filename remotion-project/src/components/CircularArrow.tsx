import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export const CircularArrow: React.FC<{
  from: [number, number];
  to: [number, number];
  delay: number;
  duration?: number;
}> = ({ from, to, delay, duration = 20 }) => {
  const frame = useCurrentFrame();

  const progress = interpolate(Math.max(0, frame - delay), [0, duration], [0, 1], { extrapolateRight: 'clamp' });

  if (progress === 0) return null;

  const color = '#A0A3A7'; // matched lighter grey dashed line

  const x1 = from[0];
  const y1 = from[1];
  const x2 = to[0];
  const y2 = to[1];

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  
  // padding around nodes (node is 280x280) -> radius ~140, so 160 leaves a nice 20px gap
  const pad = 160;
  
  const p1 = pad / len;
  const p2 = 1 - (pad / len);
  
  if (p1 >= p2) return null; // too close

  const startX = x1 + dx * p1;
  const startY = y1 + dy * p1;
  const endX = x1 + dx * p2;
  const endY = y1 + dy * p2;

  // Exact length of the visible line
  const lineLen = len * (p2 - p1);

  // ID for marker must be strictly unique to avoid issues
  const arrId = `straight-arr-${from[0]}-${to[0]}`;

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 1 }}>
      <svg width="3840" height="2160">
        <defs>
          <marker id={arrId} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill={color} />
          </marker>
          <mask id={`mask-${arrId}`} maskUnits="userSpaceOnUse">
             <line
               x1={startX}
               y1={startY}
               x2={endX}
               y2={endY}
               stroke="white"
               strokeWidth={64}
               strokeDasharray={lineLen}
               strokeDashoffset={lineLen * (1 - progress)}
             />
          </mask>
        </defs>
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke={color}
          strokeWidth={8}
          strokeDasharray="24 16"
          strokeLinecap="round"
          mask={`url(#mask-${arrId})`}
          markerEnd={`url(#${arrId})`}
          opacity={0.8}
        />
      </svg>
    </div>
  );
};
