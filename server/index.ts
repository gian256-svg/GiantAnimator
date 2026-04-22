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
import { generateVoiceover } from './voiceoverService.js';
import { hyperframesService } from './hyperframesService.js';

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
  status: 'pending' | 'processing' | 'awaiting_review' | 'rendering' | 'done' | 'error';
  progress: number;
  stage: string;
  error?: string;
  videoUrl?: string;
  log?: string;
  analysis?: ChartAnalysis; // Store for review
  options?: any;
};

async function saveJob(job: PipelineJob) {
  const jobPath = path.join(JOBS_DIR, `${job.id}.json`);
  const tmpPath = `${jobPath}.tmp`;
  try {
    const data = JSON.stringify(job, null, 2);
    await fs.promises.writeFile(tmpPath, data);
    await fs.promises.rename(tmpPath, jobPath);
  } catch (err) {
    console.error(`❌ [IO] Erro ao salvar Job ${job.id}:`, err);
  }
}

/**
 * Adiciona uma linha ao log do Job e persiste no disco
 */
async function appendJobLog(job: PipelineJob, message: string) {
  const timestamp = new Date().toLocaleTimeString('pt-BR', { hour12: false });
  const entry = `[${timestamp}] ${message}`;
  job.log = (job.log || '') + (job.log ? '\n' : '') + entry;
  await saveJob(job);
}

function loadJob(id: string): PipelineJob | null {
  const p = path.join(JOBS_DIR, `${id}.json`);
  if (!fs.existsSync(p)) return null;
  try {
    const content = fs.readFileSync(p, 'utf-8');
    if (!content.trim()) return null;
    return JSON.parse(content);
  } catch (err) {
    console.error(`❌ [IO] Erro ao carregar Job ${id} (arquivo corrompido):`, err);
    return null;
  }
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

async function processJob(
  jobId: string, 
  fileBuffer: Buffer, 
  originalName: string, 
  chartTheme: string,
  options: any = {}
) {
  const job = loadJob(jobId);
  if (!job) return;
  job.status = 'processing';
  job.progress = 10;
  job.stage = 'Iniciando...';
  job.options = options;
  saveJob(job);

  try {
    const ext = path.extname(originalName).toLowerCase();
    const isData = ['.csv', '.xlsx', '.xls', '.json'].includes(ext);
    const filePath = path.join(UPLOADS_DIR, `${jobId}${ext}`);
    
    // Escrita assíncrona
    await fs.promises.writeFile(filePath, fileBuffer);

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
          // Heurística local tem prioridade, depois IA, depois fallback simples
          componentId: parsed.suggestedChartType || aiResponse.type || (numericCols.length > 1 ? 'LineChart' : 'BarChart'),
          suggestedName: (aiResponse.title || 'DataChart').replace(/\s+/g, ''),
          reasoning: `Análise local: ${parsed.isTimeSeries ? 'Série Temporal detectada.' : 'Dados categóricos.'} ${parsed.dataWarnings?.join(' ') || ''}`,
          props: {
            ...props,
            title: aiResponse.title || 'Visualização de Dados Inteligente',
            unit: parsed.summary.unit || '',
            // Se for série temporal, garante que labels vêm da coluna temporal
            ...(parsed.temporalColumn && {
              labels: parsed.rows.map(r => String(r[parsed.temporalColumn!]))
            })
          }
        };

        // Loga avisos de outliers/dados no job (aparece no Log Console da UI)
        if (parsed.dataWarnings?.length) {
          job.log = `⚠️ ${parsed.dataWarnings.join(' | ')}`;
          await saveJob(job);
        }
      } catch (err: any) {
        throw new Error(`Falha ao analisar dados da planilha: ${err.message}`);
      }
    } else {
      job.stage = 'IA Vision: Analisando Gráfico...';
      job.progress = 25;
      await saveJob(job);
      try {
        if (options.enableAuditor) {
          // Pipeline Completo: Reconstituição Avançada com Auditoria Silent
          analysis = await runSurgeryGradePipeline(filePath, chartTheme, job, options.includeCallouts);
        } else {
          // Modo Rápido/Safe: Apenas análise inicial sem auditoria de fidelidade
          console.log("⏭️  [Orchestrator] Auditoria desabilitada pelo usuário. Pulando para análise direta...");
          analysis = await analyzeChartImage(
            filePath, 
            chartTheme, 
            undefined, 
            { includeCallouts: options.includeCallouts },
            (msg) => appendJobLog(job, msg)
          );
        }
      } catch (err: any) {
        throw new Error(`Falha ao analisar imagem como gráfico: ${err.message}`);
      }
    }

    job.progress = 40;
    job.stage = 'IA: Estrutura Identificada';
    job.log = `Componente: ${analysis.componentId}`;
    job.analysis = analysis;
    await saveJob(job);

    if (options.reviewRequired) {
      job.status = 'awaiting_review';
      job.stage = 'IA: Análise Pronta para Revisão';
      job.progress = 100;
      await saveJob(job);
      return;
    }

    // Prossiga para o render direto se não houver revisão
    await finishJobRendering(jobId, analysis, chartTheme, originalName);

  } catch (err: any) {
    console.error("Error Job:", err);
    job.status = 'error';
    job.error = err.message;
    await saveJob(job);
  }
}

/**
 * Parte 2 do Pipeline: Renderização e Serviços Adicionais
 */
async function finishJobRendering(jobId: string, analysis: ChartAnalysis, chartTheme: string, originalName: string) {
    const job = loadJob(jobId);
    if (!job) return;

    try {
        job.status = 'rendering';
        job.progress = 50;
        job.stage = 'Configurando Renderização...';
        await saveJob(job);

        const options = job.options || {};

        // 🛡️ SOBERANIA DO CHECKBOX: Se callouts desativados, removemos do JSON
        if (options.includeCallouts === false) {
            console.log("🚫 [Render] Removendo callouts (desativado pelo usuário)");
            delete analysis.props.annotations;
        }

        // ─── Serviço de Voz (Opcional) ───────────────────
        if (options.enableVoiceover && options.elevenlabsKey) {
            job.stage = 'Gerando Locução IA...';
            await saveJob(job);
            const narrationText = analysis.props.insightText || `${analysis.props.title}. ${analysis.props.subtitle}`;
            const audioPath = await generateVoiceover(narrationText, options.elevenlabsKey, jobId);
            if (audioPath) {
                analysis.props.audioUrl = `/cache/audio/voiceover_${jobId}.mp3`;
            }
        }

        const summary = analysis.suggestedName || 'GiantAnimation';
        const cleanOriginal = originalName.replace(/\.[^.]+$/, '').replace(/\s+/g, '_');

        // ─── MOTOR HYPERFRAMES (HTML/GSAP) ────────────────
        if (analysis.engine === 'hyperframes' || options.engine === 'hyperframes') {
            const outputName = `${summary}_HF_${cleanOriginal}.mp4`;
            job.stage = 'Renderizando via Hyperframes (HTML)...';
            await saveJob(job);
            
            const htmlContent = analysis.props.html || `
              <html>
                <body style="background: ${analysis.props.backgroundColor || '#000'}; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
                  <h1 style="color: white; font-family: sans-serif; font-size: 80px; text-align: center;">${analysis.props.title}</h1>
                </body>
              </html>
            `;

            await hyperframesService.render({
              jobId,
              htmlContent,
              outputName,
            });

            const videoUrl = `/output/${outputName}`;
            addJob({ filename: outputName, outputFile: outputName, status: 'done' });
            job.status = 'done';
            job.progress = 100;
            job.stage = 'Concluído!';
            job.videoUrl = videoUrl;
            await saveJob(job);
            return;
        }

        // ─── MOTOR REMOTION (React/UHD) ───────────────────
        job.progress = 60;
        job.stage = 'Renderizando 4K UHD...';
        await saveJob(job);

        const outputName = `${summary}_AN_${cleanOriginal}.mp4`;
        const outputPath = path.join(OUTPUT_DIR, outputName);

        const serveUrl = await getBundle();
        const composition = await selectComposition({
          serveUrl,
          id: analysis.componentId,
          inputProps: { 
            ...analysis.props, 
            theme: chartTheme,
            backgroundType: options.backgroundType || 'dark'
          }
        });

        await renderMedia({
          composition,
          serveUrl,
          outputLocation: outputPath,
          codec: 'h264',
          inputProps: { 
            ...analysis.props, 
            theme: chartTheme,
            backgroundType: options.backgroundType || 'dark'
          }
        });

        const videoUrl = `/output/${outputName}`;
        addJob({ filename: outputName, outputFile: outputName, status: 'done' });
        job.status = 'done';
        job.progress = 100;
        job.stage = 'Concluído!';
        job.videoUrl = videoUrl;
        await saveJob(job);

    } catch (err: any) {
        console.error("Error Rendering:", err);
        job.status = 'error';
        job.error = err.message;
        saveJob(job);
    }
}

// 📌 ROTAS 📌
const upload = multer({ storage: multer.memoryStorage() });
app.use(express.static(path.join(PATHS.server, 'public'))); 
app.use('/output', express.static(OUTPUT_DIR));

app.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    console.log(`🚀 [UPLOAD] Recebido arquivo: ${req.file?.originalname} de IP: ${req.ip}`);
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const jobId = uuidv4();
    const job: PipelineJob = { id: jobId, status: 'pending', progress: 0, stage: 'Aguardando...' };
    await saveJob(job);
    await appendJobLog(job, `🚀 Enviando: ${req.file.originalname}`);

    console.log(`📡 [Payload] Job: ${jobId} | Auditor: ${req.body.enableAuditor} | Callouts: ${req.body.includeCallouts}`);
    
    const options = {
      chartTheme: req.body.chartTheme || 'dark',
      includeCallouts: req.body.includeCallouts === 'true',
      enableAuditor: String(req.body.enableAuditor) !== 'false', 
      enableVoiceover: req.body.enableVoiceover === 'true',
      elevenlabsKey: req.body.elevenlabsKey || process.env.ELEVENLABS_API_KEY,
      bgStyle: req.body.bgStyle || 'none',
      reviewRequired: true 
    };

    processJob(jobId, req.file.buffer, req.file.originalname, options.chartTheme, options);
    res.json({ jobId });
  } catch (err: any) {
    console.error("❌ [Route] Erro no /upload:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/jobs/:jobId/start-render', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { analysis, originalName, chartTheme, isDarkBg, includeCallouts } = req.body;
    
    if (chartTheme && chartTheme !== 'original' && analysis && analysis.props) {
        delete analysis.props.backgroundColor;
        delete analysis.props.textColor;
        delete analysis.props.colors;
    }
    
    const job = loadJob(String(jobId));
    if (job) {
        job.options = job.options || {};
        if (isDarkBg !== undefined) job.options.backgroundType = isDarkBg ? 'dark' : 'light';
        if (includeCallouts !== undefined) job.options.includeCallouts = includeCallouts;
        await saveJob(job);
    } else {
        return res.status(404).json({ error: 'Job not found or corrupted' });
    }
    
    console.log(`🎬 [RENDER] Iniciando render final para Job: ${jobId}`);
    finishJobRendering(String(jobId), analysis, chartTheme, originalName);
    res.json({ success: true });
  } catch (err: any) {
    console.error("❌ [Route] Erro no /start-render:", err);
    res.status(500).json({ error: err.message });
  }
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
  job: any,
  includeCallouts: boolean = false
): Promise<ChartAnalysis> {
  const log = (msg: string) => appendJobLog(job, msg);
  
  let analysis: ChartAnalysis = await analyzeChartImage(
    filePath, 
    chartTheme, 
    undefined, 
    { includeCallouts },
    log
  );
  let lastAudit: any = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    console.log(`🤖 [Orchestrator] Iniciando Auditoria Silent (Tentativa ${attempt})...`);
    job.progress = 25 + (attempt * 5); 
    job.stage = `Auditando Fidelidade (Tentativa ${attempt})...`;
    await saveJob(job);

    try {
      const stillPath = await generateStill(analysis.componentId, analysis.props);
      job.progress += 2; 
      await saveJob(job);
      
      const audit = await auditRenderFidelity(filePath, stillPath);
      lastAudit = audit;

      if (audit.isApproved && audit.score >= 95) {
        console.log("✅ [Orchestrator] Fidelidade Aprovada (Score:", audit.score, ")!");
        job.progress = 40;
        return analysis;
      }

      console.warn(`⚠️ [Orchestrator] Falha na Auditoria: ${audit.critique}`);
      await appendJobLog(job, `⚠️ Auditoria: ${audit.critique.slice(0, 100)}...`);
      job.progress = 25 + (attempt * 7); 
      await saveJob(job);

      // Re-análise baseada na crítica
      analysis = await analyzeChartImage(
        filePath, 
        chartTheme, 
        audit.critique,
        { includeCallouts },
        log
      ); 
    } catch (err: any) {
      console.error("❌ [Orchestrator] Erro no loop de auditoria:", err.message);
      // Se for erro de API (como 503), não adianta seguir.
      if (err.message.includes('503') || err.message.includes('UNAVAILABLE')) {
          console.warn(`⚠️ [Orchestrator] Falha de conexão no Auditor (503). Prosseguindo com dados atuais.`);
          // Não throw, permite que o loop continue ou saia com o lastAudit (que terá o score 95 do fallback)
      }
    }
  }

  // Se chegou aqui sem aprovação, verificamos se os dados são minimamente válidos
  const p = analysis.props;
  const hasSeriesData = p.series && p.series.length > 0 && p.series[0].data && p.series[0].data.length > 0;
  const hasDataPoints = p.data && p.data.length > 0;

  if (!hasSeriesData && !hasDataPoints) {
      throw new Error(`A detecção de dados falhou (Código: BLANK). IA não encontrou números na imagem.`);
  }

  // Verificação final do auditor (Regra >95% de Precisão solicitada pelo usuário)
  if (lastAudit && lastAudit.score < 95) {
      throw new Error(`FIDELIDADE INSUFICIENTE: O render atingiu apenas ${lastAudit.score}% de precisão. Meta mínima: 95%. Auditor: ${lastAudit.critique}`);
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
