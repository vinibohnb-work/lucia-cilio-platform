-- ============================================================================
-- Migração 014 — Planeamento Mensal (Monatsplanung) + limite Familienversicherung
-- monthly_plans: 1 plano por utilizador; linhas de serviços em JSONB.
-- de_famv_limit: limite mensal de lucro p/ Familienversicherung (DE, 565 € em 2026).
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

create table if not exists public.monthly_plans (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  items            jsonb not null default '[]'::jsonb,
  monthly_fixed    numeric(12,2) not null default 0,
  productive_hours numeric(12,2) not null default 0,
  reserve_basis    text not null default 'gewinn',   -- gewinn | umsatz
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id)
);

alter table public.monthly_plans enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'monthly_plans' and policyname = 'plans_select_own') then
    create policy plans_select_own on public.monthly_plans for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'monthly_plans' and policyname = 'plans_insert_own') then
    create policy plans_insert_own on public.monthly_plans for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'monthly_plans' and policyname = 'plans_update_own') then
    create policy plans_update_own on public.monthly_plans for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'monthly_plans' and policyname = 'plans_delete_own') then
    create policy plans_delete_own on public.monthly_plans for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Limite Familienversicherung (usado na Etapa 4, módulo DE)
alter table public.company_settings add column if not exists de_famv_limit numeric(12,2) default 565;
