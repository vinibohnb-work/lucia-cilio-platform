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
  descricao: ['descri', 'descript', 'verwendungszweck', 'buchungstext', 'movimento', 'historico', 'referencia', 'beguns', 'text', 'detalhe'],
  valor:     ['valor', 'amount', 'betrag', 'montante', 'importancia', 'umsatz'],
  saldo:     ['saldo', 'balance', 'kontostand'],
  debito:    ['debito', 'débito', 'debit', 'soll', 'saida', 'levantamento'],
  credito:   ['credito', 'crédito', 'credit', 'haben', 'entrada', 'deposito'],
}
const casa = (cabecalho, chave) => {
  const h = semAcentos(cabecalho)
  return PISTAS[chave].some(p => h.includes(semAcentos(p)))
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

  // Numéricas candidatas (a data não conta)
  const numericas = perfil.filter(p => p.i !== iData && p.fNum > 0.7)

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
    if (iValor >= 0 && iSaldo < 0) {
      const outras = numericas.filter(p => p.i !== iValor)
      if (outras.length === 1 && exclusivas(dados, iValor, outras[0].i)) {
        iDebito = iValor; iCredito = outras[0].i; iValor = -1
      }
    }
  }
  if (iValor < 0 && iDebito < 0) return null

  // Descrição: o cabeçalho manda; senão, a coluna de texto mais longa
  let iDesc = perfil.findIndex(p => p.cabecalho && casa(p.cabecalho, 'descricao'))
  if (iDesc < 0) {
    const usadas = new Set([iData, iValor, iSaldo, iDebito, iCredito])
    const c = perfil.filter(p => !usadas.has(p.i) && p.fNum < 0.5 && p.preenchida > 0.5)
      .sort((a, b) => b.compMedio - a.compMedio)[0]
    iDesc = c ? c.i : -1
  }

  return { idxCabecalho: idxCab, cabecalho: cab, iData, iDesc, iValor, iSaldo, iDebito, iCredito, dados }
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
  let n = 0
  for (const l of dados) {
    const va = parseValor(l[a]), vb = parseValor(l[b])
    if ((va !== null && va !== 0) && (vb !== null && vb !== 0)) return false
    if (va !== null || vb !== null) n++
  }
  return n >= 2
}

// ── Do ficheiro para movimentos ─────────────────────────────────────────────
export function fingerprint(m) {
  return [m.data, m.tipo, m.valor.toFixed(2), normalizar(m.descricao).slice(0, 60)].join('|')
}

export function extrairMovimentos(linhas) {
  const mapa = detetarColunas(linhas)
  if (!mapa) return { erro: 'formato', movimentos: [], mapa: null }

  const movimentos = []
  const ignoradas = []
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

    const m = {
      data,
      descricao: (mapa.iDesc >= 0 ? l[mapa.iDesc] : '') || '(sem descrição)',
      valor: Math.abs(bruto),
      tipo: bruto < 0 ? 'saida' : 'entrada',
      saldo: mapa.iSaldo >= 0 ? parseValor(l[mapa.iSaldo]) : null,
      raw: l,
    }
    m.fingerprint = fingerprint(m)
    movimentos.push(m)
  }
  // Uma reimportação do mesmo ficheiro não deve gerar duplicados nem aqui
  const vistos = new Set()
  const unicos = movimentos.filter(m => vistos.has(m.fingerprint) ? false : vistos.add(m.fingerprint))

  return {
    erro: unicos.length ? null : 'vazio',
    movimentos: unicos,
    duplicadosNoFicheiro: movimentos.length - unicos.length,
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

// Um movimento do extrato que não existe no Livro de Caixa vira lançamento
export function movimentoParaLancamento(m) {
  return {
    entry_date: m.data,
    description: m.descricao,
    type: m.tipo,
    amount: m.valor,
    destination: 'banco',
    doc: null,
    vat_rate: 0,
    vat_amount: 0,
    quantity: 1,
    private: false,
  }
}
