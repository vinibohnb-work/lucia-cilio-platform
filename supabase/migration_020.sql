-- ============================================================================
-- Migração 020 — CRM de prospeção (Gestão, apenas admins)
-- Funil: mapeado → abordagem → conectado → reuniao → proposta → fechado
--        (+ perdido, com motivo · futuro, quer mas não agora)
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

create table if not exists public.crm_leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  company     text,
  contact     text,             -- email / telefone / instagram…
  notes       text,
  stage       text not null default 'mapeado' check (stage in
    ('mapeado','abordagem','conectado','reuniao','proposta','fechado','perdido','futuro')),
  attempts    int not null default 0,   -- tentativas de contacto (etapa Em abordagem)
  lost_reason text,                     -- motivo (etapa Perdido)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_crm_stage on public.crm_leads (stage, updated_at desc);

alter table public.crm_leads enable row level security;

drop policy if exists "crm_admin_all" on public.crm_leads;
create policy "crm_admin_all" on public.crm_leads
  for all using (public.is_admin()) with check (public.is_admin());
