-- ============================================================================
-- Migração 035 — O contrato do cliente, anexado e visível para ele.
--
-- Pedido de 23/07 ("contratos ficam aqui, qualquer coisa tem acesso") e peça
-- que faltava do acesso básico definido a 10/09: "contrato, documentos e
-- notificações". As mensagens e os documentos já existiam; o contrato não.
--
-- O ficheiro vai para o bucket 'client-docs', dentro da pasta do próprio
-- cliente ({user_id}/contratos/) quando o contrato está ligado a uma conta —
-- assim o cliente lê o seu (política de 019) e o ficheiro desaparece com ele
-- na eliminação. Contratos sem conta associada ficam em 'contratos/{id}/',
-- onde só a Lúcia chega.
--
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

alter table public.client_billing add column if not exists contract_path text;
alter table public.client_billing add column if not exists contract_name text;
