import { createClient } from '@supabase/supabase-js'
import { Buffer } from 'node:buffer'

// ============================================================================
// Área de participantes dos eventos (/momentos/participantes, migração 048).
//
// Os participantes não têm conta: entram pelo link pessoal (token) que a Lúcia
// lhes envia a partir da lista de inscritos do Luma. Esta função é a única
// porta deles para a base — confere o token, devolve só o que podem ver e grava
// só o perfil do próprio. A base não tem políticas para anónimos.
//
//   GET  /api/evento?t=<token>                 → o meu perfil + quem partilhou
//   POST /api/evento { t, acao: 'perfil', perfil }      → guardar o meu perfil
//   POST /api/evento { t, acao: 'foto', imagem }         → data URL (≤ 2 MB)
//   POST /api/evento { t, acao: 'apagar' }               → apagar o meu perfil
//
// O e-mail e o token de cada pessoa nunca saem daqui para os outros.
// ============================================================================

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'eventos'
const VALIDADE_FOTO = 3600

export const LIMITES = { nome: 80, negocio: 80, localidade: 60, sobre: 400, instagram: 60, linkedin: 200, site: 200, fotoBytes: 2 * 1024 * 1024 }
const TIPOS_FOTO = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

const corta = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '')
const tokenValido = (t) => typeof t === 'string' && /^[A-Za-z0-9_-]{24,64}$/.test(t)

// "@ana.martins", "instagram.com/ana.martins/" → "ana.martins"
export function limparInstagram(v) {
  const s = corta(v, 200).replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').split(/[/?#]/)[0]
  return /^[A-Za-z0-9._]{1,30}$/.test(s) ? s : ''
}
// Só ligações http(s); sem esquema, assume https
export function limparLigacao(v, max) {
  let s = corta(v, max)
  if (!s) return ''
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s
  try { const u = new globalThis.URL(s); return /^https?:$/.test(u.protocol) && u.hostname.includes('.') ? u.toString() : '' } catch { return '' }
}

// O que um participante pode gravar no seu perfil — o resto é ignorado
export function perfilLimpo(p = {}) {
  return {
    nome: corta(p.nome, LIMITES.nome),
    negocio: corta(p.negocio, LIMITES.negocio) || null,
    localidade: corta(p.localidade, LIMITES.localidade) || null,
    sobre: corta(p.sobre, LIMITES.sobre) || null,
    instagram: limparInstagram(p.instagram) || null,
    linkedin: limparLigacao(p.linkedin, LIMITES.linkedin) || null,
    site: limparLigacao(p.site, LIMITES.site) || null,
    partilhar: p.partilhar === true,
  }
}

// O que os outros veem de cada pessoa
const publico = (l, foto) => ({ id: l.id, nome: l.nome, negocio: l.negocio, localidade: l.localidade, sobre: l.sobre, instagram: l.instagram, linkedin: l.linkedin, site: l.site, foto })

async function fotosAssinadas(db, linhas) {
  const caminhos = linhas.map(l => l.foto_path).filter(Boolean)
  if (!caminhos.length) return {}
  const { data } = await db.storage.from(BUCKET).createSignedUrls(caminhos, VALIDADE_FOTO)
  return Object.fromEntries((data || []).filter(x => x.signedUrl).map(x => [x.path, x.signedUrl]))
}

export async function tratar(db, { metodo, query = {}, body = {} }, hoje = new Date().toISOString().slice(0, 10)) {
  const t = metodo === 'GET' ? query.t : body.t
  if (!tokenValido(t)) return [401, { error: 'Link inválido.' }]

  const { data: eu } = await db.from('evento_participantes').select('*').eq('token', t).maybeSingle()
  if (!eu) return [401, { error: 'Este link não é válido. Peça um novo à organização.' }]
  const { data: evento } = await db.from('eventos').select('id, nome, data, aberto_ate').eq('id', eu.evento_id).maybeSingle()
  if (!evento) return [404, { error: 'Evento não encontrado.' }]
  if (evento.aberto_ate && hoje > evento.aberto_ate) return [410, { error: 'A área de participantes deste evento já fechou.' }]

  if (metodo === 'GET') {
    await db.from('evento_participantes').update({ ultimo_acesso: new Date().toISOString() }).eq('id', eu.id)
    const { data: outros } = await db.from('evento_participantes')
      .select('id, nome, negocio, localidade, sobre, instagram, linkedin, site, foto_path')
      .eq('evento_id', eu.evento_id).eq('partilhar', true).neq('id', eu.id).order('nome', { ascending: true })
    const fotos = await fotosAssinadas(db, [eu, ...(outros || [])])
    return [200, {
      evento: { nome: evento.nome, data: evento.data },
      eu: { ...publico(eu, fotos[eu.foto_path] || null), partilhar: eu.partilhar },
      participantes: (outros || []).map(l => publico(l, fotos[l.foto_path] || null)),
    }]
  }

  if (metodo !== 'POST') return [405, { error: 'Método não suportado.' }]

  if (body.acao === 'perfil') {
    const p = perfilLimpo(body.perfil)
    if (!p.nome) return [400, { error: 'Escreva o seu nome.' }]
    const { error } = await db.from('evento_participantes').update({ ...p, updated_at: new Date().toISOString() }).eq('id', eu.id)
    if (error) return [500, { error: 'Não foi possível guardar.' }]
    return [200, { ok: true }]
  }

  if (body.acao === 'foto') {
    const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(body.imagem || ''))
    if (!m) return [400, { error: 'Use uma imagem JPEG, PNG ou WebP.' }]
    const bytes = Buffer.from(m[2], 'base64')
    if (bytes.length > LIMITES.fotoBytes) return [413, { error: 'A imagem tem mais de 2 MB.' }]
    const caminho = `${eu.evento_id}/${eu.id}.${TIPOS_FOTO[m[1]]}`
    const { error } = await db.storage.from(BUCKET).upload(caminho, bytes, { contentType: m[1], upsert: true })
    if (error) return [500, { error: 'Não foi possível guardar a foto.' }]
    if (eu.foto_path && eu.foto_path !== caminho) await db.storage.from(BUCKET).remove([eu.foto_path])
    await db.from('evento_participantes').update({ foto_path: caminho, updated_at: new Date().toISOString() }).eq('id', eu.id)
    const fotos = await fotosAssinadas(db, [{ foto_path: caminho }])
    return [200, { ok: true, foto: fotos[caminho] || null }]
  }

  // Apagar o meu perfil: fica só o nome e o e-mail da inscrição (vêm do Luma), sem foto
  if (body.acao === 'apagar') {
    if (eu.foto_path) await db.storage.from(BUCKET).remove([eu.foto_path])
    await db.from('evento_participantes').update({ negocio: null, localidade: null, sobre: null, instagram: null, linkedin: null, site: null, foto_path: null, partilhar: false, updated_at: new Date().toISOString() }).eq('id', eu.id)
    return [200, { ok: true }]
  }

  return [400, { error: 'Pedido desconhecido.' }]
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (!URL || !SERVICE_KEY) return res.status(500).json({ error: 'Servidor sem configuração.' })
  const db = createClient(URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  try {
    const [estado, corpo] = await tratar(db, { metodo: req.method, query: req.query || {}, body: req.body || {} })
    return res.status(estado).json(corpo)
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erro inesperado.' })
  }
}
