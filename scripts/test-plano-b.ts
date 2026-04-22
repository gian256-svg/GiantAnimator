import fs from 'fs';
import path from 'path';
import { analyzeChartImage } from '../server/visionService.js';

// Mock do OCR para simular o gráfico do usuário (Chart 5.2.1)
const mockOcr = `
Chart 5.2.1
Number of police officers in Crimeville, 2011 to 2019
60
45
30
15
0
2011 2012 2013 2014 2015 2016 2017 2018 2019
Year
Number of police officers
`;

async function testPlanoB() {
    console.log("🧪 [TESTE PLANO B] Validando Reconstituição via Texto (Rigor Máximo)...");
    
    // Forçamos o erro 503 para cair no Plano B
    // Como não podemos forçar o erro no SDK facilmente aqui, vamos simular a chamada do Plano B diretamente
    // se o analyzeChartImage falhar.
    
    const testFile = path.join(process.cwd(), "input", "final_surgery_test.png");
    
    try {
        console.log("Step 1: Testando se as novas regras de BarChart Default e Anti-Linearização funcionam...");
        
        // Vamos rodar a análise normal. Se o Gemini estiver 503, ele vai usar o novo prompt do Plano B.
        const analysis = await analyzeChartImage(testFile, "dark");
        
        console.log("\n📊 RESULTADO DA ANÁLISE:");
        console.log(`- Componente Sugerido: ${analysis.componentId}`);
        console.log(`- Título: ${analysis.props.title}`);
        console.log(`- Dados:`, JSON.stringify(analysis.props.data, null, 2));
        
        // Verificação de Fidelidade
        const isBar = analysis.componentId === "BarChart";
        const val2011 = analysis.props.data.find(d => d.label.includes("2011"))?.value;
        const val2014 = analysis.props.data.find(d => d.label.includes("2014"))?.value;
        const isCurved = val2011 > val2014; // No original, 2011 é maior que 2014
        
        if (isBar && isCurved) {
            console.log("\n✅ [TESTE APROVADO] O sistema identificou Barras e manteve a curva original (não linearizou).");
        } else {
            console.error("\n❌ [TESTE REPROVADO]");
            if (!isBar) console.error(`- Esperava BarChart, recebeu ${analysis.componentId}`);
            if (!isCurved) console.error(`- Os dados foram linearizados (2011: ${val2011} <= 2014: ${val2014})`);
        }
        
    } catch (err: any) {
        console.error("❌ Erro no teste:", err.message);
    }
}

testPlanoB().then(() => process.exit(0));
