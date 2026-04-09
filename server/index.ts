import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

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
const ROOT           = path.resolve(__dirname, '..');
const PUBLIC_DIR     = path.join(__dirname, 'public');
const UPLOADS_DIR    = path.join(ROOT, 'uploads');
const OUTPUT_DIR     = path.join(ROOT, 'output');
const REMOTION_ENTRY = path.join(ROOT, 'remotion-project', 'src', 'index.ts');

[UPLOADS_DIR, OUTPUT_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

// ─── JOB STORE ───────────────────────────────────────────────
interface Job {
  id:          string;
  status:      'pending' | 'processing' | 'done' | 'error';
  progress:    number;
  stage:       string;
  videoUrl?:   string;   // preview 720p
  video4kUrl?: string;   // 4K — preenchido após render4k
  error?:      string;
  fileName:    string;
  createdAt:   Date;
  // dados para re-render 4K
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

// ─── UPLOAD + RENDER 720p ─────────────────────────────────────
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

    processJob720p(jobId, req.file, chartType, chartTheme).catch(err => {
      console.error(`❌ [${jobId}] Erro fatal:`, err);
      updateJob(jobId, { status: 'error', error: String(err.message || err) });
    });

  } catch (err: any) {
    console.error('❌ /upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PROCESS JOB 720p ────────────────────────────────────────
async function processJob720p(
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
    emit(5, 'Analisando arquivo...');

    // 1. Analisar dados
    const inputData = await analyzeFile(file);
    emit(20, 'Arquivo analisado ✓', `📊 ${inputData.rowCount} linhas detectadas`);

    // 2. Montar props
    const resolvedType = chartType === 'auto' ? inputData.suggestedChart : chartType;
    const inputProps   = buildInputProps(inputData, resolvedType, chartTheme, 1280, 720);
    const compId       = resolveCompositionId(resolvedType);
    emit(30, 'Props montadas ✓', `🎨 Tipo: ${resolvedType} | Tema: ${chartTheme}`, 'accent');

    // 3. Bundle
    emit(35, 'Preparando bundle...');
    const serveUrl = await getBundle();
    emit(45, 'Bundle pronto ✓');

    // 4. Composição
    emit(50, 'Selecionando composição...');
    const composition = await selectComposition({ serveUrl, id: compId, inputProps });
    emit(55, `Composição: ${compId} ✓`);

    // 5. Render 720p
    const outFile720  = `${jobId}_720p.mp4`;
    const outPath720  = path.join(OUTPUT_DIR, outFile720);

    emit(60, 'Renderizando preview 720p...', '🎬 Render 720p iniciado...', 'warn');

    await renderMedia({
      composition,
      serveUrl,
      codec:          'h264',
      outputLocation: outPath720,
      inputProps,
      overrideWidth:  1280,
      overrideHeight: 720,
      crf:            23,
      onProgress: ({ progress: pct }) => {
        const mapped = 60 + Math.round(pct * 38); // 60% → 98%
        const job    = jobs.get(jobId)!;
        job.progress = mapped;
        job.stage    = `Renderizando 720p... ${Math.round(pct * 100)}%`;
        jobBus.emit(jobId, job);
      },
    });

    // 6. Salvar props para re-render 4K depois
    const job = jobs.get(jobId)!;
    job.inputProps    = inputProps;
    job.compositionId = compId;
    job.status        = 'done';
    job.progress      = 100;
    job.stage         = 'Preview 720p pronto ✓';
    job.videoUrl      = `/output/${outFile720}`;

    const duration = formatDuration(composition.durationInFrames, composition.fps);

    jobBus.emit(jobId + ':done', {
      status:   'done',
      videoUrl: job.videoUrl,
      duration,
    });

    console.log(`✅ [${jobId}] 720p concluído → ${job.videoUrl}`);

    // Limpa upload
    fs.unlink(file.path, () => {});

  } catch (err: any) {
    console.error(`❌ [${jobId}] Erro:`, err);
    updateJob(jobId, { status: 'error', error: err.message || String(err) });
    jobBus.emit(jobId + ':done', { status: 'error', error: err.message });
  }
}

// ─── RENDER 4K (sob demanda) ──────────────────────────────────
app.post('/render4k/:jobId', async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    res.status(404).json({ error: 'Job não encontrado' });
    return;
  }
  if (!job.inputProps || !job.compositionId) {
    res.status(400).json({ error: 'Props do job não disponíveis para re-render' });
    return;
  }
  if (job.video4kUrl) {
    // 4K já existe — retorna direto sem re-renderizar
    res.json({ status: 'ready', video4kUrl: job.video4kUrl });
    return;
  }

  // Responde imediatamente — o progresso vai via SSE em /progress4k/:jobId
  res.json({ status: 'started' });

  render4K(jobId).catch(err => {
    console.error(`❌ [${jobId}] Erro 4K:`, err);
    jobBus.emit(jobId + ':4k', { status: 'error', error: err.message });
  });
});

async function render4K(jobId: string) {
  const job = jobs.get(jobId)!;
  const emit4k = (progress: number, stage: string) => {
    jobBus.emit(jobId + ':4k', { progress, stage });
    console.log(`  🔷 [${jobId}] 4K ${progress}% — ${stage}`);
  };

  try {
    emit4k(5, 'Iniciando render 4K...');

    const serveUrl    = await getBundle();
    emit4k(10, 'Bundle pronto ✓');

    // Overrida width/height para 4K nas props
    const props4k = { ...job.inputProps as any, width: 3840, height: 2160 };

    const composition = await selectComposition({
      serveUrl,
      id:         job.compositionId!,
      inputProps: props4k,
    });
    emit4k(15, `Composição: ${job.compositionId} ✓`);

    const outFile4k = `${jobId}_4k.mp4`;
    const outPath4k = path.join(OUTPUT_DIR, outFile4k);

    emit4k(20, 'Renderizando em 4K... (pode demorar)');

    await renderMedia({
      composition,
      serveUrl,
      codec:          'h264',
      outputLocation: outPath4k,
      inputProps:     props4k,
      overrideWidth:  3840,
      overrideHeight: 2160,
      crf:            18, // alta qualidade
      onProgress: ({ progress: pct }) => {
        const mapped = 20 + Math.round(pct * 78); // 20% → 98%
        jobBus.emit(jobId + ':4k', {
          progress: mapped,
          stage: `Renderizando 4K... ${Math.round(pct * 100)}%`,
        });
      },
    });

    const video4kUrl = `/output/${outFile4k}`;
    job.video4kUrl   = video4kUrl;

    jobBus.emit(jobId + ':4k', {
      status:     'done',
      video4kUrl,
      progress:   100,
      stage:      'Render 4K concluído ✓',
    });

    console.log(`✅ [${jobId}] 4K concluído → ${video4kUrl}`);

  } catch (err: any) {
    jobBus.emit(jobId + ':4k', { status: 'error', error: err.message });
    throw err;
  }
}

// ─── SSE PROGRESS (720p) ──────────────────────────────────────
app.get('/progress/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;

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

  const onDone = (data: object) => {
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
  const { jobId } = req.params;

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

  const onUpdate = (data: object) => {
    send(data);
    if ((data as any).status === 'done' || (data as any).status === 'error') {
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
  if (ext === '.csv')               return analyzeCSV(file.path);
  if (['.xlsx', '.xls'].includes(ext)) return analyzeXLSX(file.path);

  if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
    // TODO: Integrar chamada real ao Gemini Vision aqui
    return {
      rowCount:       5,
      labels:         ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'],
      datasets:       [{ label: 'Série A', values: [42, 67, 55, 78, 91] }],
      suggestedChart: 'bar',
      title:          sanitizeFilename(file.originalname),
      subtitle:       '',
      unit:           '',
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

function analyzeCSV(filePath: string): FileAnalysis {
  const text  = fs.readFileSync(filePath, 'utf-8');
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) throw new Error('CSV sem dados');
  const sep    = lines[0].includes(';') ? ';' : ',';
  const header = lines[0].split(sep).map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows   = lines.slice(1).map(l => l.split(sep).map(v => v.trim().replace(/^["']|["']$/g, '')));
  const numCols = header.slice(1).filter((_, i) => rows.some(r => !isNaN(Number(r[i+1]))));
  return {
    rowCount:       rows.length,
    labels:         rows.map(r => r[0]),
    datasets:       numCols.map((col, ci) => ({ label: col, values: rows.map(r => Number(r[ci+1]) || 0) })),
    suggestedChart: numCols.length > 1 ? 'line' : 'bar',
    title:          header[0] || 'CSV',
  };
}

async function analyzeXLSX(filePath: string): Promise<FileAnalysis> {
  const XLSX = await import('xlsx');
  const wb   = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
  if (data.length < 2) throw new Error('Planilha vazia');
  const header  = data[0].map(String);
  const rows    = data.slice(1).filter(r => r.some((v: any) => v != null && v !== ''));
  const numCols = header.slice(1).filter((_, i) => rows.some(r => !isNaN(Number(r[i+1]))));
  return {
    rowCount:       rows.length,
    labels:         rows.map(r => String(r[0] ?? '')),
    datasets:       numCols.map((col, ci) => ({ label: col, values: rows.map(r => Number(r[ci+1]) || 0) })),
    suggestedChart: numCols.length > 2 ? 'line' : numCols.length === 0 ? 'pie' : 'bar',
    title:          wb.SheetNames[0] || 'Planilha',
  };
}

// ─── BUILD PROPS ──────────────────────────────────────────────
function buildInputProps(
  data:      FileAnalysis,
  chartType: string,
  theme:     string,
  width:     number,
  height:    number,
) {
  const palettes: Record<string, string[]> = {
    dark:      ['#7c3aed','#06b6d4','#a855f7','#22c55e','#f59e0b','#ef4444'],
    neon:      ['#00ff88','#00ccff','#ff00ff','#ffff00','#ff6600','#00ffcc'],
    ocean:     ['#0ea5e9','#38bdf8','#0284c7','#7dd3fc','#0369a1','#bae6fd'],
    sunset:    ['#f97316','#ef4444','#ec4899','#f59e0b','#dc2626','#fb923c'],
    minimal:   ['#e2e8f0','#94a3b8','#64748b','#334155','#cbd5e1','#f8fafc'],
    corporate: ['#1e40af','#3b82f6','#60a5fa','#93c5fd','#1d4ed8','#2563eb'],
  };

  // ✅ Converte para o formato que o BarChart espera: { label, value }[]
  const firstDataset = data.datasets[0];
  const chartData: { label: string; value: number }[] = data.labels.map((label, i) => ({
    label,
    value: firstDataset?.values[i] ?? 0,
  }));

  return {
    data:      chartData,
    title:     data.title?.trim(),
    subtitle:  data.subtitle || `${data.rowCount} registros · tema ${theme}`,
    unit:      data.unit || '',

    // Campos extras
    labels:   data.labels,
    datasets: data.datasets,
    colors:   palettes[theme] || palettes.dark,
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
    bar:            'BarChart',
    vertical_bar:   'BarChart',
    horizontal_bar: 'HorizontalBarChart',
    line:           'LineChart',
    multiline:      'MultiLineChart',
    pie:            'PieChart',
    donut:          'PieChart',
    area:           'AreaChart',
    scatter:        'ScatterPlot',
    heatmap:        'Heatmap',
    waterfall:      'WaterfallChart',
    candlestick:    'CandlestickChart',
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

// ─── START ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ✦ ─────────────────────────────────────── ✦');
  console.log(`  🎬  GiantAnimator  →  http://localhost:${PORT}`);
  console.log('  ✦ ─────────────────────────────────────── ✦');
  console.log('');
  getBundle().catch(e => console.warn('⚠️  Warm-up falhou:', e.message));
});
