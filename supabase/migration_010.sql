-- ============================================================================
-- Migração 010 — Quantidade por lançamento (Livro de Caixa)
-- Permite representar vários itens num só lançamento (ex.: 10 manicures).
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.cash_entries add column if not exists quantity numeric(12,2) default 1;
