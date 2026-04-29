# Remotion Spring & Interpolate — Referência Rápida
> Atualizado: 2026-04-06 | GiantAnimator

---

## interpolate()
```typescript
import { interpolate } from "remotion";

// Básico com clamp obrigatório
const opacity = interpolate(frame, [0, 20], [0, 1], {
  extrapolateRight: "clamp",
  extrapolateLeft: "clamp",
});

// Multi-ponto (fade in + sustain + fade out)
const y = interpolate(
  frame,
  [0, 15, 45, 60],
  [100, 0, 0, -100],
  { extrapolateRight: "clamp" }
);
```

## spring()
```typescript
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
const frame = useCurrentFrame();
const { fps } = useVideoConfig();

// Padrão profissional (leve elástico)
const progress = spring({
  frame,
  fps,
  config: { damping: 14, stiffness: 60 },
});

// UI responsiva (sem bounce)
const progress = spring({
  frame,
  fps,
  config: { damping: 20, stiffness: 200 },
});
```

## Configs de Spring por Caso de Uso

| Config | damping | stiffness | Uso |
|---|---|---|---|
| bar | 14 | 60 | Barras verticais (leve elástico profissional) |
| snappy | 20 | 200 | UI, entrada rápida |
| smooth | 30 | 80 | Linhas, transições suaves |
| bouncy | 8 | 100 | Efeito elástico pronunciado |
| noBlur | 200 | 200 | Sem overshoot, corte seco |

## Combinando spring + interpolate
```typescript
const progress = spring({ frame, fps, config: { damping: 14, stiffness: 60 } });
const barHeight = interpolate(progress, [0, 1], [0, maxBarHeight]);
```

## Stagger (delay por índice)
```typescript
data.map((item, i) => {
  const delay = i * 6; // 6 frames padrão entre elementos
  const progress = spring({
    frame: frame - delay, // negativo = ainda não iniciou (retorna ~0)
    fps,
    config: { damping: 14, stiffness: 60 },
  });
});
```

## durationInFrames (para linha/area)
```typescript
// Estica o spring para durar exatamente N frames (~1500-2000ms = 45-60f a 30fps)
const p = spring({
  frame,
  fps,
  durationInFrames: 54, // ~1800ms a 30fps
  config: { damping: 30, stiffness: 80 },
});
```

## Regras Absolutas
- SEMPRE `extrapolateRight: "clamp"` no `interpolate()`
- NUNCA usar `setTimeout`, `setInterval` ou CSS transitions
- `spring` com `frame - delay` negativo retorna ~0 automaticamente
- Tudo deve derivar de `useCurrentFrame()`
