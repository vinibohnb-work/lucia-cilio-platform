-- ============================================================================
-- Migração 026 — Papéis de equipa: "comercial" e "marketing"
--   comercial  → assistente comercial (Carla): apenas o CRM
--   marketing  → gestor de tráfego (Filipe): apenas a página de Marketing
-- Nenhum destes papéis acede a dados de clientes (caixa, ESG, financeiro):
-- as políticas `admin_read_all` continuam restritas a is_admin().
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles drop constraint if exists profiles_role_chk;
alter table public.profiles add constraint profiles_role_check
  check (role in ('user','admin','comercial','marketing'));

-- Verificação de papel reutilizável (evita repetir subconsultas nas políticas)
create or replace function public.has_role(roles text[])
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = any(roles));
$$;
grant execute on function public.has_role(text[]) to authenticated, anon;

-- CRM: admin + comercial (a assistente trabalha os leads)
drop policy if exists "crm_admin_all" on public.crm_leads;
drop policy if exists "crm_staff_all" on public.crm_leads;
create policy "crm_staff_all" on public.crm_leads
  for all using (public.has_role(array['admin','comercial']))
  with check (public.has_role(array['admin','comercial']));

-- Nota: o papel "marketing" ainda não tem tabelas próprias — a página de
-- Marketing é um placeholder. Quando existirem dados (métricas Meta/Google),
-- criar as tabelas com política has_role(array['admin','marketing']).
