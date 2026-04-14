import React from 'react';

export type LinePathProps = {
  data: { date: string; value: number }[];
  points: { x: number; y: number }[];
  lineColor: string;
  lineThickness: number;
  glowIntensity: number;
  enableGlow: boolean;
};

export const LinePath: React.FC<LinePathProps> = ({
  points,
  lineColor,
  lineThickness,
  glowIntensity,
  enableGlow,
}) => {
  const T = resolveTheme(theme ?? 'dark');
  if (points.length === 0) return null;

  // Generate SVG path string
  const pathData = points.reduce((acc, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    return `${acc} L ${point.x} ${point.y}`;
  }, '');

  return (
    <svg
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'visible',
      }}
    >
      {/* Glow layer */}
      {enableGlow && (
        <path
          d={pathData}
          fill="none"
          stroke={lineColor}
          strokeWidth={lineThickness * glowIntensity}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.3, filter: `blur(${glowIntensity * 2}px)` }}
        />
      )}
      
      {/* Main Line */}
      <path
        d={pathData}
        fill="none"
        stroke={lineColor}
        strokeWidth={lineThickness}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
