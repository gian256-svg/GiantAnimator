/**
 * Prompt simplificado para modelos menores (Ollama / Llama 3.2 Vision)
 * Focado em estrutura e extração direta para evitar alucinações de instrução.
 */
export function buildOllamaVisionPrompt(): string {
  return `
Você é um extrator de dados de gráficos. Analise a imagem e retorne APENAS um JSON.

### REGRAS:
1. Extraia o Título, Legendas e Valores numéricos exatos.
2. Identifique o tipo de gráfico (BarChart, LineChart, PieChart).
3. Capture as cores HEX das séries.
4. Idioma: Mantenha Títulos e Rótulos no idioma original da imagem.
5. Retorne APENAS o JSON, sem explicações.

### FORMATO OBRIGATÓRIO:
{
  "componentId": "BarChart",
  "props": {
    "title": "Título do Gráfico",
    "labels": ["Categoria A", "Categoria B"],
    "series": [
      { "label": "Série 1", "data": [10, 20], "color": "#FF0000" }
    ],
    "yMin": 0,
    "yMax": 100
  }
}
`.trim();
}
