import 'dotenv/config';
import fs from 'fs';
import path from 'path';

const SERVER_URL = `http://localhost:${process.env.PORT || 8080}`;
const INPUT_DIR = path.join(process.cwd(), 'input', 'training');

if (!fs.existsSync(INPUT_DIR)) fs.mkdirSync(INPUT_DIR, { recursive: true });

// Nota: Our World in Data exporta gráficos como .png — a categoria aqui é o tipo ESPERADO
// da imagem baixada. Verificadas visualmente antes de incluir.
const TRAINING_DATA: Record<string, string[]> = {
  "LineChart": [
    "https://ourworldindata.org/grapher/exports/co-emissions-per-capita.png",
    "https://ourworldindata.org/grapher/exports/life-expectancy.png",
    "https://ourworldindata.org/grapher/exports/gdp-per-capita-maddison.png",
    "https://ourworldindata.org/grapher/exports/installed-solar-pv-capacity.png",
    "https://ourworldindata.org/grapher/exports/wind-generation.png",
    "https://ourworldindata.org/grapher/exports/gdp-growth.png",
    "https://ourworldindata.org/grapher/exports/world-population-growth.png",
    "https://ourworldindata.org/grapher/exports/share-electricity-renewables.png",
    "https://ourworldindata.org/grapher/exports/daily-cases-covid-19.png",
    "https://ourworldindata.org/grapher/exports/literacy-rate-by-generation.png"
  ],
  "BarChart": [
    "https://ourworldindata.org/grapher/exports/co2-emissions-by-sector.png",
    "https://ourworldindata.org/grapher/exports/food-emissions-supply-chain.png",
    "https://ourworldindata.org/grapher/exports/research-spending-gdp.png",
    "https://ourworldindata.org/grapher/exports/urban-and-rural-population.png",
    "https://ourworldindata.org/grapher/exports/meat-consumption-vs-gdp-per-capita.png",
    "https://ourworldindata.org/grapher/exports/agriculture-value-added-per-worker-wdi.png"
  ],
  "AreaChart": [
    "https://ourworldindata.org/grapher/exports/annual-co-emissions-by-region.png",
    "https://ourworldindata.org/grapher/exports/energy-consumption-by-source-and-region.png",
    "https://ourworldindata.org/grapher/exports/co2-by-source.png",
    "https://ourworldindata.org/grapher/exports/ghg-emissions-by-sector.png"
  ]
};

async function downloadImage(url: string, dest: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Falha ao baixar imagem: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(dest, buffer);
    return dest;
  } catch (e: any) {
    throw new Error(`Erro no download (${url}): ${e.message}`);
  }
}

async function runTraining() {
  console.log("🚀 [GLOBAL TRAINING] Iniciando Sessão de Treinamento Intensivo (Todos os Tipos)...");

  for (const [category, urls] of Object.entries(TRAINING_DATA)) {
    console.log(`\n📂 [LOTE] Iniciando categoria: ${category}`);

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const filename = `training_${category}_${i + 1}.png`;
      const filepath = path.join(INPUT_DIR, filename);

      try {
        console.log(`\n📥 [${category}] [${i + 1}/${urls.length}] Baixando: ${url}`);
        await downloadImage(url, filepath);

        console.log(`📤 Enviando para o pipeline: ${filename}`);
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
        const jobId = uploadData.jobId;
        console.log(`⏳ Job ID: ${jobId}. Aguardando conclusão...`);

        // Polling com timeout de 3 minutos
        let done = false;
        const deadline = Date.now() + 3 * 60 * 1000;
        while (!done && Date.now() < deadline) {
          await new Promise(r => setTimeout(r, 5000));
          const progRes = await fetch(`${SERVER_URL}/progress/${jobId}`);
          if (!progRes.ok) {
            console.error(`❌ Erro ao consultar progresso do Job ${jobId}`);
            break;
          }
          const job: any = await progRes.json();

          if (job.status === 'done') {
            console.log(`✅ [${category}] Job ${jobId} validado e salvo (trainingOnly).`);
            done = true;
          } else if (job.status === 'awaiting_review') {
            console.log(`⚠️ [${category}] Job ${jobId} em revisão — auditoria não atingiu 95%.`);
            done = true;
          } else if (job.status === 'error') {
            console.error(`❌ [${category}] Rejeitado pelo Reality Shield: ${job.error}`);
            done = true;
          }
        }
        if (!done) console.error(`⏰ [${category}] Job ${jobId} atingiu timeout de 3min — descartado.`);

      } catch (err: any) {
        console.error(`❌ Falha no item ${category} #${i + 1}:`, err.message);
      }
    }
  }

  console.log("\n🏁 [GLOBAL TRAINING] Sessão completa concluída.");
}

runTraining();

