import { supabase } from './supabase'

// Taxas de IVA por país (a primeira é a normal por defeito)
export const VAT_RATES = {
  PT: [23, 13, 6],
  DE: [19, 7],
}

export const DEFAULT_SETTINGS = {
  company_name: '',
  country: 'PT',
  currency: 'EUR',
  vat_regime: 'normal',
  vat_default_rate: 23,
  ir_reserve_pct: 25,
  ss_regime: '',
  fiscal_year_start_month: 1,
  de_krankenv: 0,
  de_rentenv: 0,
  de_sonstige: 0,
}

export async function getCompanySettings() {
  const { data, error } = await supabase.from('company_settings').select('*').maybeSingle()
  if (error) return null
  return data
}

export async function saveCompanySettings(values) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: { message: 'Sem sessão.' } }
  return supabase.from('company_settings').upsert(
    { user_id: user.id, ...values, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )
}
