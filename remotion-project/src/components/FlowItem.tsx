import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const icons = {
  user: (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  cart: (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  system: (
    <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  api: (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  pos: (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  check: (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  money: (
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="12" y1="2" x2="12" y2="6" />
    </svg>
  ),
};

export const FlowItem: React.FC<{
  node: { id: number; label: string; position: [number, number]; delay: number; icon: string; isCenter?: boolean };
}> = ({ node }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame: frame - node.delay,
    fps,
    config: { damping: 14, stiffness: 90, mass: 0.5 },
    durationInFrames: 15,
  });

  const opacity = interpolate(Math.max(0, frame - node.delay), [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const scale = interpolate(entrance, [0, 1], [0.95, 1]);
  const translateY = interpolate(entrance, [0, 1], [20, 0]);

  // @ts-ignore
  const renderedIcon = icons[node.icon] || null;

  return (
    <div
      style={{
        position: 'absolute',
        left: node.position[0],
        top: node.position[1],
        transform: `translate(-50%, -50%) scale(${scale}) translateY(${translateY}px)`,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
      }}
    >
      {node.isCenter ? (
        <div style={{
          width: 700,
          height: 380,
          backgroundColor: '#282B2F',
          borderRadius: 60,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,194,0,0.2)',
          border: '4px solid #FFC200'
        }}>
           <div style={{ color: '#FFC200', marginBottom: 20 }}>{renderedIcon}</div>
           <div style={{ color: '#FFFFFF', fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 76, textAlign: 'center', whiteSpace: 'pre-wrap', lineHeight: 1.2 }}>
             {node.label}
           </div>
        </div>
      ) : (
        <>
          <div style={{
            width: 320,
            height: 320,
            backgroundColor: '#282B2F',
            borderRadius: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            border: '2px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ color: '#FFC200' }}>{renderedIcon}</div>
          </div>
          <div style={{
            position: 'absolute',
            top: 360,
            width: 700, // widening container slightly to accommodate larger font
            color: '#000000',
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: 64,
            textAlign: 'center',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.3,
          }}>
            {node.label}
          </div>
        </>
      )}
    </div>
  );
};
