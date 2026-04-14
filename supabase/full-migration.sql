-- ============================================
-- Chrysalis Dashboard — Full Schema Migration
-- Run this in Supabase SQL Editor (one shot)
-- ============================================

CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

CREATE TYPE turnover_type AS ENUM ('light', 'medium', 'heavy');
CREATE TYPE pot_type AS ENUM ('office', 'tech');
CREATE TYPE ledger_source_type AS ENUM ('turnover', 'review', 'manual_withdrawal', 'adjustment');
CREATE TYPE sync_status_type AS ENUM ('ok', 'error', 'syncing');

CREATE TABLE data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  last_synced_at TIMESTAMPTZ,
  sync_status sync_status_type NOT NULL DEFAULT 'ok',
  error_log TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO data_sources (name, sync_status) VALUES
  ('monday_turnovers', 'ok'),
  ('monday_work_orders', 'ok');

CREATE TRIGGER update_data_sources_updated_at
  BEFORE UPDATE ON data_sources
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TABLE turnovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monday_item_id BIGINT NOT NULL UNIQUE,
  unit_name TEXT,
  turnover_type turnover_type,
  key_turnin_date DATE,
  deposit_received_date DATE,
  deposit_status TEXT,
  work_start_date DATE,
  work_completion_date DATE,
  is_billed BOOLEAN NOT NULL DEFAULT false,
  status TEXT,
  office_days INT GENERATED ALWAYS AS (
    CASE
      WHEN deposit_received_date IS NOT NULL AND key_turnin_date IS NOT NULL
      THEN deposit_received_date - key_turnin_date
    END
  ) STORED,
  tech_days INT GENERATED ALWAYS AS (
    CASE
      WHEN work_completion_date IS NOT NULL AND work_start_date IS NOT NULL
      THEN work_completion_date - work_start_date
    END
  ) STORED,
  office_incentive_amount DECIMAL(10,2) DEFAULT 0,
  tech_incentive_amount DECIMAL(10,2) DEFAULT 0,
  estimated_hours DECIMAL(10,2),
  actual_hours DECIMAL(10,2),
  kicker_earned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_turnovers_monday_item_id ON turnovers(monday_item_id);
CREATE INDEX idx_turnovers_deposit_status ON turnovers(deposit_status);
CREATE INDEX idx_turnovers_status ON turnovers(status);

CREATE TRIGGER update_turnovers_updated_at
  BEFORE UPDATE ON turnovers
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TABLE work_order_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monday_item_id BIGINT NOT NULL UNIQUE,
  tech_rating INT CHECK (tech_rating BETWEEN 1 AND 5),
  quality_rating INT CHECK (quality_rating BETWEEN 1 AND 5),
  review_bonus DECIMAL(10,2) DEFAULT 0,
  assigned_tech TEXT,
  completion_date DATE,
  turnover_id UUID REFERENCES turnovers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_work_order_reviews_monday_item_id ON work_order_reviews(monday_item_id);
CREATE INDEX idx_work_order_reviews_turnover_id ON work_order_reviews(turnover_id);
CREATE INDEX idx_work_order_reviews_ratings ON work_order_reviews(tech_rating, quality_rating);

CREATE TRIGGER update_work_order_reviews_updated_at
  BEFORE UPDATE ON work_order_reviews
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE TABLE incentive_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pot pot_type NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  source_type ledger_source_type NOT NULL,
  source_id UUID,
  new_since_last_display BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_ledger_source_unique
  ON incentive_ledger(source_type, source_id, pot)
  WHERE source_id IS NOT NULL;

CREATE INDEX idx_ledger_pot ON incentive_ledger(pot);
CREATE INDEX idx_ledger_new_since_display ON incentive_ledger(new_since_last_display)
  WHERE new_since_last_display = true;
CREATE INDEX idx_ledger_created_at ON incentive_ledger(created_at DESC);

CREATE TABLE incentive_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pot pot_type NOT NULL,
  turnover_type turnover_type NOT NULL,
  rule_key TEXT NOT NULL,
  day_threshold INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_config_unique ON incentive_config(pot, turnover_type, rule_key);

INSERT INTO incentive_config (pot, turnover_type, rule_key, day_threshold, amount) VALUES
  ('office', 'light',  'base', 21, 100.00),
  ('office', 'medium', 'base', 25, 100.00),
  ('office', 'heavy',  'base', 30, 250.00);

INSERT INTO incentive_config (pot, turnover_type, rule_key, day_threshold, amount) VALUES
  ('tech', 'light',  'base',   10,  50.00),
  ('tech', 'medium', 'base',   15, 100.00),
  ('tech', 'heavy',  'base',   21, 150.00),
  ('tech', 'light',  'kicker', 10,  10.00),
  ('tech', 'medium', 'kicker', 15,  20.00),
  ('tech', 'heavy',  'kicker', 21,  30.00);

CREATE TRIGGER update_incentive_config_updated_at
  BEFORE UPDATE ON incentive_config
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
