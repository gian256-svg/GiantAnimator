import React from 'react';
import { useCurrentFrame, random, interpolate, useVideoConfig } from 'remotion';

export const FloatingCurrency: React.FC<{
  count: number;
  speed: number;
  drift: number;
  opacityRange: [number, number];
}> = ({ count, speed, drift, opacityRange }) => {
  const frame = useCurrentFrame();
  const { height, width } = useVideoConfig();

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 50 }}>
      {new Array(count).fill(0).map((_, i) => {
        const randX = random(`x-${i}`);
        const randY = random(`y-${i}`);
        const randSize = random(`size-${i}`);
        // 0.5 to 1.0 multiplier
        const randSpeed = random(`speed-${i}`) * 0.5 + 0.5; 
        const randDriftOffset = random(`drift-${i}`) * Math.PI * 2;
        
        // Distribute slightly above the screen, staggered
        const startY = -400 + randY * height * 1.5;
        // The total movement depends on speed and frame
        const yPos = startY + frame * speed * randSpeed * 20;
        
        // Loop vertically smoothly off bottom screen
        const loopedY = yPos % (height + 600) - 300;

        const xPos = randX * width + Math.sin(frame * 0.05 * randSpeed + randDriftOffset) * drift;
        
        // Base max opacity logic
        const baseOpacity = interpolate(
          random(`op-${i}`),
          [0, 1],
          opacityRange
        );

        // Slow fade in at beginning of scene (frame 0-30)
        const fadeTime = 30;
        const opacity = frame > fadeTime 
            ? baseOpacity 
            : interpolate(frame, [0, fadeTime], [0, baseOpacity], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

        const size = interpolate(randSize, [0, 1], [40, 90]);
        // randomly use generic symbol or actual text
        const symbols = ['$', '€', '¥', '£'];
        const symbolIdx = Math.floor(random(`sym-${i}`) * symbols.length);

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: xPos,
              top: loopedY,
              opacity: opacity,
              color: '#FFC200',
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 700,
              fontSize: size,
              textShadow: '0 4px 12px rgba(255, 194, 0, 0.4)'
            }}
          >
            {symbols[symbolIdx]}
          </div>
        );
      })}
    </div>
  );
};
