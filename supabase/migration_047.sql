-- ============================================================================
-- Migração 047 — Comentários por item na consultoria ESG e opinião da equipa
--
-- Porquê: na reunião de 15/10 a Lúcia pediu "uma caixinha de comentários para
-- cada um deles" nos itens da análise ESG, em que "mesmo o cliente pode querer
-- fazer um comentário", e "do lado direito, uma caixa aberta para nós pormos a
-- nossa opinião" nas primeiras reuniões (liderança, operacional, extra).
-- Decisão do Vinícius (20/10): o cliente passa a poder escrever comentários —
-- é a única coisa que escreve na ESG (a decisão de 30/09, "ESG não aceita
-- gravação do cliente", mantém-se para todo o resto).
--
-- O que muda:
--   1. esg_comentarios — um texto por item e por lado ('equipa' | 'cliente').
--      `chave` identifica o item: 'diag:<n.º da pergunta>', 'mat:<tema>',
--      'arranque:<reuniao>'. O comentário da equipa é visível ao cliente (não é
--      nota interna); o do cliente é escrito por ele, ou pela Lúcia durante a
--      reunião. RLS: admin tudo; o cliente lê os do seu caso visível e escreve
--      só no lado 'cliente'.
--   2. esg_interno.opiniao (jsonb) — "a nossa opinião" por reunião de arranque,
--      interna como as notas (só a administradora lê).
--
-- Não apaga dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

-- 1. Comentários por item ------------------------------------------------------
create table if not exists public.esg_comentarios (
  id uuid primary key default gen_random_uuid(),
  consultoria_id uuid not null references public.esg_consultorias(id) on delete cascade,
  chave text not null,
  lado text not null check (lado in ('equipa', 'cliente')),
  texto text,
  autor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (consultoria_id, chave, lado)
);
alter table public.esg_comentarios enable row level security;

drop policy if exists esg_comentarios_admin on public.esg_comentarios;
create policy esg_comentarios_admin on public.esg_comentarios
  for all using (public.is_admin()) with check (public.is_admin());

-- O cliente lê os dois lados do seu caso, quando o caso lhe está visível
drop policy if exists esg_comentarios_cliente_le on public.esg_comentarios;
create policy esg_comentarios_cliente_le on public.esg_comentarios
  for select using (exists (
    select 1 from public.esg_consultorias c
    where c.id = consultoria_id and c.user_id = auth.uid() and c.visivel_cliente
  ));

-- …e escreve só no lado 'cliente'
drop policy if exists esg_comentarios_cliente_escreve on public.esg_comentarios;
create policy esg_comentarios_cliente_escreve on public.esg_comentarios
  for insert with check (lado = 'cliente' and autor_id = auth.uid() and exists (
    select 1 from public.esg_consultorias c
    where c.id = consultoria_id and c.user_id = auth.uid() and c.visivel_cliente
  ));
drop policy if exists esg_comentarios_cliente_altera on public.esg_comentarios;
create policy esg_comentarios_cliente_altera on public.esg_comentarios
  for update using (lado = 'cliente' and exists (
    select 1 from public.esg_consultorias c
    where c.id = consultoria_id and c.user_id = auth.uid() and c.visivel_cliente
  )) with check (lado = 'cliente');

-- 2. Opinião da equipa por reunião de arranque -------------------------------
alter table public.esg_interno add column if not exists opiniao jsonb not null default '{}'::jsonb;
