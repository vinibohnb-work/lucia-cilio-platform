// ============================================================================
// Regras EÜR para lançamentos do Livro de Caixa.
// Movimentos privados (Privatentnahme / Privateinlage) afetam o SALDO de
// caixa/banco mas NUNCA o lucro, o IVA nem as reservas — por isso todos os
// cálculos de resultado devem filtrar com isBusiness().
// ============================================================================

export const isPrivate = (e) => !!e?.private
export const isBusiness = (e) => !e?.private

// Apenas lançamentos empresariais (exclui Privatentnahme/Privateinlage)
export const businessOnly = (entries) => (entries || []).filter(isBusiness)

// Rótulo do movimento para UI/CSV
export function entryTypeLabel(e, lang) {
  if (e.private) {
    return e.type === 'entrada'
      ? 'Privateinlage'
      : 'Privatentnahme'
  }
  if (lang === 'de') return e.type === 'entrada' ? 'Einnahme' : 'Ausgabe'
  if (lang === 'en') return e.type === 'entrada' ? 'Income' : 'Expense'
  return e.type === 'entrada' ? 'Entrada' : 'Saída'
}
