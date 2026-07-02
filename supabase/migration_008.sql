-- ============================================================================
-- Migração 008 — IVA por lançamento (Fase 2)
-- vat_rate: taxa aplicada (%) · vat_amount: valor de IVA contido no montante (total)
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.cash_entries add column if not exists vat_rate   numeric(5,2);
alter table public.cash_entries add column if not exists vat_amount numeric(12,2);
