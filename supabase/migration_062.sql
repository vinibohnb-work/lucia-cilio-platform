-- ============================================================================
-- Migração 062 — Formulário de feedback dos eventos
--
-- Porquê: pedido da Letícia (13/11). O formulário "A tua opinião é importante!"
-- do Momentos entre Empreendedores passa a fazer parte do repositório de
-- eventos, igual para todos os próximos: está na landing do evento e tem um
-- link próprio para enviar aos participantes (lcoffice.pt/feedback/#e=<id>).
--
-- O que muda:
--   1. eventos ganha `feedback_aberto` (falso por omissão). A Lúcia abre e fecha
--      o formulário em Gestão → Eventos; fechado, ninguém responde.
--   2. Nova tabela evento_feedback: as respostas, anónimas (sem nome, e-mail
--      nem IP). `respostas` guarda o Sim/Não de cada pergunta
--      ({ "gostou": true, "temas": false, … }); `comentario` é o "O que
--      poderíamos melhorar?". Sai em cascata com o evento.
--   3. RLS: só a administradora lê e apaga. Os participantes não têm conta e
--      gravam só através de api/evento.js (service role), que confere se o
--      formulário está aberto e trava abusos.
--
-- Não apaga dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.eventos add column if not exists feedback_aberto boolean not null default false;
comment on column public.eventos.feedback_aberto is 'Formulário de feedback aberto a respostas (lcoffice.pt/feedback/#e=<id>, migração 062)';

create table if not exists public.evento_feedback (
  id uuid primary key default gen_random_uuid(),
  evento_id text not null references public.eventos(id) on delete cascade,
  respostas jsonb not null default '{}'::jsonb,
  comentario text check (comentario is null or char_length(comentario) <= 1000),
  created_at timestamptz not null default now()
);
create index if not exists evento_feedback_evento_idx on public.evento_feedback (evento_id, created_at);

alter table public.evento_feedback enable row level security;
drop policy if exists evento_feedback_admin on public.evento_feedback;
create policy evento_feedback_admin on public.evento_feedback
  for all using (public.is_admin()) with check (public.is_admin());
