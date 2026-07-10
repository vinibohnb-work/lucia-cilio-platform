// ============================================================================
// Preiskalkulation pro Behandlung — fiel à planilha da Célia
// (Celia_Preiskalkulation_Familienversicherung.xlsx, folha "Preiskalkulation").
//
// Fórmulas da planilha:
//   Stundenwert            = Minutenpreis × 60
//   Gemeinkosten/Stunde    = Fixkosten mensais ÷ horas produtivas   (IFERROR→0)
//   Gemeinkostenanteil     = Gemeinkosten/h × (duração em min ÷ 60)
//   Arbeitswert            = Minutenpreis × duração em min
//   Selbstkosten (mínimo)  = Arbeitswert + Material + Gemeinkostenanteil
//   Preço netto            = Selbstkosten × (1 + margem% + reserva%)
//   Preço brutto           = netto × (1+USt) apenas em Regelbesteuerung
//   Diferença              = preço atual − Selbstkosten
//   Reserva do preço atual = base "Gewinn": max(0, atual − material − GK) × res%
//                            base "Umsatz": atual × res%
// ============================================================================

const num = (v) => { const x = Number(String(v ?? '').replace(',', '.')); return Number.isFinite(x) ? x : 0 }

export function computeTreatment(input) {
  const minutePrice = num(input.minutePrice)
  const durationMin = num(input.durationMin)
  const material = num(input.material)
  const monthlyFixed = num(input.monthlyFixed)
  const productiveHours = num(input.productiveHours)
  const profitPct = num(input.profitPct)   // ex.: 20
  const reservePct = num(input.reservePct) // ex.: 20
  const vatPct = num(input.vatPct)         // ex.: 19
  const regel = input.vatRegime === 'normal' || input.vatRegime === 'regel'
  const currentPrice = num(input.currentPrice)
  const reserveBasis = input.reserveBasis === 'umsatz' ? 'umsatz' : 'gewinn'

  const hourValue = minutePrice * 60
  const durationH = durationMin / 60
  const overheadPerHour = productiveHours > 0 ? monthlyFixed / productiveHours : 0
  const overheadShare = overheadPerHour * durationH
  const laborValue = minutePrice * durationMin
  const minBase = laborValue + material + overheadShare           // Selbstkosten
  const priceNet = minBase * (1 + profitPct / 100 + reservePct / 100)
  const priceGross = regel ? priceNet * (1 + vatPct / 100) : priceNet
  const diffToMinBase = currentPrice - minBase
  const reserveFromCurrent = reserveBasis === 'gewinn'
    ? Math.max(0, currentPrice - material - overheadShare) * reservePct / 100
    : currentPrice * reservePct / 100

  return {
    hourValue, durationH, overheadPerHour, overheadShare, laborValue,
    minBase, priceNet, priceGross, diffToMinBase, reserveFromCurrent,
  }
}
