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

-- Office pot thresholds (Keys-to-Deposit)
INSERT INTO incentive_config (pot, turnover_type, rule_key, day_threshold, amount) VALUES
  ('office', 'light',  'base', 21, 100.00),
  ('office', 'medium', 'base', 25, 100.00),
  ('office', 'heavy',  'base', 30, 250.00);

-- Tech pot turnover thresholds (Work Completion)
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
