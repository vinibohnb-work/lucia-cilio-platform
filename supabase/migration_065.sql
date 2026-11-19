-- ============================================================================
-- Migração 065 — Anotações internas só para a equipa (parte 2 de 2, LIMPEZA)
--
-- ⚠️ ARRISCADA (UPDATE em clientes, client_billing e fiscal_obligations).
-- Aplicar SÓ DEPOIS de a 064 estar aplicada E de o código que lê e grava nas
-- tabelas internas estar no ar. Antes disso a equipa deixaria de ver as notas.
--
-- 1. Volta a copiar para as tabelas internas o que tiver sido escrito nas
--    colunas antigas entre a 064 e o código novo (sem sobrepor o que lá está).
-- 2. Esvazia as colunas antigas (notas, responsavel, horas_incluidas, notes,
--    checklist): é isto que deixa de as mostrar à cliente pela API.
-- 3. Gatilhos mantêm-nas vazias, mesmo que algum ecrã antigo ainda lá escreva.
-- As colunas ficam (não se apagam) para nenhuma regra ou ecrã antigo partir.
--
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

-- 1. Recópia ------------------------------------------------------------------
insert into public.clientes_interno (cliente_id, notas, responsavel, horas_incluidas)
select id, notas, responsavel, coalesce(horas_incluidas, 0) from public.clientes
on conflict (cliente_id) do nothing;

insert into public.fiscal_obligations_interno (obrigacao_id, notas, checklist)
select id, notas, coalesce(checklist, '{}'::jsonb) from public.fiscal_obligations
 where nullif(notas, '') is not null or coalesce(checklist, '{}'::jsonb) <> '{}'::jsonb
on conflict (obrigacao_id) do nothing;

insert into public.client_billing_interno (billing_id, notes)
select id, notes from public.client_billing where nullif(notes, '') is not null
on conflict (billing_id) do nothing;

-- 2. Esvaziar as colunas antigas ------------------------------------------------
update public.clientes set notas = null, responsavel = null, horas_incluidas = 0
 where notas is not null or responsavel is not null or horas_incluidas <> 0;
update public.fiscal_obligations set notas = null, checklist = '{}'::jsonb
 where notas is not null or checklist <> '{}'::jsonb;
update public.client_billing set notes = null where notes is not null;

-- 3. Mantê-las vazias -----------------------------------------------------------
create or replace function public.clientes_sem_notas()
returns trigger language plpgsql as $$
begin
  new.notas := null; new.responsavel := null; new.horas_incluidas := 0;
  return new;
end $$;
drop trigger if exists trg_clientes_sem_notas on public.clientes;
create trigger trg_clientes_sem_notas before insert or update on public.clientes
  for each row execute function public.clientes_sem_notas();

create or replace function public.obrigacoes_sem_notas()
returns trigger language plpgsql as $$
begin
  new.notas := null; new.checklist := '{}'::jsonb;
  return new;
end $$;
drop trigger if exists trg_obrigacoes_sem_notas on public.fiscal_obligations;
create trigger trg_obrigacoes_sem_notas before insert or update on public.fiscal_obligations
  for each row execute function public.obrigacoes_sem_notas();

create or replace function public.billing_sem_notas()
returns trigger language plpgsql as $$
begin
  new.notes := null;
  return new;
end $$;
drop trigger if exists trg_billing_sem_notas on public.client_billing;
create trigger trg_billing_sem_notas before insert or update on public.client_billing
  for each row execute function public.billing_sem_notas();

-- ── Verificação ────────────────────────────────────────────────────────────
select 'clientes com notas antigas' as o_que, count(*) from public.clientes where notas is not null or responsavel is not null
union all select 'obrigações com notas/checklist antigos', count(*) from public.fiscal_obligations where notas is not null or checklist <> '{}'::jsonb
union all select 'contratos com notas antigas', count(*) from public.client_billing where notes is not null;
-- Esperado: 0, 0, 0
