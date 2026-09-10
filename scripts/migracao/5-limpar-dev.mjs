// ============================================================================
// Limpeza do projeto ANTIGO (us-west-2), que passou a ser o ambiente de DEV.
//
// Depois da migração para Frankfurt (24/08), o projeto antigo ficou com uma
// cópia dos dados reais dos clientes a viver nos Estados Unidos. Isso contradiz
// exatamente o argumento que demos à Lúcia sobre residência de dados na UE — e
// é o item ⚡ que falta fechar da auditoria de 21/08.
//
// Este script apaga esses dados e deixa o projeto antigo a servir para o que
// passou a ser: testar.
//
// ── SEGURANÇA ────────────────────────────────────────────────────────────────
// 1. Corre em SIMULAÇÃO por omissão: mostra o que apagaria e não toca em nada.
//    Só apaga com --confirmar.
// 2. Recusa-se a correr contra a produção: compara com NOVA_SUPABASE_URL e pára
//    se forem o mesmo projeto.
// 3. Faz um backup local antes de apagar (fora do OneDrive, como o script 4).
// 4. As contas em MANTER ficam — são as de teste.
//
// Uso:
//   node scripts/migracao/5-limpar-dev.mjs                → simulação
//   node scripts/migracao/5-limpar-dev.mjs --confirmar    → apaga a sério
// ============================================================================

import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const CONFIRMAR = process.argv.includes('--confirmar')

// Contas que NÃO são para apagar (as de teste do próprio ambiente de dev).
// Acrescenta aqui os emails que quiseres preservar antes de correr.
const MANTER = [
  'vinibohnb@gmail.com',
]

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)

const URL_DEV = env.SUPABASE_URL || env.VITE_SUPABASE_URL
const KEY_DEV = env.SUPABASE_SERVICE_ROLE_KEY
if (!URL_DEV || !KEY_DEV) {
  console.error('Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env.local'); process.exit(1)
}

// Trava de segurança: nunca contra a produção.
if (env.NOVA_SUPABASE_URL && URL_DEV.trim() === env.NOVA_SUPABASE_URL.trim()) {
  console.error('ABORTADO: o alvo é o projeto de PRODUÇÃO. Este script só corre contra o antigo/dev.')
  process.exit(1)
}

const dev = createClient(URL_DEV, KEY_DEV, { auth: { persistSession: false } })
const ref = URL_DEV.replace('https://', '').split('.')[0]

console.log(`Alvo: ${ref} (dev/antigo)`)
console.log(CONFIRMAR ? 'MODO: apagar a sério\n' : 'MODO: simulação — nada será apagado\n')

// ── 1. Utilizadores ─────────────────────────────────────────────────────────
const { data: lista, error: errU } = await dev.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (errU) { console.error('Falha a listar utilizadores:', errU.message); process.exit(1) }

const utilizadores = lista.users
const aApagar = utilizadores.filter(u => !MANTER.includes((u.email || '').toLowerCase()))
const aManter = utilizadores.filter(u => MANTER.includes((u.email || '').toLowerCase()))

console.log(`Utilizadores: ${utilizadores.length} no total`)
console.log(`  manter (${aManter.length}): ${aManter.map(u => u.email).join(', ') || '—'}`)
console.log(`  apagar (${aApagar.length}):`)
for (const u of aApagar) console.log(`    ${u.email}`)

// ── 2. Backup antes de apagar ───────────────────────────────────────────────
if (CONFIRMAR) {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
  const destino = path.join(process.env.USERPROFILE || process.env.HOME, 'lc-backups', `dev-antes-limpeza-${stamp}`)
  fs.mkdirSync(destino, { recursive: true })

  const r = await fetch(`${URL_DEV}/rest/v1/`, {
    headers: { apikey: KEY_DEV, Authorization: `Bearer ${KEY_DEV}` },
  })
  const tabelas = Object.keys((await r.json()).definitions || {})
  for (const tab of tabelas) {
    const { data } = await dev.from(tab).select('*')
    fs.writeFileSync(path.join(destino, `${tab}.json`), JSON.stringify(data || [], null, 2))
  }
  fs.writeFileSync(path.join(destino, '_utilizadores.json'),
    JSON.stringify(utilizadores.map(u => ({ id: u.id, email: u.email, created_at: u.created_at })), null, 2))
  console.log(`\nBackup guardado em ${destino}`)
  console.log('(fora da pasta do projeto, para não ir parar ao OneDrive)')
}

// ── 3. Apagar ───────────────────────────────────────────────────────────────
// Apagar o utilizador leva atrás as tabelas em cascata. Os ficheiros do Storage
// não vão atrás — por isso são apagados aqui à mão, tal como no api/admin-users.
const BUCKET = 'client-docs'
async function listarFicheiros(prefixo) {
  const { data, error } = await dev.storage.from(BUCKET).list(prefixo, { limit: 1000 })
  if (error) return []
  const caminhos = []
  for (const item of data || []) {
    const caminho = `${prefixo}/${item.name}`
    if (item.id === null) caminhos.push(...await listarFicheiros(caminho))
    else caminhos.push(caminho)
  }
  return caminhos
}

if (!CONFIRMAR) {
  console.log('\nSimulação terminada. Para apagar a sério:')
  console.log('  node scripts/migracao/5-limpar-dev.mjs --confirmar')
  process.exit(0)
}

let apagados = 0, docs = 0
for (const u of aApagar) {
  const ficheiros = await listarFicheiros(u.id)
  if (ficheiros.length) {
    for (let i = 0; i < ficheiros.length; i += 100) {
      await dev.storage.from(BUCKET).remove(ficheiros.slice(i, i + 100))
    }
    docs += ficheiros.length
  }
  const { error } = await dev.auth.admin.deleteUser(u.id)
  if (error) console.log(`  falhou ${u.email}: ${error.message}`)
  else { apagados++; console.log(`  apagado ${u.email}`) }
}

console.log(`\nFeito: ${apagados} utilizadores e ${docs} ficheiros apagados do ambiente de dev.`)
console.log('Confirma no painel do Supabase e volta a criar as contas de teste que precisares.')
