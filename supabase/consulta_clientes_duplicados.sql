-- ============================================================================
-- Consulta — clientes que parecem estar em duplicado (só leitura)
--
-- A migração 037 juntou duas fontes: as contas de cliente da plataforma e a
-- lista de Contabilidade → Clientes da conta da Lúcia. Quando o nome não era
-- exatamente igual (um acento, um apelido a mais, "Café piu piu - Orlando
-- Neves"), o mesmo cliente ficou com duas fichas.
--
-- Esta consulta NÃO altera nada. Lista os pares suspeitos, com o que cada
-- ficha já tem ligado, para decidir com a Lúcia quais juntar e qual fica.
--
-- Critérios de suspeita (qualquer um):
--   · nome igual sem acentos, maiúsculas nem pontuação  (Celia / Célia Munster)
--   · um nome começa pelo outro                         (Café piu piu / Café piu piu - Orlando Neves)
--   · o mesmo e-mail
--   · as duas primeiras palavras iguais                 (Gonçalo Brites / Gonçalo Brites & Luís Ribeiro)
--
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

with base as (
  select
    c.*,
    -- nome normalizado: minúsculas, sem acentos, só letras/números e espaços simples
    trim(regexp_replace(
      translate(lower(c.nome),
        'áàâãäåçéèêëíìîïñóòôõöúùûüýÿß',
        'aaaaaaceeeeiiiinooooouuuuyys'),
      '[^a-z0-9]+', ' ', 'g')) as norm
  from public.clientes c
),
base2 as (
  select b.*, split_part(b.norm, ' ', 1) || ' ' || split_part(b.norm, ' ', 2) as duas
  from base b
),
pares as (
  select
    a.id as id_a, b.id as id_b,
    case
      when a.norm = b.norm then 'nome igual (acentos/maiúsculas)'
      when b.norm like a.norm || ' %' or a.norm like b.norm || ' %' then 'um nome começa pelo outro'
      when a.email is not null and a.email <> '' and lower(a.email) = lower(b.email) then 'mesmo e-mail'
      else 'duas primeiras palavras iguais'
    end as motivo
  from base2 a
  join base2 b on a.id < b.id
  where a.norm = b.norm
     or b.norm like a.norm || ' %' or a.norm like b.norm || ' %'
     or (a.email is not null and a.email <> '' and lower(a.email) = lower(b.email))
     or (length(a.duas) > 6 and position(' ' in a.norm) > 0 and position(' ' in b.norm) > 0 and a.duas = b.duas)
),
uso as (
  -- o que cada ficha já tem ligado: ajuda a escolher qual fica
  select c.id,
    (select count(*) from public.fiscal_obligations o where o.cliente_id = c.id)      as obrigacoes,
    (select count(*) from public.tarefas t where t.cliente_id = c.id)                 as tarefas,
    (select count(*) from public.documentos_cliente d where d.cliente_id = c.id)      as documentos,
    (select count(*) from public.mensagens_cliente m where m.cliente_id = c.id)       as mensagens,
    (select count(*) from public.relatorios_trimestrais r where r.cliente_id = c.id)  as relatorios,
    (select count(*) from public.notas_cliente n where n.cliente_id = c.id)           as notas,
    (select count(*) from public.horas_cliente h where h.cliente_id = c.id)           as horas,
    (select count(*) from public.client_billing b where b.cliente_id = c.id)          as contratos
  from public.clientes c
)
select
  row_number() over (order by a.nome) as par,
  p.motivo,
  -- ficha A
  a.nome  as nome_a,  a.pais as pais_a,  coalesce(a.setor, '—') as setor_a,
  case when a.user_id is not null then 'sim' else 'não' end as conta_a,
  ua.obrigacoes + ua.tarefas + ua.documentos + ua.mensagens + ua.relatorios + ua.notas + ua.horas as registos_a,
  ua.contratos as contratos_a,
  -- ficha B
  b.nome  as nome_b,  b.pais as pais_b,  coalesce(b.setor, '—') as setor_b,
  case when b.user_id is not null then 'sim' else 'não' end as conta_b,
  ub.obrigacoes + ub.tarefas + ub.documentos + ub.mensagens + ub.relatorios + ub.notas + ub.horas as registos_b,
  ub.contratos as contratos_b,
  -- sugestão: fica a que tem conta; empatadas, a que tem mais registos ligados
  case
    when a.user_id is not null and b.user_id is not null then '⚠️ as duas têm conta — confirmar'
    when a.user_id is not null then 'manter A (tem conta)'
    when b.user_id is not null then 'manter B (tem conta)'
    when (ua.obrigacoes + ua.tarefas + ua.documentos + ua.contratos) >= (ub.obrigacoes + ub.tarefas + ub.documentos + ub.contratos) then 'manter A (mais dados)'
    else 'manter B (mais dados)'
  end as sugestao,
  p.id_a, p.id_b
from pares p
join public.clientes a on a.id = p.id_a
join public.clientes b on b.id = p.id_b
join uso ua on ua.id = a.id
join uso ub on ub.id = b.id
order by a.nome;
