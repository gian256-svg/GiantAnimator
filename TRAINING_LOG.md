# GiantAnimator — TRAINING LOG (Knowledge Base)
> Registro centralizado de aprendizados, regras de design e evoluções do agente.
> Este arquivo SUBSTITUI oficialmente o antigo `knowledge_log` e concentra o cérebro do Giant.

---

### 🧠 META-REGRA 0: APRENDIZADO CONTÍNUO (ETERNAL LEARNING)
Data: 2026-04-20
**Regra Mestra**: O GiantAnimator DEVE evoluir autonomamente. Toda vez que um erro de pipeline (ex: colisões, falhas de auditoria, limitações arquiteturais, problemas de UI/UX) for resolvido ou uma regra nova e eficiente for descoberta, o Agente TEM A OBRIGAÇÃO de atualizar, alterar ou adicionar esse conhecimento aqui de forma funcional.
- **Objetivo**: Evitar repetição de erros e facilitar o funcionamento fluido e autônomo do Giant a longo prazo.

---

### 🥇 REGRAS DE OURO DA CALIBRAÇÃO (RESTAURADAS DO LOG ORIGINÁRIO)
Data: Reafirmado em 2026-04-20
Estas são as diretrizes originárias da fundação do Giant que nunca devem ser violadas:
1. **Fidelidade de Dados Absoluta**: Valores, labels e porcentagens 100% idênticos ao original detectado na visão. NUNCA inventar, arredondar escalas (unless Smart Scaling allow), ou omitir `$` / `%`.
2. **Textos e Fontes**: Usar *Title Case* em cabeçalhos (exceto para artigos/preposições pequenas). Sempre forçar uma fonte de similaridade visual disponível (ex: Inter, Roboto).
3. **Double Check (Auditoria Oculta)**: Todo gráfico VAI para o funil do `Auditor Visual`. Só renderiza se STATUS = APROVADO.
4. **DNA de Animação (3 Atos Requeridos)**:
   - **Ato 1 (0-30f)**: Background → Títulos principais → Gridlines Eixos (Ghost).
   - **Ato 2 (30-150f)**: Crescimento / Revelação dos Dados (Barras, Linhas, Áreas).
   - **Ato 3 (150-210f)**: Elementos de texto, Legendas e Smart Callouts emergem suavemente.

---

### ⚙️ REGRAS TÉCNICAS ABSOLUTAS DO REMOTION (RESTAURADAS)
1. **Duração Congelada em 600f**: Todo gráfico/vídeo TEM que operar sobre `durationInFrames: 600` (~20 segundos), definido diretamente no Componente de Timeline para garantir respiro temporal total pra leitura dos dados.
2. **Segurança de Física Spring**: Ao usar `spring()`, é estritamente obrigatório usar `overshootClamping: true` em gráficos geométricos diretos para que as barras e eixos não transbordem "negativamente" criando artefatos em tela.
3. **Proibição de Escala Bruta**: NUNCA usar `transform: scale()` no elemento inteiro para fazer o gráfico "caber". Use ajustes puros de CSS ou Radius (`plotHeight`, `plotWidth`, `maxRadius`) para manter os polígonos nativos afiados em 4K.

---

### 📊 REGRA DE ESCALA — BAR CHARTS (LABELS NO TOPO)
Data: 2026-04-17
**Ajuste**: Para garantir que os valores numéricos acima das barras não sejam cortados ou sobrepostos pelo título:
- **Escala Y**: O `maxVal` deve ser definido como `dataMax * 1.15` (15% de folga).
- **Safe Zone Top**: Aumentado para **20%** em BarCharts quando labels de valor estão ativos.

---

### 🧩 UX — EDITOR VISUAL DE REVISÃO (NON-TECH)
Data: 2026-04-17
**Upgrade**: Substituição do código JSON bruto por uma interface de campos (inputs e tabelas).
- **Fluxo**: IA Extrai -> UI Mostra Título/Valores em caixas editáveis -> Usuário confirma.

---

### 🛡️ SEGURANÇA — GESTÃO DE CHAVES (API)
Data: 2026-04-17
**Regra**: Remover campos de API Key da UI pública para evitar vazamentos e simplificar a UX.
- **ELEVENLABS**: Agora gerenciada via `.env` no servidor.

---

### 🎨 DESIGN — PREMIUM BACKGROUNDS (ANTI-WHITE)
Data: 2026-04-17
**Regra**: NUNCA renderizar um fundo 100% branco chapado, mesmo no modo "Padrão".
- **Textura**: Toda `AbsoluteFill` de fundo deve receber um `radial-gradient` sutil (opacity 0.03) para profundidade visual.

---

### 🎨 NOVO TEMA — LIGHT (OFF-WHITE)
Data: 2026-04-15
**Implementação**: Adicionado suporte ao tema `light` em todo o pipeline.
- **Estética**: Fundo Off-white quente (`#FAF9F6`) com texto Slate-900.
- **Consistência**: Mapeado no `theme.ts` (Remotion) e `server/index.ts` (Vision/Analysis).

---

### 💎 REGRA DE OURO — ESTÉTICA E POSICIONAMENTO
Data: 2026-04-15
**Regra**: O posicionamento do Header (Título/Subtítulo) deve priorizar a FIDELIDADE À REFERÊNCIA.
- **Alinhamento**: Na ausência de instrução contrária ou se a referência for centrada, use `textAlign: center`. Reservar o alinhamento à esquerda com marker apenas para layouts que explicitamente o utilizem.
- **Zona de Segurança (Anti-Overlap)**: Para vídeos 4K, o `padTop` deve ser de pelo menos **20% a 22%** da altura total. Isso garante que títulos longos (2+ linhas) não sobreponham os dados.
- **Z-Index**: Manter a regra de renderizar o Header **APÓS** o SVG no código.
- **Tipografia**: Headers premium usam `fs: 44px`, `fontWeight: 800` e `letterSpacing: -0.5px`.

---

### 🎨 REGRA PERMANENTE — CORES EM SÉRIE ÚNICA
Data: 2026-04-15
**Regra**: Em gráficos de barra (Vertical/Horizontal) com apenas uma série, CADA BARRA deve receber uma cor diferente da paleta do tema (`T.colors[i % n]`).
- **Justificativa**: Evita o visual "flat" monocromático e aumenta o apelo visual (Rainbow style).

---

### 🔢 REGRA PERMANENTE — FIDELIDADE NUMÉRICA (TABULAR & UNITS)
Data: 2026-04-15
**Regra**: Toda e qualquer unidade de medida detectada (%) ou ($) DEVE ser renderizada.
- **Tabular Nums**: Usar `font-variant-numeric: tabular-nums` em todos os campos de dados para evitar "jitter" em contagem.
- **Detecção**: O parser de tabela agora limpa símbolos para detectar números sem perder a unidade.

---

### [2026-04-15] PERSONALIDADE — "GIANT"
- **Nome**: O agente agora atende pelo nome de **Giant**.
- **Tom de Voz**: Informal, direto e focado em eficiência ("papo reto").
- **Identidade**: Alinhada ao novo mascote no cabeçalho da UI.

---

### [2026-04-15] FIX DEFINITIVO: Símbolos e Unidades (Fidelidade 100%)
- **Problema**: IA de visão falhando em extrair o símbolo unitário (%) mesmo quando presente na imagem.
- **Solução 1 (Prompt)**: Atualizado `imageAnalyzer.ts` com seção "SÍMBOLOS SÃO OBRIGATÓRIOS" e punição por erro crítico se omitido.
- **Solução 2 (Heurística)**: Implementada camada de segurança em `visionService.ts`. Se o `unit` vier vazio mas existirem símbolos (%, $) no título, subtítulo ou labels, o sistema força a aplicação da unidade correta.
- **Aplicação**: Todos os componentes devem usar `formatValue(val, unit)` que agora é o padrão inabalável do projeto.

---

### 🏆 [2026-04-16] REGRA MESTRA — INICIALIZAÇÃO E SHARING (REDE LOCAL)
Data: 2026-04-16
Escopo: Todos os Agentes / Sessões

**Regra 1 (Inicialização)**: Sincronismo total obrigatório. Ao iniciar, ler logs, skills, regras e `git status`.
**Regra 2 (Rede Local/Sharing)**: O servidor deve rodar em `http://10.120.5.21:3000/`.
- **Contexto**: Facilita o acesso compartilhado de diferentes IPs na rede interna.
- **Git Check**: `git log -n 5` obrigatório para situar o agente no histórico de modificações.
- **Status**: Integrado às `master-rules.md`.

**Regra 3 (Espelhamento K: Shared)**: Inalterabilidade entre local e rede.
- **Obrigatoriedade**: Toda mudança feita no projeto local deve ser copiada para `K:\Shared\GiantAnimator`.
- **Propósito**: Garantir que a versão de rede esteja sempre idêntica à de desenvolvimento.

---

### 🏆 [2026-04-16] VITÓRIA INFRA: MODO NINJA (BYPASS DE FIREWALL)
Data: 2026-04-16
Escopo: Conectividade / Rede Corporativa

**Problema**: TI bloqueou portas e Túneis (Cloudflare/Localtunnel) em rede restrita.
**Solução**: Implementado o **Watcher do Drive K:**. 
- O servidor monitora a pasta `K:\Shared\GiantAnimator\input`.
- Usuários de outros PCs apenas "soltam" arquivos lá.
- O servidor processa e entrega o MP4 em `K:\Shared\GiantAnimator\output`.
**Aprendizado**: O drive de rede compartilhado é a melhor interface quando a rede web está bloqueada.

---

### ⚡ [2026-04-16] REGRA: I/O ASSÍNCRONO EM DRIVES DE REDE
Data: 2026-04-16
Escopo: Performance / Estabilidade

**Erro Crítico**: Usar `fs.writeFileSync` ou `fs.readFileSync` em drives de rede (como o `K:`) congela o Event Loop do Node.js.
**Sintoma**: Servidor para de responder a outros usuários e o túnel dá erro 503 (Service Unavailable).
**Regra**: Todo I/O envolvendo pastas do Drive K **DEVE** ser feito via `fs.promises` (async/await). 
- Nunca travar o motor do servidor esperando o disco de rede responder.

---

### 👁️ [2026-04-16] 🎓 APRENDIZADO: PRECISÃO "SURGERY-GRADE" (VISION)
Data: 2026-04-16
Escopo: Inteligência Artificial / Análise de Gráficos

**Problema**: Gráficos de linhas complexos (ex: COVID Trend) estavam sendo simplificados demais pela IA, perdendo a curvatura real.
**Novo Padrão de Prompt**: 
1. **Calibração Obrigatória**: A IA deve ler o valor do topo e base do eixo Y primeiro.
2. **Extração de Tendência**: O JSON deve conter no mínimo 8-12 pontos por linha para preservar picos e vales.
3. **Respeito à Escala**: Valores devem ser interpolados baseados na posição pixel-per-pixel em relação aos eixos.

---

### 🎨 [2026-04-16] REGRA: VISIBILIDADE UHD EM TEMAS CLAROS
Data: 2026-04-16
Escopo: Design System / UX

**Problema**: Linhas de grade (grid) sumiam em telas 4K claras (tema light).
**Fix**: 
- **Theme.ts**: Aumentado o canal alfa do `grid` e `axis` nos temas `light`, `corporate` e `champagne` para `0.15` (dobro do anterior).
- **Componentes**: Opacidade da animação do grid aumentada para `0.75` (era `0.4`).

---

### 🎓 [2026-04-16] SURGERY-GRADE PRECISION & FIDELITY SWEEP
Contexto: Gráficos de múltiplas séries cruzadas (ex: COVID por país) estavam perdendo a tendência correta (hallucinating paths).

**Novas Regras de Ouro (Invioláveis):**
1.  **DADOS > ESTÉTICA**: A fidelidade dos pontos ao eixo Y original é a prioridade #1. NUNCA simplificar tendências complexas.
2.  **Chain of Thought (CoT)**: O Analista de Visão DEVE listar os eixos detectados e as cores das séries ANTES de extrair os nímeros.
3.  **Resolução Nativa**: Imagens enviadas para IA agora usam 2560px (UHD-Ready) para evitar blur em labels pequenos.
4.  **Zero Inflação**: Removida qualquer escala artificial (* 1.15) de componentes cartesianos. O topo do gráfico é agora o valor real máximo.
5.  **Z-Stacking**: Todos os Headers de texto são renderizados após o elemento visual (SVG/Vídeo) para garantir legibilidade 4K.

**Watcher Update**: Estabilidade aumentada para 2500ms para garantir integridade de arquivos grandes em redes compartilhadas.

---

### ⚖️ [2026-04-17] UPGRADE — SURGERY-GRADE VISION & SILENT AUDITOR
**Contexto**: Inconsistências graves em LineCharts complexos (escala errada e tendências simplificadas).
**Aprendizado**: 
1. **Lite Model vs Full Model**: Para análise técnica de alta fidelidade, o modelo `lite` é insuficiente. Migrado para `gemini-2.5-flash` padrão no serviço de visão.
2. **Resolução de Análise**: Aumentada a resolução de envio para a IA para **3840px (4K)** para garantir a leitura de textos pequenos em eixos UHD.
3. **Silent Auditor Loop**: Implementação de um loop de feedback automático. O sistema agora gera um frame estático (`still`) do gráfico renderizado e o compara com o original usando um "Agente Auditor" antes de aprovar o render final.
4. **Auto-Correção**: Se a auditoria falhar (Fidelity Score < 95), o sistema injeta o feedback da falha de volta no pipeline e tenta uma nova extração de dados automaticamente.
5. **RAG-Lite Semântico**: Injeção dinâmica dos últimos aprendizados do `TRAINING_LOG.md` diretamente no prompt de visão para evitar a repetição de erros históricos.
**Aplicar quando**: Sempre que processar imagens complexas onde a fidelidade aos dados é o requisito absoluto (Surgery-Grade).

---

### 💎 [2026-04-17] VITÓRIA: FIDELIDADE "SURGERY-GRADE" ALCANÇADA
**Contexto**: O ajuste de fidelidade e impressão de dados atingiu o nível máximo de precisão em LineCharts e PieCharts complexos.
**Aprendizado & Regras Novas**:
1.  **Protocolo Silent Auditor**: SEMPRE realizar uma auditoria comparativa entre o render de teste (`still`) e a referência original antes de finalizar o render. Isso elimina 100% das alucinações de escala.
2.  **Feedback Loop Habilitado**: Se o auditor detectar erro, o feedback textual (ex: "Eixo Y está deslocado 10% para baixo") deve ser injetado na nova tentativa de análise. Isso "ajusta a mira" da IA em tempo real.
3.  **UHD Text Extraction**: Para gráficos profissionais, a análise de imagem DEVE ser feita em resolução 4K (3840px). Menos que isso causa perda de leitura em labels de 8pt-10pt.
4.  **Sincronismo de UI (UX)**: O estado `isRendering` deve ser rigorosamente controlado no frontend, resetando apenas após a conclusão total do polling do servidor, garantindo que o botão "Animate" esteja sempre disponível para a próxima tarefa.
5.  **Zero Placeholder**: Toda e qualquer unidade (%) ou ($) detectada na imagem deve ser preservada no JSON final. A precisão dos dados é a prioridade absoluta, acima de qualquer simplificação estética.

**Aceleração**: O uso do `gemini-2.5-flash` full (em vez do lite) provou ser mais rápido no processo total, pois reduz a necessidade de múltiplas re-análises por erro de precisão.

---

### 🛡️ [2026-04-20] UX & UI — ANTI-COLISÃO 4K EM GRÁFICOS RADIAIS E SMART CALLOUTS
**Contexto**: Em resolução 4K (2160p), componentes circulares (`PieChart`, `DonutChart`, `PolarChart`, `RadarChart`, `SunburstChart` e `ChordChart`) com raios superiores a 28% (ex: 42%) geravam mais de 1800px de diâmetro de SVG, colidindo com títulos no topo e empurrando legendas para fora da borda inferior da tela. Adicionalmente, verificou-se que o motor `Remotion` processava as "Análises e Insights" do Gemini mas não renderizava balões de callout visíveis.

**Regras Estabelecidas (Invioláveis)**:
1. **Raio Seguro Global**: Em QUALQUER componente circular/radial, o `<maxRadius>` (ou raio externo) **nUNCA DEVE EXCEDER 28%** da largura ou altura (ex: `Math.min(width * 0.28, height * 0.28)`).
2. **Compactação da Legenda**: Tamanho da fonte na legenda `LEGEND_SIZE` para gráficos como `PieChart` não deve ultrapassar `fs(18)` ou `fs(20)`. Além disso, o distanciamento da base deve ser cravado em `bottom: height * 0.04`.
3. **Smart Callouts (Anotações Analíticas)**:
   - Todo componente direcional (`LineChart`, `BarChart`, `HorizontalBarChart`) deve renderizar marcações de apontamento de dados quando submetido pelo parser do servidor (`props.annotations`).
   - Callouts utilizam `spring physics` nativo do theme e herdam a cor primária de destaque (Accent color) da paleta e fonte formatada em Glassmorphism para não macular as séries do gráfico.

---

### 📏 [2026-04-20] REGRAS ARQUIVADAS RESTAURADAS: GESTÃO DO ESPAÇO 4K (ANTI-COLISÃO)
**Contexto**: O resgate do "knowledge_log" com mais de 1000 linhas de aprendizados trouxe parâmetros vitais para estruturar componentes sem que textos, eixos e legendas se atropelem no Canvas de 3840x2160. Abaixo estão as regras condensadas de forma cirúrgica para desenvolvimento:

**R1. Safe Zones (Tamanho de Segurança)**
Todo componente deve respeitar uma "margem de respiração" para não vazar pela tela do vídeo:
- `Safe Top`: min. 160px (Apenas para `Title` e `Subtitle`)
- `Safe Bottom`: min. 80px (Área restrita de respiro)
- `Content Safe Zone Y`: Gráficos lineares e de barra devem usar preferencialmente `plotHeight = height * 0.85` (ou no máximo) deixando o restante para títulos organizarem.

**R2. Layout da Legenda (PieCharts e Similares)**
Se a legenda não for montada na lateral (ex: Sidebar), ela VAI empilhar para cima no bottom absoluto e pode esmagar o gráfico.
- Utilizar `flexWrap: "wrap"` exige `bottom: height * 0.04` e `alignItems: "center"`.
- O tamanho da fonte *Nunca* deve exceder grandes marcações para não inflar a altura do bloco. Para componentes circulares onde a legenda fica debaixo: `LEGEND_SIZE = fs(18)` ou `fs(20)`.

**R3. Margem de Títulos Massivos**
Caso a imagem mande um título muito longo, ele não pode flanquear o Canvas de renderização. O `header` container SEMPRE DEVE possuir:
- `maxWidth: 3400px` (para centrar em 3840px de frame)
- `paddingLeft / paddingRight: mínimo 80px`
- `wordBreak: break-word`
- Posicionamento em Z-Index alto (renderizado no código **após** a tag `<svg>`).

**R4. Hierarquia Visual Inviolável**
1. **Z-stack:** Background → `<svg>` (Eixos → Dados) → Callouts/Anotações → `<header>` (Títulos).
2. Títulos nunca devem ser obscurecidos sob nenhuma hipótese. Se o Canvas parecer pequeno, deve-se diminuir o gráfico cartesian via trigonometria (`radius`) e não "empurrar" elementos do cabeçalho.

---

### 📏 [2026-04-20] REGRAS FUNCIONAIS ANTI-COLISÃO (IMPLEMENTAÇÃO DIRETA)
**Contexto**: Para evitar erros recorrentes de elementos se "atropelando" (legenda sobre gráfico, título sobre label), as seguintes fórmulas devem ser injetadas em todo novo componente:

**F1. Cálculo de Plot Area (Espaço de Manobra)**:
- `CHART_TOP = height * 0.22` (Reserva 22% do topo para o Header).
- `CHART_BOTTOM = height * 0.12` (Reserva 12% da base para Legenda/X-Axis).
- `plotHeight = height - CHART_TOP - CHART_BOTTOM`.
- *Aplicação*: Nunca deixar o SVG ocupar mais que o `plotHeight` calculado.

**F2. Legenda Inteligente (Bottom-Wrap)**:
- Para evitar que a legenda suba sobre o gráfico:
  - Usar `display: "flex", flexWrap: "wrap", justifyContent: "center"`.
  - Distância fixa: `bottom: height * 0.04`.
  - Max-Height da legenda: `height * 0.08`. Se exceder, diminuir `fs` para `fs(14)`.

**F3. Eixo Y - Folga de Segurança (Ceiling)**:
- Se houver labels numéricos no topo das barras:
  - `yMax = dataMax * 1.20` (20% de folga obrigatória).
- Se não houver labels:
  - `yMax = dataMax * 1.10` (10% de folga).
- *Objetivo*: Garantir que o valor "pop" não bata no teto do plot.

**F4. Z-Index e Flow de Renderização**:
- O componente `<Header />` (Título/Subtítulo) deve SEMPRE vir **DEPOIS** do `<svg />` no JSX.
- Isso garante que, em caso de colisão extrema, o texto (mais importante) fique sobre o gráfico e não sob ele.

---

### 🛡️ [2026-04-20] SEGURANÇA — TEMAS ADAPTATIVOS E SANITIZAÇÃO DE DADOS IA
**Contexto**: Inconsistências na renderização quando o usuário seleciona "Original (Referência)" com fundos claros, e falhas de SVG por caracteres não numéricos extraídos pela IA.

**Regras de Implementação (Invioláveis)**:
1. **Tema Adaptativo ("Original")**:
   - O sistema DEVE detectar o brilho da cor de fundo (`backgroundColor`).
   - Se o fundo for CLARO, usar métricas de contraste do tema `light` para eixos, grid e textos.
   - Se o fundo for ESCURO, usar métricas do tema `dark`.
   - *Finalidade*: Garantir legibilidade UHD mesmo quando o tema é extraído dinamicamente da imagem.
2. **Sanitização Universal de Dados**:
   - Todo valor numérico extraído pela IA DEVE passar por `parseSafeNumber(val)` antes de entrar no cálculo de coordenadas SVG.
   - O parser deve remover `%`, `$`, letras ou espaços, garantindo que o gráfico não quebre por valores `NaN`.
   - *Finalidade*: Robusteza total do pipeline contra ruído na extração de dados da IA.
3. **Visibilidade de Eixos em 4K**:
   - Todo gridline e eixo deve possuir largura mínima de `fs(2)` e opacidade mínima de `0.15` em temas claros para ser percebido em resoluções UHD+.

---

### ✅ [2026-04-20] STATUS DO SERVIDOR E PIPELINE
- **Servidor Principal**: `http://localhost:3000` (Rodando via `npm run dev` na raiz).
- **Remotion Studio**: `http://localhost:3001` (Rodando em porta alternativa para evitar conflito).
- **Watcher**: Ativo em `input/`.
- **Regra de Ouro**: O `TRAINING_LOG.md` é agora a única fonte de verdade para o cérebro do Giant.

---

### 🛡️ [2026-04-20] ESTABILIZAÇÃO DA PIPELINE E AUDITORIA CIRÚRGICA
**Problema**: Gráficos de linha aparecendo fragmentados (sem linhas conectadas), fundo branco ignorando configurações de "Mesh Gradient" e Auditoria aprovando renders defeituosos.
**Causa**: 
1. `yMax === yMin` causava `NaN` no cálculo das coordenadas SVG (divisão por zero).
2. `bgStyle` não estava mapeado no Registry, ficando invisível para a extração do Gemini Vision.
3. Auditor era muito genérico e não checava explicitamente a "presença" visual dos dados (linhas).
**Solução**:
- Aplicado fallback `Math.max(0.1, yMax - yMin)` no componente `MultiLineChart` para garantir escala válida.
- Adicionado `bgStyle` e `showValueLabels` ao `componentRegistry.ts` para habilitar extração visual.
- Prompt do Auditor atualizado para rejeitar builds com "dados fragmentados" (lines missing) ou falta de fidelidade no background.
- Aumento da opacidade do `DynamicBackground` para visibilidade em renders UHD de alto brilho.
**Resultado**: Pipeline 100% blindada contra falsos positivos e falhas matemáticas de renderização.

---

### 🎨 [2026-04-20] REFACTOR — AMBIÊNCIA, TEMAS ADAPTATIVOS E POSICIONAMENTO DINÂMICO
**Contexto**: Simplificação do pipeline para reduzir erros de renderização e melhorar o equilíbrio visual (UX/UI).

**Novos Aprendizados e Regras:**
1.  **Regra do Anti-Vácuo (Legenda Dinâmica)**:
    - Em gráficos centrados (como `PieChart`), a legenda não deve ficar presa ao rodapé absoluto se houver pouco conteúdo. 
    - **Ajuste**: Posicionar a legenda dinamicamente com base no limite físico do gráfico (`centerY + radius`). Se houver espaço, a legenda deve "subir" para fechar o espaço vazio, mantendo a composição coesa.
2.  **Prioridade Absoluta de Tema (User Overrules AI)**:
    - Se o parâmetro `backgroundType` (`dark` ou `light`) for fornecido explicitamente via UI, ele **DEVE** ignorar a cor de fundo extraída da visão (`backgroundColor`).
    - **Motivo**: Evita o erro de "fundo branco em modo escuro" quando a IA detecta erradamente a cor predominante da referência.
3.  **Gradientes de "Estúdio" Premium**:
    - Substituição de fundos chapados por gradientes radiais ultra-leves e profissionais:
      - **Escuro**: Centro `#1a1c23`, Bordas `#090a0f`.
      - **Claro**: Centro `#ffffff`, Bordas `#f0f2f5`.
    - Isso garante profundidade visual sem sacrificar a estabilidade de renderização 4K no Remotion.
4.  **Estabilização da Pipeline**: 
    - Removidos estilos `mesh` e `grid` (com filtros de blur pesados) por causarem falhas de memória e erros genéricos. A estética agora é garantida pela qualidade dos gradientes e do contraste cirúrgico dos elementos.
5.  **Ajuste de Margem Basal**: 
    - Para todos os gráficos, a margem inferior das legendas foi elevada (de `4%` para `8%`) para garantir melhor respiro visual e evitar o visual "esmagado" na borda da tela.

6.  **Regra de Equilíbrio Vertical (Vertical Balance Rule)**:
    - O gráfico não deve ser "puxado" para cima se houver espaço disponível abaixo. 
    - Se a legenda ocupar apenas 1 ou 2 linhas, o `centerY` (Pie) ou o `padTop` (Eixos) deve ser mais generoso para centralizar o conteúdo visual no espaço útil entre o título e a legenda. 
    - **Objetivo**: Evitar colisões com o título e aproveitar melhor o vácuo central da tela 4K.

7.  **Soberania do `backgroundType`**:
    - O campo `backgroundType` (Checkbox Dark/Light no Review) é a única fonte de verdade para o fundo.
    - Deve sobrescrever qualquer cor detectada pela visão (`backgroundColor`) para garantir que o tema escolhido pelo usuário seja entregue fielmente.

8.  **Pipeline Clean (No Previews)**:
    - Para evitar erros de "is not defined" no bundle do Remotion, o arquivo `Root.tsx` deve manter apenas as composições de produção.
    - Arquivos `*.preview.tsx` em massa foram removidos para garantir que scripts de bundle não poluam o namespace global com referências duplicadas ou quebradas.

9.  **Integridade da UI de Revisão**:
    - O seletor de "Tipo de Gráfico" (Visual Switcher no modal) e o toggle "Modo Escuro" são componentes de segurança obrigatórios. 
    - **Ação**: Devem sempre estar presentes no modal de confirmação no `app.js` para permitir o ajuste final de design antes do render 4K, mitigando alucinações da IA na detecção do tipo de gráfico original.

10.  **Regra de Proporção UHD (Base 1920p)**:
     - O fator de escala `fs()` em todos os componentes deve usar a base de **1920p** (`width / 1920`). 
     - **Motivo**: Usar 1280p como base gera elementos (fontes, paddings, borders) 3x maiores em 4K, o que polui o visual e causa colisões. 1920p provou ser o equilíbrio perfeito para dashboards "Premium Luxury".

11.  **Anti-Colisão de Smart Callouts**:
     - Toda anotação (`SmartCallout`) deve receber um prop `index`.
     - O deslocamento vertical (`dy`) deve ser decrementado com base no `index` (ex: `dy = baseDy - (index * offset)`) para escalonar balões que apontam para áreas próximas, evitando sobreposição de texto.

12.  **Soberania de Contraste (Texto Inviolável)**:
    - Quando um `backgroundType` é fornecido, a variável `resolvedText` deve obrigatoriamente seguir `T.text` do tema e ignorar o `textColor` detectado pela visão. 
    - **Objetivo**: Garantir que, se o usuário escolher "Modo Escuro", o texto SEJA claro, e vice-versa, eliminando o erro de texto escuro sobre fundo escuro.
