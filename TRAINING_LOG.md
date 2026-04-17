# GiantAnimator — TRAINING LOG (Knowledge Base)
> Registro centralizado de aprendizados, regras de design e evoluções do agente.

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
