import fs from "fs";
import path from "path";
import sharp from "sharp";
import crypto from "crypto";
import Tesseract from "tesseract.js";
import { ai } from "./agent.js";
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { GEMINI_MODEL_VISION } from "./calibration/constants.js";
import { COMPONENT_REGISTRY } from "./componentRegistry.js";
import { buildImageAnalysisPrompt } from "./prompts/imageAnalyzer.js";
import { type ChartAnalysis } from "./types.js";

/**
 * Serviço de Visão Compartilhado para análise de imagens de gráficos.
 */
export async function analyzeChartImage(
  imagePath: string, 
  requestedTheme?: string,
  auditorCritique?: string,
  settings: { includeCallouts?: boolean } = {},
  onProgress?: (message: string) => void
): Promise<ChartAnalysis> {
  const rawImageData = fs.readFileSync(imagePath);

  // ─── MD5 Cache ───────────────────────────────────────────────
  const IS_VERCEL = !!process.env.VERCEL;
  // CRITICAL FIX: O cache deve incluir requestedTheme E auditorCritique.
  // Sem isso, re-análises com feedback do auditor retornam o resultado ruim em cache
  const cacheKey  = `${crypto.createHash("md5").update(rawImageData).digest("hex")}_${requestedTheme || 'default'}_${auditorCritique ? crypto.createHash("md5").update(auditorCritique).digest("hex") : 'nocritic'}`;
  const cacheDir  = IS_VERCEL ? "/tmp/cache" : path.join(process.cwd(), "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  const cacheFile = path.join(cacheDir, `${cacheKey}.json`);

  if (fs.existsSync(cacheFile) && process.env.GEMINI_MOCK !== "true") {
    const cached = JSON.parse(fs.readFileSync(cacheFile, "utf-8")) as ChartAnalysis;
    // Valida o cache: não serve resultados com dados vazios
    const hasData = (cached.props?.series?.length > 0 && cached.props?.series[0]?.data?.length > 0) 
                 || (cached.props?.data?.length > 0);
    if (hasData) {
      console.log(`📦 [VISION] Cache hit: ${cacheKey.slice(0,16)}...`);
      return cached;
    }
    console.warn(`⚠️ [VISION] Cache inválido (dados vazios), re-analisando: ${cacheKey.slice(0,16)}...`);
    fs.unlinkSync(cacheFile); // Remove o cache inválido
  }

  // ─── Mock ────────────────────────────────────────────────────
  if (process.env.GEMINI_MOCK === "true") {
    console.log(`🤖 [VISION] Modo mock ativado`);
    return {
      componentId: "BarChart",
      reasoning:   "MODO MOCK ATIVADO",
      props: {
        title: "Mock Chart",
        data:  [{ label: "A", value: 10 }, { label: "B", value: 20 }],
      },
    };
  }

  console.log(`🔍 [VISION] Enviando para Gemini Vision...`);

  // ─── Otimizar imagem (1920p JPEG - Equilíbrio ideal entre fidelidade e estabilidade) ───
  const optimizedBuffer = await sharp(rawImageData)
    .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  // ─── Processamento Híbrido: OCR Local (Pre-pass) ───────────────────
  console.log(`🧠 [HYBRID] Iniciando OCR local...`);
  const ocrResult = await Tesseract.recognize(optimizedBuffer, 'por+eng');
  const ocrText = ocrResult.data.text;
  console.log(`📝 [HYBRID] Texto detectado localmente (${ocrText.length} chars)`);

  // Injetar OCR no prompt para ajudar a IA
  prompt += `\n\n### DADOS DETECTADOS VIA OCR LOCAL (Use como referência de apoio):\n${ocrText}\n`;

  console.log(`📏 [VISION] Payload otimizado: ${(optimizedBuffer.length / 1024).toFixed(1)} KB`);

  const imageBase64  = optimizedBuffer.toString("base64");
  const registryJson = JSON.stringify(COMPONENT_REGISTRY, null, 2);
  let prompt       = buildImageAnalysisPrompt(registryJson, settings.includeCallouts);

  // ─── Semantic RAG (Filtragem por Pertinência) ──────────────────────
  const trainingLogPath = path.join(process.cwd(), "..", "TRAINING_LOG.md");
  if (fs.existsSync(trainingLogPath)) {
    const trainingLog = fs.readFileSync(trainingLogPath, "utf-8");
    const knowledge = getRelevantKnowledge(trainingLog, auditorCritique || "");
    prompt += `\n\n### DIRETRIZES DE DESIGN E APRENDIZADOS RELEVANTES:\n${knowledge}\n`;
  }

  // Detecção Automática de Tema baseada na Luminância Original
  prompt += `
### DETECÇÃO DE AMBIENTE:
Analise a cor predominante do fundo. 
- Se o fundo for branco/claro/off-white (como na imagem original), defina backgroundColor como o Hex exato e SEMPRE use o tema "light" ou "corporate" ou "minimal".
- Se o fundo for preto/escuro, use tema "dark".

### ESTILO DE FUNDO (bgStyle):
Identifique se o gráfico original possui texturas:
- Se houver gradientes suaves ou borrões de cor: bgStyle = "mesh".
- Se houver linhas de grade horizontais e verticais formando um padrão: bgStyle = "grid".
- Se for liso: bgStyle = "none".

### PRESERVAÇÃO RIGOROSA:
O usuário deseja fidelidade cromática total. Extraia as cores Hex de CADA linha e coloque nos respectivos objetos do array "series".
Se houver sombras ou relevo, tente replicar isso via props de estilo se disponíveis.
`;

  if (auditorCritique) {
    prompt += `
### ⚠️ FEEDBACK DA AUDITORIA (CORREÇÃO NECESSÁRIA):
O render anterior falhou nos seguintes pontos. AJUSTE sua extração para corrigir:
${auditorCritique}
`;
  }

  // ─── Chamada Gemini com Retry ────────────────────────────────
  let response;
  let retries = 0;
  const MAX_RETRIES = 13;   // Máximo 13 tentativas para aguentar instabilidade 503
  const GLOBAL_TIMEOUT_MS = 90_000; // 90s timeout global para não travar o job

  while (retries <= MAX_RETRIES) {
    try {
      const model = ai.getGenerativeModel({ model: GEMINI_MODEL_VISION });

      // Timeout global para evitar que o job fique preso indefinidamente
      const geminiCall = model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { data: imageBase64, mimeType: "image/jpeg" } },
              { text: prompt },
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          topP: 0.1,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      });
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`GEMINI_TIMEOUT: API não respondeu em ${GLOBAL_TIMEOUT_MS / 1000}s`)), GLOBAL_TIMEOUT_MS)
      );
      const result = await Promise.race([geminiCall as any, timeout]);
      response = result.response;
      break; // Sucesso!
    } catch (err: any) {
      const isStatus503 = err.message?.includes("503") || err.status === 503 || err.message?.includes("UNAVAILABLE");
      const isTimeout   = err.message?.includes("GEMINI_TIMEOUT");
      
      if (isStatus503 || isTimeout) {
        retries++;
        const msg = `⚠️ ${isTimeout ? 'Timeout' : 'Gemini 503'} - Tentativa ${retries}/${MAX_RETRIES}`;
        
        if (onProgress) onProgress(msg);
        
        if (retries > MAX_RETRIES) {
          console.warn(`🚨 [HYBRID] Gemini Vision falhou (503). Iniciando Fallback para IA de Texto...`);
          
          if (onProgress) onProgress("⚠️ Vision Offline. Tentando reconstrução via OCR Texto...");

          // FALLBACK: Chamada puramente de TEXTO usando os dados do OCR local
          const textModel = ai.getGenerativeModel({ model: GEMINI_MODEL_VISION }); // Mesmo modelo mas sem imagem
          const textPrompt = `
            O SERVIDOR DE VISÃO ESTÁ INSTÁVEL. Abaixo está o resultado bruto de um OCR de um gráfico.
            Sua missão é RECONSTRUIR o JSON do gráfico usando APENAS esse texto e seguindo TODAS as regras do GiantAnimator.
            
            TEXTO OCR:
            """
            ${ocrText}
            """

            ${prompt}
          `;

          const textResult = await textModel.generateContent(textPrompt);
          response = textResult.response;
          console.log(`✅ [HYBRID] Reconstrução via Texto concluída com sucesso!`);
          break; // Sai do loop de retries pois o fallback funcionou
        }
        // Backoff: 2s, 4s, 8s... capado em 12s
        const delay = Math.min(Math.pow(2, retries) * 2000, 12000);
        console.warn(`⚠️ [VISION] ${isTimeout ? 'Timeout' : 'Gemini 503'}. Tentativa ${retries}/${MAX_RETRIES} em ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err; // Erro real (400, 401, etc) - não tenta de novo
      }
    }
  }

  // ─── ✅ FIX: extrair texto corretamente ───────────────────────
  if (!response) {
    throw new Error("Falha ao obter resposta do Gemini Vision após múltiplas tentativas.");
  }

  const responseText =
    response.candidates?.[0]?.content?.parts?.[0]?.text
    ?? (response as any).text  // fallback caso SDK normalize futuramente
    ?? "";

  console.log(`📝 [VISION] Raw response (200 chars): ${responseText.slice(0, 200)}`);

  if (!responseText.trim()) {
    throw new Error(
      `Gemini Vision retornou resposta vazia. ` +
      `Finish reason: ${response.candidates?.[0]?.finishReason ?? "desconhecido"}`
    );
  }

  // ─── Extrair JSON ────────────────────────────────────────────
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(
      `Sem JSON na resposta do Gemini Vision. ` +
      `Resposta recebida: ${responseText.slice(0, 300)}`
    );
  }

  let analysis: ChartAnalysis;
  try {
    analysis = JSON.parse(jsonMatch[0]) as ChartAnalysis;
  } catch (parseErr: any) {
    throw new Error(`JSON inválido do Gemini Vision: ${parseErr.message}. Trecho: ${jsonMatch[0].slice(0, 200)}`);
  }

  // ─── ✅ Validar campos obrigatórios ───────────────────────────
  if (!analysis.componentId) {
    console.warn(`⚠️  [VISION] componentId ausente, usando fallback 'BarChart'`);
    analysis.componentId = "BarChart";
  }
  if (!analysis.reasoning) {
    analysis.reasoning = "Análise concluída sem descrição";
  }
  if (!analysis.props || typeof analysis.props !== "object") {
    throw new Error(`analysis.props ausente ou inválido no retorno do Gemini`);
  }
  if (!Array.isArray(analysis.props.data)) {
    console.warn(`⚠️  [VISION] props.data ausente, inicializando vazio`);
    analysis.props.data = [];
  }

  // ─── ✅ VALIDAR ID DO COMPONENTE (Anti-Hallucination) ────────
  const validIds = COMPONENT_REGISTRY.map(c => c.id);
  if (!validIds.includes(analysis.componentId)) {
    console.log(`🛡️ [VISION] ID Hallucinado detectado: ${analysis.componentId}`);
    
    // Heurística de Resgate baseada no Reasoning ou Dados
    const reasoning = (analysis.reasoning || "").toLowerCase();
    const hasSeries = (analysis.props.series && analysis.props.series.length > 0);
    
    if (reasoning.includes("linha") || reasoning.includes("line") || hasSeries) {
        analysis.componentId = "LineChart";
    } else if (reasoning.includes("pizza") || reasoning.includes("pie") || reasoning.includes("fatia")) {
        analysis.componentId = "PieChart";
    } else if (reasoning.includes("horizontal") || reasoning.includes("barra deit")) {
        analysis.componentId = "HorizontalBarChart";
    } else {
        analysis.componentId = "BarChart";
    }
    console.log(`✅ [VISION] Resgate concluído -> Usando: ${analysis.componentId}`);
  }
  // ─── ✅ Heurística de Unidade (Conserta falhas de extração da IA) ───
  if (!analysis.props.unit) {
    const textToSearch = (analysis.props.title || "") + " " + (analysis.props.subtitle || "") + " " + 
                         analysis.props.data.map((d: any) => d.label).join(" ") + " " +
                         (analysis.props.labels?.join(" ") || "");
    
    if (textToSearch.includes("%")) {
      console.log(`💡 [VISION] Heurística: Detectado '%' nos textos, forçando unit='%'`);
      analysis.props.unit = "%";
    } else if (textToSearch.includes("$") || textToSearch.toLowerCase().includes("vendas")) {
      console.log(`💡 [VISION] Heurística: Detectado '$' ou 'vendas', sugerindo unit='$'`);
      analysis.props.unit = "$";
    }
  }

  // ─── ✅ VALIDAR INTEGRIDADE DOS DADOS (Evitar Gráficos em Branco) ───
  const p = analysis.props;
  
  // Sincronização de Formato (Surgical-Grade Fix)
  if (p.series && p.series.length > 0 && (!p.data || p.data.length === 0)) {
      // Fallback para labels se estiverem ausentes
      if (!p.labels || p.labels.length === 0) {
          console.log("💡 [VISION] Labels ausentes na série, gerando índices automáticos.");
          p.labels = p.series[0].data.map((_: any, i: number) => `Item ${i + 1}`);
      }
      
      console.log("💉 [VISION] Sync: Mapeando series -> data.");
      p.data = p.labels.map((label: string, idx: number) => ({
          label,
          value: p.series[0].data[idx] || 0
      }));
  } else if (p.data && p.data.length > 0 && (!p.series || p.series.length === 0)) {
      console.log("💉 [VISION] Sync: Mapeando data -> series.");
      p.series = [{
          label: p.title || "Série 1",
          data: p.data.map((d: any) => d.value)
      }];
      if (!p.labels) p.labels = p.data.map((d: any) => d.label);
  }

  // Normalização de Cores
  if (p.seriesColors && !p.colors) {
      p.colors = p.seriesColors;
  }

  // REGRA DE NEGÓCIO: Unidades longas poluem o gráfico
  const unit = p.unit || "";
  if (unit.length > 6) {
     p.showValueLabels = false;
     console.log("🎨 [VISION] Minimalismo: Unidade longa detectada, ocultando labels.");
  }

  const hasSeriesData = p.series && p.series.length > 0 && p.series[0].data && p.series[0].data.length > 0;
  const hasDataPoints = p.data && p.data.length > 0;

  if (!hasSeriesData && !hasDataPoints) {
      console.error(`❌ [VISION] A IA não conseguiu extrair nenhum dado numérico desta imagem.`);
      throw new Error(`A detecção de dados falhou (Código: BLANK). IA não encontrou números na imagem.`);
  }

  // ─── Salvar cache ────────────────────────────────────────────
  fs.writeFileSync(cacheFile, JSON.stringify(analysis, null, 2));
  console.log(`✅ [VISION] Análise concluída → ${analysis.componentId} | ${analysis.props.data.length || (analysis.props.series?.[0].data.length)} pontos`);

  return analysis;
}

/**
 * Extrai apenas os blocos pertinentes do Training Log para não sobrecarregar o prompt.
 */
function getRelevantKnowledge(log: string, context: string): string {
  const blocks = log.split(/\n---\n/);
  const coreBlocks: string[] = [];
  const specificBlocks: string[] = [];

  // Keywords para busca de pertinência
  const contextLower = context.toLowerCase();

  for (const block of blocks) {
    const blockLower = block.toLowerCase();
    
    // Blocos que SEMPRE devem estar presentes (Regras de Ouro e Técnicas)
    if (blockLower.includes("regras de ouro") || blockLower.includes("regras técnicas absolutas")) {
      coreBlocks.push(block.trim());
      continue;
    }

    // Blocos específicos baseados no contexto (se houver auditoria ou detecção)
    const keywords = ["line", "bar", "pie", "donut", "area", "fidelity", "fidelidade", "escala", "overlap", "colisão", "theme", "tema"];
    if (keywords.some(k => contextLower.includes(k) && blockLower.includes(k))) {
      specificBlocks.push(block.trim());
    }
  }

  // Se não tiver contexto específico, pega os últimos 2 blocos de design premium para garantir estética
  if (specificBlocks.length === 0) {
    const designBlocks = blocks.filter(b => b.toLowerCase().includes("design") || b.toLowerCase().includes("ux")).slice(-2);
    specificBlocks.push(...designBlocks.map(b => b.trim()));
  }

  // Combina e limita o tamanho para segurança (máximo ~2500 chars de conhecimento)
  const combined = [...coreBlocks, ...specificBlocks].join("\n\n---\n\n");
  return combined.length > 2500 ? combined.slice(0, 2500) + "... (truncated)" : combined;
}
