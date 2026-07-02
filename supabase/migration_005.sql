-- ============================================================================
-- Migração 005 — Dados da Empresa (Fase 0)
-- Uma linha de definições por utilizador. Base para IVA, calendário fiscal e IR.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

create table if not exists public.company_settings (
  user_id                uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  company_name           text,
  country                text not null default 'PT' check (country in ('PT','DE')),
  currency               text not null default 'EUR',
  vat_regime             text not null default 'normal' check (vat_regime in ('exempt','normal')),
  vat_default_rate       numeric(5,2) not null default 23,
  ir_reserve_pct         numeric(5,2) not null default 25 check (ir_reserve_pct >= 0 and ir_reserve_pct <= 100),
  ss_regime              text,
  fiscal_year_start_month int not null default 1 check (fiscal_year_start_month between 1 and 12),
  updated_at             timestamptz not null default now()
);

alter table public.company_settings enable row level security;

drop policy if exists "own company_settings" on public.company_settings;
create policy "own company_settings" on public.company_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
