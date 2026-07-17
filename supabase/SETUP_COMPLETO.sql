-- ============================================================================
-- LC OFFICE CONSULTING — SETUP COMPLETO (consolida schema + migrações 002–016)
-- Corre TUDO de uma vez. É idempotente: seguro de correr numa base nova OU numa
-- base que já tenha parte aplicada (usa IF NOT EXISTS / guardas / DROP+CREATE).
-- Supabase → SQL Editor → New query → colar tudo → Run.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 1. PERFIS (role user/admin + plataforma)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists platform text not null default 'accounting';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_platform_chk') then
    alter table public.profiles add constraint profiles_platform_chk check (platform in ('accounting','esg'));
  end if;
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. TABELAS BASE
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.catalog_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name       text not null,
  kind       text not null default 'service' check (kind in ('product','service')),
  price      numeric(12,2),
  created_at timestamptz not null default now()
);

create table if not exists public.recurring_expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade default auth.uid(),
  description text not null,
  category    text,
  amount      numeric(12,2) not null default 0,
  periodicity text not null default 'monthly' check (periodicity in ('monthly','quarterly','annual')),
  due_day     int check (due_day between 1 and 31),
  destination text not null default 'banco' check (destination in ('caixa','banco')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.recurring_expenses add column if not exists start_month text; -- 'YYYY-MM'
alter table public.recurring_expenses add column if not exists end_month   text; -- 'YYYY-MM' ou NULL

create table if not exists public.cash_entries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade default auth.uid(),
  entry_date      date not null,
  doc             text,
  description     text not null,
  type            text not null check (type in ('entrada','saida')),
  amount          numeric(12,2) not null check (amount >= 0),
  destination     text not null check (destination in ('caixa','banco')),
  created_at      timestamptz not null default now()
);
-- Colunas acrescentadas ao longo das fases (IVA, catálogo, recorrentes, qtd, privado)
alter table public.cash_entries add column if not exists category            text;
alter table public.cash_entries add column if not exists catalog_item_id     uuid references public.catalog_items (id) on delete set null;
alter table public.cash_entries add column if not exists recurring_expense_id uuid references public.recurring_expenses (id) on delete set null;
alter table public.cash_entries add column if not exists period              text;   -- 'YYYY-MM'
alter table public.cash_entries add column if not exists vat_rate            numeric(5,2);
alter table public.cash_entries add column if not exists vat_amount          numeric(12,2);
alter table public.cash_entries add column if not exists quantity            numeric(12,2) default 1;
alter table public.cash_entries add column if not exists private             boolean not null default false;

create table if not exists public.clients (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name       text not null,
  country    text not null,
  sector     text,
  service    text not null default 'acc' check (service in ('esg','acc','both')),
  status     text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

create table if not exists public.fiscal_obligations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade default auth.uid(),
  obligation_type text not null,
  client          text,
  country         text not null,
  deadline        date not null,
  status          text not null default 'pending' check (status in ('pending','done')),
  created_at      timestamptz not null default now()
);
alter table public.fiscal_obligations add column if not exists source text not null default 'manual';
alter table public.fiscal_obligations add column if not exists code   text;

create table if not exists public.company_settings (
  user_id                 uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  company_name            text,
  country                 text not null default 'PT' check (country in ('PT','DE')),
  currency                text not null default 'EUR',
  vat_regime              text not null default 'normal' check (vat_regime in ('exempt','normal')),
  vat_default_rate        numeric(5,2) not null default 23,
  ir_reserve_pct          numeric(5,2) not null default 25 check (ir_reserve_pct >= 0 and ir_reserve_pct <= 100),
  ss_regime               text,
  fiscal_year_start_month int not null default 1 check (fiscal_year_start_month between 1 and 12),
  updated_at              timestamptz not null default now()
);
alter table public.company_settings add column if not exists de_krankenv   numeric(12,2) default 0;
alter table public.company_settings add column if not exists de_rentenv    numeric(12,2) default 0;
alter table public.company_settings add column if not exists de_sonstige   numeric(12,2) default 0;
alter table public.company_settings add column if not exists de_famv_limit numeric(12,2) default 565;

create table if not exists public.esg_diagnostics (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  reference_year integer not null default 2023,
  answers        jsonb not null default '{}'::jsonb,
  status         text not null default 'draft',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id)
);

create table if not exists public.monthly_plans (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  items            jsonb not null default '[]'::jsonb,
  monthly_fixed    numeric(12,2) not null default 0,
  productive_hours numeric(12,2) not null default 0,
  reserve_basis    text not null default 'gewinn',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. PAÍS LIVRE (remove CHECK fixo pt/de em clientes e obrigações + normaliza)
-- ─────────────────────────────────────────────────────────────────────────
alter table public.clients            drop constraint if exists clients_country_check;
alter table public.clients            alter column country drop default;
update public.clients set country = upper(country) where country is not null;
alter table public.fiscal_obligations drop constraint if exists fiscal_obligations_country_check;
alter table public.fiscal_obligations alter column country drop default;
update public.fiscal_obligations set country = upper(country) where country is not null;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. ÍNDICES
-- ─────────────────────────────────────────────────────────────────────────
create index if not exists idx_cash_entries_user on public.cash_entries (user_id, entry_date);
create index if not exists idx_clients_user       on public.clients (user_id);
create index if not exists idx_obligations_user   on public.fiscal_obligations (user_id, deadline);
create index if not exists idx_catalog_user       on public.catalog_items (user_id);
create index if not exists idx_recurring_user     on public.recurring_expenses (user_id);
create unique index if not exists idx_obligations_user_code
  on public.fiscal_obligations (user_id, code) where code is not null;

-- ─────────────────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY — cada utilizador só vê/altera as SUAS linhas
-- ─────────────────────────────────────────────────────────────────────────
alter table public.profiles           enable row level security;
alter table public.catalog_items      enable row level security;
alter table public.cash_entries       enable row level security;
alter table public.clients            enable row level security;
alter table public.fiscal_obligations enable row level security;
alter table public.recurring_expenses enable row level security;
alter table public.company_settings   enable row level security;
alter table public.esg_diagnostics    enable row level security;
alter table public.monthly_plans      enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "own catalog" on public.catalog_items;
create policy "own catalog" on public.catalog_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own cash_entries" on public.cash_entries;
create policy "own cash_entries" on public.cash_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own clients" on public.clients;
create policy "own clients" on public.clients for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own obligations" on public.fiscal_obligations;
create policy "own obligations" on public.fiscal_obligations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own recurring_expenses" on public.recurring_expenses;
create policy "own recurring_expenses" on public.recurring_expenses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own company_settings" on public.company_settings;
create policy "own company_settings" on public.company_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "esg_diag_select_own" on public.esg_diagnostics;
create policy "esg_diag_select_own" on public.esg_diagnostics for select using (auth.uid() = user_id);
drop policy if exists "esg_diag_insert_own" on public.esg_diagnostics;
create policy "esg_diag_insert_own" on public.esg_diagnostics for insert with check (auth.uid() = user_id);
drop policy if exists "esg_diag_update_own" on public.esg_diagnostics;
create policy "esg_diag_update_own" on public.esg_diagnostics for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "esg_diag_delete_own" on public.esg_diagnostics;
create policy "esg_diag_delete_own" on public.esg_diagnostics for delete using (auth.uid() = user_id);

drop policy if exists "plans_select_own" on public.monthly_plans;
create policy "plans_select_own" on public.monthly_plans for select using (auth.uid() = user_id);
drop policy if exists "plans_insert_own" on public.monthly_plans;
create policy "plans_insert_own" on public.monthly_plans for insert with check (auth.uid() = user_id);
drop policy if exists "plans_update_own" on public.monthly_plans;
create policy "plans_update_own" on public.monthly_plans for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "plans_delete_own" on public.monthly_plans;
create policy "plans_delete_own" on public.monthly_plans for delete using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 6. CRIAÇÃO AUTOMÁTICA DE PERFIL + backfill dos utilizadores existentes
-- ─────────────────────────────────────────────────────────────────────────
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

insert into public.profiles (id, role)
select id, 'user' from auth.users on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────
-- 7. LEITURA DE ADMIN ("Ver como", só leitura)
-- Admin pode LER todas as linhas; sem política de escrita (RLS bloqueia escrita).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
grant execute on function public.is_admin() to authenticated, anon;

do $$
declare tbl text;
begin
  foreach tbl in array array[
    'cash_entries','catalog_items','recurring_expenses','company_settings',
    'monthly_plans','fiscal_obligations','esg_diagnostics','clients'
  ]
  loop
    if to_regclass('public.' || tbl) is not null
       and not exists (select 1 from pg_policies where tablename = tbl and policyname = 'admin_read_all') then
      execute format('create policy admin_read_all on public.%I for select using (public.is_admin())', tbl);
    end if;
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- 8. REPOSITÓRIO DE CONSULTORIAS (notas/recomendações/relatórios por cliente)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.consulting_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  author_id  uuid references auth.users (id) on delete set null,
  kind       text not null default 'note' check (kind in ('note','recommendation','report')),
  title      text not null,
  body       text,
  link_url   text,
  created_at timestamptz not null default now()
);
create index if not exists idx_consulting_user on public.consulting_notes (user_id, created_at desc);
alter table public.consulting_notes enable row level security;
drop policy if exists "notes_read_own" on public.consulting_notes;
create policy "notes_read_own" on public.consulting_notes for select using (auth.uid() = user_id);
drop policy if exists "notes_admin_all" on public.consulting_notes;
create policy "notes_admin_all" on public.consulting_notes for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- FIM. Para tornar alguém admin (depois de criar o login):
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'admin@exemplo.com');
-- ============================================================================
