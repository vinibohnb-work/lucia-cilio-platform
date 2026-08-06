-- ============================================================================
-- Migração 027 — Palavra-passe pré-definida com mudança no primeiro acesso
-- O acesso deixa de ser dado por convite (link válido 24h) e passa a ser criado
-- com uma palavra-passe temporária entregue pela Lúcia. A conta fica marcada
-- para exigir a mudança no primeiro acesso.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

-- Contas já existentes ficam a false — já têm palavra-passe própria.

-- Limpar a marca depois de mudar a palavra-passe.
-- ⚠️ Feito por função de privilégio mínimo e NÃO por uma política de UPDATE em
-- profiles: uma política genérica permitiria ao próprio utilizador alterar o seu
-- `role` para 'admin'. Esta função só mexe nesta coluna e só na própria linha.
create or replace function public.clear_must_change_password()
returns void language sql security definer set search_path = public as $$
  update public.profiles set must_change_password = false where id = auth.uid();
$$;
grant execute on function public.clear_must_change_password() to authenticated;
