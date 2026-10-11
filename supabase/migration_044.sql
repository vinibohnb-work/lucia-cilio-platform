-- ============================================================================
-- Migração 044 — Permissões: obrigações criadas pelo cliente e avisos
--
-- Teste de permissões no projeto DEV (11/10, docs/auditorias/2026-10-11-permissoes.md):
--
--   1. "+ Nova Obrigação" na conta de um cliente que tem ficha: a obrigação era
--      criada, mas o trigger da 038 liga-a logo à ficha — e as regras só deixam o
--      cliente alterar/apagar obrigações SEM ficha. Resultado: o cliente não a
--      conseguia marcar como feita nem apagar, e aparecia como "da equipa".
--      Agora as que o próprio cliente cria levam source = 'cliente' e continuam
--      dele (altera e apaga), mesmo ligadas à ficha. As da equipa ficam como estão.
--
--   2. Ao criar uma obrigação, o cliente podia indicar a ficha de OUTRO cliente
--      (cliente_id). Passa a só poder usar a sua ficha (ou nenhuma).
--
--   3. Avisos (client_notices): o cliente podia mudar o título e o texto dos
--      avisos que recebe. Passa a só poder marcar como lido.
--
-- Não apaga nem altera dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

-- 1 + 2. Obrigações -----------------------------------------------------------
drop policy if exists "obligations_cliente_cria" on public.fiscal_obligations;
create policy "obligations_cliente_cria" on public.fiscal_obligations
  for insert with check (
    auth.uid() = user_id
    and (cliente_id is null or cliente_id in (select id from public.clientes where user_id = auth.uid()))
  );

drop policy if exists "obligations_cliente_altera" on public.fiscal_obligations;
create policy "obligations_cliente_altera" on public.fiscal_obligations
  for update using (
    auth.uid() = user_id and (cliente_id is null or source = 'cliente')
  ) with check (
    auth.uid() = user_id
    and (cliente_id is null
         or (source = 'cliente' and cliente_id in (select id from public.clientes where user_id = auth.uid())))
  );

drop policy if exists "obligations_cliente_apaga" on public.fiscal_obligations;
create policy "obligations_cliente_apaga" on public.fiscal_obligations
  for delete using (
    auth.uid() = user_id and (cliente_id is null or source = 'cliente')
  );

-- 3. Avisos: fora da equipa, só a data de leitura pode mudar --------------------
create or replace function public.avisos_so_leitura()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_equipa() then
    new.titulo     := old.titulo;
    new.corpo      := old.corpo;
    new.tom        := old.tom;
    new.anexo_nome := old.anexo_nome;
    new.anexo_path := old.anexo_path;
    new.user_id    := old.user_id;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  return new;
end $$;

drop trigger if exists trg_avisos_so_leitura on public.client_notices;
create trigger trg_avisos_so_leitura before update on public.client_notices
  for each row execute function public.avisos_so_leitura();

-- ── Verificação (aparece no painel de resultados) ───────────────────────────
select policyname as regra, cmd as acao from pg_policies
 where schemaname = 'public' and tablename = 'fiscal_obligations' and policyname like 'obligations_cliente_%'
 order by policyname;
-- Esperado: obligations_cliente_altera (UPDATE), obligations_cliente_apaga (DELETE),
--           obligations_cliente_cria (INSERT), obligations_cliente_le (SELECT)
