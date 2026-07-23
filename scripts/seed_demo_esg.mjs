// ============================================================================
// Seed de clientes de DEMONSTRAÇÃO da plataforma ESG (dois cases distintos).
// Cria os logins (sem email de convite), perfis ESG e preenche Diagnóstico
// (28 perguntas) + Dupla Materialidade (16 temas, metas).
//
// Correr localmente (usa a service key do .env.local — nunca no frontend):
//   node scripts/seed_demo_esg.mjs
// É idempotente: se os utilizadores já existirem, apenas atualiza os dados.
// ============================================================================
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'

// ── env ── (correr a partir da raiz do projeto: node scripts/seed_demo_esg.mjs)
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/).filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)
const URL_ = env.SUPABASE_URL || env.VITE_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
if (!URL_ || !KEY) { console.error('Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env.local'); process.exit(1) }
const admin = createClient(URL_, KEY, { auth: { autoRefreshToken: false, persistSession: false } })

const PASSWORD = 'DemoESG2026!'

// ════════════════════════════════════════════════════════════════════════════
// CASE 1 — GrünBau GmbH (DE) · construção sustentável, 28 colaboradores
// Perfil: forte em Ambiente (metas de CO₂, investimento verde), governança média
// ════════════════════════════════════════════════════════════════════════════
const gruenbau = {
  email: 'demo.gruenbau@lc-demo.com',
  name: 'GrünBau GmbH (Demo)',
  country: 'DE',
  answers: {
    1:  { value: 'yes' },
    2:  { fields: {
          erdgas:     { value: '12000', unit: 'kWh' },
          diesel:     { value: '3200', unit: 'Litros' },
          benzin:     { value: '600', unit: 'Litros' },
          elet_total: { value: '38000', unit: 'kWh' },
          elet_renov: { value: '62' },
          elet_auto:  { value: '20' },
        } },
    3:  { value: '320', unit: 'gCO₂/kWh' },
    4:  { value: 'yes' },
    5:  { fields: { total: { value: '85', unit: 't CO₂' }, scope1: { value: '40', unit: 't CO₂' }, scope2: { value: '25', unit: 't CO₂' }, scope3: { value: '20', unit: 't CO₂' } } },
    6:  { value: 'yes' },
    7:  { value: 'no' },
    8:  { value: '420', unit: 'm³' },
    9:  { fields: { total: { value: '34', unit: 't' }, total_recic: { value: '58' }, perigosos: { value: '2.5', unit: 't' }, perigosos_recic: { value: '40' } } },
    10: { fields: { total: { value: '1200000', unit: 'Euro' }, elegivel: { value: '45' }, alinhado: { value: '18' } } },
    11: { value: '28', unit: 'FTE' },
    12: { fields: { todos: { value: '22' }, liderancas: { value: '15' }, alta_gestao: { value: '0' }, controle: { value: '0' } } },
    13: { value: '-6' },
    14: { fields: { com_afastamento: { value: '2' }, fatais: { value: '0' } } },
    15: { fields: { todos: { value: '3' }, por_iniciativa: { value: '2' } } },
    16: { value: '14', unit: 'horas' },
    17: { value: '520', unit: 'Euro' },
    18: { value: '2' },
    19: { value: '12', unit: 'anos' },
    20: { value: 'yes' },
    21: { value: 'yes' },
    22: { value: 'yes' },
    23: { value: 'planned' },
    24: { value: 'yes' },
    25: { value: 'no' },
    26: { value: 'yes' },
    27: { value: 'yes' },
    28: { value: 'planned' },
  },
  referenceYear: 2025,
  threshold: 3.5,
  topics: {
    clima:    { applicable: true, stakeholder: 4, company: 5, note: 'Clientes públicos exigem pegada de CO₂ nas propostas.',
                goal: { baseline: '85 t CO₂/ano', target: '60 t CO₂/ano', deadline: '2027-12', how: 'Frota elétrica faseada + fotovoltaico no armazém' } },
    residuos: { applicable: true, stakeholder: 4, company: 4, note: 'Resíduos de obra são o maior fluxo de custos evitáveis.',
                goal: { baseline: '58% reciclado', target: '80% reciclado', deadline: '2026-12', how: 'Separação em obra + parceiro de reciclagem' } },
    equipa:   { applicable: true, stakeholder: 5, company: 4, note: 'Segurança em obra é prioridade nº 1 dos colaboradores.',
                goal: { baseline: '2 acidentes/ano', target: '0 acidentes', deadline: '2026-12', how: 'Formação de segurança trimestral + EPI novo' } },
    anticorr: { applicable: true, stakeholder: 4, company: 4, note: 'Concursos públicos exigem política anticorrupção.' },
    poluicao: { applicable: true, stakeholder: 4, company: 3, note: 'Pó e ruído nas obras urbanas.' },
    agua:     { applicable: true, stakeholder: 3, company: 3 },
    biodiv:   { applicable: true, stakeholder: 3, company: 2 },
    formacao: { applicable: true, stakeholder: 3, company: 4 },
    diversid: { applicable: true, stakeholder: 3, company: 3, note: 'Setor com poucas mulheres — oportunidade de diferenciação.' },
    cadeia:   { applicable: true, stakeholder: 4, company: 3, note: 'Subempreiteiros: condições e pagamentos.' },
    comunid:  { applicable: true, stakeholder: 3, company: 2 },
    clientes: { applicable: true, stakeholder: 3, company: 3 },
    conduta:  { applicable: true, stakeholder: 3, company: 4 },
    pagament: { applicable: true, stakeholder: 2, company: 3 },
    transpar: { applicable: true, stakeholder: 3, company: 3 },
    riscos:   { applicable: true, stakeholder: 3, company: 4 },
  },
}

// ════════════════════════════════════════════════════════════════════════════
// CASE 2 — Café Lisboa Lda (PT) · cafetaria de bairro, 6 colaboradores
// Perfil: forte no Social e circularidade, governança informal (início do caminho)
// ════════════════════════════════════════════════════════════════════════════
const cafelisboa = {
  email: 'demo.cafelisboa@lc-demo.com',
  name: 'Café Lisboa Lda (Demo)',
  country: 'PT',
  answers: {
    1:  { value: 'no' },
    2:  { fields: {
          fluessiggas: { value: '1200', unit: 'kWh' },
          elet_total:  { value: '9500', unit: 'kWh' },
          elet_renov:  { value: '55' },
          elet_auto:   { value: '0' },
        } },
    3:  { value: '210', unit: 'gCO₂/kWh' },
    4:  { value: 'no' },
    5:  { fields: { total: { value: '9', unit: 't CO₂' }, scope1: { value: '2', unit: 't CO₂' }, scope2: { value: '4', unit: 't CO₂' }, scope3: { value: '3', unit: 't CO₂' } } },
    6:  { value: 'no' },
    7:  { value: 'no' },
    8:  { value: '260', unit: 'm³' },
    9:  { fields: { total: { value: '6', unit: 't' }, total_recic: { value: '45' }, perigosos: { value: '0', unit: 't' }, perigosos_recic: { value: '0' } } },
    10: { na: 'unavailable' },
    11: { value: '6', unit: 'FTE' },
    12: { fields: { todos: { value: '67' }, liderancas: { value: '50' }, alta_gestao: { value: '100' }, controle: { value: '0' } } },
    13: { value: '0' },
    14: { fields: { com_afastamento: { value: '0' }, fatais: { value: '0' } } },
    15: { fields: { todos: { value: '1' }, por_iniciativa: { value: '1' } } },
    16: { value: '8', unit: 'horas' },
    17: { value: '150', unit: 'Euro' },
    18: { value: '1' },
    19: { value: '5', unit: 'anos' },
    20: { value: 'yes' },
    21: { value: 'yes' },
    22: { value: 'no' },
    23: { value: 'no' },
    24: { value: 'no' },
    25: { value: 'no' },
    26: { value: 'no' },
    27: { value: 'no' },
    28: { value: 'no' },
  },
  referenceYear: 2025,
  threshold: 3.5,
  topics: {
    residuos: { applicable: true, stakeholder: 5, company: 4, note: 'Clientes pedem menos descartáveis; desperdício alimentar.',
                goal: { baseline: '100% copos descartáveis', target: '100% compostáveis + retornáveis', deadline: '2026-12', how: 'Fornecedor local + desconto copo próprio' } },
    agua:     { applicable: true, stakeholder: 4, company: 4, note: 'Fatura de água pesa no custo fixo.',
                goal: { baseline: '260 m³/ano', target: '200 m³/ano', deadline: '2027-06', how: 'Torneiras temporizadas + máquina de lavar eficiente' } },
    clientes: { applicable: true, stakeholder: 5, company: 4, note: 'Alergénios, origem dos produtos, confiança do bairro.' },
    equipa:   { applicable: true, stakeholder: 4, company: 4, note: 'Reter a equipa num setor de alta rotatividade.',
                goal: { baseline: '8 h formação/ano', target: '16 h formação/ano', deadline: '2026-12', how: 'Formação de barista + segurança alimentar' } },
    clima:    { applicable: true, stakeholder: 3, company: 4, note: 'Tarifa de eletricidade verde em avaliação.' },
    formacao: { applicable: true, stakeholder: 4, company: 3 },
    comunid:  { applicable: true, stakeholder: 4, company: 3, note: 'Café de bairro: eventos e fornecedores locais.' },
    cadeia:   { applicable: true, stakeholder: 3, company: 2, note: 'Café de comércio justo já em uso.' },
    diversid: { applicable: true, stakeholder: 3, company: 3 },
    poluicao: { applicable: true, stakeholder: 3, company: 3 },
    conduta:  { applicable: true, stakeholder: 3, company: 3 },
    pagament: { applicable: true, stakeholder: 3, company: 2 },
    anticorr: { applicable: true, stakeholder: 2, company: 3 },
    transpar: { applicable: true, stakeholder: 2, company: 3 },
    riscos:   { applicable: true, stakeholder: 2, company: 2 },
    biodiv:   { applicable: false },
  },
}

// ════════════════════════════════════════════════════════════════════════════
// FASE 6 DO PLANO ESG — ano anterior (2024), dimensão financeira e projetos.
// ════════════════════════════════════════════════════════════════════════════

// GrünBau 2024: ligeiramente pior que 2025 (para os ▲▼ aparecerem nos KPIs)
gruenbau.prevYear = 2024
gruenbau.answersPrev = { ...gruenbau.answers,
  2:  { fields: { erdgas: { value: '13500', unit: 'kWh' }, diesel: { value: '3800', unit: 'Litros' }, benzin: { value: '700', unit: 'Litros' }, elet_total: { value: '36000', unit: 'kWh' }, elet_renov: { value: '48' }, elet_auto: { value: '10' } } },
  5:  { fields: { total: { value: '98', unit: 't CO₂' }, scope1: { value: '48', unit: 't CO₂' }, scope2: { value: '30', unit: 't CO₂' }, scope3: { value: '20', unit: 't CO₂' } } },
  6:  { value: 'no' },
  9:  { fields: { total: { value: '36', unit: 't' }, total_recic: { value: '45' }, perigosos: { value: '3', unit: 't' }, perigosos_recic: { value: '30' } } },
  12: { fields: { todos: { value: '18' }, liderancas: { value: '10' }, alta_gestao: { value: '0' }, controle: { value: '0' } } },
  14: { fields: { com_afastamento: { value: '3' }, fatais: { value: '0' } } },
  16: { value: '10', unit: 'horas' },
  22: { value: 'no' }, 23: { value: 'no' }, 28: { value: 'no' },
}
// Dimensão financeira dos temas materiais ("mais um matrix")
gruenbau.financials = {
  clima:    { impact: 4, investment: '50000', saving: '10700', note: 'Frota elétrica + fotovoltaico' },
  residuos: { impact: 3, investment: '6000', saving: '4000', note: 'Separação em obra reduz custos de deposição' },
  equipa:   { impact: 3, investment: '3500', saving: '', note: 'Formação de segurança + EPI' },
  anticorr: { impact: 2, investment: '', saving: '', note: 'Requisito para concursos públicos' },
}
gruenbau.projects = [
  { topic_key: 'clima', name: 'Frota elétrica (fase 1)', description: 'Substituição de 2 carrinhas a diesel por elétricas.', status: 'active', start_month: '2026-03', progress: 35, investment: 32000, annual_saving: 6500, expected_impact: '85 t CO₂ → 60 t CO₂' },
  { topic_key: 'clima', name: 'Fotovoltaico no armazém', description: 'Instalação de 30 kWp no telhado do armazém.', status: 'planned', start_month: '2026-09', progress: 0, investment: 18000, annual_saving: 4200, expected_impact: 'Autogeração 20% → 45%' },
  { topic_key: 'residuos', name: 'Separação de resíduos em obra', description: 'Contentores separados + parceiro de reciclagem.', status: 'active', start_month: '2026-01', progress: 60, investment: 6000, annual_saving: 4000, expected_impact: '58% → 80% reciclado' },
]

// Café Lisboa 2024: início do caminho (pior que 2025)
cafelisboa.prevYear = 2024
cafelisboa.answersPrev = { ...cafelisboa.answers,
  2:  { fields: { fluessiggas: { value: '1400', unit: 'kWh' }, elet_total: { value: '9800', unit: 'kWh' }, elet_renov: { value: '40' }, elet_auto: { value: '0' } } },
  5:  { fields: { total: { value: '11', unit: 't CO₂' }, scope1: { value: '3', unit: 't CO₂' }, scope2: { value: '5', unit: 't CO₂' }, scope3: { value: '3', unit: 't CO₂' } } },
  8:  { value: '290', unit: 'm³' },
  9:  { fields: { total: { value: '7', unit: 't' }, total_recic: { value: '30' }, perigosos: { value: '0', unit: 't' }, perigosos_recic: { value: '0' } } },
  16: { value: '4', unit: 'horas' },
  21: { value: 'no' },
}
cafelisboa.financials = {
  residuos: { impact: 3, investment: '1200', saving: '900', note: 'Compostáveis custam mais, mas retornáveis poupam' },
  agua:     { impact: 4, investment: '800', saving: '600', note: 'Fatura de água pesa no custo fixo' },
  equipa:   { impact: 2, investment: '500', saving: '', note: 'Formação barista reduz rotatividade' },
  clientes: { impact: 3, investment: '', saving: '', note: 'Confiança do bairro = receita recorrente' },
}
cafelisboa.projects = [
  { topic_key: 'residuos', name: 'Copos compostáveis + retornáveis', description: 'Fornecedor local + desconto para copo próprio.', status: 'active', start_month: '2026-04', progress: 50, investment: 1200, annual_saving: 900, expected_impact: '100% descartáveis → 100% compostáveis' },
  { topic_key: 'agua', name: 'Torneiras temporizadas', description: 'Torneiras temporizadas + máquina de lavar eficiente.', status: 'planned', start_month: '2026-10', progress: 0, investment: 800, annual_saving: 600, expected_impact: '260 m³ → 200 m³' },
]

// ════════════════════════════════════════════════════════════════════════════
// DADOS CONTÁBEIS (módulo Contabilidade) — genéricos, para demonstração.
// Meses cobertos: 2026-03 a 2026-07 (hoje = 2026-07). O gerador expande cada
// padrão mensal em lançamentos individuais no Livro de Caixa.
// ════════════════════════════════════════════════════════════════════════════
const ACC_MONTHS = ['2026-03', '2026-04', '2026-05', '2026-06', '2026-07']
const round2 = (n) => Math.round(n * 100) / 100
const vatOf = (gross, rate) => (rate > 0 ? round2(gross * rate / (100 + rate)) : 0)

// Expande padrões mensais (receita/despesa) em linhas de cash_entries.
// factors: variação por mês (comprimento = ACC_MONTHS.length) para dar realismo.
function buildEntries({ revenue = [], expense = [], factors }) {
  const rows = []
  ACC_MONTHS.forEach((period, mi) => {
    const f = factors ? factors[mi] : 1
    const dayFor = (i) => `${period}-${String(5 + i * 4).padStart(2, '0')}`
    revenue.forEach((r, i) => {
      if (r.skipMonths?.includes(mi)) return
      const amount = round2(r.amount * (r.flat ? 1 : f))
      rows.push({ entry_date: dayFor(i), doc: r.doc || null, description: r.desc, type: 'entrada',
        amount, destination: r.dest || 'banco', category: null, period,
        vat_rate: r.vat ?? null, vat_amount: r.vat ? vatOf(amount, r.vat) : null, quantity: r.qty ?? 1 })
    })
    expense.forEach((e, i) => {
      if (e.skipMonths?.includes(mi)) return
      const amount = round2(e.amount * (e.flat ? 1 : f))
      rows.push({ entry_date: dayFor(i + 2), doc: e.doc || null, description: e.desc, type: 'saida',
        amount, destination: e.dest || 'banco', category: e.cat, period,
        vat_rate: e.vat ?? null, vat_amount: e.vat ? vatOf(amount, e.vat) : null, quantity: 1 })
    })
  })
  return rows
}

// ── CASE 1 — GrünBau GmbH (DE, IVA 19% Regelbesteuerung) ──
const accGB = {
  settings: { vat_regime: 'normal', vat_default_rate: 19, ir_reserve_pct: 30, ss_regime: null, de_famv_limit: 565 },
  catalog: [
    { name: 'Neubau – Rohbau (Projekt)', kind: 'service', price: 18500 },
    { name: 'Altbausanierung (Rate)', kind: 'service', price: 9800 },
    { name: 'Energetische Modernisierung', kind: 'service', price: 6400 },
    { name: 'Nachhaltigkeitsberatung', kind: 'service', price: 2400 },
  ],
  clients: [
    { name: 'Stadtwerke München', country: 'DE', sector: 'Öffentlicher Sektor', service: 'acc' },
    { name: 'Wohnbau Genossenschaft eG', country: 'DE', sector: 'Immobilien', service: 'acc' },
    { name: 'Familie Weber (Privat)', country: 'DE', sector: 'Privatkunde', service: 'acc' },
  ],
  recurring: [
    { description: 'Miete Büro und Lager', category: 'renda', amount: 2200, periodicity: 'monthly', due_day: 5, destination: 'banco' },
    { description: 'Betriebshaftpflichtversicherung', category: 'seguros', amount: 380, periodicity: 'monthly', due_day: 8, destination: 'banco' },
    { description: 'Bau-Software (Lizenz)', category: 'software', amount: 120, periodicity: 'monthly', due_day: 10, destination: 'banco' },
    { description: 'Leasing Fuhrpark', category: 'auto', amount: 640, periodicity: 'monthly', due_day: 15, destination: 'banco' },
    { description: 'Steuerberatung', category: 'honorarios', amount: 450, periodicity: 'monthly', due_day: 20, destination: 'banco' },
  ],
  obligations: [
    { obligation_type: 'Umsatzsteuer-Voranmeldung', client: null, country: 'DE', deadline: '2026-08-10', status: 'pending' },
    { obligation_type: 'Gewerbesteuer-Vorauszahlung', client: null, country: 'DE', deadline: '2026-08-15', status: 'pending' },
    { obligation_type: 'Umsatzsteuer-Voranmeldung', client: null, country: 'DE', deadline: '2026-07-10', status: 'done' },
  ],
  entries: buildEntries({
    factors: [0.92, 1.05, 0.98, 1.12, 0.6], // julho parcial (mês corrente)
    revenue: [
      { desc: 'Bauprojekt – Abschlagszahlung', doc: 'RE-2026', amount: 18500, dest: 'banco', vat: 19 },
      { desc: 'Altbausanierung – Rate', doc: 'RE-2027', amount: 9800, dest: 'banco', vat: 19 },
      { desc: 'Energieberatung', doc: 'RE-2028', amount: 2400, dest: 'banco', vat: 19, skipMonths: [1, 4] },
    ],
    expense: [
      { desc: 'Baustoffe (Zement, Stahl, Holz)', cat: 'material', amount: 8200, dest: 'banco', vat: 19 },
      { desc: 'Löhne und Gehälter', cat: 'outros', amount: 14500, dest: 'banco', flat: true },
      { desc: 'Diesel Fuhrpark', cat: 'auto', amount: 950, dest: 'caixa', vat: 19 },
      { desc: 'Werkzeug und Maschinen', cat: 'equipamentos', amount: 1800, dest: 'banco', vat: 19, skipMonths: [0, 2, 4] },
    ],
  }),
  plan: {
    monthly_fixed: 3790, productive_hours: 640, reserve_basis: 'gewinn',
    items: [
      { name: 'Neubau – Rohbau', durationMin: '4800', price: '18500', qty: '1', material: '8200' },
      { name: 'Altbausanierung', durationMin: '2400', price: '9800', qty: '1', material: '3900' },
      { name: 'Energetische Modernisierung', durationMin: '1600', price: '6400', qty: '1', material: '2600' },
      { name: 'Nachhaltigkeitsberatung', durationMin: '480', price: '2400', qty: '2', material: '0' },
    ],
  },
}

// ── CASE 2 — Café Lisboa Lda (PT, IVA 23%/13% regime normal) ──
const accCL = {
  settings: { vat_regime: 'normal', vat_default_rate: 23, ir_reserve_pct: 25, ss_regime: null },
  catalog: [
    { name: 'Café expresso', kind: 'product', price: 0.90 },
    { name: 'Galão / Cappuccino', kind: 'product', price: 1.60 },
    { name: 'Tosta mista', kind: 'product', price: 3.20 },
    { name: 'Bolo do dia', kind: 'product', price: 2.50 },
    { name: 'Menu almoço', kind: 'product', price: 8.50 },
  ],
  clients: [
    { name: 'Coworking Baixa (coffee breaks)', country: 'PT', sector: 'Serviços', service: 'acc' },
    { name: 'Advogados Ribeiro & Sá, Lda', country: 'PT', sector: 'Serviços', service: 'acc' },
  ],
  recurring: [
    { description: 'Renda do espaço', category: 'renda', amount: 1350, periodicity: 'monthly', due_day: 5, destination: 'banco' },
    { description: 'Eletricidade', category: 'outros', amount: 340, periodicity: 'monthly', due_day: 12, destination: 'banco' },
    { description: 'Seguro do estabelecimento', category: 'seguros', amount: 90, periodicity: 'monthly', due_day: 8, destination: 'banco' },
    { description: 'Avença de contabilidade', category: 'honorarios', amount: 180, periodicity: 'monthly', due_day: 20, destination: 'banco' },
    { description: 'Licença de esplanada', category: 'impostos', amount: 240, periodicity: 'annual', due_day: 31, destination: 'banco' },
  ],
  obligations: [
    { obligation_type: 'IVA – Declaração periódica', client: null, country: 'PT', deadline: '2026-08-20', status: 'pending' },
    { obligation_type: 'Pagamento por conta (IRC)', client: null, country: 'PT', deadline: '2026-07-31', status: 'pending' },
    { obligation_type: 'Retenção na fonte (DMR)', client: null, country: 'PT', deadline: '2026-07-20', status: 'done' },
  ],
  entries: buildEntries({
    factors: [0.9, 1.0, 1.08, 1.15, 0.62], // verão mais forte; julho parcial
    revenue: [
      { desc: 'Vendas – cafetaria (balcão)', amount: 7200, dest: 'caixa', vat: 13 },
      { desc: 'Vendas – take-away e retalho', amount: 2600, dest: 'caixa', vat: 23 },
      { desc: 'Catering / coffee break (evento)', amount: 850, dest: 'banco', vat: 13, skipMonths: [0, 3] },
    ],
    expense: [
      { desc: 'Fornecedor de café e leite', cat: 'material', amount: 1400, dest: 'banco', vat: 23 },
      { desc: 'Padaria e pastelaria', cat: 'material', amount: 1100, dest: 'banco', vat: 13 },
      { desc: 'Ordenados (2 colaboradores)', cat: 'outros', amount: 2600, dest: 'banco', flat: true },
      { desc: 'Produtos de limpeza', cat: 'limpeza', amount: 130, dest: 'caixa', vat: 23 },
    ],
  }),
  plan: {
    monthly_fixed: 1960, productive_hours: 360, reserve_basis: 'umsatz',
    items: [
      { name: 'Café expresso', durationMin: '3', price: '0.90', qty: '2200', material: '0.18' },
      { name: 'Galão / Cappuccino', durationMin: '5', price: '1.60', qty: '900', material: '0.42' },
      { name: 'Tosta mista', durationMin: '8', price: '3.20', qty: '380', material: '1.10' },
      { name: 'Menu almoço', durationMin: '15', price: '8.50', qty: '260', material: '3.40' },
    ],
  },
}

const ACC_BY_EMAIL = {
  'demo.gruenbau@lc-demo.com': accGB,
  'demo.cafelisboa@lc-demo.com': accCL,
}

// Semeia o módulo de Contabilidade. Idempotente: limpa as linhas de demo antes
// de reinserir (estas tabelas não têm chave única por utilizador).
async function seedAccounting(uid, demo) {
  const acc = ACC_BY_EMAIL[demo.email]
  if (!acc) return
  for (const tbl of ['cash_entries', 'catalog_items', 'recurring_expenses', 'clients', 'fiscal_obligations']) {
    const { error } = await admin.from(tbl).delete().eq('user_id', uid)
    if (error) throw new Error(`limpar ${tbl}: ${error.message}`)
  }
  const withUid = (arr) => arr.map((r) => ({ ...r, user_id: uid }))
  const steps = [
    ['catálogo', admin.from('catalog_items').insert(withUid(acc.catalog))],
    ['clientes', admin.from('clients').insert(withUid(acc.clients))],
    ['despesas recorrentes', admin.from('recurring_expenses').insert(withUid(acc.recurring))],
    ['obrigações fiscais', admin.from('fiscal_obligations').insert(withUid(acc.obligations.map((o) => ({ ...o, source: 'manual' }))))],
    ['livro de caixa', admin.from('cash_entries').insert(withUid(acc.entries))],
    ['planeamento mensal', admin.from('monthly_plans').upsert({ user_id: uid, ...acc.plan, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })],
  ]
  for (const [label, promise] of steps) {
    const { error } = await promise
    if (error) throw new Error(`${label}: ${error.message}`)
    console.log(`  ✓ contab.: ${label}`)
  }
}

// ── execução ──
async function findUserByEmail(email) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw error
  return data.users.find(u => u.email === email) || null
}

async function seed(demo) {
  console.log(`\n── ${demo.name} (${demo.email}) ──`)
  let user = await findUserByEmail(demo.email)
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email: demo.email, password: PASSWORD, email_confirm: true,
      user_metadata: { display_name: demo.name },
    })
    if (error) throw error
    user = data.user
    console.log('  ✓ utilizador criado')
  } else {
    console.log('  • utilizador já existia (atualizo os dados)')
  }
  const uid = user.id

  const acc = ACC_BY_EMAIL[demo.email]
  // Materialidade: junta a dimensão financeira aos temas (fase 3 do plano ESG)
  const topics = { ...demo.topics }
  Object.entries(demo.financials || {}).forEach(([key, fin]) => {
    topics[key] = { ...(topics[key] || {}), financial: fin }
  })
  const steps = [
    // Acesso às duas plataformas (Contabilidade + ESG)
    ['perfil (both)',       admin.from('profiles').upsert({ id: uid, role: 'user', platform: 'both' })],
    ['dados da empresa',    admin.from('company_settings').upsert({ user_id: uid, company_name: demo.name, country: demo.country, updated_at: new Date().toISOString(), ...(acc?.settings || {}) }, { onConflict: 'user_id' })],
    // Multi-ano (requer migração 024): ano de referência + ano anterior
    [`diagnóstico ${demo.referenceYear}`, admin.from('esg_diagnostics').upsert({ user_id: uid, reference_year: demo.referenceYear, answers: demo.answers, updated_at: new Date().toISOString() }, { onConflict: 'user_id,reference_year' })],
    [`diagnóstico ${demo.prevYear}`,      admin.from('esg_diagnostics').upsert({ user_id: uid, reference_year: demo.prevYear, answers: demo.answersPrev, updated_at: new Date().toISOString() }, { onConflict: 'user_id,reference_year' })],
    ['materialidade (16 T + financeiro)', admin.from('esg_materiality').upsert({ user_id: uid, topics, threshold: demo.threshold, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })],
  ]
  for (const [label, promise] of steps) {
    const { error } = await promise
    if (error) throw new Error(`${label}: ${error.message}`)
    console.log(`  ✓ ${label}`)
  }
  // Projetos ESG (limpa e reinsere — idempotente)
  {
    const { error: e1 } = await admin.from('esg_projects').delete().eq('user_id', uid)
    if (e1) throw new Error(`limpar esg_projects: ${e1.message}`)
    const { error: e2 } = await admin.from('esg_projects').insert((demo.projects || []).map(p => ({ ...p, user_id: uid })))
    if (e2) throw new Error(`projetos ESG: ${e2.message}`)
    console.log(`  ✓ projetos ESG (${(demo.projects || []).length})`)
  }
  await seedAccounting(uid, demo)
}

try {
  await seed(gruenbau)
  await seed(cafelisboa)
  console.log(`\nConcluído ✓  Password de ambos: ${PASSWORD}`)
} catch (e) {
  console.error('\nERRO:', e.message)
  process.exit(1)
}
