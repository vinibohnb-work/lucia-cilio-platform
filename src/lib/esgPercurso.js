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
import { PERGUNTAS_ARRANQUE, respostasArranque, preenchido } from '../data/esgMetodo'

// `rota` é relativa ao caso: /gestao/esg/:id/<rota> na Gestão, /esg/<rota> no cliente.
// Ordem do método da Lúcia (documento de 15/10): COMPREENDER → DIAGNOSTICAR →
// PRIORIZAR → AGIR → MEDIR → EVOLUIR, e por fim o relatório ("o relatório é o
// resultado de um processo; não deve ser o processo"). Antes (10/09) a
// materialidade vinha antes do diagnóstico.
export const FASES = [
  { key: 'arranque', n: 1, rota: 'arranque',
    pt: 'Arranque', de: 'Start', en: 'Kick-off',
    subPt: 'Perceber o negócio', subDe: 'Das Unternehmen verstehen', subEn: 'Understand the business' },
  { key: 'diagnostico', n: 2, rota: 'diagnostico',
    pt: 'Diagnóstico', de: 'Diagnose', en: 'Diagnosis',
    subPt: 'Onde estamos', subDe: 'Wo wir stehen', subEn: 'Where we stand' },
  { key: 'materialidade', n: 3, rota: 'materialidade',
    pt: 'Materialidade', de: 'Wesentlichkeit', en: 'Materiality',
    subPt: 'O que realmente importa', subDe: 'Was wirklich zählt', subEn: 'What really matters' },
  { key: 'projetos', n: 4, rota: 'projetos',
    pt: 'Plano de ação', de: 'Maßnahmenplan', en: 'Action plan',
    subPt: 'Onde queremos chegar, e quanto custa', subDe: 'Wohin wir wollen und was es kostet', subEn: 'Where we want to get, and what it costs' },
  { key: 'kpis', n: 5, rota: 'kpis',
    pt: 'Indicadores', de: 'Kennzahlen', en: 'Indicators',
    subPt: 'Estamos a avançar?', subDe: 'Kommen wir voran?', subEn: 'Are we making progress?' },
  { key: 'acompanhamento', n: 6, rota: 'acompanhamento',
    pt: 'Acompanhamento', de: 'Begleitung', en: 'Follow-up',
    subPt: 'O que mudou, e o próximo passo', subDe: 'Was sich verändert hat, und der nächste Schritt', subEn: 'What changed, and the next step' },
  { key: 'relatorio', n: 7, rota: 'relatorios',
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
 * Estado das sete fases.
 *   caso        — linha de esg_consultorias (o método, migração 046). Sem caso
 *                 (ex.: a ficha do cliente), o arranque e o acompanhamento não
 *                 contam para o progresso nem para a "próxima fase".
 *   materiality — linha de esg_materiality ({ topics, threshold })
 *   diagnostic  — linha de esg_diagnostics do ano ({ answers })
 *   projects    — linhas de esg_projects
 *   report      — linha de esg_reports do ano ({ sections })
 */
export function progressoESG({ materiality, diagnostic, projects = [], report, caso } = {}) {
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

  // Arranque e acompanhamento — do método (esg_consultorias.metodo)
  const metodo = caso?.metodo || {}
  const ausente = { feitas: 0, total: 0, pct: 0, estado: 'espera', ausente: true }
  const arranque = caso ? faseDe(respostasArranque(metodo), PERGUNTAS_ARRANQUE.length) : ausente
  const acompanhamento = caso
    ? faseDe([(metodo.reunioes || []).length > 0, (metodo.feedback || []).length > 0, preenchido(metodo.avaliacao?.proximo)].filter(Boolean).length, 3)
    : ausente

  const fases = { arranque, diagnostico, materialidade, projetos, kpis, acompanhamento, relatorio }

  // A próxima é a primeira que ainda não está pronta (e que não está à espera
  // de outra). Se estiver tudo pronto, não há próxima.
  const proxima = FASES.find(f => {
    const e = fases[f.key].estado
    return e === 'vazio' || e === 'curso'
  })?.key || null

  const contam = FASES.filter(f => !fases[f.key].ausente)
  const somaPct = contam.reduce((s, f) => s + (fases[f.key].estado === 'espera' ? 0 : fases[f.key].pct), 0)

  return { ...fases, proxima, pctGeral: Math.round(somaPct / Math.max(1, contam.length)) }
}

// ── Ano de referência de um caso ────────────────────────────────────────────
// Uma regra para todos os ecrãs (R-B9): o ano mais recente com diagnóstico
// preenchido; sem nenhum, o ano corrente. Antes o Percurso usava sempre o ano
// corrente e o resto o mais recente — o mesmo caso mostrava progressos diferentes.
export function anoDeReferencia(diagnosticos = []) {
  const anos = diagnosticos
    .filter(d => d && Object.keys(d.answers || {}).length)
    .map(d => Number(d.reference_year)).filter(Boolean)
  return anos.length ? Math.max(...anos) : new Date().getFullYear()
}
