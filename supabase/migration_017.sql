-- ============================================================================
-- Migração 017 — Repositório de Consultorias
-- Notas/recomendações/relatórios que a admin (Lúcia) escreve para cada cliente.
-- O cliente lê as suas; a admin tem CRUD completo (via is_admin(), migração 016).
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

create table if not exists public.consulting_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,   -- cliente destinatário
  author_id  uuid references auth.users (id) on delete set null,           -- quem escreveu (admin)
  kind       text not null default 'note' check (kind in ('note','recommendation','report')),
  title      text not null,
  body       text,
  link_url   text,                                                          -- ligação externa (ex.: relatório no Drive)
  created_at timestamptz not null default now()
);

create index if not exists idx_consulting_user on public.consulting_notes (user_id, created_at desc);

alter table public.consulting_notes enable row level security;

-- Cliente lê as notas que lhe foram destinadas.
drop policy if exists "notes_read_own" on public.consulting_notes;
create policy "notes_read_own" on public.consulting_notes
  for select using (auth.uid() = user_id);

-- Admin: acesso total (escrever/editar/eliminar/ler tudo).
drop policy if exists "notes_admin_all" on public.consulting_notes;
create policy "notes_admin_all" on public.consulting_notes
  for all using (public.is_admin()) with check (public.is_admin());
