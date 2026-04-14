import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface Props {
  imagePath: string;
}

export const ImageAnimator: React.FC<Props> = ({ imagePath }) => {
  const frame = useCurrentFrame();
  const T = resolveTheme(theme ?? 'dark');
  const { fps } = useVideoConfig();

  // Fase 1 (0-20f): fade in da imagem completa
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  // Fase 2 (10-40f): scale de 0.92 para 1.0 (zoom suave de entrada)
  const scale = spring({ frame: frame - 10, fps, config: { damping: 18, stiffness: 80 }, durationInFrames: 40 });
  const scaleValue = interpolate(scale, [0, 1], [0.92, 1.0]);

  // Fase 3 (30-50f): slide up suave (sobe 30px e estabiliza)
  const slideY = spring({ frame: frame - 5, fps, config: { damping: 20, stiffness: 60 }, durationInFrames: 45 });
  const translateY = interpolate(slideY, [0, 1], [40, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        opacity,
        transform: "scale(" + scaleValue + ") translateY(" + translateY + "px)",
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Img
          src={imagePath}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
