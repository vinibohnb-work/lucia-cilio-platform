-- ============================================================================
-- Migração 040 — O cliente vê o último relatório trimestral que lhe foi enviado
--
-- Reunião de 08/10: a página inicial do cliente passa a mostrar "último
-- relatório". Os relatórios vivem em relatorios_trimestrais, que só a equipa
-- lê (037). Passa a ler, só de leitura, os relatórios da SUA ficha que a equipa
-- marcou como "enviado" — os rascunhos continuam invisíveis para ele.
--
-- Só acrescenta uma regra de leitura — não mexe em dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

drop policy if exists "relatorios_cliente_le" on public.relatorios_trimestrais;
create policy "relatorios_cliente_le" on public.relatorios_trimestrais
  for select using (
    estado = 'enviado'
    and exists (select 1 from public.clientes c where c.id = relatorios_trimestrais.cliente_id and c.user_id = auth.uid())
  );

-- ── Verificação (aparece no painel de resultados) ───────────────────────────
select tablename as tabela, string_agg(policyname, ', ' order by policyname) as regras
  from pg_policies
 where schemaname = 'public' and tablename = 'relatorios_trimestrais'
 group by tablename;
-- Esperado: relatorios_cliente_le, relatorios_trimestrais_equipa
