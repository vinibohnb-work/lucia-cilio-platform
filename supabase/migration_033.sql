-- ============================================================================
-- Migração 033 — A plataforma como canal de comunicação com o cliente.
--
-- Reunião de 10/09: "todos os clientes terão acesso básico à plataforma como
-- canal de comunicação e onboarding (contrato, documentos, notificações)".
-- O caso concreto que apressou isto: um cliente à espera de saber que a
-- declaração de IVA foi entregue.
--
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Avisos da Lúcia para um cliente
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.client_notices (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  titulo     text not null,
  corpo      text,
  -- 'info' (cinzento), 'ok' (verde, algo tratado), 'acao' (âmbar, precisa dele)
  tom        text not null default 'info' check (tom in ('info', 'ok', 'acao')),
  lido_em    timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create index if not exists idx_notices_user on public.client_notices (user_id, created_at desc);

alter table public.client_notices enable row level security;

-- O cliente lê os seus avisos e pode marcá-los como lidos — mais nada.
drop policy if exists "notices_read_own" on public.client_notices;
create policy "notices_read_own" on public.client_notices
  for select using (auth.uid() = user_id);

drop policy if exists "notices_mark_read" on public.client_notices;
create policy "notices_mark_read" on public.client_notices
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- A Lúcia escreve, edita e apaga.
drop policy if exists "notices_admin_all" on public.client_notices;
create policy "notices_admin_all" on public.client_notices
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 1b. Serviço contratado, para o reporting por serviço e por país
-- ─────────────────────────────────────────────────────────────────────────
-- O país já vivia aqui, mas só o próprio cliente o podia escrever — e muitos
-- não chegam a preencher. A Lúcia passa a poder registar os dois no momento em
-- que cria a conta, que é quando ela sabe o que vendeu.
alter table public.company_settings add column if not exists service text;

drop policy if exists "company_settings_admin_write" on public.company_settings;
create policy "company_settings_admin_write" on public.company_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 2. O cliente passa a ver o seu próprio contrato
-- ─────────────────────────────────────────────────────────────────────────
-- Até aqui client_billing era só do admin. Para o cliente saber qual é o
-- próximo pagamento, tem de poder LER a sua linha — e só ler.
drop policy if exists "billing_read_own" on public.client_billing;
create policy "billing_read_own" on public.client_billing
  for select using (auth.uid() = user_id);

-- E os recebimentos já confirmados do seu contrato, para saber o que está pago.
drop policy if exists "payments_read_own" on public.billing_payments;
create policy "payments_read_own" on public.billing_payments
  for select using (
    exists (
      select 1 from public.client_billing b
      where b.id = billing_payments.billing_id and b.user_id = auth.uid()
    )
  );
