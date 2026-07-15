// ============================================================================
// Calendário Fiscal — gera prazos recorrentes de entrega/pagamento por país e
// regime, a partir dos Dados da Empresa. São ESTIMATIVAS/modelos editáveis: o
// utilizador confirma, ajusta ou elimina. As datas seguem prazos habituais.
//
// Portugal:
//   IVA (regime não isento): declaração periódica trimestral — dia 20 do 2.º
//     mês após o fim do trimestre.
//   Segurança Social (trabalhador independente): declaração trimestral — dia 20
//     de jan/abr/jul/out.
//   IRS: declaração anual — 30 de junho (rendimentos do ano anterior).
// Alemanha:
//   Umsatzsteuer-Voranmeldung (Regelbesteuerung): trimestral — dia 10 do mês
//     seguinte ao fim do trimestre.
//   Gewerbesteuer-Vorauszahlung: trimestral — 15 de fev/mai/ago/nov.
//   Einkommensteuererklärung: anual — 31 de julho (ano anterior).
// ============================================================================

const d = (y, m, day) => `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`

export function generateFiscalCalendar(settings, year) {
  const country = (settings?.country || 'PT').toUpperCase()
  const vatRegime = settings?.vat_regime || 'normal'
  const ssRegime = settings?.ss_regime || ''
  const out = []
  const push = (code, obligation_type, deadline) => out.push({ code, obligation_type, deadline, country, source: 'auto' })

  if (country === 'PT') {
    if (vatRegime !== 'exempt') {
      [[1, year, 5], [2, year, 8], [3, year, 11], [4, year + 1, 2]].forEach(([q, yy, mm]) =>
        push(`PT-IVA-${year}-T${q}`, `IVA — Declaração periódica (T${q}/${year})`, d(yy, mm, 20)))
    }
    if (ssRegime === 'self' || ssRegime === '') {
      [[1, 1], [2, 4], [3, 7], [4, 10]].forEach(([q, mm]) =>
        push(`PT-SS-${year}-T${q}`, `Segurança Social — Declaração trimestral (T${q}/${year})`, d(year, mm, 20)))
    }
    push(`PT-IRS-${year}`, `IRS — Declaração anual (${year - 1})`, d(year, 6, 30))
  }

  if (country === 'DE') {
    if (vatRegime !== 'exempt') {
      [[1, year, 4], [2, year, 7], [3, year, 10], [4, year + 1, 1]].forEach(([q, yy, mm]) =>
        push(`DE-UST-${year}-Q${q}`, `Umsatzsteuer-Voranmeldung (Q${q}/${year})`, d(yy, mm, 10)))
    }
    [[1, 2], [2, 5], [3, 8], [4, 11]].forEach(([q, mm]) =>
      push(`DE-GEW-${year}-Q${q}`, `Gewerbesteuer-Vorauszahlung (Q${q}/${year})`, d(year, mm, 15)))
    push(`DE-EST-${year}`, `Einkommensteuererklärung (${year - 1})`, d(year, 7, 31))
  }

  return out.sort((a, b) => a.deadline.localeCompare(b.deadline))
}
