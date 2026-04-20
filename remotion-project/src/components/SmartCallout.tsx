import React from 'react';
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { Theme, resolveTheme } from '../theme';

interface SmartCalloutProps {
  x: number;
  y: number;
  label: string;
  value?: string | number;
  theme?: string;
  delay?: number;
  color?: string;
}

export const SmartCallout: React.FC<SmartCalloutProps> = ({
  x,
  y,
  label,
  value,
  theme = 'dark',
  delay = 0,
  color
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const T = resolveTheme(theme);
  const accentColor = color || T.colors[0]; // fallback para primeira cor do tema

  // Animação inicia após o delay (geralmente Act 2 ou Act 3)
  const animFrame = Math.max(0, frame - delay);

  // Animação 1: Ponto indicador (Pulse)
  const dotScale = spring({
    frame: animFrame,
    fps,
    config: Theme.animation.springBounce,
  });

  const dotOpacity = interpolate(animFrame, [0, 5], [0, 1], { extrapolateRight: 'clamp' });

  // Animação 2: Linha guia
  const lineProgress = spring({
    frame: Math.max(0, animFrame - 10),
    fps,
    config: Theme.animation.spring,
  });

  // Animação 3: Texto Fade In
  const textOpacity = interpolate(animFrame, [20, 30], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.1, 0, 0.1, 1),
  });
  
  const textYOffset = interpolate(animFrame, [20, 30], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back()),
  });

  // Geometria da linha guia (vai para cima e direita ou esquerda)
  const flipDirection = x > Theme.canvas.width * 0.7; // Se estiver num canto direito muito próximo do topo, inverte o lado.
  const dx = flipDirection ? -150 : 150;
  const dy = -150;
  
  const lineX2 = x + dx * lineProgress;
  const lineY2 = y + dy * lineProgress;

  return (
    <AbsoluteFill style={{ overflow: 'visible' }}>
      
      {/* Linha guia */}
      <svg width="100%" height="100%" style={{ position: 'absolute', overflow: 'visible' }}>
        <line
          x1={x}
          y1={y}
          x2={lineX2}
          y2={lineY2}
          stroke={accentColor}
          strokeWidth={4}
          strokeDasharray="8 8"
          strokeOpacity={lineProgress * 0.8}
        />
        {/* Ponto ancorado no gráfico */}
        <circle 
          cx={x} 
          cy={y} 
          r={12 * dotScale} 
          fill={accentColor} 
          opacity={dotOpacity} 
        />
        {/* Halo pulsante */}
        <circle 
          cx={x} 
          cy={y} 
          r={30 * dotScale} 
          fill={accentColor} 
          opacity={dotOpacity * 0.2} 
        />
      </svg>

      {/* Container de Texto */}
      <div
        style={{
          position: 'absolute',
          left: flipDirection ? x + dx - 400 : x + dx + 20,
          top: y + dy - 40 + textYOffset,
          display: 'flex',
          flexDirection: 'column',
          alignItems: flipDirection ? 'flex-end' : 'flex-start',
          opacity: textOpacity,
          width: 400,
        }}
      >
        <div style={{
          display: 'inline-block',
          backgroundColor: T.surface,
          border: `2px solid ${accentColor}`,
          borderRadius: 8,
          padding: '12px 24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{
            fontSize: Theme.typography.labelSize,
            fontWeight: Theme.typography.weightBold,
            color: T.text,
            lineHeight: 1.2,
          }}>
            {label}
          </div>
          {value !== undefined && (
            <div style={{
              fontSize: Theme.typography.axisSize,
              fontWeight: Theme.typography.weightMedium,
              color: accentColor,
              marginTop: 4,
            }}>
              {value}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
