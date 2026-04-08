import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Character } from '../components/Character';
import { Equipment } from '../components/Equipment';
import { FloatingCurrency } from '../components/FloatingCurrency';
import { sceneConfigSchema } from '../data/sceneConfig';
import { z } from 'zod';

export const FilmSet: React.FC<{ config: z.infer<typeof sceneConfigSchema> }> = ({ config }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: 'transparent' }}>
      
      {/* Lighting Crew Left */}
      <Equipment type="light" position={[600, 1600]} scale={2.5} />
      <Character type="lighting_crew" position={[800, 1650]} scale={2.5} />

      {/* Camera / Operator Mid-Left */}
      <Equipment type="camera" position={[1600, 1700]} scale={2.5} />
      <Character type="camera_operator" position={[1350, 1700]} scale={2.5} />

      {/* Director Mid-Right */}
      <Character type="director" position={[2200, 1700]} scale={2.5} />

      {/* Boom Operator Right */}
      <Character type="boom_operator" position={[3100, 1700]} scale={2.5} />
      {/* Boom pole placed slightly above his hand */}
      <Equipment type="boom_mic" position={[3200, 1250]} scale={2.0} />

      {/* Foreground Overlay - Financial Dust/Currency */}
      <FloatingCurrency {...config.currency} />
    </AbsoluteFill>
  );
};
