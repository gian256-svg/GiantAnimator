
import 'dotenv/config';
import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

import { getHistory, addJob, clearHistory } from './historyService.js';
import { analyzeChartImage } from './visionService.js';

const app = express();
const port = process.env.PORT || 3000;
const IS_VERCEL = !!process.env.VERCEL;

app.use(cors());
app.use(express.json());
app.use(express.static('server/public'));

// ─── DIRETÓRIOS ──────────────────────────────────────────────
const ROOT = process.cwd();
const WRITABLE_BASE = IS_VERCEL ? '/tmp' : ROOT;
const JOBS_DIR    = path.join(WRITABLE_BASE, 'jobs');
const OUTPUT_DIR  = path.join(WRITABLE_BASE, 'output');
const UPLOADS_DIR = path.join(WRITABLE_BASE, 'uploads');

if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Root do Remotion
const REMOTION_ROOT = path.resolve('remotion-project');
const REMOTION_ENTRY = path.join(REMOTION_ROOT, 'src/index.ts');

// ─── ESTADO PERSISTENTE ───────────────────────────────────────
type Job = {
  id: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
  stage: string;
  error?: string;
  videoUrl?: string;
  log?: string;
};

function saveJob(job: Job) {
  fs.writeFileSync(path.join(JOBS_DIR, `${job.id}.json`), JSON.stringify(job));
}
function loadJob(id: string): Job | null {
  const p = path.join(JOBS_DIR, `${id}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

// ─── PIPELINE ────────────────────────────────────────────────
let bundlePromise: Promise<string> | null = null;
async function getBundle() {
  if (IS_VERCEL) return "";
  if (!bundlePromise) {
    console.log('📦 [REMOTION] Criando bundle 4K...');
    bundlePromise = bundle({
      entryPoint: REMOTION_ENTRY,
      webpackOverride: (c) => c,
    });
  }
  return bundlePromise;
}

async function processJob(jobId: string, fileData: Buffer, originalName: string, chartTheme: string) {
  const job: Job = { id: jobId, status: 'processing', progress: 10, stage: 'Iniciando...' };
  saveJob(job);

  try {
    const filePath = path.join(UPLOADS_DIR, `${jobId}.png`);
    fs.writeFileSync(filePath, fileData);

    const analysis = await analyzeChartImage(filePath);
    job.progress = 40;
    job.stage = 'IA: Estrutura Identificada';
    job.log = `Componente: ${analysis.componentId}`;
    saveJob(job);

    if (IS_VERCEL) {
      job.status = 'error';
      job.error = "Análise concluída! No Vercel não é possível gerar MP4. Use o link da Rede Local.";
      saveJob(job);
      return;
    }

    // Renderização Local 4K
    job.progress = 60;
    job.stage = 'Renderizando 4K UHD...';
    saveJob(job);

    const serveUrl = await getBundle();
    const composition = await selectComposition({
      serveUrl,
      id: analysis.componentId,
      inputProps: { ...analysis.props, theme: chartTheme }
    });

    const outputName = `giant-${jobId}.mp4`;
    const outputPath = path.join(OUTPUT_DIR, outputName);

    await renderMedia({
      composition,
      serveUrl,
      outputLocation: outputPath,
      codec: 'h264',
      inputProps: { ...analysis.props, theme: chartTheme }
    });

    const videoUrl = `/output/${outputName}`;
    addJob({ id: jobId, name: originalName, filename: outputName, videoUrl, createdAt: new Date().toISOString() });

    job.status = 'done';
    job.progress = 100;
    job.stage = 'Concluído!';
    job.videoUrl = videoUrl;
    saveJob(job);

  } catch (err: any) {
    console.error("Error Job:", err);
    job.status = 'error';
    job.error = err.message;
    saveJob(job);
  }
}

// ─── ROTAS ───────────────────────────────────────────────────
const upload = multer({ storage: multer.memoryStorage() });
app.use('/output', express.static(OUTPUT_DIR));

app.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const jobId = uuidv4();
  const job: Job = { id: jobId, status: 'pending', progress: 0, stage: 'Aguardando...' };
  saveJob(job);

  processJob(jobId, req.file.buffer, req.file.originalname, req.body.chartTheme || 'dark');
  res.json({ jobId });
});

app.get('/progress/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = loadJob(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.get('/history', (_req, res) => res.json(getHistory()));
app.post('/history/clear', (_req, res) => { clearHistory(); res.json({ success: true }); });
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(port, '0.0.0.0', () => {
  console.log(`
  ✦ ───────────────────────────────────────── ✦
  🎬 GiantAnimator ONLINE NA REDE INTERNA 🌎
  🔗 http://10.120.5.21:3000
  ✦ ───────────────────────────────────────── ✦
  `);
  if (!IS_VERCEL) getBundle();
});
