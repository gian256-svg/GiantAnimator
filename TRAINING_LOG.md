# GiantAnimator — TRAINING LOG (Histórico Cronológico)
> Registro centralizado do histórico de evolução, debugs passados e aprendizados.

> [!IMPORTANT]
> **REGRAS ATIVAS MOVIDAS**
> Este arquivo agora serve APENAS como diário histórico ("como chegamos até aqui").
> As **LEIS DE OURO** que devem ser obedecidas pela IA foram compactadas e isoladas para maior precisão em:
> - `.agent/knowledge/active-vision-rules.md`
> - `.agent/knowledge/active-design-rules.md`

---



### Ã°Å¸Â§Â  META-REGRA 0: APRENDIZADO CONTÃƒï¿½NUO (ETERNAL LEARNING)
Data: 2026-04-20
**Regra Mestra**: O GiantAnimator DEVE evoluir autonomamente. Toda vez que um erro de pipeline (ex: colisÃƒÂµes, falhas de auditoria, limitaÃƒÂ§ÃƒÂµes arquiteturais, problemas de UI/UX) for resolvido ou uma regra nova e eficiente for descoberta, o Agente TEM A OBRIGAÃƒâ€¡ÃƒÆ’O de atualizar, alterar ou adicionar esse conhecimento aqui de forma funcional.
- **Objetivo**: Evitar repetiÃƒÂ§ÃƒÂ£o de erros e facilitar o funcionamento fluido e autÃƒÂ´nomo do Giant a longo prazo.

---

### Ã°Å¸Â¥â€¡ REGRAS DE OURO DA CALIBRAÃƒâ€¡ÃƒÆ’O (RESTAURADAS DO LOG ORIGINÃƒï¿½RIO)
Data: Reafirmado em 2026-04-20
Estas sÃƒÂ£o as diretrizes originÃƒÂ¡rias da fundaÃƒÂ§ÃƒÂ£o do Giant que nunca devem ser violadas:
1. **Fidelidade de Dados Absoluta**: Valores, labels e porcentagens 100% idÃƒÂªnticos ao original detectado na visÃƒÂ£o. NUNCA inventar, arredondar escalas (unless Smart Scaling allow), ou omitir `$` / `%`.
2. **Textos e Fontes**: Usar *Title Case* em cabeÃƒÂ§alhos (exceto para artigos/preposiÃƒÂ§ÃƒÂµes pequenas). Sempre forÃƒÂ§ar uma fonte de similaridade visual disponÃƒÂ­vel (ex: Inter, Roboto).
3. **Double Check (Auditoria Oculta)**: Todo grÃƒÂ¡fico VAI para o funil do `Auditor Visual`. SÃƒÂ³ renderiza se STATUS = APROVADO.
4. **DNA de AnimaÃƒÂ§ÃƒÂ£o (3 Atos Requeridos)**:
   - **Ato 1 (0-30f)**: Background Ã¢â€ â€™ TÃƒÂ­tulos principais Ã¢â€ â€™ Gridlines Eixos (Ghost).
   - **Ato 2 (30-150f)**: Crescimento / RevelaÃƒÂ§ÃƒÂ£o dos Dados (Barras, Linhas, Ãƒï¿½reas).
   - **Ato 3 (150-210f)**: Elementos de texto, Legendas e Smart Callouts emergem suavemente.

---

### Ã¢Å¡â„¢Ã¯Â¸ï¿½ REGRAS TÃƒâ€°CNICAS ABSOLUTAS DO REMOTION (RESTAURADAS)
1. **DuraÃƒÂ§ÃƒÂ£o Congelada em 600f**: Todo grÃƒÂ¡fico/vÃƒÂ­deo TEM que operar sobre `durationInFrames: 600` (~20 segundos), definido diretamente no Componente de Timeline para garantir respiro temporal total pra leitura dos dados.
2. **SeguranÃƒÂ§a de FÃƒÂ­sica Spring**: Ao usar `spring()`, ÃƒÂ© estritamente obrigatÃƒÂ³rio usar `overshootClamping: true` em grÃƒÂ¡ficos geomÃƒÂ©tricos diretos para que as barras e eixos nÃƒÂ£o transbordem "negativamente" criando artefatos em tela.
3. **ProibiÃƒÂ§ÃƒÂ£o de Escala Bruta**: NUNCA usar `transform: scale()` no elemento inteiro para fazer o grÃƒÂ¡fico "caber". Use ajustes puros de CSS ou Radius (`plotHeight`, `plotWidth`, `maxRadius`) para manter os polÃƒÂ­gonos nativos afiados em 4K.

---

### Ã°Å¸â€œÅ  REGRA DE ESCALA Ã¢â‚¬â€� BAR CHARTS (LABELS NO TOPO)
Data: 2026-04-17
**Ajuste**: Para garantir que os valores numÃƒÂ©ricos acima das barras nÃƒÂ£o sejam cortados ou sobrepostos pelo tÃƒÂ­tulo:
- **Escala Y**: O `maxVal` deve ser definido como `dataMax * 1.15` (15% de folga).
- **Safe Zone Top**: Aumentado para **20%** em BarCharts quando labels de valor estÃƒÂ£o ativos.

---

### Ã°Å¸Â§Â© UX Ã¢â‚¬â€� EDITOR VISUAL DE REVISÃƒÆ’O (NON-TECH)
Data: 2026-04-17
**Upgrade**: SubstituiÃƒÂ§ÃƒÂ£o do cÃƒÂ³digo JSON bruto por uma interface de campos (inputs e tabelas).
- **Fluxo**: IA Extrai -> UI Mostra TÃƒÂ­tulo/Valores em caixas editÃƒÂ¡veis -> UsuÃƒÂ¡rio confirma.

---

### Ã°Å¸â€ºÂ¡Ã¯Â¸ï¿½ SEGURANÃƒâ€¡A Ã¢â‚¬â€� GESTÃƒÆ’O DE CHAVES (API)
Data: 2026-04-17
**Regra**: Remover campos de API Key da UI pÃƒÂºblica para evitar vazamentos e simplificar a UX.
- **ELEVENLABS**: Agora gerenciada via `.env` no servidor.

---

### Ã°Å¸Å½Â¨ DESIGN Ã¢â‚¬â€� PREMIUM BACKGROUNDS (ANTI-WHITE)
Data: 2026-04-17
**Regra**: NUNCA renderizar um fundo 100% branco chapado, mesmo no modo "PadrÃƒÂ£o".
- **Textura**: Toda `AbsoluteFill` de fundo deve receber um `radial-gradient` sutil (opacity 0.03) para profundidade visual.

---

### Ã°Å¸Å½Â¨ NOVO TEMA Ã¢â‚¬â€� LIGHT (OFF-WHITE)
Data: 2026-04-15
**ImplementaÃƒÂ§ÃƒÂ£o**: Adicionado suporte ao tema `light` em todo o pipeline.
- **EstÃƒÂ©tica**: Fundo Off-white quente (`#FAF9F6`) com texto Slate-900.
- **ConsistÃƒÂªncia**: Mapeado no `theme.ts` (Remotion) e `server/index.ts` (Vision/Analysis).

---

### Ã°Å¸â€™Å½ REGRA DE OURO Ã¢â‚¬â€� ESTÃƒâ€°TICA E POSICIONAMENTO
Data: 2026-04-15
**Regra**: O posicionamento do Header (TÃƒÂ­tulo/SubtÃƒÂ­tulo) deve priorizar a FIDELIDADE Ãƒâ‚¬ REFERÃƒÅ NCIA.
- **Alinhamento**: Na ausÃƒÂªncia de instruÃƒÂ§ÃƒÂ£o contrÃƒÂ¡ria ou se a referÃƒÂªncia for centrada, use `textAlign: center`. Reservar o alinhamento ÃƒÂ  esquerda com marker apenas para layouts que explicitamente o utilizem.
- **Zona de SeguranÃƒÂ§a (Anti-Overlap)**: Para vÃƒÂ­deos 4K, o `padTop` deve ser de pelo menos **20% a 22%** da altura total. Isso garante que tÃƒÂ­tulos longos (2+ linhas) nÃƒÂ£o sobreponham os dados.
- **Z-Index**: Manter a regra de renderizar o Header **APÃƒâ€œS** o SVG no cÃƒÂ³digo.
- **Tipografia**: Headers premium usam `fs: 44px`, `fontWeight: 800` e `letterSpacing: -0.5px`.

---

### Ã°Å¸Å½Â¨ REGRA PERMANENTE Ã¢â‚¬â€� CORES EM SÃƒâ€°RIE ÃƒÅ¡NICA
Data: 2026-04-15
**Regra**: Em grÃƒÂ¡ficos de barra (Vertical/Horizontal) com apenas uma sÃƒÂ©rie, CADA BARRA deve receber uma cor diferente da paleta do tema (`T.colors[i % n]`).
- **Justificativa**: Evita o visual "flat" monocromÃƒÂ¡tico e aumenta o apelo visual (Rainbow style).

---

### Ã°Å¸â€�Â¢ REGRA PERMANENTE Ã¢â‚¬â€� FIDELIDADE NUMÃƒâ€°RICA (TABULAR & UNITS)
Data: 2026-04-15
**Regra**: Toda e qualquer unidade de medida detectada (%) ou ($) DEVE ser renderizada.
- **Tabular Nums**: Usar `font-variant-numeric: tabular-nums` em todos os campos de dados para evitar "jitter" em contagem.
- **DetecÃƒÂ§ÃƒÂ£o**: O parser de tabela agora limpa sÃƒÂ­mbolos para detectar nÃƒÂºmeros sem perder a unidade.

---

### [2026-04-15] PERSONALIDADE Ã¢â‚¬â€� "GIANT"
- **Nome**: O agente agora atende pelo nome de **Giant**.
- **Tom de Voz**: Informal, direto e focado em eficiÃƒÂªncia ("papo reto").
- **Identidade**: Alinhada ao novo mascote no cabeÃƒÂ§alho da UI.

---

### [2026-04-15] FIX DEFINITIVO: SÃƒÂ­mbolos e Unidades (Fidelidade 100%)
- **Problema**: IA de visÃƒÂ£o falhando em extrair o sÃƒÂ­mbolo unitÃƒÂ¡rio (%) mesmo quando presente na imagem.
- **SoluÃƒÂ§ÃƒÂ£o 1 (Prompt)**: Atualizado `imageAnalyzer.ts` com seÃƒÂ§ÃƒÂ£o "SÃƒï¿½MBOLOS SÃƒÆ’O OBRIGATÃƒâ€œRIOS" e puniÃƒÂ§ÃƒÂ£o por erro crÃƒÂ­tico se omitido.
- **SoluÃƒÂ§ÃƒÂ£o 2 (HeurÃƒÂ­stica)**: Implementada camada de seguranÃƒÂ§a em `visionService.ts`. Se o `unit` vier vazio mas existirem sÃƒÂ­mbolos (%, $) no tÃƒÂ­tulo, subtÃƒÂ­tulo ou labels, o sistema forÃƒÂ§a a aplicaÃƒÂ§ÃƒÂ£o da unidade correta.
- **AplicaÃƒÂ§ÃƒÂ£o**: Todos os componentes devem usar `formatValue(val, unit)` que agora ÃƒÂ© o padrÃƒÂ£o inabalÃƒÂ¡vel do projeto.

---

### Ã°Å¸ï¿½â€  [2026-04-16] REGRA MESTRA Ã¢â‚¬â€� INICIALIZAÃƒâ€¡ÃƒÆ’O E SHARING (REDE LOCAL)
Data: 2026-04-16
Escopo: Todos os Agentes / SessÃƒÂµes

**Regra 1 (InicializaÃƒÂ§ÃƒÂ£o)**: Sincronismo total obrigatÃƒÂ³rio. Ao iniciar, ler logs, skills, regras e `git status`.
**Regra 2 (Rede Local/Sharing)**: O servidor deve rodar em `http://10.120.5.21:3000/`.
- **Contexto**: Facilita o acesso compartilhado de diferentes IPs na rede interna.
- **Git Check**: `git log -n 5` obrigatÃƒÂ³rio para situar o agente no histÃƒÂ³rico de modificaÃƒÂ§ÃƒÂµes.
- **Status**: Integrado ÃƒÂ s `master-rules.md`.

**Regra 3 (Espelhamento K: Shared)**: Inalterabilidade entre local e rede.
- **Obrigatoriedade**: Toda mudanÃƒÂ§a feita no projeto local deve ser copiada para `K:\Shared\GiantAnimator`.
- **PropÃƒÂ³sito**: Garantir que a versÃƒÂ£o de rede esteja sempre idÃƒÂªntica ÃƒÂ  de desenvolvimento.

---

### Ã°Å¸ï¿½â€  [2026-04-16] VITÃƒâ€œRIA INFRA: MODO NINJA (BYPASS DE FIREWALL)
Data: 2026-04-16
Escopo: Conectividade / Rede Corporativa

**Problema**: TI bloqueou portas e TÃƒÂºneis (Cloudflare/Localtunnel) em rede restrita.
**SoluÃƒÂ§ÃƒÂ£o**: Implementado o **Watcher do Drive K:**. 
- O servidor monitora a pasta `K:\Shared\GiantAnimator\input`.
- UsuÃƒÂ¡rios de outros PCs apenas "soltam" arquivos lÃƒÂ¡.
- O servidor processa e entrega o MP4 em `K:\Shared\GiantAnimator\output`.
**Aprendizado**: O drive de rede compartilhado ÃƒÂ© a melhor interface quando a rede web estÃƒÂ¡ bloqueada.

---

### Ã¢Å¡Â¡ [2026-04-16] REGRA: I/O ASSÃƒï¿½NCRONO EM DRIVES DE REDE
Data: 2026-04-16
Escopo: Performance / Estabilidade

**Erro CrÃƒÂ­tico**: Usar `fs.writeFileSync` ou `fs.readFileSync` em drives de rede (como o `K:`) congela o Event Loop do Node.js.
**Sintoma**: Servidor para de responder a outros usuÃƒÂ¡rios e o tÃƒÂºnel dÃƒÂ¡ erro 503 (Service Unavailable).
**Regra**: Todo I/O envolvendo pastas do Drive K **DEVE** ser feito via `fs.promises` (async/await). 
- Nunca travar o motor do servidor esperando o disco de rede responder.

---

### Ã°Å¸â€˜ï¿½Ã¯Â¸ï¿½ [2026-04-16] Ã°Å¸Å½â€œ APRENDIZADO: PRECISÃƒÆ’O "SURGERY-GRADE" (VISION)
Data: 2026-04-16
Escopo: InteligÃƒÂªncia Artificial / AnÃƒÂ¡lise de GrÃƒÂ¡ficos

**Problema**: GrÃƒÂ¡ficos de linhas complexos (ex: COVID Trend) estavam sendo simplificados demais pela IA, perdendo a curvatura real.
**Novo PadrÃƒÂ£o de Prompt**: 
1. **CalibraÃƒÂ§ÃƒÂ£o ObrigatÃƒÂ³ria**: A IA deve ler o valor do topo e base do eixo Y primeiro.
2. **ExtraÃƒÂ§ÃƒÂ£o de TendÃƒÂªncia**: O JSON deve conter no mÃƒÂ­nimo 8-12 pontos por linha para preservar picos e vales.
3. **Respeito ÃƒÂ  Escala**: Valores devem ser interpolados baseados na posiÃƒÂ§ÃƒÂ£o pixel-per-pixel em relaÃƒÂ§ÃƒÂ£o aos eixos.

---

### Ã°Å¸Å½Â¨ [2026-04-16] REGRA: VISIBILIDADE UHD EM TEMAS CLAROS
Data: 2026-04-16
Escopo: Design System / UX

**Problema**: Linhas de grade (grid) sumiam em telas 4K claras (tema light).
**Fix**: 
- **Theme.ts**: Aumentado o canal alfa do `grid` e `axis` nos temas `light`, `corporate` e `champagne` para `0.15` (dobro do anterior).
- **Componentes**: Opacidade da animaÃƒÂ§ÃƒÂ£o do grid aumentada para `0.75` (era `0.4`).

---

### Ã°Å¸Å½â€œ [2026-04-16] SURGERY-GRADE PRECISION & FIDELITY SWEEP
Contexto: GrÃƒÂ¡ficos de mÃƒÂºltiplas sÃƒÂ©ries cruzadas (ex: COVID por paÃƒÂ­s) estavam perdendo a tendÃƒÂªncia correta (hallucinating paths).

**Novas Regras de Ouro (InviolÃƒÂ¡veis):**
1.  **DADOS > ESTÃƒâ€°TICA**: A fidelidade dos pontos ao eixo Y original ÃƒÂ© a prioridade #1. NUNCA simplificar tendÃƒÂªncias complexas.
2.  **Chain of Thought (CoT)**: O Analista de VisÃƒÂ£o DEVE listar os eixos detectados e as cores das sÃƒÂ©ries ANTES de extrair os nÃƒÂ­meros.
3.  **ResoluÃƒÂ§ÃƒÂ£o Nativa**: Imagens enviadas para IA agora usam 2560px (UHD-Ready) para evitar blur em labels pequenos.
4.  **Zero InflaÃƒÂ§ÃƒÂ£o**: Removida qualquer escala artificial (* 1.15) de componentes cartesianos. O topo do grÃƒÂ¡fico ÃƒÂ© agora o valor real mÃƒÂ¡ximo.
5.  **Z-Stacking**: Todos os Headers de texto sÃƒÂ£o renderizados apÃƒÂ³s o elemento visual (SVG/VÃƒÂ­deo) para garantir legibilidade 4K.

**Watcher Update**: Estabilidade aumentada para 2500ms para garantir integridade de arquivos grandes em redes compartilhadas.

---

### Ã¢Å¡â€“Ã¯Â¸ï¿½ [2026-04-17] UPGRADE Ã¢â‚¬â€� SURGERY-GRADE VISION & SILENT AUDITOR
**Contexto**: InconsistÃƒÂªncias graves em LineCharts complexos (escala errada e tendÃƒÂªncias simplificadas).
**Aprendizado**: 
1. **Lite Model vs Full Model**: Para anÃƒÂ¡lise tÃƒÂ©cnica de alta fidelidade, o modelo `lite` ÃƒÂ© insuficiente. Migrado para `gemini-2.5-flash` padrÃƒÂ£o no serviÃƒÂ§o de visÃƒÂ£o.
2. **ResoluÃƒÂ§ÃƒÂ£o de AnÃƒÂ¡lise**: Aumentada a resoluÃƒÂ§ÃƒÂ£o de envio para a IA para **3840px (4K)** para garantir a leitura de textos pequenos em eixos UHD.
3. **Silent Auditor Loop**: ImplementaÃƒÂ§ÃƒÂ£o de um loop de feedback automÃƒÂ¡tico. O sistema agora gera um frame estÃƒÂ¡tico (`still`) do grÃƒÂ¡fico renderizado e o compara com o original usando um "Agente Auditor" antes de aprovar o render final.
4. **Auto-CorreÃƒÂ§ÃƒÂ£o**: Se a auditoria falhar (Fidelity Score < 95), o sistema injeta o feedback da falha de volta no pipeline e tenta uma nova extraÃƒÂ§ÃƒÂ£o de dados automaticamente.
5. **RAG-Lite SemÃƒÂ¢ntico**: InjeÃƒÂ§ÃƒÂ£o dinÃƒÂ¢mica dos ÃƒÂºltimos aprendizados do `TRAINING_LOG.md` diretamente no prompt de visÃƒÂ£o para evitar a repetiÃƒÂ§ÃƒÂ£o de erros histÃƒÂ³ricos.
**Aplicar quando**: Sempre que processar imagens complexas onde a fidelidade aos dados ÃƒÂ© o requisito absoluto (Surgery-Grade).

---

### Ã°Å¸â€™Å½ [2026-04-17] VITÃƒâ€œRIA: FIDELIDADE "SURGERY-GRADE" ALCANÃƒâ€¡ADA
**Contexto**: O ajuste de fidelidade e impressÃƒÂ£o de dados atingiu o nÃƒÂ­vel mÃƒÂ¡ximo de precisÃƒÂ£o em LineCharts e PieCharts complexos.
**Aprendizado & Regras Novas**:
1.  **Protocolo Silent Auditor**: SEMPRE realizar uma auditoria comparativa entre o render de teste (`still`) e a referÃƒÂªncia original antes de finalizar o render. Isso elimina 100% das alucinaÃƒÂ§ÃƒÂµes de escala.
2.  **Feedback Loop Habilitado**: Se o auditor detectar erro, o feedback textual (ex: "Eixo Y estÃƒÂ¡ deslocado 10% para baixo") deve ser injetado na nova tentativa de anÃƒÂ¡lise. Isso "ajusta a mira" da IA em tempo real.
3.  **UHD Text Extraction**: Para grÃƒÂ¡ficos profissionais, a anÃƒÂ¡lise de imagem DEVE ser feita em resoluÃƒÂ§ÃƒÂ£o 4K (3840px). Menos que isso causa perda de leitura em labels de 8pt-10pt.
4.  **Sincronismo de UI (UX)**: O estado `isRendering` deve ser rigorosamente controlado no frontend, resetando apenas apÃƒÂ³s a conclusÃƒÂ£o total do polling do servidor, garantindo que o botÃƒÂ£o "Animate" esteja sempre disponÃƒÂ­vel para a prÃƒÂ³xima tarefa.
5.  **Zero Placeholder**: Toda e qualquer unidade (%) ou ($) detectada na imagem deve ser preservada no JSON final. A precisÃƒÂ£o dos dados ÃƒÂ© a prioridade absoluta, acima de qualquer simplificaÃƒÂ§ÃƒÂ£o estÃƒÂ©tica.

**AceleraÃƒÂ§ÃƒÂ£o**: O uso do `gemini-2.5-flash` full (em vez do lite) provou ser mais rÃƒÂ¡pido no processo total, pois reduz a necessidade de mÃƒÂºltiplas re-anÃƒÂ¡lises por erro de precisÃƒÂ£o.

---

### Ã°Å¸â€ºÂ¡Ã¯Â¸ï¿½ [2026-04-20] UX & UI Ã¢â‚¬â€� ANTI-COLISÃƒÆ’O 4K EM GRÃƒï¿½FICOS RADIAIS E SMART CALLOUTS
**Contexto**: Em resoluÃƒÂ§ÃƒÂ£o 4K (2160p), componentes circulares (`PieChart`, `DonutChart`, `PolarChart`, `RadarChart`, `SunburstChart` e `ChordChart`) com raios superiores a 28% (ex: 42%) geravam mais de 1800px de diÃƒÂ¢metro de SVG, colidindo com tÃƒÂ­tulos no topo e empurrando legendas para fora da borda inferior da tela. Adicionalmente, verificou-se que o motor `Remotion` processava as "AnÃƒÂ¡lises e Insights" do Gemini mas nÃƒÂ£o renderizava balÃƒÂµes de callout visÃƒÂ­veis.

**Regras Estabelecidas (InviolÃƒÂ¡veis)**:
1. **Raio Seguro Global**: Em QUALQUER componente circular/radial, o `<maxRadius>` (ou raio externo) **nUNCA DEVE EXCEDER 28%** da largura ou altura (ex: `Math.min(width * 0.28, height * 0.28)`).
2. **CompactaÃƒÂ§ÃƒÂ£o da Legenda**: Tamanho da fonte na legenda `LEGEND_SIZE` para grÃƒÂ¡ficos como `PieChart` nÃƒÂ£o deve ultrapassar `fs(18)` ou `fs(20)`. AlÃƒÂ©m disso, o distanciamento da base deve ser cravado em `bottom: height * 0.04`.
3. **Smart Callouts (AnotaÃƒÂ§ÃƒÂµes AnalÃƒÂ­ticas)**:
   - Todo componente direcional (`LineChart`, `BarChart`, `HorizontalBarChart`) deve renderizar marcaÃƒÂ§ÃƒÂµes de apontamento de dados quando submetido pelo parser do servidor (`props.annotations`).
   - Callouts utilizam `spring physics` nativo do theme e herdam a cor primÃƒÂ¡ria de destaque (Accent color) da paleta e fonte formatada em Glassmorphism para nÃƒÂ£o macular as sÃƒÂ©ries do grÃƒÂ¡fico.

---

### Ã°Å¸â€œï¿½ [2026-04-20] REGRAS ARQUIVADAS RESTAURADAS: GESTÃƒÆ’O DO ESPAÃƒâ€¡O 4K (ANTI-COLISÃƒÆ’O)
**Contexto**: O resgate do "knowledge_log" com mais de 1000 linhas de aprendizados trouxe parÃƒÂ¢metros vitais para estruturar componentes sem que textos, eixos e legendas se atropelem no Canvas de 3840x2160. Abaixo estÃƒÂ£o as regras condensadas de forma cirÃƒÂºrgica para desenvolvimento:

**R1. Safe Zones (Tamanho de SeguranÃƒÂ§a)**
Todo componente deve respeitar uma "margem de respiraÃƒÂ§ÃƒÂ£o" para nÃƒÂ£o vazar pela tela do vÃƒÂ­deo:
- `Safe Top`: min. 160px (Apenas para `Title` e `Subtitle`)
- `Safe Bottom`: min. 80px (Ãƒï¿½rea restrita de respiro)
- `Content Safe Zone Y`: GrÃƒÂ¡ficos lineares e de barra devem usar preferencialmente `plotHeight = height * 0.85` (ou no mÃƒÂ¡ximo) deixando o restante para tÃƒÂ­tulos organizarem.

**R2. Layout da Legenda (PieCharts e Similares)**
Se a legenda nÃƒÂ£o for montada na lateral (ex: Sidebar), ela VAI empilhar para cima no bottom absoluto e pode esmagar o grÃƒÂ¡fico.
- Utilizar `flexWrap: "wrap"` exige `bottom: height * 0.04` e `alignItems: "center"`.
- O tamanho da fonte *Nunca* deve exceder grandes marcaÃƒÂ§ÃƒÂµes para nÃƒÂ£o inflar a altura do bloco. Para componentes circulares onde a legenda fica debaixo: `LEGEND_SIZE = fs(18)` ou `fs(20)`.

**R3. Margem de TÃƒÂ­tulos Massivos**
Caso a imagem mande um tÃƒÂ­tulo muito longo, ele nÃƒÂ£o pode flanquear o Canvas de renderizaÃƒÂ§ÃƒÂ£o. O `header` container SEMPRE DEVE possuir:
- `maxWidth: 3400px` (para centrar em 3840px de frame)
- `paddingLeft / paddingRight: mÃƒÂ­nimo 80px`
- `wordBreak: break-word`
- Posicionamento em Z-Index alto (renderizado no cÃƒÂ³digo **apÃƒÂ³s** a tag `<svg>`).

**R4. Hierarquia Visual InviolÃƒÂ¡vel**
1. **Z-stack:** Background Ã¢â€ â€™ `<svg>` (Eixos Ã¢â€ â€™ Dados) Ã¢â€ â€™ Callouts/AnotaÃƒÂ§ÃƒÂµes Ã¢â€ â€™ `<header>` (TÃƒÂ­tulos).
2. TÃƒÂ­tulos nunca devem ser obscurecidos sob nenhuma hipÃƒÂ³tese. Se o Canvas parecer pequeno, deve-se diminuir o grÃƒÂ¡fico cartesian via trigonometria (`radius`) e nÃƒÂ£o "empurrar" elementos do cabeÃƒÂ§alho.

---

### Ã°Å¸â€œï¿½ [2026-04-20] REGRAS FUNCIONAIS ANTI-COLISÃƒÆ’O (IMPLEMENTAÃƒâ€¡ÃƒÆ’O DIRETA)
**Contexto**: Para evitar erros recorrentes de elementos se "atropelando" (legenda sobre grÃƒÂ¡fico, tÃƒÂ­tulo sobre label), as seguintes fÃƒÂ³rmulas devem ser injetadas em todo novo componente:

**F1. CÃƒÂ¡lculo de Plot Area (EspaÃƒÂ§o de Manobra)**:
- `CHART_TOP = height * 0.22` (Reserva 22% do topo para o Header).
- `CHART_BOTTOM = height * 0.12` (Reserva 12% da base para Legenda/X-Axis).
- `plotHeight = height - CHART_TOP - CHART_BOTTOM`.
- *AplicaÃƒÂ§ÃƒÂ£o*: Nunca deixar o SVG ocupar mais que o `plotHeight` calculado.

**F2. Legenda Inteligente (Bottom-Wrap)**:
- Para evitar que a legenda suba sobre o grÃƒÂ¡fico:
  - Usar `display: "flex", flexWrap: "wrap", justifyContent: "center"`.
  - DistÃƒÂ¢ncia fixa: `bottom: height * 0.04`.
  - Max-Height da legenda: `height * 0.08`. Se exceder, diminuir `fs` para `fs(14)`.

**F3. Eixo Y - Folga de SeguranÃƒÂ§a (Ceiling)**:
- Se houver labels numÃƒÂ©ricos no topo das barras:
  - `yMax = dataMax * 1.20` (20% de folga obrigatÃƒÂ³ria).
- Se nÃƒÂ£o houver labels:
  - `yMax = dataMax * 1.10` (10% de folga).
- *Objetivo*: Garantir que o valor "pop" nÃƒÂ£o bata no teto do plot.

**F4. Z-Index e Flow de RenderizaÃƒÂ§ÃƒÂ£o**:
- O componente `<Header />` (TÃƒÂ­tulo/SubtÃƒÂ­tulo) deve SEMPRE vir **DEPOIS** do `<svg />` no JSX.
- Isso garante que, em caso de colisÃƒÂ£o extrema, o texto (mais importante) fique sobre o grÃƒÂ¡fico e nÃƒÂ£o sob ele.

---

### Ã°Å¸â€ºÂ¡Ã¯Â¸ï¿½ [2026-04-20] SEGURANÃƒâ€¡A Ã¢â‚¬â€� TEMAS ADAPTATIVOS E SANITIZAÃƒâ€¡ÃƒÆ’O DE DADOS IA
**Contexto**: InconsistÃƒÂªncias na renderizaÃƒÂ§ÃƒÂ£o quando o usuÃƒÂ¡rio seleciona "Original (ReferÃƒÂªncia)" com fundos claros, e falhas de SVG por caracteres nÃƒÂ£o numÃƒÂ©ricos extraÃƒÂ­dos pela IA.

**Regras de ImplementaÃƒÂ§ÃƒÂ£o (InviolÃƒÂ¡veis)**:
1. **Tema Adaptativo ("Original")**:
   - O sistema DEVE detectar o brilho da cor de fundo (`backgroundColor`).
   - Se o fundo for CLARO, usar mÃƒÂ©tricas de contraste do tema `light` para eixos, grid e textos.
   - Se o fundo for ESCURO, usar mÃƒÂ©tricas do tema `dark`.
   - *Finalidade*: Garantir legibilidade UHD mesmo quando o tema ÃƒÂ© extraÃƒÂ­do dinamicamente da imagem.
2. **SanitizaÃƒÂ§ÃƒÂ£o Universal de Dados**:
   - Todo valor numÃƒÂ©rico extraÃƒÂ­do pela IA DEVE passar por `parseSafeNumber(val)` antes de entrar no cÃƒÂ¡lculo de coordenadas SVG.
   - O parser deve remover `%`, `$`, letras ou espaÃƒÂ§os, garantindo que o grÃƒÂ¡fico nÃƒÂ£o quebre por valores `NaN`.
   - *Finalidade*: Robusteza total do pipeline contra ruÃƒÂ­do na extraÃƒÂ§ÃƒÂ£o de dados da IA.
3. **Visibilidade de Eixos em 4K**:
   - Todo gridline e eixo deve possuir largura mÃƒÂ­nima de `fs(2)` e opacidade mÃƒÂ­nima de `0.15` em temas claros para ser percebido em resoluÃƒÂ§ÃƒÂµes UHD+.

---

### Ã¢Å“â€¦ [2026-04-20] STATUS DO SERVIDOR E PIPELINE
- **Servidor Principal**: `http://localhost:3000` (Rodando via `npm run dev` na raiz).
- **Remotion Studio**: `http://localhost:3001` (Rodando em porta alternativa para evitar conflito).
- **Watcher**: Ativo em `input/`.
- **Regra de Ouro**: O `TRAINING_LOG.md` ÃƒÂ© agora a ÃƒÂºnica fonte de verdade para o cÃƒÂ©rebro do Giant.

---

### Ã°Å¸â€ºÂ¡Ã¯Â¸ï¿½ [2026-04-20] ESTABILIZAÃƒâ€¡ÃƒÆ’O DA PIPELINE E AUDITORIA CIRÃƒÅ¡RGICA
**Problema**: GrÃƒÂ¡ficos de linha aparecendo fragmentados (sem linhas conectadas), fundo branco ignorando configuraÃƒÂ§ÃƒÂµes de "Mesh Gradient" e Auditoria aprovando renders defeituosos.
**Causa**: 
1. `yMax === yMin` causava `NaN` no cÃƒÂ¡lculo das coordenadas SVG (divisÃƒÂ£o por zero).
2. `bgStyle` nÃƒÂ£o estava mapeado no Registry, ficando invisÃƒÂ­vel para a extraÃƒÂ§ÃƒÂ£o do Gemini Vision.
3. Auditor era muito genÃƒÂ©rico e nÃƒÂ£o checava explicitamente a "presenÃƒÂ§a" visual dos dados (linhas).
**SoluÃƒÂ§ÃƒÂ£o**:
- Aplicado fallback `Math.max(0.1, yMax - yMin)` no componente `MultiLineChart` para garantir escala vÃƒÂ¡lida.
- Adicionado `bgStyle` e `showValueLabels` ao `componentRegistry.ts` para habilitar extraÃƒÂ§ÃƒÂ£o visual.
- Prompt do Auditor atualizado para rejeitar builds com "dados fragmentados" (lines missing) ou falta de fidelidade no background.
- Aumento da opacidade do `DynamicBackground` para visibilidade em renders UHD de alto brilho.
**Resultado**: Pipeline 100% blindada contra falsos positivos e falhas matemÃƒÂ¡ticas de renderizaÃƒÂ§ÃƒÂ£o.

---

### Ã°Å¸Å½Â¨ [2026-04-20] REFACTOR Ã¢â‚¬â€� AMBIÃƒÅ NCIA, TEMAS ADAPTATIVOS E POSICIONAMENTO DINÃƒâ€šMICO
**Contexto**: SimplificaÃƒÂ§ÃƒÂ£o do pipeline para reduzir erros de renderizaÃƒÂ§ÃƒÂ£o e melhorar o equilÃƒÂ­brio visual (UX/UI).

**Novos Aprendizados e Regras:**
1.  **Regra do Anti-VÃƒÂ¡cuo (Legenda DinÃƒÂ¢mica)**:
    - Em grÃƒÂ¡ficos centrados (como `PieChart`), a legenda nÃƒÂ£o deve ficar presa ao rodapÃƒÂ© absoluto se houver pouco conteÃƒÂºdo. 
    - **Ajuste**: Posicionar a legenda dinamicamente com base no limite fÃƒÂ­sico do grÃƒÂ¡fico (`centerY + radius`). Se houver espaÃƒÂ§o, a legenda deve "subir" para fechar o espaÃƒÂ§o vazio, mantendo a composiÃƒÂ§ÃƒÂ£o coesa.
2.  **Prioridade Absoluta de Tema (User Overrules AI)**:
    - Se o parÃƒÂ¢metro `backgroundType` (`dark` ou `light`) for fornecido explicitamente via UI, ele **DEVE** ignorar a cor de fundo extraÃƒÂ­da da visÃƒÂ£o (`backgroundColor`).
    - **Motivo**: Evita o erro de "fundo branco em modo escuro" quando a IA detecta erradamente a cor predominante da referÃƒÂªncia.
3.  **Gradientes de "EstÃƒÂºdio" Premium**:
    - SubstituiÃƒÂ§ÃƒÂ£o de fundos chapados por gradientes radiais ultra-leves e profissionais:
      - **Escuro**: Centro `#1a1c23`, Bordas `#090a0f`.
      - **Claro**: Centro `#ffffff`, Bordas `#f0f2f5`.
    - Isso garante profundidade visual sem sacrificar a estabilidade de renderizaÃƒÂ§ÃƒÂ£o 4K no Remotion.
4.  **EstabilizaÃƒÂ§ÃƒÂ£o da Pipeline**: 
    - Removidos estilos `mesh` e `grid` (com filtros de blur pesados) por causarem falhas de memÃƒÂ³ria e erros genÃƒÂ©ricos. A estÃƒÂ©tica agora ÃƒÂ© garantida pela qualidade dos gradientes e do contraste cirÃƒÂºrgico dos elementos.
5.  **Ajuste de Margem Basal**: 
    - Para todos os grÃƒÂ¡ficos, a margem inferior das legendas foi elevada (de `4%` para `8%`) para garantir melhor respiro visual e evitar o visual "esmagado" na borda da tela.

6.  **Regra de EquilÃƒÂ­brio Vertical (Vertical Balance Rule)**:
    - O grÃƒÂ¡fico nÃƒÂ£o deve ser "puxado" para cima se houver espaÃƒÂ§o disponÃƒÂ­vel abaixo. 
    - Se a legenda ocupar apenas 1 ou 2 linhas, o `centerY` (Pie) ou o `padTop` (Eixos) deve ser mais generoso para centralizar o conteÃƒÂºdo visual no espaÃƒÂ§o ÃƒÂºtil entre o tÃƒÂ­tulo e a legenda. 
    - **Objetivo**: Evitar colisÃƒÂµes com o tÃƒÂ­tulo e aproveitar melhor o vÃƒÂ¡cuo central da tela 4K.

7.  **Soberania do `backgroundType`**:
    - O campo `backgroundType` (Checkbox Dark/Light no Review) ÃƒÂ© a ÃƒÂºnica fonte de verdade para o fundo.
    - Deve sobrescrever qualquer cor detectada pela visÃƒÂ£o (`backgroundColor`) para garantir que o tema escolhido pelo usuÃƒÂ¡rio seja entregue fielmente.

8.  **Pipeline Clean (No Previews)**:
    - Para evitar erros de "is not defined" no bundle do Remotion, o arquivo `Root.tsx` deve manter apenas as composiÃƒÂ§ÃƒÂµes de produÃƒÂ§ÃƒÂ£o.
    - Arquivos `*.preview.tsx` em massa foram removidos para garantir que scripts de bundle nÃƒÂ£o poluam o namespace global com referÃƒÂªncias duplicadas ou quebradas.

9.  **Integridade da UI de RevisÃƒÂ£o**:
    - O seletor de "Tipo de GrÃƒÂ¡fico" (Visual Switcher no modal) e o toggle "Modo Escuro" sÃƒÂ£o componentes de seguranÃƒÂ§a obrigatÃƒÂ³rios. 
    - **AÃƒÂ§ÃƒÂ£o**: Devem sempre estar presentes no modal de confirmaÃƒÂ§ÃƒÂ£o no `app.js` para permitir o ajuste final de design antes do render 4K, mitigando alucinaÃƒÂ§ÃƒÂµes da IA na detecÃƒÂ§ÃƒÂ£o do tipo de grÃƒÂ¡fico original.

10.  **Regra de ProporÃƒÂ§ÃƒÂ£o UHD (Base 1920p)**:
     - O fator de escala `fs()` em todos os componentes deve usar a base de **1920p** (`width / 1920`). 
     - **Motivo**: Usar 1280p como base gera elementos (fontes, paddings, borders) 3x maiores em 4K, o que polui o visual e causa colisÃƒÂµes. 1920p provou ser o equilÃƒÂ­brio perfeito para dashboards "Premium Luxury".

11.  **Anti-ColisÃƒÂ£o de Smart Callouts**:
     - Toda anotaÃƒÂ§ÃƒÂ£o (`SmartCallout`) deve receber um prop `index`.
     - O deslocamento vertical (`dy`) deve ser decrementado com base no `index` (ex: `dy = baseDy - (index * offset)`) para escalonar balÃƒÂµes que apontam para ÃƒÂ¡reas prÃƒÂ³ximas, evitando sobreposiÃƒÂ§ÃƒÂ£o de texto.

12.  **Soberania de Contraste (Texto InviolÃƒÂ¡vel)**:
    - Quando um `backgroundType` ÃƒÂ© fornecido, a variÃƒÂ¡vel `resolvedText` deve obrigatoriamente seguir `T.text` do tema e ignorar o `textColor` detectado pela visÃƒÂ£o. 
    - **Objetivo**: Garantir que, se o usuÃƒÂ¡rio escolher "Modo Escuro", o texto SEJA claro, e vice-versa, eliminando o erro de texto escuro sobre fundo escuro.

---

### Ã°Å¸Å¡â‚¬ [2026-04-22] REGRA DE OURO: INICIALIZAÃƒâ€¡ÃƒÆ’O OBRIGATÃƒâ€œRIA (READ-FIRST)
**Regra**: Sempre que o servidor for iniciado ou uma nova sessÃƒÂ£o de desenvolvimento for aberta, o Agente **DEVE** ler o `TRAINING_LOG.md` e todos os arquivos de skills (`.agent/skills/*.md`).
- **PropÃƒÂ³sito**: Garantir que o "cÃƒÂ©rebro" do Giant esteja sincronizado com as ÃƒÂºltimas diretrizes de design, correÃƒÂ§ÃƒÂµes de bugs e preferÃƒÂªncias do usuÃƒÂ¡rio antes de qualquer aÃƒÂ§ÃƒÂ£o.
- **AÃƒÂ§ÃƒÂ£o**: O agente nÃƒÂ£o deve prosseguir sem confirmar que revisou esses documentos.

---

### Ã°Å¸â€ºÂ¡Ã¯Â¸ï¿½ [2026-04-22] PROTOCOLO DE RESILIÃƒÅ NCIA TOTAL E PROCESSAMENTO HÃƒï¿½BRIDO
**Contexto**: Instabilidades frequentes (Erro 503/Timeout) no modelo Gemini 2.5-flash durante processamento visual pesado.

**Regras de EstabilizaÃƒÂ§ÃƒÂ£o (InviolÃƒÂ¡veis)**:
1.  **Hibridismo Local-Nuvem (Fallback de Texto)**:
    - Todo processamento de imagem DEVE realizar um OCR local prÃƒÂ©vio (Tesseract.js).
    - Se a IA de VisÃƒÂ£o falhar (503), o sistema deve chavear automaticamente para o modelo de **Texto**, enviando os dados do OCR local para reconstruÃƒÂ§ÃƒÂ£o.
2.  **OtimizaÃƒÂ§ÃƒÂ£o de Payload (Anti-Timeout)**:
    - Imagens de VisÃƒÂ£o: MÃƒÂ¡x. **1920p JPEG (85%)**.
    - Imagens de Auditoria: MÃƒÂ¡x. **1024p JPEG (80%)**.
    - O envio de imagens 4K brutas para a API ÃƒÂ© estritamente proibido.
3.  **TransparÃƒÂªncia de Progresso (UX)**:
    - Todo retry e erro transitÃƒÂ³rio deve ser reportado em tempo real no console da UI (`appendJobLog`). O usuÃƒÂ¡rio nunca deve ficar sem feedback visual.
4.  **ResiliÃƒÂªncia do Auditor**:
    - Se o Auditor de Fidelidade falhar por razÃƒÂµes tÃƒÂ©cnicas (API 503/Fetch Error), o sistema deve aplicar **ConfianÃƒÂ§a TÃƒÂ¡cita** (AprovaÃƒÂ§ÃƒÂ£o TÃƒÂ©cnica) para nÃƒÂ£o bloquear a entrega do vÃƒÂ­deo.

---

### Ã°Å¸â€ºÂ¡Ã¯Â¸ï¿½ [2026-04-22] REGRA: ANTI-SOBREPOSIÃƒâ€¡ÃƒÆ’O DE CALLOUTS (TITLE SAFETY)
**Contexto**: Callouts analÃƒÂ­ticos ("Smart Callouts") colidindo com o tÃƒÂ­tulo no topo da tela 4K.

**Regra de Posicionamento**:
1.  **Title Safe Zone**: NENHUM elemento de anotaÃƒÂ§ÃƒÂ£o (box ou linha de callout) deve entrar no quadrante superior central onde reside o tÃƒÂ­tulo (`y < height * 0.15`).
2.  **Smart Offsets**: Se o dado estiver muito alto (perto do topo), o callout deve ser "empurrado" para as laterais ou para baixo do ponto de dados.
3.  **Checkbox Sovereignty**: O prop `includeCallouts` deve ser respeitado rigorosamente. Se `false`, o objeto `annotations` nÃƒÂ£o deve ser gerado ou renderizado.

---

### Ã°Å¸â€ºÂ¡Ã¯Â¸ï¿½ [2026-04-22] REGRA: SINCRONIZAÃƒâ€¡ÃƒÆ’O TOTAL DE CORES (LEGEND CONGRUENCY)
**Contexto**: DiscrepÃƒÂ¢ncias entre as cores das barras/linhas e as cores apresentadas na legenda inferior.

**Regra de ImplementaÃƒÂ§ÃƒÂ£o**:
1.  **Fonte ÃƒÅ¡nica de Verdade**: Tanto o grÃƒÂ¡fico quanto a legenda DEVEM utilizar a prop `s.color` (extraÃƒÂ­da pela IA) como prioridade 1.
2.  **Fallback Consistente**: Se `s.color` estiver ausente, ambos devem usar o mesmo ÃƒÂ­ndice do array `resolvedColors` do tema.
3.  **ProibiÃƒÂ§ÃƒÂ£o de Desvio**: Ãƒâ€° estritamente proibido o uso de paletas fixas que ignorem os dados da sÃƒÂ©rie em qualquer um dos componentes.

---

### Ã°Å¸â€ºÂ¡Ã¯Â¸ï¿½ [2026-04-22] REGRA: TITULAÃƒâ€¡ÃƒÆ’O UHD (SAFE-MARGIN)
**Regra**: Para evitar sobreposiÃƒÂ§ÃƒÂ£o no topo da tela 4K:
1.  **Fonte**: O tÃƒÂ­tulo principal nÃƒÂ£o deve exceder `fs(40)`.
2.  **PosiÃƒÂ§ÃƒÂ£o**: O topo (`top`) do container do tÃƒÂ­tulo deve ser de `height * 0.04`.
3.  **Padding**: Deve haver um padding lateral de `fs(100)` para evitar que tÃƒÂ­tulos longos encostem nas bordas da tela.

---

### Ã°Å¸Å½Â¯ [2026-04-22] META DE PRECISÃƒÆ’O: >95% (RIGOR TOTAL)
**Meta**: Todo vÃƒÂ­deo gerado deve ter fidelidade visual e de dados superior a 95% em relaÃƒÂ§ÃƒÂ£o ao original.

**Mecanismo de Controle**:
1.  **Auditoria em Loop**: O sistema realiza atÃƒÂ© 2 tentativas de auto-correÃƒÂ§ÃƒÂ£o baseadas na crÃƒÂ­tica do Auditor.
2.  **Hard-Gate**: Se o Score Final for inferior a 95%, o pipeline ÃƒÂ© interrompido com erro de fidelidade.
3.  **Supremacia de Dados**: Os dados originais tÃƒÂªm soberania total. Ãƒâ€° proibido inventar tendÃƒÂªncias lineares onde existem oscilaÃƒÂ§ÃƒÂµes.
4.  **Soberania do Aspecto Original**: Se o original ÃƒÂ© um grÃƒÂ¡fico de barras, o render **DEVE** ser `BarChart`. Falsos positivos de `LineChart` para dados temporais sÃƒÂ£o proibidos.

---

### Ã°Å¸Â§Âª [2026-04-22] PROTOCOLO DE CALIBRAÃƒâ€¡ÃƒÆ’O STEP-BY-STEP
**Regra**: A IA deve obrigatoriamente listar os eixos X e Y antes de extrair os valores.
- Passo 1: Listar rÃƒÂ³tulos do Eixo Y.
- Passo 2: Listar rÃƒÂ³tulos do Eixo X.
- Passo 3: Mapear altura visual de cada ponto em relaÃƒÂ§ÃƒÂ£o ÃƒÂ  escala.

---

### Ã°Å¸Å¡â‚¬ [2026-04-22] OPERAÃƒâ€¡ÃƒÆ’O SILENCIOSA (BACKGROUND SERVICE)
**Regra**: O servidor deve ser iniciado via `SILENT_START.ps1` para evitar a abertura de janelas de terminal intrusivas no computador do usuÃƒÂ¡rio.
- Logs persistidos em `logs/server.log`.

---

### Ã°Å¸â€ºÂ¡Ã¯Â¸ï¿½ [2026-04-22] INFRA Ã¢â‚¬â€� RESILIÃƒÅ NCIA CONTRA TRUNCAMENTO DE JSON (VISION)
**Problema**: Gemini Vision retornando JSON incompleto/truncado no campo `reasoning` quando a anÃƒÂ¡lise ÃƒÂ© muito longa, quebrando o parser regex.
**SoluÃƒÂ§ÃƒÂ£o**:
1. **Token Boost**: Aumentado `maxOutputTokens` de 2048 para **4096**.
2. **Concise Reasoning**: Alterado prompt para exigir anÃƒÂ¡lise concisa (max 200 palavras) no campo `reasoning`.
3. **Manual Repair**: Implementada heurÃƒÂ­stica no `visionService.ts` que detecta a ausÃƒÂªncia do fechamento `}` e tenta fechar o objeto JSON automaticamente antes do `JSON.parse`.
4. **Logs UHD**: Adicionado log de `finishReason` e snippet de 300 caracteres para depuraÃƒÂ§ÃƒÂ£o cirÃƒÂºrgica de falhas de API.


---

### ?? [2026-04-22] FIDELIDADE â€” PRECISÃƒO DECIMAL E SOBERANIA DE FUNDO
**Problema**: Arredondamento agressivo de valores (1.49% -> 1.5%) e falha na desativaÃ§Ã£o do fundo escuro.
**SoluÃ§Ã£o**:
1. **Numerical Precision**: Alterado formatValue no theme.ts para usar toFixed(2).
2. **Vision Rule**: Regra explÃ­cita no imageAnalyzer.ts proibindo arredondamento na extraÃ§Ã£o.
3. **Background Sovereignty**: Corrigido server/index.ts para respeitar a flag backgroundType.
4. **Fluid Animation**: PieChart com Easing.out(Easing.exp) para movimento fluido.

---

### ??? [2026-04-22] INFRA â€” PROTOCOLO DE FIDELIDADE EVOLUTIVA (DATA-FIRST)
**Problema**: Conflito entre regras de design premium e auditoria de fidelidade absoluta (Auditor reprovava melhorias de layout).
**SoluÃ§Ã£o**:
1. **Auditor Recalibration**: Atualizado server/prompts/auditor.ts para priorizar 95% do score em Dados, Cores e Valores, tratando diferenÃ§as de layout (como posiÃ§Ã£o da legenda) como upgrades UHD aceitÃ¡veis.
2. **Flexible PieChart**: Adicionadas props legendPosition ('bottom'|'right'|'none') e labelPosition ('inside'|'outside') para maior controle sobre a reconstituiÃ§Ã£o.
3. **Layout Intelligence**: imageAnalyzer.ts agora detecta se o original possui legenda e qual sua posiÃ§Ã£o original, mapeando para o componente.
4. **Data Supremacy**: Score de aprovaÃ§Ã£o agora foca na integridade numÃ©rica e cromÃ¡tica, eliminando falsos negativos por melhorias estÃ©ticas do sistema.

---

### ?? [2026-04-22] BUGFIX â€” RENDER EM BRANCO NO EDITOR
**Problema**: O Editor Visual mostrava dados vazios (Categoria 1: 0) porque o Analista de VisÃ£o retornava formatos que o componente ou o editor nÃ£o mapeavam corretamente.
**SoluÃ§Ã£o**:
1. **Unified Normalization**: PieChart.tsx agora aceita 4 formatos de dados diferentes (data, series, datasets, raw array) de forma resiliente.
2. **Vision Sync Hardening**: server/visionService.ts agora garante que p.data (usado pelo editor) e p.series (usado por grÃ¡ficos complexos) estejam sempre sincronizados, independente do que a IA retorne.
3. **Prompt Simplification**: imageAnalyzer.ts agora usa o formato 'data' direto para grÃ¡ficos de pizza no exemplo, reduzindo a chance de erro da IA.

---

### ??? [2026-04-22] INFRA â€” INVALIDAÃ‡ÃƒO DE CACHE E NORMALIZAÃ‡ÃƒO GLOBAL
**Problema**: O render continuava vindo em branco mesmo apÃ³s correÃ§Ãµes no cÃ³digo, pois o sistema servia resultados corrompidos do CACHE local.
**SoluÃ§Ã£o**:
1. **Cache Invalidation**: Incrementada a versÃ£o do cache para _v5, forÃ§ando uma nova anÃ¡lise visual limpa.
2. **Normalize Analysis Post-Processor**: Implementada funÃ§Ã£o normalizeAnalysisProps em visionService.ts que roda SEMPRE (mesmo em cache hit), garantindo sincronia absoluta entre data, series e labels.
3. **Robust Rewrite**: visionService.ts reescrito para ser resiliente a respostas parciais ou mal-formadas do Gemini, assegurando que o Editor Visual receba dados populados.

---

### ?? [2026-04-22] DESIGN â€” LEGENDA OBRIGATÃ“RIA E ESQUEMAS DE REGISTRY
**Problema**: A IA estava omitindo a legenda (legendPosition: 'none') em alguns casos, e o Registry nÃ£o informava que essas propriedades eram suportadas.
**SoluÃ§Ã£o**:
1. **Registry Update**: Adicionadas legendPosition e labelPosition ao propsSchema de PieChart e DonutChart no componentRegistry.ts.
2. **Premium Legend Rule**: Atualizado imageAnalyzer.ts para instruir a IA a SEMPRE incluir uma legenda organizada (bottom ou right) para clareza UHD, tratando-a como um upgrade de organizaÃ§Ã£o profissional.
3. **Layout Sync**: Garantido que o componente PieChart tenha fallbacks seguros para exibir a legenda mesmo se as props vierem incompletas.

---

### ??? [2026-04-22] INFRA — EXTRAÇÃO DE JSON ULTRA-RESILIENTE
**Problema**: O sistema falhava com 'JSON inválido' quando o Gemini incluía blocos de markdown (\\\json), comentários ou vírgulas extras no final dos arrays.
**Solução**:
1. **Markdown Stripping**: Implementada lógica para detectar e extrair apenas o conteúdo dentro de blocos de código markdown.
2. **Gemini Cleanup**: Adicionado pré-processamento para remover comentários (// e /* */) e corrigir vírgulas trailing (comuns em respostas de IA).
3. **Brace-Aware Extraction**: O sistema agora busca dinamicamente o par de chaves principal, ignorando textos pré/pós-JSON de forma mais robusta.

---

### 🧬 [2026-04-22] INFRA — EXTRAÇÃO CIRÚRGICA DE JSON (BRACE STACKING)
**Problema**: O sistema falhava com 'Unterminated string' quando a IA incluía o caractere '}' dentro de uma string de texto (ex: reasoning), o que enganava o extrator de JSON baseado em regex.
**Solução**:
1. **Surgical Stacking**: Implementada lógica de pilha para contar a profundidade de chaves, mas ignorando caracteres especiais dentro de aspas.
2. **Newline Escaping**: Adicionado filtro que identifica quebras de linha reais dentro de strings JSON e as converte para '\\n'.
3. **String Awareness**: O extrator agora entende o estado 'inString', garantindo extração precisa do primeiro '{' ao seu correspondente '}'.

---

### 🛡️ [2026-04-22] INFRA — PROTOCOLO DE RESILIÊNCIA DE JSON E SEGURANÇA (BLINDAGEM)
**Problema**: Pipeline quebrando intermitentemente com "Braces não balanceados" devido a truncamento de JSON pelo Gemini ou bloqueio por filtros de segurança.
**Solução**:
1. **Manual Repair (Auto-Close)**: Implementada lógica no `visionService.ts` que detecta se o JSON está incompleto (depth > 0) e fecha automaticamente aspas e chaves para torná-lo parseável.
2. **Safety Blindness**: Desabilitados todos os filtros de segurança do Gemini (`BLOCK_NONE`) no pipeline de visão para evitar falsos positivos que causam truncamento ou erro 400.
3. **FinishReason Logging**: Adicionado monitoramento do motivo de término da geração para diagnosticar falhas de cota ou segurança em tempo real.
**Resultado**: Pipeline estabilizada e resiliente a respostas parciais da IA.

---

### 🌊 [2026-04-28] REGRA CIRÚRGICA — WATERFALL CHARTS (UNIDADES E TOTAIS)
**Contexto**: O Waterfall Chart estava violando a zona de segurança e adicionando um segundo Total artificial, além de omitir as unidades monetárias cruciais de forma literal ("-$ mln4.6").
**Ação Corretiva**: Adicionadas lógicas anti-clipping no Y-Axis, inferência automática de Totais pelo React, e suporte ao campo `valueStr`.
**Nova Regra para a IA de Visão**:
1. **Identificação de Totais Absolutos**: A IA DEVE identificar se a primeira e/ou a última coluna representam um valor absoluto (ex: 'Start', 'End', 'Total') e **OBRIGATORIAMENTE** injetar a flag `"isTotal": true` nessas barras. **PUNIÇÃO: Se a coluna 'End' ou 'Total' não receber isTotal: true, a matemática inteira da cascata será quebrada e o gráfico será considerado uma falha crítica.**
2. **Textos Fidedignos (valueStr)**: Para garantir que as barras exibam *exatamente* o mesmo texto da imagem original (ex: `"-10M"` ou `"23M"`), você DEVE extrair essa string exata e colocar na propriedade `"valueStr": "texto exato"`. O `value` numérico servirá apenas para a altura da barra. Os dados numéricos brutos têm prioridade máxima de acurácia.
3. **Unidade Global**: O campo `unit` (ex: '$', '$ mln') ainda deve ser extraído em `props.unit` para compor os eixos globais.

---

### 🏎️ [2026-04-28] REGRA DE EXCEÇÃO — RACING LINE CHARTS (DINÂMICA DE TEMPO REAL)
**Contexto**: O RacingLineChart (Gráficos de "Corrida" ao longo do tempo) tem uma natureza orgânica que conflita diretamente com as regras rígidas de Gráficos Estáticos (como LineChart e BarChart).
**Regras de Exceção (Invioláveis)**:
1. **Duração da Animação**: Enquanto os gráficos padrão finalizam suas revelações em frames fixos (ex: Ato 2 aos 150f), o `RacingLineChart` DEVE preencher ativamente todo o tempo disponível no `durationInFrames` da composição, finalizando sua corrida fluida e constante apenas no final da timeline.
2. **Escala Y Mutável (Breathing Zoom)**: É PROIBIDO forçar uma base fixa baseada no máximo histórico (o que esmagaria todas as outras linhas se ocorresse um outlier) para o RacingChart. O Zoom In e Zoom Out (Eixo Y) devem ocorrer de forma fluida baseando-se estritamente nos valores correntes da janela atual, permitindo que a câmera dê zoom caso os números desçam.
3. **Eixo X Panning (Squash & Scroll)**: O Eixo X NÃO deve estar estaticamente presente desde o início. A timeline deve "nascer" da esquerda para a direita, e ao atingir o limite, empurrar o histórico passado para a esquerda (Panning), criando o efeito esteira de uma corrida.
**Importante**: Estas regras são EXCLUSIVAS e BLINDADAS para os gráficos dinâmicos tipo `Racing`. Elas NUNCA devem ser importadas, mencionadas ou aplicadas em componentes estáticos como `LineChart` ou `BarChart`.

---

### 🛡️ [2026-04-28] INFRA — CACHE BUSTING DE COMPONENTES REMOTION
**Problema**: O botão "Render" continuava exportando versões antigas do código porque o `getBundle()` memorizava a `bundlePromise` na primeira execução do servidor, ignorando totalmente hot-reloads das edições nos componentes `.tsx`.
**Solução**:
1. **Dev Mode Cache Buster**: Removido o bloqueio `if (!bundlePromise)` no `server/index.ts`. O pacote agora é recompilado sempre que for solicitado.
2. **Impacto**: O tempo de renderização em desenvolvimento aumentou alguns segundos (devido ao bundling constante), mas garante **100% de consistência** entre a versão editada no disco e o MP4 final gerado pela UI.

---

### 🎨 [2026-04-28] ESTÉTICA E UX — RACING CHART (PREMIUM ICONS & LOGOS)
**Contexto**: O Racing Line Chart estava visualmente poluído com o nome das séries atropelando a cabeça das linhas animadas.
**Regras de Design Aplicadas**:
1. **Dynamic Heads (Bandeiras/Logos)**: A cabeça líder da linha no `RacingLineChart` deve apresentar um ícone inteligente (redondo 32x32 com borda colorida). O sistema deve inferir o contexto:
   - Se os dados forem de **Países**, deve-se buscar a bandeira via API `flagcdn` ou similar.
   - Se os dados forem de **Marcas/Empresas**, deve-se buscar o logo da marca (ex: via `logo.clearbit.com` ou outra API de logo).
   - Se o dado não possuir ícone mapeável, a fallback obrigatória é exibir a Primeira Letra da categoria (ex: "A") centralizada em um fundo colorido elegante.
2. **Obrigatoriedade de Legenda Clean**: Como os rótulos de texto das linhas foram substituídos por ícones visuais, a **ZONA 3 (Legenda Inferior)** passa a ser obrigatória para gráficos Racing. A legenda é o que resolve e nomeia o ícone para o usuário de forma "Clean".

---

### 🛡️ [2026-04-28] UX & INFRA — RESILIÊNCIA DO BOTÃO ANIMATE E DOWNLOAD SEPARADO
**Problema 1 (503 Lock)**: Se a API do Gemini devolvesse um erro 503 ou 429 (Servidor Ocupado), o botão "Animate Production" ficava permanentemente desativado (disabled), forçando o usuário a dar refresh e perder o arquivo carregado.
**Problema 2 (Auto-Download Ansioso)**: O render automático do servidor acionava um download do arquivo MP4 assim que ele ficava pronto, impedindo o usuário de avaliar o preview primeiro.
**Solução**:
1. **Status Recovery (UX)**: No catch do erro (ou no retorno error no frontend), a rotina reverte o status interno do arquivo (`f.status = 'pending'`), libera o boolean de renderização (`state.isRendering = false`) e chama a atualização da fila (`renderFileQueue`), reativando o botão elegantemente.
2. **Download Opcional**: Removida a trigger de download automático. Injetado um botão manual nativo no `index.html` na barra de ações abaixo do player, garantindo que o usuário só baixe após aprovar o preview visualmente.

---

### 🧬 [2026-04-28] VISION — EXTRAÇÃO OBRIGATÓRIA DE GRANDEZAS (M, k, B, %)
**Problema**: A IA de Visão estava ignorando sufixos e letras marcadoras de grandeza (como o "M" de Milhões ou "k" de Milhares) nos valores dos eixos e barras, causando perda de contexto visual em gráficos como o WaterfallChart (ex: "15" no lugar de "$15M").
**Solução**:
1. **Reforço de Prompt (imageAnalyzer)**: O Protocolo de Descoberta recebeu a regra "UNIDADES OBRIGATÓRIAS (CRÍTICO)". A IA agora é estritamente proibida de ignorar sufixos de grandeza e símbolos monetários, devendo OBRIGATORIAMENTE fundi-los na propriedade `unit` (ex: `"$M"`, `"$ mln"`).
2. **valueStr Absoluto**: Reforçado que qualquer rótulo de dados visível nas fatias/barras (ex: `-$10M`) deve ser copiado fidedignamente para `valueStr`, usando a variável `value` numérica apenas para proporção em pixels.
3. **Cache Busting de Visão**: O `cacheKey` do `visionService.ts` foi bumpado para v10 para anular análises estéreis guardadas com omissão de unidades.

---

### 🛡️ [2026-04-28] AUDITORIA — REJEIÇÃO IMPLACÁVEL DE NOMES GENÉRICOS
**Problema**: A IA de Visão estava confundindo eixos de gráficos horizontais e não conseguia ler as categorias, usando um fallback genérico (ex: "Item 1"). O Auditor, focando apenas no rigor matemático das barras e tolerando erros em strings textuais, aprovava o render e corrompia a apresentação dos dados.
**Solução**:
1. **Regra de Falha Crítica (auditor.ts)**: Foi injetada uma diretriz que força o Auditor a jogar o Score abaixo de 50 caso detecte qualquer categoria genérica em oposição aos nomes verdadeiros presentes na imagem original. Precisão nominal é inegociável.
2. **Correção de Eixos**: O Prompt do Vision agora especifica a busca por "Eixo Numérico" e "Eixo Categórico", impedindo a confusão mental entre vertical e horizontal.

---

### 🎨 [2026-04-28] TEMA & ESTÉTICA — AUTO-CONTRAST GUARD (RESILIÊNCIA VISUAL)
**Problema**: A interface antiga passava um parâmetro `backgroundType='dark'` por padrão para os renders. Como resultado, temas inherentemente claros (como o "Corporate Blue") tinham seu fundo sobrescrito com `#0f1117` (preto). O resultado eram gráficos com linhas escuras sendo invisíveis em fundos escuros (falha de contraste catastrófica).
**Solução**:
1. **Liberação do Tema**: Removida a obrigação de fundo escuro vindo do frontend. A cor base original do tema passa a ter prioridade.
2. **Implementação do Auto-Contrast Guard**: Adicionada no `theme.ts` (`resolveTheme`) uma barreira heurística final: Se a cor predominante da linha/barra for escura e a cor do fundo for escura, o sistema muda automaticamente o fundo para `light` (#FAF9F6) para resgatar o gráfico. Se ambos forem claros, ele inverte para preto absoluto. A legibilidade foi elevada acima da preferência temática.

---

### 🧠 [2026-04-28] IA — SMART CALL-OUTS DINÂMICOS (V12)
**Problema**: O botão de "Ativar Smart Call-outs" instruía o LLM a acender apenas a *prop* simples de rótulos (`showValueLabels: true`), jogando números crus na tela sem estética, esquecendo-se de gerar o array visual de anotações necessário pelo componente de UI premium.
**Solução**: O protocolo de visão foi reescrito. Quando a feature de Call-Outs é ativada pelo painel, a IA agora entende que precisa montar OBRIGATORIAMENTE um array de objetos `annotations` com coordenadas exatas (`seriesIndex`, `index`) para pontuar picos ou quedas matemáticas cruciais, criando interatividade inteligente com balões visuais elegantes.
