-- ============================================================================
-- Migração 055 — Marketing por cliente (feed, calendário e anotações na ficha)
--
-- Porquê: pedido da Lúcia (06/11). Os clientes com o serviço Marketing passam a
-- ter, na ficha da Gestão, o mesmo planeamento de Instagram que a LC Office já
-- usa para si (Gestão → Marketing, migração 043). Fase 1: só a equipa vê; o
-- cliente não vê nada, nem no ecrã nem lendo a base.
--
-- O que muda:
--   1. marketing_posts e marketing_notas ganham `cliente_id` (ficha da Gestão).
--      As publicações e anotações da própria LC Office ficam com cliente_id nulo
--      e continuam em Gestão → Marketing, sem mudar nada.
--   2. Eliminar a ficha apaga o planeamento dela (on delete cascade); a app
--      apaga antes as imagens, em client-docs/marketing/<cliente_id>/ (RGPD).
--   3. As regras de acesso não mudam: as duas tabelas continuam só para a
--      equipa (is_equipa(), migração 043), e no bucket client-docs o cliente só
--      chega à pasta do seu user_id (migração 032).
--
-- Não apaga dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.marketing_posts add column if not exists cliente_id uuid references public.clientes(id) on delete cascade;
alter table public.marketing_notas add column if not exists cliente_id uuid references public.clientes(id) on delete cascade;

create index if not exists marketing_posts_cliente_idx on public.marketing_posts (cliente_id);
create index if not exists marketing_notas_cliente_idx on public.marketing_notas (cliente_id);

comment on column public.marketing_posts.cliente_id is 'Ficha do cliente a quem pertence a publicação; nulo = Instagram da própria LC Office (migração 055)';
comment on column public.marketing_notas.cliente_id is 'Ficha do cliente a quem pertence a anotação; nulo = LC Office (migração 055)';
