
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
import { generateStill } from './renderService.js';
import { auditRenderFidelity } from './auditorService.js';
import { dataTransformationService } from './dataTransformationService.js';
import { tableParserService } from './tableParserService.js';
import { agent } from './agent.js';
import { PATHS } from './paths.js';
import { startWatcher } from './watcherService.js';
import { type ChartAnalysis } from './types.js';

const app = express();
const portStr = process.env.PORT || '8080';
const port = parseInt(portStr, 10);
const IS_VERCEL = !!process.env.VERCEL;

app.use(cors());
app.use(express.json());

// Middleware de Log para Debug de Rede Local
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  // console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

const JOBS_DIR = path.join(PATHS.input, 'jobs');
const UPLOADS_DIR = path.join(PATHS.input, 'uploads');
const OUTPUT_DIR = PATHS.output;
const REMOTION_ENTRY = path.join(PATHS.remotion, 'src/index.ts');

if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

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

async function saveJob(job: PipelineJob) {
  const jobPath = path.join(JOBS_DIR, `${job.id}.json`);
  try {
    await fs.promises.writeFile(jobPath, JSON.stringify(job, null, 2));
  } catch (err) {
    console.error(`❌ [IO] Erro ao salvar Job ${job.id}:`, err);
  }
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
    
    // Escrita assíncrona
    await fs.promises.writeFile(filePath, fileData);

    let analysis: ChartAnalysis;

    if (isData) {
      job.stage = 'Processando Planilha Analítica...';
      job.progress = 20;
      saveJob(job);

      try {
        const parsed = tableParserService.parse(filePath);
        const { numericColumns: numericCols, categoricalColumns: catCols } = parsed.summary;

        console.log(`📊 [DATA] Detectado: ${numericCols.length} num, ${catCols.length} cat`);

        const aiResponse = await agent.analyzeTable(parsed);
        let props = aiResponse;

        // Se o Gemini não retornar 'data' mas tivermos colunas identificáveis, ajudamos
        if (!props.data || props.data.length === 0) {
          const labelCol = catCols[0] || parsed.headers[0];
          const valCol   = numericCols[0] || parsed.headers[1];

          props.data = parsed.rows.map(row => ({
            label: String(row[labelCol]),
            value: Number(row[valCol])
          }));
          delete props.series; // Remove series para não conflitar
        }

        // 🔥 Final Pass
        props = dataTransformationService.prepareFor4K(props);
        
        // Diagnóstico Final: Grava as props assincronamente
        fs.promises.writeFile(path.join(process.cwd(), 'current_props.json'), JSON.stringify(props, null, 2)).catch(() => {});

        analysis = {
          componentId: aiResponse.type || (numericCols.length > 1 ? 'LineChart' : 'BarChart'),
          suggestedName: (aiResponse.title || 'DataChart').replace(/\s+/g, ''),
          reasoning: 'Análise de dados concluída via Data Ingestion Pipeline (Valores Reais Preservados)',
          props: {
            ...props,
            title: aiResponse.title || 'Visualização de Dados Inteligente',
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
        // Integração do Novo Pipeline de Fidelidade Surgery-Grade com Auditoria Silent
        analysis = await runSurgeryGradePipeline(filePath, chartTheme, job);
      } catch (err: any) {
        throw new Error(`Falha ao analisar imagem como gráfico: ${err.message}`);
      }
    }

    job.progress = 40;
    job.stage = 'IA: Estrutura Identificada';
    job.log = `Componente: ${analysis.componentId}`;
    
    // Normalização de Estilo Original e Redução de Ruído
    if (analysis && analysis.props) {
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

// 📌 ROTAS 📌
const upload = multer({ storage: multer.memoryStorage() });
app.use(express.static(path.join(process.cwd(), 'public'))); 
app.use('/output', express.static(OUTPUT_DIR));

app.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  console.log(`🚀 [UPLOAD] Recebido arquivo: ${req.file?.originalname} de IP: ${req.ip}`);
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const jobId = uuidv4();
  const job: PipelineJob = { id: jobId, status: 'pending', progress: 0, stage: 'Aguardando...' };
  await saveJob(job);

  processJob(jobId, req.file.buffer, req.file.originalname, req.body.chartTheme || 'dark');
  res.json({ jobId });
});

app.get('/progress/:jobId', (req: Request, res: Response) => {
  const jobId = String(req.params.jobId);
  const job = loadJob(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

app.post('/preview-data', upload.single('file'), async (req: Request, res: Response) => {
    const debugLog = path.resolve(PATHS.root, 'debug_preview.log');
    if (!req.file) return res.status(400).json({ error: 'No file' });
    
    const ext = path.extname(req.file.originalname);
    const tempPath = path.join(UPLOADS_DIR, `preview_${uuidv4()}${ext}`);
    
    try {
        fs.writeFileSync(tempPath, req.file.buffer);
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

/**
 * Pipeline de Reconstituição Avançada com Auditoria Silent
 */
async function runSurgeryGradePipeline(
  filePath: string, 
  chartTheme: string, 
  job: any
): Promise<ChartAnalysis> {
  let analysis: ChartAnalysis = await analyzeChartImage(filePath, chartTheme);
  
  for (let attempt = 1; attempt <= 2; attempt++) {
    console.log(`🤖 [Orchestrator] Iniciando Auditoria Silent (Tentativa ${attempt})...`);
    job.stage = `Auditando Fidelidade (Tentativa ${attempt})...`;
    saveJob(job);

    try {
      const stillPath = await generateStill(analysis.componentId, analysis.props);
      const audit = await auditRenderFidelity(filePath, stillPath);

      if (audit.isApproved || audit.score >= 95) {
        console.log("✅ [Orchestrator] Fidelidade Aprovada!");
        return analysis;
      }

      console.warn(`⚠️ [Orchestrator] Falha na Auditoria: ${audit.critique}`);
      job.log = `Ajustando precisão: ${audit.critique}`;
      saveJob(job);

      analysis = await analyzeChartImage(filePath, chartTheme, audit.critique); 
    } catch (err: any) {
      console.error("❌ [Orchestrator] Erro no loop de auditoria:", err.message);
      break;
    }
  }

  return analysis;
}

// Inicialização do Agente e Servidor
(async () => {
    try {
        await agent.initialize();
        app.listen(port, '0.0.0.0', () => {
            console.log(`
  ✦ ───────────────────────────────────────── ✦
  🔗 http://localhost:${port} (Local)
  ✦ ───────────────────────────────────────── ✦
            `);
            if (!IS_VERCEL) {
                getBundle();
                startWatcher(PATHS.input);
            }
        });
    } catch (err) {
        console.error("❌ Falha crítica ao iniciar agente:", err);
        process.exit(1);
    }
})();
