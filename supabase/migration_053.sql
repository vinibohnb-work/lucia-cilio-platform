-- ============================================================================
-- Migração 053 — Categorias por cliente e comprovativos na conciliação
--
-- Porquê: reunião de 29/10 com a Lúcia.
--   · Cada cliente tem categorias próprias (ex.: doações e dízimos para uma
--     igreja). A equipa define-as na ficha do cliente; servem para as entradas
--     e as saídas do Livro de Caixa e da conciliação bancária.
--   · Cada movimento do extrato pode levar o documento que o justifica.
--
-- O que muda:
--   1. clientes ganha `categorias` (jsonb: { "entradas": [...], "saidas": [...] },
--      nomes em texto livre). Quem lê a ficha já o pode ler: a equipa todas,
--      o cliente a sua (políticas existentes, migrações 037 e 039).
--   2. bank_transactions ganha `comprovativo_path` e `comprovativo_nome`. O
--      ficheiro vai para o bucket privado client-docs, na pasta do próprio
--      cliente (<user_id>/comprovativos/…), onde ele já pode enviar e nunca
--      apagar (política existente, migração 032). Retirar o comprovativo só
--      desliga o ficheiro do movimento.
--
-- Não apaga dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.clientes add column if not exists categorias jsonb not null default '{}'::jsonb;
comment on column public.clientes.categorias is 'Categorias próprias do cliente para os lançamentos: { "entradas": [...], "saidas": [...] } (migração 053)';

alter table public.bank_transactions add column if not exists comprovativo_path text;
alter table public.bank_transactions add column if not exists comprovativo_nome text;
comment on column public.bank_transactions.comprovativo_path is 'Documento que justifica o movimento, em client-docs/<user_id>/comprovativos/ (migração 053)';
