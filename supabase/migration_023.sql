-- ============================================================================
-- Migração 023 — Acesso às duas plataformas (Contabilidade + ESG)
-- profiles.platform passa a aceitar 'both'. As tabelas de dados já são por
-- utilizador, por isso um utilizador 'both' simplesmente ganha dados nos dois
-- módulos (company_settings é partilhado).
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.profiles drop constraint if exists profiles_platform_chk;
alter table public.profiles add constraint profiles_platform_chk
  check (platform in ('accounting', 'esg', 'both'));
