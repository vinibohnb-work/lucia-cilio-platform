-- ============================================================================
-- Migração 063 — Anotações internas fora do alcance da cliente
--
-- Porquê: auditoria da Iara (04/11) e decisão do Vini (04/11): a cliente lia
-- pela API as notas, o responsável e as horas incluídas da própria ficha, e as
-- notas e a checklist das obrigações. Passam a viver em duas tabelas só da
-- equipa (admin, is_equipa() desde a 056). A cliente continua a ver obrigação,
-- data, período e estado. As telas da cliente não mudam.
--
-- Desenho (Larissa 17/11, revisto pela Aurora e pela Iara):
--   - clientes_interno (notas, responsavel, horas_incluidas) e
--     obrigacoes_interno (notas, checklist), 1:1, RLS só equipa, FK adiada
--     (o gatilho é BEFORE INSERT e grava na interna antes de a linha existir).
--   - Cópia do que existe, conferência (aborta se não bater) e limpeza da origem.
--   - Gatilho-rede em clientes e fiscal_obligations: o que chegar nessas colunas
--     vai para a interna e a origem fica vazia (vale para o front antigo).
--     Quem não é da equipa (A1 da Iara) tem o valor descartado.
--   - gestao_clientes_basico (056) passa a ler o responsável da interna.
--   - As internas NÃO entram na publicação do Realtime.
--
-- ANTES DE APLICAR: exportar em CSV clientes (id, notas, responsavel,
-- horas_incluidas) e fiscal_obligations (id, notas, checklist).
-- Aplicar ANTES de publicar o front deste ramo (o front lê as internas).
-- Aditiva + limpeza das colunas antigas (UPDATE), numa só transação.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================
begin;

-- A2 (Iara): ninguém grava nas duas tabelas enquanto a cópia e a limpeza correm
lock table public.clientes, public.fiscal_obligations in share row exclusive mode;

drop trigger if exists trg_interno_cliente on public.clientes;
drop trigger if exists trg_interno_obrigacao on public.fiscal_obligations;

-- 1. Tabelas internas
create table if not exists public.clientes_interno (
  cliente_id uuid primary key references public.clientes(id) on delete cascade deferrable initially deferred,
  notas text,
  responsavel text,
  horas_incluidas numeric(6,2) not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.obrigacoes_interno (
  obrigacao_id uuid primary key references public.fiscal_obligations(id) on delete cascade deferrable initially deferred,
  notas text,
  checklist jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.clientes_interno enable row level security;
alter table public.obrigacoes_interno enable row level security;

drop policy if exists clientes_interno_equipa on public.clientes_interno;
create policy clientes_interno_equipa on public.clientes_interno for all to authenticated
  using (public.is_equipa()) with check (public.is_equipa());
drop policy if exists obrigacoes_interno_equipa on public.obrigacoes_interno;
create policy obrigacoes_interno_equipa on public.obrigacoes_interno for all to authenticated
  using (public.is_equipa()) with check (public.is_equipa());
revoke all on public.clientes_interno, public.obrigacoes_interno from anon;

-- 2. Cópia do que existe
insert into public.clientes_interno (cliente_id, notas, responsavel, horas_incluidas)
  select id, nullif(notas,''), nullif(responsavel,''), coalesce(horas_incluidas,0)
    from public.clientes
   where coalesce(notas,'')<>'' or coalesce(responsavel,'')<>'' or coalesce(horas_incluidas,0)<>0
  on conflict (cliente_id) do nothing;
insert into public.obrigacoes_interno (obrigacao_id, notas, checklist)
  select id, nullif(notas,''), coalesce(checklist,'{}'::jsonb)
    from public.fiscal_obligations
   where coalesce(notas,'')<>'' or coalesce(checklist,'{}'::jsonb)<>'{}'::jsonb
  on conflict (obrigacao_id) do nothing;

-- 3. Conferência (A2): se alguma linha com conteúdo não estiver igual na interna, aborta tudo
do $$
declare n_cli int; n_obr int;
begin
  select count(*) into n_cli
    from public.clientes c
    left join public.clientes_interno i on i.cliente_id = c.id
   where (coalesce(c.notas,'')<>'' or coalesce(c.responsavel,'')<>'' or coalesce(c.horas_incluidas,0)<>0)
     and (i.cliente_id is null
          or nullif(c.notas,'') is distinct from i.notas
          or nullif(c.responsavel,'') is distinct from i.responsavel
          or coalesce(c.horas_incluidas,0) is distinct from i.horas_incluidas);
  select count(*) into n_obr
    from public.fiscal_obligations o
    left join public.obrigacoes_interno i on i.obrigacao_id = o.id
   where (coalesce(o.notas,'')<>'' or coalesce(o.checklist,'{}'::jsonb)<>'{}'::jsonb)
     and (i.obrigacao_id is null
          or nullif(o.notas,'') is distinct from i.notas
          or coalesce(o.checklist,'{}'::jsonb) is distinct from i.checklist);
  if n_cli > 0 or n_obr > 0 then
    raise exception '063 abortada: % fichas e % obrigações não bateram com a cópia', n_cli, n_obr;
  end if;
end $$;

-- 4. Limpeza da origem
update public.clientes set notas = null, responsavel = null, horas_incluidas = 0
 where notas is not null or responsavel is not null or coalesce(horas_incluidas,0) <> 0;
alter table public.fiscal_obligations disable trigger trg_sincronizar_estado_obrigacao;
update public.fiscal_obligations set notas = null, checklist = '{}'::jsonb
 where notas is not null or coalesce(checklist,'{}'::jsonb) <> '{}'::jsonb;
alter table public.fiscal_obligations enable trigger trg_sincronizar_estado_obrigacao;

-- 5. Gatilho-rede (A1: quem não é da equipa tem o valor descartado; invoker, nomes qualificados)
create or replace function public.guardar_interno_cliente() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is not null and not public.is_equipa() then
    new.notas := null; new.responsavel := null; new.horas_incluidas := 0;
    return new;
  end if;
  if tg_op = 'INSERT' then
    if coalesce(new.notas,'')<>'' or coalesce(new.responsavel,'')<>'' or coalesce(new.horas_incluidas,0)<>0 then
      insert into public.clientes_interno (cliente_id, notas, responsavel, horas_incluidas)
      values (new.id, nullif(new.notas,''), nullif(new.responsavel,''), coalesce(new.horas_incluidas,0))
      on conflict (cliente_id) do update set notas = excluded.notas, responsavel = excluded.responsavel,
        horas_incluidas = excluded.horas_incluidas, updated_at = now();
    end if;
  elsif nullif(new.notas,'') is distinct from nullif(old.notas,'')
     or nullif(new.responsavel,'') is distinct from nullif(old.responsavel,'')
     or coalesce(new.horas_incluidas,0) is distinct from coalesce(old.horas_incluidas,0) then
    insert into public.clientes_interno (cliente_id) values (new.id) on conflict do nothing;
    update public.clientes_interno set
      notas = case when nullif(new.notas,'') is distinct from nullif(old.notas,'') then nullif(new.notas,'') else notas end,
      responsavel = case when nullif(new.responsavel,'') is distinct from nullif(old.responsavel,'') then nullif(new.responsavel,'') else responsavel end,
      horas_incluidas = case when coalesce(new.horas_incluidas,0) is distinct from coalesce(old.horas_incluidas,0) then coalesce(new.horas_incluidas,0) else horas_incluidas end,
      updated_at = now()
    where cliente_id = new.id;
  end if;
  new.notas := null; new.responsavel := null; new.horas_incluidas := 0;
  return new;
end $$;
create trigger trg_interno_cliente before insert or update on public.clientes
  for each row execute function public.guardar_interno_cliente();

create or replace function public.guardar_interno_obrigacao() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is not null and not public.is_equipa() then
    new.notas := null; new.checklist := '{}'::jsonb;
    return new;
  end if;
  if tg_op = 'INSERT' then
    if coalesce(new.notas,'')<>'' or coalesce(new.checklist,'{}'::jsonb)<>'{}'::jsonb then
      insert into public.obrigacoes_interno (obrigacao_id, notas, checklist)
      values (new.id, nullif(new.notas,''), coalesce(new.checklist,'{}'::jsonb))
      on conflict (obrigacao_id) do update set notas = excluded.notas, checklist = excluded.checklist, updated_at = now();
    end if;
  elsif nullif(new.notas,'') is distinct from nullif(old.notas,'')
     or coalesce(new.checklist,'{}'::jsonb) is distinct from coalesce(old.checklist,'{}'::jsonb) then
    insert into public.obrigacoes_interno (obrigacao_id) values (new.id) on conflict do nothing;
    update public.obrigacoes_interno set
      notas = case when nullif(new.notas,'') is distinct from nullif(old.notas,'') then nullif(new.notas,'') else notas end,
      checklist = case when coalesce(new.checklist,'{}'::jsonb) is distinct from coalesce(old.checklist,'{}'::jsonb) then coalesce(new.checklist,'{}'::jsonb) else checklist end,
      updated_at = now()
    where obrigacao_id = new.id;
  end if;
  new.notas := null; new.checklist := '{}'::jsonb;
  return new;
end $$;
create trigger trg_interno_obrigacao before insert or update on public.fiscal_obligations
  for each row execute function public.guardar_interno_obrigacao();

revoke all on function public.guardar_interno_cliente(), public.guardar_interno_obrigacao() from public, anon, authenticated;

-- 6. Ficha básica de comercial e marketing (056): o responsável vem da interna
create or replace view public.gestao_clientes_basico
with (security_barrier = true, security_invoker = false) as
  select c.id, c.nome, c.pessoa, c.email, c.telefone, c.pais, c.setor, c.servicos, c.estado,
         ci.responsavel, c.cliente_desde, c.logo, c.created_at, c.updated_at
    from public.clientes c
    left join public.clientes_interno ci on ci.cliente_id = c.id
   where public.is_equipa_leitura();
revoke all on public.gestao_clientes_basico from public, anon, authenticated;
grant select on public.gestao_clientes_basico to authenticated;

-- 7. Armazenamento (achado de 17/11, Aurora): a 061 não cobria os ficheiros e a
--    conta só consulta ainda conseguia enviar para a própria pasta (client-docs,
--    client_docs_write_own da 032) e trocar o logótipo (logos_cliente_* da 045).
--    Restritivas (AND com as regras que existem): quem só consulta não envia,
--    não substitui nem apaga ficheiro em nenhum bucket. Leitura não muda; equipa
--    e clientes completos continuam como antes. Requer a 061 (is_portal).
drop policy if exists portal_sem_insert on storage.objects;
drop policy if exists portal_sem_update on storage.objects;
drop policy if exists portal_sem_delete on storage.objects;
create policy portal_sem_insert on storage.objects as restrictive for insert to authenticated
  with check (not public.is_portal());
create policy portal_sem_update on storage.objects as restrictive for update to authenticated
  using (not public.is_portal()) with check (not public.is_portal());
create policy portal_sem_delete on storage.objects as restrictive for delete to authenticated
  using (not public.is_portal());

commit;

-- 8. Pós-aplicação: as duas primeiras dão 0; a terceira tem as contagens das linhas com conteúdo antes; a última lista 3 políticas portal_sem_* no armazenamento
select count(*) fichas_por_limpar from public.clientes where notas is not null or responsavel is not null or coalesce(horas_incluidas,0) <> 0;
select count(*) obrigacoes_por_limpar from public.fiscal_obligations where notas is not null or coalesce(checklist,'{}'::jsonb) <> '{}'::jsonb;
select (select count(*) from public.clientes_interno) fichas, (select count(*) from public.obrigacoes_interno) obrigacoes;
select tablename from pg_publication_tables where pubname = 'supabase_realtime' and tablename in ('clientes_interno','obrigacoes_interno'); -- esperado: nenhuma linha
select policyname, cmd from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'portal_sem_%'; -- esperado: 3 linhas
