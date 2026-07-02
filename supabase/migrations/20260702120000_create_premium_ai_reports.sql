create table if not exists public.premium_ai_reports (
  id uuid primary key,
  analysis_id uuid not null references public.analysis_results(id) on delete cascade,
  report jsonb not null,
  provider text,
  model text,
  status text not null default 'generated',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create unique index if not exists premium_ai_reports_analysis_id_key
  on public.premium_ai_reports (analysis_id);

create index if not exists premium_ai_reports_status_idx
  on public.premium_ai_reports (status);
