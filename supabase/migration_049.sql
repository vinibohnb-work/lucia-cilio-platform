-- ============================================================================
-- Migração 049 — Cargo no perfil dos participantes dos eventos
--
-- Porquê: no perfil da área de participantes (/momentos/participantes), o campo
-- "Negócio ou profissão" passa a ser dois: "Empresa" e "Cargo" (pedido de 21/10).
--
-- O que muda:
--   1. evento_participantes ganha a coluna `cargo` (texto, opcional).
--   2. A coluna `negocio` fica como está e passa a guardar o nome da empresa.
--
-- Não apaga dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.evento_participantes add column if not exists cargo text;

comment on column public.evento_participantes.negocio is 'Nome da empresa (rótulo "Empresa" no perfil, desde a migração 049)';
comment on column public.evento_participantes.cargo is 'Cargo na empresa (migração 049)';
