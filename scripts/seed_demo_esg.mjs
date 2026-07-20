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

  const steps = [
    ['perfil (ESG)',        admin.from('profiles').upsert({ id: uid, role: 'user', platform: 'esg' })],
    ['dados da empresa',    admin.from('company_settings').upsert({ user_id: uid, company_name: demo.name, country: demo.country, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })],
    ['diagnóstico (28 Q)',  admin.from('esg_diagnostics').upsert({ user_id: uid, reference_year: demo.referenceYear, answers: demo.answers, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })],
    ['materialidade (16 T)', admin.from('esg_materiality').upsert({ user_id: uid, topics: demo.topics, threshold: demo.threshold, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })],
  ]
  for (const [label, promise] of steps) {
    const { error } = await promise
    if (error) throw new Error(`${label}: ${error.message}`)
    console.log(`  ✓ ${label}`)
  }
}

try {
  await seed(gruenbau)
  await seed(cafelisboa)
  console.log(`\nConcluído ✓  Password de ambos: ${PASSWORD}`)
} catch (e) {
  console.error('\nERRO:', e.message)
  process.exit(1)
}
