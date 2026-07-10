-- ============================================================================
-- Migração 013 — Movimentos privados no Livro de Caixa (EÜR)
-- private = true → Privatentnahme (saída privada) ou Privateinlage (entrada
-- privada). Afetam o SALDO de caixa mas NÃO o lucro, o IVA nem as reservas.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.cash_entries add column if not exists private boolean not null default false;
