-- ============================================================================
-- Migração 056 — Comercial e marketing veem sem mexer (variante B final)
--
-- Porquê: decisão do Vini (ed30095b, 07/11). Hoje comercial e marketing passam
-- por is_equipa() e veem/alteram dados fiscais e pessoais dos clientes.
-- Autoria do SQL: Iara (Cibersegurança), 07/11. Substitui a 054-B.
--
-- O que muda:
--   1. is_equipa() passa a ser só admin; novos is_equipa_leitura() (admin,
--      comercial, marketing) e is_marketing() (admin, marketing).
--   2. Vistas só de leitura: gestao_clientes_basico (com logo) e gestao_agenda
--      (com tipo, hora, duracao_min das reuniões da 053).
--   3. marketing_posts / marketing_notas (inclui as linhas com cliente_id da
--      055): marketing edita, comercial só lê.
--   4. client-docs/marketing/** idem.
--   5. horas_cliente: comercial e marketing leem e registam só horas de
--      atividade (cliente_id nulo); sem update nem delete.
--
-- ATENÇÃO: nunca aplicar na produção sem o ajuste das telas da gestão no ar
-- no mesmo momento (senão comercial e marketing veem a gestão vazia/com erro).
-- Antes da produção: testes B1–B14 no DEV.
-- Requer 041, 045, 053 e 055 aplicadas. Idempotente. Não apaga dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================
begin;

-- 1. Papéis
create or replace function public.is_equipa()            -- só admin: fecha as políticas *_equipa da 037/043/045 e o gatilho da 044
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_equipa_leitura()    -- admin, comercial, marketing
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','comercial','marketing'));
$$;

create or replace function public.is_marketing()         -- admin, marketing
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','marketing'));
$$;
revoke all on function public.is_equipa_leitura(), public.is_marketing() from public, anon;
grant execute on function public.is_equipa_leitura(), public.is_marketing() to authenticated;

-- 2. Vistas: drop + create (o "create or replace" não aceita colunas novas no meio)
drop view if exists public.gestao_clientes_basico;
drop view if exists public.gestao_agenda;

-- Ficha básica: + logo (045). Fora: notas, regime, forma, trabalhadores, software, periodicidade,
-- horas_incluidas, user_id, categorias (053).
create view public.gestao_clientes_basico
with (security_barrier = true, security_invoker = false) as
  select id, nome, pessoa, email, telefone, pais, setor, servicos, estado,
         responsavel, cliente_desde, logo, created_at, updated_at
    from public.clientes
   where public.is_equipa_leitura();

-- Agenda: + tipo, hora, duracao_min (053, reuniões). Fora: notas, obrigacao_id, origem.
create view public.gestao_agenda
with (security_barrier = true, security_invoker = false) as
  select id, titulo, cliente_id, responsavel, prazo, estado, recorrencia,
         lembrete_dias, concluida_em, tipo, hora, duracao_min, created_at
    from public.tarefas
   where public.is_equipa_leitura();

-- As vistas correm com o dono e são auto-atualizáveis: só SELECT.
revoke all on public.gestao_clientes_basico, public.gestao_agenda from public, anon, authenticated;
grant select on public.gestao_clientes_basico, public.gestao_agenda to authenticated;

-- 3. Marketing (inclui as linhas com cliente_id da 055: as políticas não filtram por linha, só por papel)
drop policy if exists "marketing_posts_equipa" on public.marketing_posts;
drop policy if exists "marketing_posts_edita"  on public.marketing_posts;
drop policy if exists "marketing_posts_le"     on public.marketing_posts;
create policy "marketing_posts_edita" on public.marketing_posts for all to authenticated
  using (public.is_marketing()) with check (public.is_marketing());
create policy "marketing_posts_le" on public.marketing_posts for select to authenticated
  using (public.is_equipa_leitura());

drop policy if exists "marketing_notas_equipa" on public.marketing_notas;
drop policy if exists "marketing_notas_edita"  on public.marketing_notas;
drop policy if exists "marketing_notas_le"     on public.marketing_notas;
create policy "marketing_notas_edita" on public.marketing_notas for all to authenticated
  using (public.is_marketing()) with check (public.is_marketing());
create policy "marketing_notas_le" on public.marketing_notas for select to authenticated
  using (public.is_equipa_leitura());

-- 4. client-docs/marketing/** (inclui marketing/<cliente_id>/ da 055: foldername()[1] é o 1.º nível)
drop policy if exists "client_docs_marketing_edita" on storage.objects;
drop policy if exists "client_docs_marketing_le"    on storage.objects;
create policy "client_docs_marketing_edita" on storage.objects for all to authenticated
  using      (bucket_id = 'client-docs' and (storage.foldername(name))[1] = 'marketing' and public.is_marketing())
  with check (bucket_id = 'client-docs' and (storage.foldername(name))[1] = 'marketing' and public.is_marketing());
create policy "client_docs_marketing_le" on storage.objects for select to authenticated
  using (bucket_id = 'client-docs' and (storage.foldername(name))[1] = 'marketing' and public.is_equipa_leitura());

-- 5. Horas de atividade (041): comercial e marketing leem e inserem só linhas sem cliente.
--    Sem update nem delete. Horas por cliente continuam em horas_cliente_equipa (admin).
drop policy if exists "horas_atividade_le"       on public.horas_cliente;
drop policy if exists "horas_atividade_regista"  on public.horas_cliente;
create policy "horas_atividade_le" on public.horas_cliente for select to authenticated
  using (cliente_id is null and public.is_equipa_leitura());
create policy "horas_atividade_regista" on public.horas_cliente for insert to authenticated
  with check (cliente_id is null and nullif(trim(atividade), '') is not null and public.is_equipa_leitura());

commit;

-- 6. Verificação
select 'is_equipa admin-only' o_que, (pg_get_functiondef('public.is_equipa()'::regprocedure) not ilike '%comercial%')::text valor
union all select 'vistas sem escrita', (not has_table_privilege('authenticated','public.gestao_clientes_basico','insert,update,delete')
                                        and not has_table_privilege('authenticated','public.gestao_agenda','insert,update,delete'))::text
union all select 'anon sem vistas', (not has_table_privilege('anon','public.gestao_clientes_basico','select')
                                     and not has_table_privilege('anon','public.gestao_agenda','select'))::text
union all select 'colunas agenda', string_agg(column_name, ',' order by ordinal_position) from information_schema.columns where table_schema='public' and table_name='gestao_agenda'
union all select 'colunas ficha', string_agg(column_name, ',' order by ordinal_position) from information_schema.columns where table_schema='public' and table_name='gestao_clientes_basico'
union all select 'políticas marketing', string_agg(tablename||'.'||policyname, ', ' order by tablename, policyname) from pg_policies where tablename in ('marketing_posts','marketing_notas')
union all select 'políticas horas', string_agg(policyname||':'||cmd, ', ' order by policyname) from pg_policies where tablename='horas_cliente'
union all select 'políticas client-docs marketing', string_agg(policyname, ', ') from pg_policies where schemaname='storage' and policyname like 'client_docs_marketing%';
-- Esperado: true · true · true · agenda com tipo,hora,duracao_min e sem notas/obrigacao_id/origem · ficha com logo e sem categorias/notas/user_id
--           · exatamente 4 políticas de marketing (*_edita, *_le); se aparecer outra, BLOQUEIA: apagar antes de seguir
--           · horas: horas_atividade_le:SELECT, horas_atividade_regista:INSERT, horas_cliente_equipa:ALL · client_docs_marketing_edita, client_docs_marketing_le
