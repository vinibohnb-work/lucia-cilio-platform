-- ============================================================================
-- Migração 015 — Calendário Fiscal automático
-- source: 'manual' (inserida à mão) | 'auto' (gerada pelo calendário)
-- code:   identificador do prazo gerado (ex.: 'PT-IVA-2026-T1') para evitar duplicados
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.fiscal_obligations add column if not exists source text not null default 'manual';
alter table public.fiscal_obligations add column if not exists code   text;

-- Evita gerar o mesmo prazo automático duas vezes para o mesmo utilizador.
create unique index if not exists idx_obligations_user_code
  on public.fiscal_obligations (user_id, code) where code is not null;
