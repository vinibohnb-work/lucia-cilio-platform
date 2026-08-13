-- ============================================================================
-- Migração 030 — Importação de extrato bancário e conciliação caixa/banco
--
-- Decisão da reunião de 13/08: ficheiro (CSV/Excel) em vez de integração
-- bancária direta. O extrato entra, cruza-se com os lançamentos que já existem
-- no Livro de Caixa, e o que não cruzar fica à espera de decisão.
--
-- A propriedade importante desta migração é o `fingerprint`: um índice único
-- por utilizador que torna a reimportação do mesmo extrato inofensiva. Quem
-- importa o ficheiro de janeiro duas vezes não fica com tudo em duplicado.
-- ============================================================================

-- ── Cada ficheiro importado ────────────────────────────────────────────────
create table if not exists public.bank_imports (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade default auth.uid(),
  filename     text not null,
  period_start date,
  period_end   date,
  total_rows   int  not null default 0,
  new_rows     int  not null default 0,   -- quantas eram novas (o resto era repetido)
  created_at   timestamptz not null default now()
);

-- ── Cada movimento do extrato ──────────────────────────────────────────────
create table if not exists public.bank_transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade default auth.uid(),
  import_id     uuid references public.bank_imports (id) on delete cascade,
  tx_date       date not null,
  description   text not null,
  -- Guardado sempre positivo; o sentido vive em `type`, como no Livro de Caixa
  amount        numeric(12,2) not null check (amount >= 0),
  type          text not null check (type in ('entrada', 'saida')),
  balance       numeric(12,2),
  -- Identidade do movimento (data + valor + tipo + descrição normalizada).
  -- É o que impede duplicados numa reimportação.
  fingerprint   text not null,
  status        text not null default 'pendente'
                check (status in ('pendente', 'conciliado', 'ignorado')),
  -- O lançamento do Livro de Caixa a que este movimento corresponde
  cash_entry_id uuid references public.cash_entries (id) on delete set null,
  matched_at    timestamptz,
  raw           jsonb not null default '{}'::jsonb,   -- a linha original do ficheiro
  created_at    timestamptz not null default now()
);

-- ── RLS: cada um vê o seu, como no Livro de Caixa ──────────────────────────
alter table public.bank_imports      enable row level security;
alter table public.bank_transactions enable row level security;

drop policy if exists "own bank_imports" on public.bank_imports;
create policy "own bank_imports" on public.bank_imports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own bank_transactions" on public.bank_transactions;
create policy "own bank_transactions" on public.bank_transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── Índices ────────────────────────────────────────────────────────────────
-- O único que é regra de negócio e não otimização: o mesmo movimento não entra
-- duas vezes para o mesmo utilizador.
create unique index if not exists uq_bank_tx_fingerprint
  on public.bank_transactions (user_id, fingerprint);

create index if not exists idx_bank_tx_pendentes
  on public.bank_transactions (user_id, status, tx_date desc);
create index if not exists idx_bank_tx_entry
  on public.bank_transactions (cash_entry_id) where cash_entry_id is not null;
create index if not exists idx_bank_imports_user
  on public.bank_imports (user_id, created_at desc);

-- Um lançamento do Livro de Caixa não pode estar conciliado com dois
-- movimentos ao mesmo tempo.
create unique index if not exists uq_bank_tx_one_entry
  on public.bank_transactions (cash_entry_id) where cash_entry_id is not null;
