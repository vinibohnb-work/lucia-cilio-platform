-- ============================================================================
-- Migração 052 — Link das fotografias do evento
--
-- Porquê: a Lúcia quer partilhar as fotografias do Momentos (pasta no Google
-- Drive) só com quem participou (28/10). O link fica no evento e a área de
-- participantes mostra-o a quem entrou com o seu acesso pessoal; não aparece na
-- landing nem a quem ainda não entrou.
--
-- O que muda: eventos ganha `fotos_url` (texto, opcional), preenchido em
-- Gestão → Eventos.
--
-- Não apaga dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.eventos add column if not exists fotos_url text;

comment on column public.eventos.fotos_url is 'Link das fotografias do evento (ex.: pasta do Google Drive); só os participantes com acesso o veem (migração 052)';
