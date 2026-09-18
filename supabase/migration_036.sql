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
