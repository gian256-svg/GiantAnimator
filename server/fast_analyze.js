const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json'
  }
});

async function main() {
  const baseDir = path.resolve(__dirname, '../knowledge-base/frames');
  const dirs = fs.readdirSync(baseDir).filter(f => fs.statSync(path.join(baseDir, f)).isDirectory());
  
  // Ignorar linechart_bloomberg_00001 e pegar os próximos 5
  const targets = dirs.filter(d => d !== 'linechart_bloomberg_00001').slice(0, 5);
  console.log('📌 Direcionando para:', targets);

  for (const dirName of targets) {
    const dirPath = path.join(baseDir, dirName);
    const files = fs.readdirSync(dirPath).filter(f=>f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp')).splice(0, 3);
    if (files.length === 0) continue;

    console.log(`\n🚀 Analisando: ${dirName} (${files.length} frames)`);
    const prompt = `
Analyze these chart frames and return ONLY valid JSON:
{
  "lineStyle": string,
  "animationType": string,
  "durationMs": number,
  "qualityScore": number  // MUST be a float between 0.0 and 1.0
}
No explanation. No markdown. JSON only.
`;
    const parts = [{text: prompt}];
    
    for(const f of files) {
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg', 
          data: fs.readFileSync(path.join(dirPath, f)).toString('base64')
        }
      });
    }

    try {
      const res = await model.generateContent(parts);
      const raw = res.response.text();
      const parsed = JSON.parse(raw); 
      
      const outPath = path.join(__dirname, `result_temp_${dirName}.json`);
      fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2));
      console.log(`✅ salvo:`, parsed);
    } catch(err) {
      console.error(`❌ Erro em ${dirName}:`, err.message);
    }
  }
}

main().catch(console.error);
