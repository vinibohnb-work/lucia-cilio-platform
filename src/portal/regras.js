// Portal · Portal de gestão de clientes — as regras do documento da Lúcia e da Letícia.
//
// Tudo o que aqui está vem do documento "Portal gestão de clientes" (22/09):
// os campos do cabeçalho, os oito estados das obrigações, a checklist de nove
// passos, os quatro estados dos documentos, os seis modelos de WhatsApp e o
// processo "cliente → regime → obrigação → tarefa → entrega → comprovativo →
// comunicação → pagamento → arquivo".
//
// O calendário fiscal é uma ESTIMATIVA com prazos habituais — serve para gerar
// o ponto de partida, que a Lúcia ajusta cliente a cliente.

export const PAISES = { PT: 'Portugal', DE: 'Alemanha' }

export const FORMAS = {
  PT: ['ENI (em nome individual)', 'Unipessoal Lda', 'Lda', 'SA'],
  DE: ['Einzelunternehmen', 'Freiberufler', 'GbR', 'UG (haftungsbeschränkt)', 'GmbH'],
}
const eSociedade = (c) => /Lda|SA$|GmbH|UG/.test(c.forma || '')
const eFreiberufler = (c) => /Freiberufler/.test(c.forma || '')

export const REGIMES = {
  PT: [['normal', 'IVA — regime normal'], ['isento', 'Isento de IVA (art. 53.º)']],
  DE: [['regel', 'Regelbesteuerung'], ['klein', 'Kleinunternehmer (§ 19 UStG)']],
}
export const rotuloRegime = (c) => (REGIMES[c.pais] || []).find(([k]) => k === c.regime)?.[1] || '—'

export const SOFTWARE = ['TOConline', 'Lexware', 'DATEV', 'sevDesk', 'Outro']

export const SERVICOS = [
  ['contabilidade', 'Contabilidade'], ['esg', 'ESG'], ['consultoria', 'Consultoria'], ['organizacao', 'Organização administrativa'],
]
export const rotuloServico = (k) => SERVICOS.find(([x]) => x === k)?.[1] || k

export const PERIODICIDADES = [['mensal', 'Mensal'], ['trimestral', 'Trimestral'], ['anual', 'Anual']]
export const rotuloPeriodicidade = (k) => PERIODICIDADES.find(([x]) => x === k)?.[1] || k

export const ESTADOS_CLIENTE = {
  ativo:      { rotulo: 'Ativo',      tom: 'ok' },
  onboarding: { rotulo: 'Onboarding', tom: 'aviso' },
  pausado:    { rotulo: 'Pausado',    tom: 'neutro' },
  inativo:    { rotulo: 'Inativo',    tom: 'neutro' },
}

// Os oito estados do documento. "Em atraso" também é calculado pela data:
// uma obrigação por fechar com o prazo passado aparece em atraso mesmo que
// ninguém o marque — é a forma de a lista não mentir.
export const ESTADOS_OBRIG = {
  por_preparar:  { rotulo: 'Por preparar',          tom: 'neutro' },
  aguardar_docs: { rotulo: 'A aguardar documentos', tom: 'aviso' },
  em_preparacao: { rotulo: 'Em preparação',         tom: 'aviso' },
  em_revisao:    { rotulo: 'Em revisão',            tom: 'azul' },
  entregue:      { rotulo: 'Entregue',              tom: 'ok' },
  pago:          { rotulo: 'Pago',                  tom: 'ok' },
  em_atraso:     { rotulo: 'Em atraso',             tom: 'erro' },
  nao_aplicavel: { rotulo: 'Não aplicável',         tom: 'neutro' },
}
export const FECHADOS = ['entregue', 'pago', 'nao_aplicavel']
export function estadoEfetivo(o, hoje = hojeIso()) {
  if (!FECHADOS.includes(o.estado) && o.prazo < hoje) return 'em_atraso'
  return o.estado
}

export const CHECKLIST = [
  ['docs_recebidos', 'Documentos recebidos'],
  ['docs_verificados', 'Documentos verificados'],
  ['contab_atualizada', 'Contabilidade atualizada'],
  ['reconciliacao', 'Reconciliação concluída'],
  ['decl_revista', 'Declaração revista'],
  ['decl_submetida', 'Declaração submetida'],
  ['comprov_arquivado', 'Comprovativo arquivado'],
  ['cliente_informado', 'Cliente informado'],
  ['pagamento_confirmado', 'Pagamento confirmado'],
]

export const ESTADOS_DOC = {
  em_falta:   { rotulo: 'Em falta',   tom: 'erro' },
  recebido:   { rotulo: 'Recebido',   tom: 'azul' },
  em_analise: { rotulo: 'Em análise', tom: 'aviso' },
  validado:   { rotulo: 'Validado',   tom: 'ok' },
}
export const TIPOS_DOC = ['Faturas de venda', 'Faturas de compra', 'Extrato bancário', 'Recibos e despesas', 'Salários', 'Comprovativo', 'Outro']
export const docsEsperados = (c) => ['Faturas de venda', 'Faturas de compra', 'Extrato bancário', ...(c.trabalhadores ? ['Salários'] : [])]

export const ESTADOS_TAREFA = {
  pendente:  { rotulo: 'Pendente',  tom: 'neutro' },
  em_curso:  { rotulo: 'Em curso',  tom: 'aviso' },
  concluida: { rotulo: 'Concluída', tom: 'ok' },
}
export const RECORRENCIAS = [['nenhuma', 'Não se repete'], ['mensal', 'Mensal'], ['trimestral', 'Trimestral'], ['anual', 'Anual']]

export const TIPOS_NOTA = {
  nota:       { rotulo: 'Nota interna',               icone: '📝' },
  duvida:     { rotulo: 'Dúvida / assunto pendente',  icone: '❓' },
  contacto:   { rotulo: 'Contacto registado',         icone: '📞' },
  esclarecer: { rotulo: 'A esclarecer com…',          icone: '⚖️' },
}
export const ESCLARECER_COM = ['Contabilista', 'Steuerberater', 'Advogado']

// ── Datas ──────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0')
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const hojeIso = () => iso(new Date())
export const dataDe = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
export const somaDias = (s, n) => { const d = dataDe(s); d.setDate(d.getDate() + n); return iso(d) }
export const somaMeses = (s, n) => { const d = dataDe(s); const dia = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); const ult = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(dia, ult)); return iso(d) }
export const diasAte = (s, hoje = hojeIso()) => Math.round((dataDe(s) - dataDe(hoje)) / 86400000)
const MESES = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.']
export const MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
export const fmtData = (s) => { if (!s) return '—'; const d = dataDe(s); return `${pad(d.getDate())} ${MESES[d.getMonth()]} ${d.getFullYear()}` }
export const fmtDataCurta = (s) => { if (!s) return '—'; const d = dataDe(s); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}` }
// pt-PT não agrupa milhares abaixo de 10 000 por omissão ("1245,00"); o mockup mostra "1.245,00".
export const fmtEur = (v) => v == null || v === '' ? '—' : `€ ${Number(v).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' })}`

// ── Calendário fiscal por cliente ─────────────────────────────────────────
// Critérios do documento: país, forma jurídica, regime, periodicidade,
// trabalhadores e serviços. `ano` é o ano FISCAL: as declarações anuais de
// 2026 aparecem no calendário de 2026, com prazo em 2027 (como no mockup).
const dia = (y, m, d) => { const ult = new Date(y, m, 0).getDate(); return `${y}-${pad(m)}-${pad(Math.min(d, ult))}` }
const mesSeguinte = (y, m, k = 1) => { const t = (m - 1) + k; return [y + Math.floor(t / 12), (t % 12) + 1] }

export function gerarCalendario(c, ano) {
  if (!(c.servicos || []).includes('contabilidade')) return []
  const out = []
  const push = (codigo, nome, periodo, prazo, extra = {}) => out.push({ codigo: `${codigo}-${periodo}`, nome, periodo, prazo, ...extra })
  const trimestres = [1, 2, 3, 4]
  const meses = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

  if (c.pais === 'PT') {
    if (c.regime === 'normal') {
      if (c.periodicidade === 'mensal') meses.forEach(m => { const [y2, m2] = mesSeguinte(ano, m, 2); push('IVA', 'Declaração periódica de IVA', `${pad(m)}/${ano}`, dia(y2, m2, 20)) })
      else trimestres.forEach(q => { const [y2, m2] = mesSeguinte(ano, q * 3, 2); push('IVA', 'Declaração periódica de IVA', `T${q} ${ano}`, dia(y2, m2, 20)) })
    }
    if (!eSociedade(c)) {
      trimestres.forEach(q => { const [y2, m2] = mesSeguinte(ano, q * 3, 1); push('SS', 'Declaração trimestral à Segurança Social', `T${q} ${ano}`, dia(y2, m2, 31)) })
      push('IRS', 'IRS — Modelo 3 (Anexo B)', `${ano}`, dia(ano + 1, 6, 30))
    } else {
      [[7, 31], [9, 30], [12, 15]].forEach(([m, d], i) => push('PPC', `Pagamento por conta de IRC (${i + 1}.º)`, `${ano}`, dia(ano, m, d)))
      push('IRC', 'IRC — Modelo 22', `${ano}`, dia(ano + 1, 5, 31))
      push('IES', 'IES / Declaração anual', `${ano}`, dia(ano + 1, 7, 15))
    }
    if (c.trabalhadores) meses.forEach(m => { const [y2, m2] = mesSeguinte(ano, m); push('DMR', 'Salários — DMR e Segurança Social', `${pad(m)}/${ano}`, dia(y2, m2, 10)) })
  }

  if (c.pais === 'DE') {
    if (c.regime === 'regel' && c.periodicidade !== 'anual') {
      if (c.periodicidade === 'mensal') meses.forEach(m => { const [y2, m2] = mesSeguinte(ano, m); push('USTVA', 'USt-Voranmeldung', `${pad(m)}/${ano}`, dia(y2, m2, 10)) })
      else trimestres.forEach(q => { const [y2, m2] = mesSeguinte(ano, q * 3); push('USTVA', 'USt-Voranmeldung', `Q${q} ${ano}`, dia(y2, m2, 10)) })
    }
    if (c.trabalhadores) meses.forEach(m => { const [y2, m2] = mesSeguinte(ano, m); push('LSTA', 'Lohnsteuer-Anmeldung', `${pad(m)}/${ano}`, dia(y2, m2, 10)) })
    const vz = eSociedade(c) ? 'Körperschaftsteuer-Vorauszahlung' : 'Einkommensteuer-Vorauszahlung'
    ;[3, 6, 9, 12].forEach((m, i) => push(eSociedade(c) ? 'KSTVZ' : 'ESTVZ', vz, `Q${i + 1} ${ano}`, dia(ano, m, 10)))
    if (!eFreiberufler(c)) [2, 5, 8, 11].forEach((m, i) => push('GEWVZ', 'Gewerbesteuer-Vorauszahlung', `Q${i + 1} ${ano}`, dia(ano, m, 15)))
    if (eSociedade(c)) {
      push('JA', 'Jahresabschluss', `${ano}`, dia(ano + 1, 7, 31))
      push('KST', `Körperschaftsteuer ${ano}`, `${ano}`, dia(ano + 1, 7, 31))
    } else {
      push('EUR', `EÜR ${ano}`, `${ano}`, dia(ano + 1, 7, 31))
      push('EST', `Einkommensteuer ${ano}`, `${ano}`, dia(ano + 1, 7, 31))
    }
    if (!eFreiberufler(c)) push('GEWST', `Gewerbesteuer ${ano}`, `${ano}`, dia(ano + 1, 7, 31))
    if (c.regime === 'regel') push('UST', `Umsatzsteuererklärung ${ano}`, `${ano}`, dia(ano + 1, 7, 31))
  }
  return out.sort((a, b) => a.prazo.localeCompare(b.prazo))
}

// ── O processo do documento, passo a passo, lido do que existe ─────────────
export function processo(o, tarefas = []) {
  const ch = o.checklist || {}
  const temValor = o.valor?.tipo && Number(o.valor?.montante) > 0
  return [
    ['Obrigação', true],
    ['Tarefa interna', tarefas.some(t => t.obrigacaoId === o.id)],
    ['Entrega', ['entregue', 'pago'].includes(o.estado) || !!ch.decl_submetida],
    ['Comprovativo', !!o.comprovativo],
    ['Comunicação', !!ch.cliente_informado],
    ['Pagamento / crédito', o.estado === 'pago' || !!ch.pagamento_confirmado || (['entregue'].includes(o.estado) && !temValor)],
    ['Arquivo', !!ch.comprov_arquivado],
  ]
}

// ── Modelos de WhatsApp (documento, secção 7) ─────────────────────────────
// Os campos vêm da obrigação; o texto é sempre editável antes de enviar.
export const MODELOS_WHATSAPP = [
  ['pagar', 'Entregue, com valor a pagar', (x) => `Olá, ${x.nome}. A ${x.obrigacao} (${x.periodo}) foi entregue. O valor a pagar é de ${x.valor}, até ${x.prazoPagamento}. Qualquer dúvida, estou por aqui.`],
  ['sem_valor', 'Entregue, sem valor a pagar', (x) => `Olá, ${x.nome}. A ${x.obrigacao} (${x.periodo}) foi entregue e não há nenhum valor a pagar. Obrigada!`],
  ['credito', 'Crédito a reportar', (x) => `Olá, ${x.nome}. A ${x.obrigacao} (${x.periodo}) foi entregue e ficou um crédito de ${x.valor}, que será reportado para o período seguinte.`],
  ['reembolso', 'Reembolso solicitado', (x) => `Olá, ${x.nome}. Na ${x.obrigacao} (${x.periodo}) foi solicitado o reembolso de ${x.valor}. Aviso assim que for confirmado.`],
  ['docs', 'Faltam documentos', (x) => `Olá, ${x.nome}. Para prepararmos a ${x.obrigacao} (${x.periodo}) ainda faltam: ${x.emFalta}. O prazo é ${x.prazo} — consegue enviar pela plataforma?`],
  ['prazo', 'Aproxima-se um prazo de pagamento', (x) => `Olá, ${x.nome}. Lembrete: o pagamento da ${x.obrigacao} (${x.periodo}), no valor de ${x.valor}, vence a ${x.prazo}.`],
]
export function linkWhatsApp(telefone, texto) {
  const num = String(telefone || '').replace(/\D/g, '')
  // Sem número, o WhatsApp abre com o texto e deixa escolher o contacto.
  return `https://wa.me/${num}?text=${encodeURIComponent(texto)}`
}

export const iniciais = (s) => (s || '?').split(/[\s-]+/).filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
