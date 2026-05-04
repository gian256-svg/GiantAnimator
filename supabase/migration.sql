-- ============================================================
-- GiantAnimator — Supabase Migration
-- Execute no SQL Editor do seu projeto Supabase
-- ============================================================

-- ── 1. JOBS ─────────────────────────────────────────────────
-- Tabela principal: cada linha = um gráfico processado.
-- Serve como histórico E como dataset de treinamento futuro
-- (input: filename/imagem → output: component_id + props).

CREATE TABLE IF NOT EXISTS jobs (
  id                UUID        PRIMARY KEY,
  filename          TEXT,
  output_file       TEXT,
  status            TEXT        NOT NULL DEFAULT 'pending',
  progress          INTEGER     NOT NULL DEFAULT 0,
  stage             TEXT,
  component_id      TEXT,          -- qual tipo de gráfico foi detectado
  props             JSONB,         -- props completas (dados + visual)
  reasoning         TEXT,          -- raciocínio da IA
  suggested_name    TEXT,
  engine            TEXT,          -- 'gemini' | 'claude' | 'ollama'
  video_url         TEXT,
  duration_seconds  FLOAT,
  log               TEXT,
  error             TEXT,
  options           JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para as queries mais comuns do futuro app
CREATE INDEX IF NOT EXISTS idx_jobs_status       ON jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_component_id ON jobs (component_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at   ON jobs (created_at DESC);

-- Atualiza updated_at automaticamente em qualquer UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_jobs_updated_at ON jobs;
CREATE TRIGGER trg_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ── 2. COMPONENT_REGISTRY ───────────────────────────────────
-- Catálogo estático dos tipos de gráfico disponíveis.
-- O futuro app usa isso para montar a UI sem depender da IA.

CREATE TABLE IF NOT EXISTS component_registry (
  id            TEXT        PRIMARY KEY,
  aliases       TEXT[]      NOT NULL DEFAULT '{}',
  description   TEXT,
  props_schema  TEXT,
  example_props JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── 3. SEGURANÇA (RLS) ──────────────────────────────────────
-- Usamos Service Role Key no servidor, então liberamos tudo.
-- Troque as policies se quiser expor dados ao frontend.

ALTER TABLE jobs               ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_full_access" ON jobs;
CREATE POLICY "service_full_access" ON jobs
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_full_access" ON component_registry;
CREATE POLICY "service_full_access" ON component_registry
  FOR ALL USING (true) WITH CHECK (true);
