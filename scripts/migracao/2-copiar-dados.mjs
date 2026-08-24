// ============================================================================
// PASSO 3b · Copiar os dados das tabelas public do projeto antigo para o novo.
//
// Corre DEPOIS do 1-exportar-auth.sql (as tabelas referenciam auth.users — sem
// os utilizadores no destino, os inserts falham por FK).
//
// Estratégia: descobre as tabelas pelo OpenAPI do PostgREST, copia por rondas —
// uma tabela que falhe por FK nesta ronda passa na seguinte, quando o pai já
// entrou. Converge em 2-3 rondas; upsert por id torna o script re-executável.
//
// Uso:  node scripts/migracao/2-copiar-dados.mjs
// Lê do .env.local: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (antigo)
//                   NOVA_SUPABASE_URL + NOVA_SERVICE_ROLE_KEY (novo)
// ============================================================================

import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const falta = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'NOVA_SUPABASE_URL', 'NOVA_SERVICE_ROLE_KEY']
  .filter(k => !env[k])
if (falta.length) { console.error('Faltam no .env.local:', falta.join(', ')); process.exit(1) }

const velho = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const novo = createClient(env.NOVA_SUPABASE_URL, env.NOVA_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

// Lista de tabelas via OpenAPI do PostgREST (só o schema public exposto)
async function listarTabelas(url, key) {
  const r = await fetch(`${url}/rest/v1/`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
  const spec = await r.json()
  return Object.keys(spec.definitions || {}).filter(t => !t.startsWith('rpc_'))
}

async function copiarTabela(t) {
  const { data, error } = await velho.from(t).select('*')
  if (error) return { t, erro: `ler: ${error.message}` }
  if (!data.length) return { t, n: 0 }
  // Em lotes, upsert por id (re-executável sem duplicar)
  for (let i = 0; i < data.length; i += 500) {
    const lote = data.slice(i, i + 500)
    const { error: e2 } = await novo.from(t).upsert(lote, { onConflict: 'id', ignoreDuplicates: false })
    if (e2) return { t, erro: e2.message }
  }
  return { t, n: data.length }
}

const tabelas = await listarTabelas(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
console.log(`Tabelas no antigo: ${tabelas.length}\n`)

let pendentes = [...tabelas]
const feitas = new Map()
for (let ronda = 1; ronda <= 5 && pendentes.length; ronda++) {
  console.log(`── Ronda ${ronda} ──`)
  const proxima = []
  for (const t of pendentes) {
    const r = await copiarTabela(t)
    if (r.erro) {
      // FK ainda por satisfazer? Tenta na próxima ronda
      if (/foreign key|violates/.test(r.erro) && ronda < 5) { proxima.push(t); console.log(`  ⏳ ${t} (aguarda pai)`) }
      else { feitas.set(t, r); console.log(`  ✗ ${t}: ${r.erro}`) }
    } else {
      feitas.set(t, r); console.log(`  ✓ ${t}: ${r.n} linhas`)
    }
  }
  pendentes = proxima
}

// ── Conferência: contagens dos dois lados ──
console.log('\n── Conferência ──')
let ok = true
for (const t of tabelas) {
  const [a, b] = await Promise.all([
    velho.from(t).select('id', { count: 'exact', head: true }),
    novo.from(t).select('id', { count: 'exact', head: true }),
  ])
  const igual = a.count === b.count
  ok = ok && igual
  console.log(`${igual ? ' ✓' : ' ✗'} ${t.padEnd(26)} antigo=${a.count} novo=${b.count}`)
}

// Utilizadores (via admin API, dos dois lados)
const [ua, ub] = await Promise.all([
  velho.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  novo.auth.admin.listUsers({ page: 1, perPage: 1000 }),
])
const uIgual = ua.data?.users?.length === ub.data?.users?.length
ok = ok && uIgual
console.log(`${uIgual ? ' ✓' : ' ✗'} auth.users${' '.repeat(16)} antigo=${ua.data?.users?.length} novo=${ub.data?.users?.length}`)

console.log(ok ? '\nDADOS COPIADOS E CONFERIDOS ✓' : '\n⚠ HÁ DIFERENÇAS — ver acima antes de continuar')
process.exit(ok ? 0 : 1)
