import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { Theme } from '../theme';

interface HighlightCircleProps {
  x: number;
  y: number;
  delay?: number;
  color?: string;
  size?: number;
}

export const HighlightCircle: React.FC<HighlightCircleProps> = ({
  x,
  y,
  delay = 0,
  color = '#ff4d6d', // Vermelho padrão do tema para visibilidade
  size = 80,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  
  // Fator de escala baseado em 1920p
  const fs = (base: number) => Math.round(base * (width / 1920));
  
  const animFrame = Math.max(0, frame - delay);
  
  // Animação de desenho do círculo (stroke-dashoffset)
  const progress = interpolate(
    animFrame,
    [0, 30],
    [0, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.ease),
    }
  );

  // Animação de escala (leve bounce ou surgimento)
  const scale = interpolate(
    animFrame,
    [0, 15],
    [0.8, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.back(1.5)),
    }
  );

  const opacity = interpolate(
    animFrame,
    [0, 10],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );

  const radius = fs(size);
  const circumference = 2 * Math.PI * radius;

  return (
    <AbsoluteFill style={{ overflow: 'visible', pointerEvents: 'none' }}>
      <svg
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          overflow: 'visible',
          filter: 'drop-shadow(0 0 15px rgba(255, 77, 109, 0.4))',
        }}
      >
        <circle
          cx={x}
          cy={y}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={fs(6)}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          strokeLinecap="round"
          opacity={opacity}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: `${x}px ${y}px`,
          }}
        />
        
        {/* Glow suave interno */}
        <circle
          cx={x}
          cy={y}
          r={radius}
          fill={color}
          opacity={opacity * 0.1 * progress}
        />
      </svg>
    </AbsoluteFill>
  );
};
