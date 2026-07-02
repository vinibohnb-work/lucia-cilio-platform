-- ============================================================================
-- Migração 007 — Vigência das Despesas Recorrentes (início / fim)
-- start_month/end_month no formato 'YYYY-MM'. end_month NULL = sem fim (infinito).
-- start_month NULL (registos antigos) = sem limite inferior.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.recurring_expenses add column if not exists start_month text; -- 'YYYY-MM'
alter table public.recurring_expenses add column if not exists end_month   text; -- 'YYYY-MM' ou NULL (sem fim)
