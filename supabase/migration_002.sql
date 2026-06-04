-- ============================================================================
-- Migração 002 — Catálogo (produtos/serviços) + categorização de despesas
-- Executar no Supabase: Dashboard → SQL Editor → New query → colar → Run
-- (Seguro de correr mesmo que parte já exista — usa IF NOT EXISTS.)
-- ============================================================================

-- ─── Catálogo de produtos e serviços ────────────────────────────────────────
create table if not exists public.catalog_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name       text not null,
  kind       text not null default 'service' check (kind in ('product','service')),
  price      numeric(12,2),
  created_at timestamptz not null default now()
);

create index if not exists idx_catalog_user on public.catalog_items (user_id);

alter table public.catalog_items enable row level security;
drop policy if exists "own catalog" on public.catalog_items;
create policy "own catalog" on public.catalog_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Novos campos no Livro de Caixa ─────────────────────────────────────────
-- category: chave da categoria de despesa (só usado em saídas)
-- catalog_item_id: liga o lançamento a um produto/serviço do catálogo
alter table public.cash_entries add column if not exists category text;
alter table public.cash_entries
  add column if not exists catalog_item_id uuid references public.catalog_items (id) on delete set null;
