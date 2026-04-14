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

-- Composite index for idempotency: prevent duplicate ledger entries per source
CREATE UNIQUE INDEX idx_ledger_source_unique
  ON incentive_ledger(source_type, source_id, pot)
  WHERE source_id IS NOT NULL;

CREATE INDEX idx_ledger_pot ON incentive_ledger(pot);
CREATE INDEX idx_ledger_new_since_display ON incentive_ledger(new_since_last_display)
  WHERE new_since_last_display = true;
CREATE INDEX idx_ledger_created_at ON incentive_ledger(created_at DESC);
