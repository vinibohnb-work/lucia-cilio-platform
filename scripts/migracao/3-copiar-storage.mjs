// ============================================================================
// PASSO 4 · Copiar os ficheiros do bucket client-docs do antigo para o novo.
//
// Lista recursivamente, descarrega e carrega ficheiro a ficheiro, e confere
// contagem + tamanho no fim. Re-executável (upsert).
//
// Uso:  node scripts/migracao/3-copiar-storage.mjs
// ============================================================================

import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const velho = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const novo = createClient(env.NOVA_SUPABASE_URL, env.NOVA_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const BUCKET = 'client-docs'

// Lista recursiva: o list() do Storage é por "pasta"
async function listar(cli, prefixo = '') {
  const { data, error } = await cli.storage.from(BUCKET).list(prefixo, { limit: 1000 })
  if (error) throw new Error(`listar ${prefixo}: ${error.message}`)
  const ficheiros = []
  for (const item of data || []) {
    const caminho = prefixo ? `${prefixo}/${item.name}` : item.name
    if (item.id === null) ficheiros.push(...await listar(cli, caminho))   // pasta
    else ficheiros.push({ caminho, tamanho: item.metadata?.size ?? 0 })
  }
  return ficheiros
}

const doVelho = await listar(velho)
console.log(`Ficheiros no antigo: ${doVelho.length}`)

let copiados = 0, falhas = 0
for (const f of doVelho) {
  const { data: blob, error: e1 } = await velho.storage.from(BUCKET).download(f.caminho)
  if (e1) { console.log(` ✗ download ${f.caminho}: ${e1.message}`); falhas++; continue }
  const { error: e2 } = await novo.storage.from(BUCKET).upload(f.caminho, blob, { upsert: true })
  if (e2) { console.log(` ✗ upload ${f.caminho}: ${e2.message}`); falhas++; continue }
  copiados++
  console.log(` ✓ ${f.caminho} (${f.tamanho} bytes)`)
}

// Conferência
const doNovo = await listar(novo)
const mapaNovo = new Map(doNovo.map(f => [f.caminho, f.tamanho]))
let ok = falhas === 0 && doNovo.length >= doVelho.length
for (const f of doVelho) {
  if (!mapaNovo.has(f.caminho)) { console.log(` ✗ FALTA no novo: ${f.caminho}`); ok = false }
  else if (mapaNovo.get(f.caminho) !== f.tamanho) { console.log(` ✗ TAMANHO difere: ${f.caminho}`); ok = false }
}
console.log(`\n${copiados}/${doVelho.length} copiados · antigo=${doVelho.length} novo=${doNovo.length}`)
console.log(ok ? 'STORAGE COPIADO E CONFERIDO ✓' : '⚠ HÁ DIFERENÇAS — ver acima')
process.exit(ok ? 0 : 1)
