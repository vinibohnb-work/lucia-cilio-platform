-- ============================================================================
-- Migração 066 — Um movimento do banco ligado a vários lançamentos do caixa
--
-- Porquê: LUC-243. Um pagamento no banco pode cobrir duas ou mais faturas
-- lançadas em separado no Livro de Caixa. Até aqui cada movimento só ligava a
-- um lançamento (bank_transactions.cash_entry_id, 030).
--
-- O que muda (só ADITIVO: nenhuma coluna, dado ou política existente muda):
--   1. Tabela bank_transaction_entries: os lançamentos ADICIONAIS de um
--      movimento. O primeiro continua em bank_transactions.cash_entry_id, por
--      isso tudo o que já lê esse campo (Livro de Caixa, EÜR) continua certo.
--   2. Um lançamento só pode estar ligado a um movimento, seja como principal
--      seja como adicional: índice único aqui + gatilhos nos dois sentidos,
--      com o mesmo erro 23505 que o ecrã já explica.
--   3. Quando o movimento perde o lançamento principal (Desfazer, Ignorar, ou
--      o lançamento é apagado), os adicionais saem junto.
--   4. Função conciliar_varios(movimento, lançamentos[]): liga tudo numa só
--      transação; se um falhar, nada fica gravado.
--   5. RLS: cada um vê e grava o seu; a conta só consulta (061) não grava.
--
-- Não apaga dados. Idempotente.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================
begin;

-- 1. Lançamentos adicionais de um movimento
create table if not exists public.bank_transaction_entries (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade default auth.uid(),
  bank_transaction_id uuid not null references public.bank_transactions (id) on delete cascade,
  cash_entry_id       uuid not null references public.cash_entries (id) on delete cascade,
  created_at          timestamptz not null default now()
);

create unique index if not exists uq_bank_tx_entries_entry
  on public.bank_transaction_entries (cash_entry_id);
create index if not exists idx_bank_tx_entries_tx
  on public.bank_transaction_entries (bank_transaction_id);
create index if not exists idx_bank_tx_entries_user
  on public.bank_transaction_entries (user_id);

-- 5. RLS: o movimento e o lançamento têm de ser do próprio utilizador
alter table public.bank_transaction_entries enable row level security;

drop policy if exists "own bank_transaction_entries" on public.bank_transaction_entries;
create policy "own bank_transaction_entries" on public.bank_transaction_entries
  for all
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.bank_transactions b where b.id = bank_transaction_id and b.user_id = auth.uid())
    and exists (select 1 from public.cash_entries c where c.id = cash_entry_id and c.user_id = auth.uid())
  );

drop policy if exists portal_sem_insert on public.bank_transaction_entries;
drop policy if exists portal_sem_update on public.bank_transaction_entries;
drop policy if exists portal_sem_delete on public.bank_transaction_entries;
create policy portal_sem_insert on public.bank_transaction_entries as restrictive for insert to authenticated with check (not public.is_portal());
create policy portal_sem_update on public.bank_transaction_entries as restrictive for update to authenticated using (not public.is_portal()) with check (not public.is_portal());
create policy portal_sem_delete on public.bank_transaction_entries as restrictive for delete to authenticated using (not public.is_portal());

-- 2a. Adicional não pode ser o principal de outro movimento (nem do mesmo)
create or replace function public.bank_tx_entries_unico()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from public.bank_transactions b where b.cash_entry_id = new.cash_entry_id) then
    raise exception 'Este lançamento já está ligado a um movimento do banco.' using errcode = '23505';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_bank_tx_entries_unico on public.bank_transaction_entries;
create trigger trg_bank_tx_entries_unico
  before insert or update of cash_entry_id on public.bank_transaction_entries
  for each row execute function public.bank_tx_entries_unico();

-- 2b. Principal não pode ser adicional de outro movimento
-- 3.  Sem principal, os adicionais saem
create or replace function public.bank_tx_principal()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.cash_entry_id is not null and exists (
    select 1 from public.bank_transaction_entries x
     where x.cash_entry_id = new.cash_entry_id and x.bank_transaction_id <> new.id
  ) then
    raise exception 'Este lançamento já está ligado a outro movimento do banco.' using errcode = '23505';
  end if;
  if tg_op = 'UPDATE' and new.cash_entry_id is null and old.cash_entry_id is not null then
    delete from public.bank_transaction_entries x where x.bank_transaction_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_bank_tx_principal on public.bank_transactions;
create trigger trg_bank_tx_principal
  before insert or update of cash_entry_id on public.bank_transactions
  for each row execute function public.bank_tx_principal();

-- 4. Ligar um movimento a vários lançamentos, tudo ou nada.
-- security invoker: corre com as permissões (e a RLS) de quem chama.
create or replace function public.conciliar_varios(p_tx uuid, p_entries uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  n int := coalesce(array_length(p_entries, 1), 0);
begin
  if n < 1 then
    raise exception 'Escolhe pelo menos um lançamento.' using errcode = '22023';
  end if;
  if (select count(distinct e) from unnest(p_entries) e) <> n then
    raise exception 'Lançamento repetido na escolha.' using errcode = '22023';
  end if;

  update public.bank_transactions
     set status = 'conciliado', cash_entry_id = p_entries[1], matched_at = now()
   where id = p_tx;
  if not found then
    raise exception 'Movimento não encontrado.' using errcode = '42501';
  end if;

  delete from public.bank_transaction_entries where bank_transaction_id = p_tx;
  insert into public.bank_transaction_entries (user_id, bank_transaction_id, cash_entry_id)
  select auth.uid(), p_tx, e from unnest(p_entries[2:n]) e;
end;
$$;

revoke all on function public.conciliar_varios(uuid, uuid[]) from public;
grant execute on function public.conciliar_varios(uuid, uuid[]) to authenticated;

commit;

-- Verificação
select count(*) as tabela from information_schema.tables where table_schema = 'public' and table_name = 'bank_transaction_entries';
select tgname from pg_trigger where tgname in ('trg_bank_tx_entries_unico', 'trg_bank_tx_principal');
select policyname from pg_policies where tablename = 'bank_transaction_entries' order by 1;
