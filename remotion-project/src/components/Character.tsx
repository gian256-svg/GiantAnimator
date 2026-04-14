import React from 'react';
import { useCurrentFrame } from 'remotion';

export const Character: React.FC<{
  type: 'director' | 'camera_operator' | 'boom_operator' | 'lighting_crew';
  position: [number, number];
  scale?: number;
}> = ({ type, position, scale = 1 }) => {
  const frame = useCurrentFrame();
  const T = resolveTheme(theme ?? 'dark');

  const seed = type.length;
  // very slight breathe loop
  const breathe = Math.sin((frame * 0.05) + seed) * 0.01 + 0.99; 
  // slight structural sway +/- 3px
  const swayX = Math.sin((frame * 0.02) + seed) * 3; 

  let content = null;
  const color = '#282B2F';

  if (type === 'director') {
    content = (
      <svg width="250" height="350" viewBox="0 0 100 140" style={{ overflow: 'visible' }}>
        {/* Head */}
        <circle cx="65" cy="30" r="14" fill={color} />
        {/* Body leaning back slightly */}
        <rect x="50" y="50" width="30" height="50" rx="8" fill={color} />
        
        {/* Director's chair backrest/seat */}
        <path d="M 30,75 L 80,75 M 40,105 L 80,105 M 35,45 L 35,140 M 80,45 L 80,140" stroke={color} strokeWidth="6" strokeLinecap="round" fill="none" />
        {/* Cross legs on chair */}
        <path d="M 35,105 L 80,140 M 80,105 L 35,140" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none" />

        {/* Arm resting */}
        <path d="M 60,60 L 40,75 L 50,90" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        
        {/* Legs pointing forward */}
        <path d="M 55,100 L 45,140 M 70,100 L 60,140" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" />
      </svg>
    );
  } else if (type === 'camera_operator') {
    content = (
      <svg width="250" height="350" viewBox="0 0 100 140" style={{ overflow: 'visible' }}>
        {/* Head */}
        <circle cx="45" cy="20" r="14" fill={color} />
        {/* Body */}
        <rect x="30" y="40" width="30" height="50" rx="8" fill={color} />
        {/* Legs */}
        <path d="M 35,90 L 30,140 M 55,90 L 60,140" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" />
        {/* Arm extending to camera */}
        <path d="M 35,50 Q 15,60 20,80" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" />
      </svg>
    );
  } else if (type === 'boom_operator') {
    content = (
      <svg width="250" height="350" viewBox="0 0 100 140" style={{ overflow: 'visible' }}>
        <circle cx="45" cy="20" r="14" fill={color} />
        <rect x="30" y="40" width="30" height="50" rx="8" fill={color} />
        <path d="M 35,90 L 30,140 M 55,90 L 60,140" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" />
        {/* Arms holding boom up */}
        <path d="M 35,50 L 20,20 M 55,50 L 70,20" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" />
      </svg>
    );
  } else if (type === 'lighting_crew') {
    content = (
      <svg width="250" height="350" viewBox="0 0 100 140" style={{ overflow: 'visible' }}>
        <circle cx="50" cy="20" r="14" fill={color} />
        <rect x="35" y="40" width="30" height="50" rx="8" fill={color} />
        <path d="M 40,90 L 40,140 M 60,90 L 60,140" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none" />
        {/* Arm on hip */}
        <path d="M 65,50 Q 85,60 70,80 L 65,80" stroke={color} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      left: position[0],
      top: position[1],
      transform: `translate(-50%, -100%) scale(${scale * breathe}) translateX(${swayX}px)`,
      transformOrigin: 'bottom center',
      zIndex: 10,
    }}>
      {content}
    </div>
  );
};
