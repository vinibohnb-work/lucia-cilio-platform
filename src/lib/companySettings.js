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

// userId: se indicado, lê as definições desse utilizador (usado no "Ver como"
// do admin). Sem argumento, usa o utilizador da sessão. O filtro é obrigatório
// porque o admin tem leitura de todas as linhas (senão maybeSingle falharia).
export async function getCompanySettings(userId) {
  let uid = userId
  if (!uid) { const { data: { user } } = await supabase.auth.getUser(); uid = user?.id }
  if (!uid) return null
  const { data, error } = await supabase.from('company_settings').select('*').eq('user_id', uid).maybeSingle()
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
