import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const icons = {
  box: (
    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  users: (
    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  store: (
    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  card: (
    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  folder: (
    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  )
};

export const FIDCFlowItem: React.FC<{
  node: { id: number; label: string; position: [number, number]; delay: number; icon: string; isCenter?: boolean; };
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
