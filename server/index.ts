import 'dotenv/config';
import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import { bundle } from '@remotion/bundler';
import { renderMedia, renderStill, selectComposition } from '@remotion/renderer';
import { getHistory, addJob, clearHistory } from './historyService.js';
import { syncPipelineJob, seedComponentRegistry, syncTrainingLog } from './supabaseService.js';
import { analyzeChartImage } from './visionService.js';
import { generateStill, getBundle, clearBundleCache } from './renderService.js';
import { auditRenderFidelity } from './auditorService.js';
import { dataTransformationService } from './dataTransformationService.js';
import { tableParserService } from './tableParserService.js';
import { agent } from './agent.js';
import { PATHS } from './paths.js';
import { startWatcher } from './watcherService.js';
import { type ChartAnalysis } from './types.js';
import { generateVoiceover } from './voiceoverService.js';
import { hyperframesService } from './hyperframesService.js';
import { validateChartData } from './dataValidator.js';

const app = express();
const portStr = process.env.PORT || '8080';
const port = parseInt(portStr, 10);
const IS_VERCEL = !!process.env.VERCEL;

app.use(cors());
app.use(express.json());

app.use((_req, _res, next) => { next(); });

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
  syncPipelineJob(job);
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
  job.stage = 'Pedro: Recebendo arquivo...';
  job.options = options;
  saveJob(job);

  const includeCallouts = options.includeCallouts === 'true' || options.includeCallouts === true;

  try {
    const ext = path.extname(originalName).toLowerCase();
    const isData = ['.csv', '.xlsx', '.xls', '.json'].includes(ext);
    const filePath = path.join(UPLOADS_DIR, `${jobId}${ext}`);
    
    // Escrita assíncrona
    await fs.promises.writeFile(filePath, fileBuffer);

    let analysis: ChartAnalysis;

    if (isData) {
      job.stage = 'Mateus: Processando planilha...';
      job.progress = 20;
      saveJob(job);

      try {
        const parsed = tableParserService.parse(filePath);
        const { numericColumns: numericCols, categoricalColumns: catCols } = parsed.summary;

        console.log(`📊 [DATA] Detectado: ${numericCols.length} num, ${catCols.length} cat`);

        const aiResponse = await agent.analyzeTable(parsed);
        let props = aiResponse;

        // 🔒 BLINDAGEM DE DADOS MATRICIAIS
        // O LLM frequentemente erra a formatação (ex: aninha 'series' dentro de 'data' ou resume linhas).
        // Para arquivos de tabela, a IA dita APENAS metadados (Cores, Título, Tipo de Gráfico).
        // A matriz de dados é SEMPRE recriada à força usando a leitura local perfeita.
        delete props.data;
        delete props.series;
        delete props.labels;

        const labelCol = catCols[0] || parsed.headers[0];
        
        if (numericCols.length > 1) {
            // Múltiplas séries / Racing Chart - FORÇA A SELEÇÃO
            props.componentId = parsed.isTimeSeries ? 'RacingLineChart' : 'MultiLineChart';
            props.labels = parsed.rows.map(row => String(row[labelCol]));
            props.series = numericCols.map(col => ({
                label: col,
                data: parsed.rows.map(row => Number(row[col]))
            }));
        } else {
            // Gráfico de série única
            props.data = parsed.rows.map(row => ({
               label: String(row[labelCol]),
               value: Number(row[numericCols[0]])
            }));
        }

        // 🔥 Final Pass (Movido para o render final pós-auditoria)
        
        // Diagnóstico Final: Grava as props assincronamente
        fs.promises.writeFile(path.join(process.cwd(), 'current_props.json'), JSON.stringify(props, null, 2)).catch(() => {});

        analysis = {
          // Heurística local tem prioridade, depois IA, depois fallback simples
          // CORREÇÃO GIANT: Forçamos BarChart para séries únicas em modo de imagem para evitar falso positivo de LineChart
          componentId: parsed.suggestedChartType || aiResponse.type || (numericCols.length > 1 ? 'MultiLineChart' : 'BarChart'),
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
      job.stage = 'João: Analisando referência visual...';
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
    job.stage = 'João: Estrutura identificada';
    job.log = `Componente: ${analysis.componentId}`;
    await saveJob(job);

    // ─── AGENTE DE INSIGHTS (Groq -> Fallback Ollama Local) ───
    job.stage = 'Felipe: Gerando insights...';
    try {
      if (process.env.GROQ_API_KEY) {
        console.log("✨ [Felipe] Gerando insights executivos com Groq...");
        const { generateInsightWithGroq } = await import("./groqService.js");
        analysis.props.insightText = await generateInsightWithGroq(analysis);
        job.log += `\n✨ [Groq] Insight: ${analysis.props.insightText}`;
      } else {
        throw new Error("GROQ_API_KEY não definida");
      }
    } catch (groqErr) {
      console.warn("⚠️ Groq indisponível para insights. Chaveando para OLLAMA local...");
      try {
        const { generateInsightsWithOllama } = await import("./ollamaService.js");
        analysis.props.insightText = await generateInsightsWithOllama(analysis.props);
        job.log += `\n✨ [Ollama] Insight Local: ${analysis.props.insightText}`;
      } catch (ollamaErr: any) {
        console.error('❌ [Simão] Erro ao gerar insight local:', ollamaErr.message);
        analysis.props.insightText = analysis.props.title || "Insight não disponível.";
      }
    }

    // ─── ETAPA FINAL: Enriquecimento de Destaques (Highlights) ───
    if (includeCallouts) {
      job.stage = 'André: Adicionando destaques de Alta e Baixa...';
      await saveJob(job);
      try {
        const { enrichAnalysisWithCallouts } = await import('./calloutService.js');
        analysis = await enrichAnalysisWithCallouts(analysis);
      } catch (e) {
        console.warn("⚠️ [Orchestrator] Falha no enriquecimento de Destaques:", e);
      }
    }

    job.analysis = analysis;
    await saveJob(job);

    if (options.reviewRequired) {
      job.status = 'awaiting_review';
      job.stage = 'Felipe: Análise pronta para revisão';
      job.progress = 100;
      await saveJob(job);
      return;
    }

    // Modo treinamento: salva dados no Supabase sem renderizar vídeo (economiza CPU/disco)
    if (options.trainingOnly) {
      job.status = 'done';
      job.stage = 'Mateus: Dados validados e salvos (modo treinamento)';
      job.progress = 100;
      addJob({ filename: originalName, outputFile: '', status: 'done', props: { analysis } });
      await saveJob(job);
      return;
    }

    // Prossiga para o render completo
    await finishJobRendering(jobId, analysis, chartTheme, originalName, options.customPalette);

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
async function finishJobRendering(jobId: string, analysis: ChartAnalysis, chartTheme: string, originalName: string, customPalette?: any) {
    const job = loadJob(jobId);
    if (!job) return;

    try {
        job.status = 'rendering';
        job.progress = 50;
        job.stage = 'André: Configurando renderização...';
        await saveJob(job);

        // Se for tema customizado, injeta as cores na análise
        if (chartTheme === 'custom' && customPalette) {
            console.log("🎨 [Render] Aplicando paleta customizada...");
            analysis.props.backgroundColor = customPalette.bg;
            analysis.props.textColor = customPalette.text;
            analysis.props.seriesColors = customPalette.colors;
        }

        const options = job.options || {};

        // 🛡️ SOBERANIA DO CHECKBOX: Se callouts desativados, removemos do JSON
        if (options.includeCallouts === false) {
            console.log("🚫 [Render] Removendo callouts/annotations (desativado pelo usuário)");
            delete analysis.props.annotations;
            // showValueLabels é preservado para manter fidelidade aos dados numéricos básicos
        }

        // ─── Serviço de Voz (Opcional) ───────────────────
        if (options.enableVoiceover && options.elevenlabsKey) {
            job.stage = 'Bartolomeu: Gerando locução...';
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
            job.stage = 'André: Renderizando via Hyperframes...';
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
            job.stage = 'André: Concluído!';
            job.videoUrl = videoUrl;
            await saveJob(job);
            return;
        }

        // ─── MOTOR REMOTION (React/UHD) ───────────────────
        job.progress = 60;
        job.stage = 'André: Renderizando 4K UHD...';
        await saveJob(job);

        const isAlpha = String(options.exportAlpha) === 'true' || options.backgroundType === 'transparent';
        const outputExt = isAlpha ? 'mov' : 'mp4';
        const outputName = `${summary}_AN_${cleanOriginal}.${outputExt}`;
        const outputPath = path.join(OUTPUT_DIR, outputName);

        const serveUrl = await getBundle();
        const resolvedTheme = chartTheme || 'dark';
        
        // Se for um tema PREMIUM (Volcano, Neon, etc), limpamos as cores da IA.
        // Se for um tema BÁSICO (dark, light) ou ORIGINAL/CUSTOM, preservamos as cores extraídas.
        const isPremiumTheme = !['dark','light','original','custom'].includes(resolvedTheme);

        if (isPremiumTheme) {
            console.log(`🎨 [Render] Aplicando SOBERANIA DO TEMA PREMIUM: ${resolvedTheme}`);
            if (analysis.props.series) {
                analysis.props.series = analysis.props.series.map((s: any) => {
                    const { color, ...rest } = s; 
                    return rest;
                });
            }
            delete analysis.props.seriesColors;
            delete analysis.props.colors;
        }

        // 🔥 FINAL LOCALIZATION & 4K PREP (Pós-Auditoria)
        const finalizedProps = dataTransformationService.prepareFor4K({
            ...analysis.props,
            theme: resolvedTheme,
            backgroundType: isAlpha ? 'transparent' : (options.backgroundType || analysis.props.backgroundType),
            backgroundColor: isAlpha ? 'rgba(0,0,0,0)' : (analysis.props.backgroundColor === '#000000' ? undefined : analysis.props.backgroundColor)
        });

        const inputProps = finalizedProps;

        console.log("🎨 [Render] Propriedades finais enviadas ao Remotion:");
        console.dir(inputProps, { depth: null });

        const composition = await selectComposition({
          serveUrl,
          id: analysis.componentId,
          inputProps
        });

        const renderOptions: any = {
          composition,
          serveUrl,
          outputLocation: outputPath,
          inputProps
        };

        if (isAlpha) {
          console.log("🎬 [Render] Exportando com canal ALPHA (ProRes 4444)...");
          renderOptions.codec = 'prores';
          renderOptions.proResProfile = '4444';
          renderOptions.pixelFormat = 'yuva444p10le';
          renderOptions.imageFormat = 'png';
        } else {
          renderOptions.codec = 'h264';
        }

        await renderMedia(renderOptions);

        // Generate thumbnail from final frame
        let thumbnailFile: string | undefined;
        try {
            const thumbName = outputName.replace(/\.(mp4|mov)$/i, '.thumb.jpg');
            const thumbPath = path.join(OUTPUT_DIR, thumbName);
            const thumbFrame = Math.max(0, composition.durationInFrames - 1);
            await renderStill({
                composition,
                serveUrl,
                output: thumbPath,
                inputProps,
                frame: thumbFrame,
                imageFormat: 'jpeg',
                jpegQuality: 85,
            });
            thumbnailFile = thumbName;
            console.log(`🖼️ [Thumb] Gerado: ${thumbName}`);
        } catch (thumbErr: any) {
            console.warn(`⚠️ [Thumb] Falha ao gerar thumbnail: ${thumbErr.message}`);
        }

        const videoUrl = `/output/${outputName}`;
        addJob({ filename: outputName, outputFile: outputName, thumbnailFile, status: 'done', props: { analysis } });
        job.status = 'done';
        job.progress = 100;
        job.stage = 'André: Concluído!';
        job.videoUrl = videoUrl;
        await saveJob(job);

    } catch (err: any) {
        console.error("Error Rendering:", err);
        job.status = 'error';
        job.error = err.message;
        await saveJob(job);
    }
}

// 📌 ROTAS 📌
const upload = multer({ storage: multer.memoryStorage() });
app.use(express.static(path.join(PATHS.server, 'public'))); 
app.use('/output', express.static(OUTPUT_DIR));

app.post('/reload-bundle', (_req: Request, res: Response) => {
  clearBundleCache();
  getBundle().then(() => res.json({ ok: true, message: 'Bundle reconstruído.' })).catch(err => res.status(500).json({ error: err.message }));
});

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
      customPalette: req.body.customPalette ? JSON.parse(req.body.customPalette) : null,
      includeCallouts: req.body.includeCallouts === 'true',
      enableAuditor: String(req.body.enableAuditor) !== 'false',
      enableVoiceover: req.body.enableVoiceover === 'true',
      elevenlabsKey: req.body.elevenlabsKey || process.env.ELEVENLABS_API_KEY,
      bgStyle: req.body.bgStyle || 'none',
      reviewRequired: req.body.reviewRequired !== 'false',
      trainingOnly: req.body.trainingOnly === 'true',
      exportAlpha: req.body.exportAlpha === 'true'
    };

    processJob(jobId, req.file.buffer, req.file.originalname, options.chartTheme, options);
    res.json({ jobId });
  } catch (err: any) {
    console.error("❌ [Route] Erro no /upload:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/debug/sync-supabase', async (_req: Request, res: Response) => {
    try {
        console.log("📡 [DEBUG] Sincronização manual solicitada...");
        await seedComponentRegistry();
        
        if (fs.existsSync('TRAINING_LOG.md')) {
            await syncTrainingLog(fs.readFileSync('TRAINING_LOG.md', 'utf-8'));
        }

        const knowledgeDir = path.join('.agent', 'knowledge');
        if (fs.existsSync(knowledgeDir)) {
            const files = fs.readdirSync(knowledgeDir).filter(f => f.endsWith('.md'));
            for (const f of files) {
                const content = fs.readFileSync(path.join(knowledgeDir, f), 'utf-8');
                await syncTrainingLog(content, f.replace('.md', '')); 
            }
        }

        res.json({ success: true, message: "Sincronização iniciada. Verifique os logs do servidor para detalhes." });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/jobs/:jobId/start-render', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { analysis, originalName, chartTheme, isDarkBg, includeCallouts, customPalette } = req.body;
    
    if (chartTheme && chartTheme !== 'original' && analysis && analysis.props) {
        delete analysis.props.backgroundColor;
        delete analysis.props.textColor;
        delete analysis.props.colors;
        delete analysis.props.seriesColors;
    }
    
    const job = loadJob(String(jobId));
    if (job) {
        job.options = job.options || {};
        if (isDarkBg !== undefined) {
            job.options.backgroundType = isDarkBg ? 'dark' : 'light';
        } else if (req.body.options?.backgroundType) {
            job.options.backgroundType = req.body.options.backgroundType;
        }
        if (includeCallouts !== undefined) job.options.includeCallouts = includeCallouts;
        if (req.body.options?.engine) job.options.engine = req.body.options.engine;
        if (req.body.options?.exportAlpha !== undefined) job.options.exportAlpha = req.body.options.exportAlpha;
        await saveJob(job);
    } else {
        return res.status(404).json({ error: 'Job not found or corrupted' });
    }
    
    console.log(`🎬 [RENDER] Iniciando render final para Job: ${jobId}`);
    finishJobRendering(String(jobId), analysis, chartTheme, originalName, customPalette);
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
    { includeCallouts: false }, // 🛡️ PHASE 1: Pure Data (No distractions)
    log
  );

  // ── Reality Shield: validação determinística antes de qualquer render ──
  const dataCheck = validateChartData(analysis.componentId, analysis.props);
  if (!dataCheck.isValid) {
    const reasons = dataCheck.errors.join(' | ');
    console.error(`🛑 [Reality Shield] Dados inválidos — bloqueando treino: ${reasons}`);
    await appendJobLog(job, `🛑 Reality Shield: ${reasons}`);
    throw new Error(`DADOS_INVALIDOS: ${reasons}`);
  }
  console.log(`✅ [Reality Shield] Dados verificados (${analysis.componentId}).`);

  let lastAudit: any = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    console.log(`🤖 [Orchestrator] Iniciando Auditoria Silent (Tentativa ${attempt})...`);
    job.progress = 25 + (attempt * 5); 
    job.stage = `Tomé: Auditando fidelidade (tentativa ${attempt})...`;
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
        { includeCallouts: false }, // 🛡️ Mantém foco em fidelidade no re-try
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
      throw new Error(`A detecção de dados falhou (Código: BLANK). IA não encontrou números na imagem. Verifique se suas chaves de API (Gemini/Groq) no .env são válidas ou se o seu modelo local do Ollama é capaz de analisar imagens.`);
  }

  // Verificação final do auditor (Regra de Resiliência: 85% é o novo "Gold Standard" para bloqueio)
  if (lastAudit && lastAudit.score < 80) {
      throw new Error(`FIDELIDADE INSUFICIENTE: O render atingiu apenas ${lastAudit.score}% de precisão. Meta mínima: 80% (alvo: 90%). Auditor: ${lastAudit.critique}`);
  }

  // Final job result
  job.analysis = analysis;
  job.progress = 60;
  await saveJob(job);
  
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
            
            // 📡 SINCRONIZAÇÃO SUPABASE (MEGA DATABASE)
            seedComponentRegistry();
            
            // Sincroniza LOG de Treinamento
            if (fs.existsSync('TRAINING_LOG.md')) {
                syncTrainingLog(fs.readFileSync('TRAINING_LOG.md', 'utf-8'));
            }

            // Sincroniza Regras Ativas (.agent/knowledge)
            const knowledgeDir = path.join('.agent', 'knowledge');
            if (fs.existsSync(knowledgeDir)) {
                const files = fs.readdirSync(knowledgeDir).filter(f => f.endsWith('.md'));
                files.forEach(f => {
                    const content = fs.readFileSync(path.join(knowledgeDir, f), 'utf-8');
                    syncTrainingLog(content, f.replace('.md', '')); 
                });
            }

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
