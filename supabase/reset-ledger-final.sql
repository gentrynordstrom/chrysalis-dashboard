-- Final reset: clear ledger AND insert placeholder entries for all existing
-- qualifying turnovers/reviews so the rules engine won't re-process them.
-- Only truly NEW data from this point forward will create ledger entries.

-- 1. Clear all ledger entries
DELETE FROM incentive_ledger;

-- 2. Insert zero-amount markers for all existing qualifying tech turnovers
--    so the rules engine sees them as "already processed"
INSERT INTO incentive_ledger (pot, amount, reason, source_type, source_id, new_since_last_display)
SELECT 'tech', 0, 'Historical - excluded from fresh start', 'turnover', t.id, false
FROM turnovers t
WHERE t.work_completion_date IS NOT NULL
  AND t.work_start_date IS NOT NULL
  AND t.turnover_type IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Insert zero-amount markers for all existing qualifying office turnovers
INSERT INTO incentive_ledger (pot, amount, reason, source_type, source_id, new_since_last_display)
SELECT 'office', 0, 'Historical - excluded from fresh start', 'turnover', t.id, false
FROM turnovers t
WHERE t.deposit_status ILIKE '%deposit received%'
  AND t.is_billed = true
  AND t.key_turnin_date IS NOT NULL
  AND t.turnover_type IS NOT NULL
ON CONFLICT DO NOTHING;

-- 4. Insert zero-amount markers for all existing 5-star reviews
INSERT INTO incentive_ledger (pot, amount, reason, source_type, source_id, new_since_last_display)
SELECT 'tech', 0, 'Historical - excluded from fresh start', 'review', r.id, false
FROM work_order_reviews r
WHERE r.tech_rating = 5 AND r.quality_rating = 5
ON CONFLICT DO NOTHING;
