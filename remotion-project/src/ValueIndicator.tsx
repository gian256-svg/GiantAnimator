import React from 'react';

export type ValueIndicatorProps = {
  x: number;
  y: number;
  value: number;
  date: string;
  lineColor: string;
  glowIntensity: number;
  showValueLabel: boolean;
};

export const ValueIndicator: React.FC<ValueIndicatorProps> = ({
  x,
  y,
  value,
  date,
  lineColor,
  glowIntensity,
  showValueLabel,
}) => {
  const T = resolveTheme(theme ?? 'dark');
  return (
    <>
      <div
        style={{
          position: 'absolute',
          top: y - 16,
          left: x - 16,
          width: 32,
          height: 32,
          backgroundColor: lineColor,
          borderRadius: '50%',
          boxShadow: `0 0 ${20 * glowIntensity}px ${lineColor}`,
        }}
      />
      {showValueLabel && (
        <div
          style={{
            position: 'absolute',
            top: y - 120,
            left: Math.max(x - 200, 20),
            color: 'white',
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: '16px 32px',
            borderRadius: '16px',
            border: `2px solid ${lineColor}`,
            fontFamily: 'sans-serif',
            fontSize: '56px',
            fontWeight: 'bold',
            boxShadow: `0 8px 24px rgba(0,0,0,0.6)`,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: '32px', color: '#aaaaaa', marginRight: 16 }}>{date}</span>
          ${value.toFixed(2)}
        </div>
      )}
    </>
  );
};
