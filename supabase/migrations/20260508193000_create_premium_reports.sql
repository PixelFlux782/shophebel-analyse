create table if not exists public.premium_reports (
  id uuid primary key,
  analysis_id uuid not null references public.analysis_results(id) on delete cascade,
  payment_id text,
  report jsonb not null,
  status text not null default 'generated',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  version text not null default 'v1'
);

create unique index if not exists premium_reports_analysis_id_key
  on public.premium_reports (analysis_id);

create index if not exists premium_reports_payment_id_idx
  on public.premium_reports (payment_id);
