import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { analyzeChartImage } from './visionService.js';
import { getHistory, addJob, clearHistory } from './historyService.js';


// ─── UTILS ───────────────────────────────────────────────────
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')          // remove extensão
    .replace(/[-_]+/g, ' ')           // hifens/underscores → espaço
    .replace(/\b\w/g, c => c.toUpperCase()) // Title Case
    .trim();
}

// ─── ESM __dirname ────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ─── PATHS ───────────────────────────────────────────────────
const IS_VERCEL      = !!process.env.VERCEL;
const ROOT           = path.resolve(__dirname, '..');
const PUBLIC_DIR     = path.join(__dirname, 'public');
const UPLOADS_DIR    = IS_VERCEL ? '/tmp/uploads' : path.join(ROOT, 'uploads');
const OUTPUT_DIR     = IS_VERCEL ? '/tmp/output' : path.join(ROOT, 'output');
const REMOTION_ENTRY = path.join(ROOT, 'remotion-project', 'src', 'index.ts');

[UPLOADS_DIR, OUTPUT_DIR].forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

// ─── JOB STORE ───────────────────────────────────────────────
interface Job {
  id:          string;
  status:      'pending' | 'processing' | 'done' | 'error';
  progress:    number;
  stage:       string;
  videoUrl?:   string;   // URL do vídeo final (Preview)
  video4kUrl?: string;   // URL do vídeo final (4K)
  error?:      string;
  fileName:    string;
  createdAt:   Date;
  inputProps?: object;
  compositionId?: string;
  _lastLog?:   { log: string; logType: string };
}

const jobs   = new Map<string, Job>();
const jobBus = new EventEmitter();
jobBus.setMaxListeners(200);

function updateJob(id: string, patch: Partial<Job>) {
  const job = jobs.get(id);
  if (!job) return;
  Object.assign(job, patch);
  jobBus.emit(id, job);
}

// ─── BUNDLE SINGLETON ─────────────────────────────────────────
let bundlePromise: Promise<string> | null = null;

async function getBundle(): Promise<string> {
  if (!bundlePromise) {
    console.log('📦 Criando bundle Remotion (primeira vez)...');
    bundlePromise = bundle({
      entryPoint: REMOTION_ENTRY,
      webpackOverride: (c) => c,
    }).then(loc => {
      console.log('✅ Bundle criado:', loc);
      return loc;
    }).catch(err => {
      bundlePromise = null;
      throw err;
    });
  }
  return bundlePromise;
}

// ─── MULTER ───────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// ─── EXPRESS ──────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(PUBLIC_DIR));
app.use('/output', express.static(OUTPUT_DIR));

// ─── HEALTH ───────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), jobs: jobs.size });
});

// ─── HISTORY ──────────────────────────────────────────────────
app.get('/history', (_req, res) => {
  res.json(getHistory());
});

app.post('/history/clear', (_req, res) => {
  clearHistory();
  res.json({ ok: true });
});

// ─── CSV PREVIEW (estrutura antes do render) ───────────────────
// Inspirado no Rainbow CSV: mostra colunas, tipos e amostra de dados
// para o usuário confirmar o mapeamento antes de animar.
app.get('/api/preview-csv', async (req: Request, res: Response) => {
  try {
    const { file } = req.query;
    if (!file || typeof file !== 'string') {
      res.status(400).json({ error: 'Parâmetro ?file= obrigatório' });
      return;
    }

    // Segurança: file deve estar dentro de UPLOADS_DIR
    const fullPath = path.resolve(UPLOADS_DIR, path.basename(file));
    if (!fullPath.startsWith(UPLOADS_DIR)) {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }
    if (!fs.existsSync(fullPath)) {
      res.status(404).json({ error: `Arquivo não encontrado: ${path.basename(file)}` });
      return;
    }

    const { tableParserService } = await import('./tableParserService.js');
    const parsed = tableParserService.parse(fullPath);

    // Monta resposta rica para o painel de preview
    const delimLabel: Record<string, string> = {
      ',':  'vírgula (,)',
      ';':  'ponto-e-vírgula (;)',
      '\t': 'tabulação (Tab)',
      '|':  'pipe (|)',
    };

    res.json({
      ok: true,
      file: path.basename(file),
      delimiter: parsed.detectedDelimiter ?? ',',
      delimiterLabel: delimLabel[parsed.detectedDelimiter ?? ','] ?? parsed.detectedDelimiter,
      shape: parsed.shape,
      totalRows: parsed.summary.totalRows,
      totalCols: parsed.summary.totalCols,
      headers: parsed.headers,
      numericColumns:     parsed.summary.numericColumns,
      categoricalColumns: parsed.summary.categoricalColumns,
      // Primeira coluna categórica → eixo X sugerido
      suggestedLabelColumn: parsed.summary.categoricalColumns[0] ?? parsed.headers[0],
      // Primeira coluna numérica → eixo Y sugerido
      suggestedValueColumn: parsed.summary.numericColumns[0]     ?? parsed.headers[1],
      // Hint do tipo de gráfico
      suggestedChartType: parsed.summary.numericColumns.length > 1 ? 'GroupedBarChart'
        : parsed.summary.totalRows <= 8 ? 'PieChart' : 'BarChart',
      // 5 linhas de amostra
      sample: parsed.summary.sample,
    });
  } catch (err: any) {
    console.error('❌ [preview-csv]', err.message);
    res.status(500).json({ error: err.message ?? 'Erro ao analisar CSV' });
  }
});


// ─── UPLOAD + RENDER 720p ─────────────────────────────────────
// ─── UPLOAD SIMPLES (sem render) ──────────────────────────────
// Apenas salva o arquivo em UPLOADS_DIR para posterior análise ou preview.
app.post('/api/upload-simple', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'Nenhum arquivo enviado' });
    return;
  }
  res.json({ ok: true, filename: req.file.filename });
});

app.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Nenhum arquivo enviado' });
      return;
    }

    const jobId      = uuidv4();
    const chartType  = (req.body.chartType  as string) || 'auto';
    const chartTheme = (req.body.chartTheme as string) || 'dark';

    const job: Job = {
      id:        jobId,
      status:    'pending',
      progress:  0,
      stage:     'Upload recebido',
      fileName:  req.file.originalname,
      createdAt: new Date(),
    };
    jobs.set(jobId, job);

    console.log(`\n📥 [${jobId}] Upload: ${req.file.originalname} | tipo: ${chartType} | tema: ${chartTheme}`);

    res.json({ jobId, fileName: req.file.originalname });

    processJob4K(jobId, req.file, chartType, chartTheme).catch(err => {
      console.error(`❌ [${jobId}] Erro fatal:`, err);
      updateJob(jobId, { status: 'error', error: String(err.message || err) });
    });

  } catch (err: any) {
    console.error('❌ /upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PROCESS JOB 4K ──────────────────────────────────────────
async function processJob4K(
  jobId:      string,
  file:       Express.Multer.File,
  chartType:  string,
  chartTheme: string,
) {
  const emit = (progress: number, stage: string, log?: string, logType = 'info') => {
    const job = jobs.get(jobId)!;
    job.progress = progress;
    job.stage    = stage;
    if (log) job._lastLog = { log, logType };
    jobBus.emit(jobId, job);
    console.log(`  ⚙️  [${jobId}] ${progress}% — ${stage}`);
  };

  try {
    updateJob(jobId, { status: 'processing' });
    // 1. Analisar dados
    let inputProps: any;
    let resolvedType: string;

    const ext = path.extname(file.originalname).toLowerCase();
    const isImage = ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);

    if (isImage) {
      emit(10, 'Analisando imagem com Gemini Vision...');
      const analysis = await analyzeChartImage(file.path);
      resolvedType = chartType === 'auto' ? analysis.componentId : chartType;

      const themeMap: Record<string, { colors: string[]; backgroundColor: string; textColor: string }> = {
        dark:      { colors: ['#7c3aed','#06b6d4','#a855f7','#22c55e','#f59e0b','#ef4444'], backgroundColor: '#0f1117', textColor: '#e8eaf6' },
        neon:      { colors: ['#00ff88','#00ccff','#ff00ff','#f9f871','#ff6600','#00e5ff'], backgroundColor: '#060614', textColor: '#f0fff4' },
        ocean:     { colors: ['#0ea5e9','#38bdf8','#7dd3fc','#22d3ee','#0284c7','#bae6fd'], backgroundColor: '#0c1b33', textColor: '#e0f2fe' },
        sunset:    { colors: ['#f97316','#ef4444','#ec4899','#f59e0b','#fb923c','#fbbf24'], backgroundColor: '#1a0800', textColor: '#fff7ed' },
        minimal:   { colors: ['#64748b','#94a3b8','#475569','#334155','#cbd5e1','#e2e8f0'], backgroundColor: '#f8fafc', textColor: '#0f172a' },
        corporate: { colors: ['#1e40af','#3b82f6','#60a5fa','#1d4ed8','#2563eb','#93c5fd'], backgroundColor: '#ffffff', textColor: '#111827' },
        light:     { colors: ['#2563eb','#059669','#d97706','#dc2626','#7c3aed','#0891b2'], backgroundColor: '#FAF9F6', textColor: '#0f172a' },
      };
      const themeConfig = themeMap[chartTheme] || themeMap.dark;

      inputProps = {
        ...analysis.props,
        chartType:       resolvedType,
        theme:           chartTheme,
        colors:          themeConfig.colors,
        backgroundColor: themeConfig.backgroundColor,
        textColor:       themeConfig.textColor,
        width:           3840, // 4K Nativo
        height:          2160,
        fps:             30,
        durationInSeconds: 8,
      };
      emit(20, 'Imagem analisada ✓', `📊 ${analysis.reasoning.slice(0, 50)}...`);

    } else {
      const inputData = await analyzeFile(file);
      emit(20, 'Arquivo analisado ✓', `📊 ${inputData.rowCount} linhas detectadas`);
      resolvedType = chartType === 'auto' ? inputData.suggestedChart : chartType;
      // buildInputProps deve ser atualizada ou injetamos width/height aqui
      inputProps = buildInputProps(inputData, resolvedType, chartTheme, 3840, 2160, file.originalname);
    }

    const compId = resolveCompositionId(resolvedType);
    emit(30, 'Configurando render 4K...', `🎨 Tipo: ${resolvedType} | Tema: ${chartTheme}`, 'accent');

    // 2. Bundle
    const serveUrl = await getBundle();

    // 3. Composição
    const composition = await selectComposition({ serveUrl, id: compId, inputProps });

    // 4. Render 4K Direto
    const outFile4K  = `${jobId}_4K.mp4`;
    const outPath4K  = path.join(OUTPUT_DIR, outFile4K);

    emit(40, 'Renderizando em 4K...', '🎬 Iniciando renderização UHD...', 'warn');

    await renderMedia({
      composition,
      serveUrl,
      codec:          'h264',
      outputLocation: outPath4K,
      inputProps,
      crf:            18, // Qualidade Máxima
      onProgress: ({ progress: pct }) => {
        const mapped = 40 + Math.round(pct * 58); // 40% → 98%
        const job    = jobs.get(jobId)!;
        job.progress = mapped;
        job.stage    = `Processando 4K... ${Math.round(pct * 100)}%`;
        jobBus.emit(jobId, job);
      },
    });

    // 5. Finalizar Job
    const job = jobs.get(jobId)!;
    job.inputProps    = inputProps;
    job.compositionId = compId;
    job.status        = 'done';
    job.progress      = 100;
    job.stage         = 'Render 4K concluído ✓';
    job.videoUrl      = `/output/${outFile4K}`;

    const duration = formatDuration(composition.durationInFrames, composition.fps as number);

    jobBus.emit(jobId + ':done', {
      status:   'done',
      videoUrl: job.videoUrl,
      duration,
    });

    console.log(`✅ [${jobId}] 4K concluído → ${job.videoUrl}`);

    // Persiste no histórico
    addJob({
      filename:   file.originalname,
      outputFile: outFile4K,
      status:     'done',
      duration:   Number(composition.durationInFrames / (composition.fps as number)),
      props:      inputProps,
    });

    // Limpa upload
    fs.unlink(file.path, () => {});

  } catch (err: any) {
    console.error(`❌ [${jobId}] Erro 4K:`, err);
    updateJob(jobId, { status: 'error', error: err?.message || String(err) });
    jobBus.emit(jobId + ':done', { status: 'error', error: err?.message || String(err) });
  }
}

// Render 4K (removido pois agora é o padrão direto em processJob4K)

// ─── SSE PROGRESS (720p) ──────────────────────────────────────
app.get('/progress/:jobId', (req: Request, res: Response) => {
  const jobId = req.params.jobId as string;

  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const job = jobs.get(jobId);
  if (job) {
    send({ progress: job.progress, stage: job.stage, status: job.status });
    if (job.status === 'done' && job.videoUrl) {
      send({ status: 'done', videoUrl: job.videoUrl, progress: 100 });
      res.end(); return;
    }
    if (job.status === 'error') {
      send({ status: 'error', error: job.error });
      res.end(); return;
    }
  }

  const onUpdate = (j: Job) => {
    const extra = j._lastLog || {};
    send({ progress: j.progress, stage: j.stage, status: j.status, ...extra });
  };

  const onDone = (data: any) => {
    send(data);
    cleanup();
    res.end();
  };

  jobBus.on(jobId, onUpdate);
  jobBus.once(jobId + ':done', onDone);
  const hb = setInterval(() => res.write(': ping\n\n'), 15000);

  const cleanup = () => {
    clearInterval(hb);
    jobBus.off(jobId, onUpdate);
    jobBus.off(jobId + ':done', onDone);
  };
  req.on('close', cleanup);
});

// ─── SSE PROGRESS 4K ──────────────────────────────────────────
app.get('/progress4k/:jobId', (req: Request, res: Response) => {
  const jobId = req.params.jobId as string;

  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  // Se 4K já pronto (cache)
  const job = jobs.get(jobId);
  if (job?.video4kUrl) {
    send({ status: 'done', video4kUrl: job.video4kUrl, progress: 100 });
    res.end(); return;
  }

  const onUpdate = (data: any) => {
    send(data);
    if (data?.status === 'done' || data?.status === 'error') {
      cleanup();
      res.end();
    }
  };

  jobBus.on(jobId + ':4k', onUpdate);
  const hb = setInterval(() => res.write(': ping\n\n'), 15000);

  const cleanup = () => {
    clearInterval(hb);
    jobBus.off(jobId + ':4k', onUpdate);
  };
  req.on('close', cleanup);
});

// ─── ANALYZE FILE ─────────────────────────────────────────────
interface FileAnalysis {
  rowCount:       number;
  labels:         string[];
  datasets:       Array<{ label: string; values: number[] }>;
  suggestedChart: string;
  title:          string;
  subtitle?:      string;
  unit?:          string;
}

async function analyzeFile(file: Express.Multer.File): Promise<FileAnalysis> {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ext === '.json')              return analyzeJSON(file.path);
  if (ext === '.csv')               return await analyzeCSV(file.path);
  if (['.xlsx', '.xls'].includes(ext)) return await analyzeXLSX(file.path);

  if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
    const analysis = await analyzeChartImage(file.path);
    // Mapeia de volta para FileAnalysis para quem ainda usa esse formato
    const data = analysis.props.data || [];
    return {
      rowCount:       data.length,
      labels:         data.map((d: any) => d.label || ''),
      datasets:       [{ label: 'Série', values: data.map((d: any) => d.value || 0) }],
      suggestedChart: analysis.componentId,
      title:          analysis.props.title || sanitizeFilename(file.originalname),
      subtitle:       analysis.props.subtitle || '',
      unit:           analysis.props.unit || '',
    };
  }
  throw new Error(`Formato não suportado: ${ext}`);
}

function analyzeJSON(filePath: string): FileAnalysis {
  const raw  = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const data = Array.isArray(raw) ? raw : (raw.data || raw.rows || [raw]);

  if (!data.length) throw new Error('JSON vazio');

  const keys    = Object.keys(data[0]);
  const numKeys = keys.filter(k => typeof data[0][k] === 'number');
  const strKeys = keys.filter(k => typeof data[0][k] === 'string');

  const labelKey = strKeys[0] || 'index';
  const labels   = data.map((r: any, i: number) => String(r[labelKey] ?? i));

  const datasets = numKeys.map(k => ({
    label:  k,
    values: data.map((r: any) => Number(r[k]) || 0),
  }));

  return {
    rowCount:       data.length,
    labels,
    datasets,
    suggestedChart: numKeys.length > 2 ? 'line' : 'bar',
    title:          raw.title?.trim() || 'Análise de Dados',
    subtitle:       raw.subtitle || '',
    unit:           raw.unit || '',
  };
}

async function analyzeCSV(filePath: string): Promise<FileAnalysis> {
  const { tableParserService } = await import('./tableParserService.js');
  const parsed = tableParserService.parse(filePath);
  const labels = parsed.rows.map(r => String(r[parsed.summary.categoricalColumns[0] || parsed.headers[0]]));
  const datasets = parsed.summary.numericColumns.map(col => ({
    label: col,
    values: parsed.rows.map(r => Number(r[col]) || 0)
  }));

  return {
    rowCount: parsed.summary.totalRows,
    labels,
    datasets,
    suggestedChart: datasets.length > 2 ? 'line' : 'bar',
    title: parsed.headers[0] || 'CSV Data',
    unit: parsed.summary.unit || ''
  };
}

async function analyzeXLSX(filePath: string): Promise<FileAnalysis> {
  const { tableParserService } = await import('./tableParserService.js');
  const parsed = tableParserService.parse(filePath);
  const labels = parsed.rows.map(r => String(r[parsed.summary.categoricalColumns[0] || parsed.headers[0]]));
  const datasets = parsed.summary.numericColumns.map(col => ({
    label: col,
    values: parsed.rows.map(r => Number(r[col]) || 0)
  }));

  return {
    rowCount: parsed.summary.totalRows,
    labels,
    datasets,
    suggestedChart: datasets.length > 2 ? 'line' : datasets.length === 0 ? 'pie' : 'bar',
    title:  'Planilha',
    unit: parsed.summary.unit || ''
  };
}

// ─── ENDPOINT: SAVE TO PATH ─────────────────────────────────
app.post('/api/save-to-path', (req: Request, res: Response) => {
  const { jobId, targetDir } = req.body;
  const job = jobs.get(jobId);

  if (!job || job.status !== 'done' || !job.videoUrl) {
    return res.status(400).json({ error: 'Job não encontrado ou não finalizado.' });
  }

  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const videoFilename = path.basename(job.videoUrl);
    const sourcePath = path.join(OUTPUT_DIR, videoFilename);
    const targetPath = path.join(targetDir, videoFilename);

    fs.copyFileSync(sourcePath, targetPath);
    console.log(`💾 Vídeo salvo automaticamente em: ${targetPath}`);
    res.json({ success: true, path: targetPath });
  } catch (err: any) {
    console.error('❌ Erro ao salvar vídeo em pasta personalizada:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── BUILD PROPS ──────────────────────────────────────────────
function buildInputProps(
  data:         FileAnalysis,
  chartType:    string,
  theme:        string,
  width:        number,
  height:       number,
  originalname: string,
) {
  const themeMap: Record<string, { colors: string[]; backgroundColor: string; textColor: string }> = {
    dark: {
      colors:          ['#7c3aed','#06b6d4','#a855f7','#22c55e','#f59e0b','#ef4444'],
      backgroundColor: '#0f1117',
      textColor:       '#e8eaf6',
    },
    neon: {
      colors:          ['#00ff88','#00ccff','#ff00ff','#f9f871','#ff6600','#00e5ff'],
      backgroundColor: '#060614',
      textColor:       '#f0fff4',
    },
    ocean: {
      colors:          ['#0ea5e9','#38bdf8','#7dd3fc','#22d3ee','#0284c7','#bae6fd'],
      backgroundColor: '#0c1b33',
      textColor:       '#e0f2fe',
    },
    sunset: {
      colors:          ['#f97316','#ef4444','#ec4899','#f59e0b','#fb923c','#fbbf24'],
      backgroundColor: '#1a0800',
      textColor:       '#fff7ed',
    },
    minimal: {
      colors:          ['#64748b','#94a3b8','#475569','#334155','#cbd5e1','#e2e8f0'],
      backgroundColor: '#f8fafc',
      textColor:       '#0f172a',
    },
    corporate: {
      colors:          ['#1e40af','#3b82f6','#60a5fa','#1d4ed8','#2563eb','#93c5fd'],
      backgroundColor: '#ffffff',
      textColor:       '#111827',
    },
    light: {
      colors:          ['#2563eb','#059669','#d97706','#dc2626','#7c3aed','#0891b2'],
      backgroundColor: '#FAF9F6',
      textColor:       '#0f172a',
    },
  };

  const themeConfig = themeMap[theme] || themeMap.dark;

  // Converte para o formato que o BarChart espera: { label, value }[]
  const firstDataset = data.datasets[0];
  const chartData: { label: string; value: number }[] = data.labels.map((label, i) => ({
    label,
    value: firstDataset?.values[i] ?? 0,
  }));

  return {
    data:      chartData,
    title:     data.title?.trim() || sanitizeFilename(originalname),
    subtitle:  data.subtitle?.trim() || '',
    unit:      data.unit || '',

    // Campos extras
    labels:          data.labels,
    datasets:        data.datasets,
    colors:          themeConfig.colors,
    backgroundColor: themeConfig.backgroundColor,
    textColor:       themeConfig.textColor,
    theme,
    chartType,
    width,
    height,
    fps:               30,
    durationInSeconds: 8,
  };
}

// ─── RESOLVE COMPOSITION ──────────────────────────────────────
function resolveCompositionId(chartType: string): string {
  const map: Record<string, string> = {
    // Select UI values
    bar:            'BarChart',
    line:           'LineChart',
    pie:            'PieChart',
    donut:          'DonutChart',
    area:           'AreaChart',
    scatter:        'ScatterPlot',
    bubble:         'BubbleChart',
    heatmap:        'HeatmapChart',
    radar:          'RadarChart',

    // Vision / agent values / Canonical IDs
    vertical_bar:        'BarChart',
    horizontal_bar:      'HorizontalBarChart',
    barchart:            'BarChart',
    horizontalbarchart:  'HorizontalBarChart',
    linechart:           'LineChart',
    piechart:            'PieChart',
    donutchart:          'DonutChart',
    areachart:           'AreaChart',
    radarchart:          'RadarChart',
    waterfallchart:      'WaterfallChart',
    scatterplot:         'ScatterPlot',
    bubblechart:         'BubbleChart',
    stackedbarchart:     'StackedBarChart',
    groupedbarchart:     'GroupedBarChart',
    sankeychart:         'SankeyChart',
    bar_h:               'HorizontalBarChart',
    bar_v:               'BarChart',
    bar_grouped:         'GroupedBarChart',
    bar_stacked:         'StackedBarChart',
    grouped_bar:         'GroupedBarChart',
    stacked_bar:         'StackedBarChart',
    multiline:           'MultiLineChart',
    waterfall:           'WaterfallChart',
    candlestick:    'CandlestickChart',
    gauge:          'GaugeChart',
    funnel:         'FunnelChart',
    sankey:         'SankeyChart',
    treemap:        'TreemapChart',
    polar:          'PolarChart',
    bullet:         'BulletChart',
    sparkline:      'SparklineChart',
    boxplot:        'BoxPlotChart',
    network:        'NetworkChart',
    histogram:      'HistogramChart',
    pareto:         'ParetoChart',
    sunburst:       'SunburstChart',
    chord:          'ChordChart',
    mekko:          'MekkoChart',
    comparative:    'ComparativeBarChart',
    bar_race:       'BarChartRace',
  };
  return map[chartType?.toLowerCase()] ?? 'BarChart';
}

function formatDuration(frames: number, fps: number): string {
  const s = Math.round(frames / fps);
  return s >= 60 ? `${Math.floor(s/60)}m ${s%60}s` : `${s}s`;
}

// ─── ERROR HANDLER ────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('❌ Unhandled:', err);
  res.status(500).json({ error: err.message });
});

// ✅ Inicializar agente Gemini (Top-level para Vercel e Local)
const initAgent = async () => {
  try {
    const { agent } = await import('./agent.js');
    await agent.initialize();
    console.log('🤖 Agente Gemini pronto.');
  } catch (e) {
    console.error('❌ Erro ao inicializar agente:', e);
  }
};
initAgent();

// ─── START ────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('');
    console.log('  ✦ ─────────────────────────────────────── ✦');
    console.log(`  🎬  GiantAnimator  →  http://localhost:${PORT}`);
    console.log('  ✦ ─────────────────────────────────────── ✦');
    console.log('');
    getBundle().catch(e => console.warn('⚠️  Warm-up falhou:', e.message));
  });
}

export default app;
