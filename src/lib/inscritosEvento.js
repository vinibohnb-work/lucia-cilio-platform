import { parseCSV, semAcentos } from './extratoBancario.js'

// Lê o CSV de convidados do Luma (ou qualquer folha com nome e e-mail).
// Fica de fora quem recusou, foi rejeitado ou está em lista de espera.
export function lerInscritos(texto) {
  const linhas = parseCSV(texto)
  if (linhas.length < 2) return []
  const cab = linhas[0].map(semAcentos)
  const col = (...nomes) => cab.findIndex(c => nomes.some(n => c === n))
  const iNome = col('name', 'nome', 'full name', 'nome completo')
  const iPrim = col('first_name', 'first name', 'primeiro nome')
  const iUlt = col('last_name', 'last name', 'apelido', 'ultimo nome')
  const iEmail = cab.findIndex(c => c.includes('email') || c.includes('e-mail'))
  const iEstado = cab.findIndex(c => c.includes('approval') || c === 'status' || c === 'estado')
  if (iEmail < 0 || (iNome < 0 && iPrim < 0)) return null
  const fora = /declin|reject|recus|waitlist|espera|cancel/
  const vistos = new Set()
  const out = []
  for (const l of linhas.slice(1)) {
    const email = String(l[iEmail] || '').trim().toLowerCase()
    const nome = (iNome >= 0 ? l[iNome] : [l[iPrim], iUlt >= 0 ? l[iUlt] : ''].join(' ')).trim()
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !nome) continue
    if (iEstado >= 0 && fora.test(semAcentos(l[iEstado]))) continue
    if (vistos.has(email)) continue
    vistos.add(email)
    out.push({ nome: nome.slice(0, 80), email })
  }
  return out
}
