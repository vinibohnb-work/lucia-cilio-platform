-- ============================================================================
-- Migração 006 — Despesas Recorrentes (Fase 1)
-- Modelos de despesas recorrentes + ligação às confirmações no Livro de Caixa.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

create table if not exists public.recurring_expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade default auth.uid(),
  description text not null,
  category    text,                                   -- chave da categoria de despesa
  amount      numeric(12,2) not null default 0,       -- valor previsto
  periodicity text not null default 'monthly' check (periodicity in ('monthly','quarterly','annual')),
  due_day     int check (due_day between 1 and 31),
  destination text not null default 'banco' check (destination in ('caixa','banco')),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists idx_recurring_user on public.recurring_expenses (user_id);

alter table public.recurring_expenses enable row level security;
drop policy if exists "own recurring_expenses" on public.recurring_expenses;
create policy "own recurring_expenses" on public.recurring_expenses
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Ligação da confirmação ao lançamento real no Livro de Caixa
alter table public.cash_entries
  add column if not exists recurring_expense_id uuid references public.recurring_expenses (id) on delete set null;
alter table public.cash_entries
  add column if not exists period text;  -- 'YYYY-MM' quando o lançamento vem de uma recorrente
