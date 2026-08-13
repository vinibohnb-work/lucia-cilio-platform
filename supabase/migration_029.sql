-- ============================================================================
-- Migração 029 — Módulo de Consultoria (Fase 0)
-- A Lúcia acede como administradora e regista o contacto SEM criar conta ao
-- cliente (decisão da reunião de 13/08). Por isso os dados de contacto ficam
-- na própria consultoria, e as ligações ao CRM e a auth.users são opcionais.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

create table if not exists public.consultorias (
  id         uuid primary key default gen_random_uuid(),
  tipo       text not null default 'implementacao'
             check (tipo in ('gratuita', 'implementacao')),

  -- ── Contacto (não precisa de conta na plataforma) ──
  nome       text not null,
  empresa    text,
  email      text,
  telefone   text,
  setor      text,

  -- ── Ligações opcionais ──
  lead_id    uuid references public.crm_leads (id) on delete set null,  -- de onde veio
  user_id    uuid references auth.users (id) on delete set null,        -- se vier a ter conta

  -- ── Estado ──
  bloco      int  not null default 1 check (bloco between 1 and 4),
  status     text not null default 'ativa' check (status in ('ativa', 'concluida', 'pausada')),

  -- ── Conteúdo (JSONB: uma linha por consultoria, como esg_materiality) ──
  respostas  jsonb not null default '{}'::jsonb,  -- { chaveDaPergunta: "resposta" }
  swot       jsonb not null default '{}'::jsonb,  -- { forcas:[], fraquezas:[], oportunidades:[], ameacas:[] }
  tows       jsonb not null default '{}'::jsonb,  -- { so:[{texto, origem:[]}], wo:[], st:[], wt:[] }
  numeros    jsonb not null default '{}'::jsonb,  -- Fase 1 (blocos 3 e 4)
  recursos   jsonb not null default '[]'::jsonb,  -- [{ titulo, url }] — só links
  relatorio  jsonb not null default '{}'::jsonb,  -- Fase 2
  notas      text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.consultorias enable row level security;

-- Só a Lúcia (admin). O papel 'comercial' não vê — é trabalho de consultoria.
drop policy if exists "consultorias_admin" on public.consultorias;
create policy "consultorias_admin" on public.consultorias
  for all using (public.is_admin()) with check (public.is_admin());

create index if not exists idx_consultorias_status on public.consultorias (status, updated_at desc);
