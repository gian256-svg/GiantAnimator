
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
import { tableParserService } from './tableParserService.js';
import { agent } from './agent.js';

const app = express();
const portStr = process.env.PORT || '3000';
const port = parseInt(portStr, 10);
const IS_VERCEL = !!process.env.VERCEL;

app.use(cors());
app.use(express.json());
app.use(express.static('server/public'));

// ─── DIRETÓRIOS ──────────────────────────────────────────────
const SERVER_DIR = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([a-zA-Z]:)/, '$1'); // Fix Windows paths
const ROOT = path.resolve(SERVER_DIR, '..');
const JOBS_DIR    = path.resolve(ROOT, 'jobs');
const OUTPUT_DIR  = path.resolve(ROOT, 'output');
const UPLOADS_DIR = path.resolve(ROOT, 'uploads');

if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Root do Remotion
const REMOTION_ROOT = path.resolve('remotion-project');
const REMOTION_ENTRY = path.join(REMOTION_ROOT, 'src/index.ts');

// ─── ESTADO PERSISTENTE ───────────────────────────────────────
type PipelineJob = {
  id: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  progress: number;
  stage: string;
  error?: string;
  videoUrl?: string;
  log?: string;
};

function saveJob(job: PipelineJob) {
  fs.writeFileSync(path.join(JOBS_DIR, `${job.id}.json`), JSON.stringify(job));
}
function loadJob(id: string): PipelineJob | null {
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
  const job: PipelineJob = { id: jobId, status: 'processing', progress: 10, stage: 'Iniciando...' };
  saveJob(job);

  try {
    const ext = path.extname(originalName).toLowerCase();
    const isData = ['.csv', '.xlsx', '.xls', '.json'].includes(ext);
    const filePath = path.join(UPLOADS_DIR, `${jobId}${ext}`);
    fs.writeFileSync(filePath, fileData);

    let analysis: any;

    if (isData) {
      job.stage = 'Processando Dados...';
      job.progress = 20;
      saveJob(job);

      try {
        const parsed = tableParserService.parse(filePath);
        const aiResponse = await agent.analyzeTable(parsed);
        
        analysis = {
          componentId: aiResponse.type || 'BarChart',
          suggestedName: (aiResponse.title || 'DataChart').replace(/\s+/g, ''),
          reasoning: 'Análise de dados concluída via Gemini Table Parser',
          props: {
            ...aiResponse,
            data: aiResponse.data || [],
            unit: parsed.summary.unit || ''
          }
        };
      } catch (err: any) {
        throw new Error(`Falha ao analisar dados da planilha: ${err.message}`);
      }
    } else {
      job.stage = 'IA Vision: Analisando Gráfico...';
      job.progress = 25;
      saveJob(job);
      try {
        analysis = await analyzeChartImage(filePath, chartTheme);
      } catch (err: any) {
        throw new Error(`Falha ao analisar imagem como gráfico: ${err.message}`);
      }
    }

    job.progress = 40;
    job.stage = 'IA: Estrutura Identificada';
    job.log = `Componente: ${analysis.componentId}`;
    
    // Normalização de Estilo Original e Redução de Ruído
    if (analysis.props) {
        if (analysis.props.seriesColors && !analysis.props.colors) {
            analysis.props.colors = analysis.props.seriesColors;
        }
        
        // REGRA ABSOLUTA: Se a unidade for longa, NUNCA mostrar labels nas barras
        const unit = analysis.props.unit || "";
        if (unit.length > 6) {
           analysis.props.showValueLabels = false;
           console.log("🎨 Regra de Minimalismo: Unidade longa detectada, ocultando labels das barras.");
        }
    }

    saveJob(job);

    if (IS_VERCEL) {
      job.status = 'done'; // Permitimos terminar no Vercel para mostrar metadados
      job.progress = 100;
      job.stage = isData ? 'Dados Analisados!' : 'Imagem Analisada!';
      job.log = "No Vercel não é possível gerar MP4. Use o link da Rede Local para renderizar.";
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

    const summary = analysis.suggestedName || 'GiantAnimation';
    const cleanOriginal = originalName.replace(/\.[^.]+$/, '').replace(/\s+/g, '_');
    const outputName = `${summary}_AN_${cleanOriginal}.mp4`;
    const outputPath = path.join(OUTPUT_DIR, outputName);

    await renderMedia({
      composition,
      serveUrl,
      outputLocation: outputPath,
      codec: 'h264',
      inputProps: { ...analysis.props, theme: chartTheme }
    });

    const videoUrl = `/output/${outputName}`;
    addJob({ 
      filename: outputName, 
      outputFile: outputName, 
      status: 'done' 
    });

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
  const job: PipelineJob = { id: jobId, status: 'pending', progress: 0, stage: 'Aguardando...' };
  saveJob(job);

  processJob(jobId, req.file.buffer, req.file.originalname, req.body.chartTheme || 'dark');
  res.json({ jobId });
});

app.get('/progress/:jobId', (req: Request, res: Response) => {
  const jobId = String(req.params.jobId);
  const job = loadJob(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// ✅ Rota adicional para prever dados (usada pelo CSV Preview do frontend)
app.post('/preview-data', upload.single('file'), async (req: Request, res: Response) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const tempPath = path.join(UPLOADS_DIR, `preview_${uuidv4()}${path.extname(req.file.originalname)}`);
    fs.writeFileSync(tempPath, req.file.buffer);
    try {
        const parsed = tableParserService.parse(tempPath);
        res.json(parsed);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    } finally {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
});

app.get('/history', (_req, res) => res.json(getHistory()));
app.post('/history/clear', (_req, res) => { clearHistory(); res.json({ success: true }); });
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Inicialização do Agente e Servidor
(async () => {
    try {
        await agent.initialize();
        app.listen(port, '0.0.0.0', () => {
            console.log(`
  ✦ ───────────────────────────────────────── ✦
  🎬 GiantAnimator ONLINE NA REDE INTERNA 🌎
  🔗 http://10.120.5.21:3000
  ✦ ───────────────────────────────────────── ✦
            `);
            if (!IS_VERCEL) getBundle();
        });
    } catch (err) {
        console.error("❌ Falha crítica ao iniciar agente:", err);
        process.exit(1);
    }
})();
