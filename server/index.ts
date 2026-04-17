
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
// server/index.ts
import { dataTransformationService } from './dataTransformationService.js';
import { tableParserService } from './tableParserService.js';
import { agent } from './agent.js';
import { PATHS } from './paths.js';
import { startWatcher } from './watcherService.js';

const app = express();
const portStr = process.env.PORT || '8080';
const port = parseInt(portStr, 10);
const IS_VERCEL = !!process.env.VERCEL;

app.use(cors());
app.use(express.json());

// Middleware de Log para Debug de Rede Local
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

app.use(express.static(path.join(PATHS.server, 'public')));

// ─── DIRETÓRIOS CENTRALIZADOS ────────────────────────────────
const JOBS_DIR    = path.join(PATHS.root, 'jobs'); // Jobs ficam locais por segurança de performance
const OUTPUT_DIR  = PATHS.output;
const UPLOADS_DIR = PATHS.input; // Usando a pasta de input compartilhada para uploads diretos

if (!fs.existsSync(JOBS_DIR)) fs.mkdirSync(JOBS_DIR, { recursive: true });
// OUTPUT e UPLOADS já são garantidos pelo paths.ts

// Root do Remotion
const REMOTION_ROOT = PATHS.remotion;
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

    let analysis: any;

    if (isData) {
      job.stage = 'Processando Dados...';
      job.progress = 20;
      saveJob(job);

      try {
        let parsed = tableParserService.parse(filePath);
        
        // 🔥 Skill: Data Extraction & Transformation
        parsed = dataTransformationService.transform(parsed);

        const aiResponse = await agent.analyzeTable(parsed);
        
        // Mapeamento de DADOS REAIS (Sobrescreve qualquer invenção da IA)
        const labelCol = parsed.summary.categoricalColumns[0] || parsed.headers[0];
        const numericCols = parsed.summary.numericColumns;

        let props: any = { ...aiResponse };

        // REGRA DE OURO: Os dados vêm do PARSER, não da resposta da IA
        props.labels = parsed.rows.map(row => String(row[labelCol]));
        
        if (numericCols.length > 1) {
          props.series = numericCols.map(col => ({
             label: col,
             data: parsed.rows.map(row => {
                let val = Number(row[col]);
                // PARANOIA 4K: Se for porcentagem e o valor parecer um ano (ex: 2023), descarta ou trata.
                if (parsed.summary.unit === '%' && val > 1900 && val < 2100) {
                    console.log(`🛡️ [Safety] Bloqueando ano detectado como dado: ${val}`);
                    return 0; 
                }
                return isNaN(val) ? 0 : val;
             })
          }));
          delete props.data;
        } else {
          const valCol = numericCols[0] || parsed.headers[1];
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
        analysis = await analyzeChartImage(filePath, chartTheme);
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

// ─── ROTAS ───────────────────────────────────────────────────
// Usar memoryStorage para uploads vindos da rede evita timeouts de escrita
const upload = multer({ storage: multer.memoryStorage() });
app.use('/output', express.static(OUTPUT_DIR));

app.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  console.log(`📥 [UPLOAD] Recebido arquivo: ${req.file?.originalname} de IP: ${req.ip}`);
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const jobId = uuidv4();
  const job: PipelineJob = { id: jobId, status: 'pending', progress: 0, stage: 'Aguardando...' };
  await saveJob(job); // Assíncrono agora

  // Inicia o processamento em background (não aguarda o fim para responder ao cliente)
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
    if (!req.file) {
        fs.appendFileSync(debugLog, `[${new Date().toISOString()}] Erro: Nenhum arquivo recebido\n`);
        return res.status(400).json({ error: 'No file' });
    }
    
    const ext = path.extname(req.file.originalname);
    const tempPath = path.join(UPLOADS_DIR, `preview_${uuidv4()}${ext}`);
    
    fs.appendFileSync(debugLog, `[${new Date().toISOString()}] Recebido: ${req.file.originalname} (Size: ${req.file.size}) -> Salvando em: ${tempPath}\n`);
    
    try {
        fs.writeFileSync(tempPath, req.file.buffer);
        fs.appendFileSync(debugLog, `[${new Date().toISOString()}] Arquivo salvo. Iniciando Parser...\n`);
        
        const parsed = tableParserService.parse(tempPath);
        
        fs.appendFileSync(debugLog, `[${new Date().toISOString()}] Sucesso no Parser! Colunas: ${parsed.headers.length}\n`);
        res.json(parsed);
    } catch (err: any) {
        const errorStack = err.stack || err.message;
        fs.appendFileSync(debugLog, `[${new Date().toISOString()}] CRITICAL ERROR: ${errorStack}\n`);
        console.error("Preview Error:", err);
        res.status(500).json({ error: err.message });
    } finally {
        if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
            fs.appendFileSync(debugLog, `[${new Date().toISOString()}] Temp file removido.\n`);
        }
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
  🔗 http://localhost:${port} (Local)
  ✦ ───────────────────────────────────────── ✦
            `);
            if (!IS_VERCEL) {
                getBundle();
                // 🔥 Inicia o Watcher local para detecção de arquivos
                startWatcher(PATHS.input);
            }
        });
    } catch (err) {
        console.error("❌ Falha crítica ao iniciar agente:", err);
        process.exit(1);
    }
})();
