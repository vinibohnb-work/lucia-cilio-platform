-- ============================================================================
-- Migração 041 — Horas da equipa: por cliente OU por atividade
--
-- Pedido da Letícia (09/10): registar as horas do dia dedicadas a cada cliente
-- ou a uma atividade de marketing/interna, sem horários de início e fim, e ver
-- os totais do dia, da semana, do mês e por cliente.
--
-- As horas já existiam por cliente (horas_cliente, migração 037). Passam a
-- aceitar, em vez de um cliente, uma atividade ("Marketing · Instagram e
-- conteúdos", "Interno · Administrativo"…). Cada registo tem um cliente ou uma
-- atividade — nunca nenhum dos dois.
--
-- Não apaga nem altera dados: os registos que já existem têm todos cliente.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.horas_cliente alter column cliente_id drop not null;
alter table public.horas_cliente add column if not exists atividade text;

alter table public.horas_cliente drop constraint if exists horas_cliente_destino_chk;
alter table public.horas_cliente add constraint horas_cliente_destino_chk
  check (cliente_id is not null or nullif(trim(atividade), '') is not null);

create index if not exists horas_cliente_data_idx on public.horas_cliente (data);

-- (O acesso continua o da 037: só a equipa lê e grava — horas_cliente_equipa.)

-- ── Verificação (aparece no painel de resultados) ───────────────────────────
select column_name as coluna, is_nullable as aceita_vazio
  from information_schema.columns
 where table_schema = 'public' and table_name = 'horas_cliente' and column_name in ('cliente_id', 'atividade')
 order by column_name;
-- Esperado: atividade → YES · cliente_id → YES
