-- Create budget_status table for tracking Google Cloud budget notifications
CREATE TABLE budget_status (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  cost_amount NUMERIC NOT NULL DEFAULT 0,
  budget_amount NUMERIC NOT NULL DEFAULT 0,
  budget_exceeded BOOLEAN NOT NULL DEFAULT FALSE,
  budget_name TEXT,
  currency_code TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert the default row
INSERT INTO budget_status (id, cost_amount, budget_amount, budget_exceeded)
VALUES (1, 0, 0, FALSE);

-- Enable RLS (no policies needed since only the service role writes to this table)
ALTER TABLE budget_status ENABLE ROW LEVEL SECURITY;
