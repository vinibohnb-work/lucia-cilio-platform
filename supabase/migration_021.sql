-- ============================================================================
-- Migração 021 — Financeiro da Gestão (receitas da Lúcia com os clientes dela)
-- client_billing: contratos/mensalidades por cliente (apenas admins)
-- billing_payments: recebimentos confirmados por mês ('YYYY-MM')
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

create table if not exists public.client_billing (
  id          uuid primary key default gen_random_uuid(),
  client_name text not null,                 -- nome livre (pode não ter login)
  user_id     uuid references auth.users (id) on delete set null,  -- ligação opcional a um utilizador da plataforma
  service     text,                          -- ex.: Plataforma, Consultoria ESG…
  amount      numeric(12,2) not null default 0,
  periodicity text not null default 'monthly' check (periodicity in ('monthly','quarterly','annual','once')),
  start_month text,                          -- 'YYYY-MM' (âncora da periodicidade)
  active      boolean not null default true,
  notes       text,
  created_at  timestamptz not null default now()
);

create table if not exists public.billing_payments (
  id         uuid primary key default gen_random_uuid(),
  billing_id uuid not null references public.client_billing (id) on delete cascade,
  period     text not null,                  -- 'YYYY-MM'
  amount     numeric(12,2) not null default 0,
  paid_at    date not null default current_date,
  unique (billing_id, period)
);

alter table public.client_billing   enable row level security;
alter table public.billing_payments enable row level security;

drop policy if exists "billing_admin_all" on public.client_billing;
create policy "billing_admin_all" on public.client_billing
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "payments_admin_all" on public.billing_payments;
create policy "payments_admin_all" on public.billing_payments
  for all using (public.is_admin()) with check (public.is_admin());
