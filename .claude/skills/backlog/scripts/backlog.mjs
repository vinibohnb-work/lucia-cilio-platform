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
//   resumo [--hook]                            próximos itens, novidades de 7 dias e ações por decidir
//                                             (--hook: usado no início de cada conversa; falha em silêncio)
//
// Token: variável SCALASYS_TOKEN ou o arquivo ~/.scalasys/token (gerado no painel:
// Clientes Ativos → cliente → Backlog → Conectar o Claude Code). Nunca imprima o token.
// Cliente: --cliente, ou a linha "Sistema interno: cliente `<id>`" do CLAUDE.md da pasta atual.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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
const HOOK = !!flags.hook
const sair = (msg, codigo = 1) => { if (HOOK) process.exit(0); console.error(msg); process.exit(codigo) }
if (!acao) { console.error('uso: backlog.mjs <clientes|listar|criar|concluir|atualizar|pendentes|decidir> …'); process.exit(1) }

function token() {
  if (process.env.SCALASYS_TOKEN) return process.env.SCALASYS_TOKEN.trim()
  // o Bloco de Notas costuma salvar como token.txt: vale também
  for (const nome of ['token', 'token.txt']) {
    const arq = path.join(os.homedir(), '.scalasys', nome)
    if (fs.existsSync(arq)) return fs.readFileSync(arq, 'utf8').trim()
  }
  sair('Sem token. Gere no painel (Clientes Ativos → cliente → Backlog → Conectar o Claude Code) e salve em ~/.scalasys/token.', 2)
}
// O CLAUDE.md do projeto: a partir da pasta atual e, se não achar, da raiz do
// repositório onde este script mora (.claude/skills/backlog/scripts → 4 acima)
function clienteDaPasta() {
  const inicios = [process.cwd(), path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..')]
  for (const ini of inicios) {
    for (let dir = ini, i = 0; i < 6; i++, dir = path.dirname(dir)) {
      const arq = path.join(dir, 'CLAUDE.md')
      if (fs.existsSync(arq)) {
        const m = fs.readFileSync(arq, 'utf8').match(/Sistema interno:\s*cliente\s*`([0-9a-f-]{36})`/i)
        if (m) return m[1]
      }
      if (path.dirname(dir) === dir) break
    }
  }
  return null
}

async function api(corpo) {
  try {
    const r = await fetch(URL, { method: 'POST', headers: { 'content-type': 'application/json', 'x-scalasys-token': token() }, body: JSON.stringify(corpo), signal: AbortSignal.timeout(HOOK ? 8000 : 30000) })
    const d = await r.json().catch(() => ({ error: 'resposta ilegível (HTTP ' + r.status + ')' }))
    if (!r.ok || !d.ok) sair('Erro: ' + (d.error || r.status))
    return d
  } catch (e) { sair('Erro de conexão: ' + e.message) }
}

// Resumo para o começo da conversa: o que fazer agora, o que mudou e o que falta decidir
if (acao === 'resumo') {
  const cli = flags.cliente || clienteDaPasta()
  if (!cli) sair('Qual cliente? Use --cliente <id ou nome>.')
  const [l, p] = await Promise.all([api({ acao: 'listar', cliente: cli }), api({ acao: 'pendentes', cliente: cli })])
  const corte = new Date(Date.now() - 7 * 86400000).toISOString()
  const d = (iso) => iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''
  const curto = (s, n = 110) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s }
  const abertos = l.itens.filter(i => i.estado === 'aberto' && (i.tipo === 'dev' || i.tipo === 'validacao'))
  const novos = l.itens.filter(i => i.estado === 'aberto' && i.tipo !== 'comercial' && i.criado_em >= corte && i.origem_tipo !== 'importado')
  const feitos = l.itens.filter(i => i.estado === 'feito' && (i.concluido_em || '') >= corte)
  const L = [`# Backlog ao vivo · ${l.cliente.empresa || l.cliente.nome} (sistema interno, ${new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })})`,
    `${abertos.length} itens abertos de desenvolvimento/validação · ${l.itens.filter(i => i.tipo === 'diretriz' && i.estado === 'aberto').length} diretrizes de produto. A fonte é o sistema interno, não o BACKLOG.md. Use a skill /backlog para ver tudo, concluir ou criar itens.`]
  if (novos.length) { L.push('', '## Novos nos últimos 7 dias'); for (const i of novos) L.push(`- ${curto(i.titulo)}${i.tipo === 'validacao' ? ' (validação)' : ''} · ${i.origem || i.origem_tipo} · {id: ${i.id}}`) }
  if (feitos.length) { L.push('', '## Concluídos nos últimos 7 dias'); for (const i of feitos) L.push(`- ${curto(i.titulo)} (${d(i.concluido_em)})`) }
  L.push('', '## Próximos (ordem do painel)')
  let grupo = null
  for (const i of abertos.slice(0, 12)) {
    if (i.grupo !== grupo) { grupo = i.grupo; L.push(`### ${grupo || 'Sem grupo'}`) }
    L.push(`- ${curto(i.titulo)}${i.tipo === 'validacao' ? ' (validação)' : ''}${i.responsavel ? ` — ${i.responsavel}` : ''} · {id: ${i.id}}`)
  }
  if (abertos.length > 12) L.push(`- … mais ${abertos.length - 12} (\`/backlog\` lista todos)`)
  if (p.pendentes.length) L.push('', `## ${p.pendentes.length} ação(ões) de reunião sem decisão`, 'Proponha o destino de cada uma com /backlog pendentes e grave só depois da confirmação.')
  console.log(L.join('\n'))
  process.exit(0)
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
