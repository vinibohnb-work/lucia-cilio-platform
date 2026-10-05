// ============================================================================
// Quando é que algo periódico é devido num mês (AAAA-MM).
//
// Uma só regra para contratos (avenças) e despesas recorrentes — antes as
// recorrentes usavam meses fixos (trimestral = jan/abr/jul/out; anual = janeiro)
// e a avença contava a partir do início. Revisão de 01/10, R-B4.
//
//   mensal     → todos os meses
//   trimestral → de 3 em 3 meses a contar do início (sem início: jan/abr/jul/out)
//   anual      → de 12 em 12 meses a contar do início (sem início: janeiro)
//   único      → só no mês de início
//   Nunca antes do início nem depois do fim (end_month, se houver).
// ============================================================================

const toYm = (p) => { const [y, m] = String(p).split('-').map(Number); return y * 12 + (m - 1) }

export function devidoNoPeriodo({ periodicity, start_month, end_month } = {}, period) {
  const ym = toYm(period)
  const inicio = start_month ? toYm(start_month) : null
  if (inicio != null && ym < inicio) return false
  if (end_month && ym > toYm(end_month)) return false
  const mes = Number(String(period).slice(5, 7))
  switch (periodicity) {
    case 'monthly':   return true
    case 'quarterly': return inicio != null ? (ym - inicio) % 3 === 0 : [1, 4, 7, 10].includes(mes)
    case 'annual':    return inicio != null ? (ym - inicio) % 12 === 0 : mes === 1
    case 'once':      return inicio != null && ym === inicio
    default:          return false
  }
}

// O mês corrente, em hora local (AAAA-MM).
export const mesAtual = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` }
