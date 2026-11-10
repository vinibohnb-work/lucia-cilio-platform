-- ============================================================================
-- Migração 061 — "Só consulta" garantido também pelo banco (requer 057)
--
-- Porquê: auditoria da Iara (04/11, ponto 3) e item "Garantir no banco o acesso
-- só de consulta". Até aqui a conta 'portal' (só consulta, migração 057) só
-- estava travada na interface: lendo a base diretamente, ainda conseguia
-- gravar no próprio Livro de Caixa, nas definições da empresa (incluindo o
-- serviço e o país) e nas obrigações que ela mesma criasse. Não havia fuga
-- entre clientes; o risco era o cliente alterar os próprios dados contornando
-- o ecrã.
--
-- O que muda:
--   1. Função public.is_portal(): a conta da sessão tem platform = 'portal'
--      (e não é da equipa).
--   2. Em cada tabela de dados do cliente, três políticas RESTRITIVAS
--      (insert, update, delete) com "not is_portal()". Restritiva soma-se (AND)
--      às regras que já existem: quem tem contabilidade completa continua a
--      gravar como antes; a conta só consulta não grava nada. A leitura não
--      muda.
--      Ficam de fora, de propósito: profiles (troca de senha no 1.º acesso),
--      client_notices (marcar aviso como lido, já limitado pela 044) e
--      mensagens_cliente (canal do cliente, fase 2).
--   3. company_settings: o serviço e o país só mudam pela Lúcia (admin) ou
--      pelo servidor. O cliente pode criar a sua linha (com país, sem serviço)
--      se ainda não existir; depois não troca nenhum dos dois.
--
-- Nota: num UPDATE ou DELETE barrado pela política, o Postgres não dá erro:
-- devolve 0 linhas alteradas. O INSERT dá erro 42501.
-- Não apaga dados. Idempotente. Aplicar primeiro no DEV; produção junto com o
-- código do portal (057).
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================
begin;

-- 1. A conta da sessão é "só consulta"?
create or replace function public.is_portal()
returns boolean
language sql
security definer
set search_path = public
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

-- 2. Nada de escrita para a conta só consulta nas tabelas de dados do cliente
do $$
declare tbl text;
begin
  foreach tbl in array array[
    'cash_entries','catalog_items','clients','recurring_expenses',
    'company_settings','fiscal_obligations','monthly_plans',
    'bank_imports','bank_transactions',
    'esg_diagnostics','esg_materiality','esg_projects','esg_reports',
    'esg_comentarios'
  ]
  loop
    if to_regclass('public.' || tbl) is not null then
      execute format('drop policy if exists portal_sem_insert on public.%I', tbl);
      execute format('drop policy if exists portal_sem_update on public.%I', tbl);
      execute format('drop policy if exists portal_sem_delete on public.%I', tbl);
      execute format('create policy portal_sem_insert on public.%I as restrictive for insert to authenticated with check (not public.is_portal())', tbl);
      execute format('create policy portal_sem_update on public.%I as restrictive for update to authenticated using (not public.is_portal()) with check (not public.is_portal())', tbl);
      execute format('create policy portal_sem_delete on public.%I as restrictive for delete to authenticated using (not public.is_portal())', tbl);
    end if;
  end loop;
end $$;

-- 3. Serviço e país: só a Lúcia (admin) ou o servidor (sem sessão)
create or replace function public.company_settings_servico_pais()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    -- O ecrã Empresa grava por upsert com a linha inteira (inclui o serviço que
    -- já lá está): o BEFORE INSERT corre mesmo quando vai acabar em UPDATE.
    -- Só barra quando a linha ainda não existe; o resto o ramo UPDATE confere.
    if new.service is not null
       and not exists (select 1 from public.company_settings c where c.user_id = new.user_id) then
      raise exception 'O serviço é definido pela LC Office.' using errcode = '42501';
    end if;
  elsif new.service is distinct from old.service
     or new.country is distinct from old.country then
    raise exception 'O serviço e o país são definidos pela LC Office.' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_company_settings_servico_pais on public.company_settings;
create trigger trg_company_settings_servico_pais
  before insert or update on public.company_settings
  for each row execute function public.company_settings_servico_pais();

commit;

-- Verificação: 3 políticas portal_sem_* por tabela e o gatilho do serviço/país
select tablename, count(*) as politicas
  from pg_policies
 where schemaname = 'public' and policyname like 'portal_sem_%'
 group by tablename order by tablename;
select tgname from pg_trigger where tgname = 'trg_company_settings_servico_pais';
