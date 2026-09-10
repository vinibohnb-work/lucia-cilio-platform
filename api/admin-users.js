import { createClient } from '@supabase/supabase-js'

// Função serverless (Vercel) para gestão de utilizadores.
// Usa a SERVICE ROLE KEY (apenas no servidor) e só responde a administradores.
const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET_DOCS = 'client-docs'

// O Storage não apaga pastas: só apaga ficheiros, um a um, e o list() não é
// recursivo. Isto percorre a árvore toda a partir de um prefixo.
// (Uma pasta vem na listagem com id a null; um ficheiro traz id.)
async function listarFicheiros(admin, prefixo) {
  const { data, error } = await admin.storage.from(BUCKET_DOCS)
    .list(prefixo, { limit: 1000, sortBy: { column: 'name', order: 'asc' } })
  if (error) throw error
  const caminhos = []
  for (const item of data || []) {
    const caminho = `${prefixo}/${item.name}`
    if (item.id === null) caminhos.push(...await listarFicheiros(admin, caminho))
    else caminhos.push(caminho)
  }
  return caminhos
}

// Eliminação de cliente tem de levar os documentos atrás (RGPD, art. 17).
// Apagar o utilizador limpava as tabelas em cascata mas deixava a pasta dele no
// bucket — órfã e sem forma de lá chegar pela interface.
async function apagarDocumentos(admin, userId) {
  const ficheiros = await listarFicheiros(admin, userId)
  for (let i = 0; i < ficheiros.length; i += 100) {
    const { error } = await admin.storage.from(BUCKET_DOCS).remove(ficheiros.slice(i, i + 100))
    if (error) throw error
  }
  return ficheiros.length
}

export default async function handler(req, res) {
  if (!URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Servidor sem SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY configurados.' })
  }

  const admin = createClient(URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Plataformas válidas ('both' = acesso a Contabilidade + ESG)
  const sanePlatform = (p) => (['accounting', 'accounting_lite', 'esg', 'both'].includes(p) ? p : 'accounting')
  // Papéis válidos ('comercial' = só CRM · 'marketing' = só Marketing)
  const saneRole = (r) => (['user', 'admin', 'comercial', 'marketing'].includes(r) ? r : 'user')

  // ── 1. Autenticar quem chama ──
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
  if (!token) return res.status(401).json({ error: 'Sessão em falta.' })

  const { data: caller, error: callerErr } = await admin.auth.getUser(token)
  if (callerErr || !caller?.user) return res.status(401).json({ error: 'Sessão inválida.' })

  // ── 2. Confirmar que é admin ──
  const callerId = caller.user.id
  const { data: prof } = await admin.from('profiles').select('role').eq('id', callerId).single()
  if (prof?.role !== 'admin') return res.status(403).json({ error: 'Sem permissão.' })

  try {
    // ── LISTAR ──
    if (req.method === 'GET') {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      if (error) throw error
      const ids = data.users.map(u => u.id)
      const { data: profs } = await admin.from('profiles').select('id, role, platform').in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
      const profById = Object.fromEntries((profs || []).map(p => [p.id, p]))
      const users = data.users.map(u => ({
        id: u.id,
        email: u.email,
        display_name: u.user_metadata?.display_name || u.user_metadata?.full_name || u.user_metadata?.name || '',
        role: profById[u.id]?.role || 'user',
        platform: profById[u.id]?.platform || 'accounting',
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at,
      })).sort((a, b) => (a.email || '').localeCompare(b.email || ''))
      return res.status(200).json({ users })
    }

    // ── REDEFINIR PALAVRA-PASSE TEMPORÁRIA ──
    // Substitui o antigo "reenviar convite": em vez de um novo link com prazo,
    // define uma nova palavra-passe temporária e volta a exigir a mudança no
    // acesso seguinte. Serve para quem nunca entrou e para quem se esqueceu.
    if (req.method === 'POST' && req.body?.resetPassword) {
      const { id, password } = req.body
      if (!id) return res.status(400).json({ error: 'ID em falta.' })
      if (!password || String(password).length < 8) {
        return res.status(400).json({ error: 'Palavra-passe temporária inválida (mínimo 8 caracteres).' })
      }
      const { error } = await admin.auth.admin.updateUserById(id, { password, email_confirm: true })
      if (error) throw error
      await admin.from('profiles').update({ must_change_password: true }).eq('id', id)
      return res.status(200).json({ ok: true, reset: true })
    }

    // ── CRIAR (palavra-passe temporária definida pelo administrador) ──
    // Sem email de convite: a conta nasce ativa e a palavra-passe é entregue
    // pela Lúcia. Fica marcada para exigir a mudança no primeiro acesso.
    if (req.method === 'POST') {
      const { email, display_name, role, platform, password } = req.body || {}
      if (!email) return res.status(400).json({ error: 'Email é obrigatório.' })
      if (!password || String(password).length < 8) {
        return res.status(400).json({ error: 'Palavra-passe temporária inválida (mínimo 8 caracteres).' })
      }
      const { data, error } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
        user_metadata: { display_name: display_name || '' },
      })
      if (error) throw error
      await admin.from('profiles').upsert({
        id: data.user.id,
        role: saneRole(role),
        platform: sanePlatform(platform),
        must_change_password: true,
      })
      return res.status(200).json({ ok: true, id: data.user.id, created: true })
    }

    // ── EDITAR ──
    if (req.method === 'PATCH') {
      const { id, email, password, display_name, role, platform } = req.body || {}
      if (!id) return res.status(400).json({ error: 'ID em falta.' })
      if (id === callerId && role && role !== 'admin') {
        return res.status(400).json({ error: 'Não pode remover o seu próprio acesso de administrador.' })
      }
      const attrs = {}
      if (email) attrs.email = email
      if (password) attrs.password = password
      if (display_name !== undefined) attrs.user_metadata = { display_name }
      if (Object.keys(attrs).length) {
        const { error } = await admin.auth.admin.updateUserById(id, attrs)
        if (error) throw error
      }
      const profPatch = {}
      if (role) profPatch.role = saneRole(role)
      if (platform) profPatch.platform = sanePlatform(platform)
      if (Object.keys(profPatch).length) await admin.from('profiles').upsert({ id, ...profPatch })
      return res.status(200).json({ ok: true })
    }

    // ── ELIMINAR ──
    if (req.method === 'DELETE') {
      const id = req.query?.id || req.body?.id
      if (!id) return res.status(400).json({ error: 'ID em falta.' })
      if (id === callerId) return res.status(400).json({ error: 'Não pode eliminar a sua própria conta.' })

      // Os documentos primeiro, a conta depois. Por esta ordem porque, se o
      // Storage falhar, a conta ainda existe e a operação pode ser repetida —
      // ao contrário: ficariam ficheiros sem dono, invisíveis na interface.
      let docsApagados = 0
      try {
        docsApagados = await apagarDocumentos(admin, id)
      } catch (e) {
        return res.status(500).json({ error: `Não foi possível apagar os documentos do cliente (${e.message}). A conta NÃO foi eliminada — tente novamente.` })
      }

      const { error } = await admin.auth.admin.deleteUser(id)
      if (error) throw error
      return res.status(200).json({ ok: true, documentos_apagados: docsApagados })
    }

    return res.status(405).json({ error: 'Método não suportado.' })
  } catch (e) {
    return res.status(400).json({ error: e.message || 'Erro inesperado.' })
  }
}
