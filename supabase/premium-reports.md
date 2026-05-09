# Premium Reports

Premium reports are persisted in `public.premium_reports` so the generated JSON can later be reused for PDF export, admin editing, and customer-facing views.

Run this SQL in Supabase if migrations are not applied automatically:

```sql
create table if not exists public.premium_reports (
  id uuid primary key,
  analysis_id uuid not null references public.analysis_results(id) on delete cascade,
  payment_id text,
  report jsonb not null,
  consultant_notes jsonb not null default '{}'::jsonb,
  status text not null default 'generated',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  version text not null default 'v1'
);

create unique index if not exists premium_reports_analysis_id_key
  on public.premium_reports (analysis_id);

create index if not exists premium_reports_payment_id_idx
  on public.premium_reports (payment_id);
```

For existing tables, add the consultant refinement field:

```sql
alter table public.premium_reports
  add column if not exists consultant_notes jsonb not null default '{}'::jsonb;
```
