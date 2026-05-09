alter table public.premium_reports
  add column if not exists consultant_notes jsonb not null default '{}'::jsonb;
