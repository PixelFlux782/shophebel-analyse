ALTER TABLE public.analysis_results
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free',
ADD COLUMN IF NOT EXISTS product_type text DEFAULT 'analysis_teaser',
ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS paid_at timestamptz,
ADD COLUMN IF NOT EXISTS stripe_session_id text,
ADD COLUMN IF NOT EXISTS stripe_customer_email text;

UPDATE public.analysis_results
SET
  plan = 'premium',
  product_type = 'premium_report',
  payment_status = 'paid'
WHERE (is_premium IS TRUE OR payment_status = 'paid')
  AND COALESCE(plan, '') NOT IN ('full', 'premium');

CREATE INDEX IF NOT EXISTS idx_analysis_results_plan
ON public.analysis_results(plan);

CREATE INDEX IF NOT EXISTS idx_analysis_results_stripe_session_id
ON public.analysis_results(stripe_session_id);
