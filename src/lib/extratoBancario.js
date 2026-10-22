// ============================================================================
// Leitura de extratos bancários e conciliação com o Livro de Caixa.
//
// Não há formato normalizado de extrato: cada banco exporta como entende —
// separador `;` ou `,`, decimal à portuguesa ou à inglesa, uma coluna de valor
// com sinal ou duas colunas (débito/crédito), datas em quatro formatos. Este
// ficheiro descobre o formato a partir do próprio conteúdo, em vez de pedir à
// utilizadora que o descreva.
//
// Tudo aqui é função pura: entra texto, sai estrutura. É o que torna o módulo
// testável sem base de dados.
// ============================================================================

// ── Texto ───────────────────────────────────────────────────────────────────
export const semAcentos = (s) => String(s ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const normalizar = (s) => semAcentos(s).replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()

// ── Números ─────────────────────────────────────────────────────────────────
// "1.234,56" (PT/DE) · "1,234.56" (EN) · "-1234.56" · "1 234,56" · "(123,45)"
export function parseValor(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null
  let s = String(v ?? '').trim()
  if (!s) return null
  // Parênteses = negativo, convenção contabilística
  let negativo = /^\(.*\)$/.test(s)
  s = s.replace(/[()]/g, '')
  if (/^-/.test(s)) { negativo = true }
  // Fora dígitos, separadores e sinal, nada nos interessa (símbolos de moeda, espaços finos)
  s = s.replace(/[^\d.,-]/g, '').replace(/-/g, '')
  if (!s || !/\d/.test(s)) return null

  const ultimoPonto = s.lastIndexOf('.')
  const ultimaVirgula = s.lastIndexOf(',')
  if (ultimoPonto >= 0 && ultimaVirgula >= 0) {
    // Os dois presentes: o último é o decimal, o outro é separador de milhares
    const dec = ultimoPonto > ultimaVirgula ? '.' : ','
    const mil = dec === '.' ? ',' : '.'
    s = s.split(mil).join('')
    s = s.replace(dec, '.')
  } else if (ultimaVirgula >= 0) {
    // Só vírgulas: decimal se houver uma só e sobrarem 1-2 dígitos ("1,5" "12,34")
    const partes = s.split(',')
    s = (partes.length === 2 && partes[1].length <= 2) ? partes.join('.') : partes.join('')
  } else if (ultimoPonto >= 0) {
    const partes = s.split('.')
    s = (partes.length === 2 && partes[1].length <= 2) ? partes.join('.') : partes.join('')
  }
  const n = Number(s)
  if (!Number.isFinite(n)) return null
  return negativo ? -n : n
}

// ── Datas ───────────────────────────────────────────────────────────────────
// Devolve 'YYYY-MM-DD'. Assume dia-primeiro (Portugal e Alemanha) quando é
// ambíguo; se o dia for > 12 não há ambiguidade nenhuma.
export function parseData(v) {
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10)
  const s = String(v ?? '').trim()
  if (!s) return null

  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/)          // 2026-01-31
  if (m) return iso(m[1], m[2], m[3])

  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/)            // 31/01/2026
  if (m) {
    let [, d, mes, ano] = m
    if (Number(d) <= 12 && Number(mes) > 12) [d, mes] = [mes, d]   // veio mês primeiro
    if (ano.length === 2) ano = String(2000 + Number(ano))
    return iso(ano, mes, d)
  }
  return null
}
function iso(a, m, d) {
  const A = Number(a), M = Number(m), D = Number(d)
  if (!(M >= 1 && M <= 12 && D >= 1 && D <= 31 && A >= 1900 && A <= 2200)) return null
  return `${A}-${String(M).padStart(2, '0')}-${String(D).padStart(2, '0')}`
}
const diasEntre = (a, b) => Math.round(Math.abs(new Date(a) - new Date(b)) / 86400000)

// ── CSV ─────────────────────────────────────────────────────────────────────
// Separador detetado por contagem; aspas tratadas com o escape duplo do RFC.
export function detetarSeparador(texto) {
  const linhas = texto.split(/\r?\n/).filter(l => l.trim()).slice(0, 10)
  const cands = [';', ',', '\t', '|']
  let melhor = ';', melhorScore = -1
  for (const sep of cands) {
    const contas = linhas.map(l => l.split(sep).length)
    if (contas.some(c => c < 2)) continue
    // Um bom separador dá o mesmo número de colunas em todas as linhas
    const media = contas.reduce((a, b) => a + b, 0) / contas.length
    const variancia = contas.reduce((a, b) => a + (b - media) ** 2, 0) / contas.length
    const score = media - variancia * 10
    if (score > melhorScore) { melhorScore = score; melhor = sep }
  }
  return melhor
}

export function parseCSV(texto, sep) {
  const t = texto.replace(/^﻿/, '')          // BOM do Excel
  const s = sep || detetarSeparador(t)
  const linhas = []
  let campo = '', linha = [], dentroAspas = false
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]
    if (dentroAspas) {
      if (ch === '"') {
        if (t[i + 1] === '"') { campo += '"'; i++ }   // "" = aspa literal
        else dentroAspas = false
      } else campo += ch
    } else if (ch === '"') dentroAspas = true
    else if (ch === s) { linha.push(campo); campo = '' }
    else if (ch === '\n') { linha.push(campo); linhas.push(linha); linha = []; campo = '' }
    else if (ch === '\r') { /* ignora */ }
    else campo += ch
  }
  if (campo || linha.length) { linha.push(campo); linhas.push(linha) }
  return linhas.map(l => l.map(c => c.trim())).filter(l => l.some(c => c !== ''))
}

// ── Descobrir que coluna é o quê ────────────────────────────────────────────
const PISTAS = {
  data:      ['data', 'date', 'datum', 'valuta', 'buchungstag', 'wertstellung', 'data valor', 'data mov'],
  // Por ordem de preferência: "Verwendungszweck" diz mais do que "Buchungstext" (GUTSCHR, LASTSCHRIFT)
  descricao: ['descri', 'descript', 'verwendungszweck', 'movimento', 'historico', 'detalhe', 'referencia', 'buchungstext', 'beguns', 'text'],
  valor:     ['valor', 'amount', 'betrag', 'montante', 'importancia', 'umsatz'],
  saldo:     ['saldo', 'balance', 'kontostand'],
  debito:    ['debito', 'débito', 'debit', 'soll', 'saida', 'levantamento'],
  credito:   ['credito', 'crédito', 'credit', 'haben', 'entrada', 'deposito'],
  // Folhas preparadas à mão (e alguns bancos) trazem a categoria de cada movimento
  categoria: ['kategorie', 'categoria', 'category', 'rubrica'],
}
// Pistas curtas que só valem como palavra inteira ("in" não pode casar com
// "Buchungstag"): extratos e folhas preparadas à mão com "Betrag (in)" / "Betrag (out)",
// "Eingang"/"Ausgang", "Entradas"/"Saídas".
const PALAVRAS = {
  debito:  ['out', 'ausgang', 'ausgaben', 'abgang', 'lastschrift', 'belastung', 'saidas', 'withdrawal', 'withdrawals'],
  credito: ['in', 'eingang', 'einnahmen', 'zugang', 'gutschrift', 'entradas', 'deposit', 'deposits'],
}
const casa = (cabecalho, chave) => {
  const h = semAcentos(cabecalho)
  if (PISTAS[chave].some(p => h.includes(semAcentos(p)))) return true
  const palavras = h.split(/[^a-z0-9]+/)
  return (PALAVRAS[chave] || []).some(p => palavras.includes(p))
}

// Uma linha é cabeçalho se quase nada nela for número ou data
const pareceCabecalho = (linha) =>
  linha.filter(c => c && parseValor(c) === null && parseData(c) === null).length >= Math.ceil(linha.length * 0.6)

export function detetarColunas(linhas) {
  if (!linhas.length) return null
  // O cabeçalho pode não estar na primeira linha (bancos põem lá o titular, o IBAN…)
  let idxCab = -1
  for (let i = 0; i < Math.min(15, linhas.length); i++) {
    if (linhas[i].length >= 3 && pareceCabecalho(linhas[i])) { idxCab = i; break }
  }
  const cab = idxCab >= 0 ? linhas[idxCab] : []
  const dados = linhas.slice(idxCab + 1).filter(l => l.length >= 2)
  if (!dados.length) return null

  const nCols = Math.max(...dados.map(l => l.length))
  const col = (i) => dados.map(l => l[i] ?? '')
  const fracao = (i, fn) => {
    const vals = col(i).filter(v => String(v).trim())
    if (!vals.length) return 0
    return vals.filter(fn).length / vals.length
  }

  const perfil = Array.from({ length: nCols }, (_, i) => ({
    i,
    cabecalho: cab[i] || '',
    fData: fracao(i, v => parseData(v) !== null),
    fNum: fracao(i, v => parseValor(v) !== null),
    compMedio: col(i).reduce((a, v) => a + String(v).length, 0) / Math.max(1, col(i).length),
    preenchida: col(i).filter(v => String(v).trim()).length / dados.length,
  }))

  // Data: o cabeçalho manda; senão, a coluna com mais datas
  let iData = perfil.findIndex(p => p.cabecalho && casa(p.cabecalho, 'data') && p.fData > 0.5)
  if (iData < 0) {
    const c = perfil.filter(p => p.fData > 0.7).sort((a, b) => b.fData - a.fData)[0]
    iData = c ? c.i : -1
  }
  if (iData < 0) return null

  // Numéricas candidatas. Nenhuma coluna de datas conta ("31.01.2026" também
  // se lê como número), nem a "Data valor" dos bancos portugueses, cujo
  // cabeçalho traz "valor" mas é uma data.
  const numericas = perfil.filter(p => p.i !== iData && p.fNum > 0.7 && p.fData <= 0.5
    && !(p.cabecalho && casa(p.cabecalho, 'data')))

  let iValor = -1, iSaldo = -1, iDebito = -1, iCredito = -1
  const porCab = (chave) => numericas.find(p => p.cabecalho && casa(p.cabecalho, chave))

  const cD = porCab('debito'), cC = porCab('credito')
  if (cD && cC && cD.i !== cC.i) {
    iDebito = cD.i; iCredito = cC.i
    const cS = porCab('saldo'); if (cS) iSaldo = cS.i
  } else {
    const cV = porCab('valor'), cS = porCab('saldo')
    if (cV) iValor = cV.i
    if (cS) iSaldo = cS.i
    if (iValor < 0) {
      // Sem cabeçalho útil: das numéricas, o saldo é a que se comporta como
      // saldo acumulado — cada valor é o anterior mais o movimento.
      const restantes = numericas.filter(p => p.i !== iSaldo)
      if (restantes.length === 1) iValor = restantes[0].i
      else if (restantes.length >= 2) {
        const [a, b] = restantes
        iValor = pareceSaldo(dados, a.i, b.i) ? b.i : a.i
        iSaldo = iValor === b.i ? a.i : b.i
      }
    }
    // Duas numéricas sem cabeçalho, cada linha só com uma preenchida → débito/crédito
    // (só quando o valor não veio do cabeçalho: com "Betrag"/"Montante" é uma coluna só)
    if (iValor >= 0 && iSaldo < 0 && !cV) {
      const outras = numericas.filter(p => p.i !== iValor)
      if (outras.length === 1 && exclusivas(dados, iValor, outras[0].i)) {
        iDebito = iValor; iCredito = outras[0].i; iValor = -1
      }
    }
  }
  if (iValor < 0 && iDebito < 0) return null

  // Categoria: só pelo cabeçalho (sem ele, uma coluna de texto curto pode ser qualquer coisa).
  // Com duas colunas ("Kategorie" e "Kategorie EÜR"), fica a da EÜR: é a que diz
  // o que a despesa é de facto ("Verpflegung…" onde a outra só diz "Sonstige").
  const usadasNum = new Set([iData, iValor, iSaldo, iDebito, iCredito])
  const cats = perfil.filter(p => p.cabecalho && !usadasNum.has(p.i) && p.fNum < 0.5 && casa(p.cabecalho, 'categoria'))
  const cCat = cats.find(p => /e[uü]r/.test(semAcentos(p.cabecalho))) || cats[0]
  const iCategoria = cCat ? cCat.i : -1

  // Descrição: o cabeçalho manda; senão, a coluna de texto mais longa
  let iDesc = -1
  for (const pista of PISTAS.descricao) {
    const c = perfil.find(p => p.cabecalho && p.i !== iCategoria && semAcentos(p.cabecalho).includes(pista))
    if (c) { iDesc = c.i; break }
  }
  if (iDesc < 0) {
    const usadas = new Set([iData, iValor, iSaldo, iDebito, iCredito, iCategoria])
    const c = perfil.filter(p => !usadas.has(p.i) && p.fNum < 0.5 && p.preenchida > 0.5)
      .sort((a, b) => b.compMedio - a.compMedio)[0]
    iDesc = c ? c.i : -1
  }

  return { idxCabecalho: idxCab, cabecalho: cab, iData, iDesc, iValor, iSaldo, iDebito, iCredito, iCategoria, dados }
}

// A coluna `s` comporta-se como saldo acumulado da coluna `v`?
function pareceSaldo(dados, s, v) {
  let acertos = 0, testes = 0
  for (let i = 1; i < dados.length; i++) {
    const sAnt = parseValor(dados[i - 1][s]), sAtual = parseValor(dados[i][s]), val = parseValor(dados[i][v])
    if (sAnt === null || sAtual === null || val === null) continue
    testes++
    if (Math.abs((sAnt + val) - sAtual) < 0.02) acertos++
  }
  return testes >= 2 && acertos / testes > 0.7
}
// Duas colunas em que cada linha preenche uma e só uma
function exclusivas(dados, a, b) {
  let na = 0, nb = 0
  for (const l of dados) {
    const va = parseValor(l[a]), vb = parseValor(l[b])
    const ca = va !== null && va !== 0, cb = vb !== null && vb !== 0
    if (ca && cb) return false
    if (ca) na++
    if (cb) nb++
  }
  // As duas têm de ter movimentos (uma coluna de zeros não é a do crédito)
  return na >= 1 && nb >= 1 && na + nb >= 2
}

// ── Do ficheiro para movimentos ─────────────────────────────────────────────
export function fingerprint(m) {
  return [m.data, m.tipo, m.valor.toFixed(2), normalizar(m.descricao).slice(0, 60)].join('|')
}

// Linha de saldo (inicial/final) que alguns bancos e folhas põem no meio dos movimentos
const RX_SALDO = /^(saldo|anfangssaldo|endsaldo|saldovortrag|vortrag|kontostand|opening balance|closing balance)\b/

export function extrairMovimentos(linhas) {
  const mapa = detetarColunas(linhas)
  if (!mapa) return { erro: 'formato', movimentos: [], mapa: null }

  const movimentos = []
  const ignoradas = []
  const saldos = []
  for (const l of mapa.dados) {
    const data = parseData(l[mapa.iData])
    if (!data) { ignoradas.push(l); continue }

    let bruto = null
    if (mapa.iValor >= 0) bruto = parseValor(l[mapa.iValor])
    else {
      const d = parseValor(l[mapa.iDebito]), c = parseValor(l[mapa.iCredito])
      if (d !== null && d !== 0) bruto = -Math.abs(d)
      else if (c !== null && c !== 0) bruto = Math.abs(c)
    }
    if (bruto === null || bruto === 0) { ignoradas.push(l); continue }

    const desc = mapa.iDesc >= 0 ? String(l[mapa.iDesc] ?? '').trim() : ''
    // Só a linha cuja descrição é o próprio saldo ("Saldo inicial", "Anfangssaldo"),
    // não um pagamento que fala de saldo ("Pagamento do saldo da fatura 12")
    const nd = normalizar(desc)
    if (desc && RX_SALDO.test(nd) && nd.split(' ').length <= 3) { saldos.push({ data, valor: bruto }); continue }
    const m = {
      data,
      descricao: desc || '(sem descrição)',
      semDescricao: !desc,
      valor: Math.abs(bruto),
      tipo: bruto < 0 ? 'saida' : 'entrada',
      saldo: mapa.iSaldo >= 0 ? parseValor(l[mapa.iSaldo]) : null,
      categoria: mapa.iCategoria >= 0 ? String(l[mapa.iCategoria] ?? '').trim() : '',
      raw: l,
    }
    movimentos.push(m)
  }

  // Saldo inicial sem descrição: a primeira linha, sozinha num ano anterior ao
  // dos movimentos (ex.: 31/12 do ano passado com o saldo transitado). Não é
  // um movimento — contá-lo como entrada inflacionava as receitas.
  if (movimentos.length > 2 && movimentos[0].semDescricao) {
    const ano = (m) => m.data.slice(0, 4)
    const a0 = ano(movimentos[0])
    if (a0 < ano(movimentos[movimentos.length - 1]) && movimentos.slice(1).every(m => ano(m) !== a0)) {
      const [s0] = movimentos.splice(0, 1)
      saldos.unshift({ data: s0.data, valor: s0.tipo === 'saida' ? -s0.valor : s0.valor })
    }
  }

  // Movimentos iguais no mesmo ficheiro (duas taxas de 3,70 € no mesmo dia, com
  // a mesma descrição) são movimentos diferentes: a 2.ª, 3.ª… ocorrência leva
  // o número na impressão digital. Reimportar o mesmo ficheiro gera as mesmas
  // impressões, por isso continua a não duplicar nada.
  const ocorrencias = new Map()
  let repetidos = 0
  for (const m of movimentos) {
    delete m.semDescricao
    const base = fingerprint(m)
    const n = (ocorrencias.get(base) || 0) + 1
    ocorrencias.set(base, n)
    if (n > 1) repetidos++
    m.fingerprint = n > 1 ? `${base}|#${n}` : base
  }

  return {
    erro: movimentos.length ? null : 'vazio',
    movimentos,
    repetidosNoFicheiro: repetidos,
    saldoInicial: saldos[0] || null,
    ignoradas: ignoradas.length,
    mapa,
  }
}

// ── Conciliação ─────────────────────────────────────────────────────────────
// Só conciliam lançamentos com destino 'banco': o dinheiro em caixa, por
// definição, não passa pelo extrato.
const TOLERANCIA_VALOR = 0.01
const MAX_DIAS = 7

export function semelhanca(a, b) {
  const A = new Set(normalizar(a).split(' ').filter(w => w.length > 2))
  const B = new Set(normalizar(b).split(' ').filter(w => w.length > 2))
  if (!A.size || !B.size) return 0
  let comuns = 0
  for (const w of A) if (B.has(w)) comuns++
  return (2 * comuns) / (A.size + B.size)     // Dice
}

export function pontuar(mov, entry) {
  if (entry.destination !== 'banco') return 0
  if (entry.type !== mov.tipo) return 0
  if (Math.abs(Number(entry.amount) - mov.valor) > TOLERANCIA_VALOR) return 0
  const dias = diasEntre(mov.data, entry.entry_date)
  if (dias > MAX_DIAS) return 0

  let score = 60                                    // valor e sentido certos
  score += dias === 0 ? 25 : dias <= 2 ? 15 : 5
  score += Math.round(semelhanca(mov.descricao, entry.description || '') * 15)
  return score
}

export const LIMITE_AUTOMATICO = 85

// Emparelha um-para-um: nem um movimento fica com dois lançamentos, nem o
// contrário. Empates no topo NÃO são automáticos — dois lançamentos iguais no
// mesmo dia são precisamente o caso em que a máquina não deve decidir.
export function conciliar(movimentos, entries) {
  const pares = []
  for (const m of movimentos) {
    for (const e of entries) {
      const score = pontuar(m, e)
      if (score > 0) pares.push({ fp: m.fingerprint, entryId: e.id, score })
    }
  }
  pares.sort((a, b) => b.score - a.score)

  const movUsados = new Set(), entryUsados = new Set()
  const resultado = new Map()
  for (const p of pares) {
    if (movUsados.has(p.fp) || entryUsados.has(p.entryId)) continue
    // Há outro candidato com a mesma pontuação para este movimento?
    const empatado = pares.some(o =>
      o !== p && o.fp === p.fp && o.score === p.score && !entryUsados.has(o.entryId))
    movUsados.add(p.fp); entryUsados.add(p.entryId)
    resultado.set(p.fp, {
      entryId: p.entryId,
      score: p.score,
      automatico: p.score >= LIMITE_AUTOMATICO && !empatado,
      ambiguo: empatado,
    })
  }

  const semPar = movimentos.filter(m => !resultado.has(m.fingerprint))
  const entriesSemPar = entries.filter(e => e.destination === 'banco' && !entryUsados.has(e.id))
  return { sugestoes: resultado, semPar, entriesSemPar }
}

// Um movimento do extrato que não existe no Livro de Caixa vira lançamento.
// O valor do extrato é bruto: o IVA sai da taxa escolhida (R-A3 — antes ia sempre a 0).
// A categoria só vale para saídas (como no Livro de Caixa).
export function movimentoParaLancamento(m, taxa = 0, categoria = '') {
  return {
    entry_date: m.data,
    description: m.descricao,
    type: m.tipo,
    amount: m.valor,
    destination: 'banco',
    doc: null,
    vat_rate: taxa,
    vat_amount: taxa > 0 ? Math.round(m.valor * taxa / (100 + taxa) * 100) / 100 : 0,
    quantity: 1,
    private: false,
    category: m.tipo === 'saida' ? (categoria || null) : null,
  }
}

// ── Categoria do extrato → categoria de despesa ─────────────────────────────
// A folha da cliente traz a categoria em texto livre ("Miete", "Kategorie EÜR:
// Bewirtung", "Software"). Propõe-se a chave de src/data/expenseCategories.js;
// a pessoa confirma no seletor. A ordem conta: "Steuerberater" é honorário antes
// de ser imposto, "Kfz-Versicherung" é automóvel antes de ser seguro.
// `inclui` casa em qualquer parte da palavra; `palavras` só como palavra inteira.
const MAPA_CATEGORIAS = [
  { key: 'honorarios', inclui: ['honorar', 'aufwandsentschadigung', 'steuerberat', 'rechtsanwalt', 'anwalt', 'beratungskost', 'buchhalt', 'contabil', 'advogad', 'consultor', 'accountant', 'lawyer', 'professional fee'], palavras: ['legal'] },
  { key: 'auto', inclui: ['fahrzeug', 'benzin', 'diesel', 'tanken', 'kraftstoff', 'combust', 'gasoleo', 'gasolina', 'portage', 'estacionamento', 'parken', 'parkgeb', 'automovel', 'vehicle', 'fuel'], palavras: ['kfz', 'pkw', 'maut', 'auto', 'car', 'petrol'] },
  { key: 'impostos', inclui: ['verwaltungsgeb', 'taxa administrativ'], palavras: [] },
  { key: 'bancos', inclui: ['gebuhr', 'bank', 'banc', 'kontofuhr', 'comiss', 'paypal', 'stripe'], palavras: ['fees', 'fee', 'charges'] },
  { key: 'software', inclui: ['software', 'subscri', 'abonnement', 'lizenz', 'hosting', 'saas', 'cloud'], palavras: ['abo', 'app', 'apps'] },
  { key: 'telecom', inclui: ['telefon', 'telekom', 'telecom', 'internet', 'mobilfunk', 'handy', 'telemovel', 'phone', 'porto'], palavras: [] },
  // Luz, água e encargos do espaço entram em "Renda e Instalações" (não há categoria própria)
  { key: 'renda', inclui: ['miete', 'renda', 'aluguer', 'arrendamento', 'raumkost', 'coworking', 'buroraum', 'instalac', 'premises', 'nebenkost', 'strom', 'energie', 'heizung', 'wasser', 'eletric', 'electric', 'utilities', 'condominio'], palavras: ['rent', 'raum', 'agua', 'luz', 'gas'] },
  { key: 'refeicoes', inclui: ['verpflegung', 'essen', 'bewirtung', 'refeic', 'restaurant', 'almoco', 'jantar', 'meal', 'food'], palavras: [] },
  { key: 'viagens', inclui: ['reise', 'viage', 'hotel', 'ubernacht', 'flug', 'desloca', 'travel', 'comboio'], palavras: ['bahn', 'taxi', 'voo', 'voos'] },
  { key: 'marketing', inclui: ['werbung', 'marketing', 'publicidad', 'anzeige', 'advertis', 'flyer'], palavras: ['ads'] },
  { key: 'formacao', inclui: ['fortbildung', 'weiterbildung', 'schulung', 'seminar', 'formac', 'fachliteratur', 'training', 'workshop'], palavras: ['kurs', 'kurse', 'curso', 'cursos', 'course', 'courses'] },
  { key: 'limpeza', inclui: ['reinigung', 'limpeza', 'cleaning', 'higiene', 'hygiene'], palavras: [] },
  { key: 'seguros', inclui: ['versicherung', 'seguro', 'insurance'], palavras: [] },
  { key: 'equipamentos', inclui: ['abschreibung', 'equipament', 'investi', 'hardware', 'computer', 'mobiliario', 'anlagegut'], palavras: ['afa', 'gwg'] },
  { key: 'material', inclui: ['material', 'wareneinkauf', 'verbrauch', 'consumive', 'burobedarf', 'supplies', 'mercadoria'], palavras: ['waren'] },
  { key: 'impostos', inclui: ['steuer', 'imposto', 'abgabe', 'beitrag', 'licenca'], palavras: ['tax', 'taxes', 'taxa', 'taxas', 'duties'] },
  { key: 'outros', inclui: ['sonstig', 'outros', 'outras', 'diverso'], palavras: ['other', 'misc'] },
]

export function sugerirCategoria(texto) {
  const n = normalizar(texto)
  if (!n) return ''
  // Movimentos privados não são despesa da empresa: não se propõe categoria
  if (/privat|pessoal|private/.test(n)) return ''
  const palavras = n.split(' ')
  for (const c of MAPA_CATEGORIAS) {
    if (c.inclui.some(p => n.includes(p)) || c.palavras.some(p => palavras.includes(p))) return c.key
  }
  return ''
}
