-- ============================================================================
-- LC OFFICE — SETUP DE UM PROJETO DEV NOVO (06/10/2026)
-- = SETUP_COMPLETO.sql (schema + migrações 002–031) + migrações 032 a 039, pela ordem.
-- Para uma base NOVA e vazia. Supabase (projeto DEV) → SQL Editor → New query → colar tudo → Run.
-- Não serve para produção: lá as migrações já estão aplicadas uma a uma.
-- ============================================================================

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
  role       text not null default 'user' check (role in ('user','admin','comercial','marketing')),
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists platform text not null default 'accounting';
-- Recria o constraint para aceitar também 'both' (acesso às duas plataformas).
alter table public.profiles drop constraint if exists profiles_platform_chk;
alter table public.profiles add constraint profiles_platform_chk
  check (platform in ('accounting','accounting_lite','esg','both'));

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

-- Verificação de papel reutilizável (papéis de equipa: comercial, marketing)
create or replace function public.has_role(roles text[])
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = any(roles));
$$;
grant execute on function public.has_role(text[]) to authenticated, anon;

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
  kind       text not null default 'note' check (kind in ('note','meeting','recommendation','report')),
  title      text not null,
  body       text,
  link_url   text,
  created_at timestamptz not null default now()
);
-- Garante que bases já criadas com o constraint antigo aceitam o tipo 'meeting'.
alter table public.consulting_notes drop constraint if exists consulting_notes_kind_check;
alter table public.consulting_notes add constraint consulting_notes_kind_check
  check (kind in ('note','meeting','recommendation','report'));
create index if not exists idx_consulting_user on public.consulting_notes (user_id, created_at desc);
alter table public.consulting_notes enable row level security;
drop policy if exists "notes_read_own" on public.consulting_notes;
create policy "notes_read_own" on public.consulting_notes for select using (auth.uid() = user_id);
drop policy if exists "notes_admin_all" on public.consulting_notes;
create policy "notes_admin_all" on public.consulting_notes for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 9. DOCUMENTOS DOS CLIENTES (Storage, bucket privado 'client-docs')
-- ─────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('client-docs', 'client-docs', false)
on conflict (id) do nothing;

drop policy if exists "client_docs_admin_all" on storage.objects;
create policy "client_docs_admin_all" on storage.objects
  for all using (bucket_id = 'client-docs' and public.is_admin())
  with check (bucket_id = 'client-docs' and public.is_admin());

drop policy if exists "client_docs_read_own" on storage.objects;
create policy "client_docs_read_own" on storage.objects
  for select using (bucket_id = 'client-docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- ─────────────────────────────────────────────────────────────────────────
-- 10. CRM DE PROSPEÇÃO (Gestão, apenas admins)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.crm_leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  company     text,
  contact     text,
  notes       text,
  stage       text not null default 'mapeado' check (stage in
    ('mapeado','abordagem','conectado','reuniao','proposta','fechado','perdido','futuro')),
  attempts    int not null default 0,
  lost_reason text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_crm_stage on public.crm_leads (stage, updated_at desc);
alter table public.crm_leads enable row level security;
drop policy if exists "crm_admin_all" on public.crm_leads;
drop policy if exists "crm_admin_all" on public.crm_leads;
create policy "crm_staff_all" on public.crm_leads
  for all using (public.has_role(array['admin','comercial']))
  with check (public.has_role(array['admin','comercial']));

-- ─────────────────────────────────────────────────────────────────────────
-- 11. FINANCEIRO DA GESTÃO (contratos + recebimentos dos clientes da Lúcia)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.client_billing (
  id          uuid primary key default gen_random_uuid(),
  client_name text not null,
  user_id     uuid references auth.users (id) on delete set null,
  service     text,
  amount      numeric(12,2) not null default 0,
  periodicity text not null default 'monthly' check (periodicity in ('monthly','quarterly','annual','once')),
  start_month text,
  active      boolean not null default true,
  notes       text,
  created_at  timestamptz not null default now()
);
create table if not exists public.billing_payments (
  id         uuid primary key default gen_random_uuid(),
  billing_id uuid not null references public.client_billing (id) on delete cascade,
  period     text not null,
  amount     numeric(12,2) not null default 0,
  paid_at    date not null default current_date,
  unique (billing_id, period)
);
alter table public.client_billing   enable row level security;
alter table public.billing_payments enable row level security;
drop policy if exists "billing_admin_all" on public.client_billing;
create policy "billing_admin_all" on public.client_billing
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "payments_admin_all" on public.billing_payments;
create policy "payments_admin_all" on public.billing_payments
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 12. MATERIALIDADE ESG (dupla materialidade simplificada + metas)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.esg_materiality (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  topics     jsonb not null default '{}'::jsonb,
  threshold  numeric(3,1) not null default 3.5,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id)
);
alter table public.esg_materiality enable row level security;
drop policy if exists "materiality_own" on public.esg_materiality;
create policy "materiality_own" on public.esg_materiality
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "admin_read_all" on public.esg_materiality;
create policy "admin_read_all" on public.esg_materiality
  for select using (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 13. PLANO ESG — diagnóstico multi-ano, projetos e relatórios (migração 024)
-- ─────────────────────────────────────────────────────────────────────────
alter table public.esg_diagnostics drop constraint if exists esg_diagnostics_user_id_key;
alter table public.esg_diagnostics drop constraint if exists esg_diagnostics_user_year_key;
alter table public.esg_diagnostics add constraint esg_diagnostics_user_year_key
  unique (user_id, reference_year);

create table if not exists public.esg_projects (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  topic_key       text,
  name            text not null,
  description     text,
  status          text not null default 'planned' check (status in ('planned','active','done')),
  start_month     text,
  progress        int not null default 0 check (progress between 0 and 100),
  investment      numeric(12,2),
  annual_saving   numeric(12,2),
  expected_impact text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.esg_projects enable row level security;
drop policy if exists "projects_own" on public.esg_projects;
create policy "projects_own" on public.esg_projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "admin_read_all" on public.esg_projects;
create policy "admin_read_all" on public.esg_projects
  for select using (public.is_admin());
create index if not exists idx_esg_projects_user on public.esg_projects (user_id);

create table if not exists public.esg_reports (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  reference_year integer not null,
  sections       jsonb not null default '{}'::jsonb,
  updated_at     timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  unique (user_id, reference_year)
);
alter table public.esg_reports enable row level security;
drop policy if exists "reports_own" on public.esg_reports;
create policy "reports_own" on public.esg_reports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "admin_read_all" on public.esg_reports;
create policy "admin_read_all" on public.esg_reports
  for select using (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 14. CRM — origem, temperatura, follow-up, cliente ideal (migração 025)
-- ─────────────────────────────────────────────────────────────────────────
alter table public.crm_leads add column if not exists source          text;
alter table public.crm_leads add column if not exists temperature     text;
alter table public.crm_leads add column if not exists last_contact_at timestamptz;
alter table public.crm_leads add column if not exists sector          text;
alter table public.crm_leads add column if not exists revenue_range   text;
alter table public.crm_leads add column if not exists pain            text;
alter table public.crm_leads add column if not exists deal_value      numeric(12,2);
alter table public.crm_leads add column if not exists converted_billing_id uuid
  references public.client_billing (id) on delete set null;

alter table public.crm_leads drop constraint if exists crm_leads_temperature_chk;
alter table public.crm_leads add constraint crm_leads_temperature_chk
  check (temperature is null or temperature in ('quente','morno','frio'));
alter table public.crm_leads drop constraint if exists crm_leads_source_chk;
alter table public.crm_leads add constraint crm_leads_source_chk
  check (source is null or source in ('instagram','formulario','site','indicacao','evento','linkedin','manual'));

update public.crm_leads set last_contact_at = updated_at where last_contact_at is null;
create index if not exists idx_crm_followup on public.crm_leads (last_contact_at);

-- ─────────────────────────────────────────────────────────────────────────
-- 15. PALAVRA-PASSE PRÉ-DEFINIDA (migração 027)
-- ─────────────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

-- Privilégio mínimo: só limpa esta coluna e só na linha do próprio utilizador
-- (uma política de UPDATE genérica deixaria o utilizador mudar o seu `role`).
create or replace function public.clear_must_change_password()
returns void language sql security definer set search_path = public as $$
  update public.profiles set must_change_password = false where id = auth.uid();
$$;
grant execute on function public.clear_must_change_password() to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 16. MÓDULO DE CONSULTORIA (migração 029)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.consultorias (
  id         uuid primary key default gen_random_uuid(),
  tipo       text not null default 'implementacao' check (tipo in ('gratuita', 'implementacao')),
  nome       text not null,
  empresa    text,
  email      text,
  telefone   text,
  setor      text,
  lead_id    uuid references public.crm_leads (id) on delete set null,
  user_id    uuid references auth.users (id) on delete set null,
  bloco      int  not null default 1 check (bloco between 1 and 4),
  status     text not null default 'ativa' check (status in ('ativa', 'concluida', 'pausada')),
  respostas  jsonb not null default '{}'::jsonb,
  swot       jsonb not null default '{}'::jsonb,
  tows       jsonb not null default '{}'::jsonb,
  numeros    jsonb not null default '{}'::jsonb,
  recursos   jsonb not null default '[]'::jsonb,
  relatorio  jsonb not null default '{}'::jsonb,
  notas      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.consultorias enable row level security;
drop policy if exists "consultorias_admin" on public.consultorias;
create policy "consultorias_admin" on public.consultorias
  for all using (public.is_admin()) with check (public.is_admin());
create index if not exists idx_consultorias_status on public.consultorias (status, updated_at desc);

-- ============================================================================

-- ============================================================================
-- 17. CONCILIAÇÃO CAIXA/BANCO (migração 030)
-- ============================================================================
-- ── Cada ficheiro importado ────────────────────────────────────────────────
create table if not exists public.bank_imports (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade default auth.uid(),
  filename     text not null,
  period_start date,
  period_end   date,
  total_rows   int  not null default 0,
  new_rows     int  not null default 0,   -- quantas eram novas (o resto era repetido)
  created_at   timestamptz not null default now()
);

-- ── Cada movimento do extrato ──────────────────────────────────────────────
create table if not exists public.bank_transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade default auth.uid(),
  import_id     uuid references public.bank_imports (id) on delete cascade,
  tx_date       date not null,
  description   text not null,
  -- Guardado sempre positivo; o sentido vive em `type`, como no Livro de Caixa
  amount        numeric(12,2) not null check (amount >= 0),
  type          text not null check (type in ('entrada', 'saida')),
  balance       numeric(12,2),
  -- Identidade do movimento (data + valor + tipo + descrição normalizada).
  -- É o que impede duplicados numa reimportação.
  fingerprint   text not null,
  status        text not null default 'pendente'
                check (status in ('pendente', 'conciliado', 'ignorado')),
  -- O lançamento do Livro de Caixa a que este movimento corresponde
  cash_entry_id uuid references public.cash_entries (id) on delete set null,
  matched_at    timestamptz,
  raw           jsonb not null default '{}'::jsonb,   -- a linha original do ficheiro
  created_at    timestamptz not null default now()
);

-- ── RLS: cada um vê o seu, como no Livro de Caixa ──────────────────────────
alter table public.bank_imports      enable row level security;
alter table public.bank_transactions enable row level security;

drop policy if exists "own bank_imports" on public.bank_imports;
create policy "own bank_imports" on public.bank_imports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own bank_transactions" on public.bank_transactions;
create policy "own bank_transactions" on public.bank_transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Índices ────────────────────────────────────────────────────────────────
-- O único que é regra de negócio e não otimização: o mesmo movimento não entra
-- duas vezes para o mesmo utilizador.
create unique index if not exists uq_bank_tx_fingerprint
  on public.bank_transactions (user_id, fingerprint);

create index if not exists idx_bank_tx_pendentes
  on public.bank_transactions (user_id, status, tx_date desc);
create index if not exists idx_bank_tx_entry
  on public.bank_transactions (cash_entry_id) where cash_entry_id is not null;
create index if not exists idx_bank_imports_user
  on public.bank_imports (user_id, created_at desc);

-- Um lançamento do Livro de Caixa não pode estar conciliado com dois
-- movimentos ao mesmo tempo.
create unique index if not exists uq_bank_tx_one_entry
  on public.bank_transactions (cash_entry_id) where cash_entry_id is not null;


-- ============================================================================
-- 18. BLOCO 0 · ENQUADRAMENTO DA CONSULTORIA (migração 031)
-- ============================================================================
alter table public.consultorias
  add column if not exists enquadramento jsonb not null default '{}'::jsonb;

-- As palavras do cliente, guardadas à parte das `notas` — que são as
-- observações internas da consultora e não se devem misturar.
alter table public.consultorias
  add column if not exists notas_cliente text;

comment on column public.consultorias.enquadramento is
  'Bloco 0: pais, iniciou, data_inicio, regime, iva, faturacao, contabilista, dificuldade, dificuldade_outra';
comment on column public.consultorias.notas_cliente is
  'Texto livre escrito pelo próprio cliente (não confundir com notas, que são internas)';

-- Procurar consultorias por país é a consulta natural quando as regras fiscais
-- diferem entre Portugal e Alemanha.
create index if not exists idx_consultorias_pais
  on public.consultorias ((enquadramento ->> 'pais'));

-- FIM. Para tornar alguém admin (depois de criar o login):
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'admin@exemplo.com');
-- ============================================================================


-- ############################################################################
-- migration_032.sql
-- ############################################################################
-- ============================================================================
-- Migração 032 — Formulário de diagnóstico público, ponte consultoria → CRM
-- e envio de documentos pelo cliente (arrumados por mês).
--
-- Reunião de 27/08: o formulário sai do JotForm e passa a servir de filtro
-- antes de o lead entrar no CRM; os contactos das consultorias passam a poder
-- ir para o CRM com um clique; o envio de documentos vive na área da Empresa.
--
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Submissões do formulário de diagnóstico (página pública /diagnostico)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.diagnostico_submissoes (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  email         text,
  telefone      text,
  empresa       text,
  -- Respostas do enquadramento (as mesmas chaves do Bloco 0 da consultoria,
  -- por isso o que for respondido aqui entra na ficha sem tradução nenhuma)
  respostas     jsonb not null default '{}'::jsonb,
  -- Veredito da triagem, calculado no momento do envio
  qualificado   boolean not null default false,
  motivo        text,
  -- Estado do tratamento pela Lúcia
  estado        text not null default 'novo'
                check (estado in ('novo','no_crm','descartado')),
  crm_lead_id   uuid references public.crm_leads (id) on delete set null,
  consultoria_id uuid references public.consultorias (id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists idx_diag_estado on public.diagnostico_submissoes (estado, created_at desc);

alter table public.diagnostico_submissoes enable row level security;

-- Quem responde ao formulário não tem conta: escreve como 'anon'.
-- Só INSERT — nunca leitura, nunca alteração. Assim o formulário público não
-- abre janela nenhuma para os dados que já lá estão.
drop policy if exists "diag_public_insert" on public.diagnostico_submissoes;
create policy "diag_public_insert" on public.diagnostico_submissoes
  for insert to anon, authenticated
  with check (true);

-- A Lúcia (e o comercial) leem e tratam.
drop policy if exists "diag_staff_read" on public.diagnostico_submissoes;
create policy "diag_staff_read" on public.diagnostico_submissoes
  for select using (public.has_role(array['admin','comercial']));

drop policy if exists "diag_staff_update" on public.diagnostico_submissoes;
create policy "diag_staff_update" on public.diagnostico_submissoes
  for update using (public.has_role(array['admin','comercial']))
  with check (public.has_role(array['admin','comercial']));

drop policy if exists "diag_admin_delete" on public.diagnostico_submissoes;
create policy "diag_admin_delete" on public.diagnostico_submissoes
  for delete using (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Consultoria → CRM
-- ─────────────────────────────────────────────────────────────────────────
-- Guarda o lead criado a partir do contacto da consultoria, para o botão saber
-- que já foi adicionado (e não duplicar).
alter table public.consultorias add column if not exists crm_lead_id uuid
  references public.crm_leads (id) on delete set null;

-- 'consultoria' e 'diagnostico' passam a ser origens válidas de um lead.
alter table public.crm_leads drop constraint if exists crm_leads_source_chk;
alter table public.crm_leads add constraint crm_leads_source_chk
  check (source is null or source in
    ('instagram','formulario','site','indicacao','evento','linkedin','manual',
     'consultoria','diagnostico'));

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Envio de documentos pelo cliente (bucket client-docs)
-- ─────────────────────────────────────────────────────────────────────────
-- Até aqui o cliente só lia a sua pasta (migração 019). Passa a poder enviar
-- para dentro dela — e só para dentro dela: o 1.º segmento do caminho tem de
-- ser o seu próprio user_id. Continua sem poder apagar nem substituir, para
-- não haver forma de fazer desaparecer um documento já entregue.
drop policy if exists "client_docs_write_own" on storage.objects;
create policy "client_docs_write_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'client-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ############################################################################
-- migration_033.sql
-- ############################################################################
-- ============================================================================
-- Migração 033 — A plataforma como canal de comunicação com o cliente.
--
-- Reunião de 10/09: "todos os clientes terão acesso básico à plataforma como
-- canal de comunicação e onboarding (contrato, documentos, notificações)".
-- O caso concreto que apressou isto: um cliente à espera de saber que a
-- declaração de IVA foi entregue.
--
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Avisos da Lúcia para um cliente
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.client_notices (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  titulo     text not null,
  corpo      text,
  -- 'info' (cinzento), 'ok' (verde, algo tratado), 'acao' (âmbar, precisa dele)
  tom        text not null default 'info' check (tom in ('info', 'ok', 'acao')),
  lido_em    timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

create index if not exists idx_notices_user on public.client_notices (user_id, created_at desc);

alter table public.client_notices enable row level security;

-- O cliente lê os seus avisos e pode marcá-los como lidos — mais nada.
drop policy if exists "notices_read_own" on public.client_notices;
create policy "notices_read_own" on public.client_notices
  for select using (auth.uid() = user_id);

drop policy if exists "notices_mark_read" on public.client_notices;
create policy "notices_mark_read" on public.client_notices
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- A Lúcia escreve, edita e apaga.
drop policy if exists "notices_admin_all" on public.client_notices;
create policy "notices_admin_all" on public.client_notices
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 1b. Serviço contratado, para o reporting por serviço e por país
-- ─────────────────────────────────────────────────────────────────────────
-- O país já vivia aqui, mas só o próprio cliente o podia escrever — e muitos
-- não chegam a preencher. A Lúcia passa a poder registar os dois no momento em
-- que cria a conta, que é quando ela sabe o que vendeu.
alter table public.company_settings add column if not exists service text;

drop policy if exists "company_settings_admin_write" on public.company_settings;
create policy "company_settings_admin_write" on public.company_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 2. O cliente passa a ver o seu próprio contrato
-- ─────────────────────────────────────────────────────────────────────────
-- Até aqui client_billing era só do admin. Para o cliente saber qual é o
-- próximo pagamento, tem de poder LER a sua linha — e só ler.
drop policy if exists "billing_read_own" on public.client_billing;
create policy "billing_read_own" on public.client_billing
  for select using (auth.uid() = user_id);

-- E os recebimentos já confirmados do seu contrato, para saber o que está pago.
drop policy if exists "payments_read_own" on public.billing_payments;
create policy "payments_read_own" on public.billing_payments
  for select using (
    exists (
      select 1 from public.client_billing b
      where b.id = billing_payments.billing_id and b.user_id = auth.uid()
    )
  );


-- ############################################################################
-- migration_034.sql
-- ############################################################################
-- ============================================================================
-- Migração 034 — Guardar o ficheiro do extrato importado.
--
-- Pedido de 27/08: a importação lê o CSV/Excel, cria os movimentos e deita o
-- ficheiro fora. Passa a ficar arquivado, para se poder voltar ao original
-- quando uma conciliação levantar dúvidas.
--
-- O ficheiro vai para o bucket 'client-docs', na pasta do próprio cliente
-- ({user_id}/extratos/), que é a mesma que já é apagada por inteiro quando o
-- cliente é eliminado — por isso não abre nenhuma ponta solta de RGPD.
--
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.bank_imports add column if not exists file_path text;


-- ############################################################################
-- migration_035.sql
-- ############################################################################
-- ============================================================================
-- Migração 035 — O contrato do cliente, anexado e visível para ele.
--
-- Pedido de 23/07 ("contratos ficam aqui, qualquer coisa tem acesso") e peça
-- que faltava do acesso básico definido a 10/09: "contrato, documentos e
-- notificações". As mensagens e os documentos já existiam; o contrato não.
--
-- O ficheiro vai para o bucket 'client-docs', dentro da pasta do próprio
-- cliente ({user_id}/contratos/) quando o contrato está ligado a uma conta —
-- assim o cliente lê o seu (política de 019) e o ficheiro desaparece com ele
-- na eliminação. Contratos sem conta associada ficam em 'contratos/{id}/',
-- onde só a Lúcia chega.
--
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.client_billing add column if not exists contract_path text;
alter table public.client_billing add column if not exists contract_name text;


-- ############################################################################
-- migration_036.sql
-- ############################################################################
-- ============================================================================
-- Migração 036 — ESG como consultoria (reunião de 18/09)
--
-- A Lúcia passa a preencher a ESG ela própria, como ferramenta de apoio às
-- consultorias dela; o cliente não entra para responder. Até aqui o módulo
-- estava construído como a Contabilidade (os dados pertencem ao utilizador e
-- é ele que preenche). Passa a comportar-se como a Consultoria: um CASO é o
-- dono dos dados, o contacto fica registado no próprio caso e a ligação a uma
-- conta na plataforma é opcional.
--
-- As quatro tabelas ESG que já existem NÃO são substituídas: ganham uma coluna
-- consultoria_id. A coluna user_id fica (fica a null nos casos sem conta) —
-- sai numa migração posterior, quando o modelo novo tiver dado a volta.
--
-- O backfill cria um caso por cada user_id que já tem dados ESG e liga-lhe as
-- linhas. Se falhar a meio, ninguém perde nada: as colunas antigas continuam
-- intactas e a migração pode correr outra vez (é idempotente).
--
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

-- ── 1. O caso ────────────────────────────────────────────────────────────────
create table if not exists public.esg_consultorias (
  id         uuid primary key default gen_random_uuid(),

  -- Contacto (não precisa de conta na plataforma), como em `consultorias`
  nome       text not null,
  empresa    text,
  email      text,
  telefone   text,
  setor      text,

  -- Ligações opcionais
  lead_id    uuid references public.crm_leads (id) on delete set null,  -- de onde veio
  user_id    uuid references auth.users (id) on delete set null,        -- se tiver conta

  -- Estado. A FASE não se guarda: é calculada a partir do que está preenchido
  -- (esgPercurso.js), como o Percurso já fazia — assim nunca mente.
  status     text not null default 'ativa' check (status in ('ativa', 'concluida', 'pausada')),

  -- Se o cliente com conta pode ver o percurso e o relatório (só leitura).
  visivel_cliente boolean not null default true,
  notas      text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.esg_consultorias enable row level security;

-- Só a Lúcia escreve. O cliente com conta lê o seu caso (para o Percurso e o
-- Relatório em só leitura).
drop policy if exists "esg_consultorias_admin" on public.esg_consultorias;
create policy "esg_consultorias_admin" on public.esg_consultorias
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "esg_consultorias_cliente_le" on public.esg_consultorias;
create policy "esg_consultorias_cliente_le" on public.esg_consultorias
  for select using (user_id = auth.uid() and visivel_cliente);

create index if not exists idx_esg_consultorias_status on public.esg_consultorias (status, updated_at desc);
create index if not exists idx_esg_consultorias_user on public.esg_consultorias (user_id);

-- ── 2. As quatro tabelas passam a poder pertencer a um caso ─────────────────
alter table public.esg_materiality  add column if not exists consultoria_id uuid references public.esg_consultorias (id) on delete cascade;
alter table public.esg_diagnostics  add column if not exists consultoria_id uuid references public.esg_consultorias (id) on delete cascade;
alter table public.esg_projects     add column if not exists consultoria_id uuid references public.esg_consultorias (id) on delete cascade;
alter table public.esg_reports      add column if not exists consultoria_id uuid references public.esg_consultorias (id) on delete cascade;

-- Casos sem conta → user_id a null. Os `unique (user_id…)` antigos continuam
-- válidos (nulls são distintos).
alter table public.esg_materiality  alter column user_id drop not null;
alter table public.esg_diagnostics  alter column user_id drop not null;
alter table public.esg_projects     alter column user_id drop not null;
alter table public.esg_reports      alter column user_id drop not null;

-- É por aqui que os upserts das páginas passam a resolver conflitos.
create unique index if not exists uq_esg_materiality_caso on public.esg_materiality (consultoria_id);
create unique index if not exists uq_esg_diagnostics_caso_ano on public.esg_diagnostics (consultoria_id, reference_year);
create unique index if not exists uq_esg_reports_caso_ano on public.esg_reports (consultoria_id, reference_year);
create index if not exists idx_esg_projects_caso on public.esg_projects (consultoria_id);

-- ── 3. Backfill: um caso por cada utilizador que já tem dados ESG ───────────
-- O nome vem do perfil (display_name) ou do email; a empresa, das definições.
-- Só cria para quem ainda não tem caso — correr duas vezes não duplica.
insert into public.esg_consultorias (nome, empresa, email, user_id)
select
  coalesce(nullif(u.raw_user_meta_data ->> 'display_name', ''), split_part(u.email, '@', 1)),
  cs.company_name,
  u.email,
  u.id
from auth.users u
left join public.company_settings cs on cs.user_id = u.id
where u.id in (
  select user_id from public.esg_materiality  where user_id is not null union
  select user_id from public.esg_diagnostics  where user_id is not null union
  select user_id from public.esg_projects     where user_id is not null union
  select user_id from public.esg_reports      where user_id is not null
)
and not exists (select 1 from public.esg_consultorias c where c.user_id = u.id);

update public.esg_materiality m set consultoria_id = c.id
  from public.esg_consultorias c where c.user_id = m.user_id and m.consultoria_id is null;
update public.esg_diagnostics d set consultoria_id = c.id
  from public.esg_consultorias c where c.user_id = d.user_id and d.consultoria_id is null;
update public.esg_projects p set consultoria_id = c.id
  from public.esg_consultorias c where c.user_id = p.user_id and p.consultoria_id is null;
update public.esg_reports r set consultoria_id = c.id
  from public.esg_consultorias c where c.user_id = r.user_id and r.consultoria_id is null;

-- ── 4. Políticas: a Lúcia escreve em qualquer caso; o cliente lê pelo caso ──
-- As políticas `*_own` antigas ficam (o cliente ligado continua a ler pelo
-- user_id); estas acrescentam o que faltava.
do $$
declare tbl text;
begin
  foreach tbl in array array['esg_materiality', 'esg_diagnostics', 'esg_projects', 'esg_reports'] loop
    execute format('drop policy if exists esg_admin_all on public.%I', tbl);
    execute format('create policy esg_admin_all on public.%I for all using (public.is_admin()) with check (public.is_admin())', tbl);
    execute format('drop policy if exists esg_cliente_le_caso on public.%I', tbl);
    execute format($p$create policy esg_cliente_le_caso on public.%I for select
      using (consultoria_id in (select id from public.esg_consultorias where user_id = auth.uid() and visivel_cliente))$p$, tbl);
  end loop;
end $$;

-- ── 5. Verificação (aparece no painel de resultados) ────────────────────────
-- Cada linha com dados deve ter caso. Se a segunda coluna não for 0, o backfill
-- ficou incompleto — não é preciso desfazer nada, basta correr outra vez.
select 'esg_materiality' as tabela, count(*) filter (where consultoria_id is null) as sem_caso, count(*) as total from public.esg_materiality
union all
select 'esg_diagnostics', count(*) filter (where consultoria_id is null), count(*) from public.esg_diagnostics
union all
select 'esg_projects', count(*) filter (where consultoria_id is null), count(*) from public.esg_projects
union all
select 'esg_reports', count(*) filter (where consultoria_id is null), count(*) from public.esg_reports
union all
select 'esg_consultorias (casos criados)', 0, count(*) from public.esg_consultorias;


-- ############################################################################
-- migration_037.sql
-- ############################################################################
-- ============================================================================
-- Migração 037 — Portal de gestão de clientes (a v2 passa a oficial)
--
-- A v2 (documento "Portal gestão de clientes", 22/09) deixa de viver com dados
-- de demonstração no browser e passa a ler e gravar aqui. Tudo o que esta
-- migração faz é ADITIVO: tabelas novas, colunas novas, políticas novas. Nada
-- é apagado e as telas do cliente continuam a funcionar exatamente como hoje —
-- por isso pode correr com a plataforma atual no ar, antes de a v2 ser publicada.
--
-- O que muda:
--  · clientes              — a entidade "cliente" da Gestão, com ou sem conta
--  · fiscal_obligations    — ganha cliente, período, os 8 estados, valor,
--                            comprovativo e checklist (o `status` antigo é
--                            mantido em sincronia para as telas do cliente)
--  · tarefas, documentos_cliente, mensagens_cliente, relatorios_trimestrais,
--    notas_cliente, horas_cliente — tabelas novas
--  · client_notices        — anexos (as mensagens da equipa ao cliente)
--  · client_billing        — ligação ao cliente (a avença vem daqui)
--  · a equipa (admin, comercial, marketing) passa a poder trabalhar nestas
--    tabelas e na pasta de documentos
--
-- É idempotente: correr duas vezes não duplica nada.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

-- Quem é "equipa" (a colaboradora entra com um papel de equipa)
create or replace function public.is_equipa()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'comercial', 'marketing'));
$$;
grant execute on function public.is_equipa() to authenticated, anon;

-- ── 1. Clientes ─────────────────────────────────────────────────────────────
create table if not exists public.clientes (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  pessoa          text,
  email           text,
  telefone        text,
  pais            text not null default 'PT',
  forma           text,
  setor           text,
  servicos        text[] not null default array['contabilidade'],
  periodicidade   text not null default 'trimestral' check (periodicidade in ('mensal', 'trimestral', 'anual')),
  regime          text,
  trabalhadores   boolean not null default false,
  software        text,
  estado          text not null default 'ativo' check (estado in ('ativo', 'onboarding', 'pausado', 'inativo')),
  responsavel     text,
  horas_incluidas numeric(6,2) not null default 0,
  cliente_desde   date,
  notas           text,
  user_id         uuid references auth.users (id) on delete set null,   -- se tiver conta
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.clientes enable row level security;
drop policy if exists "clientes_equipa" on public.clientes;
create policy "clientes_equipa" on public.clientes for all using (public.is_equipa()) with check (public.is_equipa());
create index if not exists idx_clientes_user on public.clientes (user_id);

-- ── 2. Obrigações fiscais: o que o documento pede ───────────────────────────
alter table public.fiscal_obligations add column if not exists cliente_id        uuid references public.clientes (id) on delete cascade;
alter table public.fiscal_obligations add column if not exists periodo           text;
alter table public.fiscal_obligations add column if not exists estado            text;
alter table public.fiscal_obligations add column if not exists valor_tipo        text;
alter table public.fiscal_obligations add column if not exists valor             numeric(12,2);
alter table public.fiscal_obligations add column if not exists comprovativo_nome text;
alter table public.fiscal_obligations add column if not exists comprovativo_path text;
alter table public.fiscal_obligations add column if not exists comprovativo_data date;
alter table public.fiscal_obligations add column if not exists checklist         jsonb not null default '{}'::jsonb;
alter table public.fiscal_obligations add column if not exists notas             text;
alter table public.fiscal_obligations add column if not exists updated_at        timestamptz not null default now();
-- Clientes sem conta também têm obrigações: user_id deixa de ser obrigatório.
alter table public.fiscal_obligations alter column user_id drop not null;

alter table public.fiscal_obligations drop constraint if exists fiscal_obligations_estado_chk;
alter table public.fiscal_obligations add constraint fiscal_obligations_estado_chk
  check (estado is null or estado in ('por_preparar', 'aguardar_docs', 'em_preparacao', 'em_revisao', 'entregue', 'pago', 'em_atraso', 'nao_aplicavel'));

-- O cliente continua a ver "pendente / feito"; a equipa trabalha nos 8 estados.
-- Este gatilho mantém os dois em sincronia, venha a mudança de onde vier.
create or replace function public.sincronizar_estado_obrigacao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    -- O cliente que gera o calendário na conta dele: a obrigação fica logo na ficha.
    if new.cliente_id is null and new.user_id is not null then
      select id into new.cliente_id from public.clientes where user_id = new.user_id limit 1;
    end if;
    if new.estado is null then
      new.estado := case when new.status = 'done' then 'entregue' else 'por_preparar' end;
    end if;
    new.status := case when new.estado in ('entregue', 'pago', 'nao_aplicavel') then 'done' else 'pending' end;
  elsif new.estado is distinct from old.estado then
    new.status := case when new.estado in ('entregue', 'pago', 'nao_aplicavel') then 'done' else 'pending' end;
  elsif new.status is distinct from old.status then
    new.estado := case when new.status = 'done' then 'entregue' else 'por_preparar' end;
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists trg_sincronizar_estado_obrigacao on public.fiscal_obligations;
create trigger trg_sincronizar_estado_obrigacao before insert or update on public.fiscal_obligations
  for each row execute function public.sincronizar_estado_obrigacao();

drop policy if exists "obligations_equipa" on public.fiscal_obligations;
create policy "obligations_equipa" on public.fiscal_obligations for all using (public.is_equipa()) with check (public.is_equipa());
create index if not exists idx_obligations_cliente on public.fiscal_obligations (cliente_id, deadline);
-- O calendário gerado na Gestão não duplica o mesmo prazo no mesmo cliente.
create unique index if not exists idx_obligations_cliente_code
  on public.fiscal_obligations (cliente_id, code) where code is not null and cliente_id is not null;

-- ── 3. Tabelas novas ─────────────────────────────────────────────────────────
create table if not exists public.tarefas (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null,
  cliente_id    uuid references public.clientes (id) on delete cascade,
  obrigacao_id  uuid references public.fiscal_obligations (id) on delete set null,
  responsavel   text,
  prazo         date not null,
  estado        text not null default 'pendente' check (estado in ('pendente', 'em_curso', 'concluida')),
  recorrencia   text not null default 'nenhuma' check (recorrencia in ('nenhuma', 'mensal', 'trimestral', 'anual')),
  lembrete_dias int not null default 2,
  notas         text,
  origem        uuid,
  concluida_em  date,
  created_at    timestamptz not null default now()
);

create table if not exists public.documentos_cliente (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references public.clientes (id) on delete cascade,
  ano         int not null,
  mes         int not null check (mes between 1 and 12),
  tipo        text not null,
  estado      text not null default 'recebido' check (estado in ('em_falta', 'recebido', 'em_analise', 'validado')),
  nome        text,
  caminho     text,          -- ficheiro no bucket client-docs
  enviado_por text not null default 'equipa',
  data        date,
  created_at  timestamptz not null default now()
);

-- Registo de mensagens que não passam pela plataforma do cliente (WhatsApp,
-- notas para clientes sem conta). As mensagens para o cliente com conta vão
-- para client_notices, que é o que ele vê no Início.
create table if not exists public.mensagens_cliente (
  id          uuid primary key default gen_random_uuid(),
  cliente_id  uuid not null references public.clientes (id) on delete cascade,
  de          text not null default 'equipa',
  autor       text,
  texto       text,
  anexo_nome  text,
  anexo_path  text,
  canal       text not null default 'whatsapp',   -- 'whatsapp' | 'registo'
  lida        boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists public.relatorios_trimestrais (
  id            uuid primary key default gen_random_uuid(),
  cliente_id    uuid not null references public.clientes (id) on delete cascade,
  ano           int not null,
  trimestre     int not null check (trimestre between 1 and 4),
  faturacao     numeric(14,2),
  despesas      numeric(14,2),
  iva           numeric(14,2),
  impostos      numeric(14,2),
  liquidez      numeric(14,2),
  observacoes   text,
  recomendacoes text,
  estado        text not null default 'rascunho' check (estado in ('rascunho', 'enviado')),
  enviado_em    date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (cliente_id, ano, trimestre)
);

create table if not exists public.notas_cliente (
  id         uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  tipo       text not null default 'nota' check (tipo in ('nota', 'duvida', 'contacto', 'esclarecer')),
  texto      text not null,
  com        text,
  autor      text,
  resolvido  boolean not null default false,
  data       date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.horas_cliente (
  id         uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes (id) on delete cascade,
  data       date not null default current_date,
  horas      numeric(6,2) not null,
  descricao  text,
  pessoa     text,
  created_at timestamptz not null default now()
);

do $$
declare tbl text;
begin
  foreach tbl in array array['tarefas', 'documentos_cliente', 'mensagens_cliente', 'relatorios_trimestrais', 'notas_cliente', 'horas_cliente'] loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('drop policy if exists %I on public.%I', tbl || '_equipa', tbl);
    execute format('create policy %I on public.%I for all using (public.is_equipa()) with check (public.is_equipa())', tbl || '_equipa', tbl);
    execute format('create index if not exists %I on public.%I (cliente_id)', 'idx_' || tbl || '_cliente', tbl);
  end loop;
end $$;

-- ── 4. Mensagens ao cliente: anexos e acesso da equipa ──────────────────────
alter table public.client_notices add column if not exists anexo_nome text;
alter table public.client_notices add column if not exists anexo_path text;
drop policy if exists "notices_equipa" on public.client_notices;
create policy "notices_equipa" on public.client_notices for all using (public.is_equipa()) with check (public.is_equipa());

-- ── 5. Avença: ligação do contrato ao cliente ───────────────────────────────
alter table public.client_billing add column if not exists cliente_id uuid references public.clientes (id) on delete set null;

-- ── 6. Pasta de documentos: a equipa também trabalha nela ───────────────────
drop policy if exists "client_docs_equipa" on storage.objects;
create policy "client_docs_equipa" on storage.objects for all
  using (bucket_id = 'client-docs' and public.is_equipa())
  with check (bucket_id = 'client-docs' and public.is_equipa());

-- Empresa e perfil fiscal: a equipa lê as definições dos clientes com conta.
drop policy if exists "company_settings_equipa_le" on public.company_settings;
create policy "company_settings_equipa_le" on public.company_settings for select using (public.is_equipa());

-- ── 7. Trazer os clientes que já existem ────────────────────────────────────
-- (a) Cada conta de cliente na plataforma passa a ser um cliente da Gestão.
insert into public.clientes (nome, email, pais, regime, servicos, user_id, cliente_desde, estado)
select
  coalesce(nullif(cs.company_name, ''), nullif(u.raw_user_meta_data ->> 'display_name', ''), split_part(u.email, '@', 1)),
  u.email,
  coalesce(cs.country, 'PT'),
  case when coalesce(cs.country, 'PT') = 'DE'
       then case when cs.vat_regime = 'exempt' then 'klein' else 'regel' end
       else case when cs.vat_regime = 'exempt' then 'isento' else 'normal' end end,
  case p.platform when 'esg' then array['esg'] when 'both' then array['contabilidade', 'esg'] else array['contabilidade'] end,
  u.id,
  u.created_at::date,
  case when u.last_sign_in_at is null then 'onboarding' else 'ativo' end
from auth.users u
join public.profiles p on p.id = u.id and p.role = 'user'
left join public.company_settings cs on cs.user_id = u.id
where not exists (select 1 from public.clientes c where c.user_id = u.id);

-- (b) A lista que a Lúcia mantinha em Contabilidade → Clientes (na conta dela).
--     Entra quem ainda não existe pelo nome; os que já existem ganham o setor.
update public.clientes c set setor = cl.sector
  from public.clients cl join public.profiles p on p.id = cl.user_id and p.role = 'admin'
 where lower(trim(cl.name)) = lower(trim(c.nome)) and c.setor is null and cl.sector is not null;

insert into public.clientes (nome, pais, setor, servicos, estado)
select distinct on (lower(trim(cl.name)))
  trim(cl.name), upper(cl.country), cl.sector,
  case cl.service when 'esg' then array['esg'] when 'both' then array['contabilidade', 'esg'] else array['contabilidade'] end,
  case cl.status when 'inactive' then 'inativo' else 'ativo' end
from public.clients cl
join public.profiles p on p.id = cl.user_id and p.role = 'admin'
where not exists (select 1 from public.clientes c where lower(trim(c.nome)) = lower(trim(cl.name)));

-- (c) Ligações: obrigações e contratos de quem tem conta; contratos pelo nome.
update public.fiscal_obligations o set cliente_id = c.id
  from public.clientes c where c.user_id = o.user_id and o.cliente_id is null;
update public.client_billing b set cliente_id = c.id
  from public.clientes c where c.user_id = b.user_id and b.cliente_id is null;
update public.client_billing b set cliente_id = c.id
  from public.clientes c where b.cliente_id is null and lower(trim(c.nome)) = lower(trim(b.client_name));
-- Obrigações antigas sem estado ganham-no a partir do status (o gatilho faz o resto).
update public.fiscal_obligations set estado = case when status = 'done' then 'entregue' else 'por_preparar' end where estado is null;

-- ── 8. Verificação (aparece no painel de resultados) ────────────────────────
select 'clientes (total)' as o_que, count(*)::text as valor from public.clientes
union all select 'clientes com conta', count(*)::text from public.clientes where user_id is not null
union all select 'clientes sem conta (da lista da Lúcia)', count(*)::text from public.clientes where user_id is null
union all select 'obrigações ligadas a um cliente', count(*)::text from public.fiscal_obligations where cliente_id is not null
union all select 'contratos ligados a um cliente', count(*)::text from public.client_billing where cliente_id is not null
union all select 'contratos por ligar (ver nomes no Financeiro)', count(*)::text from public.client_billing where cliente_id is null;


-- ############################################################################
-- migration_038.sql
-- ############################################################################
-- ============================================================================
-- Migração 038 — Simplificação, fase 1: regras de acesso (Guia da plataforma, R-A1 e R-A2)
--
-- 1. Obrigações fiscais (R-A1). Hoje o cliente tem controlo total sobre as
--    obrigações da sua conta, incluindo as que a equipa gere no portal: pode
--    apagá-las (com o comprovativo e a checklist) e, ao marcar "Pendente", o
--    gatilho repõe o estado de trabalho da equipa em "por preparar".
--    Passa a ser: o cliente LÊ todas as da sua conta; só ALTERA ou APAGA as que
--    não estão ligadas a uma ficha da Gestão (cliente_id vazio). As ligadas são
--    geridas pela equipa. Continua a poder acrescentar obrigações.
--
-- 2. ESG (R-A2). As regras do tempo em que o cliente preenchia a ESG continuam
--    ativas: pela API, um cliente ligado a um caso consegue gravar, e consegue ler
--    mesmo com o caso escondido (visivel_cliente = false). E as chaves únicas
--    antigas, por conta, impedem um segundo caso ligado à mesma conta.
--    Saem as regras *_own e essas chaves; ficam as da migração 036 (a Lúcia edita
--    tudo; o cliente só lê o caso visível) e as chaves únicas por caso.
--
-- 3. IVA nas despesas recorrentes (R-A3): coluna nova vat_rate no modelo.
--
-- Só mexe em regras de acesso, restrições e acrescenta uma coluna — não apaga nem altera dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

-- ── 1. Obrigações fiscais ───────────────────────────────────────────────────
drop policy if exists "own obligations" on public.fiscal_obligations;

drop policy if exists "obligations_cliente_le" on public.fiscal_obligations;
create policy "obligations_cliente_le" on public.fiscal_obligations
  for select using (auth.uid() = user_id);

drop policy if exists "obligations_cliente_cria" on public.fiscal_obligations;
create policy "obligations_cliente_cria" on public.fiscal_obligations
  for insert with check (auth.uid() = user_id);

drop policy if exists "obligations_cliente_altera" on public.fiscal_obligations;
create policy "obligations_cliente_altera" on public.fiscal_obligations
  for update using (auth.uid() = user_id and cliente_id is null)
  with check (auth.uid() = user_id and cliente_id is null);

drop policy if exists "obligations_cliente_apaga" on public.fiscal_obligations;
create policy "obligations_cliente_apaga" on public.fiscal_obligations
  for delete using (auth.uid() = user_id and cliente_id is null);

-- (A equipa continua com "obligations_equipa", da migração 037.)

-- ── 2. ESG ──────────────────────────────────────────────────────────────────
drop policy if exists esg_diag_select_own on public.esg_diagnostics;
drop policy if exists esg_diag_insert_own on public.esg_diagnostics;
drop policy if exists esg_diag_update_own on public.esg_diagnostics;
drop policy if exists esg_diag_delete_own on public.esg_diagnostics;
drop policy if exists "materiality_own"   on public.esg_materiality;
drop policy if exists "projects_own"      on public.esg_projects;
drop policy if exists "reports_own"       on public.esg_reports;

-- Chaves únicas antigas por conta (user_id), seja qual for o nome com que ficaram.
do $$
declare r record;
begin
  for r in
    select c.conrelid::regclass as tabela, c.conname
    from pg_constraint c
    where c.contype = 'u'
      and c.conrelid in ('public.esg_materiality'::regclass, 'public.esg_diagnostics'::regclass, 'public.esg_reports'::regclass)
      and exists (select 1 from pg_attribute a where a.attrelid = c.conrelid and a.attnum = any (c.conkey) and a.attname = 'user_id')
  loop
    execute format('alter table %s drop constraint %I', r.tabela, r.conname);
  end loop;
end $$;

-- ── 3. IVA nas despesas recorrentes (R-A3) ──────────────────────────────────
-- A saída confirmada a partir de um modelo passa a levar IVA: a taxa do modelo
-- ou, sem taxa, a da empresa.
alter table public.recurring_expenses add column if not exists vat_rate numeric(5,2);

-- ── 4. Verificação (aparece no painel de resultados) ────────────────────────
select 'regras de acesso nas obrigações' as o_que, string_agg(policyname, ', ' order by policyname) as valor
  from pg_policies where schemaname = 'public' and tablename = 'fiscal_obligations'
union all
select 'regras antigas da ESG ainda ativas (deve dar vazio)', coalesce(string_agg(tablename || '.' || policyname, ', '), '—')
  from pg_policies where schemaname = 'public' and tablename like 'esg_%' and policyname like '%own%'
union all
select 'chaves únicas por conta na ESG (deve dar 0)', count(*)::text
  from pg_constraint c
  where c.contype = 'u' and c.conrelid in ('public.esg_materiality'::regclass, 'public.esg_diagnostics'::regclass, 'public.esg_reports'::regclass)
    and exists (select 1 from pg_attribute a where a.attrelid = c.conrelid and a.attnum = any (c.conkey) and a.attname = 'user_id');


-- ############################################################################
-- migration_039.sql
-- ############################################################################
-- ============================================================================
-- Migração 039 — O cliente lê a sua ficha e os documentos que a equipa lhe pediu
--
-- Teste da jornada, etapa 1 (05/10): o cliente carrega ficheiros em "Dados da
-- Empresa" sem saber o que a equipa lhe pediu — os pedidos ("Faturas de venda,
-- outubro, em falta") vivem em documentos_cliente, que só a equipa lê (037).
-- Passa a ler, só de leitura: a sua ficha em `clientes` (a que tem o user_id
-- dele) e os pedidos dessa ficha em `documentos_cliente`. O Início e a secção
-- Documentos mostram-lhe o que falta. Continua a não poder alterar nada aqui:
-- quem valida e classifica é a equipa.
--
-- Só acrescenta duas regras de leitura — não mexe em dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

drop policy if exists "clientes_cliente_le" on public.clientes;
create policy "clientes_cliente_le" on public.clientes
  for select using (user_id = auth.uid());

drop policy if exists "documentos_cliente_le" on public.documentos_cliente;
create policy "documentos_cliente_le" on public.documentos_cliente
  for select using (
    exists (select 1 from public.clientes c where c.id = documentos_cliente.cliente_id and c.user_id = auth.uid())
  );

-- ── Verificação (aparece no painel de resultados) ───────────────────────────
select tablename as tabela, string_agg(policyname, ', ' order by policyname) as regras
  from pg_policies
 where schemaname = 'public' and tablename in ('clientes', 'documentos_cliente')
 group by tablename;
-- Esperado: clientes → clientes_cliente_le, clientes_equipa
--           documentos_cliente → documentos_cliente_equipa, documentos_cliente_le
