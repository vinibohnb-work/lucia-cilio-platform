-- ============================================================================
-- Migração 058 — O cliente vê o próprio contrato sem as notas internas
--
-- Porquê (revisão da Iara, 07/11): a 033 deu ao cliente leitura da linha
-- inteira de client_billing (billing_read_own), incluindo notes, client_name e
-- cliente_id. Com a 12-B no ar, cada cliente ligado lê as notas internas do
-- próprio contrato pela API.
--
-- Não se usa grant por coluna: admin e cliente usam o mesmo papel
-- (authenticated); revogar notes tirava-a também à admin. Solução: vista só do
-- próprio, sem a política de leitura direta. payments_read_own consultava
-- client_billing por dentro e passaria a não ver nada, por isso vai por função.
--
-- Independente da 056/057. Idempotente. Aplicar primeiro no DEV.
-- Antes da produção: confirmar as colunas reais de client_billing; coluna nova
-- com texto interno NÃO entra na vista.
-- Front que acompanha: src/pages/contabilidade/Inicio.jsx (lê portal_meu_contrato).
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================
begin;

-- Cliente deixa de ler a tabela inteira (notes, client_name, cliente_id ficam só com a admin)
drop policy if exists "billing_read_own" on public.client_billing;

create or replace function public.meus_contratos_ids()
returns setof uuid language sql security definer set search_path = public stable as $$
  select id from public.client_billing where user_id = auth.uid();
$$;
revoke all on function public.meus_contratos_ids() from public, anon;
grant execute on function public.meus_contratos_ids() to authenticated;

drop policy if exists "payments_read_own" on public.billing_payments;
create policy "payments_read_own" on public.billing_payments for select to authenticated
  using (billing_id in (select public.meus_contratos_ids()));

drop view if exists public.portal_meu_contrato;
create view public.portal_meu_contrato
with (security_barrier = true, security_invoker = false) as
  select id, service, amount, periodicity, start_month, active, contract_name, contract_path, created_at
    from public.client_billing
   where user_id = auth.uid();
revoke all on public.portal_meu_contrato from public, anon, authenticated;
grant select on public.portal_meu_contrato to authenticated;

commit;

-- Verificação (como cliente de teste no DEV):
--  select * from client_billing;          → 0 linhas
--  select * from portal_meu_contrato;      → só a própria linha, sem notes
--  select * from billing_payments;         → só os pagamentos do próprio contrato
--  como admin: client_billing completo continua (billing_admin_all)
-- Colunas atuais (conferir que nenhuma nova com texto interno entra na vista):
select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'client_billing' order by ordinal_position;
