-- ============================================================================
-- Migração 050 — Repositório de eventos
--
-- Porquê: a aba Eventos deixa de servir só o Momentos de 24/10 e passa a ser o
-- repositório de eventos da Lúcia (pedido de 22/10): ela cria eventos, liga a
-- cada um a sua landing page e, se quiser, uma área de participantes com QR code.
--
-- O que muda:
--   1. eventos ganha `local` (onde é) e `landing_url` (a página do evento: a
--      landing no lcoffice.pt, uma página na Luma, etc.). A área de participantes
--      mostra o nome do evento e liga para a landing.
--   2. Um evento sem `codigo` não tem área de participantes (nada abre sem QR).
--   3. Atualiza o Momentos de 24/10 com o local e a landing que já tinha.
--
-- Não apaga dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.eventos add column if not exists local text;
alter table public.eventos add column if not exists landing_url text;

comment on column public.eventos.local is 'Onde é o evento (texto livre, migração 050)';
comment on column public.eventos.landing_url is 'Página do evento (landing no lcoffice.pt ou externa), migração 050';
comment on column public.eventos.codigo is 'Código do QR da área de participantes; sem código o evento não tem área';

update public.eventos
   set local = coalesce(local, 'District Space · Edifício Jean Monnet, Lisboa'),
       landing_url = coalesce(landing_url, 'https://lcoffice.pt/momentos/')
 where id = 'momentos-2026-10';
