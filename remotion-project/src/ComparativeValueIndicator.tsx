import React from 'react';

export type ComparativeValueIndicatorProps = {
  x: number;
  y: number;
  value: number;
  label: string;
  color: string;
  glowIntensity: number;
  isNvidia?: boolean;
};

export const ComparativeValueIndicator: React.FC<ComparativeValueIndicatorProps> = ({
  x,
  y,
  value,
  label,
  color,
  glowIntensity,
  isNvidia = false,
}) => {
  const T = resolveTheme(theme ?? 'dark');
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }}>
      {/* Outer Glow */}
      <div style={{
        position: 'absolute',
        left: x - 12 - (glowIntensity * 5),
        top: y - 12 - (glowIntensity * 5),
        width: 24 + (glowIntensity * 10),
        height: 24 + (glowIntensity * 10),
        backgroundColor: color,
        borderRadius: '50%',
        opacity: 0.3,
        filter: 'blur(10px)'
      }} />
      
      {/* Inner Dot */}
      <div style={{
        position: 'absolute',
        left: x - 12,
        top: y - 12,
        width: 24,
        height: 24,
        backgroundColor: color,
        borderRadius: '50%',
        boxShadow: `0 0 ${glowIntensity * 3}px ${color}`
      }} />

      {/* Label Box */}
      <div style={{
        position: 'absolute',
        left: isNvidia ? x - 250 : x + 30, // Position on left of Nvidia and right of SP500 depending on space
                           // For now, let's just place them to the right and handle overlaps.
                           // The prompt reference places SP500 label to the right of the dot, 
                           // and Nvidia to the right but slightly offset.
        top: y - 20,
        display: 'flex',
        alignItems: 'center',
        whiteSpace: 'nowrap'
      }}>
        <div style={{
          color: color,
          fontSize: 36,
          fontWeight: 600,
          fontFamily: 'sans-serif',
          textShadow: `0 0 ${glowIntensity * 2}px rgba(0,0,0,0.8)`
        }}>
          {label} {Math.round(value)}%
        </div>
      </div>
    </div>
  );
};
