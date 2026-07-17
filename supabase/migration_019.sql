-- ============================================================================
-- Migração 019 — Documentos dos clientes (Supabase Storage)
-- Bucket privado 'client-docs'. Caminho: {user_id_do_cliente}/{pastas...}/{ficheiro}
-- Admin: CRUD completo. Cliente: leitura apenas dos seus ficheiros.
-- Requer public.is_admin() (migração 016 / SETUP_COMPLETO).
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('client-docs', 'client-docs', false)
on conflict (id) do nothing;

-- Admin: acesso total ao bucket.
drop policy if exists "client_docs_admin_all" on storage.objects;
create policy "client_docs_admin_all" on storage.objects
  for all using (bucket_id = 'client-docs' and public.is_admin())
  with check (bucket_id = 'client-docs' and public.is_admin());

-- Cliente: lê apenas os ficheiros na sua pasta (1.º segmento = o seu user_id).
drop policy if exists "client_docs_read_own" on storage.objects;
create policy "client_docs_read_own" on storage.objects
  for select using (bucket_id = 'client-docs' and (storage.foldername(name))[1] = auth.uid()::text);
