# ACTIVE CODING RULES (Remotion & Animations)

# Remotion Charts — Regras Gerais de Animação
> Atualizado: 2026-04-06 | GiantAnimator

---

## ⛔ Regra Fundamental — Libs Proibidas
NUNCA use Chart.js, RLychee, Victory ou qualquer lib com animação própria.
Essas libs usam requestAnimationFrame/CSS transitions — quebram no renderer do Remotion.
Remotion renderiza frame-a-frame: o tempo não "passa", ele é CALCULADO.
Todo valor animado DEVE derivar de `useCurrentFrame()`.

---

## 📐 Padrões Visuais Globais

### Grid
- Linhas horizontais tracejadas: `strokeDasharray="4 4"`, opacidade 0.3–0.4
- Nunca grade vertical (exceto scatter plot)
- `PAD.top = 80px` mínimo em todos os gráficos

### Tipografia / Labels
- Notação abreviada OBRIGATÓRIA para alta densidade:
  - >= 1.000.000 → sufixo "M" (ex: 5.69M)
  - >= 1.000    → sufixo "k" (ex: 999.83k)
  - Remover trailing zeros (6.0 → 6, exceto se auditor exigir fidelidade)
- Títulos: Title Case
- Labels de categoria: Sentence Case (respeitar ALL CAPS se original usar)
- Legenda: SOMENTE renderizar se houver texto de legenda visível no original

### Cores
- Paleta centralizada em `theme.ts` → `THEME.chartColors[]`
- Cores extraídas via pixel HEX quando há imagem de referência
- Multi-dataset: cores distintas por série, nunca repetir na mesma view

---

## 🎬 Padrões de Animação por Tipo

### Vertical Bar Chart 🟢 Calibrado
- Entrada: `bottom-up` (cresce de baixo para cima)
- Spring: `damping: 14, stiffness: 60` (leve retorno elástico profissional)
- Stagger: delay de **6 frames** entre barras consecutivas
- Duração total: ~40 frames (~1200ms a 30fps)
- barW = **58% do colW** (espaço da coluna)

### Line Chart 🟢 Calibrado
- Entrada: `draw` — linha se desenha da esquerda para a direita
- Duração: **1500ms–2000ms** por série completa
- Easing: `ease-in-out` (suaviza início e fim do traçado)
- Dots: aparecem logo após a linha passar pelo ponto
  → animação `pop`: scale 0 → 1.2 → 1 em **300ms**
- Multi-linha: stagger entre séries, aparecem sequencialmente
- Espessura da linha: **3px–5px** (dominante, não polui)
- Labels ao longo do traçado: OMITIR exceto máximas/mínimas/ponto final
- Quando > 3 séries: labels inline omitidos, usar legenda lateral
- Known issue: múltiplos paths podem vazar margens → usar `clipPath` explícito nos bounds do SVG

### Horizontal Bar Chart 🟢 Calibrado
- `dataLabelPosition` suportados: `below-axis` | `end-of-bar` | `inside-bar` | `center-bar`
- `effectiveChartH` dinâmico baseado em `MIN_ROW_HEIGHT = 52px`
- Dataset único vs multi-dataset: componente detecta automaticamente
- Mime-types aceitos como referência: `.png .jpg .webp .bmp .gif .tiff .svg`
- Fallback obrigatório: `Array.isArray()` antes de qualquer `.map()`
- Fidelidade de decimais: não arredondar se auditor exigir (6.0 ≠ 6)

### Multi-Line Chart 🔴 Pendente calibração
- Template disponível — aguardando calibração com dados reais

### Area Chart 🔴 Pendente calibração
- Referência futura: opacidade sob a curva `0.5 → 0.1` gradiente descendente
- Deve usar `evolvePath` + `<path fill>` com clipPath animado

### Donut / Pie Chart 🔴 Pendente calibração
- Template disponível — aguardando calibração com dados reais

### Scatter Plot 🔴 Pendente calibração
- Template disponível — aguardando calibração com dados reais

### Waterfall Chart 🔴 Pendente calibração
- Template disponível — aguardando calibração com dados reais

### Candlestick Chart 🔴 Pendente calibração
- Template disponível — aguardando calibração com dados reais

### Heatmap 🔴 Pendente calibração
- Template disponível — aguardando calibração com dados reais

---

## 🛡️ Checklist Obrigatório (antes de gerar qualquer componente)
- [ ] Usa apenas `useCurrentFrame()` para animações
- [ ] Spring config confere com o tipo de gráfico calibrado
- [ ] Labels com notação abreviada k/M implementada
- [ ] `Array.isArray()` + fallbacks em todos os `.map()`
- [ ] `clipPath` definido para conter paths dentro dos bounds
- [ ] Legenda só renderiza se houver conteúdo visível
- [ ] `extrapolateRight: "clamp"` em todos os `interpolate()`


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
