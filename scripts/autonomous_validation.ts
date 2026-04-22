import fs from 'fs';
import path from 'path';
import { analyzeChartImage } from '../server/visionService.js';
import { auditRenderFidelity } from '../server/auditorService.js';
import { generateStill } from '../server/renderService.js';

async function runAutonomousTests(imagePath: string, iterations: number = 10) {
    console.log(`🚀 [TEST-SUITE] Iniciando Varredura Total (${iterations} iterações) para: ${imagePath}`);
    const results = [];

    for (let i = 1; i <= iterations; i++) {
        console.log(`\n🔍 [ROUND ${i}/${iterations}] Analisando...`);
        try {
            // Desativa cache para garantir que cada teste seja uma nova análise da IA
            process.env.GEMINI_MOCK = "false";
            
            const analysis = await analyzeChartImage(imagePath, "dark", undefined, { includeCallouts: true });
            console.log(`📊 [ROUND ${i}] IA Sugeriu: ${analysis.componentId}`);
            
            const stillPath = await generateStill(analysis.componentId, analysis.props);
            const audit = await auditRenderFidelity(imagePath, stillPath);
            
            console.log(`✅ [ROUND ${i}] Fidelidade: ${audit.score}% | Aprovado: ${audit.isApproved}`);
            results.push({ round: i, score: audit.score, approved: audit.isApproved, type: analysis.componentId });
            
            // Verificação de Supremacia de Dados (Exemplo: 2011 deve ser > 50)
            // Verificação de Supremacia de Dados (Exemplo: 2011 deve ser > 50)
            const val2011 = (analysis.props.data as any[]).find((d: any) => d.label.includes("2011"))?.value || (analysis.props.series as any[])?.[0]?.data[0];
            console.log(`🔢 [ROUND ${i}] Valor 2011: ${val2011} (Referência: ~55)`);
            
        } catch (err: any) {
            console.error(`❌ [ROUND ${i}] Falha crítica:`, err.message);
            results.push({ round: i, error: err.message });
        }
    }

    console.log("\n📊 [RELATÓRIO FINAL DE VARREDURA]");
    console.table(results);
    
    const avgScore = results.reduce((acc, r) => acc + (r.score || 0), 0) / results.length;
    console.log(`\n📈 Score Médio de Fidelidade: ${avgScore.toFixed(2)}%`);
}

// Executar para a imagem de teste final
const testFile = path.join(process.cwd(), "input", "final_surgery_test.png");
if (fs.existsSync(testFile)) {
    runAutonomousTests(testFile, 10).then(() => process.exit(0));
} else {
    console.error("Arquivo de teste não encontrado!");
    process.exit(1);
}
