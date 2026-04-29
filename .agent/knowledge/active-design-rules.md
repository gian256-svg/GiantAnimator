# ACTIVE DESIGN & UI/UX RULES

Estas são as regras OBRIGATÓRIAS de estruturação dos componentes React/Remotion (Anti-Colisão 4K).

## 1. Zonas Seguras 4K (Safe Zones)
- **Top Safe Zone (Títulos)**: Mínimo 160px. O container de cabeçalho (`<header>`) deve reservar entre 20% e 22% do topo (`padTop`).
- **Bottom Safe Zone**: Mínimo 80px para evitar corte na base da tela.
- **Plot Area**: O componente visual em si (gráfico cartesiano) deve utilizar no máximo `height * 0.85` de altura útil (ou `height - CHART_TOP - CHART_BOTTOM`).

## 2. Anti-Colisão Radial (Gráficos Circulares)
- O `<maxRadius>` (ou raio externo) de QUALQUER componente circular (Pie, Donut, Radial) **NUNCA DEVE EXCEDER 28%** da largura ou altura (`Math.min(width * 0.28, height * 0.28)`). Raio maior que isso causa sobreposição massiva com títulos e legendas.

## 3. Legendas Inteligentes
- Se não forem laterais, devem possuir `display: "flex", flexWrap: "wrap", justifyContent: "center"`.
- Posição base: `bottom: height * 0.04`.
- A legenda nunca deve escalar indefinidamente. `LEGEND_SIZE` máximo recomendado: `fs(20)`.

## 4. Ordem de Renderização (Z-Index Flow)
- A hierarquia no React JSX deve sempre garantir que o Título/Subtítulo fique ACIMA dos gráficos.
- Ordem obrigatória: `Background -> <svg> -> Callouts -> <header>`.

## 5. Exceção de Escala: Racing Charts
- **RacingLineChart** NÃO utiliza a mesma lógica dos gráficos estáticos.
- **Duração**: Deve preencher ativamente todo o `durationInFrames` da timeline.
- **Zoom Fluido**: O Eixo Y muda dinamicamente, sem topo congelado, baseado nos valores presentes no trecho da corrida (Breathing Zoom).
- **Legenda Obrigatória**: A zona inferior (Legenda) é obrigatória para nomear os ícones das entidades correndo.

## 6. Auto-Contrast Guard
- A legibilidade do texto (`resolvedText`) é mais importante que o tema extraído. Se a IA sugerir fundo escuro e texto escuro, o sistema deve automaticamente intervir garantindo Alto Contraste (High Contrast Premium).
