import { createClient } from '@supabase/supabase-js'
import { URL_AT, lerQuadroAT } from '../src/lib/agendaFiscalPT.js'

// ============================================================================
// Prazos oficiais da AT (Portugal) para comparar com o calendário da plataforma.
//
// Descarrega os quadros-resumo do Portal das Finanças (declarativas e
// pagamentos) do ano pedido e do seguinte — as declarações anuais e o IVA de
// novembro/dezembro caem no ano a seguir — e devolve-os já lidos. O browser não
// os pode pedir diretamente (CORS). Só endereços fixos da AT: não é um proxy.
//
// Só a equipa (admin, comercial, marketing) pode chamar. Os dados são públicos,
// mas assim a função não fica aberta a qualquer pessoa na internet.
// ============================================================================

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const EQUIPA = ['admin', 'comercial', 'marketing']

async function quadro(tipo, ano) {
  const r = await fetch(URL_AT(tipo, ano), { headers: { 'User-Agent': 'LC-Office-Plataforma (agenda fiscal)' } })
  if (r.status === 404) return null           // a AT ainda não publicou esse ano
  if (!r.ok) throw new Error(`Portal das Finanças respondeu ${r.status}`)
  const linhas = lerQuadroAT(await r.text())
  return linhas.length ? linhas : null
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não suportado.' })
  if (!URL || !SERVICE_KEY) return res.status(500).json({ error: 'Servidor sem configuração.' })
  const db = createClient(URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
  if (!token) return res.status(401).json({ error: 'Sessão em falta.' })
  const { data: quem, error: eq } = await db.auth.getUser(token)
  if (eq || !quem?.user) return res.status(401).json({ error: 'Sessão inválida.' })
  const { data: prof } = await db.from('profiles').select('role').eq('id', quem.user.id).single()
  if (!EQUIPA.includes(prof?.role)) return res.status(403).json({ error: 'Sem permissão.' })

  const ano = Number(req.query?.ano) || new Date().getFullYear()
  if (ano < 2024 || ano > 2100) return res.status(400).json({ error: 'Ano inválido.' })
  try {
    const anos = {}
    for (const a of [ano - 1, ano, ano + 1]) {
      const [decl, pag] = await Promise.all([quadro('decl', a), quadro('pag', a)])
      anos[a] = decl || pag ? { decl: decl || [], pag: pag || [] } : null
    }
    res.setHeader('Cache-Control', 'private, max-age=3600')
    return res.status(200).json({ anos, fontes: [URL_AT('decl', ano), URL_AT('pag', ano)], obtidoEm: new Date().toISOString() })
  } catch (e) {
    return res.status(502).json({ error: e.message || 'Não foi possível ler o Portal das Finanças.' })
  }
}
