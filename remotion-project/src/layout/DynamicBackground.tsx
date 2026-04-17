import React from 'react';
import { AbsoluteFill, useVideoConfig, useCurrentFrame, interpolate } from 'remotion';

interface DynamicBackgroundProps {
    style: 'none' | 'mesh' | 'grid';
    baseColor: string;
    accentColor: string;
}

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({ style, baseColor, accentColor }) => {
    const { width, height } = useVideoConfig();
    const frame = useCurrentFrame();

    if (style === 'none' || !style) {
        return (
            <AbsoluteFill style={{ backgroundColor: baseColor }}>
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.03) 100%)`,
                    pointerEvents: 'none'
                }} />
            </AbsoluteFill>
        );
    }

    if (style === 'mesh') {
        return (
            <AbsoluteFill style={{ backgroundColor: baseColor }}>
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(circle at ${50 + Math.sin(frame / 50) * 20}% ${50 + Math.cos(frame / 60) * 20}%, ${accentColor}33 0%, transparent 60%)`,
                    filter: 'blur(100px)',
                    opacity: 0.6
                }} />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: `radial-gradient(circle at ${20 + Math.cos(frame / 70) * 30}% ${80 + Math.sin(frame / 40) * 20}%, #6366f122 0%, transparent 50%)`,
                    filter: 'blur(120px)',
                    opacity: 0.4
                }} />
            </AbsoluteFill>
        );
    }

    if (style === 'grid') {
        const perspective = 1000;
        const rotateX = 60;
        const translateY = interpolate(frame % 300, [0, 300], [0, 100]);
        
        return (
            <AbsoluteFill style={{ backgroundColor: baseColor, overflow: 'hidden' }}>
                <div style={{
                    position: 'absolute',
                    width: '200%',
                    height: '200%',
                    left: '-50%',
                    top: '-50%',
                    perspective: `${perspective}px`,
                }}>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `
                            linear-gradient(to right, ${accentColor}22 1px, transparent 1px),
                            linear-gradient(to bottom, ${accentColor}22 1px, transparent 1px)
                        `,
                        backgroundSize: '80px 80px',
                        transform: `rotateX(${rotateX}deg) translateY(${translateY}px)`,
                        maskImage: 'linear-gradient(to bottom, transparent, black 40%, black 80%, transparent)',
                    }} />
                </div>
            </AbsoluteFill>
        );
    }

    // Fallback simple
    return <AbsoluteFill style={{ backgroundColor: baseColor }} />;
};
