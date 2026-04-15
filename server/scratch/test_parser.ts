// server/scratch/test_parser.ts
import { tableParserService } from '../tableParserService.js';
import path from 'path';

const filePath = 'C:/Users/gianluca.palmisciano/.gemini/antigravity/scratch/GiantAnimator/input/nvidia_vs_sp500_retorno_anual.csv';

try {
    const parsed = tableParserService.parse(filePath);
    console.log('--- HEADERS ---');
    console.log(parsed.headers);
    console.log('--- SUMMARY ---');
    console.log(JSON.stringify(parsed.summary, null, 2));
    console.log('--- SAMPLE ROW ---');
    console.log(parsed.rows[0]);
} catch (err) {
    console.error(err);
}
