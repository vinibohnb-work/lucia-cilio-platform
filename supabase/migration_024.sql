-- ============================================================================
-- Migração 024 — Plano ESG (fases 1, 4 e 5)
--   1. Diagnóstico multi-ano: 1 registo por (utilizador, ano)
--   2. esg_projects: projetos ESG (nascem da materialidade)
--   3. esg_reports: relatório descritivo por ano (texto editável por secção)
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

-- 1. Diagnóstico multi-ano
alter table public.esg_diagnostics drop constraint if exists esg_diagnostics_user_id_key;
alter table public.esg_diagnostics drop constraint if exists esg_diagnostics_user_year_key;
alter table public.esg_diagnostics add constraint esg_diagnostics_user_year_key
  unique (user_id, reference_year);

-- 2. Projetos ESG
create table if not exists public.esg_projects (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  topic_key       text,                                   -- tema da materialidade (esgTopics)
  name            text not null,
  description     text,
  status          text not null default 'planned' check (status in ('planned','active','done')),
  start_month     text,                                   -- 'YYYY-MM'
  progress        int not null default 0 check (progress between 0 and 100),
  investment      numeric(12,2),                          -- investimento estimado €
  annual_saving   numeric(12,2),                          -- poupança/retorno anual estimado €
  expected_impact text,                                   -- o que muda (ligação ao KPI)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.esg_projects enable row level security;
drop policy if exists "projects_own" on public.esg_projects;
create policy "projects_own" on public.esg_projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "admin_read_all" on public.esg_projects;
create policy "admin_read_all" on public.esg_projects
  for select using (public.is_admin());
create index if not exists idx_esg_projects_user on public.esg_projects (user_id);

-- 3. Relatório ESG (texto editável por secção; dados vêm ao vivo da plataforma)
create table if not exists public.esg_reports (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  reference_year integer not null,
  sections       jsonb not null default '{}'::jsonb,      -- { materialidade, diagnostico, projetos, kpis }
  updated_at     timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  unique (user_id, reference_year)
);
alter table public.esg_reports enable row level security;
drop policy if exists "reports_own" on public.esg_reports;
create policy "reports_own" on public.esg_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "admin_read_all" on public.esg_reports;
create policy "admin_read_all" on public.esg_reports
  for select using (public.is_admin());
