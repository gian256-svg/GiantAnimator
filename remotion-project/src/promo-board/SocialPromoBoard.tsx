import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, random, Img, staticFile } from "remotion";
import "./styles.css";

// Dual Cluster configuration preserved perfectly at authentic 30fps baseline rendering
// Coordinates completely recalculated allocating a strict 80px-100px physical gap between all elements natively guaranteeing zero overlap
const CARDS = [
  // --- LEFT CLUSTER (5 elements) ---
  { id: 1, filename: "Card-1-Finclass.png", glow: "rgba(0, 150, 255, 0.85)", targetX: -1100, targetY: -210, delay: 0 },
  { id: 2, filename: "Card-2-Comunidade.png", glow: "rgba(255, 255, 255, 0.75)", targetX: -760, targetY: -210, delay: 2 },
  { id: 3, filename: "Card-3-Carteira_Arca.png", glow: "rgba(255, 200, 50, 0.8)", targetX: -420, targetY: -210, delay: 4 },
  { id: 4, filename: "Card-4-Lobo.png", glow: "rgba(255, 255, 255, 0.7)", targetX: -930, targetY: 210, delay: 1 },
  { id: 5, filename: "Card-5-Mil_Milhao.png", glow: "rgba(255, 100, 0, 0.9)", targetX: -590, targetY: 210, delay: 3 },

  // --- RIGHT CLUSTER (4 elements) ---
  { id: 6, filename: "Card-6-Codigo_Riqueza.png", glow: "rgba(180, 0, 255, 0.9)", targetX: 560, targetY: -210, delay: 5 },
  { id: 7, filename: "Card-7-Duo_Gourmet.png", glow: "rgba(255, 20, 40, 0.85)", targetX: 900, targetY: -210, delay: 1 },
  { id: 8, filename: "Card-8-MKT_Digital.png", glow: "rgba(0, 180, 255, 0.9)", targetX: 560, targetY: 210, delay: 6 },
  { id: 9, filename: "Card-9-Livro_Arca.png", glow: "rgba(0, 255, 255, 0.85)", targetX: 900, targetY: 210, delay: 2 },
];

const SPARKLE_COLORS = [
  "rgba(0, 150, 255, 1)",   // Blue
  "rgba(0, 255, 200, 1)",   // Teal
  "rgba(255, 200, 50, 1)",  // Gold
  "rgba(255, 255, 255, 1)", // White
  "rgba(255, 100, 0, 1)",   // Orange
  "rgba(180, 0, 255, 1)",   // Purple
  "rgba(0, 255, 255, 1)",   // Cyan
  "rgba(255, 20, 40, 1)",   // Red
];

export const SocialPromoBoard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig(); // RESTORED 30FPS STANDARD

  /* =========================================
     1. CENTRAL EPIC BURST REVEAL 
     ========================================= */
  const BURST_START = 20; 

  const isShakeActive = frame >= BURST_START && frame <= BURST_START + 35;
  const shakeIntensity = interpolate(frame, [BURST_START, BURST_START + 3, BURST_START + 10, BURST_START + 35], [0, 120, 60, 0], { extrapolateRight: "clamp" });
  
  const shakeX = isShakeActive ? (random(`sx-${frame}`) - 0.5) * shakeIntensity : 0;
  const shakeY = isShakeActive ? (random(`sy-${frame}`) - 0.5) * shakeIntensity : 0;

  const burstScale = interpolate(frame, [BURST_START, BURST_START + 3, BURST_START + 15], [0, 3.5, 5], { extrapolateRight: "clamp" });
  const burstOpacity = interpolate(frame, [BURST_START, BURST_START + 3, BURST_START + 25], [0, 1, 0], { extrapolateRight: "clamp" });

  const flareScaleX = interpolate(frame, [BURST_START - 2, BURST_START, BURST_START + 12], [0, 5, 0], { extrapolateRight: "clamp" });
  const flareOpacity = interpolate(frame, [BURST_START - 2, BURST_START, BURST_START + 12], [0, 1, 0], { extrapolateRight: "clamp" });

  const ringScale = interpolate(frame, [BURST_START, BURST_START + 15], [0.1, 8], { extrapolateRight: "clamp" });
  const ringOpacity = interpolate(frame, [BURST_START, BURST_START + 8, BURST_START + 15], [0, 1, 0], { extrapolateRight: "clamp" });

  const burstParticles = useMemo(() => Array.from({ length: 600 }).map((_, i) => {
    const angle = random(`ang-${i}`) * Math.PI * 2;
    const ellipseBiasX = Math.abs(Math.cos(angle)) * 0.8 + 0.4; 
    const ellipseBiasY = Math.abs(Math.sin(angle)) * 0.4 + 0.2;
    
    const speedMultiplier = random(`speedtype-${i}`) > 0.9 ? 150 : 60; 
    const dragCore = random(`speedtype-${i}`) > 0.9 ? 0.92 : 0.86; 

    const velocityX = (15 + random(`velx-${i}`) * speedMultiplier) * ellipseBiasX;
    const velocityY = (15 + random(`vely-${i}`) * speedMultiplier) * ellipseBiasY;
    
    return {
      id: i,
      angle,
      velocityX,
      velocityY,
      drag: dragCore + random(`drag-${i}`) * 0.05,
      wobblePhase: random(`wobble-${i}`) * Math.PI * 2,
      wobbleSpeed: 0.05 + random(`wobspeed-${i}`) * 0.15, 
      size: 1 + random(`esize-${i}`) * 10,
      color: SPARKLE_COLORS[Math.floor(random(`ecolor-idx-${i}`) * SPARKLE_COLORS.length)],
    }
  }), []);

  const globalSlowZoomPhase = interpolate(frame, [BURST_START + 20, 5400], [0, 400], { extrapolateLeft: "clamp" }); 
  const hookSettleCamZ = interpolate(
    spring({ frame: Math.max(0, frame - BURST_START), fps, config: { damping: 14, stiffness: 60, mass: 1.2 } }),
    [0, 1], [1500, 0]
  );
  
  const finalCameraZ = hookSettleCamZ - globalSlowZoomPhase;

  return (
    <AbsoluteFill className="promo-container" style={{ backgroundColor: "#000000" }}>

      {/* --- CAMERA SHAKE ROOT RIG --- */}
      <div style={{ width: "100%", height: "100%", transform: `translate3d(${shakeX}px, ${shakeY}px, 0)`, zIndex: 10 }}>
        
        {/* --- DYNAMIC LIGHT PARTICLES BURST --- */}
        {burstOpacity > 0 && (
          <div className="central-burst" style={{ opacity: burstOpacity, transform: `translate(-50%, -50%) scale(${burstScale})` }} />
        )}
        
        {flareOpacity > 0 && (
          <>
            <div className="horizontal-flare" style={{ opacity: flareOpacity * 1.5, transform: `translate(-50%, -50%) scaleX(${flareScaleX})` }} />
            <div className="horizontal-flare" style={{ opacity: flareOpacity * 0.6, transform: `translate(-50%, -50%) rotate(15deg) scaleX(${flareScaleX * 0.7})` }} />
            <div className="horizontal-flare" style={{ opacity: flareOpacity * 0.6, transform: `translate(-50%, -50%) rotate(-15deg) scaleX(${flareScaleX * 0.7})` }} />
          </>
        )}

        {ringOpacity > 0 && (
          <div className="shockwave-ring" style={{ opacity: ringOpacity, transform: `translate(-50%, -50%) scale(${ringScale})` }} />
        )}

        {/* --- HARDWARE ACCELERATED PARTICLE SIMULATION --- */}
        <div className="particles-layer">
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
              <div key={p.id} className="energy-particle" style={{
                top: 0, left: 0, 
                width: p.size, height: p.size,
                background: p.color,
                boxShadow: `0 0 ${p.size * 3}px ${p.color}, 0 0 ${p.size * 5}px white`,
                opacity: epOpacity * (1 - (localFrame / 150)),
                transform: `translate3d(calc(${width / 2}px + ${currX}px), calc(${height / 2}px + ${currY}px), 0) scale(${interpolate(localFrame, [0, 20, 80], [1, 1.5, 0], { extrapolateRight: "clamp" })})`
              }} />
            )
          })}
        </div>

        {/* --- EXPLOSIVE GRID ENTRANCES --- */}
        <div 
          className="cards-container"
          style={{
            transform: `translate3d(0px, 0px, ${finalCameraZ}px)`
          }}
        >
          {CARDS.map((card) => {
            const entranceStart = BURST_START + card.delay; 
            
            const entranceSpring = spring({
              frame: frame - entranceStart,
              fps, 
              config: { damping: 13, stiffness: 80, mass: 1.1 } 
            });

            const tumbleRotX = interpolate(entranceSpring, [0, 1], [(random(`rotX-${card.id}`) - 0.5) * 360, 0]);
            const tumbleRotY = interpolate(entranceSpring, [0, 1], [(random(`rotY-${card.id}`) - 0.5) * 500, 0]);
            const tumbleRotZ = interpolate(entranceSpring, [0, 1], [(random(`rotZ-${card.id}`) - 0.5) * 180, 0]);

            const currentX = interpolate(entranceSpring, [0, 1], [0, card.targetX]);
            const currentY = interpolate(entranceSpring, [0, 1], [0, card.targetY]);
            const currentZ = interpolate(entranceSpring, [0, 1], [-2500, 0]);

            const driftOffsetPhase = card.id * 100;
            const floatingY = Math.sin((frame + driftOffsetPhase) / 60) * 8; 
            const floatingX = Math.cos((frame + driftOffsetPhase) / 80) * 4; 

            if (frame < entranceStart - 3) return null;

            return (
              <div
                key={card.id}
                className="promo-card"
                style={{
                  left: `calc(50% - 130px)`, // Explicit layout math targeting precise hardware translation 
                  top: `calc(50% - 162.5px)`,  
                  transform: `translate3d(${currentX + floatingX}px, ${currentY + floatingY}px, ${currentZ}px) rotateX(${tumbleRotX}deg) rotateY(${tumbleRotY}deg) rotateZ(${tumbleRotZ}deg)`,
                  opacity: interpolate(entranceSpring, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
                  boxShadow: `0 0 40px ${card.glow}, 0 0 10px ${card.glow}, 0 20px 40px rgba(0,0,0,0.8)` // Moderated outer glow falloff stopping light bleed between components
                }}
              >
                <Img 
                  src={staticFile(`ArteAd01/${card.filename}`)} 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
              </div>
            );
          })}
        </div>
        
      </div>
    </AbsoluteFill>
  );
};
