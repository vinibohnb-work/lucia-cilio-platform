-- ============================================================================
-- Migração 018 — Tipo "Reunião" nos registos de consultoria
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.consulting_notes drop constraint if exists consulting_notes_kind_check;
alter table public.consulting_notes add constraint consulting_notes_kind_check
  check (kind in ('note','meeting','recommendation','report'));
