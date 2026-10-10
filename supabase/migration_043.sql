-- ============================================================================
-- Migração 043 — Aba de Marketing: publicações do Instagram e notas da equipa
--
-- Reunião de 01/10: prévia do feed, legendas, agenda de publicações e
-- anotações partilhadas entre a Lúcia, a Letícia e a Nicole.
--
--   · marketing_posts — cada publicação: data e hora previstas, formato,
--     estado (ideia → rascunho → aprovado → agendado → publicado), legenda,
--     hashtags, imagem (na pasta client-docs, em marketing/…) e notas.
--   · marketing_notas — o quadro de anotações da equipa.
-- Só a equipa (admin, comercial, marketing) lê e escreve — is_equipa(), da 037.
-- As imagens usam a pasta client-docs, onde a equipa já trabalha (037).
--
-- Só cria tabelas novas — não mexe em dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

create table if not exists public.marketing_posts (
  id          uuid primary key default gen_random_uuid(),
  data        date,
  hora        text,
  formato     text not null default 'post' check (formato in ('post', 'carrossel', 'reel', 'story')),
  estado      text not null default 'ideia' check (estado in ('ideia', 'rascunho', 'aprovado', 'agendado', 'publicado')),
  titulo      text,
  legenda     text,
  hashtags    text,
  imagem_path text,
  notas       text,
  autor       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_marketing_posts_data on public.marketing_posts (data);

create table if not exists public.marketing_notas (
  id         uuid primary key default gen_random_uuid(),
  texto      text not null,
  autor      text,
  feita      boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.marketing_posts enable row level security;
alter table public.marketing_notas enable row level security;

drop policy if exists "marketing_posts_equipa" on public.marketing_posts;
create policy "marketing_posts_equipa" on public.marketing_posts
  for all using (public.is_equipa()) with check (public.is_equipa());

drop policy if exists "marketing_notas_equipa" on public.marketing_notas;
create policy "marketing_notas_equipa" on public.marketing_notas
  for all using (public.is_equipa()) with check (public.is_equipa());

-- ── Verificação (aparece no painel de resultados) ───────────────────────────
select tablename as tabela, string_agg(policyname, ', ') as regras
  from pg_policies where schemaname = 'public' and tablename in ('marketing_posts', 'marketing_notas')
 group by tablename;
-- Esperado: marketing_notas → marketing_notas_equipa · marketing_posts → marketing_posts_equipa
