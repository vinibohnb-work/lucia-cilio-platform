import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'
import { triar } from '../src/lib/triagem.js'

// ============================================================================
// Envio do formulário público de diagnóstico (/diagnostico).
//
// Antes o browser gravava direto na base com a chave pública: bastava essa
// chave para inundar a lista de diagnósticos. A partir da migração 042 a base
// deixa de aceitar escrita anónima — só esta função, no servidor, grava. Aqui:
//   · a armadilha (campo escondido) e o tempo de preenchimento apanham os
//     robôs simples — fingem sucesso, para não ensinarem nada a quem os corre;
//   · o Cloudflare Turnstile, se as chaves estiverem configuradas no Vercel
//     (TURNSTILE_SECRET_KEY + VITE_TURNSTILE_SITE_KEY), trava os insistentes
//     sem puzzles para quem é humano;
//   · limite por IP (5 por hora) e um teto geral (60 por hora);
//   · a triagem é refeita aqui — não se confia no veredito que vem do browser.
// O IP nunca é guardado: só uma impressão (hash) dele, para contar envios.
// ============================================================================

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY

export const LIMITES = { porIpHora: 5, totalHora: 60, tempoMinimoMs: 3000, respostasBytes: 20000 }

const corta = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '')

export function impressaoIp(ip, segredo = SERVICE_KEY || '') {
  return createHash('sha256').update(`${ip}|${segredo.slice(-16)}`).digest('hex').slice(0, 32)
}

async function verificarTurnstile(token, ip, fetchFn = fetch) {
  if (!TURNSTILE_SECRET) return true            // sem chaves configuradas: não se aplica
  if (!token) return false
  const corpo = new URLSearchParams({ secret: TURNSTILE_SECRET, response: token, remoteip: ip || '' })
  const r = await fetchFn('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: corpo })
  const j = await r.json().catch(() => ({}))
  return !!j.success
}

// O trabalho todo, sem depender do pedido HTTP — para se poder testar.
// Devolve { status, body }. `db` é um cliente Supabase com a service_role.
export async function processar(dados, ip, db, { agora = Date.now(), turnstile = verificarTurnstile } = {}) {
  const d = dados && typeof dados === 'object' ? dados : {}

  // Robôs simples: fingir que correu bem e não gravar nada.
  if (d.armadilha) return { status: 200, body: { ok: true } }
  const aberto = Number(d.aberto_em)
  if (!aberto || agora - aberto < LIMITES.tempoMinimoMs) return { status: 200, body: { ok: true } }

  const nome = corta(d.nome, 120)
  const email = corta(d.email, 200)
  const telefone = corta(d.telefone, 40)
  const empresa = corta(d.empresa, 160)
  const respostas = d.respostas && typeof d.respostas === 'object' && !Array.isArray(d.respostas) ? d.respostas : {}
  if (!nome || (!email && !telefone)) return { status: 400, body: { error: 'dados' } }
  if (JSON.stringify(respostas).length > LIMITES.respostasBytes) return { status: 400, body: { error: 'dados' } }

  if (!(await turnstile(d.turnstile, ip))) return { status: 400, body: { error: 'verificacao' } }

  const desde = new Date(agora - 3600_000).toISOString()
  const ipHash = impressaoIp(ip || 'desconhecido')
  const [{ count: doIp, error: e1 }, { count: total, error: e2 }] = await Promise.all([
    db.from('diagnostico_submissoes').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('created_at', desde),
    db.from('diagnostico_submissoes').select('id', { count: 'exact', head: true }).gte('created_at', desde),
  ])
  if (e1 || e2) return { status: 500, body: { error: 'servidor' } }
  if ((doIp || 0) >= LIMITES.porIpHora || (total || 0) >= LIMITES.totalHora) return { status: 429, body: { error: 'limite' } }

  const veredito = triar(respostas)
  const { error } = await db.from('diagnostico_submissoes').insert({
    nome, email: email || null, telefone: telefone || null, empresa: empresa || null,
    respostas, qualificado: veredito.qualificado, motivo: veredito.motivo, ip_hash: ipHash,
  })
  if (error) return { status: 500, body: { error: 'servidor' } }
  return { status: 200, body: { ok: true } }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não suportado.' })
  if (!URL || !SERVICE_KEY) return res.status(500).json({ error: 'servidor' })
  const db = createClient(URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || ''
  try {
    const { status, body } = await processar(req.body, ip, db)
    return res.status(status).json(body)
  } catch {
    return res.status(500).json({ error: 'servidor' })
  }
}
