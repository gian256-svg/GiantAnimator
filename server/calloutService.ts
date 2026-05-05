import { ai } from './agent.js';
import { GEMINI_MODEL } from './calibration/constants.js';
import { type ChartAnalysis } from './types.js';

/**
 * Gera Smart Call-outs baseados na verdade matemática do JSON, após auditoria de fidelidade.
 */
export async function enrichAnalysisWithCallouts(analysis: ChartAnalysis): Promise<ChartAnalysis> {
  console.log(`🧠 [Analista] Gerando Smart Call-outs baseados nos dados auditados...`);
  
  const dataForAi = {
    title: analysis.props.title,
    labels: analysis.props.labels,
    series: analysis.props.series?.map(s => ({ label: s.label, data: s.data }))
  };

  const prompt = `
Você é um Analista de Dados Especialista em Visualização. 
Sua tarefa é criar anotações (Smart Call-outs) para um gráfico baseado APENAS no JSON fornecido.

### REGRAS DE DESIGN:
1. **Minimalismo**: Gere no máximo 2 ou 3 anotações por gráfico.
2. **Relevância**: Foque no valor MAIOR, no valor MENOR ou em uma mudança brusca de tendência.
3. **Precisão**: O campo "index" deve corresponder ao índice exato do array de dados (0-based).
4. **Idioma**: Escreva o campo "label" em PORTUGUÊS (Brasil).
5. **Formato**: O valor (propriedade "value") deve ser formatado de forma amigável.

JSON DE DADOS:
${JSON.stringify(dataForAi, null, 2)}

RESPONDA APENAS UM ARRAY JSON de anotações no formato:
[
  { "seriesIndex": 0, "index": 5, "label": "Pico de Vendas" },
  { "seriesIndex": 0, "index": 2, "label": "Queda Sazonal" }
]
`;

  try {
    const model = ai.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      const annotations = JSON.parse(jsonMatch[0]);
      analysis.props.annotations = annotations;
      console.log(`✅ [Analista] ${annotations.length} anotações geradas com sucesso.`);
    }
  } catch (err: any) {
    console.error(`⚠️ [Analista] Falha ao gerar call-outs:`, err.message);
    // Não falha o processo, apenas segue sem call-outs
  }

  return analysis;
}
