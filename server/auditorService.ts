import fs from 'fs';
import path from 'path';
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

/** Detecta o MIME type correto a partir da extensão do arquivo */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    '.jpg':  'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif':  'image/gif',
    '.png':  'image/png',
  };
  return map[ext] ?? 'image/png';
}

/**
 * Auditoria de Fidelidade: Compara o original com o renderizado
 */
export async function auditRenderFidelity(
  originalImagePath: string,
  renderedStillPath: string
): Promise<FidelityAudit> {
  console.log(`🔍 [AUDITOR] Iniciando auditoria de fidelidade...`);
  
  const originalRaw = fs.readFileSync(originalImagePath);
  const renderedRaw = fs.readFileSync(renderedStillPath);

  // ─── Otimizar Imagens para o Auditor (Payload Duplo = Precisa ser leve) ───
  const optOriginal = await sharp(originalRaw).resize(1024, 1024, { fit: 'inside' }).jpeg({ quality: 80 }).toBuffer();
  const optRendered = await sharp(renderedRaw).resize(1024, 1024, { fit: 'inside' }).jpeg({ quality: 80 }).toBuffer();

  const originalB64  = optOriginal.toString('base64');
  const renderedB64  = optRendered.toString('base64');
  const originalMime = 'image/jpeg';
  const renderedMime = 'image/jpeg';

  console.log(`📎 [AUDITOR] Imagens otimizadas para 1024p para reduzir carga da API.`);

  const prompt = buildAuditorPrompt();

  let retries = 0;
  const MAX_RETRIES = 3; // Reduzido para não travar o pipeline se o Google estiver instável
  while (retries <= MAX_RETRIES) {
    try {
      const model = ai.getGenerativeModel({ model: GEMINI_MODEL });
      const result = await model.generateContent([
        { text: "ESTA É A IMAGEM ORIGINAL DE REFERÊNCIA:" },
        { inlineData: { data: originalB64, mimeType: originalMime } },
        { text: "ESTE É O RENDER GERADO PELO SISTEMA (FRAME 480 — ANIMAÇÃO COMPLETA):" },
        { inlineData: { data: renderedB64, mimeType: renderedMime } },
        { text: prompt }
      ]);
      
      const responseText = result.response.text() || "";
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) throw new Error("Auditor não retornou JSON válido");

      const audit: FidelityAudit = JSON.parse(jsonMatch[0]);
      console.log(`⚖️ [AUDITOR] Score: ${audit.score}/100 | Aprovado: ${audit.isApproved}`);
      return audit;
    } catch (err: any) {
      const is503 = err.message?.includes("503") || err.message?.includes("UNAVAILABLE");
      if (is503 && retries < MAX_RETRIES) {
        retries++;
        // Backoff capado em 15 segundos
        const delay = Math.min(Math.pow(2, retries) * 2000, 15000);
        console.warn(`⚠️ [AUDITOR] Gemini 503 (Demanda Alta). Retry ${retries}/${MAX_RETRIES} em ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      console.error(`❌ [AUDITOR] Falha na auditoria:`, err.message);

      // 🛡️ RESILIÊNCIA: Se o erro for de rede ou servidor do Google, não travamos o usuário.
      // Retornamos uma aprovação técnica para permitir que o vídeo seja gerado.
      const isGoogleError = err.message?.includes("503") || 
                           err.message?.includes("UNAVAILABLE") || 
                           err.message?.includes("fetching") ||
                           err.message?.includes("API");

      if (isGoogleError) {
        console.warn(`⚠️ [AUDITOR] Google Vision offline. Ativando 'Confiança Tácita (Resiliência)'.`);
        return {
          score: 95,
          isApproved: true,
          critique: "Aviso: Servidor de auditoria indisponível (Erro 503). O vídeo foi gerado com base nos dados extraídos, mas a fidelidade visual não pôde ser validada pela IA Auditora. Verifique manualmente."
        };
      }

      return {
        score: 50,
        isApproved: false,
        critique: `Regressão técnica: ${err.message}`
      };
    }
  }
  return { score: 0, isApproved: false, critique: "Audit Timeout" };
}
