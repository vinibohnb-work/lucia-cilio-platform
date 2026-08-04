-- ============================================================================
-- Migração 025 — CRM: origem, temperatura, follow-up, perfil de cliente ideal
-- e ligação do lead fechado ao contrato do Financeiro.
-- Executar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================================

-- Origem do lead (base para as automações: Instagram, formulários, site)
alter table public.crm_leads add column if not exists source text;

-- Temperatura: quente / morno / frio
alter table public.crm_leads add column if not exists temperature text;

-- Follow-up: data do último contacto (alerta quando passa demasiado tempo)
alter table public.crm_leads add column if not exists last_contact_at timestamptz;

-- Perfil para o ranking de "cliente ideal" (conceito do Igor: preço pelo
-- valor agregado — faturação, setor e dor identificada)
alter table public.crm_leads add column if not exists sector        text;
alter table public.crm_leads add column if not exists revenue_range text;
alter table public.crm_leads add column if not exists pain          text;

-- Valor do negócio + ligação ao contrato criado no Financeiro
alter table public.crm_leads add column if not exists deal_value           numeric(12,2);
alter table public.crm_leads add column if not exists converted_billing_id uuid
  references public.client_billing (id) on delete set null;

-- Valores válidos (permitem NULL: leads antigos ficam sem classificação)
alter table public.crm_leads drop constraint if exists crm_leads_temperature_chk;
alter table public.crm_leads add constraint crm_leads_temperature_chk
  check (temperature is null or temperature in ('quente','morno','frio'));

alter table public.crm_leads drop constraint if exists crm_leads_source_chk;
alter table public.crm_leads add constraint crm_leads_source_chk
  check (source is null or source in ('instagram','formulario','site','indicacao','evento','linkedin','manual'));

-- Leads existentes: assume o último contacto na data da última atualização,
-- para o alerta de follow-up não disparar todo de uma vez.
update public.crm_leads set last_contact_at = updated_at where last_contact_at is null;

create index if not exists idx_crm_followup on public.crm_leads (last_contact_at);
