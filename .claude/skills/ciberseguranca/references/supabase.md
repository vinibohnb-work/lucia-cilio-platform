# Auditando o Supabase

O que vale é o que está **aplicado no banco**, não o que a migration dizia — projeto antigo
costuma ter policy criada à mão no painel, e migration que ninguém rodou. Por isso este
roteiro consulta o banco.

Use o MCP do Supabase. Antes de tudo, `list_projects` e **confirme com o usuário qual projeto
é o do cliente auditado** — plataforma errada gera relatório errado e, pior, sugestão de
correção no banco de outra pessoa.

Todas as consultas abaixo são `select`. Nada aqui altera dado.

## O atalho: os advisors

```
get_advisors(project_id, type: "security")
get_advisors(project_id, type: "performance")
```

O de segurança já pega RLS desabilitada, policy permissiva, função `security definer` com
`search_path` mutável, view exposta e extensão no schema público. O de performance pega
índice faltando — inclusive **em coluna usada por policy**, que é o que faz uma tabela com
RLS ficar lenta de forma desproporcional.

Rode primeiro, mas não pare aí: os advisors não conhecem a regra de negócio do cliente. Eles
dizem "existe policy"; só você sabe se a policy diz a coisa certa.

## 1. Tabela sem RLS

```sql
select c.relname as tabela,
       c.relrowsecurity as rls_ligada,
       (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.relname) as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relrowsecurity, c.relname;
```

Leitura do resultado:

- `rls_ligada = false` → **🔴 exposta**. Com a anon key no navegador, o PostgREST serve a
  tabela inteira para qualquer requisição. Vale mesmo para tabela "sem nada de mais": uma
  lista de eventos revela a agenda comercial do cliente.
- `rls_ligada = true` e `policies = 0` → nega tudo. Não é risco de vazamento, é bug: alguma
  tela está quebrada ou a tabela não é usada.

## 2. O que cada policy realmente permite

```sql
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd;
```

O que procurar, em ordem de gravidade:

| Sinal | Significado |
|---|---|
| `qual = true` em `select` | qualquer um do papel listado lê a tabela toda |
| `roles = {public}` | vale para **anon** também — sem login |
| `cmd = ALL` com `qual` genérico | leitura, escrita e exclusão no mesmo cheque |
| `with_check` nulo em `insert`/`update` | dá para gravar linha com dono diferente do próprio usuário |
| policy de `update` em `profiles` sem restrição de coluna | o usuário edita o próprio `papel` → **vira Admin** |
| `auth.uid() is not null` como único critério | "estar logado" virou permissão total; num app com cadastro aberto, é público |

A pergunta a fazer em cada tabela: *o mentorado/paciente/cliente final consegue ler linha que
não é dele?* Se a resposta depender da interface, a policy está errada.

## 3. Escalada de privilégio pelo `profiles`

O furo mais provável desta arquitetura. Verifique:

```sql
-- a policy de update em profiles
select policyname, cmd, qual, with_check from pg_policies
where schemaname='public' and tablename='profiles';

-- existe trigger impedindo a troca de papel?
select tgname, pg_get_triggerdef(t.oid)
from pg_trigger t join pg_class c on c.oid = t.tgrelid
where c.relname = 'profiles' and not t.tgisinternal;

-- e qual é o papel padrão de quem entra
select column_name, column_default, is_nullable
from information_schema.columns
where table_schema='public' and table_name='profiles';
```

Se o usuário pode dar `update` na própria linha e `papel` está nessa linha sem trava, é 🔴:
uma requisição `update profiles set papel='Admin' where id=auth.uid()` e ele passa por todas
as policies de equipe.

## 4. Permissões diretas (grants)

RLS filtra linha; `grant` decide se a tabela é alcançável.

```sql
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as privilegios
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated')
group by table_name, grantee
order by table_name, grantee;
```

`anon` com `INSERT`/`UPDATE`/`DELETE` em qualquer tabela merece explicação (o caso legítimo é
um formulário público de lead — e mesmo esse precisa de `with_check` restritivo).

## 5. Views: o furo silencioso

Uma view sobre tabela com RLS **ignora a RLS** se não tiver `security_invoker = on`: ela roda
com os privilégios do dono (normalmente `postgres`) e é servida pelo PostgREST como qualquer
outra coisa.

```sql
select c.relname as view, c.reloptions
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('v','m')
order by 1;
```

Sem `security_invoker=on` nas `reloptions` → 🔴 se a view toca dado por cliente. Correção:
`alter view <nome> set (security_invoker = on);`

Materialized view não respeita RLS de jeito nenhum e não deveria ficar no schema exposto.

## 6. Funções `security definer`

```sql
select p.proname, p.prosecdef as security_definer, p.proconfig
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef;
```

Toda função `security definer` roda como o dono, ignorando RLS. Duas verificações: ela tem
`search_path` fixado (`proconfig` com `search_path=...`) e ela valida quem chamou? Sem
`search_path`, um objeto plantado em outro schema pode sequestrar a execução.

## 7. Storage

```sql
select id, name, public, file_size_limit, allowed_mime_types from storage.buckets;
select policyname, cmd, roles, qual from pg_policies where schemaname = 'storage';
```

`public = true` em bucket com contrato, laudo, foto de paciente ou documento de identidade é
🔴 — a URL não expira e não pede login. Bucket privado + `createSignedUrl` com validade curta
é o padrão. Confira também limite de tamanho e MIME permitidos (bucket sem limite é convite a
uso indevido de banda).

## 8. Índice nas colunas de policy

O predicado da policy roda **por linha**. `mentorado_id`, `user_id`, `owner_id`, `empresa_id`
usados em `qual` precisam de índice:

```sql
select tablename, indexname, indexdef from pg_indexes
where schemaname = 'public' order by tablename;
```

É achado de performance com efeito de segurança: consulta que demora demais estoura timeout e
derruba a tela do cliente.

## 9. Auth (no painel, o MCP não expõe)

Peça ao usuário para conferir, ou verifique junto com ele:

- **Sign In / Providers → Allow new users to sign up**: desligado nos projetos por convite.
- **URL Configuration**: Site URL e Redirect URLs só com os domínios reais (produção e, se
  necessário, `localhost`). Sem curinga.
- **Auth → Policies/Protection**: proteção contra senha vazada, tamanho mínimo, MFA se fizer
  sentido para a equipe.
- **Expiração** do link de convite e de recuperação.
- **Logs → Auth**: tentativas de login falhas em volume anormal.

## 10. Teste de isolamento (o que fecha a auditoria)

Consulta em `pg_policies` prova o que está escrito; só o teste prova o que acontece. Descreva
assim no relatório, para o Vinícius executar **em desenvolvimento**:

1. Duas contas: uma da equipe, uma do cliente final, cada uma com um registro seu.
2. Logado como cliente final, no console do navegador do próprio app:
   `await supabase.from('<tabela>').select('*')` — para cada tabela da lista.
3. O esperado é só as próprias linhas (ou zero). Qualquer linha de terceiro é 🔴 com prova.
4. Repita com `update` e `delete` em um id que não é dele, e com
   `update profiles set papel='Admin'`.

Registre o resultado tabela por tabela — essa matriz é o documento que responde "os dados do
cliente estão protegidos?" sem depender de opinião.
