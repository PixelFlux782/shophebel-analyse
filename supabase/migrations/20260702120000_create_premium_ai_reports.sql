create table if not exists public.premium_ai_reports (
  id uuid primary key,
  analysis_id uuid not null references public.analysis_results(id) on delete cascade,
  report jsonb not null,
  provider text,
  model text,
  status text not null default 'generated',
  report_version text,
  input_hash text,
  generated_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.premium_ai_reports
  add column if not exists report_version text,
  add column if not exists input_hash text,
  add column if not exists generated_at timestamp with time zone not null default now();

create unique index if not exists premium_ai_reports_analysis_id_key
  on public.premium_ai_reports (analysis_id);

create index if not exists premium_ai_reports_status_idx
  on public.premium_ai_reports (status);

create index if not exists premium_ai_reports_input_hash_idx
  on public.premium_ai_reports (input_hash);
