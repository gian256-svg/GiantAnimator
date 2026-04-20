import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, interpolate } from 'remotion';

interface DynamicBackgroundProps {
    baseColor: string;
    accentColor?: string;
    backgroundType?: 'dark' | 'light';
}

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({ baseColor, accentColor, backgroundType }) => {
    const isDark = backgroundType === 'dark' || !backgroundType;

    return (
        <AbsoluteFill style={{ backgroundColor: baseColor, zIndex: 0 }}>
            {/* Gradiente Radial Sutil para Profundidade Premium */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: isDark 
                    ? `radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.4) 100%)`
                    : `radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.05) 100%)`,
                pointerEvents: 'none'
            }} />
            
            {/* Brilho de Sotaque (Accent Glow) - Muito leve para não pesar o render */}
            {accentColor && (
                <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    background: `radial-gradient(circle at 80% 20%, ${accentColor}11 0%, transparent 50%)`,
                    pointerEvents: 'none'
                }} />
            )}
        </AbsoluteFill>
    );
};
