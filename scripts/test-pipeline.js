
import fs from 'fs';
import path from 'path';

const URL = 'http://localhost:3000';

async function testPipeline() {
  console.log('🚀 Iniciando teste autônomo (Vanilla Fetch)...');

  const testImg = path.resolve('test-chart.png');
  if (!fs.existsSync(testImg)) {
    fs.writeFileSync(testImg, Buffer.alloc(100));
  }

  try {
    const fileBuffer = fs.readFileSync(testImg);
    const blob = new Blob([fileBuffer], { type: 'image/png' });
    
    const fd = new FormData();
    fd.append('file', blob, 'test-chart.png');
    fd.append('chartType', 'bar');
    fd.append('chartTheme', 'dark');

    console.log('📤 Enviando para /upload...');
    const res = await fetch(`${URL}/upload`, { method: 'POST', body: fd });
    
    if (!res.ok) {
      console.error(`❌ Erro upload: ${res.status}`);
      return;
    }

    const { jobId } = await res.json();
    console.log(`✅ Sucesso! JobId: ${jobId}`);
    
    // Polling de progresso
    let attempts = 0;
    while (attempts < 5) {
      const pRes = await fetch(`${URL}/progress/${jobId}`);
      const text = await pRes.text();
      console.log(`Snapshot [${attempts}]:`, text);
      if (text.includes('"status":"done"') || text.includes('"status":"error"')) break;
      await new Promise(r => setTimeout(r, 2000));
      attempts++;
    }
  } catch (err) {
    console.error('💥 Erro:', err);
  }
}

testPipeline();
