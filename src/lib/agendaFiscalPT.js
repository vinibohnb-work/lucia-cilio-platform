// ============================================================================
// Prazos oficiais da Autoridade Tributária (Portugal) — item 2 da reunião de 15/10.
//
// O calendário fiscal da plataforma é gerado por regras fixas (src/portal/regras.js:
// IVA a 20, DMR a 10…). Todos os anos a AT publica no Portal das Finanças dois
// quadros-resumo com o dia de cada obrigação mês a mês — já com as mudanças por
// fim de semana, feriado e os despachos de prorrogação:
//   · Quadro_res_Decl_<ano>.aspx — obrigações declarativas;
//   · Quadro_res_Pag_<ano>.aspx  — prazos de pagamento.
// A função api/agenda-fiscal.js descarrega-os (o browser não pode: CORS) e este
// ficheiro lê-os e compara-os com as obrigações da plataforma.
//
// Não se muda nenhum prazo sozinho: a comparação é mostrada à equipa, que decide
// atualizar. As regras alemãs não têm equivalente — o BMF não publica um quadro
// legível por máquina (e bloqueia pedidos automáticos) —, por isso continuam a
// vir só das regras fixas.
//
// Funções puras (sem DOM): correm no servidor e no browser.
// ============================================================================

export const URL_AT = (tipo, ano) =>
  `https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/calendario_fiscal/Pages/Quadro_res_${tipo === 'pag' ? 'Pag' : 'Decl'}_${ano}.aspx`

// O SharePoint da AT enche as células de espaços de largura zero (até no meio
// das palavras, em "remunerações") e de espaços inquebráveis.
const LARGURA_ZERO = new RegExp(String.fromCharCode(0x200b), 'g')
const INQUEBRAVEL = new RegExp(String.fromCharCode(0xa0), 'g')
const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
const texto = (h) => String(h)
  .replace(/<br\s*\/?>/gi, ' ')
  .replace(/<\/?(?:span|a|b|strong|em|i|u|font)(?=[\s>])[^>]*>/gi, '')   // etiquetas de texto não separam palavras
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&([a-z]+);/gi, (m, n) => ENTIDADES[n.toLowerCase()] ?? m)
  .replace(LARGURA_ZERO, '')
  .replace(INQUEBRAVEL, ' ')
  .replace(/\s+/g, ' ')
  .trim()

// Lê o quadro-resumo (uma tabela: IMPOSTO | DESIGNAÇÃO | JAN … DEZ).
// Devolve [{ imposto, designacao, meses: { 1: [dias], 2: [dias], … } }].
// Uma célula pode ter mais do que um dia ("2 31") ou uma nota ("30 f)"); fica
// com todos os números de 1 a 31.
export function lerQuadroAT(html) {
  const tabelas = String(html || '').match(/<table[\s\S]*?<\/table>/gi) || []
  for (const tab of tabelas) {
    const linhas = (tab.match(/<tr[\s\S]*?<\/tr>/gi) || [])
      .map(tr => (tr.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) || []).map(texto))
    const iCab = linhas.findIndex(l => /^imposto$/i.test(l[0] || '') && l.some(c => /^jan$/i.test(c)))
    if (iCab < 0) continue
    const iJan = linhas[iCab].findIndex(c => /^jan$/i.test(c))
    const out = []
    for (const l of linhas.slice(iCab + 1)) {
      if (!l[0] || !l[1]) continue
      const meses = {}
      for (let m = 1; m <= 12; m++) {
        const dias = (String(l[iJan + m - 1] || '').match(/\b([1-9]|[12]\d|3[01])\b/g) || []).map(Number)
        if (dias.length) meses[m] = dias
      }
      out.push({ imposto: l[0], designacao: l[1], meses })
    }
    return out
  }
  return []
}

// ── Que linha da AT corresponde a cada obrigação da plataforma ──────────────
// `atraso`: meses entre o fim do período e o prazo (IVA mensal de janeiro → março).
// `confirmar`: quando o prazo oficial cai num mês diferente do esperado (ex.: o
// mês de agosto, sem entregas de IVA) a diferença é mostrada para confirmar.
const RX = (s) => new RegExp(s, 'i')
const sem = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
export const REGRAS_AT = [
  { codigo: 'IVA', quadro: 'decl', quando: c => c.periodicidade === 'mensal', rx: RX('declaracao periodica.*regime mensal'), atraso: 2 },
  { codigo: 'IVA', quadro: 'decl', quando: c => c.periodicidade !== 'mensal', rx: RX('declaracao periodica.*regime trimestral'), atraso: 2 },
  { codigo: 'DMR', quadro: 'decl', rx: RX('declaracao mensal de remunera'), atraso: 1 },
  { codigo: 'IRS', quadro: 'decl', rx: RX('declaracao mod\\. ?3\\b'), atraso: 1 },
  { codigo: 'IRC', quadro: 'decl', rx: RX('declaracao mod\\. ?22\\b'), atraso: 1 },
  { codigo: 'IES', quadro: 'decl', rx: RX('informacao empresarial'), atraso: 1 },
  { codigo: 'PPC', quadro: 'pag', rx: RX('^pagamentos por conta$'), imposto: 'IRC', noAno: true },
]

// Fim do período de uma obrigação gerada: "03/2026" → 2026-03, "T2 2026" → 2026-06, "2026" → 2026-12
function fimDoPeriodo(periodo) {
  let m = String(periodo || '').match(/^(\d{1,2})\/(\d{4})$/)
  if (m) return { ano: Number(m[2]), mes: Number(m[1]) }
  m = String(periodo || '').match(/^T([1-4]) (\d{4})$/)
  if (m) return { ano: Number(m[2]), mes: Number(m[1]) * 3 }
  m = String(periodo || '').match(/^(\d{4})$/)
  if (m) return { ano: Number(m[1]), mes: 12 }
  return null
}

const pad = (n) => String(n).padStart(2, '0')
const linhaDe = (quadros, ano, regra) => {
  const q = quadros?.[ano]?.[regra.quadro]
  if (!q) return null
  return q.find(l => regra.rx.test(sem(l.designacao)) && (!regra.imposto || sem(l.imposto) === sem(regra.imposto))) || null
}

// Prazo oficial de uma obrigação, ou null quando a AT ainda não publicou o ano
// (ou a obrigação não tem correspondência no quadro).
export function prazoOficial(o, cliente, quadros) {
  const base = String(o.codigo || '').split('-')[0]
  const familia = base.replace(/\d+$/, '')
  const regra = REGRAS_AT.find(r => r.codigo === familia && (!r.quando || r.quando(cliente || {})))
  if (!regra) return null
  const fim = fimDoPeriodo(o.periodo)
  if (!fim) return null

  // Pagamentos por conta: o n.º (PPC1, PPC2, PPC3) é a ordem no próprio ano
  if (regra.noAno) {
    const n = Number(base.slice(familia.length)) || 1
    const linha = linhaDe(quadros, fim.ano, regra)
    if (!linha) return null
    const datas = Object.entries(linha.meses).flatMap(([m, ds]) => ds.map(d => `${fim.ano}-${pad(m)}-${pad(d)}`)).sort()
    return datas[n - 1] ? { prazo: datas[n - 1], confirmar: false, linha } : null
  }

  // Primeiro dia oficial a partir do mês esperado (fim do período + atraso)
  const esperado = fim.ano * 12 + (fim.mes - 1) + regra.atraso
  for (const ano of [Math.floor(esperado / 12), Math.floor(esperado / 12) + 1]) {
    const linha = linhaDe(quadros, ano, regra)
    if (!linha) {
      if (quadros?.[ano]) continue   // o ano existe mas sem esta linha
      return null                      // ano ainda não publicado
    }
    for (let m = 1; m <= 12; m++) {
      if (ano * 12 + (m - 1) < esperado || !linha.meses[m]) continue
      // Com vários dias no mês fica o último (ex.: "2 31": o prazo é o 31)
      const dia = Math.max(...linha.meses[m])
      return { prazo: `${ano}-${pad(m)}-${pad(dia)}`, confirmar: ano * 12 + (m - 1) !== esperado, linha }
    }
  }
  return null
}

// Obrigações em aberto de clientes de Portugal cujo prazo difere do oficial.
export function compararComAT(obrigacoes, clientes, quadros, fechados = []) {
  const porId = Object.fromEntries((clientes || []).map(c => [c.id, c]))
  const out = []
  for (const o of obrigacoes || []) {
    const c = porId[o.clienteId]
    if (!c || c.pais !== 'PT' || fechados.includes(o.estado)) continue
    const of = prazoOficial(o, c, quadros)
    if (!of || of.prazo === o.prazo) continue
    out.push({ obrigacao: o, cliente: c, prazoAtual: o.prazo, prazoOficial: of.prazo, confirmar: of.confirmar, fonte: `${of.linha.imposto} · ${of.linha.designacao}` })
  }
  return out.sort((a, b) => a.prazoOficial.localeCompare(b.prazoOficial))
}
