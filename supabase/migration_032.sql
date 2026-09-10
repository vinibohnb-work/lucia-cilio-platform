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
