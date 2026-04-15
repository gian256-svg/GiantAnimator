
import { tableParserService } from '../server/tableParserService';
import * as fs from 'fs';
import * as path from 'path';

async function runTests() {
    console.log("🚀 Iniciando Testes Autônomos de Planilha...");
    
    const testFiles = [
        { name: 'test_comma.csv', content: "Ano,Valor\n2021,100\n2022,200", type: 'csv' },
        { name: 'test_semicolon.csv', content: "Ano;Valor\n2021;100\n2022;200", type: 'csv' },
        { name: 'test_tab.csv', content: "Ano\tValor\n2021\t100\n2022\t200", type: 'csv' },
        { name: 'test_latin1.csv', content: Buffer.from("Categoria;Preo\nCaf;10\nPo;5", 'latin1'), type: 'csv' }
    ];

    const scratchDir = path.join(process.cwd(), 'scratch_tests');
    if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir);

    for (const f of testFiles) {
        const filePath = path.join(scratchDir, f.name);
        fs.writeFileSync(filePath, f.content);
        
        console.log(`\n--- Testando: ${f.name} ---`);
        try {
            const result = tableParserService.parse(filePath);
            console.log(`✅ Sucesso! Colunas: ${result.headers.join(', ')}`);
            console.log(`📊 Dados (Sample): ${JSON.stringify(result.summary.sample)}`);
        } catch (err: any) {
            console.error(`❌ ERRO em ${f.name}: ${err.message}`);
        }
    }
}

runTests();
