-- ============================================================================
-- Migração 038 — Simplificação, fase 1: regras de acesso (Guia da plataforma, R-A1 e R-A2)
--
-- 1. Obrigações fiscais (R-A1). Hoje o cliente tem controlo total sobre as
--    obrigações da sua conta, incluindo as que a equipa gere no portal: pode
--    apagá-las (com o comprovativo e a checklist) e, ao marcar "Pendente", o
--    gatilho repõe o estado de trabalho da equipa em "por preparar".
--    Passa a ser: o cliente LÊ todas as da sua conta; só ALTERA ou APAGA as que
--    não estão ligadas a uma ficha da Gestão (cliente_id vazio). As ligadas são
--    geridas pela equipa. Continua a poder acrescentar obrigações.
--
-- 2. ESG (R-A2). As regras do tempo em que o cliente preenchia a ESG continuam
--    ativas: pela API, um cliente ligado a um caso consegue gravar, e consegue ler
--    mesmo com o caso escondido (visivel_cliente = false). E as chaves únicas
--    antigas, por conta, impedem um segundo caso ligado à mesma conta.
--    Saem as regras *_own e essas chaves; ficam as da migração 036 (a Lúcia edita
--    tudo; o cliente só lê o caso visível) e as chaves únicas por caso.
--
-- 3. IVA nas despesas recorrentes (R-A3): coluna nova vat_rate no modelo.
--
-- Só mexe em regras de acesso, restrições e acrescenta uma coluna — não apaga nem altera dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

-- ── 1. Obrigações fiscais ───────────────────────────────────────────────────
drop policy if exists "own obligations" on public.fiscal_obligations;

drop policy if exists "obligations_cliente_le" on public.fiscal_obligations;
create policy "obligations_cliente_le" on public.fiscal_obligations
  for select using (auth.uid() = user_id);

drop policy if exists "obligations_cliente_cria" on public.fiscal_obligations;
create policy "obligations_cliente_cria" on public.fiscal_obligations
  for insert with check (auth.uid() = user_id);

drop policy if exists "obligations_cliente_altera" on public.fiscal_obligations;
create policy "obligations_cliente_altera" on public.fiscal_obligations
  for update using (auth.uid() = user_id and cliente_id is null)
  with check (auth.uid() = user_id and cliente_id is null);

drop policy if exists "obligations_cliente_apaga" on public.fiscal_obligations;
create policy "obligations_cliente_apaga" on public.fiscal_obligations
  for delete using (auth.uid() = user_id and cliente_id is null);

-- (A equipa continua com "obligations_equipa", da migração 037.)

-- ── 2. ESG ──────────────────────────────────────────────────────────────────
drop policy if exists esg_diag_select_own on public.esg_diagnostics;
drop policy if exists esg_diag_insert_own on public.esg_diagnostics;
drop policy if exists esg_diag_update_own on public.esg_diagnostics;
drop policy if exists esg_diag_delete_own on public.esg_diagnostics;
drop policy if exists "materiality_own"   on public.esg_materiality;
drop policy if exists "projects_own"      on public.esg_projects;
drop policy if exists "reports_own"       on public.esg_reports;

-- Chaves únicas antigas por conta (user_id), seja qual for o nome com que ficaram.
do $$
declare r record;
begin
  for r in
    select c.conrelid::regclass as tabela, c.conname
    from pg_constraint c
    where c.contype = 'u'
      and c.conrelid in ('public.esg_materiality'::regclass, 'public.esg_diagnostics'::regclass, 'public.esg_reports'::regclass)
      and exists (select 1 from pg_attribute a where a.attrelid = c.conrelid and a.attnum = any (c.conkey) and a.attname = 'user_id')
  loop
    execute format('alter table %s drop constraint %I', r.tabela, r.conname);
  end loop;
end $$;

-- ── 3. IVA nas despesas recorrentes (R-A3) ──────────────────────────────────
-- A saída confirmada a partir de um modelo passa a levar IVA: a taxa do modelo
-- ou, sem taxa, a da empresa.
alter table public.recurring_expenses add column if not exists vat_rate numeric(5,2);

-- ── 4. Verificação (aparece no painel de resultados) ────────────────────────
select 'regras de acesso nas obrigações' as o_que, string_agg(policyname, ', ' order by policyname) as valor
  from pg_policies where schemaname = 'public' and tablename = 'fiscal_obligations'
union all
select 'regras antigas da ESG ainda ativas (deve dar vazio)', coalesce(string_agg(tablename || '.' || policyname, ', '), '—')
  from pg_policies where schemaname = 'public' and tablename like 'esg_%' and policyname like '%own%'
union all
select 'chaves únicas por conta na ESG (deve dar 0)', count(*)::text
  from pg_constraint c
  where c.contype = 'u' and c.conrelid in ('public.esg_materiality'::regclass, 'public.esg_diagnostics'::regclass, 'public.esg_reports'::regclass)
    and exists (select 1 from pg_attribute a where a.attrelid = c.conrelid and a.attnum = any (c.conkey) and a.attname = 'user_id');
