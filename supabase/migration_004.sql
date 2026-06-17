-- ============================================================================
-- Migração 004 — País livre (qualquer país do mundo) em clientes e obrigações
-- Remove a restrição fixa CHECK (country in ('pt','de')) e normaliza dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

-- ─── CLIENTES ───────────────────────────────────────────────────────────────
alter table public.clients drop constraint if exists clients_country_check;
alter table public.clients alter column country drop default;
update public.clients set country = upper(country) where country is not null;

-- ─── OBRIGAÇÕES FISCAIS ─────────────────────────────────────────────────────
alter table public.fiscal_obligations drop constraint if exists fiscal_obligations_country_check;
alter table public.fiscal_obligations alter column country drop default;
update public.fiscal_obligations set country = upper(country) where country is not null;

-- Agora a coluna country aceita qualquer código ISO 3166-1 alpha-2 (ex: PT, DE, FR, BR, US…).
