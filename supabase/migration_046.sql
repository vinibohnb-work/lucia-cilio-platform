-- ============================================================================
-- Migração 046 — Consultoria ESG pelo método da Lúcia (Diagnóstico e Desenvolvimento ESG)
--
-- Porquê: o documento da consultoria ESG que a Lúcia enviou (reunião de 15/10)
-- organiza o serviço em COMPREENDER → DIAGNOSTICAR → PRIORIZAR → AGIR → MEDIR →
-- EVOLUIR, vendido em três níveis (Diagnóstico · Desenvolvimento · Reporting), com
-- o formulário das 7 perguntas, a "primeira devolução", os problemas concretos
-- (sintoma → causa → impacto), o plano de ação (objetivo → ação → responsável →
-- prazo → indicador → evidência), as reuniões de acompanhamento, o feedback do
-- cliente e a avaliação final. Pediu também caixas de comentários e um
-- repositório de documentos.
--
-- O que muda:
--   1. esg_consultorias.nivel — o nível contratado (diagnostico | desenvolvimento | reporting).
--   2. esg_consultorias.metodo (jsonb) — o arranque (7 perguntas, interlocutores),
--      a fotografia por pilar, a primeira devolução, os problemas, as reuniões,
--      o feedback e a avaliação. O cliente pode lê-lo quando o caso lhe está
--      visível (as políticas da 036 aplicam-se à linha inteira) — nada disto é
--      interno.
--   3. esg_projects ganha os campos do plano de ação: objetivo, responsavel,
--      prazo (AAAA-MM), kpi, baseline, meta, resultado, evidencia.
--   4. esg_interno — notas internas do caso (as "caixas de comentários"), numa
--      tabela própria só da administradora: na esg_consultorias o cliente leria
--      a coluna. A coluna antiga esg_consultorias.notas nunca teve ecrã; o que lá
--      houver passa para aqui.
--   Os documentos do caso vão para o bucket client-docs, pasta esg/<id do caso>/
--   (as políticas da 019 e da 037 já dão o bucket todo à equipa; o cliente não
--   lê esta pasta).
--
-- Não apaga dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

-- 1 e 2. Nível e método no caso ---------------------------------------------
alter table public.esg_consultorias add column if not exists nivel text not null default 'diagnostico';
alter table public.esg_consultorias add column if not exists metodo jsonb not null default '{}'::jsonb;
alter table public.esg_consultorias drop constraint if exists esg_consultorias_nivel_check;
alter table public.esg_consultorias add constraint esg_consultorias_nivel_check
  check (nivel in ('diagnostico', 'desenvolvimento', 'reporting'));

-- 3. Plano de ação nos projetos ----------------------------------------------
alter table public.esg_projects add column if not exists objetivo text;
alter table public.esg_projects add column if not exists responsavel text;
alter table public.esg_projects add column if not exists prazo text;
alter table public.esg_projects add column if not exists kpi text;
alter table public.esg_projects add column if not exists baseline text;
alter table public.esg_projects add column if not exists meta text;
alter table public.esg_projects add column if not exists resultado text;
alter table public.esg_projects add column if not exists evidencia text;

-- 4. Notas internas ------------------------------------------------------------
create table if not exists public.esg_interno (
  consultoria_id uuid primary key references public.esg_consultorias(id) on delete cascade,
  notas text,
  updated_at timestamptz not null default now()
);
alter table public.esg_interno enable row level security;
drop policy if exists esg_interno_admin on public.esg_interno;
create policy esg_interno_admin on public.esg_interno
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.esg_interno (consultoria_id, notas)
select id, notas from public.esg_consultorias
where coalesce(trim(notas), '') <> ''
on conflict (consultoria_id) do nothing;
