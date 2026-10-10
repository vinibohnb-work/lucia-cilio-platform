-- ============================================================================
-- Migração 042 — Formulário de diagnóstico só grava pelo servidor (anti-robôs)
--
-- Até aqui o /diagnostico gravava direto na base com a chave pública ("anon"):
-- quem tivesse essa chave (está no código de qualquer página) podia encher a
-- lista de diagnósticos sem passar pelo formulário. Agora o envio passa pela
-- função /api/diagnostico, que aplica a armadilha, o tempo mínimo de
-- preenchimento, o Turnstile (se configurado) e um limite por IP.
--
--   1. Coluna ip_hash — uma impressão do IP (nunca o IP), para contar envios.
--   2. Sai a regra que deixava "anon" inserir. A equipa continua a ler e a
--      tratar a lista como antes (regras diag_staff_*).
--
-- ⚠️ Aplicar e fazer o merge logo a seguir: entre os dois passos o formulário
-- antigo deixa de conseguir gravar (o endereço ainda não está divulgado).
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.diagnostico_submissoes add column if not exists ip_hash text;
create index if not exists idx_diag_ip_hash on public.diagnostico_submissoes (ip_hash, created_at desc);

drop policy if exists "diag_public_insert" on public.diagnostico_submissoes;

-- ── Verificação (aparece no painel de resultados) ───────────────────────────
select string_agg(policyname, ', ' order by policyname) as regras_que_ficam
  from pg_policies where schemaname = 'public' and tablename = 'diagnostico_submissoes';
-- Esperado: diag_staff_read, diag_staff_update (sem diag_public_insert)
