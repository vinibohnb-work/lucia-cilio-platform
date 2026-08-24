-- ============================================================================
-- PASSO 3a · Exportar os utilizadores (correr no SQL Editor do projeto ANTIGO)
--
-- v2 — a primeira versão falhava com "cannot insert a non-DEFAULT value into
-- column confirmed_at": auth.users tem colunas GERADAS (confirmed_at) e
-- auth.identities também (email). Um insert não lhes pode dar valor. Esta
-- versão descobre as colunas não-geradas no catálogo e insere só essas — as
-- geradas recalculam-se sozinhas no destino.
--
-- Cada query devolve UMA CÉLULA com todos os INSERTs: copiar essa célula e
-- correr no SQL Editor do projeto NOVO. Ordem: users primeiro, identities
-- depois. O aviso "Potential issue detected" do editor é um falso positivo
-- (a query só lê) — "Run without RLS".
-- ============================================================================

-- 1) Utilizadores (leva encrypted_password — as senhas sobrevivem)
with cols as (
  select string_agg(quote_ident(column_name), ',' order by ordinal_position) as lista
  from information_schema.columns
  where table_schema = 'auth' and table_name = 'users' and is_generated = 'NEVER'
)
select string_agg(
  format(
    'insert into auth.users (%s) select %s from jsonb_populate_record(null::auth.users, %L::jsonb) on conflict (id) do nothing;',
    cols.lista, cols.lista, to_jsonb(u)
  ),
  E'\n' order by u.created_at
) as sql_users
from auth.users u, cols
group by cols.lista;

-- 2) Identities (liga o email ao utilizador — sem isto o login falha)
with cols as (
  select string_agg(quote_ident(column_name), ',' order by ordinal_position) as lista
  from information_schema.columns
  where table_schema = 'auth' and table_name = 'identities' and is_generated = 'NEVER'
)
select string_agg(
  format(
    'insert into auth.identities (%s) select %s from jsonb_populate_record(null::auth.identities, %L::jsonb) on conflict (provider_id, provider) do nothing;',
    cols.lista, cols.lista, to_jsonb(i)
  ),
  E'\n'
) as sql_identities
from auth.identities i, cols
group by cols.lista;

-- 3) Conferência (correr no projeto NOVO depois de colar os dois blocos)
-- select count(*) as users from auth.users;
-- select count(*) as identities from auth.identities;
