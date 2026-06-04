-- ============================================================================
-- LC Office Consulting — Schema da plataforma contável (multi-utilizador)
-- Executar no Supabase: Dashboard → SQL Editor → New query → colar → Run
-- ============================================================================

-- ─── 0. CATÁLOGO (produtos e serviços) ──────────────────────────────────────
create table if not exists public.catalog_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name       text not null,
  kind       text not null default 'service' check (kind in ('product','service')),
  price      numeric(12,2),
  created_at timestamptz not null default now()
);

-- ─── 1. LIVRO DE CAIXA ──────────────────────────────────────────────────────
create table if not exists public.cash_entries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade default auth.uid(),
  entry_date      date not null,
  doc             text,
  description     text not null,
  type            text not null check (type in ('entrada','saida')),
  amount          numeric(12,2) not null check (amount >= 0),
  destination     text not null check (destination in ('caixa','banco')),
  category        text,
  catalog_item_id uuid references public.catalog_items (id) on delete set null,
  created_at      timestamptz not null default now()
);

-- ─── 2. CLIENTES ────────────────────────────────────────────────────────────
create table if not exists public.clients (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name       text not null,
  country    text not null default 'pt' check (country in ('pt','de')),
  sector     text,
  service    text not null default 'acc' check (service in ('esg','acc','both')),
  status     text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

-- ─── 3. OBRIGAÇÕES FISCAIS ──────────────────────────────────────────────────
create table if not exists public.fiscal_obligations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade default auth.uid(),
  obligation_type text not null,
  client          text,
  country         text not null default 'pt' check (country in ('pt','de')),
  deadline        date not null,
  status          text not null default 'pending' check (status in ('pending','done')),
  created_at      timestamptz not null default now()
);

-- ─── INDEXES (consultas por utilizador) ─────────────────────────────────────
create index if not exists idx_cash_entries_user on public.cash_entries (user_id, entry_date);
create index if not exists idx_clients_user       on public.clients (user_id);
create index if not exists idx_obligations_user   on public.fiscal_obligations (user_id, deadline);
create index if not exists idx_catalog_user       on public.catalog_items (user_id);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────────────────────
-- Cada utilizador só vê e altera as SUAS linhas.
alter table public.catalog_items      enable row level security;
alter table public.cash_entries       enable row level security;
alter table public.clients            enable row level security;
alter table public.fiscal_obligations enable row level security;

drop policy if exists "own catalog" on public.catalog_items;
create policy "own catalog" on public.catalog_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- cash_entries
drop policy if exists "own cash_entries" on public.cash_entries;
create policy "own cash_entries" on public.cash_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- clients
drop policy if exists "own clients" on public.clients;
create policy "own clients" on public.clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- fiscal_obligations
drop policy if exists "own obligations" on public.fiscal_obligations;
create policy "own obligations" on public.fiscal_obligations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── PERFIS (role user/admin) — ver migration_003.sql ───────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role) values (new.id, 'user') on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();
