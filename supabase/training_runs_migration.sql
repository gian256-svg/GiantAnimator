-- Histórico de sessões de treinamento automático
CREATE TABLE IF NOT EXISTS training_runs (
  id           UUID PRIMARY KEY,
  started_at   TIMESTAMPTZ DEFAULT NOW(),
  finished_at  TIMESTAMPTZ,
  status       TEXT DEFAULT 'running',   -- running | done | halted
  total_images INT  DEFAULT 0,
  approved     INT  DEFAULT 0,
  failed       INT  DEFAULT 0,
  avg_score    FLOAT,
  halt_reason  TEXT,
  log          TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS training_runs_status_idx    ON training_runs (status);
CREATE INDEX IF NOT EXISTS training_runs_created_at_idx ON training_runs (created_at DESC);
