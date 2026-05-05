import OpenAI from 'openai';

// Configuração do Provedor para o Antigravity
const ollamaProvider = new OpenAI({
  baseURL: process.env.OLLAMA_BASE_URL ? `${process.env.OLLAMA_BASE_URL}/v1` : 'http://localhost:11434/v1',
  apiKey: 'ollama', // O Ollama ignora a chave, mas o SDK exige o campo
});

// Configuração do Agente (DeepSeek Coder V2)
export const antigravityConfig = {
  model: 'deepseek-coder-v2', // Nome exato do que foi baixado no Ollama
  client: ollamaProvider,
  options: {
    temperature: 0.1,      // Recomendado: Quase zero para precisão em Bundling/UHD
    max_tokens: 8192,      // Aproveitando os 128GB de RAM para janelas longas
    top_p: 1,
    stream: false          // Mantido como false para facilitar o parser de JSON síncrono no servidor
  }
};

/**
 * Gera os props JSON para o Remotion UHD usando DeepSeek Coder V2 (Ollama Local)
 */
export async function generatePropsWithDeepSeek(prompt: string, context?: any): Promise<any> {
  console.log(`🤖 [DeepSeek] Gerando props JSON locais (Model: ${antigravityConfig.model})...`);
  
  try {
    const response = await antigravityConfig.client.chat.completions.create({
      model: antigravityConfig.model,
      messages: [
        { 
          role: 'system', 
          content: 'Você é um especialista em Remotion e visualização de dados UHD. Sua tarefa é gerar exclusivamente objetos JSON válidos para propriedades de componentes de gráfico.' 
        },
        { 
          role: 'user', 
          content: context ? `${prompt}\n\nContexto adicional: ${JSON.stringify(context)}` : prompt 
        }
      ],
      response_format: { type: 'json_object' },
      temperature: antigravityConfig.options.temperature,
      max_tokens: antigravityConfig.options.max_tokens,
      top_p: antigravityConfig.options.top_p,
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("DeepSeek não retornou conteúdo.");
    
    return JSON.parse(content);
  } catch (error: any) {
    console.error('❌ [DeepSeek] Erro na geração de props:', error.message);
    throw error;
  }
}
