# GiantAnimator — Regras de Ouro Visuais
> Baseado em: Highcharts Demo, Highcharts Best Practices, princípios de DataViz
> Última atualização: 2026-04-06
> Status: 🔒 IMUTÁVEL — estas regras NUNCA são sobrescritas pela calibração

---

## 🥇 REGRA NÚMERO 1 — Lei Suprema

> **Sempre dar preferência ao layout original do gráfico.**
>
> Se o usuário enviou um gráfico de referência (imagem, screenshot, PDF),
> o componente gerado DEVE replicar fielmente:
> - Proporções e espaçamentos
> - Paleta de cores (extrair os hex exatos)
> - Tipo de fonte e tamanhos
> - Posição de labels, legendas e títulos
> - Estilo do grid (sólido, dashed, ausente)
> - Espessura e arredondamento dos elementos
>
> **O agente NÃO deve "melhorar" o design por conta própria.**
> Melhorias só são aplicadas quando o usuário pedir explicitamente.

---

## 🏗️ REGRAS DE ESTRUTURA E LAYOUT

### Área do gráfico (Plot Area)
- Margem interna (padding): mínimo `40px` em todos os lados
- Margem extra no topo para título: `+24px` quando título presente
- Margem extra na base para labels do eixo X rotacionados: `+32px`
- Proporção ideal canvas: `16:9` (1920×1080) ou `4:3` (1280×960)
- O gráfico NUNCA ocupa 100% do canvas — sempre deixar respiro visual

### Grid
- Linhas horizontais: sempre presentes em bar, line, area, scatter
- Linhas verticais: opcionais — usar apenas quando X é contínuo (scatter, candlestick)
- Cor do grid: `rgba(255,255,255,0.08)` (dark) ou `rgba(0,0,0,0.08)` (light)
- Estilo: `dashed` — nunca `solid` para grid secundário
- Linha zero (baseline): destacada com opacidade maior `rgba(255,255,255,0.25)`

### Eixos
- Eixo Y: labels alinhados à direita, sem bordas, apenas o texto
- Eixo X: labels centralizados sob cada barra/ponto
- Nunca mostrar a linha do eixo (axisLine) — apenas o grid transmite a escala
- Tick marks: invisíveis — o grid já cumpre essa função
- Escala Y: sempre começa em 0 (exceto candlestick e scatter com range específico)

---

## 🎨 REGRAS DE CORES

### Paleta padrão GiantAnimator (quando sem referência)
- Série 1: #7CB5EC (azul suave — Highcharts default)
- Série 2: #F7A35C (laranja)
- Série 3: #90ED7D (verde)
- Série 4: #E4D354 (amarelo)
- Série 5: #8085E9 (roxo)
- Série 6: #F15C80 (rosa)
- Série 7: #2B908F (teal)
- Série 8: #E75480 (magenta)

### Regras de aplicação
- Máximo 8 séries simultâneas — acima disso, usar agrupamento
- Fundo do canvas: `#1a1a2e` (dark padrão) ou conforme referência
- Transparência em área charts: `rgba(cor, 0.3)` para fill, `1.0` para stroke
- Hover/destaque: aumentar brilho `+20%` (filter: brightness(1.2))
- Cores desativadas (legenda): `rgba(cor, 0.2)` — nunca remover o elemento
- Gradiente em barras (opcional): do topo `cor` para base `rgba(cor, 0.7)`

### Contraste e Acessibilidade
- Texto sobre fundo escuro: mínimo `#CCCCCC`
- Labels de valor: `#FFFFFF` com `text-shadow: 0 1px 3px rgba(0,0,0,0.6)`
- Nunca usar vermelho e verde como único diferenciador (daltonismo)

---

## 📊 REGRAS POR TIPO DE GRÁFICO

### Bar Chart (Vertical / Horizontal)
- Largura da barra: 60–70% do espaço disponível por categoria
- Gap entre barras: 30–40% (nunca < 20% nem > 50%)
- Barras agrupadas: gap interno 4px, grupo separado por 16px
- Cantos arredondados: `borderRadius: 4px` no topo apenas
- Label de valor: acima da barra (vertical) ou à direita (horizontal)
  - Posição: `+8px` da ponta da barra
  - Tamanho: `12px`, peso `600`
- Barra negativa: mesma cor com `opacity: 0.7`, label abaixo/esquerda

### Line Chart
- Espessura da linha: `2.5px` para série principal, `1.5px` para secundárias
- Dots/pontos: mostrar apenas em hover OU quando < 20 pontos
- Tamanho do ponto: `6px` raio (12px diâmetro)
- Smooth/curva: usar `cubic-bezier` — nunca linhas retas anguladas
- Linha de tendência: `dashed`, mesma cor com `opacity: 0.5`
- Múltiplas séries: cada uma com cor distinta da paleta, legenda obrigatória

### Multi-Line Chart
- Todas as regras do Line Chart +
- Legenda: sempre visível, posicionada no topo ou à direita
- Highlight on hover: linha hovered `opacity: 1.0`, demais `opacity: 0.3`
- Máximo recomendado: 6 séries (acima disso, considerar small multiples)

### Area Chart
- Fill: gradiente vertical — cor plena no topo, transparente na base
  - `opacity topo: 0.4`, `opacity base: 0.0`
- Múltiplas áreas: usar `stackedArea` quando sobreposição > 50%
- Linha do contorno: sempre presente, mesma cor do fill com `opacity: 1.0`
- Área zero-baseline: fill vai até y=0, nunca "flutua"

### Pie / Donut Chart
- Donut: buraco interno = 50% do raio externo
- Label externo: mostrar apenas quando fatia > 5%
- Label interno (donut): valor total centralizado no buraco
- Separação (explode) no hover: `+8px` do centro
- Fatias < 3%: agrupar em "Outros"
- Máximo de fatias: 8 — acima disso usar treemap ou bar chart
- Legenda: posição direita, alinhada verticalmente

### Scatter Plot
- Tamanho do ponto: `8px` raio padrão, variável se bubble chart
- Forma: círculo sólido com `opacity: 0.7` (permite ver sobreposições)
- Linha de regressão (opcional): `dashed`, cor neutra `#999999`
- Quadrantes: grid normal — não adicionar linhas de quadrante sem pedir
- Zoom: suportado — não recortar pontos nas bordas do plot area

### Waterfall Chart
- Barras de aumento: cor `#90ED7D` (verde)
- Barras de diminuição: cor `#F15C80` (vermelho/rosa)
- Barras de total/subtotal: cor `#7CB5EC` (azul) — destaque visual diferente
- Conector entre barras: linha horizontal fina `1px dashed rgba(255,255,255,0.3)`
- Label: sempre mostrar valor com sinal (`+1.200` / `-800`)

### Candlestick Chart
- Candle alta (close > open): `#90ED7D` (verde)
- Candle baixa (close < open): `#F15C80` (vermelho)
- Corpo (body): largura 60–70% do espaço da vela
- Sombra (wick/shadow): `1px` de espessura, mesma cor do corpo
- Volume (se presente): barra separada no eixo Y secundário, `opacity: 0.4`
- Eixo X: datas — formato `DD/MM` ou `MMM YY`

### Heatmap
- Escala de cores: degradê de 2–3 cores (ex: azul → branco → vermelho)
- Células: leve espaçamento `gap: 2px` para separar visualmente
- Label dentro da célula: apenas quando célula > 30×30px
- Escala (colorbar): obrigatória — posicionada à direita
- Valor nulo: cor neutra `#2a2a2a` — nunca transparente

---

## 🎬 REGRAS DE ANIMAÇÃO

### Princípios Gerais
- **Todo valor animado DEVE derivar de `useCurrentFrame()`** — sem setTimeout, sem CSS transitions
- Todas as animações usam `interpolate()` com `extrapolateRight: "clamp"`
- Duração padrão total do vídeo: `90 frames` (3s a 30fps)
- Animações não devem começar no frame 0 — dar `10 frames` de "respiro" inicial

### Timing por tipo de elemento
- entrada do gráfico (fade + scale): frames 0–20 (easing: ease-out)
- crescimento das barras/linhas: frames 10–60 (easing: spring)
- aparição de labels de valor: frames 50–70 (easing: ease-in)
- aparição da legenda: frames 60–80 (easing: ease-in)
- estado final (hold): frames 80–90

### Spring Config (Remotion)
```typescript
// Animação principal — barras, linhas, áreas
const SPRING_CONFIG_MAIN = {
  damping: 12,
  stiffness: 80,
  mass: 1.0,
  overshootClamping: false,  // permite leve bounce
};

// Animação de labels — sem bounce
const SPRING_CONFIG_LABELS = {
  damping: 20,
  stiffness: 120,
  mass: 0.8,
  overshootClamping: true,
};

// Animação sutil — linhas de grid, fade
const SPRING_CONFIG_SUBTLE = {
  damping: 25,
  stiffness: 100,
  mass: 0.5,
  overshootClamping: true,
};
```

### Animações por tipo de gráfico
- Bar Chart: crescimento de baixo para cima — height de 0 até valor final
- Line Chart: "desenho" da linha — strokeDashoffset de comprimento→0
- Area Chart: linha primeiro, depois fill aparece com fade
- Pie/Donut: rotação em sentido horário — cada fatia entra em sequência (+5 frames de delay)
- Scatter: pontos aparecem com scale 0→1 em sequência (stagger 2 frames)
- Waterfall: barras aparecem da esquerda para direita, uma a uma (stagger 4 frames)
- Candlestick: velas aparecem da esquerda para direita (stagger 3 frames)
- Heatmap: células aparecem em ondas diagonais (stagger por distância da origem)

### Proibições de Animação
- ❌ NUNCA usar setTimeout ou setInterval
- ❌ NUNCA usar CSS transition ou animation — o Remotion não renderiza isso
- ❌ NUNCA usar requestAnimationFrame
- ❌ NUNCA usar Math.random() — gera frames não-determinísticos
- ❌ NUNCA animar opacidade de 0 no frame final (sempre terminar em opacity >= 0.8)

---

## 🏷️ REGRAS DE TIPOGRAFIA E LABELS
### Hierarquia de texto
- Título do gráfico:     18–22px, weight 700, cor #FFFFFF
- Subtítulo:             13–14px, weight 400, cor #AAAAAA
- Labels dos eixos:      11–12px, weight 400, cor #999999
- Labels de valor:       11–13px, weight 600, cor #FFFFFF
- Legenda:               12px,    weight 400, cor #CCCCCC
- Fonte padrão:          'Inter', 'Helvetica Neue', sans-serif

### Formatação de números
- < 1.000:         mostrar inteiro         ex: 847
- 1.000–999.999:   usar "k"                ex: 12.4k
- ≥ 1.000.000:     usar "M"               ex: 3.2M
- Percentual:      sempre 1 casa decimal   ex: 24.7%
- Monetário:       prefixo R$ ou $         ex: R$ 1.4M
- Negativo:        sinal explícito         ex: -2.3k

### Posicionamento de labels
- Labels do eixo X: nunca sobrepostos — rotacionar -45° se necessário
- Labels de valor em barras pequenas (< 30px altura): mover para fora da barra
- Labels em pizza/donut < 5%: ocultar (legenda já cobre)
- Truncar texto longo: máximo 12 caracteres, adicionar …

---

## 🛡️ REGRAS DE EDGE CASES E ROBUSTEZ
```typescript
// SEMPRE verificar antes de .map()
if (!Array.isArray(data) || data.length === 0) {
  return <EmptyState message="Sem dados" />;
}

// SEMPRE clampar interpolações
interpolate(frame, [0, 60], [0, 1], {
  extrapolateLeft:  "clamp",
  extrapolateRight: "clamp",
});

// SEMPRE evitar divisão por zero
const barHeight = maxValue > 0 ? (value / maxValue) * plotHeight : 0;

// SEMPRE garantir altura mínima visível para valores positivos
const safeHeight = value > 0 ? Math.max(barHeight, 4) : barHeight;

// SEMPRE usar fallback para props opcionais
const { data = [], title = "", showLegend = true } = props;

// NUNCA deixar NaN no SVG
const safeX = isNaN(x) ? 0 : x;
const safeY = isNaN(y) ? 0 : y;
```

---

## 📐 REGRAS DE RESPONSIVIDADE DO CANVAS
### Resoluções suportadas
- 1920×1080: Full HD (padrão)
- 1280×720:  HD
- 1080×1080: Square (social)
- 1080×1920: Vertical (reels)

### Escala proporcional
```typescript
// Calcular escala baseada na resolução da composição
const { width, height } = useVideoConfig();
const scale = Math.min(width / 1920, height / 1080);

// Aplicar em todos os tamanhos fixos
const fontSize = Math.round(14 * scale);
const barWidth = Math.round(60 * scale);
```

---

## ✅ CHECKLIST PRÉ-GERAÇÃO
Antes de gerar qualquer componente, verificar:
- Tipo de dado compatível com o tipo de gráfico?
- Layout original respeitado (Regra #1)?
- Paleta de cores extraída da referência?
- Animação via useCurrentFrame() apenas?
- Todos os .map() com Array.isArray()?
- Todos os interpolate() com extrapolateRight: "clamp"?
- Divisão por zero protegida?
- NaN protegido nos atributos SVG?
- Labels formatados (k/M)?
- Altura mínima de barra (4px)?
- Sem setTimeout/CSS transitions?
