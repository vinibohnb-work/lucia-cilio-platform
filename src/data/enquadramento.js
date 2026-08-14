// ============================================================================
// Bloco 0 · Enquadramento — os campos do formulário de diagnóstico inicial que
// a Lúcia usa no site (JotForm), trazidos para a ficha de consultoria.
//
// Aplicam-se aos DOIS tipos de consultoria, por isso vivem fora dos 4 blocos do
// documento da IHK: são o que se pergunta antes de saber sequer qual dos dois
// produtos faz sentido.
//
// As chaves nunca mudam (é o que está guardado); os rótulos podem mudar à
// vontade.
// ============================================================================

export const CAMPOS = [
  {
    key: 'pais', tipo: 'opcoes', obrigatorio: true,
    pt: 'País de atividade', de: 'Land der Tätigkeit', en: 'Country of activity',
    // O que torna este campo o mais importante do bloco
    ajudaPt: 'Determina as regras fiscais aplicadas em todo o relatório.',
    ajudaDe: 'Bestimmt die Steuerregeln im gesamten Bericht.',
    ajudaEn: 'Determines the tax rules used throughout the report.',
    opcoes: [
      { key: 'PT', pt: 'Portugal', de: 'Portugal', en: 'Portugal' },
      { key: 'DE', pt: 'Alemanha', de: 'Deutschland', en: 'Germany' },
    ],
  },
  {
    key: 'iniciou', tipo: 'opcoes', obrigatorio: true,
    pt: 'Já iniciou a atividade?', de: 'Haben Sie die Tätigkeit bereits aufgenommen?', en: 'Have you already started trading?',
    opcoes: [
      { key: 'sim', pt: 'Sim', de: 'Ja', en: 'Yes' },
      { key: 'nao', pt: 'Não', de: 'Nein', en: 'No' },
      { key: 'planeia', pt: 'Estou a planear abrir atividade', de: 'Ich plane die Gründung', en: 'I am planning to start' },
    ],
  },
  {
    key: 'data_inicio', tipo: 'data',
    pt: 'Data de início da atividade', de: 'Datum der Aufnahme', en: 'Start date',
    ajudaPt: 'Se aplicável — real ou prevista.',
    ajudaDe: 'Falls zutreffend — tatsächlich oder geplant.',
    ajudaEn: 'If applicable — actual or planned.',
  },
  {
    key: 'regime', tipo: 'opcoes',
    pt: 'Enquadramento fiscal atual', de: 'Aktuelle steuerliche Einordnung', en: 'Current tax regime',
    opcoes: [
      { key: 'simplificado', pt: 'Regime simplificado', de: 'Kleinunternehmerregelung', en: 'Simplified regime' },
      { key: 'organizada', pt: 'Contabilidade organizada', de: 'Bilanzierung', en: 'Full accounting' },
      { key: 'sem_atividade', pt: 'Ainda não tenho atividade aberta', de: 'Noch keine Tätigkeit angemeldet', en: 'Not trading yet' },
      { key: 'nao_sei', pt: 'Não sei', de: 'Weiß ich nicht', en: "I don't know" },
    ],
  },
  {
    key: 'iva', tipo: 'opcoes',
    pt: 'Emite faturas com IVA / Umsatzsteuer?', de: 'Stellen Sie Rechnungen mit Umsatzsteuer aus?', en: 'Do you invoice with VAT?',
    opcoes: [
      { key: 'sim', pt: 'Sim', de: 'Ja', en: 'Yes' },
      { key: 'nao', pt: 'Não', de: 'Nein', en: 'No' },
      { key: 'nao_sei', pt: 'Não sei', de: 'Weiß ich nicht', en: "I don't know" },
    ],
  },
  {
    key: 'faturacao', tipo: 'opcoes',
    pt: 'Faturação média mensal', de: 'Durchschnittlicher Monatsumsatz', en: 'Average monthly revenue',
    // ⚠️ Estas bandas são MENSAIS e não coincidem com as REVENUE_RANGES do CRM,
    // que são anuais e começam onde estas acabam. Converter antes de pontuar um
    // lead — ver a nota em BACKLOG.md.
    opcoes: [
      { key: 'zero', pt: 'Ainda não comecei a faturar', de: 'Noch kein Umsatz', en: 'Not invoicing yet' },
      { key: 'lt1k', pt: 'Até 1.000 €', de: 'Bis 1.000 €', en: 'Up to €1,000' },
      { key: '1k_3k', pt: '1.000 – 3.000 €', de: '1.000 – 3.000 €', en: '€1,000 – 3,000' },
      { key: '3k_5k', pt: '3.000 – 5.000 €', de: '3.000 – 5.000 €', en: '€3,000 – 5,000' },
      { key: '5k_10k', pt: '5.000 – 10.000 €', de: '5.000 – 10.000 €', en: '€5,000 – 10,000' },
      { key: 'gt10k', pt: 'Mais de 10.000 €', de: 'Mehr als 10.000 €', en: 'More than €10,000' },
    ],
  },
  {
    key: 'contabilista', tipo: 'opcoes',
    pt: 'Tem contabilista atualmente?', de: 'Haben Sie derzeit eine Steuerberatung?', en: 'Do you currently have an accountant?',
    opcoes: [
      { key: 'nao', pt: 'Não', de: 'Nein', en: 'No' },
      { key: 'sim', pt: 'Sim', de: 'Ja', en: 'Yes' },
      // O sinal de compra mais forte do formulário — daí ficar destacado
      { key: 'sim_mudar', pt: 'Sim, mas pretendo mudar', de: 'Ja, möchte aber wechseln', en: 'Yes, but I want to change', destaque: true },
    ],
  },
  {
    key: 'dificuldade', tipo: 'opcoes', outraKey: 'dificuldade_outra',
    pt: 'Principal dificuldade neste momento', de: 'Größte Schwierigkeit derzeit', en: 'Main difficulty right now',
    opcoes: [
      { key: 'iniciar', pt: 'Iniciar atividade como trabalhador independente', de: 'Selbstständigkeit aufnehmen', en: 'Starting out as self-employed' },
      { key: 'fiscal', pt: 'Organizar a situação fiscal — sinto que pago muitos impostos', de: 'Steuerliche Situation ordnen — zu hohe Steuerlast', en: 'Sorting out tax — I feel I pay too much' },
      { key: 'acompanhamento', pt: 'Procurar acompanhamento contabilístico regular', de: 'Laufende Buchhaltung suchen', en: 'Looking for regular accounting support' },
      { key: 'empresa', pt: 'Avaliar a possibilidade de abrir empresa', de: 'Gründung einer Gesellschaft prüfen', en: 'Considering forming a company' },
      { key: 'financas', pt: 'Dificuldade em organizar as finanças', de: 'Schwierigkeiten bei der Finanzorganisation', en: 'Trouble organising finances' },
      { key: 'outra', pt: 'Outra', de: 'Andere', en: 'Other', pedeTexto: true },
    ],
  },
]

// ── Helpers ─────────────────────────────────────────────────────────────────
export const rot = (o, lang) => o?.[lang] || o?.pt || ''
export const campo = (key) => CAMPOS.find(c => c.key === key)

export function opcaoDe(campoKey, valor, lang = 'pt') {
  const c = campo(campoKey)
  const o = (c?.opcoes || []).find(x => x.key === valor)
  return o ? rot(o, lang) : ''
}

// Preenchido = tem valor. A data só conta quando faz sentido tê-la.
export function progressoEnquadramento(enq = {}) {
  const contam = CAMPOS.filter(c => c.key !== 'data_inicio')
  const feitas = contam.filter(c => String(enq?.[c.key] ?? '').trim()).length
  return { feitas, total: contam.length, pct: Math.round((feitas / contam.length) * 100) }
}

// As perguntas do bloco 1 da IHK estão escritas para quem AINDA NÃO abriu
// ("Quando quero iniciar?", "Em que localização quero começar?"). Para quem já
// está a faturar, leem-se mal — a ficha avisa em vez de fingir que não há
// problema.
export const perguntasDesalinhadas = (enq) => enq?.iniciou === 'sim'

// O país decide as regras fiscais em todo o relatório.
export const paisDe = (c) => c?.enquadramento?.pais || null
