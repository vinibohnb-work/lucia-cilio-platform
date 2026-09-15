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
//
// As quatro primeiras nasceram a 14/09. As bandas começavam em "< 50 mil €" e
// os clientes reais da Lúcia cabem quase todos aí dentro: o topo do formulário
// de diagnóstico (mais de 10.000 €/mês) dá 120 mil/ano, que já era a segunda
// banda. Resultado: a pontuação não distinguia quem fatura 500 €/mês de quem
// fatura 4.000 €/mês — e é aí que está a clientela dela.
//
// As chaves antigas ficam todas, porque estão gravadas nos leads existentes.
export const REVENUE_RANGES = [
  { key: 'lt12',    points: 4,  pt: '< 12 mil €',     de: '< 12 Tsd. €',    en: '< €12k',        mensal: 'até 1.000 €/mês' },
  { key: '12_36',   points: 10, pt: '12–36 mil €',    de: '12–36 Tsd. €',   en: '€12k–36k',      mensal: '1.000–3.000 €/mês' },
  { key: '36_60',   points: 16, pt: '36–60 mil €',    de: '36–60 Tsd. €',   en: '€36k–60k',      mensal: '3.000–5.000 €/mês' },
  { key: '60_120',  points: 22, pt: '60–120 mil €',   de: '60–120 Tsd. €',  en: '€60k–120k',     mensal: '5.000–10.000 €/mês' },
  { key: 'lt50',    points: 8,  pt: '< 50 mil €',     de: '< 50 Tsd. €',    en: '< €50k' },
  { key: '50_150',  points: 18, pt: '50–150 mil €',   de: '50–150 Tsd. €',  en: '€50k–150k' },
  { key: '150_500', points: 28, pt: '120–500 mil €',  de: '120–500 Tsd. €', en: '€120k–500k' },
  { key: '500_2m',  points: 36, pt: '500 mil – 2 M€', de: '500 Tsd. – 2 Mio. €', en: '€500k–2M' },
  { key: 'gt2m',    points: 40, pt: '> 2 M€',         de: '> 2 Mio. €',     en: '> €2M' },
]

// Chaves anteriores a 14/09. Continuam a pontuar (há leads gravados com elas),
// mas não aparecem para escolher — sobrepõem-se às bandas baixas novas.
export const REVENUE_RANGES_ANTIGAS = ['lt50', '50_150']

// O que se oferece na ficha do lead.
export const revenueRangesParaEscolher = (atual) =>
  REVENUE_RANGES.filter(r => !REVENUE_RANGES_ANTIGAS.includes(r.key) || r.key === atual)

// Tradução das bandas MENSAIS do formulário de diagnóstico para as ANUAIS do
// CRM. Era o buraco que fazia o lead chegar sem faturação: o formulário
// pergunta por mês, o CRM pontua por ano, e converter às cegas punha toda a
// gente na mesma banda.
export const FATURACAO_FORM_PARA_CRM = {
  zero:   'lt12',
  lt1k:   'lt12',
  '1k_3k': '12_36',
  '3k_5k': '36_60',
  '5k_10k': '60_120',
  gt10k:  '150_500',   // mais de 10 mil/mês = mais de 120 mil/ano
}

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
