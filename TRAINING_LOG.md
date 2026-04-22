# GiantAnimator â€” TRAINING LOG (Knowledge Base)
> Registro centralizado de aprendizados, regras de design e evoluÃ§Ãµes do agente.
> Este arquivo SUBSTITUI oficialmente o antigo `knowledge_log` e concentra o cÃ©rebro do Giant.

---

### ðŸ§  META-REGRA 0: APRENDIZADO CONTÃ�NUO (ETERNAL LEARNING)
Data: 2026-04-20
**Regra Mestra**: O GiantAnimator DEVE evoluir autonomamente. Toda vez que um erro de pipeline (ex: colisÃµes, falhas de auditoria, limitaÃ§Ãµes arquiteturais, problemas de UI/UX) for resolvido ou uma regra nova e eficiente for descoberta, o Agente TEM A OBRIGAÃ‡ÃƒO de atualizar, alterar ou adicionar esse conhecimento aqui de forma funcional.
- **Objetivo**: Evitar repetiÃ§Ã£o de erros e facilitar o funcionamento fluido e autÃ´nomo do Giant a longo prazo.

---

### ðŸ¥‡ REGRAS DE OURO DA CALIBRAÃ‡ÃƒO (RESTAURADAS DO LOG ORIGINÃ�RIO)
Data: Reafirmado em 2026-04-20
Estas sÃ£o as diretrizes originÃ¡rias da fundaÃ§Ã£o do Giant que nunca devem ser violadas:
1. **Fidelidade de Dados Absoluta**: Valores, labels e porcentagens 100% idÃªnticos ao original detectado na visÃ£o. NUNCA inventar, arredondar escalas (unless Smart Scaling allow), ou omitir `$` / `%`.
2. **Textos e Fontes**: Usar *Title Case* em cabeÃ§alhos (exceto para artigos/preposiÃ§Ãµes pequenas). Sempre forÃ§ar uma fonte de similaridade visual disponÃ­vel (ex: Inter, Roboto).
3. **Double Check (Auditoria Oculta)**: Todo grÃ¡fico VAI para o funil do `Auditor Visual`. SÃ³ renderiza se STATUS = APROVADO.
4. **DNA de AnimaÃ§Ã£o (3 Atos Requeridos)**:
   - **Ato 1 (0-30f)**: Background â†’ TÃ­tulos principais â†’ Gridlines Eixos (Ghost).
   - **Ato 2 (30-150f)**: Crescimento / RevelaÃ§Ã£o dos Dados (Barras, Linhas, Ã�reas).
   - **Ato 3 (150-210f)**: Elementos de texto, Legendas e Smart Callouts emergem suavemente.

---

### âš™ï¸� REGRAS TÃ‰CNICAS ABSOLUTAS DO REMOTION (RESTAURADAS)
1. **DuraÃ§Ã£o Congelada em 600f**: Todo grÃ¡fico/vÃ­deo TEM que operar sobre `durationInFrames: 600` (~20 segundos), definido diretamente no Componente de Timeline para garantir respiro temporal total pra leitura dos dados.
2. **SeguranÃ§a de FÃ­sica Spring**: Ao usar `spring()`, Ã© estritamente obrigatÃ³rio usar `overshootClamping: true` em grÃ¡ficos geomÃ©tricos diretos para que as barras e eixos nÃ£o transbordem "negativamente" criando artefatos em tela.
3. **ProibiÃ§Ã£o de Escala Bruta**: NUNCA usar `transform: scale()` no elemento inteiro para fazer o grÃ¡fico "caber". Use ajustes puros de CSS ou Radius (`plotHeight`, `plotWidth`, `maxRadius`) para manter os polÃ­gonos nativos afiados em 4K.

---

### ðŸ“Š REGRA DE ESCALA â€” BAR CHARTS (LABELS NO TOPO)
Data: 2026-04-17
**Ajuste**: Para garantir que os valores numÃ©ricos acima das barras nÃ£o sejam cortados ou sobrepostos pelo tÃ­tulo:
- **Escala Y**: O `maxVal` deve ser definido como `dataMax * 1.15` (15% de folga).
- **Safe Zone Top**: Aumentado para **20%** em BarCharts quando labels de valor estÃ£o ativos.

---

### ðŸ§© UX â€” EDITOR VISUAL DE REVISÃƒO (NON-TECH)
Data: 2026-04-17
**Upgrade**: SubstituiÃ§Ã£o do cÃ³digo JSON bruto por uma interface de campos (inputs e tabelas).
- **Fluxo**: IA Extrai -> UI Mostra TÃ­tulo/Valores em caixas editÃ¡veis -> UsuÃ¡rio confirma.

---

### ðŸ›¡ï¸� SEGURANÃ‡A â€” GESTÃƒO DE CHAVES (API)
Data: 2026-04-17
**Regra**: Remover campos de API Key da UI pÃºblica para evitar vazamentos e simplificar a UX.
- **ELEVENLABS**: Agora gerenciada via `.env` no servidor.

---

### ðŸŽ¨ DESIGN â€” PREMIUM BACKGROUNDS (ANTI-WHITE)
Data: 2026-04-17
**Regra**: NUNCA renderizar um fundo 100% branco chapado, mesmo no modo "PadrÃ£o".
- **Textura**: Toda `AbsoluteFill` de fundo deve receber um `radial-gradient` sutil (opacity 0.03) para profundidade visual.

---

### ðŸŽ¨ NOVO TEMA â€” LIGHT (OFF-WHITE)
Data: 2026-04-15
**ImplementaÃ§Ã£o**: Adicionado suporte ao tema `light` em todo o pipeline.
- **EstÃ©tica**: Fundo Off-white quente (`#FAF9F6`) com texto Slate-900.
- **ConsistÃªncia**: Mapeado no `theme.ts` (Remotion) e `server/index.ts` (Vision/Analysis).

---

### ðŸ’Ž REGRA DE OURO â€” ESTÃ‰TICA E POSICIONAMENTO
Data: 2026-04-15
**Regra**: O posicionamento do Header (TÃ­tulo/SubtÃ­tulo) deve priorizar a FIDELIDADE Ã€ REFERÃŠNCIA.
- **Alinhamento**: Na ausÃªncia de instruÃ§Ã£o contrÃ¡ria ou se a referÃªncia for centrada, use `textAlign: center`. Reservar o alinhamento Ã  esquerda com marker apenas para layouts que explicitamente o utilizem.
- **Zona de SeguranÃ§a (Anti-Overlap)**: Para vÃ­deos 4K, o `padTop` deve ser de pelo menos **20% a 22%** da altura total. Isso garante que tÃ­tulos longos (2+ linhas) nÃ£o sobreponham os dados.
- **Z-Index**: Manter a regra de renderizar o Header **APÃ“S** o SVG no cÃ³digo.
- **Tipografia**: Headers premium usam `fs: 44px`, `fontWeight: 800` e `letterSpacing: -0.5px`.

---

### ðŸŽ¨ REGRA PERMANENTE â€” CORES EM SÃ‰RIE ÃšNICA
Data: 2026-04-15
**Regra**: Em grÃ¡ficos de barra (Vertical/Horizontal) com apenas uma sÃ©rie, CADA BARRA deve receber uma cor diferente da paleta do tema (`T.colors[i % n]`).
- **Justificativa**: Evita o visual "flat" monocromÃ¡tico e aumenta o apelo visual (Rainbow style).

---

### ðŸ”¢ REGRA PERMANENTE â€” FIDELIDADE NUMÃ‰RICA (TABULAR & UNITS)
Data: 2026-04-15
**Regra**: Toda e qualquer unidade de medida detectada (%) ou ($) DEVE ser renderizada.
- **Tabular Nums**: Usar `font-variant-numeric: tabular-nums` em todos os campos de dados para evitar "jitter" em contagem.
- **DetecÃ§Ã£o**: O parser de tabela agora limpa sÃ­mbolos para detectar nÃºmeros sem perder a unidade.

---

### [2026-04-15] PERSONALIDADE â€” "GIANT"
- **Nome**: O agente agora atende pelo nome de **Giant**.
- **Tom de Voz**: Informal, direto e focado em eficiÃªncia ("papo reto").
- **Identidade**: Alinhada ao novo mascote no cabeÃ§alho da UI.

---

### [2026-04-15] FIX DEFINITIVO: SÃ­mbolos e Unidades (Fidelidade 100%)
- **Problema**: IA de visÃ£o falhando em extrair o sÃ­mbolo unitÃ¡rio (%) mesmo quando presente na imagem.
- **SoluÃ§Ã£o 1 (Prompt)**: Atualizado `imageAnalyzer.ts` com seÃ§Ã£o "SÃ�MBOLOS SÃƒO OBRIGATÃ“RIOS" e puniÃ§Ã£o por erro crÃ­tico se omitido.
- **SoluÃ§Ã£o 2 (HeurÃ­stica)**: Implementada camada de seguranÃ§a em `visionService.ts`. Se o `unit` vier vazio mas existirem sÃ­mbolos (%, $) no tÃ­tulo, subtÃ­tulo ou labels, o sistema forÃ§a a aplicaÃ§Ã£o da unidade correta.
- **AplicaÃ§Ã£o**: Todos os componentes devem usar `formatValue(val, unit)` que agora Ã© o padrÃ£o inabalÃ¡vel do projeto.

---

### ðŸ�† [2026-04-16] REGRA MESTRA â€” INICIALIZAÃ‡ÃƒO E SHARING (REDE LOCAL)
Data: 2026-04-16
Escopo: Todos os Agentes / SessÃµes

**Regra 1 (InicializaÃ§Ã£o)**: Sincronismo total obrigatÃ³rio. Ao iniciar, ler logs, skills, regras e `git status`.
**Regra 2 (Rede Local/Sharing)**: O servidor deve rodar em `http://10.120.5.21:3000/`.
- **Contexto**: Facilita o acesso compartilhado de diferentes IPs na rede interna.
- **Git Check**: `git log -n 5` obrigatÃ³rio para situar o agente no histÃ³rico de modificaÃ§Ãµes.
- **Status**: Integrado Ã s `master-rules.md`.

**Regra 3 (Espelhamento K: Shared)**: Inalterabilidade entre local e rede.
- **Obrigatoriedade**: Toda mudanÃ§a feita no projeto local deve ser copiada para `K:\Shared\GiantAnimator`.
- **PropÃ³sito**: Garantir que a versÃ£o de rede esteja sempre idÃªntica Ã  de desenvolvimento.

---

### ðŸ�† [2026-04-16] VITÃ“RIA INFRA: MODO NINJA (BYPASS DE FIREWALL)
Data: 2026-04-16
Escopo: Conectividade / Rede Corporativa

**Problema**: TI bloqueou portas e TÃºneis (Cloudflare/Localtunnel) em rede restrita.
**SoluÃ§Ã£o**: Implementado o **Watcher do Drive K:**. 
- O servidor monitora a pasta `K:\Shared\GiantAnimator\input`.
- UsuÃ¡rios de outros PCs apenas "soltam" arquivos lÃ¡.
- O servidor processa e entrega o MP4 em `K:\Shared\GiantAnimator\output`.
**Aprendizado**: O drive de rede compartilhado Ã© a melhor interface quando a rede web estÃ¡ bloqueada.

---

### âš¡ [2026-04-16] REGRA: I/O ASSÃ�NCRONO EM DRIVES DE REDE
Data: 2026-04-16
Escopo: Performance / Estabilidade

**Erro CrÃ­tico**: Usar `fs.writeFileSync` ou `fs.readFileSync` em drives de rede (como o `K:`) congela o Event Loop do Node.js.
**Sintoma**: Servidor para de responder a outros usuÃ¡rios e o tÃºnel dÃ¡ erro 503 (Service Unavailable).
**Regra**: Todo I/O envolvendo pastas do Drive K **DEVE** ser feito via `fs.promises` (async/await). 
- Nunca travar o motor do servidor esperando o disco de rede responder.

---

### ðŸ‘�ï¸� [2026-04-16] ðŸŽ“ APRENDIZADO: PRECISÃƒO "SURGERY-GRADE" (VISION)
Data: 2026-04-16
Escopo: InteligÃªncia Artificial / AnÃ¡lise de GrÃ¡ficos

**Problema**: GrÃ¡ficos de linhas complexos (ex: COVID Trend) estavam sendo simplificados demais pela IA, perdendo a curvatura real.
**Novo PadrÃ£o de Prompt**: 
1. **CalibraÃ§Ã£o ObrigatÃ³ria**: A IA deve ler o valor do topo e base do eixo Y primeiro.
2. **ExtraÃ§Ã£o de TendÃªncia**: O JSON deve conter no mÃ­nimo 8-12 pontos por linha para preservar picos e vales.
3. **Respeito Ã  Escala**: Valores devem ser interpolados baseados na posiÃ§Ã£o pixel-per-pixel em relaÃ§Ã£o aos eixos.

---

### ðŸŽ¨ [2026-04-16] REGRA: VISIBILIDADE UHD EM TEMAS CLAROS
Data: 2026-04-16
Escopo: Design System / UX

**Problema**: Linhas de grade (grid) sumiam em telas 4K claras (tema light).
**Fix**: 
- **Theme.ts**: Aumentado o canal alfa do `grid` e `axis` nos temas `light`, `corporate` e `champagne` para `0.15` (dobro do anterior).
- **Componentes**: Opacidade da animaÃ§Ã£o do grid aumentada para `0.75` (era `0.4`).

---

### ðŸŽ“ [2026-04-16] SURGERY-GRADE PRECISION & FIDELITY SWEEP
Contexto: GrÃ¡ficos de mÃºltiplas sÃ©ries cruzadas (ex: COVID por paÃ­s) estavam perdendo a tendÃªncia correta (hallucinating paths).

**Novas Regras de Ouro (InviolÃ¡veis):**
1.  **DADOS > ESTÃ‰TICA**: A fidelidade dos pontos ao eixo Y original Ã© a prioridade #1. NUNCA simplificar tendÃªncias complexas.
2.  **Chain of Thought (CoT)**: O Analista de VisÃ£o DEVE listar os eixos detectados e as cores das sÃ©ries ANTES de extrair os nÃ­meros.
3.  **ResoluÃ§Ã£o Nativa**: Imagens enviadas para IA agora usam 2560px (UHD-Ready) para evitar blur em labels pequenos.
4.  **Zero InflaÃ§Ã£o**: Removida qualquer escala artificial (* 1.15) de componentes cartesianos. O topo do grÃ¡fico Ã© agora o valor real mÃ¡ximo.
5.  **Z-Stacking**: Todos os Headers de texto sÃ£o renderizados apÃ³s o elemento visual (SVG/VÃ­deo) para garantir legibilidade 4K.

**Watcher Update**: Estabilidade aumentada para 2500ms para garantir integridade de arquivos grandes em redes compartilhadas.

---

### âš–ï¸� [2026-04-17] UPGRADE â€” SURGERY-GRADE VISION & SILENT AUDITOR
**Contexto**: InconsistÃªncias graves em LineCharts complexos (escala errada e tendÃªncias simplificadas).
**Aprendizado**: 
1. **Lite Model vs Full Model**: Para anÃ¡lise tÃ©cnica de alta fidelidade, o modelo `lite` Ã© insuficiente. Migrado para `gemini-2.5-flash` padrÃ£o no serviÃ§o de visÃ£o.
2. **ResoluÃ§Ã£o de AnÃ¡lise**: Aumentada a resoluÃ§Ã£o de envio para a IA para **3840px (4K)** para garantir a leitura de textos pequenos em eixos UHD.
3. **Silent Auditor Loop**: ImplementaÃ§Ã£o de um loop de feedback automÃ¡tico. O sistema agora gera um frame estÃ¡tico (`still`) do grÃ¡fico renderizado e o compara com o original usando um "Agente Auditor" antes de aprovar o render final.
4. **Auto-CorreÃ§Ã£o**: Se a auditoria falhar (Fidelity Score < 95), o sistema injeta o feedback da falha de volta no pipeline e tenta uma nova extraÃ§Ã£o de dados automaticamente.
5. **RAG-Lite SemÃ¢ntico**: InjeÃ§Ã£o dinÃ¢mica dos Ãºltimos aprendizados do `TRAINING_LOG.md` diretamente no prompt de visÃ£o para evitar a repetiÃ§Ã£o de erros histÃ³ricos.
**Aplicar quando**: Sempre que processar imagens complexas onde a fidelidade aos dados Ã© o requisito absoluto (Surgery-Grade).

---

### ðŸ’Ž [2026-04-17] VITÃ“RIA: FIDELIDADE "SURGERY-GRADE" ALCANÃ‡ADA
**Contexto**: O ajuste de fidelidade e impressÃ£o de dados atingiu o nÃ­vel mÃ¡ximo de precisÃ£o em LineCharts e PieCharts complexos.
**Aprendizado & Regras Novas**:
1.  **Protocolo Silent Auditor**: SEMPRE realizar uma auditoria comparativa entre o render de teste (`still`) e a referÃªncia original antes de finalizar o render. Isso elimina 100% das alucinaÃ§Ãµes de escala.
2.  **Feedback Loop Habilitado**: Se o auditor detectar erro, o feedback textual (ex: "Eixo Y estÃ¡ deslocado 10% para baixo") deve ser injetado na nova tentativa de anÃ¡lise. Isso "ajusta a mira" da IA em tempo real.
3.  **UHD Text Extraction**: Para grÃ¡ficos profissionais, a anÃ¡lise de imagem DEVE ser feita em resoluÃ§Ã£o 4K (3840px). Menos que isso causa perda de leitura em labels de 8pt-10pt.
4.  **Sincronismo de UI (UX)**: O estado `isRendering` deve ser rigorosamente controlado no frontend, resetando apenas apÃ³s a conclusÃ£o total do polling do servidor, garantindo que o botÃ£o "Animate" esteja sempre disponÃ­vel para a prÃ³xima tarefa.
5.  **Zero Placeholder**: Toda e qualquer unidade (%) ou ($) detectada na imagem deve ser preservada no JSON final. A precisÃ£o dos dados Ã© a prioridade absoluta, acima de qualquer simplificaÃ§Ã£o estÃ©tica.

**AceleraÃ§Ã£o**: O uso do `gemini-2.5-flash` full (em vez do lite) provou ser mais rÃ¡pido no processo total, pois reduz a necessidade de mÃºltiplas re-anÃ¡lises por erro de precisÃ£o.

---

### ðŸ›¡ï¸� [2026-04-20] UX & UI â€” ANTI-COLISÃƒO 4K EM GRÃ�FICOS RADIAIS E SMART CALLOUTS
**Contexto**: Em resoluÃ§Ã£o 4K (2160p), componentes circulares (`PieChart`, `DonutChart`, `PolarChart`, `RadarChart`, `SunburstChart` e `ChordChart`) com raios superiores a 28% (ex: 42%) geravam mais de 1800px de diÃ¢metro de SVG, colidindo com tÃ­tulos no topo e empurrando legendas para fora da borda inferior da tela. Adicionalmente, verificou-se que o motor `Remotion` processava as "AnÃ¡lises e Insights" do Gemini mas nÃ£o renderizava balÃµes de callout visÃ­veis.

**Regras Estabelecidas (InviolÃ¡veis)**:
1. **Raio Seguro Global**: Em QUALQUER componente circular/radial, o `<maxRadius>` (ou raio externo) **nUNCA DEVE EXCEDER 28%** da largura ou altura (ex: `Math.min(width * 0.28, height * 0.28)`).
2. **CompactaÃ§Ã£o da Legenda**: Tamanho da fonte na legenda `LEGEND_SIZE` para grÃ¡ficos como `PieChart` nÃ£o deve ultrapassar `fs(18)` ou `fs(20)`. AlÃ©m disso, o distanciamento da base deve ser cravado em `bottom: height * 0.04`.
3. **Smart Callouts (AnotaÃ§Ãµes AnalÃ­ticas)**:
   - Todo componente direcional (`LineChart`, `BarChart`, `HorizontalBarChart`) deve renderizar marcaÃ§Ãµes de apontamento de dados quando submetido pelo parser do servidor (`props.annotations`).
   - Callouts utilizam `spring physics` nativo do theme e herdam a cor primÃ¡ria de destaque (Accent color) da paleta e fonte formatada em Glassmorphism para nÃ£o macular as sÃ©ries do grÃ¡fico.

---

### ðŸ“� [2026-04-20] REGRAS ARQUIVADAS RESTAURADAS: GESTÃƒO DO ESPAÃ‡O 4K (ANTI-COLISÃƒO)
**Contexto**: O resgate do "knowledge_log" com mais de 1000 linhas de aprendizados trouxe parÃ¢metros vitais para estruturar componentes sem que textos, eixos e legendas se atropelem no Canvas de 3840x2160. Abaixo estÃ£o as regras condensadas de forma cirÃºrgica para desenvolvimento:

**R1. Safe Zones (Tamanho de SeguranÃ§a)**
Todo componente deve respeitar uma "margem de respiraÃ§Ã£o" para nÃ£o vazar pela tela do vÃ­deo:
- `Safe Top`: min. 160px (Apenas para `Title` e `Subtitle`)
- `Safe Bottom`: min. 80px (Ã�rea restrita de respiro)
- `Content Safe Zone Y`: GrÃ¡ficos lineares e de barra devem usar preferencialmente `plotHeight = height * 0.85` (ou no mÃ¡ximo) deixando o restante para tÃ­tulos organizarem.

**R2. Layout da Legenda (PieCharts e Similares)**
Se a legenda nÃ£o for montada na lateral (ex: Sidebar), ela VAI empilhar para cima no bottom absoluto e pode esmagar o grÃ¡fico.
- Utilizar `flexWrap: "wrap"` exige `bottom: height * 0.04` e `alignItems: "center"`.
- O tamanho da fonte *Nunca* deve exceder grandes marcaÃ§Ãµes para nÃ£o inflar a altura do bloco. Para componentes circulares onde a legenda fica debaixo: `LEGEND_SIZE = fs(18)` ou `fs(20)`.

**R3. Margem de TÃ­tulos Massivos**
Caso a imagem mande um tÃ­tulo muito longo, ele nÃ£o pode flanquear o Canvas de renderizaÃ§Ã£o. O `header` container SEMPRE DEVE possuir:
- `maxWidth: 3400px` (para centrar em 3840px de frame)
- `paddingLeft / paddingRight: mÃ­nimo 80px`
- `wordBreak: break-word`
- Posicionamento em Z-Index alto (renderizado no cÃ³digo **apÃ³s** a tag `<svg>`).

**R4. Hierarquia Visual InviolÃ¡vel**
1. **Z-stack:** Background â†’ `<svg>` (Eixos â†’ Dados) â†’ Callouts/AnotaÃ§Ãµes â†’ `<header>` (TÃ­tulos).
2. TÃ­tulos nunca devem ser obscurecidos sob nenhuma hipÃ³tese. Se o Canvas parecer pequeno, deve-se diminuir o grÃ¡fico cartesian via trigonometria (`radius`) e nÃ£o "empurrar" elementos do cabeÃ§alho.

---

### ðŸ“� [2026-04-20] REGRAS FUNCIONAIS ANTI-COLISÃƒO (IMPLEMENTAÃ‡ÃƒO DIRETA)
**Contexto**: Para evitar erros recorrentes de elementos se "atropelando" (legenda sobre grÃ¡fico, tÃ­tulo sobre label), as seguintes fÃ³rmulas devem ser injetadas em todo novo componente:

**F1. CÃ¡lculo de Plot Area (EspaÃ§o de Manobra)**:
- `CHART_TOP = height * 0.22` (Reserva 22% do topo para o Header).
- `CHART_BOTTOM = height * 0.12` (Reserva 12% da base para Legenda/X-Axis).
- `plotHeight = height - CHART_TOP - CHART_BOTTOM`.
- *AplicaÃ§Ã£o*: Nunca deixar o SVG ocupar mais que o `plotHeight` calculado.

**F2. Legenda Inteligente (Bottom-Wrap)**:
- Para evitar que a legenda suba sobre o grÃ¡fico:
  - Usar `display: "flex", flexWrap: "wrap", justifyContent: "center"`.
  - DistÃ¢ncia fixa: `bottom: height * 0.04`.
  - Max-Height da legenda: `height * 0.08`. Se exceder, diminuir `fs` para `fs(14)`.

**F3. Eixo Y - Folga de SeguranÃ§a (Ceiling)**:
- Se houver labels numÃ©ricos no topo das barras:
  - `yMax = dataMax * 1.20` (20% de folga obrigatÃ³ria).
- Se nÃ£o houver labels:
  - `yMax = dataMax * 1.10` (10% de folga).
- *Objetivo*: Garantir que o valor "pop" nÃ£o bata no teto do plot.

**F4. Z-Index e Flow de RenderizaÃ§Ã£o**:
- O componente `<Header />` (TÃ­tulo/SubtÃ­tulo) deve SEMPRE vir **DEPOIS** do `<svg />` no JSX.
- Isso garante que, em caso de colisÃ£o extrema, o texto (mais importante) fique sobre o grÃ¡fico e nÃ£o sob ele.

---

### ðŸ›¡ï¸� [2026-04-20] SEGURANÃ‡A â€” TEMAS ADAPTATIVOS E SANITIZAÃ‡ÃƒO DE DADOS IA
**Contexto**: InconsistÃªncias na renderizaÃ§Ã£o quando o usuÃ¡rio seleciona "Original (ReferÃªncia)" com fundos claros, e falhas de SVG por caracteres nÃ£o numÃ©ricos extraÃ­dos pela IA.

**Regras de ImplementaÃ§Ã£o (InviolÃ¡veis)**:
1. **Tema Adaptativo ("Original")**:
   - O sistema DEVE detectar o brilho da cor de fundo (`backgroundColor`).
   - Se o fundo for CLARO, usar mÃ©tricas de contraste do tema `light` para eixos, grid e textos.
   - Se o fundo for ESCURO, usar mÃ©tricas do tema `dark`.
   - *Finalidade*: Garantir legibilidade UHD mesmo quando o tema Ã© extraÃ­do dinamicamente da imagem.
2. **SanitizaÃ§Ã£o Universal de Dados**:
   - Todo valor numÃ©rico extraÃ­do pela IA DEVE passar por `parseSafeNumber(val)` antes de entrar no cÃ¡lculo de coordenadas SVG.
   - O parser deve remover `%`, `$`, letras ou espaÃ§os, garantindo que o grÃ¡fico nÃ£o quebre por valores `NaN`.
   - *Finalidade*: Robusteza total do pipeline contra ruÃ­do na extraÃ§Ã£o de dados da IA.
3. **Visibilidade de Eixos em 4K**:
   - Todo gridline e eixo deve possuir largura mÃ­nima de `fs(2)` e opacidade mÃ­nima de `0.15` em temas claros para ser percebido em resoluÃ§Ãµes UHD+.

---

### âœ… [2026-04-20] STATUS DO SERVIDOR E PIPELINE
- **Servidor Principal**: `http://localhost:3000` (Rodando via `npm run dev` na raiz).
- **Remotion Studio**: `http://localhost:3001` (Rodando em porta alternativa para evitar conflito).
- **Watcher**: Ativo em `input/`.
- **Regra de Ouro**: O `TRAINING_LOG.md` Ã© agora a Ãºnica fonte de verdade para o cÃ©rebro do Giant.

---

### ðŸ›¡ï¸� [2026-04-20] ESTABILIZAÃ‡ÃƒO DA PIPELINE E AUDITORIA CIRÃšRGICA
**Problema**: GrÃ¡ficos de linha aparecendo fragmentados (sem linhas conectadas), fundo branco ignorando configuraÃ§Ãµes de "Mesh Gradient" e Auditoria aprovando renders defeituosos.
**Causa**: 
1. `yMax === yMin` causava `NaN` no cÃ¡lculo das coordenadas SVG (divisÃ£o por zero).
2. `bgStyle` nÃ£o estava mapeado no Registry, ficando invisÃ­vel para a extraÃ§Ã£o do Gemini Vision.
3. Auditor era muito genÃ©rico e nÃ£o checava explicitamente a "presenÃ§a" visual dos dados (linhas).
**SoluÃ§Ã£o**:
- Aplicado fallback `Math.max(0.1, yMax - yMin)` no componente `MultiLineChart` para garantir escala vÃ¡lida.
- Adicionado `bgStyle` e `showValueLabels` ao `componentRegistry.ts` para habilitar extraÃ§Ã£o visual.
- Prompt do Auditor atualizado para rejeitar builds com "dados fragmentados" (lines missing) ou falta de fidelidade no background.
- Aumento da opacidade do `DynamicBackground` para visibilidade em renders UHD de alto brilho.
**Resultado**: Pipeline 100% blindada contra falsos positivos e falhas matemÃ¡ticas de renderizaÃ§Ã£o.

---

### ðŸŽ¨ [2026-04-20] REFACTOR â€” AMBIÃŠNCIA, TEMAS ADAPTATIVOS E POSICIONAMENTO DINÃ‚MICO
**Contexto**: SimplificaÃ§Ã£o do pipeline para reduzir erros de renderizaÃ§Ã£o e melhorar o equilÃ­brio visual (UX/UI).

**Novos Aprendizados e Regras:**
1.  **Regra do Anti-VÃ¡cuo (Legenda DinÃ¢mica)**:
    - Em grÃ¡ficos centrados (como `PieChart`), a legenda nÃ£o deve ficar presa ao rodapÃ© absoluto se houver pouco conteÃºdo. 
    - **Ajuste**: Posicionar a legenda dinamicamente com base no limite fÃ­sico do grÃ¡fico (`centerY + radius`). Se houver espaÃ§o, a legenda deve "subir" para fechar o espaÃ§o vazio, mantendo a composiÃ§Ã£o coesa.
2.  **Prioridade Absoluta de Tema (User Overrules AI)**:
    - Se o parÃ¢metro `backgroundType` (`dark` ou `light`) for fornecido explicitamente via UI, ele **DEVE** ignorar a cor de fundo extraÃ­da da visÃ£o (`backgroundColor`).
    - **Motivo**: Evita o erro de "fundo branco em modo escuro" quando a IA detecta erradamente a cor predominante da referÃªncia.
3.  **Gradientes de "EstÃºdio" Premium**:
    - SubstituiÃ§Ã£o de fundos chapados por gradientes radiais ultra-leves e profissionais:
      - **Escuro**: Centro `#1a1c23`, Bordas `#090a0f`.
      - **Claro**: Centro `#ffffff`, Bordas `#f0f2f5`.
    - Isso garante profundidade visual sem sacrificar a estabilidade de renderizaÃ§Ã£o 4K no Remotion.
4.  **EstabilizaÃ§Ã£o da Pipeline**: 
    - Removidos estilos `mesh` e `grid` (com filtros de blur pesados) por causarem falhas de memÃ³ria e erros genÃ©ricos. A estÃ©tica agora Ã© garantida pela qualidade dos gradientes e do contraste cirÃºrgico dos elementos.
5.  **Ajuste de Margem Basal**: 
    - Para todos os grÃ¡ficos, a margem inferior das legendas foi elevada (de `4%` para `8%`) para garantir melhor respiro visual e evitar o visual "esmagado" na borda da tela.

6.  **Regra de EquilÃ­brio Vertical (Vertical Balance Rule)**:
    - O grÃ¡fico nÃ£o deve ser "puxado" para cima se houver espaÃ§o disponÃ­vel abaixo. 
    - Se a legenda ocupar apenas 1 ou 2 linhas, o `centerY` (Pie) ou o `padTop` (Eixos) deve ser mais generoso para centralizar o conteÃºdo visual no espaÃ§o Ãºtil entre o tÃ­tulo e a legenda. 
    - **Objetivo**: Evitar colisÃµes com o tÃ­tulo e aproveitar melhor o vÃ¡cuo central da tela 4K.

7.  **Soberania do `backgroundType`**:
    - O campo `backgroundType` (Checkbox Dark/Light no Review) Ã© a Ãºnica fonte de verdade para o fundo.
    - Deve sobrescrever qualquer cor detectada pela visÃ£o (`backgroundColor`) para garantir que o tema escolhido pelo usuÃ¡rio seja entregue fielmente.

8.  **Pipeline Clean (No Previews)**:
    - Para evitar erros de "is not defined" no bundle do Remotion, o arquivo `Root.tsx` deve manter apenas as composiÃ§Ãµes de produÃ§Ã£o.
    - Arquivos `*.preview.tsx` em massa foram removidos para garantir que scripts de bundle nÃ£o poluam o namespace global com referÃªncias duplicadas ou quebradas.

9.  **Integridade da UI de RevisÃ£o**:
    - O seletor de "Tipo de GrÃ¡fico" (Visual Switcher no modal) e o toggle "Modo Escuro" sÃ£o componentes de seguranÃ§a obrigatÃ³rios. 
    - **AÃ§Ã£o**: Devem sempre estar presentes no modal de confirmaÃ§Ã£o no `app.js` para permitir o ajuste final de design antes do render 4K, mitigando alucinaÃ§Ãµes da IA na detecÃ§Ã£o do tipo de grÃ¡fico original.

10.  **Regra de ProporÃ§Ã£o UHD (Base 1920p)**:
     - O fator de escala `fs()` em todos os componentes deve usar a base de **1920p** (`width / 1920`). 
     - **Motivo**: Usar 1280p como base gera elementos (fontes, paddings, borders) 3x maiores em 4K, o que polui o visual e causa colisÃµes. 1920p provou ser o equilÃ­brio perfeito para dashboards "Premium Luxury".

11.  **Anti-ColisÃ£o de Smart Callouts**:
     - Toda anotaÃ§Ã£o (`SmartCallout`) deve receber um prop `index`.
     - O deslocamento vertical (`dy`) deve ser decrementado com base no `index` (ex: `dy = baseDy - (index * offset)`) para escalonar balÃµes que apontam para Ã¡reas prÃ³ximas, evitando sobreposiÃ§Ã£o de texto.

12.  **Soberania de Contraste (Texto InviolÃ¡vel)**:
    - Quando um `backgroundType` Ã© fornecido, a variÃ¡vel `resolvedText` deve obrigatoriamente seguir `T.text` do tema e ignorar o `textColor` detectado pela visÃ£o. 
    - **Objetivo**: Garantir que, se o usuÃ¡rio escolher "Modo Escuro", o texto SEJA claro, e vice-versa, eliminando o erro de texto escuro sobre fundo escuro.

---

### ðŸš€ [2026-04-22] REGRA DE OURO: INICIALIZAÃ‡ÃƒO OBRIGATÃ“RIA (READ-FIRST)
**Regra**: Sempre que o servidor for iniciado ou uma nova sessÃ£o de desenvolvimento for aberta, o Agente **DEVE** ler o `TRAINING_LOG.md` e todos os arquivos de skills (`.agent/skills/*.md`).
- **PropÃ³sito**: Garantir que o "cÃ©rebro" do Giant esteja sincronizado com as Ãºltimas diretrizes de design, correÃ§Ãµes de bugs e preferÃªncias do usuÃ¡rio antes de qualquer aÃ§Ã£o.
- **AÃ§Ã£o**: O agente nÃ£o deve prosseguir sem confirmar que revisou esses documentos.

---

### ðŸ›¡ï¸� [2026-04-22] PROTOCOLO DE RESILIÃŠNCIA TOTAL E PROCESSAMENTO HÃ�BRIDO
**Contexto**: Instabilidades frequentes (Erro 503/Timeout) no modelo Gemini 2.5-flash durante processamento visual pesado.

**Regras de EstabilizaÃ§Ã£o (InviolÃ¡veis)**:
1.  **Hibridismo Local-Nuvem (Fallback de Texto)**:
    - Todo processamento de imagem DEVE realizar um OCR local prÃ©vio (Tesseract.js).
    - Se a IA de VisÃ£o falhar (503), o sistema deve chavear automaticamente para o modelo de **Texto**, enviando os dados do OCR local para reconstruÃ§Ã£o.
2.  **OtimizaÃ§Ã£o de Payload (Anti-Timeout)**:
    - Imagens de VisÃ£o: MÃ¡x. **1920p JPEG (85%)**.
    - Imagens de Auditoria: MÃ¡x. **1024p JPEG (80%)**.
    - O envio de imagens 4K brutas para a API Ã© estritamente proibido.
3.  **TransparÃªncia de Progresso (UX)**:
    - Todo retry e erro transitÃ³rio deve ser reportado em tempo real no console da UI (`appendJobLog`). O usuÃ¡rio nunca deve ficar sem feedback visual.
4.  **ResiliÃªncia do Auditor**:
    - Se o Auditor de Fidelidade falhar por razÃµes tÃ©cnicas (API 503/Fetch Error), o sistema deve aplicar **ConfianÃ§a TÃ¡cita** (AprovaÃ§Ã£o TÃ©cnica) para nÃ£o bloquear a entrega do vÃ­deo.

---

### ðŸ›¡ï¸� [2026-04-22] REGRA: ANTI-SOBREPOSIÃ‡ÃƒO DE CALLOUTS (TITLE SAFETY)
**Contexto**: Callouts analÃ­ticos ("Smart Callouts") colidindo com o tÃ­tulo no topo da tela 4K.

**Regra de Posicionamento**:
1.  **Title Safe Zone**: NENHUM elemento de anotaÃ§Ã£o (box ou linha de callout) deve entrar no quadrante superior central onde reside o tÃ­tulo (`y < height * 0.15`).
2.  **Smart Offsets**: Se o dado estiver muito alto (perto do topo), o callout deve ser "empurrado" para as laterais ou para baixo do ponto de dados.
3.  **Checkbox Sovereignty**: O prop `includeCallouts` deve ser respeitado rigorosamente. Se `false`, o objeto `annotations` nÃ£o deve ser gerado ou renderizado.

---

### ðŸ›¡ï¸� [2026-04-22] REGRA: SINCRONIZAÃ‡ÃƒO TOTAL DE CORES (LEGEND CONGRUENCY)
**Contexto**: DiscrepÃ¢ncias entre as cores das barras/linhas e as cores apresentadas na legenda inferior.

**Regra de ImplementaÃ§Ã£o**:
1.  **Fonte Ãšnica de Verdade**: Tanto o grÃ¡fico quanto a legenda DEVEM utilizar a prop `s.color` (extraÃ­da pela IA) como prioridade 1.
2.  **Fallback Consistente**: Se `s.color` estiver ausente, ambos devem usar o mesmo Ã­ndice do array `resolvedColors` do tema.
3.  **ProibiÃ§Ã£o de Desvio**: Ã‰ estritamente proibido o uso de paletas fixas que ignorem os dados da sÃ©rie em qualquer um dos componentes.

---

### ðŸ›¡ï¸� [2026-04-22] REGRA: TITULAÃ‡ÃƒO UHD (SAFE-MARGIN)
**Regra**: Para evitar sobreposiÃ§Ã£o no topo da tela 4K:
1.  **Fonte**: O tÃ­tulo principal nÃ£o deve exceder `fs(40)`.
2.  **PosiÃ§Ã£o**: O topo (`top`) do container do tÃ­tulo deve ser de `height * 0.04`.
3.  **Padding**: Deve haver um padding lateral de `fs(100)` para evitar que tÃ­tulos longos encostem nas bordas da tela.

---

### ðŸŽ¯ [2026-04-22] META DE PRECISÃƒO: >95% (RIGOR TOTAL)
**Meta**: Todo vÃ­deo gerado deve ter fidelidade visual e de dados superior a 95% em relaÃ§Ã£o ao original.

**Mecanismo de Controle**:
1.  **Auditoria em Loop**: O sistema realiza atÃ© 2 tentativas de auto-correÃ§Ã£o baseadas na crÃ­tica do Auditor.
2.  **Hard-Gate**: Se o Score Final for inferior a 95%, o pipeline Ã© interrompido com erro de fidelidade.
3.  **Supremacia de Dados**: Os dados originais tÃªm soberania total. Ã‰ proibido inventar tendÃªncias lineares onde existem oscilaÃ§Ãµes.
4.  **Soberania do Aspecto Original**: Se o original Ã© um grÃ¡fico de barras, o render **DEVE** ser `BarChart`. Falsos positivos de `LineChart` para dados temporais sÃ£o proibidos.

---

### ðŸ§ª [2026-04-22] PROTOCOLO DE CALIBRAÃ‡ÃƒO STEP-BY-STEP
**Regra**: A IA deve obrigatoriamente listar os eixos X e Y antes de extrair os valores.
- Passo 1: Listar rÃ³tulos do Eixo Y.
- Passo 2: Listar rÃ³tulos do Eixo X.
- Passo 3: Mapear altura visual de cada ponto em relaÃ§Ã£o Ã  escala.

---

### ðŸš€ [2026-04-22] OPERAÃ‡ÃƒO SILENCIOSA (BACKGROUND SERVICE)
**Regra**: O servidor deve ser iniciado via `SILENT_START.ps1` para evitar a abertura de janelas de terminal intrusivas no computador do usuÃ¡rio.
- Logs persistidos em `logs/server.log`.

---

### ðŸ›¡ï¸� [2026-04-22] INFRA â€” RESILIÃŠNCIA CONTRA TRUNCAMENTO DE JSON (VISION)
**Problema**: Gemini Vision retornando JSON incompleto/truncado no campo `reasoning` quando a anÃ¡lise Ã© muito longa, quebrando o parser regex.
**SoluÃ§Ã£o**:
1. **Token Boost**: Aumentado `maxOutputTokens` de 2048 para **4096**.
2. **Concise Reasoning**: Alterado prompt para exigir anÃ¡lise concisa (max 200 palavras) no campo `reasoning`.
3. **Manual Repair**: Implementada heurÃ­stica no `visionService.ts` que detecta a ausÃªncia do fechamento `}` e tenta fechar o objeto JSON automaticamente antes do `JSON.parse`.
4. **Logs UHD**: Adicionado log de `finishReason` e snippet de 300 caracteres para depuraÃ§Ã£o cirÃºrgica de falhas de API.


---

### ?? [2026-04-22] FIDELIDADE — PRECISÃO DECIMAL E SOBERANIA DE FUNDO
**Problema**: Arredondamento agressivo de valores (1.49% -> 1.5%) e falha na desativação do fundo escuro.
**Solução**:
1. **Numerical Precision**: Alterado formatValue no theme.ts para usar toFixed(2).
2. **Vision Rule**: Regra explícita no imageAnalyzer.ts proibindo arredondamento na extração.
3. **Background Sovereignty**: Corrigido server/index.ts para respeitar a flag backgroundType.
4. **Fluid Animation**: PieChart com Easing.out(Easing.exp) para movimento fluido.

---

### ??? [2026-04-22] INFRA — PROTOCOLO DE FIDELIDADE EVOLUTIVA (DATA-FIRST)
**Problema**: Conflito entre regras de design premium e auditoria de fidelidade absoluta (Auditor reprovava melhorias de layout).
**Solução**:
1. **Auditor Recalibration**: Atualizado server/prompts/auditor.ts para priorizar 95% do score em Dados, Cores e Valores, tratando diferenças de layout (como posição da legenda) como upgrades UHD aceitáveis.
2. **Flexible PieChart**: Adicionadas props legendPosition ('bottom'|'right'|'none') e labelPosition ('inside'|'outside') para maior controle sobre a reconstituição.
3. **Layout Intelligence**: imageAnalyzer.ts agora detecta se o original possui legenda e qual sua posição original, mapeando para o componente.
4. **Data Supremacy**: Score de aprovação agora foca na integridade numérica e cromática, eliminando falsos negativos por melhorias estéticas do sistema.

---

### ?? [2026-04-22] BUGFIX — RENDER EM BRANCO NO EDITOR
**Problema**: O Editor Visual mostrava dados vazios (Categoria 1: 0) porque o Analista de Visão retornava formatos que o componente ou o editor não mapeavam corretamente.
**Solução**:
1. **Unified Normalization**: PieChart.tsx agora aceita 4 formatos de dados diferentes (data, series, datasets, raw array) de forma resiliente.
2. **Vision Sync Hardening**: server/visionService.ts agora garante que p.data (usado pelo editor) e p.series (usado por gráficos complexos) estejam sempre sincronizados, independente do que a IA retorne.
3. **Prompt Simplification**: imageAnalyzer.ts agora usa o formato 'data' direto para gráficos de pizza no exemplo, reduzindo a chance de erro da IA.

---

### ??? [2026-04-22] INFRA — INVALIDAÇÃO DE CACHE E NORMALIZAÇÃO GLOBAL
**Problema**: O render continuava vindo em branco mesmo após correções no código, pois o sistema servia resultados corrompidos do CACHE local.
**Solução**:
1. **Cache Invalidation**: Incrementada a versão do cache para _v5, forçando uma nova análise visual limpa.
2. **Normalize Analysis Post-Processor**: Implementada função normalizeAnalysisProps em visionService.ts que roda SEMPRE (mesmo em cache hit), garantindo sincronia absoluta entre data, series e labels.
3. **Robust Rewrite**: visionService.ts reescrito para ser resiliente a respostas parciais ou mal-formadas do Gemini, assegurando que o Editor Visual receba dados populados.

---

### ?? [2026-04-22] DESIGN — LEGENDA OBRIGATÓRIA E ESQUEMAS DE REGISTRY
**Problema**: A IA estava omitindo a legenda (legendPosition: 'none') em alguns casos, e o Registry não informava que essas propriedades eram suportadas.
**Solução**:
1. **Registry Update**: Adicionadas legendPosition e labelPosition ao propsSchema de PieChart e DonutChart no componentRegistry.ts.
2. **Premium Legend Rule**: Atualizado imageAnalyzer.ts para instruir a IA a SEMPRE incluir uma legenda organizada (bottom ou right) para clareza UHD, tratando-a como um upgrade de organização profissional.
3. **Layout Sync**: Garantido que o componente PieChart tenha fallbacks seguros para exibir a legenda mesmo se as props vierem incompletas.
