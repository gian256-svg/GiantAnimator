import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Buffer } from 'buffer';

const SERVER_URL = `http://localhost:${process.env.PORT || 8080}`;
const INPUT_DIR = path.join(process.cwd(), 'input', 'training_auto');

if (!fs.existsSync(INPUT_DIR)) fs.mkdirSync(INPUT_DIR, { recursive: true });

// Função para gerar dados aleatórios realistas
function r(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Configurações baseadas no Chart.js (QuickChart)
const generateConfig = (type: string, id: number) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const categories = ['Tech', 'Health', 'Finance', 'Energy', 'Retail'];
  
  // Count determines label/data size — always consistent
  const n = r(3, 5);
  const labels4 = ['US', 'UK', 'BR', 'CA'].slice(0, n);
  const cats    = categories.slice(0, n);
  const data4   = Array.from({ length: n }, () => r(10, 90));
  const data500 = Array.from({ length: n }, () => r(100, 500));
  const data40  = Array.from({ length: n }, () => r(10, 40));

  if (type === 'BarChart') {
    return {
      type: 'bar',
      data: {
        labels: cats,
        datasets: [{ label: `Revenue ${id}`, data: data500 }]
      },
      options: { title: { display: true, text: `Annual Revenue Analysis ${id}` } }
    };
  } else if (type === 'HorizontalBarChart') {
    return {
      type: 'horizontalBar',
      data: {
        labels: labels4,
        datasets: [{ label: `Users ${id}`, data: data4 }]
      },
      options: { title: { display: true, text: `Global Users ${id}` } }
    };
  } else if (type === 'LineChart') {
    const lMonths = months.slice(0, n);
    return {
      type: 'line',
      data: {
        labels: lMonths,
        datasets: [{ label: `Growth ${id}`, data: lMonths.map((_, k) => r(10 + k * 8, 50 + k * 10)) }]
      },
      options: { title: { display: true, text: `Monthly Growth ${id}` } }
    };
  } else if (type === 'MultiLineChart') {
    const lMonths = months.slice(0, n);
    return {
      type: 'line',
      data: {
        labels: lMonths,
        datasets: [
          { label: `Product A ${id}`, data: lMonths.map(() => r(10, 80)) },
          { label: `Product B ${id}`, data: lMonths.map(() => r(10, 80)) }
        ]
      },
      options: { title: { display: true, text: `Product Comparison ${id}` } }
    };
  } else if (type === 'PieChart') {
    return {
      type: 'pie',
      data: {
        labels: cats,
        datasets: [{ data: data40 }]
      },
      options: { title: { display: true, text: `Market Share ${id}` } }
    };
  } else if (type === 'DonutChart') {
    return {
      type: 'doughnut',
      data: {
        labels: cats,
        datasets: [{ data: data40 }]
      },
      options: { title: { display: true, text: `Distribution ${id}` } }
    };
  }
  return {};
};

async function downloadQuickChart(config: any, dest: string) {
  try {
    const url = `https://quickchart.io/chart?w=800&h=600&bkg=white&c=${encodeURIComponent(JSON.stringify(config))}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Falha ao baixar imagem: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(dest, buffer);
    return dest;
  } catch (e: any) {
    throw new Error(`Erro no download: ${e.message}`);
  }
}

async function runAutoTraining() {
  console.log("🚀 [AUTO TRAINING] Gerando Imagens e Treinando Pipeline...");

  const types = ['BarChart', 'HorizontalBarChart', 'LineChart', 'MultiLineChart', 'PieChart', 'DonutChart'];
  const NUM_PER_TYPE = 10;

  for (const type of types) {
    console.log(`\n📂 [LOTE] Iniciando categoria: ${type}`);

    for (let i = 1; i <= NUM_PER_TYPE; i++) {
      const filename = `auto_${type}_${i}.png`;
      const filepath = path.join(INPUT_DIR, filename);
      const config = generateConfig(type, i);

      try {
        console.log(`\n📥 [${type}] [${i}/${NUM_PER_TYPE}] Gerando imagem...`);
        await downloadQuickChart(config, filepath);

        console.log(`📤 Enviando para o pipeline (com Auditor ativado): ${filename}`);
        const fileBuffer = fs.readFileSync(filepath);
        const formData = new FormData();
        const blob = new Blob([fileBuffer], { type: 'image/png' });
        formData.append('file', blob, filename);
        formData.append('chartTheme', 'dark');
        formData.append('includeCallouts', 'false');
        formData.append('enableAuditor', 'true');
        formData.append('reviewRequired', 'false');
        formData.append('trainingDeep', 'true'); // auditoria + save Supabase, sem render de vídeo

        const uploadRes = await fetch(`${SERVER_URL}/upload`, {
          method: 'POST',
          body: formData
        });

        const uploadData: any = await uploadRes.json();
        if (uploadData.error) {
           console.error(`❌ Erro no upload: ${uploadData.error}`);
           continue;
        }

        const jobId = uploadData.jobId;
        console.log(`⏳ Job ID: ${jobId}. Aguardando auditoria e extração...`);

        // Polling de 2 minutos
        let done = false;
        const deadline = Date.now() + 2 * 60 * 1000;
        while (!done && Date.now() < deadline) {
          await new Promise(r => setTimeout(r, 4000));
          const progRes = await fetch(`${SERVER_URL}/progress/${jobId}`);
          if (!progRes.ok) continue;
          
          const job: any = await progRes.json();

          if (job.status === 'done') {
            console.log(`✅ [${type}] Job ${jobId} validado e salvo. (FIDELIDADE CONFIRMADA)`);
            done = true;
          } else if (job.status === 'awaiting_review') {
            console.log(`⚠️ [${type}] Job ${jobId} requer revisão! Auditoria < 95%.`);
            done = true;
          } else if (job.status === 'error') {
            console.error(`❌ [${type}] Falha ou Rejeitado: ${job.error}`);
            done = true;
          }
        }
        if (!done) console.error(`⏰ [${type}] Timeout de 2min. Progresso muito lento.`);

      } catch (err: any) {
        console.error(`❌ Falha no item ${type} #${i}:`, err.message);
      }
    }
  }

  console.log("\n🏁 [AUTO TRAINING] Treinamento de fidelidade concluído.");
}

runAutoTraining();
