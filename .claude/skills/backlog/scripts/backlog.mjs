// Backlog do cliente no sistema interno da Scalasys, pelo token pessoal.
//
//   node .claude/skills/backlog/scripts/backlog.mjs <ação> [args] [--cliente <id ou nome>] [--json]
//
//   clientes                                  clientes ativos
//   listar [--estado aberto|feito|descartado] [--tipo dev|validacao|diretriz]
//   criar --titulo "…" [--detalhe "…"] [--tipo dev] [--grupo "…"] [--responsavel "…"]
//   concluir <id> [--entrega "o que foi entregue"]
//   atualizar <id> [--titulo …] [--detalhe …] [--grupo …] [--tipo …] [--estado …] [--responsavel …] [--entrega …] [--ordem N]
//   pendentes                                 ações de reunião (60 dias) sem decisão
//   decidir <meeting_id> <item> <dev|validacao|comercial|tratada> [--titulo "…"]
//
// Token: variável SCALASYS_TOKEN ou o arquivo ~/.scalasys/token (gerado no painel:
// Clientes Ativos → cliente → Backlog → Conectar o Claude Code). Nunca imprima o token.
// Cliente: --cliente, ou a linha "Sistema interno: cliente `<id>`" do CLAUDE.md da pasta atual.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const URL = 'https://ewvobahadfdngrwkfyxh.supabase.co/functions/v1/backlog-api'

const args = process.argv.slice(2)
const flags = {}
const pos = []
for (let i = 0; i < args.length; i++) {
  const a = args[i]
  if (a.startsWith('--')) {
    const k = a.slice(2)
    const v = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true
    flags[k] = v
  } else pos.push(a)
}
const [acao, ...resto] = pos
if (!acao) { console.error('uso: backlog.mjs <clientes|listar|criar|concluir|atualizar|pendentes|decidir> …'); process.exit(1) }

function token() {
  if (process.env.SCALASYS_TOKEN) return process.env.SCALASYS_TOKEN.trim()
  // o Bloco de Notas costuma salvar como token.txt: vale também
  for (const nome of ['token', 'token.txt']) {
    const arq = path.join(os.homedir(), '.scalasys', nome)
    if (fs.existsSync(arq)) return fs.readFileSync(arq, 'utf8').trim()
  }
  console.error('Sem token. Gere no painel (Clientes Ativos → cliente → Backlog → Conectar o Claude Code) e salve em ~/.scalasys/token.')
  process.exit(2)
}
function clienteDaPasta() {
  for (let dir = process.cwd(), i = 0; i < 6; i++, dir = path.dirname(dir)) {
    const arq = path.join(dir, 'CLAUDE.md')
    if (fs.existsSync(arq)) {
      const m = fs.readFileSync(arq, 'utf8').match(/Sistema interno:\s*cliente\s*`([0-9a-f-]{36})`/i)
      if (m) return m[1]
    }
    if (path.dirname(dir) === dir) break
  }
  return null
}

const corpo = { acao }
const cliente = flags.cliente || clienteDaPasta()
if (!['clientes', 'concluir', 'atualizar'].includes(acao)) {
  if (!cliente) { console.error('Qual cliente? Use --cliente <id ou nome> (rode "clientes" para ver a lista).'); process.exit(1) }
  corpo.cliente = cliente
}
const CAMPOS = ['titulo', 'detalhe', 'tipo', 'grupo', 'estado', 'responsavel', 'entrega', 'ordem', 'origem']
for (const k of CAMPOS) if (k in flags && flags[k] !== true) corpo[k] = k === 'ordem' ? Number(flags[k]) : String(flags[k])
if (acao === 'listar') { delete corpo.titulo; if (flags.estado) corpo.estado = flags.estado; if (flags.tipo) corpo.tipo = flags.tipo }
if (acao === 'concluir' || acao === 'atualizar') corpo.id = resto[0]
if (acao === 'decidir') { corpo.meeting_id = resto[0]; corpo.meeting_item = Number(resto[1]); corpo.tipo = resto[2] }

const r = await fetch(URL, { method: 'POST', headers: { 'content-type': 'application/json', 'x-scalasys-token': token() }, body: JSON.stringify(corpo) })
const d = await r.json().catch(() => ({ error: 'resposta ilegível (HTTP ' + r.status + ')' }))
if (!r.ok || !d.ok) { console.error('Erro: ' + (d.error || r.status)); process.exit(1) }
if (flags.json) { console.log(JSON.stringify(d, null, 1)); process.exit(0) }

const curto = (s, n = 160) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s }
if (acao === 'clientes') {
  for (const c of d.clientes) console.log(`${c.id}  ${c.empresa || c.nome} (${c.nome})${c.fase ? ' · ' + c.fase : ''}`)
} else if (acao === 'listar') {
  console.log(`# Backlog · ${d.cliente.empresa || d.cliente.nome} (${d.itens.length} itens)`)
  let grupo = null
  for (const i of d.itens) {
    if (i.grupo !== grupo) { grupo = i.grupo; console.log(`\n## ${grupo || 'Sem grupo'}`) }
    const marca = i.estado === 'feito' ? '[x]' : i.estado === 'descartado' ? '[-]' : i.tipo === 'diretriz' ? ' • ' : '[ ]'
    console.log(`${marca} ${i.titulo}${i.tipo === 'validacao' ? ' (validação)' : ''}${i.responsavel ? ` — ${i.responsavel}` : ''}  {id: ${i.id}}`)
    if (i.detalhe) console.log(`    ${curto(i.detalhe)}`)
    if (i.entrega) console.log(`    ✔ ${curto(i.entrega)}`)
  }
} else if (acao === 'pendentes') {
  console.log(`# Ações de reunião sem decisão · ${d.cliente.empresa || d.cliente.nome} (${d.pendentes.length})`)
  for (const p of d.pendentes) {
    const quem = p.reuniao.com_equipe ? `conversa com ${p.reuniao.com_equipe}` : 'reunião'
    console.log(`- ${p.titulo}${p.dono ? ` (resp.: ${p.dono})` : ''} · ${quem} ${String(p.reuniao.data || '').slice(0, 10)}  {meeting: ${p.meeting_id}, item: ${p.meeting_item}}`)
  }
} else {
  const i = d.item
  console.log(`ok: ${i.titulo} · ${i.estado}${i.tipo !== 'dev' ? ' · ' + i.tipo : ''}  {id: ${i.id}}`)
}
