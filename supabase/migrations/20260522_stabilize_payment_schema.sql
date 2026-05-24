-- Migration: Stabilize Stripe/Supabase payment schema
-- Adds missing payment schema fields and defensive constraints/indexes.

ALTER TABLE IF EXISTS analysis_results
  ADD COLUMN IF NOT EXISTS access_level text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS product_type text NOT NULL DEFAULT 'analysis_teaser',
  ADD COLUMN IF NOT EXISTS paid_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS stripe_session_id text NULL,
  ADD COLUMN IF NOT EXISTS stripe_customer_email text NULL,
  ADD COLUMN IF NOT EXISTS plan text NULL,
  ADD COLUMN IF NOT EXISTS is_premium boolean NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'analysis_results_access_level_check'
  ) THEN
    ALTER TABLE analysis_results
      ADD CONSTRAINT analysis_results_access_level_check
      CHECK (access_level IN ('free', 'full', 'premium'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'analysis_results_payment_status_check'
  ) THEN
    ALTER TABLE analysis_results
      ADD CONSTRAINT analysis_results_payment_status_check
      CHECK (payment_status IN ('free', 'pending', 'paid', 'failed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'analysis_results_product_type_check'
  ) THEN
    ALTER TABLE analysis_results
      ADD CONSTRAINT analysis_results_product_type_check
      CHECK (product_type IN ('analysis_teaser', 'full_analysis', 'premium_report'));
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_analysis_results_stripe_session_id ON analysis_results (stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_payment_status ON analysis_results (payment_status);
CREATE INDEX IF NOT EXISTS idx_analysis_results_access_level ON analysis_results (access_level);
CREATE INDEX IF NOT EXISTS idx_analysis_results_product_type ON analysis_results (product_type);

UPDATE analysis_results
SET access_level = CASE
    WHEN plan = 'premium' OR is_premium = true THEN 'premium'
    WHEN plan = 'full' THEN 'full'
    WHEN plan = 'free' THEN 'free'
    ELSE 'free'
  END
WHERE access_level IS NULL OR trim(access_level) = '';

UPDATE analysis_results
SET payment_status = 'free'
WHERE payment_status IS NULL OR trim(payment_status) = '';

UPDATE analysis_results
SET product_type = 'analysis_teaser'
WHERE product_type IS NULL OR trim(product_type) = '';

ALTER TABLE IF EXISTS premium_reports
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'generated',
  ADD COLUMN IF NOT EXISTS version text DEFAULT '1',
  ADD COLUMN IF NOT EXISTS payment_id text NULL,
  ADD COLUMN IF NOT EXISTS consultant_notes jsonb NULL;
