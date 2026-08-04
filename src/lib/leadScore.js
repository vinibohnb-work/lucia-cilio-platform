// ============================================================================
// Ranking de "cliente ideal" (CRM) — conceito do Igor: o preço deve ser
// ajustável ao valor agregado, por isso vale mais o lead onde há mais valor a
// entregar. Pontuação transparente de 0 a 100, somando quatro componentes:
//
//   Faturação (0–40)  · quanto maior o negócio, maior o valor que podemos gerar
//   Temperatura (0–25) · interesse demonstrado
//   Setor (0–20)      · setores onde a Lúcia quer focar-se
//   Dor (0–15)        · dor identificada = conversa comercial mais fácil
//
// Tudo é descritivo: a pontuação ordena a lista, a decisão continua a ser dela.
// ============================================================================

// Faixas de faturação anual (chave guardada em crm_leads.revenue_range)
export const REVENUE_RANGES = [
  { key: 'lt50',    points: 8,  pt: '< 50 mil €',     de: '< 50 Tsd. €',    en: '< €50k' },
  { key: '50_150',  points: 18, pt: '50–150 mil €',   de: '50–150 Tsd. €',  en: '€50k–150k' },
  { key: '150_500', points: 28, pt: '150–500 mil €',  de: '150–500 Tsd. €', en: '€150k–500k' },
  { key: '500_2m',  points: 36, pt: '500 mil – 2 M€', de: '500 Tsd. – 2 Mio. €', en: '€500k–2M' },
  { key: 'gt2m',    points: 40, pt: '> 2 M€',         de: '> 2 Mio. €',     en: '> €2M' },
]

export const TEMPERATURES = [
  { key: 'quente', points: 25, emoji: '🔥', pt: 'Quente', de: 'Heiß',  en: 'Hot',  color: '#c2410c', bg: '#fff1e8' },
  { key: 'morno',  points: 12, emoji: '🌤', pt: 'Morno',  de: 'Warm',  en: 'Warm', color: '#a9781a', bg: '#fbf3d9' },
  { key: 'frio',   points: 0,  emoji: '❄',  pt: 'Frio',   de: 'Kalt',  en: 'Cold', color: '#1e60c8', bg: '#e8f0fb' },
]

export const SOURCES = [
  { key: 'instagram',  pt: 'Instagram',   de: 'Instagram',   en: 'Instagram' },
  { key: 'formulario', pt: 'Formulário',  de: 'Formular',    en: 'Form' },
  { key: 'site',       pt: 'Site',        de: 'Website',     en: 'Website' },
  { key: 'linkedin',   pt: 'LinkedIn',    de: 'LinkedIn',    en: 'LinkedIn' },
  { key: 'indicacao',  pt: 'Indicação',   de: 'Empfehlung',  en: 'Referral' },
  { key: 'evento',     pt: 'Evento',      de: 'Veranstaltung', en: 'Event' },
  { key: 'manual',     pt: 'Manual',      de: 'Manuell',     en: 'Manual' },
]

// Setores onde a Lúcia quer focar-se (*"eu vou tentar ficar muito na
// construção"*). Editável — é só uma lista de palavras a procurar no setor.
export const PRIORITY_SECTORS = ['constru', 'imobili', 'engenharia', 'arquitet', 'industr']

const isPrioritySector = (sector) =>
  !!sector && PRIORITY_SECTORS.some(s => sector.toLowerCase().includes(s))

// Pontuação 0–100 + detalhe por componente (para explicar o número na interface)
export function leadScore(lead) {
  const revenue = REVENUE_RANGES.find(r => r.key === lead?.revenue_range)?.points || 0
  const temp = TEMPERATURES.find(t => t.key === lead?.temperature)?.points || 0
  const sector = isPrioritySector(lead?.sector) ? 20 : 0
  const pain = lead?.pain?.trim() ? 15 : 0
  return { total: revenue + temp + sector + pain, revenue, temp, sector, pain }
}

// Dias desde o último contacto (null = nunca registado)
export function daysSinceContact(lead, now = new Date()) {
  const ref = lead?.last_contact_at || lead?.updated_at
  if (!ref) return null
  return Math.floor((now - new Date(ref)) / 86400000)
}

// Etapas onde faz sentido cobrar follow-up (fechado/perdido/futuro não contam)
export const FOLLOWUP_STAGES = ['mapeado', 'abordagem', 'conectado', 'reuniao', 'proposta']

// Lead "esquecido": em etapa ativa e sem contacto há mais de N dias
export function needsFollowUp(lead, days = 7, now = new Date()) {
  if (!FOLLOWUP_STAGES.includes(lead?.stage)) return false
  const d = daysSinceContact(lead, now)
  return d != null && d >= days
}
