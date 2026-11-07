-- ============================================================================
-- Migração 059 — Horas da equipa presas a quem lançou (cada um vê só as suas)
--
-- Porquê: decisões do Vini de 07/11:
--   · 9424552d — cada hora fica ligada à conta de quem lançou, sem lançar por outra pessoa;
--   · ce2f75ed — "Cada um vê só as suas": comercial e marketing veem e editam só as
--     horas que lançaram; as horas antigas (sem autor) ficam visíveis só para a admin (Lúcia).
-- Autoria do SQL: Iara (Cibersegurança), 07/11. Substitui as políticas de horas da 056.
--
-- O que muda:
--   1. horas_cliente.autor_id (uuid, auth.users), preenchido sozinho com quem grava.
--   2. Gatilho: não-admin grava sempre com o próprio autor_id e não o pode trocar;
--      a admin pode corrigir o autor.
--   3. Comercial e marketing: leem, inserem e editam só horas de atividade
--      (cliente_id nulo) com autor_id = a própria conta. Sem delete.
--   4. A admin continua com tudo por horas_cliente_equipa (is_equipa = admin após 056).
--   5. Linhas antigas ficam com autor_id nulo: só a admin as vê (sem preenchimento
--      a partir do campo "pessoa", por decisão do Vini). O campo "pessoa" passa a ser
--      só de exibição; a fonte de verdade é autor_id.
--
-- REQUER a 056 aplicada (antes dela, is_equipa() inclui comercial e marketing e
-- horas_cliente_equipa abriria tudo). Idempotente. Não apaga dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================
begin;

do $$
begin
  if exists (select 1 from pg_proc where proname = 'is_equipa_leitura' and pronamespace = 'public'::regnamespace) is not true then
    raise exception 'Aplicar a migração 056 antes da 059';
  end if;
end $$;

-- 1. Autor
alter table public.horas_cliente
  add column if not exists autor_id uuid references auth.users(id) on delete set null default auth.uid();
create index if not exists horas_cliente_autor_idx on public.horas_cliente (autor_id);

-- 2. Gatilho
create or replace function public.horas_cliente_autor() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_admin() then
    if tg_op = 'INSERT' and new.autor_id is null then new.autor_id := auth.uid(); end if;
    return new;                                  -- admin pode corrigir o autor
  end if;
  if tg_op = 'INSERT' then
    new.autor_id := auth.uid();
  elsif new.autor_id is distinct from old.autor_id then
    raise exception 'autor das horas não pode ser alterado';
  end if;
  return new;
end $$;

drop trigger if exists horas_cliente_autor_trg on public.horas_cliente;
create trigger horas_cliente_autor_trg before insert or update on public.horas_cliente
  for each row execute function public.horas_cliente_autor();

-- 3. Políticas (substituem as da 056)
drop policy if exists "horas_atividade_le"      on public.horas_cliente;
drop policy if exists "horas_atividade_regista" on public.horas_cliente;
drop policy if exists "horas_atividade_edita"   on public.horas_cliente;

create policy "horas_atividade_le" on public.horas_cliente for select to authenticated
  using (cliente_id is null and autor_id = auth.uid() and public.is_equipa_leitura());

create policy "horas_atividade_regista" on public.horas_cliente for insert to authenticated
  with check (cliente_id is null and autor_id = auth.uid()
              and nullif(trim(atividade), '') is not null and public.is_equipa_leitura());

create policy "horas_atividade_edita" on public.horas_cliente for update to authenticated
  using      (cliente_id is null and autor_id = auth.uid() and public.is_equipa_leitura())
  with check (cliente_id is null and autor_id = auth.uid() and nullif(trim(atividade), '') is not null);

-- Sem delete para não-admin; horas_cliente_equipa (admin) cobre ler/corrigir/apagar.
commit;

-- 4. Verificação
select 'coluna autor_id' o_que, count(*)::text valor from information_schema.columns
 where table_schema = 'public' and table_name = 'horas_cliente' and column_name = 'autor_id'
union all select 'gatilho', count(*)::text from pg_trigger where tgname = 'horas_cliente_autor_trg'
union all select 'políticas horas', string_agg(policyname || ':' || cmd, ', ' order by policyname)
  from pg_policies where tablename = 'horas_cliente'
union all select 'linhas antigas sem autor', count(*)::text from public.horas_cliente where autor_id is null;
-- Esperado: 1 · 1 · horas_atividade_edita:UPDATE, horas_atividade_le:SELECT,
--           horas_atividade_regista:INSERT, horas_cliente_equipa:ALL · (n.º de linhas antigas)
--
-- Testes no DEV (Iara), com uma conta comercial:
--   T1 insere sem autor_id → fica com o próprio.
--   T2 insere com autor_id de outra conta → fica com o próprio.
--   T3 edita uma linha de outra pessoa → 0 linhas.
--   T4 muda o autor da própria linha → erro "autor das horas não pode ser alterado".
--   T5 lê: só as próprias horas de atividade; nenhuma linha antiga nem por cliente.
--   T6 apaga a própria → 0 linhas (sem delete).
--   Como admin: vê tudo, muda o autor → ok.
