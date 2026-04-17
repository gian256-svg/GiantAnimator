import fs from "fs";
import path from "path";
import sharp from "sharp";
import crypto from "crypto";
import { ai } from "./agent.js";
import { GEMINI_MODEL_VISION } from "./calibration/constants.js";
import { COMPONENT_REGISTRY } from "./componentRegistry.js";
import { buildImageAnalysisPrompt } from "./prompts/imageAnalyzer.js";
import { type ChartAnalysis } from "./types.js";

/**
 * Serviço de Visão Compartilhado para análise de imagens de gráficos.
 */
export async function analyzeChartImage(imagePath: string, requestedTheme?: string): Promise<ChartAnalysis> {
  const rawImageData = fs.readFileSync(imagePath);

  // ─── MD5 Cache ───────────────────────────────────────────────
  const IS_VERCEL = !!process.env.VERCEL;
  const hash      = crypto.createHash("md5").update(rawImageData).digest("hex");
  const cacheDir  = IS_VERCEL ? "/tmp/cache" : path.join(process.cwd(), "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  const cacheFile = path.join(cacheDir, `${hash}.json`);

  if (fs.existsSync(cacheFile) && process.env.GEMINI_MOCK !== "true") {
    console.log(`📦 [VISION] Cache hit: ${hash}`);
    return JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
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

  // ─── Otimizar imagem (UHD-Ready para Vision) ──────────────────
  const optimizedBuffer = await sharp(rawImageData)
    .resize(2560, 1440, { fit: "inside", withoutEnlargement: true })
    .toBuffer();

  const imageBase64  = optimizedBuffer.toString("base64");
  const registryJson = JSON.stringify(COMPONENT_REGISTRY, null, 2);
  let prompt       = buildImageAnalysisPrompt(registryJson);

  // Detecção Automática de Tema baseada na Luminância Original
  prompt += `
### DETECÇÃO DE AMBIENTE:
Analise a cor predominante do fundo. 
- Se o fundo for branco/claro/off-white (como na imagem original), defina backgroundColor como o Hex exato e SEMPRE use o tema "light" ou "corporate" ou "minimal".
- Se o fundo for preto/escuro, use tema "dark".
`;

  if (requestedTheme === 'original') {
    prompt += `
### PRESERVAÇÃO RIGOROSA:
O usuário deseja fidelidade cromática total. Extraia as cores Hex de CADA linha e coloque nos respectivos objetos do array "series".
`;
  }

  // ─── Chamada Gemini com Retry ────────────────────────────────
  let response;
  let retries = 0;
  const MAX_RETRIES = 3;

  while (retries <= MAX_RETRIES) {
    try {
      response = await ai.models.generateContent({
        model: GEMINI_MODEL_VISION || "models/gemini-2.0-flash",
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { data: imageBase64, mimeType: "image/png" } },
              { text: prompt },
            ],
          },
        ],
      });
      break; // Sucesso!
    } catch (err: any) {
      if (err.message?.includes("503") || err.status === 503) {
        retries++;
        if (retries > MAX_RETRIES) throw err;
        const delay = Math.pow(2, retries) * 1000;
        console.warn(`⚠️ [VISION] Gemini 503 (Demanda Alta). Tentativa ${retries}/${MAX_RETRIES} em ${delay}ms...`);
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

  // ─── Salvar cache ────────────────────────────────────────────
  fs.writeFileSync(cacheFile, JSON.stringify(analysis, null, 2));
  console.log(`✅ [VISION] Análise concluída → ${analysis.componentId} | ${analysis.props.data.length} pontos`);

  return analysis;
}
