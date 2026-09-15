-- ============================================================================
-- Migração 034 — Guardar o ficheiro do extrato importado.
--
-- Pedido de 27/08: a importação lê o CSV/Excel, cria os movimentos e deita o
-- ficheiro fora. Passa a ficar arquivado, para se poder voltar ao original
-- quando uma conciliação levantar dúvidas.
--
-- O ficheiro vai para o bucket 'client-docs', na pasta do próprio cliente
-- ({user_id}/extratos/), que é a mesma que já é apagada por inteiro quando o
-- cliente é eliminado — por isso não abre nenhuma ponta solta de RGPD.
--
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.bank_imports add column if not exists file_path text;
