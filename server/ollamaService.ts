import axios from 'axios';
import fs from 'fs';
import { PATHS } from './paths.js';

const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/v1$/, '');
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llava:7b';

/**
 * Interface para resposta do Ollama
 */
interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

/**
 * Gera insights usando Ollama (Local/Grátis)
 */
export async function generateInsightsWithOllama(data: any): Promise<string> {
  console.log(`🤖 [Simão] Gerando insights locais (Model: ${OLLAMA_MODEL})...`);
  
  const prompt = `Analise os seguintes dados de um gráfico e gere um insight executivo curto e impactante (máximo 2 frases). 
Dados: ${JSON.stringify(data)}
Responda APENAS o texto do insight em Português.`;

  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false
    });

    return response.data.response.trim();
  } catch (error: any) {
    console.error('❌ [Simão] Erro ao gerar insight:', error.message);
    throw error;
  }
}

/**
 * Analisa imagem usando Ollama Vision (Fallback Local)
 */
export async function analyzeChartImageWithOllama(
  imagePathOrBase64: string,
  prompt?: string
): Promise<any> {
  console.log(`👁️ [OLLAMA VISION] Analisando imagem localmente (Model: ${OLLAMA_MODEL})...`);
  
  const isVisionModel = OLLAMA_MODEL.includes('vision') || OLLAMA_MODEL.includes('llava') || OLLAMA_MODEL.includes('moondream');
  if (!isVisionModel) {
    console.warn(`⚠️ [Simão] ATENÇÃO: O modelo '${OLLAMA_MODEL}' pode não suportar visão. Recomenda-se usar 'llama3.2-vision' ou 'llava' para o fallback local.`);
  }
  
  let imageBase64: string;
  if (imagePathOrBase64.length > 500) {
    // Provavelmente já é um base64
    imageBase64 = imagePathOrBase64;
  } else {
    // É um path
    imageBase64 = fs.readFileSync(imagePathOrBase64).toString('base64');
  }

  // Use o prompt simplificado se nenhum for passado ou se for o padrão longo do Gemini
  const { buildOllamaVisionPrompt } = await import("./prompts/ollamaVision.js");
  const finalPrompt = (prompt && prompt.length < 500) ? prompt : buildOllamaVisionPrompt();

  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      images: [imageBase64],
      stream: false,
      format: 'json'
    });

    const responseText = response.data.response;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Ollama não retornou JSON válido");
    const jsonStr = jsonMatch[0];
    const cleanedJson = jsonStr.replace(/\/\/.*$/gm, "").replace(/,\s*([\]\}])/g, "$1");
    
    return JSON.parse(cleanedJson);
  } catch (error: any) {
    console.error('❌ [OLLAMA VISION] Erro na análise:', error.message);
    throw error;
  }
}

/**
 * Realiza auditoria de fidelidade usando Ollama (Local)
 */
export async function auditRenderFidelityWithOllama(
  originalImagePath: string,
  renderedStillPath: string
): Promise<any> {
  const originalB64 = fs.readFileSync(originalImagePath).toString('base64');
  const renderedB64 = fs.readFileSync(renderedStillPath).toString('base64');

  const { buildAuditorPrompt } = await import("./prompts/auditor.js");
  const prompt = buildAuditorPrompt();

  console.log(`⚖️ [OLLAMA AUDITOR] Comparando imagens localmente (timeout: 45s)...`);

  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: `IMAGEM 1: original. IMAGEM 2: renderizado.\n\n${prompt}`,
      images: [originalB64, renderedB64],
      stream: false
    }, { timeout: 45000 });

    const responseText = response.data.response;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Ollama Auditor não retornou JSON válido");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error('❌ [OLLAMA AUDITOR] Erro na auditoria:', error.message);
    throw error;
  }
}
