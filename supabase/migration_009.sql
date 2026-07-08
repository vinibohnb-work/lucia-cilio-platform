-- ============================================================================
-- Migração 009 — Vorsorge / Versicherungen (módulo Alemanha)
-- Valores mensais manuais de previdência/seguros para Selbständige (DE).
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.company_settings add column if not exists de_krankenv numeric(12,2) default 0;
alter table public.company_settings add column if not exists de_rentenv  numeric(12,2) default 0;
alter table public.company_settings add column if not exists de_sonstige numeric(12,2) default 0;
