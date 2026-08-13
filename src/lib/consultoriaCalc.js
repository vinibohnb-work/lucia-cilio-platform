// ============================================================================
// Cálculos dos blocos 3 e 4 da consultoria (os números).
// Fórmulas do documento "Der Businessplan (BP)" da Câmara de Comércio alemã.
//
// As duas verificações que o documento exige, e que fecham o plano:
//   1. O financiamento cobre a necessidade de capital?
//   2. O lucro previsto cobre as retiradas privadas + as amortizações?
// ============================================================================

const n = (v) => {
  if (v === undefined || v === null || v === '') return 0
  const x = Number(String(v).replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(x) ? x : 0
}

export const soma = (linhas) => (linhas || []).reduce((s, l) => s + n(l?.valor), 0)

// ── 2.1 Retiradas privadas ──────────────────────────────────────────────────
// "Berechnung der notwendigen Privatentnahmen": quanto o negócio tem de gerar
// para a pessoa viver. É a despesa do agregado menos os outros rendimentos.
export function retiradasPrivadas(privadas) {
  const rendimentos = soma(privadas?.rendimentos)
  const despesas = soma(privadas?.despesas)
  const necessarioMes = Math.max(0, despesas - rendimentos)
  return { rendimentos, despesas, necessarioMes, necessarioAno: necessarioMes * 12 }
}

// ── 2.2.1 Necessidade de capital ────────────────────────────────────────────
// Investimentos + custos de constituição + reserva.
// O documento sugere, para a reserva, os custos correntes dos primeiros 3 meses.
export function necessidadeCapital(capital, custosAnuaisAno1 = 0) {
  const investimentos = soma(capital?.investimentos)
  const constituicao = soma(capital?.constituicao)
  const meses = capital?.reservaMeses === undefined ? 3 : n(capital.reservaMeses)
  // Sugestão a partir do bloco 4; se ela escrever um valor, o dela manda.
  const reservaSugerida = (n(custosAnuaisAno1) / 12) * meses
  const reserva = capital?.reserva === '' || capital?.reserva === undefined
    ? reservaSugerida : n(capital.reserva)
  return { investimentos, constituicao, reserva, reservaSugerida, meses, total: investimentos + constituicao + reserva }
}

// ── 2.2.2 Financiamento ─────────────────────────────────────────────────────
// Tem de cobrir a totalidade da necessidade de capital.
export function financiamento(fin, necessidadeTotal = 0) {
  const proprio = soma(fin?.proprio)
  const alheio = soma(fin?.alheio)
  const total = proprio + alheio
  const diferenca = total - n(necessidadeTotal)
  return {
    proprio, alheio, total, diferenca,
    cobre: diferenca >= 0,
    amortizacaoAno: n(fin?.amortizacaoAno),
  }
}

// ── 2.2.3 Previsão de faturação, custos e lucro ─────────────────────────────
// Linhas com um valor por ano. Faturação sempre líquida (sem IVA).
export const ANOS = 3

export function projecao(proj) {
  const receitas = proj?.receitas || []
  const custos = proj?.custos || []
  const porAno = Array.from({ length: ANOS }, (_, i) => {
    const rec = receitas.reduce((s, l) => s + n(l?.valores?.[i]), 0)
    const cus = custos.reduce((s, l) => s + n(l?.valores?.[i]), 0)
    return { ano: i + 1, receitas: rec, custos: cus, lucro: rec - cus }
  })
  return { porAno, custosAno1: porAno[0]?.custos || 0 }
}

// A verificação que fecha o plano: o lucro cobre a vida da pessoa e a dívida?
export function verificacaoLucro(proj, retiradaAno, amortizacaoAno) {
  const p = projecao(proj)
  return p.porAno.map(a => {
    const exigido = n(retiradaAno) + n(amortizacaoAno)
    const folga = a.lucro - exigido
    return { ...a, exigido, folga, cobre: folga >= 0 }
  })
}

// ── Liquidez (12 meses do ano 1) ────────────────────────────────────────────
// Saldo acumulado mês a mês; o que interessa é saber se alguma vez fica negativo.
export function liquidez(liq) {
  const entradas = liq?.entradas || []
  const saidas = liq?.saidas || []
  let acumulado = n(liq?.saldoInicial)
  const meses = Array.from({ length: 12 }, (_, i) => {
    const e = n(entradas[i]), s = n(saidas[i])
    acumulado += e - s
    return { mes: i + 1, entradas: e, saidas: s, saldo: acumulado }
  })
  const negativos = meses.filter(m => m.saldo < 0)
  return { meses, saldoFinal: acumulado, negativos, ok: negativos.length === 0 }
}

// ── Linhas por omissão (referência, não dogma — editáveis na interface) ─────
export const LINHAS_PADRAO = {
  rendimentos: [
    { pt: 'Rendimento do cônjuge/parceiro', de: 'Einkommen Partner/in', en: 'Partner income' },
    { pt: 'Abono de família', de: 'Kindergeld', en: 'Child benefit' },
    { pt: 'Rendas recebidas', de: 'Mieteinnahmen', en: 'Rental income' },
    { pt: 'Outros rendimentos', de: 'Sonstige Einkünfte', en: 'Other income' },
  ],
  despesas: [
    { pt: 'Habitação (renda ou prestação)', de: 'Wohnen (Miete/Rate)', en: 'Housing (rent/mortgage)' },
    { pt: 'Alimentação', de: 'Lebenshaltung', en: 'Food and living' },
    { pt: 'Seguros (saúde, vida, RC)', de: 'Versicherungen', en: 'Insurance' },
    { pt: 'Viatura e transportes', de: 'Auto und Verkehr', en: 'Car and transport' },
    { pt: 'Telecomunicações', de: 'Telefon und Internet', en: 'Phone and internet' },
    { pt: 'Educação e creche', de: 'Bildung und Kinderbetreuung', en: 'Education and childcare' },
    { pt: 'Lazer', de: 'Freizeit', en: 'Leisure' },
    { pt: 'Impostos e contribuições', de: 'Steuern und Beiträge', en: 'Taxes and contributions' },
    { pt: 'Poupança', de: 'Sparen', en: 'Savings' },
    { pt: 'Outras despesas', de: 'Sonstige Ausgaben', en: 'Other expenses' },
  ],
  investimentos: [
    { pt: 'Máquinas e equipamento', de: 'Maschinen und Geräte', en: 'Machinery and equipment' },
    { pt: 'Mobiliário e material de escritório', de: 'Büro- und Geschäftsausstattung', en: 'Office and business furnishings' },
    { pt: 'Viaturas', de: 'Fahrzeuge', en: 'Vehicles' },
    { pt: 'Informática e software', de: 'IT und Software', en: 'IT and software' },
  ],
  constituicao: [
    { pt: 'Consultoria e constituição', de: 'Gründungsberatung', en: 'Advisory and incorporation' },
    { pt: 'Conceito publicitário', de: 'Werbekonzept', en: 'Advertising concept' },
    { pt: 'Impressos e material', de: 'Geschäftsdrucksachen', en: 'Printed materials' },
    { pt: 'Ação de abertura', de: 'Eröffnungsaktion', en: 'Opening campaign' },
  ],
  proprio: [
    { pt: 'Dinheiro próprio', de: 'Barmittel', en: 'Own cash' },
    { pt: 'Entradas em espécie (viatura, computador, mobiliário)', de: 'Sacheinlagen (PKW, PC, Büromöbel)', en: 'Contributions in kind (car, PC, furniture)' },
  ],
  alheio: [
    { pt: 'Empréstimo privado (família, amigos)', de: 'Privatdarlehen', en: 'Private loan' },
    { pt: 'Empréstimo público (KfW Startgeld / Mikrodarlehen)', de: 'Öffentliches Darlehen (KfW)', en: 'Public loan (KfW)' },
    { pt: 'Crédito bancário', de: 'Bankdarlehen', en: 'Bank loan' },
    { pt: 'Conta corrente caucionada', de: 'Kontokorrentkredit', en: 'Overdraft facility' },
  ],
  receitas: [
    { pt: 'Vendas / serviços principais', de: 'Hauptumsatz', en: 'Main sales/services' },
    { pt: 'Outras receitas', de: 'Sonstige Erlöse', en: 'Other revenue' },
  ],
  custos: [
    { pt: 'Compras e material', de: 'Wareneinsatz und Material', en: 'Purchases and materials' },
    { pt: 'Pessoal', de: 'Personal', en: 'Staff' },
    { pt: 'Renda e instalações', de: 'Miete und Räume', en: 'Rent and premises' },
    { pt: 'Marketing', de: 'Marketing', en: 'Marketing' },
    { pt: 'Seguros e taxas', de: 'Versicherungen und Gebühren', en: 'Insurance and fees' },
    { pt: 'Outros custos', de: 'Sonstige Kosten', en: 'Other costs' },
  ],
}

// Cria as linhas por omissão de uma tabela, no idioma pedido
export const linhasPadrao = (chave, lang = 'pt') =>
  (LINHAS_PADRAO[chave] || []).map(l => ({ desc: l[lang] || l.pt, valor: '' }))
