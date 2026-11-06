-- ============================================================================
-- Migração 054 — Periodicidade "sem acompanhamento" nas fichas de cliente
--
-- Porquê: pedido da Lúcia, pela Letícia (06/11). Um cliente só de Marketing (ou
-- de outro serviço sem Contabilidade) não tem acompanhamento mensal, trimestral
-- nem anual. A periodicidade passa a aceitar 'nenhuma'. A app só a oferece a
-- quem não tem Contabilidade, porque aí a periodicidade decide o calendário
-- fiscal (IVA mensal ou trimestral, USt).
--
-- O que muda: a regra (check) de clientes.periodicidade passa a aceitar
-- 'mensal', 'trimestral', 'anual' e 'nenhuma'. O serviço "Marketing" não precisa
-- de nada na base (clientes.servicos é uma lista livre).
--
-- Não apaga dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

-- Tira a regra antiga, seja qual for o nome que o Postgres lhe deu
do $$
declare r record;
begin
  for r in
    select conname from pg_constraint
     where conrelid = 'public.clientes'::regclass and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%periodicidade%'
  loop
    execute format('alter table public.clientes drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.clientes add constraint clientes_periodicidade_check
  check (periodicidade in ('mensal', 'trimestral', 'anual', 'nenhuma'));
