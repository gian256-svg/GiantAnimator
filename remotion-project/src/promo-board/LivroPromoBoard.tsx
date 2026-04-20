import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, random, Img, staticFile } from "remotion";
import { resolveTheme } from "../theme";
import "./livro-styles.css";

const SPARKLE_COLORS = [
  "rgba(0, 255, 255, 1)",   // Cyan
  "rgba(0, 150, 255, 1)",   // Light Blue
  "rgba(0, 50, 255, 1)",    // Deep Blue
  "rgba(255, 255, 255, 1)", // White
];

export const LivroPromoBoard: React.FC = () => {
  const frame = useCurrentFrame();
  const T = resolveTheme('dark');
  const { fps, width, height } = useVideoConfig(); 

  const BURST_START = 20; 

  // Card Positioning (Right-aligned cinematic composition)
  const cardTargetX = 750; 
  const cardTargetY = 0;    

  const isShakeActive = frame >= BURST_START && frame <= BURST_START + 35;
  const shakeIntensity = interpolate(frame, [BURST_START, BURST_START + 3, BURST_START + 10, BURST_START + 35], [0, 80, 40, 0], { extrapolateRight: "clamp" });
  
  const shakeX = isShakeActive ? (random(`sx-${frame}`) - 0.5) * shakeIntensity : 0;
  const shakeY = isShakeActive ? (random(`sy-${frame}`) - 0.5) * shakeIntensity : 0;

  const burstScale = interpolate(frame, [BURST_START, BURST_START + 3, BURST_START + 15], [0, 2.5, 4], { extrapolateRight: "clamp" });
  const burstOpacity = interpolate(frame, [BURST_START, BURST_START + 3, BURST_START + 25], [0, 1, 0], { extrapolateRight: "clamp" });

  const flareScaleX = interpolate(frame, [BURST_START - 2, BURST_START, BURST_START + 12], [0, 3, 0], { extrapolateRight: "clamp" });
  const flareOpacity = interpolate(frame, [BURST_START - 2, BURST_START, BURST_START + 12], [0, 1, 0], { extrapolateRight: "clamp" });

  const ringScale = interpolate(frame, [BURST_START, BURST_START + 15], [0.1, 5], { extrapolateRight: "clamp" });
  const ringOpacity = interpolate(frame, [BURST_START, BURST_START + 8, BURST_START + 15], [0, 1, 0], { extrapolateRight: "clamp" });

  const burstParticles = useMemo(() => Array.from({ length: 400 }).map((_, i) => {
    const angle = random(`ang-${i}`) * Math.PI * 2;
    const ellipseBiasX = Math.abs(Math.cos(angle)) * 0.8 + 0.4; 
    const ellipseBiasY = Math.abs(Math.sin(angle)) * 0.4 + 0.2;
    
    const speedMultiplier = random(`speedtype-${i}`) > 0.9 ? 120 : 50; 
    const dragCore = random(`speedtype-${i}`) > 0.9 ? 0.92 : 0.86; 

    const velocityX = (10 + random(`velx-${i}`) * speedMultiplier) * ellipseBiasX;
    const velocityY = (10 + random(`vely-${i}`) * speedMultiplier) * ellipseBiasY;
    
    return {
      id: i,
      angle,
      velocityX,
      velocityY,
      drag: dragCore + random(`drag-${i}`) * 0.05,
      wobblePhase: random(`wobble-${i}`) * Math.PI * 2,
      wobbleSpeed: 0.05 + random(`wobspeed-${i}`) * 0.15, 
      size: 1 + random(`esize-${i}`) * 8,
      color: SPARKLE_COLORS[Math.floor(random(`ecolor-idx-${i}`) * SPARKLE_COLORS.length)],
    }
  }), []);

  const globalSlowZoomPhase = interpolate(frame, [BURST_START + 20, 5400], [0, 400], { extrapolateLeft: "clamp" }); 
  const hookSettleCamZ = interpolate(
    spring({ frame: Math.max(0, frame - BURST_START), fps, config: { damping: 14, stiffness: 60, mass: 1.2 } }),
    [0, 1], [1500, 0]
  );
  
  const finalCameraZ = hookSettleCamZ - globalSlowZoomPhase;

  // Single Card Entrance Spring
  const entranceStart = BURST_START + 2; 
  const entranceSpring = spring({
    frame: frame - entranceStart,
    fps, 
    config: { damping: 12, stiffness: 60, mass: 1.1 } 
  });

  const tumbleRotX = interpolate(entranceSpring, [0, 1], [-20, 0]);
  const tumbleRotY = interpolate(entranceSpring, [0, 1], [-40, 0]); // Reversed rotation for right entry
  const tumbleRotZ = interpolate(entranceSpring, [0, 1], [-10, 0]); // Reversed rotation

  // Animate directly around its designated target instead of flying cross-screen from center (x=0)
  const currentX = interpolate(entranceSpring, [0, 1], [cardTargetX + 150, cardTargetX]);
  const currentY = interpolate(entranceSpring, [0, 1], [cardTargetY + 100, cardTargetY]);
  const currentZ = interpolate(entranceSpring, [0, 1], [-1000, 0]);

  const floatingY = Math.sin(frame / 60) * 15; 
  const floatingX = Math.cos(frame / 80) * 8; 
  
  const pulseOpacity = 0.5 + Math.sin(frame / 20) * 0.5;
  const pulseScale = 1 + Math.sin(frame / 30) * 0.03;

  return (
    <AbsoluteFill className="livro-container" style={{ backgroundColor: "#020101" }}>

      {/* --- BACKGROUND GLOW --- */}
      <div className="livro-bg-glow" style={{ 
        transform: `translate(${cardTargetX/2}px, 0)`,
        opacity: interpolate(frame, [BURST_START, BURST_START + 30], [0, 0.6], { extrapolateRight: "clamp" })
      }} />

      {/* --- CAMERA SHAKE ROOT RIG --- */}
      <div style={{ width: "100%", height: "100%", transform: `translate3d(${shakeX}px, ${shakeY}px, ${finalCameraZ}px)`, zIndex: 10 }}>
        
        {/* --- DYNAMIC LIGHT PARTICLES BURST --- */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(${cardTargetX}px, ${cardTargetY}px)` }}>
          {burstOpacity > 0 && (
            <div className="livro-central-burst" style={{ opacity: burstOpacity, transform: `translate(-50%, -50%) scale(${burstScale})` }} />
          )}
          
          {flareOpacity > 0 && (
            <>
              <div className="livro-horizontal-flare" style={{ opacity: flareOpacity * 1.5, transform: `translate(-50%, -50%) scaleX(${flareScaleX})` }} />
              <div className="livro-horizontal-flare" style={{ opacity: flareOpacity * 0.6, transform: `translate(-50%, -50%) rotate(15deg) scaleX(${flareScaleX * 0.7})` }} />
              <div className="livro-horizontal-flare" style={{ opacity: flareOpacity * 0.6, transform: `translate(-50%, -50%) rotate(-15deg) scaleX(${flareScaleX * 0.7})` }} />
            </>
          )}

          {ringOpacity > 0 && (
            <div className="livro-shockwave-ring" style={{ opacity: ringOpacity, transform: `translate(-50%, -50%) scale(${ringScale})` }} />
          )}
        </div>

        {/* --- HARDWARE ACCELERATED PARTICLE SIMULATION --- */}
        <div className="livro-particles-layer">
          {burstParticles.map(p => {
            const localFrame = frame - BURST_START;
            if (localFrame < 0) return null;
            
            const powerLevel = (1 - Math.pow(p.drag, localFrame)) / (1 - p.drag);
            
            const currX = Math.cos(p.angle) * p.velocityX * powerLevel;
            const floatY = Math.sin(localFrame * p.wobbleSpeed + p.wobblePhase) * 20;
            const gravityY = Math.pow(localFrame, 1.45) * 0.35; 
            const currY = Math.sin(p.angle) * p.velocityY * powerLevel + floatY + gravityY;
            
            const epOpacity = interpolate(localFrame, [0, 40, 100], [1, 0.8, 0], { extrapolateRight: "clamp" });

            if (epOpacity <= 0) return null;

            return (
              <div key={p.id} className="livro-energy-particle" style={{
                top: 0, left: 0, 
                width: p.size, height: p.size,
                background: p.color,
                boxShadow: `0 0 ${p.size * 3}px ${p.color}, 0 0 ${p.size * 5}px white`,
                opacity: epOpacity * (1 - (localFrame / 150)),
                transform: `translate3d(calc(${width / 2 + cardTargetX}px + ${currX}px), calc(${height / 2 + cardTargetY}px + ${currY}px), 0) scale(${interpolate(localFrame, [0, 20, 80], [1, 1.5, 0], { extrapolateRight: "clamp" })})`
              }} />
            )
          })}
        </div>

        {/* --- EXPLOSIVE CARD ENTRANCE --- */}
        <div className="livro-cards-container">
          {frame >= entranceStart - 3 && (
            <div
              className="livro-single-promo-card"
              style={{
                left: `calc(50% - 270px)`, 
                top: `calc(50% - 340px)`,  
                transform: `translate3d(${currentX + floatingX}px, ${currentY + floatingY}px, ${currentZ}px) rotateX(${tumbleRotX}deg) rotateY(${tumbleRotY}deg) rotateZ(${tumbleRotZ}deg) scale(${pulseScale})`,
                opacity: interpolate(entranceSpring, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
                boxShadow: `0 0 60px rgba(0, 255, 255, ${0.4 * pulseOpacity}), 0 0 20px rgba(0, 255, 255, ${0.8 * pulseOpacity}), 0 40px 80px rgba(0,0,0,0.9)` 
              }}
            >
              {/* Inner glowing edge for that premium look */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                borderRadius: '24px',
                border: '2px solid rgba(100, 255, 255, 0.6)',
                zIndex: 2,
                pointerEvents: 'none',
                mixBlendMode: 'overlay',
                boxShadow: `inset 0 0 30px rgba(0, 255, 255, ${0.5 * pulseOpacity})`
              }} />

              <Img 
                src={staticFile(`ArteAd01/Card-9-Livro_Arca.png`)} 
                style={{ width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }} 
              />
            </div>
          )}
        </div>
        
      </div>
    </AbsoluteFill>
  );
};
