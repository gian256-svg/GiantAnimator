import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { COMPONENT_REGISTRY } from './componentRegistry.js';

// ── Cliente singleton ────────────────────────────────────────
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (_client) return _client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.warn('⚠️  [SUPABASE] Credenciais ausentes (.env). Sincronização desativada.');
    return null;
  }

  try {
    _client = createClient(url, key, {
      auth: { persistSession: false },
    });
    console.log('📡 [SUPABASE] Cliente inicializado com sucesso.');
    return _client;
  } catch (err: any) {
    console.error('❌ [SUPABASE] Erro ao inicializar cliente:', err.message);
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

function fire(thenable: any, label: string) {
  return Promise.resolve(thenable).then(({ error }) => {
    if (error) {
      console.error(`❌ [SUPABASE] ${label} erro:`, error.message);
      console.error(`💡 [SUPABASE] Dica: Verifique se a tabela correspondente existe e se a sua chave de API tem permissão de escrita.`);
    } else {
      console.log(`✅ [SUPABASE] ${label} sincronizado.`);
    }
  }).catch((err) => {
    console.error(`❌ [SUPABASE] ${label} erro de rede:`, err?.message ?? err);
  });
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
