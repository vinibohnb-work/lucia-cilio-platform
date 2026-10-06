-- ============================================================================
-- Limpeza dos dados do teste da jornada (etapa 1, 05/10/2026)
-- Ficha: "TESTE Jornada — apagar" · e0642b4d-658c-4623-b11f-96525433bbae
-- A conta vinibohnb+teste-jornada@gmail.com apaga-se em Gestão → Acessos → Eliminar
-- (a API apaga também a pasta de ficheiros). Esta consulta trata do resto.
--
-- 1.º correr só o bloco A (lista o que vai sair). 2.º, se bater certo, correr o bloco B.
-- ============================================================================

-- ── A. O que está ligado à ficha de teste ───────────────────────────────────
with f as (select 'e0642b4d-658c-4623-b11f-96525433bbae'::uuid as id)
select 'clientes' as tabela, count(*) from public.clientes, f where clientes.id = f.id
union all select 'fiscal_obligations',     count(*) from public.fiscal_obligations o, f     where o.cliente_id = f.id
union all select 'tarefas',                count(*) from public.tarefas t, f                where t.cliente_id = f.id
union all select 'documentos_cliente',     count(*) from public.documentos_cliente d, f     where d.cliente_id = f.id
union all select 'mensagens_cliente',      count(*) from public.mensagens_cliente m, f      where m.cliente_id = f.id
union all select 'relatorios_trimestrais', count(*) from public.relatorios_trimestrais r, f where r.cliente_id = f.id
union all select 'notas_cliente',          count(*) from public.notas_cliente n, f          where n.cliente_id = f.id
union all select 'horas_cliente',          count(*) from public.horas_cliente h, f          where h.cliente_id = f.id
union all select 'client_billing',         count(*) from public.client_billing b, f         where b.cliente_id = f.id;
-- Esperado: 1 · 16 · 1 · 3 · 0 · 1 · 1 · 2 · 0

-- ── B. Apagar (as tabelas da 037 têm on delete cascade) ─────────────────────
-- delete from public.clientes where id = 'e0642b4d-658c-4623-b11f-96525433bbae' and nome like 'TESTE Jornada%';

-- ── C. Confirmar que nada sobrou (repetir o bloco A: tudo a 0) ──────────────
