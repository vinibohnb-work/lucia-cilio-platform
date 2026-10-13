-- ============================================================================
-- Migração 045 — Logótipo do cliente
--
-- Pedido do Vinícius (12/10): no lugar das iniciais da ficha do cliente, o
-- logótipo da empresa — carregado pela equipa (Dados do cliente) ou pelo próprio
-- cliente (Empresa, na conta dele).
--
--   1. clientes.logo: o caminho do ficheiro no bucket 'logos'.
--   2. Bucket 'logos', de leitura pública: um logótipo não é um dado reservado e
--      assim pode mostrar-se sem pedir ligações temporárias. Só imagens PNG, JPEG
--      ou WebP (SVG fica de fora: pode levar código), até 2 MB.
--   3. Escrita: a equipa em todo o bucket; o cliente só dentro da pasta com o seu
--      user_id.
--   4. definir_logo_cliente(caminho): o cliente grava o caminho na SUA ficha sem
--      precisar de poder alterar a ficha (as outras colunas continuam só da equipa).
--
-- Não apaga nem altera dados.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

-- 1. Coluna -------------------------------------------------------------------
alter table public.clientes add column if not exists logo text;

-- 2. Bucket -------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 3. Quem escreve -------------------------------------------------------------
drop policy if exists "logos_equipa" on storage.objects;
create policy "logos_equipa" on storage.objects for all
  using (bucket_id = 'logos' and public.is_equipa())
  with check (bucket_id = 'logos' and public.is_equipa());

drop policy if exists "logos_cliente_cria" on storage.objects;
create policy "logos_cliente_cria" on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "logos_cliente_altera" on storage.objects;
create policy "logos_cliente_altera" on storage.objects for update to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "logos_cliente_apaga" on storage.objects;
create policy "logos_cliente_apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

-- 4. O cliente grava o logótipo na sua ficha ----------------------------------
create or replace function public.definir_logo_cliente(caminho text)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.uid() is null then return false; end if;
  -- Só um ficheiro da própria pasta (ou nada, para tirar o logótipo)
  if caminho is not null and split_part(caminho, '/', 1) <> auth.uid()::text then
    raise exception 'Caminho fora da pasta do cliente';
  end if;
  update public.clientes set logo = caminho, updated_at = now() where user_id = auth.uid();
  get diagnostics n = row_count;
  return n > 0;
end $$;
revoke all on function public.definir_logo_cliente(text) from public, anon;
grant execute on function public.definir_logo_cliente(text) to authenticated;
