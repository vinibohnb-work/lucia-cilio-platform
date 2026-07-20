-- ============================================================================
-- Migração 022 — Materialidade ESG (dupla materialidade simplificada + metas)
-- 1 avaliação por utilizador; temas/pontuações/metas em JSONB.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

create table if not exists public.esg_materiality (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  topics     jsonb not null default '{}'::jsonb,   -- { key: { applicable, stakeholder, company, note, goal:{baseline,target,deadline,how} } }
  threshold  numeric(3,1) not null default 3.5,    -- limiar do quadrante material (1–5)
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id)
);

alter table public.esg_materiality enable row level security;

drop policy if exists "materiality_own" on public.esg_materiality;
create policy "materiality_own" on public.esg_materiality
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Leitura de admin (funcionalidade "Ver como")
drop policy if exists "admin_read_all" on public.esg_materiality;
create policy "admin_read_all" on public.esg_materiality
  for select using (public.is_admin());
