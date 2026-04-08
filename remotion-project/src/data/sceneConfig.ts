import { z } from 'zod';

export const currencyConfigSchema = z.object({
  count: z.number(),
  speed: z.number(),
  drift: z.number(),
  opacityRange: z.tuple([z.number(), z.number()]),
});

export const sceneConfigSchema = z.object({
  currency: currencyConfigSchema,
});

export const defaultSceneConfig = {
  currency: {
    count: 20,
    speed: 0.3,
    drift: 10,
    opacityRange: [0.2, 0.4] as [number, number],
  }
};
