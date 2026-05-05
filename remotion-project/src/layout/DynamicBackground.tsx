import React from 'react';
import { AbsoluteFill } from 'remotion';

interface DynamicBackgroundProps {
    baseColor: string;
    accentColor?: string;
    backgroundType?: 'dark' | 'light' | 'transparent';
}

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({ baseColor, accentColor, backgroundType }) => {
    if (backgroundType === 'transparent') {
        return null; // 🚀 MODO ALPHA: Remove qualquer fundo para exportação QuickTime
    }

    // Definimos as cores do gradiente principal baseado no tipo ou na cor base
    const isDark = backgroundType === 'dark' || (!backgroundType && baseColor === '#0f1117');
    const isLight = backgroundType === 'light' || (!backgroundType && baseColor !== '#0f1117');

    const isCustomBg = baseColor !== '#0f1117' && baseColor !== '#FAF9F6' && baseColor !== '#ffffff' && baseColor !== '#000000';
    let gradientBackground = '';

    if (backgroundType === 'dark' && !isCustomBg) {
        // Gradiente Premium Escuro (Referência Imagem 3)
        gradientBackground = `radial-gradient(circle at 50% 50%, #1a1c23 0%, #090a0f 100%)`;
    } else if (backgroundType === 'light' && !isCustomBg) {
        // Gradiente Premium Claro (Referência Imagem 4)
        gradientBackground = `radial-gradient(circle at 50% 50%, #ffffff 0%, #f0f2f5 100%)`;
    } else {
        // Modo adaptativo baseado na cor base (mantém flexibilidade para paletas CUSTOM)
        const shadowOpacity = isDark ? 0.4 : 0.05;
        gradientBackground = `radial-gradient(circle at 50% 50%, ${baseColor} 0%, rgba(0,0,0,${shadowOpacity}) 100%)`;
    }

    return (
        <AbsoluteFill style={{ backgroundColor: baseColor, zIndex: 0 }}>
            {/* Gradiente Principal de Profundidade */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: gradientBackground,
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
