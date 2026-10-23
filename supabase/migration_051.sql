-- ============================================================================
-- Migração 051 — Avaliação das palestras dos eventos (NPS)
--
-- Porquê: a Lúcia pediu (23/10) que os participantes avaliem as palestras na
-- área de participantes, como padrão de todos os eventos, para ver depois
-- quais foram mais bem avaliadas.
--
-- O que muda:
--   1. evento_palestras — as palestras de cada evento (hora, tema, orador,
--      ordem). A Lúcia escreve-as em Gestão → Eventos.
--   2. evento_avaliacoes — uma nota de 0 a 10 (pergunta de NPS: "quanto
--      recomendaria…") e um comentário opcional por participante e palestra.
--      Sem palestra (palestra_id nulo) = a avaliação do evento como um todo.
--      Cada participante tem no máximo uma avaliação por palestra (e uma do evento).
--   3. Preenche as cinco palestras do Momentos de 24/10.
--
-- Segurança: como nas outras tabelas dos eventos, só a administradora lê e
-- escreve pela app; os participantes passam sempre por api/evento.js, que
-- confere o token. Na Gestão os resultados aparecem sem nomes.
--
-- Não apaga dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

-- 1. Palestras -----------------------------------------------------------------
create table if not exists public.evento_palestras (
  id uuid primary key default gen_random_uuid(),
  evento_id text not null references public.eventos(id) on delete cascade,
  ordem integer not null default 0,
  hora text,                                 -- ex.: '15h30' (texto livre)
  titulo text not null,
  orador text,
  created_at timestamptz not null default now()
);
create index if not exists idx_evento_palestras_evento on public.evento_palestras (evento_id, ordem);
alter table public.evento_palestras enable row level security;
drop policy if exists evento_palestras_admin on public.evento_palestras;
create policy evento_palestras_admin on public.evento_palestras
  for all using (public.is_admin()) with check (public.is_admin());

-- 2. Avaliações ----------------------------------------------------------------
create table if not exists public.evento_avaliacoes (
  id uuid primary key default gen_random_uuid(),
  evento_id text not null references public.eventos(id) on delete cascade,
  palestra_id uuid references public.evento_palestras(id) on delete cascade,   -- nulo = o evento
  participante_id uuid not null references public.evento_participantes(id) on delete cascade,
  nota smallint not null check (nota between 0 and 10),
  comentario text check (comentario is null or char_length(comentario) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_avaliacao_palestra on public.evento_avaliacoes (participante_id, palestra_id) where palestra_id is not null;
create unique index if not exists uq_avaliacao_evento on public.evento_avaliacoes (participante_id) where palestra_id is null;
create index if not exists idx_evento_avaliacoes_evento on public.evento_avaliacoes (evento_id);
alter table public.evento_avaliacoes enable row level security;
drop policy if exists evento_avaliacoes_admin on public.evento_avaliacoes;
create policy evento_avaliacoes_admin on public.evento_avaliacoes
  for all using (public.is_admin()) with check (public.is_admin());

-- 3. Palestras do Momentos de 24/10 (só se ainda não tiver nenhuma) --------------
insert into public.evento_palestras (evento_id, ordem, hora, titulo, orador)
select 'momentos-2026-10', v.ordem, v.hora, v.titulo, v.orador
  from (values
    (1, '15h30', 'Finanças sistémicas: da raiz à liberdade', 'Rita Évora'),
    (2, '16h00', 'Comportamentos financeiros', 'Florência Dias'),
    (3, '16h50', 'Comunicação e posicionamento', 'Sollange Binhã'),
    (4, '17h20', 'Liderança', 'Prof. Luís Sinate'),
    (5, '18h00', 'Posicionamento e gestão emocional', 'Drielly Jesus')
  ) as v(ordem, hora, titulo, orador)
 where exists (select 1 from public.eventos where id = 'momentos-2026-10')
   and not exists (select 1 from public.evento_palestras where evento_id = 'momentos-2026-10');
