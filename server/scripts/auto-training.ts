import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Buffer } from 'buffer';

const SERVER_URL = 'http://localhost:3000';
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
  
  if (type === 'BarChart') {
    return {
      type: 'bar',
      data: {
        labels: categories.slice(0, r(3, 5)),
        datasets: [{ label: `Revenue ${id}`, data: [r(100, 500), r(100, 500), r(100, 500), r(100, 500), r(100, 500)].slice(0, 5) }]
      },
      options: { title: { display: true, text: `Annual Revenue Analysis ${id}` } }
    };
  } else if (type === 'HorizontalBarChart') {
    return {
      type: 'horizontalBar',
      data: {
        labels: ['US', 'UK', 'BR', 'CA', 'JP'].slice(0, r(4, 5)),
        datasets: [{ label: `Users ${id}`, data: [r(10, 90), r(10, 90), r(10, 90), r(10, 90), r(10, 90)].slice(0, 5) }]
      },
      options: { title: { display: true, text: `Global Users ${id}` } }
    };
  } else if (type === 'LineChart') {
    return {
      type: 'line',
      data: {
        labels: months,
        datasets: [{ label: `Growth ${id}`, data: [r(10, 50), r(20, 60), r(30, 70), r(40, 80), r(50, 90), r(60, 100), r(70, 110)] }]
      },
      options: { title: { display: true, text: `Monthly Growth ${id}` } }
    };
  } else if (type === 'MultiLineChart') {
    return {
      type: 'line',
      data: {
        labels: months.slice(0, 5),
        datasets: [
          { label: `Product A ${id}`, data: [r(10, 50), r(20, 60), r(30, 70), r(40, 80), r(50, 90)] },
          { label: `Product B ${id}`, data: [r(30, 50), r(40, 60), r(20, 70), r(10, 80), r(5, 90)] }
        ]
      },
      options: { title: { display: true, text: `Product Comparison ${id}` } }
    };
  } else if (type === 'PieChart') {
    return {
      type: 'pie',
      data: {
        labels: categories.slice(0, r(3, 5)),
        datasets: [{ data: [r(10, 40), r(10, 40), r(10, 40), r(10, 40), r(10, 40)].slice(0, 5) }]
      },
      options: { title: { display: true, text: `Market Share ${id}` } }
    };
  } else if (type === 'DonutChart') {
    return {
      type: 'doughnut',
      data: {
        labels: categories.slice(0, r(3, 5)),
        datasets: [{ data: [r(10, 40), r(10, 40), r(10, 40), r(10, 40), r(10, 40)].slice(0, 5) }]
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
        formData.append('enableAuditor', 'true'); // HABILITADO PARA COMPARAÇÃO DE FIDELIDADE
        formData.append('reviewRequired', 'false');
        formData.append('trainingOnly', 'true'); // MODO TREINAMENTO, não renderiza vídeo

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
