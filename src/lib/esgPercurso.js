// Percurso da consultoria ESG — as fases e o estado de cada uma.
//
// Reunião de 10/09: a ESG passa a ter a mesma espinha das outras consultorias
// (materialidade → diagnóstico → KPIs → projetos → relatório), com visualização
// própria. Os cinco módulos já existiam; o que faltava era o fio que os liga e
// a resposta a "em que ponto estou e o que faço a seguir".
//
// Nada aqui inventa estado novo: cada fase é medida a partir dos dados que os
// módulos já gravam. O que não é medível não é fingido — a fase dos KPIs, por
// exemplo, conta os indicadores que já têm valor, porque os KPIs são leitura do
// diagnóstico e não têm dados próprios.

import { ESG_TOPICS, isMaterial } from '../data/esgTopics'
import { ESG_QUESTIONS } from '../data/esgQuestions'
import { isAnswered, computeKpis } from './esgKpis'

// `rota` é relativa ao caso: /gestao/esg/:id/<rota> na Gestão, /esg/<rota> no cliente.
export const FASES = [
  { key: 'materialidade', n: 1, rota: 'materialidade',
    pt: 'Materialidade', de: 'Wesentlichkeit', en: 'Materiality',
    subPt: 'O que importa a este negócio', subDe: 'Was für dieses Unternehmen zählt', subEn: 'What matters to this business' },
  { key: 'diagnostico', n: 2, rota: 'diagnostico',
    pt: 'Diagnóstico', de: 'Diagnose', en: 'Diagnosis',
    subPt: 'Os números de partida', subDe: 'Die Ausgangszahlen', subEn: 'The starting numbers' },
  { key: 'kpis', n: 3, rota: 'kpis',
    pt: 'Indicadores', de: 'Kennzahlen', en: 'Indicators',
    subPt: 'O que os números dizem', subDe: 'Was die Zahlen sagen', subEn: 'What the numbers say' },
  { key: 'projetos', n: 4, rota: 'projetos',
    pt: 'Projetos', de: 'Projekte', en: 'Projects',
    subPt: 'O que vai mudar, e quanto custa', subDe: 'Was sich ändert und was es kostet', subEn: 'What will change, and what it costs' },
  { key: 'relatorio', n: 5, rota: 'relatorios',
    pt: 'Relatório', de: 'Bericht', en: 'Report',
    subPt: 'O que se entrega', subDe: 'Was übergeben wird', subEn: 'What gets delivered' },
]

export const rotuloFase = (f, lang) => f[lang] || f.pt
export const subFase = (f, lang) =>
  lang === 'de' ? f.subDe : lang === 'en' ? f.subEn : f.subPt

// As oito leituras de topo do relatório — é o que se conta na fase 3.
const KPIS_TOPO = [
  (k) => k.env.co2Total,
  (k) => k.env.elecRenewPct,
  (k) => k.env.water,
  (k) => k.env.wasteRecycPct,
  (k) => k.social.employees,
  (k) => k.social.womenAll,
  (k) => k.social.trainingHours,
  // A maturidade de governança é uma percentagem calculada: dá 0 mesmo sem
  // nada respondido, por isso só conta quando há respostas do pilar G.
  (k) => k.completeness.G.done > 0 ? k.gov.maturityPct : null,
]

const SECCOES_RELATORIO = ['materialidade', 'diagnostico', 'projetos', 'kpis']

// Um tema está tratado quando foi decidido: ou não se aplica, ou foi pontuado
// nos dois eixos. Deixar em branco não conta.
const temaTratado = (e) =>
  e?.applicable === false || (!!e?.applicable && Number(e.stakeholder) > 0 && Number(e.company) > 0)

const faseDe = (feitas, total, extra = {}) => ({
  feitas, total,
  pct: total > 0 ? Math.round((feitas / total) * 100) : 0,
  estado: feitas === 0 ? 'vazio' : feitas >= total ? 'pronto' : 'curso',
  ...extra,
})

/**
 * Estado das cinco fases.
 *   materiality — linha de esg_materiality ({ topics, threshold })
 *   diagnostic  — linha de esg_diagnostics do ano ({ answers })
 *   projects    — linhas de esg_projects
 *   report      — linha de esg_reports do ano ({ sections })
 */
export function progressoESG({ materiality, diagnostic, projects = [], report } = {}) {
  const topics = materiality?.topics || {}
  const limiar = Number(materiality?.threshold) || 3.5
  const answers = diagnostic?.answers || {}
  const seccoes = report?.sections || {}

  // 1 · Materialidade
  const tratados = ESG_TOPICS.filter(tp => temaTratado(topics[tp.key])).length
  const materiais = ESG_TOPICS.filter(tp => isMaterial(topics[tp.key], limiar))
  const materialidade = faseDe(tratados, ESG_TOPICS.length, { materiais: materiais.length })

  // 2 · Diagnóstico
  const respondidas = ESG_QUESTIONS.filter(q => isAnswered(answers, q)).length
  const diagnostico = faseDe(respondidas, ESG_QUESTIONS.length)

  // 3 · Indicadores — leitura do diagnóstico, por isso conta-se o que já tem valor
  const k = computeKpis(answers)
  const comValor = KPIS_TOPO.filter(ler => {
    const v = ler(k)
    return v != null && !Number.isNaN(Number(v))
  }).length
  const kpis = faseDe(comValor, KPIS_TOPO.length)

  // 4 · Projetos — a meta é cada tema material ter pelo menos um projeto
  const comProjeto = new Set(projects.map(p => p.topic_key).filter(Boolean))
  const materiaisComProjeto = materiais.filter(tp => comProjeto.has(tp.key)).length
  const projetos = materiais.length
    ? faseDe(materiaisComProjeto, materiais.length, { total_projetos: projects.length })
    : { feitas: 0, total: 0, pct: 0, estado: 'espera', total_projetos: projects.length }

  // 5 · Relatório
  const escritas = SECCOES_RELATORIO.filter(s => String(seccoes[s] || '').trim()).length
  const relatorio = faseDe(escritas, SECCOES_RELATORIO.length)

  const fases = { materialidade, diagnostico, kpis, projetos, relatorio }

  // A próxima é a primeira que ainda não está pronta (e que não está à espera
  // de outra). Se estiver tudo pronto, não há próxima.
  const proxima = FASES.find(f => {
    const e = fases[f.key].estado
    return e === 'vazio' || e === 'curso'
  })?.key || null

  const somaPct = FASES.reduce((s, f) => s + (fases[f.key].estado === 'espera' ? 0 : fases[f.key].pct), 0)

  return { ...fases, proxima, pctGeral: Math.round(somaPct / FASES.length) }
}
