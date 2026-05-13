import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
// Sempre relativo à raiz do projeto, igual ao PATHS.root do servidor
const PROJECT_ROOT    = path.resolve(__dirname, '../..');
const TRAINING_IMG_DIR = path.join(PROJECT_ROOT, 'training', 'images');

const CHART_URLS = [
  'http://cdn.statcdn.com/Infographic/images/normal/27411.jpeg',
  'http://cdn.statcdn.com/Infographic/images/normal/35378.jpeg',
  'http://cdn.statcdn.com/Infographic/images/normal/27409.jpeg',
  'http://cdn.statcdn.com/Infographic/images/normal/35348.jpeg',
  'http://cdn.statcdn.com/Infographic/images/normal/27528.jpeg',
  'http://cdn.statcdn.com/Infographic/images/normal/18328.jpeg',
  'https://www.researchgate.net/profile/Ilya-Zeldes/publication/355927826/figure/fig3/AS:1086438012026880@1636034176435/Screenshot-from-Bloomberg-Terminal-October-22-2021.png',
  'https://www.researchgate.net/profile/Ilya-Zeldes/publication/342412248/figure/fig2/AS:905973795860481@1593008444458/5-minute-chart-of-Boeing-Companys-BA-stock-price-from-Bloomberg-Terminal.png',
  'https://ctmfile.com/media/_ebx/980x300_new_eikon_app_creates_real-time_data_visualisations_for_fx_traders.jpg',
  'https://www.waterstechnology.com/image/577232/eikon-fx-data-viz/thomson-reuters-adds-new-fx-visualizations-to-eikon-desktop.png'
];

async function downloadImage(url: string, index: number) {
  try {
    console.log(`📥 Downloading [${index + 1}/${CHART_URLS.length}]: ${url}`);
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
    const filename = `training_${index + 1}_${uuidv4().slice(0, 8)}.${ext}`;
    const filePath = path.join(TRAINING_IMG_DIR, filename);

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`✅ Saved to ${filename}`);
        resolve(true);
      });
      writer.on('error', reject);
    });
  } catch (err: any) {
    console.error(`❌ Failed to download ${url}: ${err.message}`);
    return false;
  }
}

async function run() {
  if (!fs.existsSync(TRAINING_IMG_DIR)) {
    fs.mkdirSync(TRAINING_IMG_DIR, { recursive: true });
  }

  console.log(`🚀 Starting automated chart download for training...`);
  for (let i = 0; i < CHART_URLS.length; i++) {
    await downloadImage(CHART_URLS[i], i);
  }
  console.log(`✨ Done! Files are in ${TRAINING_IMG_DIR}`);
}

run();
