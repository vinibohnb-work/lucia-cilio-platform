// ============================================================================
// Cálculos do relatório EÜR (Einnahmen-Überschuss-Rechnung) alemão, a partir
// do Livro de Caixa. Referência: as imagens que a Lúcia enviou a 20/08 (o EÜR
// da ferramenta anterior dela).
//
// A regra que estrutura tudo, por regime de caixa (Zufluss/Abfluss):
//   · regime NORMAL   → receitas e despesas em valor LÍQUIDO; o IVA recebido
//     (vereinnahmte USt) conta como receita e o IVA pago (Vorsteuer) como
//     despesa — é assim que o formulário oficial fecha as contas;
//   · KLEINUNTERNEHMER (isento) → tudo em valor BRUTO, sem separação de IVA.
//
// Verificado contra a referência dela: 590,00 brutos a 19% → 495,80 líquidos.
//
// Nota sobre a numeração oficial (Zeile/Position): só usamos a que a
// referência confirma — Zeile 15 · Position 112 para as receitas à taxa
// normal. O resto fica sem número, porque o formulário muda de ano para ano e
// inventar numeração num documento fiscal é pior do que omitir.
// ============================================================================

const num = (v) => Number(v) || 0

// Líquido de um lançamento: o bruto menos o IVA já calculado na entrada.
export const liquidoDe = (e) => num(e.amount) - num(e.vat_amount)

// Divide os lançamentos de um ano pelos grupos do EÜR.
// `regime` é o vat_regime das definições da empresa: 'normal' | 'exempt'.
export function calcularEUR(entries, regime = 'normal') {
  const ativos = (entries || []).filter(e => !e.private)
  const receitas = ativos.filter(e => e.type === 'entrada')
  const despesas = ativos.filter(e => e.type === 'saida')
  const isento = regime === 'exempt'

  const soma = (arr, f) => arr.reduce((s, e) => s + f(e), 0)
  const taxa = (e) => num(e.vat_rate)

  if (isento) {
    // Kleinunternehmer: brutos, uma linha única de receitas
    const linhasReceita = [{
      key: 'klein',
      zeile: null, position: null,
      grupo: 'receita',
      total: soma(receitas, e => num(e.amount)),
      entries: receitas,
    }].filter(l => l.entries.length)
    const porCategoria = agruparDespesas(despesas, e => num(e.amount))
    const totalReceitas = soma(receitas, e => num(e.amount))
    const totalDespesas = soma(despesas, e => num(e.amount))
    return {
      regime: 'exempt',
      linhasReceita, linhasDespesa: porCategoria,
      vatRecebido: 0, vatPago: 0,
      totalReceitas, totalDespesas, resultado: totalReceitas - totalDespesas,
    }
  }

  // Regime normal: líquidos + as duas linhas de IVA
  const rNormal = receitas.filter(e => taxa(e) >= 15)          // 19 % (taxa normal)
  const rReduzida = receitas.filter(e => taxa(e) > 0 && taxa(e) < 15)   // 7 % etc.
  const rSemIva = receitas.filter(e => taxa(e) === 0)

  const linhasReceita = [
    // A única linha com numeração confirmada pela referência da Lúcia
    { key: 'normal19', zeile: 15, position: 112, grupo: 'receita', total: soma(rNormal, liquidoDe), entries: rNormal },
    { key: 'reduzida', zeile: null, position: null, grupo: 'receita', total: soma(rReduzida, liquidoDe), entries: rReduzida },
    { key: 'semIva', zeile: null, position: null, grupo: 'receita', total: soma(rSemIva, e => num(e.amount)), entries: rSemIva },
  ].filter(l => l.entries.length)

  const vatRecebido = soma(receitas, e => num(e.vat_amount))
  const vatPago = soma(despesas, e => num(e.vat_amount))
  const linhasDespesa = agruparDespesas(despesas, liquidoDe)

  const totalReceitas = soma(linhasReceita, l => l.total) + vatRecebido
  const totalDespesas = soma(linhasDespesa, l => l.total) + vatPago

  return {
    regime: 'normal',
    linhasReceita, linhasDespesa,
    vatRecebido, vatPago,
    totalReceitas, totalDespesas, resultado: totalReceitas - totalDespesas,
  }
}

function agruparDespesas(despesas, valorDe) {
  const grupos = new Map()
  for (const e of despesas) {
    const k = e.category || 'outros'
    if (!grupos.has(k)) grupos.set(k, { key: `cat:${k}`, categoria: k, grupo: 'despesa', total: 0, entries: [] })
    const g = grupos.get(k)
    g.total += valorDe(e)
    g.entries.push(e)
  }
  return [...grupos.values()].sort((a, b) => b.total - a.total)
}
