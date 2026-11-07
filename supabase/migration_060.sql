-- ============================================================================
-- Migração 060 — Ligar a conta à ficha numa operação só (tudo ou nada)
--
-- Porquê: revisão da Iara de 07/11 (12-A/12-B, ponto A4). O ecrã fazia 4
-- updates separados (clientes.user_id, fiscal_obligations nos dois sentidos e
-- client_billing.user_id); se um falhasse a meio, a ligação ficava pela metade.
-- Agora uma função no banco faz tudo numa transação: ou liga tudo, ou nada.
--
-- Regras: só a administradora (is_admin()); só liga ficha ainda sem conta (a
-- segunda chamada para a mesma ficha dá erro e não altera nada).
-- Requer 016 (is_admin), 037 (clientes), 057/058. Idempotente. Não apaga dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================
begin;

create or replace function public.ligar_conta_ficha(p_cliente uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_admin() then
    raise exception 'Só a administradora pode ligar contas a fichas' using errcode = '42501';
  end if;
  if p_cliente is null or p_user is null then
    raise exception 'Ficha e conta são obrigatórias' using errcode = '22004';
  end if;
  -- Iara 07/11 (revisão da 060): só contas de cliente, e nunca uma conta que já tem outra ficha
  -- (a RLS do cliente lê "clientes where user_id = auth.uid()": duas fichas na mesma conta = vazamento entre clientes)
  if not exists (select 1 from public.profiles where id = p_user and role = 'user') then
    raise exception 'Só contas de cliente podem ser ligadas a uma ficha' using errcode = '22023';
  end if;
  if exists (select 1 from public.clientes where user_id = p_user and id <> p_cliente) then
    raise exception 'Esta conta já está ligada a outra ficha. Nada foi alterado.' using errcode = 'P0002';
  end if;

  update public.clientes set user_id = p_user, updated_at = now()
   where id = p_cliente and user_id is null;
  get diagnostics n = row_count;
  if n <> 1 then
    raise exception 'Esta ficha já está ligada a uma conta (ou não existe). Nada foi alterado.' using errcode = 'P0001';
  end if;

  -- As obrigações que o cliente já tinha na conta passam a aparecer na ficha, e as da ficha na conta
  update public.fiscal_obligations set cliente_id = p_cliente where user_id = p_user and cliente_id is null;
  update public.fiscal_obligations set user_id = p_user where cliente_id = p_cliente and user_id is null;
  -- 12-B (R-C8): o contrato gravado na ficha antes de haver conta
  update public.client_billing set user_id = p_user where cliente_id = p_cliente and user_id is null;
end;
$$;

revoke all on function public.ligar_conta_ficha(uuid, uuid) from public, anon;
grant execute on function public.ligar_conta_ficha(uuid, uuid) to authenticated;

-- Desligar no mesmo molde (Iara 07/11): o update solto só zerava clientes.user_id e a pessoa
-- desligada continuava a ver o contrato (portal_meu_contrato lê por user_id) e os prazos.
-- Limpa os três numa transação. Não apaga nada: a admin continua a ver tudo pela ficha.
create or replace function public.desligar_conta_ficha(p_cliente uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_user uuid;
begin
  if not public.is_admin() then
    raise exception 'Só a administradora pode desligar contas de fichas' using errcode = '42501';
  end if;
  if p_cliente is null then
    raise exception 'A ficha é obrigatória' using errcode = '22004';
  end if;
  select user_id into v_user from public.clientes where id = p_cliente for update;
  if v_user is null then
    return; -- ficha sem conta (ou inexistente): nada a desligar
  end if;
  update public.clientes set user_id = null, updated_at = now() where id = p_cliente;
  update public.fiscal_obligations set user_id = null where cliente_id = p_cliente and user_id = v_user;
  update public.client_billing set user_id = null where cliente_id = p_cliente and user_id = v_user;
end;
$$;

revoke all on function public.desligar_conta_ficha(uuid) from public, anon;
grant execute on function public.desligar_conta_ficha(uuid) to authenticated;

-- Cinto de segurança: uma conta, no máximo uma ficha (cobre também o "nova ficha" do AdminHome,
-- que grava user_id direto). Se já houver contas repetidas, pára aqui e nada da 060 é aplicado:
-- resolver com a Lúcia antes (consulta no fim do ficheiro).
do $$
begin
  if exists (select 1 from public.clientes where user_id is not null group by user_id having count(*) > 1) then
    raise exception 'Há contas ligadas a mais de uma ficha. Resolver antes de aplicar a 060.';
  end if;
end $$;
create unique index if not exists clientes_user_id_unico on public.clientes (user_id) where user_id is not null;

commit;

-- Verificação
select 'função existe' o_que, (to_regprocedure('public.ligar_conta_ficha(uuid,uuid)') is not null)::text valor
union all select 'anon sem execute', (not has_function_privilege('anon', 'public.ligar_conta_ficha(uuid,uuid)', 'execute'))::text
union all select 'security definer', (select prosecdef::text from pg_proc where oid = 'public.ligar_conta_ficha(uuid,uuid)'::regprocedure);
-- Esperado: true · true · true
-- Testes no DEV: admin liga ficha livre (ok); 2.ª chamada na mesma ficha (erro, nada muda);
-- comercial/marketing chamam (erro 42501); falha forçada no update de client_billing desfaz a ligação inteira;
-- ligar a uma conta comercial/marketing/admin (erro 22023); ligar conta já ligada a outra ficha (erro P0002, nada muda);
-- desligar: a conta deixa de ver ficha, prazos e contrato (portal_meu_contrato vazio), a admin continua a ver tudo.
-- ANTES de aplicar (DEV e produção), tem de vir vazio:
--   select user_id, count(*) from public.clientes where user_id is not null group by 1 having count(*) > 1;
-- Ordem: 056 → 059 → 060 no banco, e só depois o front (sem a 060, ligar/desligar conta dá 404).
