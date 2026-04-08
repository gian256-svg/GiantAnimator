<!-- GiantAnimator Context Cache -->
<!-- Gerado em: 2026-04-06T18:37:37.033Z -->
<!-- NÃO EDITE MANUALMENTE — gerado por load-context.ts -->

# ── SYSTEM PROMPT ──

# GiantAnimator Agent System Prompt

Você é o Antigravity, o agente de IA responsável pela automação do projeto GiantAnimator.
Seu objetivo é transformar imagens de gráficos (charts) em vídeos animados de alta qualidade usando Remotion.

## Suas Responsabilidades
1. **Análise**: Analisar prints de gráficos enviados para `shared/input/`.
2. **Extração**: Extrair dados (título, valores, categorias, tipo de gráfico) usando Gemini Vision.
3. **Geração**: Codificar componentes Remotion para animar esses dados.
4. **Renderização**: Controlar o pipeline de renderização para gerar o arquivo `.mp4` final em `shared/output/`.

Sempre siga as convenções do projeto e use suas skills conforme necessário.
Se aprender algo novo, pergunte ao usuário se deve registrar no knowledge base.

════════════════════════════════════════════════════════════

# ── AGENT SKILLS ──

## SKILL: giantanimator-core

---
name: giantanimator-core
description: Conhecimento central do projeto GiantAnimator. Usar SEMPRE em qualquer tarefa relacionada ao projeto — estrutura, convenções, fluxo de trabalho, regras de código e arquitetura geral.
metadata:
  author: gianluca
  version: "1.0"
---

# GiantAnimator — Core Skill

## O que é este projeto
GiantAnimator é um sistema de geração automática de animações de gráficos (charts) usando Remotion, controlado por um agente de IA (Gemini) via servidor Node.js/TypeScript.

## Estrutura do Projeto
GiantAnimator/
├── INICIAR.bat ← entrada principal, inicia tudo
├── server/ ← servidor Node.js + TypeScript
│   ├── index.ts ← entry point do servidor
│   ├── render.ts ← lógica de renderização Remotion
│   ├── scripts/backup.ts ← backup automático do system prompt
│   └── package.json
├── remotion-project/ ← componentes de animação React/Remotion
│   └── src/
├── .agent/ ← skills e knowledge base do agente
│   ├── skills/
│   └── knowledge/
└── ../shared/ ← pasta FORA do projeto (irmã)
    ├── input/ ← imagens a processar chegam aqui
    ├── output/ ← vídeos gerados saem aqui
    └── processed/ ← imagens já processadas vão aqui

## Regras Invioláveis
1. **Sempre TypeScript** — nunca JavaScript puro
2. **Nunca sobrescrever** arquivos sem confirmar antes
3. **Nunca commitar** `.env` ou chaves de API
4. **Sempre usar** `--transpile-only` no ts-node
5. **Erros nunca derrubam** o servidor — try/catch em tudo
6. **Logs com emojis** para facilitar leitura no console
7. **Commits em português** com mensagens descritivas

## Fluxo de Funcionamento
1. `INICIAR.bat` verifica ambiente → instala deps → inicia servidor → health check
2. Servidor monitora `../shared/input/` com chokidar + fs.watch + polling (3 camadas)
3. Arquivo detectado → entra na fila → espera estabilizar → render Remotion → move para processed
4. Vídeo `.mp4` gerado em `../shared/output/`

## Porta e Endpoints
- Porta padrão: `3000`
- `GET /health` → status do servidor, arquivos no input, estado da fila
- `GET /status` → estado da fila de processamento

## Convenções de Código
- Caminhos sempre com `path.resolve()` ou `path.join()` — nunca concatenação de string
- Variáveis de ambiente via `dotenv/config` no topo do arquivo
- Interfaces TypeScript para todos os props de componentes Remotion
- Cores e fontes centralizadas em arquivo de tema no remotion-project

---

## SKILL: rendering-workflow

---
name: rendering-workflow
description: Como funciona o pipeline de renderização do GiantAnimator. Usar quando trabalhar com render.ts, componentes Remotion, novos tipos de gráfico ou problemas de processamento de arquivos.
metadata:
  author: gianluca
  version: "1.0"
---

# Rendering Workflow

## Pipeline Completo
Imagem no input/ ↓ chokidar detecta (+ fs.watch + polling como fallback) ↓ addToQueue() — verifica extensão, evita duplicatas ↓ waitFileStable() — aguarda arquivo parar de crescer (500ms interval) ↓ renderFromImage() — chama Remotion bundler + renderer ↓ Vídeo .mp4 em shared/output/ ↓ Imagem movida para shared/processed/

## Extensões Suportadas
`.png`, `.jpg`, `.jpeg`, `.webp`, `.bmp`, `.gif`, `.tiff`

## Regras do Remotion
- Cada tipo de gráfico = um componente separado em `remotion-project/src/`
- Props sempre tipadas com TypeScript interfaces
- Nunca alterar `remotion.config.ts` sem confirmar
- Paleta de cores e fontes centralizadas em tema

## Problemas Conhecidos e Soluções
Ver `.agent/knowledge/known-issues.md`

---

## SKILL: training

---
name: training
description: Como registrar novos aprendizados, corrigir comportamentos e adicionar conhecimento permanente ao agente. Usar quando o usuário ensinar algo novo, corrigir um erro recorrente ou pedir para "lembrar" de algo.
metadata:
  author: gianluca
  version: "2.0"
---

# Training Skill — Como Aprender e Lembrar

## Quando usar esta skill
- Usuário diz "lembra disso", "sempre faça assim", "nunca faça aquilo"
- Usuário corrige um erro que já aconteceu antes
- Usuário ensina uma nova convenção ou preferência
- Usuário resolve um problema e quer que o agente saiba a solução

## Como registrar via API (servidor rodando)

### Novo aprendizado geral
```bash
curl -X POST http://localhost:3000/knowledge/training \
  -H "Content-Type: application/json" \
  -d '{
    "category": "CONVENÇÃO",
    "learned": "O que foi aprendido",
    "context": "Por que é importante",
    "applyWhen": "Quando aplicar esse conhecimento"
  }'
```

### Problema conhecido e solução
```bash
curl -X POST http://localhost:3000/knowledge/issue \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Nome do problema",
    "symptom": "O que acontece",
    "cause": "Por que acontece",
    "solution": "Como resolver"
  }'
```

### Convenção de código
```bash
curl -X POST http://localhost:3000/knowledge/convention \
  -H "Content-Type: application/json" \
  -d '{
    "section": "TypeScript",
    "rule": "Sempre usar path.resolve() para caminhos"
  }'
```

### Ver resumo do knowledge base
```bash
curl http://localhost:3000/knowledge/summary
```

## Regra Principal
Sempre que aprender algo novo e relevante, PROATIVAMENTE perguntar: "Quer que eu registre isso no knowledge base para não esquecer?" E se confirmado, usar a API acima para persistir.

════════════════════════════════════════════════════════════

# ── KNOWLEDGE BASE ──

## KNOWLEDGE: TRAINING_LOG.md

# Training Log — GiantAnimator

Histórico de aprendizados do agente. Atualizado sempre que algo novo é ensinado.

---

## [2026-04-06] — INFRAESTRUTURA
**Aprendi:** O servidor precisa do flag `--transpile-only` no ts-node para iniciar corretamente e rápido.
**Contexto:** Sem esse flag, o ts-node faz verificação completa de tipos e pode falhar ou demorar.
**Aplicar quando:** Sempre que escrever scripts de start, INICIAR.bat ou comandos npm.

---

## [2026-04-06] — DETECÇÃO DE ARQUIVOS
**Aprendi:** No Windows, apenas chokidar não é suficiente. É necessário 3 camadas de detecção: chokidar + fs.watch + polling setInterval a cada 5s.
**Contexto:** O usuário relatou várias vezes que arquivos no input não eram detectados mesmo com servidor rodando.
**Aplicar quando:** Qualquer modificação no sistema de watching de arquivos.

---

## [2026-04-06] — INICIALIZAÇÃO
**Aprendi:** O INICIAR.bat deve verificar nesta ordem: Node.js instalado → ts-node existe → .env existe → porta livre → instalar deps → iniciar servidor → health check com timeout de 60s.
**Contexto:** Problemas recorrentes ao iniciar o servidor sem ambiente preparado.
**Aplicar quando:** Qualquer alteração no INICIAR.bat ou processo de boot.

---

## [2026-04-06] — ESTRUTURA DE PASTAS
**Aprendi:** A pasta `shared/` fica FORA do projeto GiantAnimator, como irmã. Caminho: `../shared/` relativo à raiz do projeto.
**Contexto:** A estrutura foi definida assim para separar dados de código.
**Aplicar quando:** Qualquer referência a input/, output/ ou processed/.

---

## KNOWLEDGE: known-issues.md

# Problemas Conhecidos e Soluções — GiantAnimator

---

## ❌ Problema: Arquivos no input não são detectados
**Sintoma:** Servidor rodando mas imagens colocadas em shared/input/ não são processadas.
**Causa:** Watcher único (só chokidar) falha no Windows em alguns cenários.
**Solução:** Usar 3 camadas: chokidar + fs.watch + polling setInterval 5s. Ver implementação em server/index.ts.

---

## ❌ Problema: Servidor não inicia (erro de compilação)
**Sintoma:** INICIAR.bat aguarda 60s e mostra erro no log.
**Causa:** ts-node sem --transpile-only faz type-checking completo e pode falhar.
**Solução:** Sempre usar `ts-node --transpile-only index.ts` no script de start.

---

## ❌ Problema: Porta 3000 já em uso ao reiniciar
**Sintoma:** Erro EADDRINUSE ao iniciar o servidor.
**Causa:** Processo anterior não foi encerrado corretamente.
**Solução:** INICIAR.bat mata o processo anterior na porta via netstat + taskkill antes de iniciar.

---

## ❌ Problema: node_modules ausente após git clone
**Sintoma:** Erro "Cannot find module" ao iniciar.
**Solução:** INICIAR.bat verifica se node_modules existe e roda `npm install` automaticamente.

---

## KNOWLEDGE: project-conventions.md

# Convenções do Projeto — GiantAnimator

---

## TypeScript
- Sempre `--transpile-only` no ts-node
- Interfaces para todos os props de componentes Remotion
- `path.resolve()` e `path.join()` para caminhos — nunca string concatenation
- `dotenv/config` sempre no topo do arquivo principal

## Logs no Console
- Usar emojis para categorizar: 📥 entrada, ✅ sucesso, ❌ erro, ⚠️ aviso, 🔄 processo, 📦 arquivo, 🌐 rede
- Sempre incluir timestamp em logs de processamento: `[${new Date().toISOString()}]`

## Estrutura de Arquivos Novos
- Novas funcionalidades do servidor → módulo separado em `server/`
- Novos tipos de gráfico → componente separado em `remotion-project/src/`
- Nunca modificar `remotion.config.ts` sem confirmar com usuário

## Git
- Mensagens de commit em português
- Nunca push direto na main sem revisar
- `.env` sempre no `.gitignore`
- `agent-backup/history/` pode ser ignorado no `.gitignore`

## Variáveis de Ambiente
- Arquivo `.env` sempre em `server/.env`
- Chave `GEMINI_API_KEY` nunca no repositório
- Documentar variáveis necessárias no README

---

## KNOWLEDGE: calibration-status.md

# GiantAnimator — Status de Calibração
> Atualizado: 2026-04-06
> Este arquivo é a fonte da verdade sobre o que está pronto para produção.

---

## 🟢 Prontos para Produção

### Vertical Bar Chart
- Fase B | Testado com: Amostra Financeira 3
- barW 58%, spring damping:14 stiffness:60, stagger 6f
- Labels k/M, rotação -90° automática, ocultar < 30px

### Line Chart
- Fase C | Testado com dados reais
- draw esquerda→direita, 1500-2000ms, dots pop 300ms
- clipPath obrigatório, labels só em extremos

### Horizontal Bar Chart
- Fase B | Score 8/8 em 3 amostras
- MIN_ROW_HEIGHT 52px, multi-dataset automático
- 4 posições de label suportadas

---

## 🔴 Pendentes de Calibração
- Multi-Line Chart   — template criado, aguardando amostras
- Area Chart         — referência parcial: gradiente 0.5→0.1
- Donut/Pie Chart    — template criado
- Scatter Plot       — template criado
- Waterfall Chart    — template criado
- Candlestick Chart  — template criado
- Heatmap            — template criado

---

## 📋 Protocolo de Calibração
Para calibrar um novo gráfico:
1. Fornecer 3 imagens de referência com dados diferentes
2. Agente gera componente baseado nas regras gerais
3. Auditoria de 8 dimensões:
   - [ ] Proporções (barW, padding, espaçamento)
   - [ ] Cores (hex fidelidade)
   - [ ] Grid (dashes, opacidade)
   - [ ] Animação (tipo, duração, easing)
   - [ ] Labels (formato, posição, rotação)
   - [ ] Legenda (só se visível no original)
   - [ ] Edge cases (dados vazios, divisão por zero)
   - [ ] Multi-dataset (se aplicável)
4. Score 8/8 → status muda para 🟢
5. Documentar em `[nome]-rules.md`
6. Atualizar `remotion-components.md`
7. Chamar `POST /knowledge/reload`

---

## KNOWLEDGE: remotion-charts.md

# Remotion Charts — Regras Gerais de Animação
> Atualizado: 2026-04-06 | GiantAnimator

---

## ⛔ Regra Fundamental — Libs Proibidas
NUNCA use Chart.js, Recharts, Victory ou qualquer lib com animação própria.
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

---

## KNOWLEDGE: remotion-components.md

# GiantAnimator — Componentes Disponíveis
> Atualizado: 2026-04-06

---

## Status Geral
| Componente | Arquivo | Status | Composition ID |
|---|---|---|---|
| Vertical Bar | src/charts/BarChart.tsx | 🟢 Calibrado | BarChart |
| Line Chart | src/charts/LineChart.tsx | 🟢 Calibrado | LineChart |
| Horizontal Bar | src/charts/HorizontalBarChart.tsx | 🟢 Calibrado | HorizontalBar |
| Multi-Line | src/charts/MultiLineChart.tsx | 🔴 Pendente | MultiLine |
| Area Chart | src/charts/AreaChart.tsx | 🔴 Pendente | AreaChart |
| Donut/Pie | src/charts/PieChart.tsx | 🔴 Pendente | PieChart |
| Scatter Plot | src/charts/ScatterPlot.tsx | 🔴 Pendente | ScatterPlot |
| Waterfall | src/charts/WaterfallChart.tsx | 🔴 Pendente | WaterfallChart |
| Candlestick | src/charts/CandlestickChart.tsx | 🔴 Pendente | Candlestick |
| Heatmap | src/charts/Heatmap.tsx | 🔴 Pendente | Heatmap |

---

## Vertical Bar Chart (BarChart.tsx) 🟢
Props:
```typescript
interface BarChartProps {
  data: { label: string; value: number }[];
  title?: string;
  unit?: string;
  staggerFrames?: number;      // padrão: 6
  dataLabelPosition?: "top" | "inside-bar" | "hidden";
}
```
- `barW` = 58% do espaço da coluna
- Spring: `damping 14, stiffness 60`
- Labels: notação `k/M`, ocultar se `barHeight < 30px`
- Rotação: -90° automático com > 15 barras

## Line Chart (LineChart.tsx) 🟢
Props:
```typescript
interface LineChartProps {
  data: { label: string; value: number }[];
  title?: string;
  unit?: string;
  lineColor?: string;
  showDots?: boolean;          // padrão: true
  lineThickness?: number;      // padrão: 3 (range: 3-5)
}
```
- Animação: `evolvePath` (@remotion/paths)
- Dots: `pop` scale 0→1.2→1 em ~9 frames (300ms a 30fps)
- `clipPath` obrigatório nos bounds do SVG
- Labels: só em máximas/mínimas/ponto final

## Horizontal Bar Chart (HorizontalBarChart.tsx) 🟢
Props:
```typescript
interface HorizontalBarProps {
  datasets: {
    label: string;
    data: { label: string; value: number }[];
    color?: string;
  }[];
  title?: string;
  dataLabelPosition?: "below-axis" | "end-of-bar" | "inside-bar" | "center-bar";
}
```
- `MIN_ROW_HEIGHT`: 52px
- Detecta multi-dataset automaticamente
- Fallback `Array.isArray()` obrigatório

## Tema (theme.ts)
```typescript
import { THEME } from "../theme";
// THEME.colors       — background, surface, text, textMuted
// THEME.chartColors  — paleta de 7 cores para séries
// THEME.spring       — { bar, snappy, smooth, bouncy, noBlur }
// THEME.font         — family, weightBold, weightRegular
```

## Como Calibrar um Novo Componente
1. Criar `remotion-project/src/charts/NomeChart.tsx`
2. Adicionar `<Composition>` no `Root.tsx`
3. Testar com 3 amostras de dados reais diferentes
4. Preencher o template de calibração em `.agent/knowledge/[nome]-rules.md`
5. Atualizar status neste arquivo para 🟢
6. Chamar `POST /knowledge/reload`

## Estrutura Obrigatória de Todo Componente
```typescript
import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { THEME } from "../theme";

export interface NomeChartProps {
  data: { label: string; value: number }[];
  title?: string;
}

export const NomeChart: React.FC<NomeChartProps> = ({ data, title }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  // Array safety sempre:
  const safeData = Array.isArray(data) ? data : [];
  // ... lógica aqui
};
```

---

## KNOWLEDGE: remotion-spring.md

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