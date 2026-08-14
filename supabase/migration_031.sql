-- ============================================================================
-- Migração 031 — Bloco 0 · Enquadramento da consultoria
--
-- Os campos vêm do formulário de diagnóstico inicial que a Lúcia usa no site
-- (JotForm "Formulário de Diagnóstico Inicial"). Aplicam-se aos dois tipos de
-- consultoria, por isso vivem fora dos 4 blocos do documento da IHK.
--
-- O campo que mais falta fazia é o `pais`: determina todas as regras fiscais, e
-- sem ele um relatório de cliente alemão pode sair com pressupostos
-- portugueses.
--
-- Uma coluna JSONB em vez de dez colunas: o formulário dela vai mudar, e assim
-- acrescentar um campo não exige migração.
-- ============================================================================

alter table public.consultorias
  add column if not exists enquadramento jsonb not null default '{}'::jsonb;

-- As palavras do cliente, guardadas à parte das `notas` — que são as
-- observações internas da consultora e não se devem misturar.
alter table public.consultorias
  add column if not exists notas_cliente text;

comment on column public.consultorias.enquadramento is
  'Bloco 0: pais, iniciou, data_inicio, regime, iva, faturacao, contabilista, dificuldade, dificuldade_outra';
comment on column public.consultorias.notas_cliente is
  'Texto livre escrito pelo próprio cliente (não confundir com notas, que são internas)';

-- Procurar consultorias por país é a consulta natural quando as regras fiscais
-- diferem entre Portugal e Alemanha.
create index if not exists idx_consultorias_pais
  on public.consultorias ((enquadramento ->> 'pais'));
