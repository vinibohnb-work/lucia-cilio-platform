-- ============================================================================
-- Migração 028 — Plataforma "Contabilidade Lite"
-- Variante da Contabilidade que mostra apenas a secção "Contabilidade" do menu
-- (painel, livro de caixa, catálogo, obrigações fiscais) e esconde a secção
-- "Gestão" (precificação, planeamento, clientes, empresa, consultoria e o
-- módulo alemão de reservas e impostos).
-- Não altera dados nem permissões de leitura: o utilizador continua a ver
-- apenas os seus próprios registos — o que muda é o âmbito de páginas.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.profiles drop constraint if exists profiles_platform_chk;
alter table public.profiles add constraint profiles_platform_chk
  check (platform in ('accounting', 'accounting_lite', 'esg', 'both'));
