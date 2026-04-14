import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const icons = {
  supplier: (
    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  buyer: (
    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  bank: (
    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="12" y1="2" x2="12" y2="6" />
    </svg>
  ),
  bank_buyer: (
    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v20" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
};

export const StepItem: React.FC<{
  node: { id: number; text: string; position: [number, number]; delay: number; icon?: string };
  isActive: boolean;
}> = ({ node, isActive }) => {
  const frame = useCurrentFrame();
  const T = resolveTheme(theme ?? 'dark');
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame: frame - node.delay,
    fps,
    config: { damping: 14, stiffness: 90, mass: 0.5 },
    durationInFrames: 12,
  });

  const activeHighlight = spring({
    frame: frame - node.delay - 5, // slightly after entrance
    fps,
    config: { damping: 8, stiffness: 120, mass: 0.5 },
  });

  const opacity = interpolate(Math.max(0, frame - node.delay), [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  const baseScale = interpolate(entrance, [0, 1], [0.95, 1]);
  const highlightScale = interpolate(activeHighlight, [0, 0.5, 1], [1, 1.05, 1]);
  const scale = baseScale * highlightScale;
  const translateY = interpolate(entrance, [0, 1], [20, 0]);

  // @ts-ignore
  const renderedIcon = node.icon && icons[node.icon] ? icons[node.icon] : null;

  return (
    <div
      style={{
        position: 'absolute',
        left: node.position[0],
        top: node.position[1],
        transform: `translate(-50%, -50%) scale(${scale}) translateY(${translateY}px)`,
        opacity: isActive ? opacity : Math.min(opacity, 0.6),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: isActive ? 20 : 10,
      }}
    >
      <div style={{ position: 'relative' }}>
        <div style={{
          width: 280,
          height: 280,
          backgroundColor: '#1E2024',
          borderRadius: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          border: isActive ? '4px solid #FFC200' : '4px solid transparent',
          color: isActive ? '#FFC200' : '#888888', // Icons should be grey when inactive and yellow when active
          transition: 'all 0.3s ease'
        }}>
          {renderedIcon}
        </div>
      </div>
      
      <div style={{
        position: 'absolute',
        top: 320,
        color: '#000000',
        fontFamily: "'Poppins', sans-serif",
        fontWeight: 700,
        fontSize: 48,
        textAlign: 'center',
        whiteSpace: 'pre-wrap',
        lineHeight: 1.2,
        width: 700,
        opacity: isActive ? 1 : 0.8
      }}>
        <span dangerouslySetInnerHTML={{
          __html: node.text.replace('\n', '<br/>')
        }} />
      </div>
    </div>
  );
};
