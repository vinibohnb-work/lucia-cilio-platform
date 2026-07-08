-- ============================================================================
-- Migração 011 — Plataforma por utilizador (login unificado, jornadas separadas)
-- platform: 'accounting' (Contabilidade) | 'esg' (ESG Consulting)
-- Utilizadores existentes ficam em 'accounting' (comportamento atual mantém-se).
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.profiles add column if not exists platform text not null default 'accounting';

-- Garante apenas valores válidos.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_platform_chk') then
    alter table public.profiles add constraint profiles_platform_chk
      check (platform in ('accounting', 'esg'));
  end if;
end $$;
