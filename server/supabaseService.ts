import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { COMPONENT_REGISTRY } from './componentRegistry.js';

// ── Cliente singleton ────────────────────────────────────────
let _client: SupabaseClient | null = null;
let _initFailed = false;

function getClient(): SupabaseClient | null {
  if (_client) return _client;
  if (_initFailed) return null;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    _initFailed = true;
    console.warn('⚠️  [SUPABASE] Credenciais ausentes. Sincronização desativada.');
    return null;
  }

  try {
    _client = createClient(url, key, {
      auth: { persistSession: false },
    });
    console.log('📡 [SUPABASE] Cliente inicializado.');
    return _client;
  } catch (err: any) {
    _initFailed = true;
    console.warn('⚠️  [SUPABASE] Sync desativado:', err.message.split('\n')[0]);
    return null;
  }
}

// ── Tipos internos ───────────────────────────────────────────
interface JobRow {
  id: string;
  filename?: string;
  output_file?: string;
  status: string;
  progress?: number;
  stage?: string;
  component_id?: string;
  props?: object;
  reasoning?: string;
  suggested_name?: string;
  engine?: string;
  video_url?: string;
  duration_seconds?: number;
  log?: string;
  error?: string;
  options?: object;
  created_at?: string;
}

// ── Helpers ──────────────────────────────────────────────────

async function fire(thenable: any, label: string, retries = 2): Promise<void> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { error } = await Promise.resolve(thenable);
      if (!error) return;

      // Erro de schema (coluna inexistente, RLS, etc.) — não adianta retry
      const isSchemaError = error.message?.includes('column') ||
                            error.message?.includes('violates') ||
                            error.message?.includes('permission') ||
                            error.message?.includes('policy');

      console.error(`❌ [SUPABASE] ${label} (tentativa ${attempt + 1}):`, error.message);
      if (isSchemaError) {
        console.error(`💡 [SUPABASE] Erro de schema/permissão — verifique colunas e RLS da tabela.`);
        return;
      }
      if (attempt < retries) await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
    } catch (err: any) {
      console.error(`❌ [SUPABASE] ${label} erro de rede (tentativa ${attempt + 1}):`, err?.message ?? err);
      if (attempt < retries) await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
}

// Throttle de progresso: só sincroniza se mudou de status OU passou 10+ pontos de progresso
const _lastSyncedProgress: Map<string, number> = new Map();
function shouldSyncProgress(id: string, progress: number, status: string): boolean {
  const key = `${id}:${status}`;
  const last = _lastSyncedProgress.get(key) ?? -1;
  if (progress - last >= 10 || progress === 100) {
    _lastSyncedProgress.set(key, progress);
    return true;
  }
  return false;
}

// ── API pública ──────────────────────────────────────────────

/**
 * Upsert de um job do historyService (Job interface).
 * Chamado sempre que o histórico local é gravado.
 */
export function syncHistoryJob(job: {
  id: string;
  filename: string;
  outputFile: string;
  status: string;
  duration?: number;
  props?: any;
  createdAt: string;
}) {
  const db = getClient();
  if (!db) return;

  const analysis = job.props?.analysis;

  const row: JobRow = {
    id: job.id,
    filename: job.filename,
    output_file: job.outputFile,
    status: job.status,
    component_id: analysis?.componentId ?? job.props?.componentId,
    props: analysis?.props ?? job.props,
    reasoning: analysis?.reasoning,
    suggested_name: analysis?.suggestedName,
    engine: analysis?.engine,
    duration_seconds: job.duration,
    created_at: job.createdAt,
  };

  fire(
    db.from('jobs').upsert(row, { onConflict: 'id' }),
    `syncHistoryJob(${job.id})`
  );
}

/**
 * Upsert de um PipelineJob do index.ts.
 * Chamado a cada mudança de status/progresso.
 */
export function syncPipelineJob(job: {
  id: string;
  status: string;
  progress: number;
  stage?: string;
  error?: string;
  videoUrl?: string;
  log?: string;
  analysis?: any;
  options?: any;
}) {
  const db = getClient();
  if (!db) return;

  // Só sincroniza se houve mudança de status ou salto de ≥10 pontos de progresso
  const isTerminal = job.status === 'done' || job.status === 'error' || job.status === 'awaiting_review';
  if (!isTerminal && !shouldSyncProgress(job.id, job.progress, job.status)) return;

  const row: JobRow = {
    id: job.id,
    status: job.status,
    progress: job.progress,
    stage: job.stage,
    error: job.error,
    video_url: job.videoUrl,
    log: job.log,
    component_id: job.analysis?.componentId,
    props: job.analysis?.props,
    reasoning: job.analysis?.reasoning,
    suggested_name: job.analysis?.suggestedName,
    engine: job.analysis?.engine,
    options: job.options,
  };

  fire(
    db.from('jobs').upsert(row, { onConflict: 'id' }),
    `syncPipelineJob(${job.id})`
  );
}

/**
 * Seed do catálogo de componentes.
 * Executado uma vez na inicialização do servidor.
 * Usa upsert para ser idempotente em restarts.
 */
export async function seedComponentRegistry() {
  const db = getClient();
  if (!db) return;

  const rows = COMPONENT_REGISTRY.map((c) => ({
    id: c.id,
    aliases: c.aliases,
    description: c.description,
    props_schema: c.propsSchema,
    example_props: c.exampleProps,
  }));

  const { error } = await db
    .from('component_registry')
    .upsert(rows, { onConflict: 'id' });

  if (error) {
    console.error('⚠️  [SUPABASE] seedComponentRegistry:', error.message);
  } else {
    console.log(`✅ [SUPABASE] component_registry sincronizado (${rows.length} componentes).`);
  }
}

/**
 * Sincroniza o conteúdo do TRAINING_LOG.md.
 * Chamado periodicamente ou em mudanças.
 */
export async function syncTrainingLog(content: string, customId: string = 'global_training_log') {
  const db = getClient();
  if (!db) return;

  const row = {
    id: customId,
    type: customId.includes('rule') ? 'rule' : 'training_log',
    content: content,
    updated_at: new Date().toISOString()
  };

  return fire(
    db.from('knowledge').upsert(row, { onConflict: 'id' }),
    `syncTrainingLog(${customId})`
  );
}

/**
 * Grava um par (imagem → props) para dataset de fine-tuning futuro.
 * Chamado uma vez quando o render conclui com sucesso.
 */
export function syncTrainingSample(sample: {
  id: string;
  componentId: string;
  imageHash: string;
  imageFilename: string;
  rawExtraction: object;       // análise antes de insights/callouts
  finalProps: object;          // props como enviadas ao Remotion
  auditScore?: number;         // score do auditor visual (0–100)
  auditPassed?: boolean;
  renderSucceeded: boolean;
}) {
  const db = getClient();
  if (!db) return;

  const row = {
    id:               sample.id,
    component_id:     sample.componentId,
    image_hash:       sample.imageHash,
    image_filename:   sample.imageFilename,
    raw_extraction:   sample.rawExtraction,
    final_props:      sample.finalProps,
    audit_score:      sample.auditScore ?? null,
    audit_passed:     sample.auditPassed ?? null,
    render_succeeded: sample.renderSucceeded,
    user_approved:    null,           // preenchido futuramente via feedback
    created_at:       new Date().toISOString(),
  };

  fire(
    db.from('training_samples').upsert(row, { onConflict: 'id' }),
    `syncTrainingSample(${sample.id})`
  );
}

/**
 * Registra um novo aprendizado específico.
 */
export function logLearning(title: string, content: string, tags: string[] = []) {
  const db = getClient();
  if (!db) return;

  const row = {
    title,
    content,
    tags,
    created_at: new Date().toISOString()
  };

  fire(
    db.from('learnings').insert(row),
    `logLearning(${title})`
  );
}
