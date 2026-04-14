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
