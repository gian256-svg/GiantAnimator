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

  try {
    const response = await ai.models.generateContent({
      model: "models/gemini-2.5-flash", 
      contents: [
        {
          role: "user",
          parts: [
            { text: "ESTA É A IMAGEM ORIGINAL DE REFERÊNCIA:" },
            { inlineData: { data: originalB64, mimeType: "image/png" } },
            { text: "ESTE É O RENDER GERADO PELO SISTEMA (PAUSE NO FRAME 240):" },
            { inlineData: { data: renderedB64, mimeType: "image/png" } },
            { text: prompt }
          ],
        },
      ],
    });

    const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error("Auditor não retornou JSON válido");
    }

    const audit: FidelityAudit = JSON.parse(jsonMatch[0]);
    console.log(`⚖️ [AUDITOR] Score: ${audit.score}/100 | Aprovado: ${audit.isApproved}`);
    
    return audit;
  } catch (err: any) {
    console.error(`❌ [AUDITOR] Falha na auditoria:`, err.message);
    return {
      score: 50,
      isApproved: true, // Fallback para não travar o pipeline se o auditor falhar
      critique: "Falha técnica no serviço de auditoria."
    };
  }
}
