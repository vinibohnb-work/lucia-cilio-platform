import { createClient } from '@supabase/supabase-js'
import { Buffer } from 'node:buffer'
import { randomBytes } from 'node:crypto'

// ============================================================================
// Área de participantes dos eventos (/momentos/participantes, migração 048).
//
// Os participantes não têm conta. Na chamada de 20/10 a Lúcia pediu que fosse
// assim, em vez de crachás: no dia, quem está na sala lê um QR code (com o
// código do evento), escreve o nome e recebe um token pessoal, que fica no
// telemóvel. Esta função é a única porta deles para a base — confere o código e
// o token, devolve só o que podem ver e grava só o perfil do próprio. A base
// não tem políticas para anónimos. Fora da janela do evento (aberto_de →
// aberto_ate, datas de Lisboa) nada abre.
//
//   GET  /api/evento?c=<codigo do QR>           → nome, data, local e landing do evento
//   GET  /api/evento?entrada=<id do evento>     → o código do QR, só enquanto a área está aberta
//        (botão "Área de participantes" da landing, que funciona como o QR no dia do evento)
//   POST /api/evento { codigo, acao: 'entrar', nome }   → cria-me e devolve { t }
//   GET  /api/evento?t=<token>                 → o meu perfil + quem partilhou (+ link das fotografias, migração 052)
//   POST /api/evento { t, acao: 'perfil', perfil }      → guardar o meu perfil
//   POST /api/evento { t, acao: 'foto', imagem }         → data URL (≤ 2 MB)
//   POST /api/evento { t, acao: 'apagar' }               → apagar o meu perfil
//   POST /api/evento { t, acao: 'avaliar', palestra, nota, comentario }
//        → nota 0–10 (NPS) de uma apresentação de negócio; sem ela = o evento (migração 051)
//
// Formulário de feedback (migração 062), sem token: anónimo, para quem tem o link
// (lcoffice.pt/feedback/#e=<id>) ou vem da landing. Só enquanto feedback_aberto.
//   GET  /api/evento?feedback=<id do evento>  → nome, data e landing (ou 404/410)
//   POST /api/evento { acao: 'feedback', evento, respostas, comentario, aberto, site_web }
//        → respostas = { gostou: true|false, … }; aberto (quando a página abriu) e
//          site_web (campo escondido) apanham robôs sem os avisar
//
// O e-mail e o token de cada pessoa nunca saem daqui para os outros.
// ============================================================================

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'eventos'
const VALIDADE_FOTO = 3600

export const LIMITES = { nome: 80, negocio: 80, cargo: 80, localidade: 60, sobre: 400, comentario: 500, instagram: 60, linkedin: 200, site: 200, fotoBytes: 2 * 1024 * 1024 }
const TIPOS_FOTO = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

const MAX_PARTICIPANTES = 600
// Feedback (migração 062): as perguntas Sim/Não do formulário, iguais em todos os eventos.
// Os textos estão em public/feedback/index.html e em src/data/feedbackEvento.js.
export const PERGUNTAS_FEEDBACK = ['gostou', 'temas', 'palestras', 'networking', 'voltaria', 'recomendaria']
export const LIMITES_FEEDBACK = { comentario: 1000, porHora: 200, total: 3000, tempoMinimoMs: 3000 }
const idEventoValido = (v) => typeof v === 'string' && /^[a-z0-9-]{2,80}$/.test(v)
const corta = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '')
const tokenValido = (t) => typeof t === 'string' && /^[A-Za-z0-9_-]{24,64}$/.test(t)
const uuidValido = (v) => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v)
const codigoValido = (c) => typeof c === 'string' && /^[A-Za-z0-9_-]{8,40}$/.test(c)
export const hojeLisboa = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Lisbon' }).format(new Date())
const novoToken = () => randomBytes(24).toString('base64url')

const CAMPOS_EVENTO = 'id, nome, data, local, landing_url, aberto_de, aberto_ate'
// O que a página mostra do evento (repositório de eventos, migração 050)
const infoEvento = (e) => ({ id: e.id, nome: e.nome, data: e.data, local: e.local || null, landing: e.landing_url || null })

// A área só abre dentro da janela do evento
function janela(evento, hoje) {
  if (evento.aberto_de && hoje < evento.aberto_de) return [403, { error: 'A área de participantes abre no dia do evento.', abre: evento.aberto_de, evento: infoEvento(evento) }]
  if (evento.aberto_ate && hoje > evento.aberto_ate) return [410, { error: 'A área de participantes deste evento já fechou.', evento: infoEvento(evento) }]
  return null
}

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
    negocio: corta(p.negocio, LIMITES.negocio) || null, // o nome da empresa (21/10)
    cargo: corta(p.cargo, LIMITES.cargo) || null,
    localidade: corta(p.localidade, LIMITES.localidade) || null,
    sobre: corta(p.sobre, LIMITES.sobre) || null,
    instagram: limparInstagram(p.instagram) || null,
    linkedin: limparLigacao(p.linkedin, LIMITES.linkedin) || null,
    site: limparLigacao(p.site, LIMITES.site) || null,
    partilhar: p.partilhar === true,
  }
}

// O que os outros veem de cada pessoa
const publico = (l, foto) => ({ id: l.id, nome: l.nome, negocio: l.negocio, cargo: l.cargo, localidade: l.localidade, sobre: l.sobre, instagram: l.instagram, linkedin: l.linkedin, site: l.site, foto })

async function fotosAssinadas(db, linhas) {
  const caminhos = linhas.map(l => l.foto_path).filter(Boolean)
  if (!caminhos.length) return {}
  const { data } = await db.storage.from(BUCKET).createSignedUrls(caminhos, VALIDADE_FOTO)
  return Object.fromEntries((data || []).filter(x => x.signedUrl).map(x => [x.path, x.signedUrl]))
}

export async function tratar(db, { metodo, query = {}, body = {} }, hoje = hojeLisboa()) {
  // Botão da landing: dá o código do QR só dentro da janela do evento
  if (metodo === 'GET' && query.entrada !== undefined) {
    if (typeof query.entrada !== 'string' || !/^[a-z0-9-]{2,80}$/.test(query.entrada)) return [404, { error: 'Evento não encontrado.' }]
    const { data: evento } = await db.from('eventos').select('id, nome, data, local, landing_url, codigo, aberto_de, aberto_ate').eq('id', query.entrada).maybeSingle()
    if (!evento || !evento.codigo) return [404, { error: 'Este evento não tem área de participantes.' }]
    return janela(evento, hoje) || [200, { c: evento.codigo }]
  }

  // Formulário de feedback (062): a página pergunta se está aberto e de que evento é
  if (metodo === 'GET' && query.feedback !== undefined) {
    if (!idEventoValido(query.feedback)) return [404, { error: 'Este formulário não existe.' }]
    const { data: evento } = await db.from('eventos').select('id, nome, data, local, landing_url, feedback_aberto').eq('id', query.feedback).maybeSingle()
    if (!evento) return [404, { error: 'Este formulário não existe.' }]
    if (!evento.feedback_aberto) return [410, { error: 'O formulário de feedback deste evento está fechado.', evento: infoEvento(evento) }]
    return [200, { evento: infoEvento(evento) }]
  }

  if (metodo === 'POST' && body.acao === 'feedback') {
    if (!idEventoValido(body.evento)) return [404, { error: 'Este formulário não existe.' }]
    // Robôs: o campo escondido preenchido ou o envio rápido demais recebem "ok" e nada se grava
    const aberto = Number(body.aberto)
    if (corta(body.site_web, 200) || !aberto || Date.now() - aberto < LIMITES_FEEDBACK.tempoMinimoMs) return [200, { ok: true }]
    const { data: evento } = await db.from('eventos').select('id, feedback_aberto').eq('id', body.evento).maybeSingle()
    if (!evento) return [404, { error: 'Este formulário não existe.' }]
    if (!evento.feedback_aberto) return [410, { error: 'O formulário de feedback deste evento está fechado.' }]
    const respostas = {}
    const r = body.respostas && typeof body.respostas === 'object' ? body.respostas : {}
    for (const k of PERGUNTAS_FEEDBACK) if (typeof r[k] === 'boolean') respostas[k] = r[k]
    const comentario = corta(body.comentario, LIMITES_FEEDBACK.comentario) || null
    if (!Object.keys(respostas).length && !comentario) return [400, { error: 'Responda a pelo menos uma pergunta.' }]
    const desde = new Date(Date.now() - 3600 * 1000).toISOString()
    const [{ count: naHora }, { count: total }] = await Promise.all([
      db.from('evento_feedback').select('id', { count: 'exact', head: true }).eq('evento_id', evento.id).gte('created_at', desde),
      db.from('evento_feedback').select('id', { count: 'exact', head: true }).eq('evento_id', evento.id),
    ])
    if ((naHora || 0) >= LIMITES_FEEDBACK.porHora || (total || 0) >= LIMITES_FEEDBACK.total) return [429, { error: 'Recebemos muitas respostas agora. Tente de novo mais tarde.' }]
    const { error } = await db.from('evento_feedback').insert({ evento_id: evento.id, respostas, comentario })
    if (error) return [500, { error: 'Não foi possível enviar. Tente de novo.' }]
    return [200, { ok: true }]
  }

  // Antes de entrar: o QR só diz o código; a página mostra o nome do evento e se já abriu
  if (metodo === 'GET' && query.c !== undefined && query.t === undefined) {
    if (!codigoValido(query.c)) return [404, { error: 'Este QR code não é válido.' }]
    const { data: evento } = await db.from('eventos').select(CAMPOS_EVENTO).eq('codigo', query.c).maybeSingle()
    if (!evento) return [404, { error: 'Este QR code não é válido. Peça o atual à organização.' }]
    return janela(evento, hoje) || [200, { evento: infoEvento(evento) }]
  }

  // Entrar pelo QR code: o código do evento + o nome → um token pessoal
  if (metodo === 'POST' && body.acao === 'entrar') {
    if (!codigoValido(body.codigo)) return [404, { error: 'Este QR code não é válido.' }]
    const { data: evento } = await db.from('eventos').select(CAMPOS_EVENTO).eq('codigo', body.codigo).maybeSingle()
    if (!evento) return [404, { error: 'Este QR code não é válido. Peça o atual à organização.' }]
    const fechado = janela(evento, hoje)
    if (fechado) return fechado
    const nome = corta(body.nome, LIMITES.nome)
    if (!nome) return [400, { error: 'Escreva o seu nome.' }]
    const { count } = await db.from('evento_participantes').select('id', { count: 'exact', head: true }).eq('evento_id', evento.id)
    if ((count || 0) >= MAX_PARTICIPANTES) return [429, { error: 'A área está cheia. Fale com a organização.' }]
    const t = novoToken()
    const { error } = await db.from('evento_participantes').insert({ evento_id: evento.id, nome, token: t })
    if (error) return [500, { error: 'Não foi possível entrar. Tente de novo.' }]
    return [200, { t }]
  }

  const t = metodo === 'GET' ? query.t : body.t
  if (!tokenValido(t)) return [401, { error: 'Acesso inválido. Leia o QR code do evento.' }]

  const { data: eu } = await db.from('evento_participantes').select('*').eq('token', t).maybeSingle()
  if (!eu) return [401, { error: 'Este acesso já não é válido. Volte a ler o QR code do evento.' }]
  // Com o link das fotografias (052); se a coluna ainda não existir, a área abre na mesma, sem fotos
  let { data: evento, error: semFotos } = await db.from('eventos').select(CAMPOS_EVENTO + ', fotos_url').eq('id', eu.evento_id).maybeSingle()
  if (semFotos) ({ data: evento } = await db.from('eventos').select(CAMPOS_EVENTO).eq('id', eu.evento_id).maybeSingle())
  if (!evento) return [404, { error: 'Evento não encontrado.' }]
  // Decisão de 04/11: depois do fecho, quem entrou no dia continua a entrar com o seu acesso
  // (vê as fotografias e os perfis partilhados). Gente nova não entra: o QR, o botão da
  // landing e o 'entrar' continuam a respeitar a janela inteira. Aqui só vale o "ainda não abriu".
  // Segurança (revisão de 06/11): "quem entrou no dia" é verificado aqui, pela data em que o
  // acesso foi criado, para não depender só de o aberto_ate estar bem configurado na Gestão.
  if (evento.aberto_ate && eu.created_at) {
    const entrouEm = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Lisbon' }).format(new Date(eu.created_at))
    if (entrouEm > evento.aberto_ate) return [410, { error: 'A área de participantes deste evento já fechou.', evento: infoEvento(evento) }]
  }
  evento = { ...evento, aberto_ate: null }
  const fechado = janela(evento, hoje)
  if (fechado) return fechado

  if (metodo === 'GET') {
    await db.from('evento_participantes').update({ ultimo_acesso: new Date().toISOString() }).eq('id', eu.id)
    const { data: outros } = await db.from('evento_participantes')
      .select('id, nome, negocio, cargo, localidade, sobre, instagram, linkedin, site, foto_path')
      .eq('evento_id', eu.evento_id).eq('partilhar', true).neq('id', eu.id).order('nome', { ascending: true })
    const fotos = await fotosAssinadas(db, [eu, ...(outros || [])])
    // Avaliação das apresentações de negócio (migração 051): a lista e as minhas notas
    const { data: palestras } = await db.from('evento_palestras').select('id, ordem, hora, titulo, orador')
      .eq('evento_id', eu.evento_id).order('ordem', { ascending: true })
    const { data: minhas } = await db.from('evento_avaliacoes').select('palestra_id, nota, comentario').eq('participante_id', eu.id)
    return [200, {
      evento: infoEvento(evento),
      // Fotografias do evento: só para quem entrou com o seu acesso (migração 052)
      fotos: limparLigacao(evento.fotos_url || '', 500) || null,
      eu: { ...publico(eu, fotos[eu.foto_path] || null), partilhar: eu.partilhar },
      participantes: (outros || []).map(l => publico(l, fotos[l.foto_path] || null)),
      palestras: (palestras || []).map(p => ({ id: p.id, hora: p.hora, titulo: p.titulo, orador: p.orador })),
      avaliacoes: (minhas || []).map(a => ({ palestra: a.palestra_id || null, nota: a.nota, comentario: a.comentario || '' })),
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
    await db.from('evento_participantes').update({ negocio: null, cargo: null, localidade: null, sobre: null, instagram: null, linkedin: null, site: null, foto_path: null, partilhar: false, updated_at: new Date().toISOString() }).eq('id', eu.id)
    return [200, { ok: true }]
  }

  // Avaliar uma apresentação de negócio (ou o evento, sem ela): uma nota por pessoa, que pode mudar
  if (body.acao === 'avaliar') {
    const nota = body.nota
    if (!Number.isInteger(nota) || nota < 0 || nota > 10) return [400, { error: 'Escolha uma nota de 0 a 10.' }]
    const palestra = body.palestra ?? null
    if (palestra !== null) {
      if (!uuidValido(palestra)) return [404, { error: 'Apresentação não encontrada.' }]
      const { data: p } = await db.from('evento_palestras').select('id').eq('id', palestra).eq('evento_id', eu.evento_id).maybeSingle()
      if (!p) return [404, { error: 'Apresentação não encontrada.' }]
    }
    const comentario = corta(body.comentario, LIMITES.comentario) || null
    let q = db.from('evento_avaliacoes').select('id').eq('participante_id', eu.id)
    q = palestra ? q.eq('palestra_id', palestra) : q.is('palestra_id', null)
    const { data: ja } = await q.maybeSingle()
    const { error } = ja
      ? await db.from('evento_avaliacoes').update({ nota, comentario, updated_at: new Date().toISOString() }).eq('id', ja.id)
      : await db.from('evento_avaliacoes').insert({ evento_id: eu.evento_id, palestra_id: palestra, participante_id: eu.id, nota, comentario })
    if (error) return [500, { error: 'Não foi possível guardar a avaliação.' }]
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
    console.error('api/evento', e)
    return res.status(500).json({ error: 'Erro inesperado. Tente de novo.' })
  }
}
