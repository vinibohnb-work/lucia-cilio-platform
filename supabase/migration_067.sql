-- ============================================================================
-- Migração 067 — Conciliar vários movimentos numa só chamada
--
-- Porquê: LUC-267 (revisão do Théo). O "Conciliar selecionados" fazia uma ida
-- ao banco por movimento, em sequência. Com 50 sugestões eram 50 pedidos e, se
-- um falhasse a meio, ficava metade conciliada sem resumo.
--
-- O que muda (só ADITIVO: cria uma função; nenhuma tabela, coluna, dado ou
-- política muda):
--   conciliar_lote(p_pares jsonb) recebe [{ "tx": <movimento>, "entry": <lançamento> }, ...]
--   e grava cada par à parte (subtransação): se um lançamento já estiver ligado
--   a outro movimento (23505, índice da 030 e gatilhos da 066), só esse par
--   falha e os outros ficam gravados — o mesmo comportamento do ecrã de antes.
--   Devolve { "ok": n, "falhas": [{ "tx", "code", "message" }] }.
--   Só concilia movimentos ainda pendentes.
--   security invoker: corre com as permissões (e a RLS) de quem chama; a conta
--   só consulta (061) continua sem gravar (a política restritiva barra o update
--   e o par sai como falha).
--
-- Não apaga dados. Idempotente.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================
begin;

create or replace function public.conciliar_lote(p_pares jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  par      jsonb;
  v_ok     int := 0;
  v_falhas jsonb := '[]'::jsonb;
begin
  if p_pares is null or jsonb_typeof(p_pares) <> 'array' then
    raise exception 'Lista de pares inválida.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_pares) > 1000 then
    raise exception 'No máximo 1000 movimentos de cada vez.' using errcode = '22023';
  end if;

  for par in select value from jsonb_array_elements(p_pares) loop
    begin
      update public.bank_transactions
         set status = 'conciliado', cash_entry_id = (par->>'entry')::uuid, matched_at = now()
       where id = (par->>'tx')::uuid
         and status = 'pendente';
      if not found then
        raise exception 'Movimento não encontrado ou já tratado.' using errcode = 'P0002';
      end if;
      v_ok := v_ok + 1;
    exception when others then
      v_falhas := v_falhas || jsonb_build_object('tx', par->>'tx', 'code', sqlstate, 'message', sqlerrm);
    end;
  end loop;

  return jsonb_build_object('ok', v_ok, 'falhas', v_falhas);
end;
$$;

revoke all on function public.conciliar_lote(jsonb) from public;
grant execute on function public.conciliar_lote(jsonb) to authenticated;

commit;

-- Verificação
select proname from pg_proc where proname = 'conciliar_lote';
