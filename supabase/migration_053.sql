-- ============================================================================
-- Migração 053 — Categorias por cliente, comprovativos na conciliação e reuniões na Agenda
--
-- Porquê: reunião de 29/10 com a Lúcia.
--   · Cada cliente tem categorias próprias (ex.: doações e dízimos para uma
--     igreja). A equipa define-as na ficha do cliente; servem para as entradas
--     e as saídas do Livro de Caixa e da conciliação bancária.
--   · Cada movimento do extrato pode levar o documento que o justifica.
--   · A Agenda passa a ter reuniões (com hora), para a Lúcia as pôr no Google
--     Calendar dela com um clique, sem as escrever duas vezes.
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
--   3. tarefas ganha `tipo` ('tarefa' ou 'reuniao'), `hora` e `duracao_min`.
--      As tarefas que já existem ficam 'tarefa'; o prazo de uma reunião é o dia dela.
--
-- Não apaga dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.clientes add column if not exists categorias jsonb not null default '{}'::jsonb;
comment on column public.clientes.categorias is 'Categorias próprias do cliente para os lançamentos: { "entradas": [...], "saidas": [...] } (migração 053)';

alter table public.bank_transactions add column if not exists comprovativo_path text;
alter table public.bank_transactions add column if not exists comprovativo_nome text;
comment on column public.bank_transactions.comprovativo_path is 'Documento que justifica o movimento, em client-docs/<user_id>/comprovativos/ (migração 053)';

alter table public.tarefas add column if not exists tipo text not null default 'tarefa';
alter table public.tarefas add column if not exists hora time;
alter table public.tarefas add column if not exists duracao_min integer not null default 60;
alter table public.tarefas drop constraint if exists tarefas_tipo_check;
alter table public.tarefas add constraint tarefas_tipo_check check (tipo in ('tarefa', 'reuniao'));
alter table public.tarefas drop constraint if exists tarefas_duracao_check;
alter table public.tarefas add constraint tarefas_duracao_check check (duracao_min between 5 and 720);
comment on column public.tarefas.tipo is 'tarefa ou reuniao (migração 053); a reunião tem hora e duração e vai para o Google Calendar com um clique';
