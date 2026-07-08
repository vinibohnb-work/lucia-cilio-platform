-- ============================================================================
-- Migração 012 — Diagnóstico ESG (plataforma ESG)
-- Um diagnóstico por empresa/utilizador (respostas em JSONB, questionário
-- Creditreform Advanced 2023 · ESRS/EFRAG). RLS por utilizador.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

create table if not exists public.esg_diagnostics (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  reference_year integer not null default 2023,
  answers        jsonb not null default '{}'::jsonb,
  status         text not null default 'draft',   -- draft | submitted
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id)
);

alter table public.esg_diagnostics enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'esg_diagnostics' and policyname = 'esg_diag_select_own') then
    create policy esg_diag_select_own on public.esg_diagnostics for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'esg_diagnostics' and policyname = 'esg_diag_insert_own') then
    create policy esg_diag_insert_own on public.esg_diagnostics for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'esg_diagnostics' and policyname = 'esg_diag_update_own') then
    create policy esg_diag_update_own on public.esg_diagnostics for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'esg_diagnostics' and policyname = 'esg_diag_delete_own') then
    create policy esg_diag_delete_own on public.esg_diagnostics for delete using (auth.uid() = user_id);
  end if;
end $$;
