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
