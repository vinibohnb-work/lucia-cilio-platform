// ============================================================================
// Cálculo de KPIs ESG a partir das respostas do diagnóstico (esg_diagnostics.answers).
// A forma das respostas é a mesma gravada por Diagnostico.jsx:
//   answers[qId] = { na, value, unit }                         (simples)
//   answers[qId] = { na, fields: { key: { value, unit } } }    (grupo)
// Os KPIs são sempre calculados a partir de dados reais (sem fallback fictício).
// ============================================================================
import { ESG_QUESTIONS, questionsByPillar } from '../data/esgQuestions'

const n = (v) => {
  if (v === undefined || v === null || v === '') return null
  const x = Number(String(v).replace(',', '.'))
  return Number.isFinite(x) ? x : null
}

export function simpleVal(answers, id) {
  const a = answers?.[id]; if (!a || a.na) return null
  return a.value ?? null
}
export function fieldVal(answers, id, key) {
  const a = answers?.[id]; if (!a || a.na) return null
  return a.fields?.[key]?.value ?? null
}
export function fieldUnit(answers, id, key, fallback) {
  const a = answers?.[id]
  return a?.fields?.[key]?.unit ?? fallback
}
export function simpleUnit(answers, id, fallback) {
  return answers?.[id]?.unit ?? fallback
}

// bool → 'yes' | 'no' | 'planned' | null
const boolVal = (answers, id) => simpleVal(answers, id) || null

export function isAnswered(answers, q) {
  const a = answers?.[q.id]; if (!a) return false
  if (a.na) return true
  if (q.type === 'group') return q.fields.some(f => { const v = a.fields?.[f.key]?.value; return v !== undefined && v !== '' })
  return a.value !== undefined && a.value !== '' && a.value !== null
}

export function computeKpis(answers) {
  const env = {
    co2Total: n(fieldVal(answers, 5, 'total')),
    scope1: n(fieldVal(answers, 5, 'scope1')),
    scope2: n(fieldVal(answers, 5, 'scope2')),
    scope3: n(fieldVal(answers, 5, 'scope3')),
    elecTotal: n(fieldVal(answers, 2, 'elet_total')),
    elecRenewPct: n(fieldVal(answers, 2, 'elet_renov')),
    elecSelfPct: n(fieldVal(answers, 2, 'elet_auto')),
    elecCo2: n(simpleVal(answers, 3)),
    water: n(simpleVal(answers, 8)), waterUnit: simpleUnit(answers, 8, 'm³'),
    wasteTotal: n(fieldVal(answers, 9, 'total')), wasteUnit: fieldUnit(answers, 9, 'total', 't'),
    wasteRecycPct: n(fieldVal(answers, 9, 'total_recic')),
    hazardous: n(fieldVal(answers, 9, 'perigosos')),
    hazardousRecycPct: n(fieldVal(answers, 9, 'perigosos_recic')),
    taxEligiblePct: n(fieldVal(answers, 10, 'elegivel')),
    taxAlignedPct: n(fieldVal(answers, 10, 'alinhado')),
    hasTarget: boolVal(answers, 6),
    compensates: boolVal(answers, 7),
    ecoInvest: boolVal(answers, 4),
    opportunity: boolVal(answers, 1),
  }
  // nº de fontes de energia com consumo declarado (Q2)
  const q2 = answers?.[2]?.fields || {}
  env.energySources = Object.values(q2).filter(f => n(f?.value) != null && n(f?.value) > 0).length

  const social = {
    employees: n(simpleVal(answers, 11)),
    womenAll: n(fieldVal(answers, 12, 'todos')),
    womenLead: n(fieldVal(answers, 12, 'liderancas')),
    womenTop: n(fieldVal(answers, 12, 'alta_gestao')),
    womenControl: n(fieldVal(answers, 12, 'controle')),
    payGap: n(simpleVal(answers, 13)),
    accidents: n(fieldVal(answers, 14, 'com_afastamento')),
    accidentsFatal: n(fieldVal(answers, 14, 'fatais')),
    dismissals: n(fieldVal(answers, 15, 'todos')),
    dismissalsVol: n(fieldVal(answers, 15, 'por_iniciativa')),
    trainingHours: n(simpleVal(answers, 16)),
    trainingCost: n(simpleVal(answers, 17)),
  }

  // Governança: perguntas qualitativas Q20–Q28 (Q23 é Sim/Não/Planeado)
  const govDefs = [
    { id: 20, key: 'owners_mgmt' }, { id: 21, key: 'controller_mgmt' }, { id: 22, key: 'audit' },
    { id: 23, key: 'sust_data' }, { id: 24, key: 'esg_decisions' }, { id: 25, key: 'esg_pay' },
    { id: 26, key: 'certifications' }, { id: 27, key: 'anticorruption' }, { id: 28, key: 'compliance' },
  ]
  const checklist = govDefs.map(d => ({ ...d, value: boolVal(answers, d.id) }))
  const score = checklist.reduce((s, c) => s + (c.value === 'yes' ? 1 : c.value === 'planned' ? 0.5 : 0), 0)
  const gov = {
    owners: n(simpleVal(answers, 18)),
    yearsInvolved: n(simpleVal(answers, 19)),
    checklist,
    maturityPct: Math.round((score / govDefs.length) * 100),
  }

  const completeness = {
    E: { done: questionsByPillar('E').filter(q => isAnswered(answers, q)).length, total: questionsByPillar('E').length },
    S: { done: questionsByPillar('S').filter(q => isAnswered(answers, q)).length, total: questionsByPillar('S').length },
    G: { done: questionsByPillar('G').filter(q => isAnswered(answers, q)).length, total: questionsByPillar('G').length },
    all: { done: ESG_QUESTIONS.filter(q => isAnswered(answers, q)).length, total: ESG_QUESTIONS.length },
  }

  return { env, social, gov, completeness }
}
