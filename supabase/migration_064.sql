-- ============================================================================
-- Migração 064 — Anexos internos ('registo') fora do alcance da conta só consulta
--
-- Porquê: parecer da Iara (18/11), item LUC-264. A 063 (bloco 7) fechou o ENVIO
-- de ficheiros pela conta 'portal', mas a LEITURA continuava aberta: a cliente
-- com conta conseguia abrir (URL assinada ou API) os anexos das mensagens que a
-- equipa regista internamente na ficha dela (mensagens_cliente.canal =
-- 'registo'). Esses ficheiros vivem na pasta dela, {user_id}/Mensagens/…, a
-- mesma onde ficam os anexos dos avisos que ela DEVE ver (client_notices), por
-- isso a regra não pode ser por pasta: é pelo registo da mensagem.
--
-- O que muda:
--   1. public.is_portal() passa a set search_path = '' (como os gatilhos da 063);
--      o corpo já usava nomes qualificados. Comportamento igual.
--   2. public.anexo_interno(bucket, nome): o ficheiro é anexo de uma mensagem
--      'registo'. security definer, para não depender do que a cliente lê em
--      mensagens_cliente (se dependesse, a regra deixava passar).
--   3. Política RESTRITIVA de SELECT em storage.objects (AND com as que existem):
--      a conta só consulta não lê anexos 'registo'. Equipa, clientes completos
--      e os restantes ficheiros da cliente (documentos do mês, comprovativos,
--      anexos de avisos, logótipo) ficam como antes. Também somem da listagem
--      da pasta (o list do Storage passa pela mesma regra).
--   4. Índice em mensagens_cliente(anexo_path) para a conferência ser barata.
--
-- Fora daqui, de propósito: anexos do canal 'whatsapp' (conversa registada com a
-- própria cliente). Regra para a fase 2: se a cliente ganhar canal de envio, a
-- exceção às portal_sem_* fica restrita a UMA pasta (ex.: <user_id>/enviados/),
-- nunca à pasta inteira.
--
-- Aditiva (função, índice, política). Não apaga nem altera dados. Idempotente.
-- Requer 061 (is_portal) e 037 (mensagens_cliente).
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================
begin;

-- 1. is_portal() com search_path vazio
create or replace function public.is_portal()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
     where id = auth.uid()
       and platform = 'portal'
       and coalesce(role, '') not in ('admin', 'comercial', 'marketing')
  );
$$;
revoke all on function public.is_portal() from public;
grant execute on function public.is_portal() to authenticated;

-- 2. O ficheiro é anexo de uma mensagem interna?
create index if not exists mensagens_cliente_anexo_path_idx
  on public.mensagens_cliente (anexo_path) where anexo_path is not null;

create or replace function public.anexo_interno(p_bucket text, p_nome text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select p_bucket = 'client-docs'
     and exists (
       select 1 from public.mensagens_cliente m
        where m.anexo_path = p_nome
          and m.canal = 'registo'
     );
$$;
revoke all on function public.anexo_interno(text, text) from public, anon;
grant execute on function public.anexo_interno(text, text) to authenticated;

-- 3. Conta só consulta não lê anexos internos
drop policy if exists portal_sem_interno_select on storage.objects;
create policy portal_sem_interno_select on storage.objects as restrictive for select to authenticated
  using (not (select public.is_portal()) or not public.anexo_interno(bucket_id, name));

commit;

-- 4. Pós-aplicação (só leitura)
-- a) is_portal com search_path vazio: esperado {search_path=""}
select proconfig from pg_proc where oid = 'public.is_portal()'::regprocedure;
-- b) a política nova: esperado 1 linha, RESTRICTIVE, SELECT
select policyname, permissive, cmd from pg_policies
 where schemaname = 'storage' and tablename = 'objects' and policyname = 'portal_sem_interno_select';
-- c) quantos anexos passam a ficar só para a equipa (contagem, sem abrir conteúdo)
select count(*) as anexos_registo_protegidos
  from public.mensagens_cliente m
  join storage.objects o on o.bucket_id = 'client-docs' and o.name = m.anexo_path
 where m.canal = 'registo';
