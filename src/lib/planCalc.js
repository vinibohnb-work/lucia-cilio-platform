// ============================================================================
// Monatsplanung — planeamento mensal de serviços (folha "Monatsplanung" da
// planilha da Célia) + verificação Familienversicherung (folha "Dashboard").
//
// Fórmulas por linha (planilha):
//   Umsatz            = preço × quantidade/mês
//   Material gesamt   = material por tratamento × quantidade
//   Gemeinkostenanteil= (duração min ÷ 60) × Gemeinkosten/hora × quantidade
//   Gewinn (EÜR)      = Umsatz − Material − Gemeinkosten
//   Rücklage          = base "gewinn": max(0, Gewinn) × res%
//                       base "umsatz": Umsatz × res%
//   Nach Rücklage     = Gewinn − Rücklage
//
// Familienversicherung (Dashboard):
//   Status  = lucro mensal ≤ limite → "OK – unter Grenze" senão "Achtung"
//   Abstand = limite − lucro mensal · Ampel = grün/rot · rácio = lucro/limite
// ============================================================================

const num = (v) => { const x = Number(String(v ?? '').replace(',', '.')); return Number.isFinite(x) ? x : 0 }

export function overheadPerHour(monthlyFixed, productiveHours) {
  const f = num(monthlyFixed), h = num(productiveHours)
  return h > 0 ? f / h : 0 // IFERROR → 0
}

export function computePlanRow(row, ohPerHour, reservePct, reserveBasis = 'gewinn') {
  const qty = num(row.qty)
  const revenue = num(row.price) * qty
  const materialTotal = num(row.material) * qty
  const overhead = (num(row.durationMin) / 60) * num(ohPerHour) * qty
  const profit = revenue - materialTotal - overhead
  const reserve = reserveBasis === 'umsatz'
    ? revenue * num(reservePct) / 100
    : Math.max(0, profit) * num(reservePct) / 100
  return { revenue, materialTotal, overhead, profit, reserve, afterReserve: profit - reserve }
}

export function computePlanTotals(rows, ohPerHour, reservePct, reserveBasis = 'gewinn') {
  const computed = (rows || []).map(r => computePlanRow(r, ohPerHour, reservePct, reserveBasis))
  const sum = (k) => computed.reduce((s, c) => s + c[k], 0)
  return {
    rows: computed,
    revenue: sum('revenue'), materialTotal: sum('materialTotal'), overhead: sum('overhead'),
    profit: sum('profit'), reserve: sum('reserve'), afterReserve: sum('afterReserve'),
  }
}

// ── Familienversicherung (limite mensal de lucro p/ seguro familiar DE) ──
export function famvCheck(monthlyProfit, limit) {
  const p = num(monthlyProfit), l = num(limit)
  return {
    ok: p <= l,
    distance: l - p,                    // Abstand zur Grenze
    ratio: l > 0 ? p / l : 0,           // Monatsgewinn / Grenze
  }
}
