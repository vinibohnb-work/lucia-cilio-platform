-- ============================================================================
-- Migração 039 — O cliente lê a sua ficha e os documentos que a equipa lhe pediu
--
-- Teste da jornada, etapa 1 (05/10): o cliente carrega ficheiros em "Dados da
-- Empresa" sem saber o que a equipa lhe pediu — os pedidos ("Faturas de venda,
-- outubro, em falta") vivem em documentos_cliente, que só a equipa lê (037).
-- Passa a ler, só de leitura: a sua ficha em `clientes` (a que tem o user_id
-- dele) e os pedidos dessa ficha em `documentos_cliente`. O Início e a secção
-- Documentos mostram-lhe o que falta. Continua a não poder alterar nada aqui:
-- quem valida e classifica é a equipa.
--
-- Só acrescenta duas regras de leitura — não mexe em dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

drop policy if exists "clientes_cliente_le" on public.clientes;
create policy "clientes_cliente_le" on public.clientes
  for select using (user_id = auth.uid());

drop policy if exists "documentos_cliente_le" on public.documentos_cliente;
create policy "documentos_cliente_le" on public.documentos_cliente
  for select using (
    exists (select 1 from public.clientes c where c.id = documentos_cliente.cliente_id and c.user_id = auth.uid())
  );

-- ── Verificação (aparece no painel de resultados) ───────────────────────────
select tablename as tabela, string_agg(policyname, ', ' order by policyname) as regras
  from pg_policies
 where schemaname = 'public' and tablename in ('clientes', 'documentos_cliente')
 group by tablename;
-- Esperado: clientes → clientes_cliente_le, clientes_equipa
--           documentos_cliente → documentos_cliente_equipa, documentos_cliente_le
