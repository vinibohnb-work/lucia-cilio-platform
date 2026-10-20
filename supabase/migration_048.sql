-- ============================================================================
-- Migração 048 — Área de participantes dos eventos (Momentos entre Empreendedores)
--
-- Porquê: a Lúcia quer que os participantes do evento de 24/10 se conheçam e se
-- liguem antes e depois do encontro (pedido de 20/10). Decisões do Vinícius:
-- link pessoal por participante (sem conta nem palavra-passe), a partir da lista
-- de inscritos do Luma; a página fica junto à landing (/momentos/participantes).
--
-- O que muda:
--   1. eventos — o evento (nome, data, até quando a área fica aberta).
--   2. evento_participantes — um inscrito por linha: nome e e-mail (do Luma),
--      o link pessoal (token aleatório) e o perfil que ele próprio preenche.
--      O perfil só aparece aos outros com `partilhar = true` (opt-in, RGPD).
--      O e-mail nunca é mostrado a outros participantes.
--   3. Bucket 'eventos' (privado) para as fotografias de perfil: só imagens
--      PNG/JPEG/WebP até 2 MB. As fotos chegam aos outros por ligações
--      temporárias geradas no servidor.
--
-- Segurança: os participantes não têm conta. Não há políticas para anónimos nem
-- para clientes: só a administradora lê e escreve pela app; os participantes
-- passam sempre pela função api/evento.js (service role), que confere o token.
--
-- Não apaga dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

-- 1. Eventos ------------------------------------------------------------------
create table if not exists public.eventos (
  id text primary key,                       -- ex.: 'momentos-2026-10'
  nome text not null,
  data date,
  aberto_ate date,                           -- depois desta data a área fecha
  created_at timestamptz not null default now()
);
alter table public.eventos enable row level security;
drop policy if exists eventos_admin on public.eventos;
create policy eventos_admin on public.eventos
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.eventos (id, nome, data, aberto_ate)
values ('momentos-2026-10', 'Momentos entre Empreendedores', '2026-10-24', '2027-01-31')
on conflict (id) do nothing;

-- 2. Participantes ---------------------------------------------------------------
create table if not exists public.evento_participantes (
  id uuid primary key default gen_random_uuid(),
  evento_id text not null references public.eventos(id) on delete cascade,
  nome text not null,
  email text,
  token text not null unique,                -- link pessoal; só a admin e a função o leem
  negocio text,
  localidade text,
  sobre text,
  instagram text,
  linkedin text,
  site text,
  foto_path text,
  partilhar boolean not null default false,  -- opt-in: só assim aparece aos outros
  ultimo_acesso timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_evento_participante_email
  on public.evento_participantes (evento_id, lower(email)) where email is not null;
alter table public.evento_participantes enable row level security;
drop policy if exists evento_participantes_admin on public.evento_participantes;
create policy evento_participantes_admin on public.evento_participantes
  for all using (public.is_admin()) with check (public.is_admin());

-- 3. Fotografias -------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('eventos', 'eventos', false, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "eventos_admin" on storage.objects;
create policy "eventos_admin" on storage.objects for all
  using (bucket_id = 'eventos' and public.is_admin())
  with check (bucket_id = 'eventos' and public.is_admin());
