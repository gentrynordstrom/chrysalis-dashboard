CREATE TABLE data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  last_synced_at TIMESTAMPTZ,
  sync_status sync_status_type NOT NULL DEFAULT 'ok',
  error_log TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the two Monday.com data sources
INSERT INTO data_sources (name, sync_status) VALUES
  ('monday_turnovers', 'ok'),
  ('monday_work_orders', 'ok');

CREATE TRIGGER update_data_sources_updated_at
  BEFORE UPDATE ON data_sources
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
