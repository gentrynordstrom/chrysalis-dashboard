-- Reset ledger to $0: clear all historical incentive entries.
-- Only future qualifying events will create new entries.

DELETE FROM incentive_ledger;

-- Reset the review_bonus on existing work orders so they re-evaluate at $5
UPDATE work_order_reviews SET review_bonus = CASE
  WHEN tech_rating = 5 AND quality_rating = 5 THEN 5.00
  ELSE 0
END;

-- Reset incentive amounts on turnovers so rules engine re-evaluates
UPDATE turnovers SET
  office_incentive_amount = 0,
  tech_incentive_amount = 0;
