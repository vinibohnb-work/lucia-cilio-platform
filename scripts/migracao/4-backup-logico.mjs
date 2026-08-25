// ============================================================================
// Backup lógico da PRODUÇÃO (LC Office EU) para o disco local.
//
// Existe porque a produção está no plano Free do Supabase, sem backups
// automáticos, até o upgrade Pro acontecer. Não substitui o Pro — é a rede de
// segurança do intervalo: um JSON por tabela + utilizadores, num diretório
// datado, restaurável com o 2-copiar-dados.mjs invertido.
//
// O destino fica FORA da pasta do projeto de propósito: o projeto está numa
// pasta sincronizada com o OneDrive, e um backup com dados reais de clientes
// não deve ser copiado para a nuvem da Microsoft (é o mesmo princípio do ⚡2
// da auditoria).
//
// Uso:  node scripts/migracao/4-backup-logico.mjs
// ============================================================================

import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
if (!env.NOVA_SUPABASE_URL || !env.NOVA_SERVICE_ROLE_KEY) {
  console.error('Faltam NOVA_SUPABASE_URL / NOVA_SERVICE_ROLE_KEY no .env.local'); process.exit(1)
}
const prod = createClient(env.NOVA_SUPABASE_URL, env.NOVA_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
const destino = path.join(process.env.USERPROFILE || process.env.HOME, 'lc-backups', stamp)
fs.mkdirSync(destino, { recursive: true })

// Tabelas via OpenAPI
const r = await fetch(`${env.NOVA_SUPABASE_URL}/rest/v1/`, {
  headers: { apikey: env.NOVA_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.NOVA_SERVICE_ROLE_KEY}` },
})
const tabelas = Object.keys((await r.json()).definitions || {})

let total = 0
for (const t of tabelas) {
  const { data, error } = await prod.from(t).select('*')
  if (error) { console.log(` ✗ ${t}: ${error.message}`); continue }
  fs.writeFileSync(path.join(destino, `${t}.json`), JSON.stringify(data, null, 1))
  total += data.length
  console.log(` ✓ ${t}: ${data.length} linhas`)
}

// Utilizadores (metadados via admin API — os hashes de senha NÃO saem por aqui;
// para restauro completo de senhas é preciso o export SQL do 1-exportar-auth)
const { data: u } = await prod.auth.admin.listUsers({ page: 1, perPage: 1000 })
fs.writeFileSync(path.join(destino, '_auth_users.json'), JSON.stringify(u?.users || [], null, 1))
console.log(` ✓ auth.users: ${u?.users?.length || 0} contas (metadados)`)

// Storage
const { data: pastas } = await prod.storage.from('client-docs').list('', { limit: 1000 })
let ficheiros = 0
async function descer(prefixo) {
  const { data } = await prod.storage.from('client-docs').list(prefixo, { limit: 1000 })
  for (const item of data || []) {
    const caminho = prefixo ? `${prefixo}/${item.name}` : item.name
    if (item.id === null) { await descer(caminho); continue }
    const { data: blob } = await prod.storage.from('client-docs').download(caminho)
    if (blob) {
      const alvo = path.join(destino, 'storage', caminho)
      fs.mkdirSync(path.dirname(alvo), { recursive: true })
      fs.writeFileSync(alvo, Buffer.from(await blob.arrayBuffer()))
      ficheiros++
    }
  }
}
if (pastas?.length) await descer('')
console.log(` ✓ storage: ${ficheiros} ficheiro(s)`)

console.log(`\nBACKUP COMPLETO ✓  →  ${destino}`)
console.log(`${tabelas.length} tabelas · ${total} linhas · ${(u?.users?.length || 0)} contas`)
