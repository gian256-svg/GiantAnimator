import axios from 'axios';
import fs from 'fs';
import { PATHS } from './paths.js';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
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
  imagePath: string,
  prompt: string
): Promise<any> {
  console.log(`👁️ [OLLAMA VISION] Analisando imagem localmente (Model: ${OLLAMA_MODEL})...`);
  
  const imageBase64 = fs.readFileSync(imagePath).toString('base64');

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

  console.log(`⚖️ [OLLAMA AUDITOR] Comparando imagens localmente...`);

  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: `IMAGEM 1: original. IMAGEM 2: renderizado.\n\n${prompt}`,
      images: [originalB64, renderedB64],
      stream: false
    });

    const responseText = response.data.response;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Ollama Auditor não retornou JSON válido");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error('❌ [OLLAMA AUDITOR] Erro na auditoria:', error.message);
    throw error;
  }
}
