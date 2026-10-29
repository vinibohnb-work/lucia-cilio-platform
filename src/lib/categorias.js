import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { EXPENSE_CATEGORIES, getCategory } from '../data/expenseCategories'

// Categorias dos lançamentos (reunião de 29/10 com a Lúcia).
// - Saídas: a lista base de src/data/expenseCategories.js (com o tipo de custo
//   que o Painel e o EÜR usam).
// - Entradas: uma lista base pequena, só para organizar — não muda nenhum cálculo.
// - Por cliente, a equipa junta categorias suas na ficha (Gestão → cliente →
//   Dados), em clientes.categorias = { entradas: [...], saidas: [...] }
//   (migração 053). No lançamento ficam gravadas como "x:<nome>"; tudo o que
//   não conhece uma chave "x:" trata-a como "outras" (Painel: custo estrutural;
//   EÜR: uma linha com o nome dela).

export const INCOME_CATEGORIES = [
  { key: 'servicos', pt: { label: 'Prestação de serviços' }, de: { label: 'Dienstleistungen' }, en: { label: 'Services' } },
  { key: 'vendas', pt: { label: 'Venda de produtos' }, de: { label: 'Warenverkauf' }, en: { label: 'Product sales' } },
  { key: 'subsidios', pt: { label: 'Subsídios e apoios' }, de: { label: 'Zuschüsse und Förderungen' }, en: { label: 'Grants and subsidies' } },
  { key: 'outras_receitas', pt: { label: 'Outras receitas' }, de: { label: 'Sonstige Einnahmen' }, en: { label: 'Other income' } },
]
const INCOME_BY_KEY = Object.fromEntries(INCOME_CATEGORIES.map(c => [c.key, c]))

export const PREFIXO_EXTRA = 'x:'
export const MAX_NOME = 40
export const MAX_EXTRAS = 30
export const chaveExtra = (nome) => PREFIXO_EXTRA + String(nome).trim().slice(0, MAX_NOME)
export const ehExtra = (key) => typeof key === 'string' && key.startsWith(PREFIXO_EXTRA)

// Rótulo de qualquer categoria gravada num lançamento (base, de entrada ou extra)
export function rotuloCategoria(key, lang = 'pt') {
  if (!key) return ''
  if (ehExtra(key)) return key.slice(PREFIXO_EXTRA.length)
  const d = getCategory(key)
  if (d) return d[lang]?.label || d.pt.label
  const r = INCOME_BY_KEY[key]
  return r ? (r[lang]?.label || r.pt.label) : key
}

// Limpa a lista que a equipa escreveu: sem vazios, sem repetidos, nomes curtos
export function limparLista(lista) {
  const vistos = new Set()
  const out = []
  for (const v of Array.isArray(lista) ? lista : []) {
    const nome = String(v ?? '').trim().slice(0, MAX_NOME)
    const k = nome.toLowerCase()
    if (!nome || vistos.has(k)) continue
    vistos.add(k); out.push(nome)
    if (out.length >= MAX_EXTRAS) break
  }
  return out
}
export const limparCategorias = (v) => ({ entradas: limparLista(v?.entradas), saidas: limparLista(v?.saidas) })

// Opções de um seletor de categoria: a base do tipo + as do cliente
export function opcoesCategorias(tipo, extras, lang = 'pt') {
  const base = tipo === 'entrada' ? INCOME_CATEGORIES : tipo === 'saida' ? EXPENSE_CATEGORIES : []
  const proprias = (tipo === 'entrada' ? extras?.entradas : tipo === 'saida' ? extras?.saidas : null) || []
  return [
    ...base.map(c => ({ value: c.key, label: c[lang]?.label || c.pt.label })),
    ...proprias.map(nome => ({ value: chaveExtra(nome), label: nome, propria: true })),
  ]
}

// As categorias extra da conta (a ficha da Gestão ligada a este user_id).
// O cliente lê a sua ficha (migração 039); a equipa lê todas.
export function useCategoriasExtra(userId) {
  const [extras, setExtras] = useState({ entradas: [], saidas: [] })
  useEffect(() => {
    let vivo = true
    if (!userId) return undefined
    supabase.from('clientes').select('categorias').eq('user_id', userId).limit(1).maybeSingle()
      .then(({ data }) => { if (vivo) setExtras(limparCategorias(data?.categorias)) })
    return () => { vivo = false }
  }, [userId])
  return extras
}
