-- ============================================================================
-- Migração 016 — Leitura de admin (funcionalidade "Ver como", só leitura)
-- Os admins passam a poder LER (SELECT) as linhas de qualquer utilizador nas
-- tabelas de dados. NÃO há política de escrita para admins: continuam a poder
-- escrever apenas nas suas próprias linhas (a UI bloqueia escritas no modo
-- "Ver como", e o RLS é a rede de segurança).
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

-- Função auxiliar: o utilizador atual é admin? (SECURITY DEFINER evita recursão de RLS)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

grant execute on function public.is_admin() to authenticated, anon;

-- Política de leitura para admins em todas as tabelas de dados de utilizador.
do $$
declare tbl text;
begin
  foreach tbl in array array[
    'cash_entries','catalog_items','recurring_expenses','company_settings',
    'monthly_plans','fiscal_obligations','esg_diagnostics','clients'
  ]
  loop
    if not exists (select 1 from pg_policies where tablename = tbl and policyname = 'admin_read_all') then
      execute format('create policy admin_read_all on public.%I for select using (public.is_admin())', tbl);
    end if;
  end loop;
end $$;
