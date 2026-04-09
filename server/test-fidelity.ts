import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import { processImage } from './pipeline.js';
import fs from 'fs';

async function runTest(imagePath: string) {
    console.log(`🚀 Iniciando teste de fidelidade para: ${path.basename(imagePath)}`);
    try {
        const result = await processImage(imagePath);
        console.log('✅ TESTE CONCLUÍDO');
        console.log('---');
        console.log('Componente:', result.componentId);
        console.log('Reasoning:', result.reasoning);
        console.log('Props extraídas:', JSON.stringify(result.props, null, 2));
        console.log('Output:', result.outputFile);
    } catch (err) {
        console.error('❌ ERRO NO TESTE:', err);
    }
}

const testImagePath = process.argv[2];
if (!testImagePath) {
    console.error('Uso: npx tsx test-fidelity.ts <caminho_da_imagem>');
    process.exit(1);
}

runTest(testImagePath);
