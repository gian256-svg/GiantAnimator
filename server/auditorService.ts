import fs from 'fs';
import sharp from 'sharp';
import { ai } from './agent.js';
import { buildAuditorPrompt } from './prompts/auditor.js';
import { GEMINI_MODEL } from './calibration/constants.js';

export interface FidelityAudit {
  score: number;
  isApproved: boolean;
  critique: string;
  recommendedAdjustments?: {
    reasoning?: string;
    forceMaxY?: number;
  };
}

/**
 * Auditoria de Fidelidade: Compara o original com o renderizado
 */
export async function auditRenderFidelity(
  originalImagePath: string,
  renderedStillPath: string
): Promise<FidelityAudit> {
  console.log(`🔍 [Tomé] Iniciando auditoria de fidelidade...`);
  
  const originalRaw = fs.readFileSync(originalImagePath);
  const renderedRaw = fs.readFileSync(renderedStillPath);

  // ─── Otimizar Imagens para o Auditor (UHD Awareness) ───
  // Aumentado para 1920p para garantir leitura de labels pequenos em 4K
  const optOriginal = await sharp(originalRaw).resize(1920, 1920, { fit: 'inside' }).jpeg({ quality: 85 }).toBuffer();
  const optRendered = await sharp(renderedRaw).resize(1920, 1920, { fit: 'inside' }).jpeg({ quality: 85 }).toBuffer();

  const originalB64  = optOriginal.toString('base64');
  const renderedB64  = optRendered.toString('base64');
  const originalMime = 'image/jpeg';
  const renderedMime = 'image/jpeg';

  console.log(`📎 [AUDITOR] Otimizando imagens para 1920p...`);

  const prompt = buildAuditorPrompt();

  let retries = 0;
  const MAX_RETRIES = 2;
  while (retries <= MAX_RETRIES) {
    try {
      const model = ai.getGenerativeModel({ model: GEMINI_MODEL });

      // ⏱️ TIMEOUT GATE (20s): Auditor é tarefa simples, não precisa de 45s
      const auditPromise = model.generateContent([
        { text: "ESTA É A IMAGEM ORIGINAL DE REFERÊNCIA:" },
        { inlineData: { data: originalB64, mimeType: originalMime } },
        { text: "ESTE É O RENDER GERADO PELO SISTEMA (FRAME 480 — ANIMAÇÃO COMPLETA):" },
        { inlineData: { data: renderedB64, mimeType: renderedMime } },
        { text: prompt }
      ]);

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("GATEWAY_TIMEOUT: Auditor demorou mais de 20s")), 20000)
      );

      const result: any = await Promise.race([auditPromise, timeoutPromise]);
      
      const responseText = result.response?.text() || "";
      console.log(`📥 [AUDITOR] Resposta recebida do Gemini (${responseText.length} chars).`);
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) throw new Error("Auditor não retornou JSON válido");

      const audit: FidelityAudit = JSON.parse(jsonMatch[0]);
      console.log(`⚖️ [AUDITOR] Score: ${audit.score}/100 | Aprovado: ${audit.isApproved}`);
      return audit;
    } catch (err: any) {
      const is503 = err.message?.includes("503") || err.message?.includes("UNAVAILABLE") || err.message?.includes("429");
      if (is503 && retries < MAX_RETRIES) {
        retries++;
        (await import("./agent.js")).rotateKey();
        const delay = Math.min(retries * 3000, 8000);
        console.warn(`⚠️ [AUDITOR] Gemini 503 (Demanda Alta). Retry ${retries}/${MAX_RETRIES} em ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      console.error(`❌ [AUDITOR] Falha na auditoria:`, err.message);

      // 🛡️ RESILIÊNCIA TOTAL: Qualquer erro na auditoria primária dispara os fallbacks.
      if (true) {
        // ── Fallback 2: Groq ─────────────────────────────────────
        if (process.env.GROQ_API_KEY) {
          console.warn(`⚠️ [AUDITOR] Gemini offline. Chaveando para GROQ AUDITOR...`);
          try {
            const { auditRenderFidelityWithGroq } = await import("./groqService.js");
            const audit = await auditRenderFidelityWithGroq(originalImagePath, renderedStillPath);
            return audit;
          } catch (groqErr: any) {
            console.error("❌ [AUDITOR] Fallback Groq Auditor falhou:", groqErr.message);
          }
        } else {
          console.warn(`⚠️ [AUDITOR] Pular Groq: GROQ_API_KEY não definida.`);
        }

        // ── Fallback 3: Ollama local ─────────────────────────────
        try {
          console.warn(`⚠️ [AUDITOR] Usando Ollama como fallback final...`);
          const { auditRenderFidelityWithOllama } = await import("./ollamaService.js");
          const audit = await auditRenderFidelityWithOllama(originalImagePath, renderedStillPath);
          return audit;
        } catch (ollamaErr: any) {
          console.warn("⚠️ [AUDITOR] Ollama local offline para auditoria.");
        }

        console.error(`❌ [AUDITOR] Todos os provedores cloud offline. BLOQUEANDO RENDER por falta de auditoria de fidelidade.`);
        return {
          score: 0,
          isApproved: false,
          critique: "❌ FALHA TÉCNICA: Os sistemas de auditoria (Google/Groq/Ollama) estão indisponíveis. Para garantir 100% de fidelidade UHD, o processo foi interrompido. Verifique sua conexão ou chaves de API."
        };
      }

      // Se não for erro de infraestrutura (ex: erro de lógica ou imagem corrompida), aí sim reportamos falha.
      return {
        score: 100,
        isApproved: true,
        critique: `⚠️ Auditoria ignorada por erro técnico: ${err.message}. Prosseguindo por resiliência.`
      };
    }
  }
  return { score: 0, isApproved: false, critique: "Audit Timeout" };
}
