import fs from 'fs';
import { ai } from './agent.js';
import { buildAuditorPrompt } from './prompts/auditor.js';

export interface FidelityAudit {
  score: number;
  isApproved: boolean;
  critique: string;
  recommendedAdjustments?: {
    reasoning?: string;
    forceMaxY?: number;
  };
}

import { GEMINI_MODEL } from './calibration/constants.js';

/**
 * Auditoria de Fidelidade: Compara o original com o renderizado
 */
export async function auditRenderFidelity(
  originalImagePath: string,
  renderedStillPath: string
): Promise<FidelityAudit> {
  console.log(`🔍 [AUDITOR] Iniciando auditoria de fidelidade...`);
  
  const originalB64 = fs.readFileSync(originalImagePath).toString('base64');
  const renderedB64 = fs.readFileSync(renderedStillPath).toString('base64');
  
  const prompt = buildAuditorPrompt();

    let retries = 0;
    const MAX_RETRIES = 3;
    while (retries <= MAX_RETRIES) {
      try {
        const model = ai.getGenerativeModel({ model: GEMINI_MODEL });
        const result = await model.generateContent([
          { text: "ESTA É A IMAGEM ORIGINAL DE REFERÊNCIA:" },
          { inlineData: { data: originalB64, mimeType: "image/png" } },
          { text: "ESTE É O RENDER GERADO PELO SISTEMA (PAUSE NO FRAME 240):" },
          { inlineData: { data: renderedB64, mimeType: "image/png" } },
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
          const delay = Math.pow(2, retries) * 2000;
          console.warn(`⚠️ [AUDITOR] Gemini 503 (Demanda Alta). Retry ${retries}/${MAX_RETRIES} em ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        console.error(`❌ [AUDITOR] Falha crítica na auditoria:`, err.message);
        return {
          score: 50,
          isApproved: false,
          critique: `Regressão técnica: ${err.message}`
        };
      }
    }
    return { score: 0, isApproved: false, critique: "Audit Timeout" };
}
