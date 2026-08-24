-- ============================================================================
-- PASSO 3a · Exportar os utilizadores (correr no SQL Editor do projeto ANTIGO)
--
-- Porquê assim: os hashes de password vivem em auth.users, que não é acessível
-- pela API — só por SQL. Esta query devolve UMA LINHA DE INSERT POR UTILIZADOR,
-- pronta a colar no SQL Editor do projeto NOVO. Com o volume atual (~10 contas)
-- é copy-paste; ninguém redefine senha.
--
-- Correr as duas queries POR ESTA ORDEM e colar os resultados no novo projeto
-- também por esta ordem (users primeiro — identities referencia users).
-- ============================================================================

-- 1) Utilizadores (inclui encrypted_password — as senhas sobrevivem)
select format(
  'insert into auth.users select * from jsonb_populate_record(null::auth.users, %L::jsonb) on conflict (id) do nothing;',
  to_jsonb(u)
) as sql_para_o_projeto_novo
from auth.users u
order by u.created_at;

-- 2) Identities (liga o email ao utilizador — sem isto o login falha)
select format(
  'insert into auth.identities select * from jsonb_populate_record(null::auth.identities, %L::jsonb) on conflict (provider_id, provider) do nothing;',
  to_jsonb(i)
) as sql_para_o_projeto_novo
from auth.identities i;
