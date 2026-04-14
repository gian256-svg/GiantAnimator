import React from 'react';
import { interpolate, interpolateColors, useCurrentFrame } from 'remotion';

export type ComparativeLinePathProps = {
  data: { date: string; sp500: number; nvidia: number }[];
  pointsSP500: { x: number; y: number }[];
  pointsNVIDIA: { x: number; y: number }[];
  colorSP500: string;
  colorNVIDIA: string;
  lineThickness: number;
  glowIntensity: number;
};

export const ComparativeLinePath: React.FC<ComparativeLinePathProps> = ({
  theme = 'dark',
  data,
  pointsSP500,
  pointsNVIDIA,
  colorSP500,
  colorNVIDIA,
  lineThickness,
  glowIntensity,
}) => {
  const T = resolveTheme(theme ?? 'dark');
  const renderPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    const d = [`M ${points[0].x} ${points[0].y}`];
    for (let i = 1; i < points.length; i++) {
        d.push(`L ${points[i].x} ${points[i].y}`);
    }
    return d.join(' ');
  };

  const pathSP500 = renderPath(pointsSP500);
  const pathNVIDIA = renderPath(pointsNVIDIA);

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 10 }}>
      {/* Glow layers */}
      <svg width="100%" height="100%" style={{ position: 'absolute' }}>
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={glowIntensity * 5} result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <path
          d={pathSP500}
          fill="none"
          stroke={colorSP500}
          strokeWidth={lineThickness}
          strokeLinejoin="round"
          strokeLinecap="round"
          filter="url(#glow)"
        />

        <path
          d={pathNVIDIA}
          fill="none"
          stroke={colorNVIDIA}
          strokeWidth={lineThickness}
          strokeLinejoin="round"
          strokeLinecap="round"
          filter="url(#glow)"
        />
      </svg>
    </div>
  );
};
