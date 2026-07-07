import { createClient } from '@supabase/supabase-js'

// Função serverless (Vercel) para gestão de utilizadores.
// Usa a SERVICE ROLE KEY (apenas no servidor) e só responde a administradores.
const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req, res) {
  if (!URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Servidor sem SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY configurados.' })
  }

  const admin = createClient(URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

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
      const { data: profs } = await admin.from('profiles').select('id, role').in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
      const roleById = Object.fromEntries((profs || []).map(p => [p.id, p.role]))
      const users = data.users.map(u => ({
        id: u.id,
        email: u.email,
        display_name: u.user_metadata?.display_name || u.user_metadata?.full_name || u.user_metadata?.name || '',
        role: roleById[u.id] || 'user',
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
      })).sort((a, b) => (a.email || '').localeCompare(b.email || ''))
      return res.status(200).json({ users })
    }

    // ── CRIAR (convite por email) ──
    if (req.method === 'POST') {
      const { email, display_name, role, redirectTo } = req.body || {}
      if (!email) return res.status(400).json({ error: 'Email é obrigatório.' })
      // Envia email de convite; o utilizador define a password na página redirectTo.
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { display_name: display_name || '' },
        redirectTo: redirectTo || undefined,
      })
      if (error) throw error
      await admin.from('profiles').upsert({ id: data.user.id, role: role === 'admin' ? 'admin' : 'user' })
      return res.status(200).json({ ok: true, id: data.user.id, invited: true })
    }

    // ── EDITAR ──
    if (req.method === 'PATCH') {
      const { id, email, password, display_name, role } = req.body || {}
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
      if (role) await admin.from('profiles').upsert({ id, role })
      return res.status(200).json({ ok: true })
    }

    // ── ELIMINAR ──
    if (req.method === 'DELETE') {
      const id = req.query?.id || req.body?.id
      if (!id) return res.status(400).json({ error: 'ID em falta.' })
      if (id === callerId) return res.status(400).json({ error: 'Não pode eliminar a sua própria conta.' })
      const { error } = await admin.auth.admin.deleteUser(id)
      if (error) throw error
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Método não suportado.' })
  } catch (e) {
    return res.status(400).json({ error: e.message || 'Erro inesperado.' })
  }
}
