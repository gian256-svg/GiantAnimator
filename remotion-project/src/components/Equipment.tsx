import React from 'react';
import { useCurrentFrame } from 'remotion';

export const Equipment: React.FC<{
  type: 'camera' | 'boom_mic' | 'light';
  position: [number, number];
  scale?: number;
}> = ({ type, position, scale = 1 }) => {
  const frame = useCurrentFrame();
  const T = resolveTheme(theme ?? 'dark');

  const color = '#282B2F';
  const highlight = '#FFC200';

  let content = null;
  let customTransform = '';
  // translate(-50%, -100%) so position is the bottom center floor coordinate

  if (type === 'camera') {
    // Subtle tilt loop
    const tilt = Math.sin(frame * 0.1) * 1.5;
    customTransform = `rotate(${tilt}deg)`;
    content = (
      <svg width="250" height="350" viewBox="0 0 100 140" style={{ overflow: 'visible' }}>
        {/* Tripod legs */}
        <path d="M 50,60 L 20,140 M 50,60 L 50,140 M 50,60 L 80,140" stroke={color} strokeWidth="6" strokeLinecap="round" fill="none" />
        {/* Tripod head */}
        <rect x="35" y="45" width="30" height="15" rx="2" fill={color} />
        {/* Camera body */}
        <rect x="25" y="10" width="50" height="35" rx="4" fill={color} />
        {/* Lens */}
        <rect x="5" y="15" width="20" height="25" rx="2" fill={color} />
        {/* Cinema highlighting ring */}
        <rect x="20" y="15" width="5" height="25" fill={highlight} />
      </svg>
    );
  } else if (type === 'boom_mic') {
    // Slight pendulum swinging motion
    const swing = Math.sin(frame * 0.04) * 5; 
    customTransform = `rotate(${swing}deg)`;
    content = (
      <svg width="600" height="500" viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
        {/* Boom pole */}
        <path d="M 180,180 L 40,40" stroke={color} strokeWidth="6" strokeLinecap="round" fill="none" />
        {/* Mic handle/mount */}
        <path d="M 40,40 L 40,30 L 10,30" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round"/>
        {/* Blimp/Mic */}
        <rect x="0" y="20" width="40" height="20" rx="10" fill={color} />
        {/* Gold accent line on mic */}
        <rect x="15" y="20" width="5" height="20" fill={highlight} />
      </svg>
    );
  } else if (type === 'light') {
    // Cinematic light flicker opacity shift (very slight)
    const flicker = Math.sin(frame * 0.8) * 0.1 + 0.9; 
    content = (
      <svg width="300" height="400" viewBox="0 0 100 150" style={{ overflow: 'visible' }}>
        {/* Light stand main pole */}
        <path d="M 50,40 L 50,150" stroke={color} strokeWidth="6" strokeLinecap="round" fill="none" />
        {/* Stand legs */}
        <path d="M 50,110 L 10,150 M 50,110 L 90,150" stroke={color} strokeWidth="6" strokeLinecap="round" fill="none" />
        {/* Light Head shape */}
        <polygon points="40,40 60,40 75,10 25,10" fill={color} strokeLinejoin="round" />
        {/* Softbox / Barn doors indication */}
        <path d="M 25,10 L 10,-10 M 75,10 L 90,-10" stroke={color} strokeWidth="6" strokeLinecap="round" fill="none" />
        
        {/* Emitted Light Cone overlay */}
        <polygon points="25,-10 75,-10 140,-80 -40,-80" fill={highlight} opacity={0.15 * flicker} />
        
        {/* Lens source highlight */}
        <line x1="25" y1="10" x2="75" y2="10" stroke={highlight} strokeWidth="4" />
      </svg>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      left: position[0],
      top: position[1],
      transform: `translate(-50%, -100%) scale(${scale}) ${customTransform}`,
      transformOrigin: type === 'boom_mic' ? 'bottom right' : 'bottom center',
      zIndex: 5,
    }}>
      {content}
    </div>
  );
};
