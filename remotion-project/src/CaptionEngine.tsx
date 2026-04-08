import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Video, Audio, staticFile } from 'remotion';
import { loadFont } from '@remotion/google-fonts/Inter';

// Load Inter font
const { fontFamily } = loadFont();

export interface RemotionWord {
  word: string;
  start: number;
  end: number;
}

export const CaptionEngine: React.FC<{
  videoSrc: string;
  audioSrc: string;
  captions: RemotionWord[];
}> = ({ videoSrc, audioSrc, captions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Cleanup Rules: Remove trailing punctuation (.,), preserve contractions (don't, it's)
  const cleanWord = (text: string) => text.replace(/[.,!?]+$/, '');

  // Chunking: 4 words per chunk
  const chunks = useMemo(() => {
    const res: RemotionWord[][] = [];
    if (!captions) return res;
    for (let i = 0; i < captions.length; i += 4) {
      res.push(captions.slice(i, i + 4));
    }
    return res;
  }, [captions]);

  // Find current chunk based on time
  const currentChunkIndex = chunks.findIndex((chunk: RemotionWord[]) => {
    if (!chunk || chunk.length === 0) return false;
    const chunkStart = chunk[0].start;
    const chunkEnd = chunk[chunk.length - 1].end;
    return currentTime >= chunkStart && currentTime <= chunkEnd + 0.3;
  });

  const activeChunk = currentChunkIndex !== -1 ? chunks[currentChunkIndex] : null;

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {/* Muted Original Video */}
      {videoSrc && <Video src={staticFile(videoSrc)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}

      {/* Overlay Auphonic-processed audio */}
      {audioSrc && <Audio src={staticFile(audioSrc)} />}

      {/* Gradient overlay: Height 40%, Fade transparent -> rgba(0,0,0,0.85) */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.85) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Captions Component */}
      <AbsoluteFill
        style={{
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingBottom: '120px', // Position: Bottom, 120px
          pointerEvents: 'none',
        }}
      >
        {activeChunk && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '24px', // Word gap: 24px
              fontFamily,
              fontSize: '72px', // Size: 72px
              fontWeight: 800, // Weight: 800
              letterSpacing: '0.02em', // Letter spacing: 0.02em
              textAlign: 'center',
              width: '80%',
            }}
          >
            {activeChunk.map((w: RemotionWord, idx: number) => {
              const cleanedText = cleanWord(w.word);
              const isPast = currentTime > w.end;
              const isCurrent = currentTime >= w.start && currentTime <= w.end;

              // Default style rules (Future)
              let color = 'rgba(255, 255, 255, 0.5)';
              let textShadow = '0 4px 20px rgba(0,0,0,0.8)';
              let transform = 'scale(1)';

              // Current word style rules
              if (isCurrent) {
                color = '#BFF549'; // Neon green
                textShadow = '0 0 40px rgba(191,245,73,0.8), 0 4px 20px rgba(0,0,0,0.8)';
                transform = 'scale(1.1)';
              } 
              // Past word style rules
              else if (isPast) {
                color = '#FFFFFF';
              }

              return (
                <span
                  key={idx}
                  style={{
                    color,
                    textShadow,
                    transform,
                    transition: 'all 0.1s ease-out',
                    display: 'inline-block',
                    willChange: 'transform, color, text-shadow'
                  }}
                >
                  {cleanedText}
                </span>
              );
            })}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
