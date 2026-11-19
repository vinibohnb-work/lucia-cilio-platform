-- ============================================================================
-- Migração 064 — Anotações internas só para a equipa (parte 1 de 2, ADITIVA)
--
-- Auditoria da Iara (04/11): com uma conta de cliente, a API devolvia as
-- anotações internas sobre esse cliente — na ficha (clientes.notas,
-- responsavel, horas_incluidas), no contrato (client_billing.notes) e em cada
-- obrigação (fiscal_obligations.notas e checklist). As regras de leitura do
-- cliente (033, 038, 039) são por linha: não escondem colunas.
-- Decisão do Vini (04/11): notas e checklist são só da equipa; a cliente vê a
-- obrigação, a data, o período e o estado.
--
-- Esta parte só CRIA três tabelas internas (1:1, regras só da equipa) e COPIA
-- para lá o que já existe. Não apaga nem altera nada. Aplicar ANTES do código.
-- A parte 2 (065) limpa as colunas antigas e só se aplica DEPOIS do código no ar.
--
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

-- 1. Ficha: notas, responsável e horas incluídas -----------------------------
create table if not exists public.clientes_interno (
  cliente_id      uuid primary key references public.clientes (id) on delete cascade,
  notas           text,
  responsavel     text,
  horas_incluidas numeric(6,2) not null default 0,
  updated_at      timestamptz not null default now()
);
alter table public.clientes_interno enable row level security;
drop policy if exists "clientes_interno_equipa" on public.clientes_interno;
create policy "clientes_interno_equipa" on public.clientes_interno
  for all using (public.is_equipa()) with check (public.is_equipa());

insert into public.clientes_interno (cliente_id, notas, responsavel, horas_incluidas)
select id, notas, responsavel, coalesce(horas_incluidas, 0) from public.clientes
on conflict (cliente_id) do nothing;

-- 2. Obrigação: notas e checklist ---------------------------------------------
create table if not exists public.fiscal_obligations_interno (
  obrigacao_id uuid primary key references public.fiscal_obligations (id) on delete cascade,
  notas        text,
  checklist    jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now()
);
alter table public.fiscal_obligations_interno enable row level security;
drop policy if exists "obrigacoes_interno_equipa" on public.fiscal_obligations_interno;
create policy "obrigacoes_interno_equipa" on public.fiscal_obligations_interno
  for all using (public.is_equipa()) with check (public.is_equipa());

insert into public.fiscal_obligations_interno (obrigacao_id, notas, checklist)
select id, notas, coalesce(checklist, '{}'::jsonb) from public.fiscal_obligations
 where nullif(notas, '') is not null or coalesce(checklist, '{}'::jsonb) <> '{}'::jsonb
on conflict (obrigacao_id) do nothing;

-- 3. Contrato: notas (o Financeiro é só da administradora, como client_billing) --
create table if not exists public.client_billing_interno (
  billing_id uuid primary key references public.client_billing (id) on delete cascade,
  notes      text,
  updated_at timestamptz not null default now()
);
alter table public.client_billing_interno enable row level security;
drop policy if exists "billing_interno_admin" on public.client_billing_interno;
create policy "billing_interno_admin" on public.client_billing_interno
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.client_billing_interno (billing_id, notes)
select id, notes from public.client_billing where nullif(notes, '') is not null
on conflict (billing_id) do nothing;

-- ── Verificação (aparece no painel de resultados) ───────────────────────────
select 'clientes_interno' as tabela, count(*) as linhas from public.clientes_interno
union all select 'fiscal_obligations_interno', count(*) from public.fiscal_obligations_interno
union all select 'client_billing_interno', count(*) from public.client_billing_interno;
-- Esperado: clientes_interno com tantas linhas quantas fichas; as outras com
-- as obrigações/contratos que tinham notas ou checklist.
