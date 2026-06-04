-- ============================================================================
-- Migração 003 — Perfis de utilizador com role (user / admin)
-- Executar no Supabase: Dashboard → SQL Editor → New query → colar → Run
-- ============================================================================

-- ─── Tabela de perfis ───────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Cada utilizador pode ler o seu próprio perfil (para a app saber o role).
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);
-- NB: não há policy de UPDATE → um utilizador não se pode auto-promover a admin.
--     A alteração de role faz-se por SQL (abaixo) ou no painel (service role).

-- ─── Criar perfil automaticamente quando se cria um login ───────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Backfill: garantir perfil para utilizadores já existentes ──────────────
insert into public.profiles (id, role)
select id, 'user' from auth.users
on conflict (id) do nothing;

-- ============================================================================
-- COMO DEFINIR UM ADMINISTRADOR
-- Cria o login normalmente (Authentication → Add user) e depois corre:
--
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'admin@exemplo.com');
--
-- Para voltar a utilizador normal: set role = 'user'.
-- ============================================================================
