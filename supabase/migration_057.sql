-- ============================================================================
-- Migração 057 — Acesso "Só consulta" (portal do cliente, item 13, passo 1)
--
-- Porquê: clientes que não usam a contabilidade da plataforma (trabalhadores
-- independentes; reunião de 29/10) entram só para ver o Início e os prazos,
-- sem valores e sem alterar nada. Novo valor 'portal' em profiles.platform.
--
-- Só alarga a lista de valores aceites. Não muda políticas nem dados.
-- Idempotente. Aplicar primeiro no DEV; produção junto com o código.
-- Nota: as travas de "só consulta" são, nesta fase, da interface (o banco
-- continua a aplicar as regras de cliente já existentes: 038, 039, 040, 044).
-- "Só consulta garantido também pelo banco" está em Depois da entrega.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================
begin;

-- O nome vem da 028 (profiles_platform_chk); o _check é o nome automático se a
-- coluna nasceu com o check inline (SETUP_COMPLETO). Larga os dois.
alter table public.profiles drop constraint if exists profiles_platform_chk;
alter table public.profiles drop constraint if exists profiles_platform_check;
alter table public.profiles add constraint profiles_platform_chk
  check (platform in ('accounting','accounting_lite','esg','both','portal'));

commit;

-- Verificação: deve mostrar a lista com 'portal'
select pg_get_constraintdef(oid) from pg_constraint
 where conrelid = 'public.profiles'::regclass and conname = 'profiles_platform_check';
