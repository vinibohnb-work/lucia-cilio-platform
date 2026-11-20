-- ============================================================================
-- Conferência do portal "Só consulta", fase 1 (só leitura: não grava nada)
-- Rodar no Supabase de PRODUÇÃO: SQL Editor → New query → colar → Run
--
-- 1. O que já está aplicado. Esperado: a057 = 1, a058 = true, a060 = true,
--    a061 = 42 (14 tabelas × 3 travas). Se faltar alguma, aplicar na ordem
--    057, 058, 060, 061 e rodar de novo. A 063 NÃO entra nesta etapa.
-- 2. Achado de 17/11 (só contagem, sem abrir conteúdo): quantos anexos de
--    mensagens a pasta da Dalgisa tem hoje, por canal ('registo' = interno da
--    equipa; 'whatsapp' = conversa registada). Hoje a cliente com conta
--    consegue abri-los; a correção vem na fase 2 (pasta Interno só da equipa).
-- ============================================================================

-- 1. Migrações do portal
select
  (select count(*) from pg_constraint
    where conname = 'profiles_platform_chk' and pg_get_constraintdef(oid) like '%portal%') as a057,
  to_regprocedure('public.meus_contratos_ids()') is not null                               as a058,
  to_regprocedure('public.ligar_conta_ficha(uuid,uuid)') is not null                       as a060,
  (select count(*) from pg_policies where schemaname = 'public' and policyname like 'portal_sem_%') as a061;

-- 2. Anexos de mensagens da Dalgisa, por canal (e quantos existem mesmo no armazenamento)
select m.canal,
       count(*)                                    as anexos_registados,
       count(o.id)                                 as ficheiros_no_armazenamento,
       count(*) filter (where c.user_id is not null
                          and split_part(m.anexo_path, '/', 1) = c.user_id::text) as na_pasta_dela
  from public.mensagens_cliente m
  join public.clientes c on c.id = m.cliente_id
  left join storage.objects o on o.bucket_id = 'client-docs' and o.name = m.anexo_path
 where c.nome ilike '%dalgisa%'
   and coalesce(m.anexo_path, '') <> ''
 group by m.canal
 order by m.canal;
