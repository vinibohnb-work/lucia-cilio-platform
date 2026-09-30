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
