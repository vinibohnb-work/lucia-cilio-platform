import { createClient } from '@supabase/supabase-js'

// ============================================================================
// Exportação completa dos dados de um cliente (RGPD, art. 20 — portabilidade;
// auditoria de 21/08, R4). Só a administradora a pode pedir.
//
// Junta, num único JSON, tudo o que a plataforma guarda sobre o cliente:
//   · pela conta (user_id): perfil, empresa, livro de caixa, catálogo,
//     obrigações, despesas recorrentes, planeamento, extratos, avença e
//     pagamentos, mensagens, notas de consultoria, casos ESG e as suas fichas;
//   · pela ficha da Gestão (cliente_id): tarefas, pedidos de documentos,
//     mensagens, relatórios trimestrais, notas internas e horas;
//   · pelo e-mail: leads do CRM, consultorias e respostas ao diagnóstico;
//   · os ficheiros da pasta dele, com ligações de download válidas 7 dias.
// Uma tabela que não exista (ou sem a coluna) não pára a exportação: fica
// registada em "avisos".
// ============================================================================

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'client-docs'
const VALIDADE_LIGACOES = 7 * 24 * 3600

const POR_CONTA = [
  ['company_settings', 'user_id'], ['catalog_items', 'user_id'], ['cash_entries', 'user_id'],
  ['clients', 'user_id'], ['fiscal_obligations', 'user_id'], ['recurring_expenses', 'user_id'],
  ['monthly_plans', 'user_id'], ['bank_imports', 'user_id'], ['bank_transactions', 'user_id'],
  ['client_billing', 'user_id'], ['client_notices', 'user_id'], ['consulting_notes', 'user_id'],
  ['esg_consultorias', 'user_id'], ['consultorias', 'user_id'],
]
const POR_FICHA = [
  ['tarefas', 'cliente_id'], ['documentos_cliente', 'cliente_id'], ['mensagens_cliente', 'cliente_id'],
  ['relatorios_trimestrais', 'cliente_id'], ['notas_cliente', 'cliente_id'], ['horas_cliente', 'cliente_id'],
  ['fiscal_obligations', 'cliente_id'], ['client_billing', 'cliente_id'],
]
const POR_EMAIL = [['crm_leads', 'email'], ['consultorias', 'email'], ['diagnostico_submissoes', 'email']]
const ESG_POR_CASO = ['esg_diagnostics', 'esg_materiality', 'esg_projects', 'esg_reports', 'esg_interno', 'esg_comentarios']

async function listarFicheiros(db, prefixo) {
  const { data, error } = await db.storage.from(BUCKET).list(prefixo, { limit: 1000, sortBy: { column: 'name', order: 'asc' } })
  if (error) return []
  const caminhos = []
  for (const item of data || []) {
    const caminho = `${prefixo}/${item.name}`
    if (item.id === null) caminhos.push(...await listarFicheiros(db, caminho))
    else caminhos.push({ caminho, tamanho: item.metadata?.size ?? null, criado: item.created_at })
  }
  return caminhos
}

// Junta linhas de várias fontes sem repetir (a mesma obrigação vem pela conta e pela ficha).
function juntar(dest, tabela, linhas) {
  const atual = dest[tabela] || []
  const vistos = new Set(atual.map(l => l.id).filter(Boolean))
  dest[tabela] = [...atual, ...linhas.filter(l => !l.id || !vistos.has(l.id))]
}

export async function exportar(db, { userId, clienteId }) {
  const dados = {}
  const avisos = []
  const ler = async (tabela, coluna, valor, semMaiusculas = false) => {
    if (!valor) return
    const q = db.from(tabela).select('*')
    const { data, error } = await (semMaiusculas ? q.ilike(coluna, valor) : q.eq(coluna, valor))
    if (error) { avisos.push(`${tabela}.${coluna}: ${error.message}`); return }
    if (data?.length) juntar(dados, tabela, data)
  }

  let ficha = null
  if (clienteId) {
    const { data } = await db.from('clientes').select('*').eq('id', clienteId).maybeSingle()
    ficha = data
  }
  if (!userId && ficha?.user_id) userId = ficha.user_id
  if (!ficha && userId) {
    const { data } = await db.from('clientes').select('*').eq('user_id', userId).limit(1)
    ficha = data?.[0] || null
  }
  if (ficha) dados.clientes = [ficha]

  let conta = null
  if (userId) {
    const { data: u } = await db.auth.admin.getUserById(userId)
    if (u?.user) conta = { id: u.user.id, email: u.user.email, criada_em: u.user.created_at, ultimo_acesso: u.user.last_sign_in_at, nome: u.user.user_metadata?.display_name || null }
    const { data: p } = await db.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (p) dados.profiles = [p]
    for (const [t, c] of POR_CONTA) await ler(t, c, userId)
  }
  for (const [t, c] of POR_FICHA) await ler(t, c, ficha?.id)

  // Pagamentos das avenças encontradas
  for (const b of dados.client_billing || []) await ler('billing_payments', 'billing_id', b.id)
  // Fichas ESG dos casos do cliente
  for (const caso of dados.esg_consultorias || []) for (const t of ESG_POR_CASO) await ler(t, 'consultoria_id', caso.id)
  // Dados ligados pelo e-mail (leads, consultorias, diagnóstico)
  const emails = [...new Set([conta?.email, ficha?.email].filter(Boolean).map(e => e.toLowerCase()))]
  for (const e of emails) for (const [t, c] of POR_EMAIL) await ler(t, c, e, true)

  // Ficheiros: a pasta da conta e a pasta da ficha sem conta
  const ficheiros = [
    ...(userId ? await listarFicheiros(db, userId) : []),
    ...(ficha?.id ? await listarFicheiros(db, `portal/${ficha.id}`) : []),
  ]
  if (ficheiros.length) {
    const { data: urls } = await db.storage.from(BUCKET).createSignedUrls(ficheiros.map(f => f.caminho), VALIDADE_LIGACOES)
    const porCaminho = Object.fromEntries((urls || []).map(u => [u.path, u.signedUrl]))
    ficheiros.forEach(f => { f.ligacao = porCaminho[f.caminho] || null })
  }

  return {
    exportado_em: new Date().toISOString(),
    fundamento: 'RGPD, artigo 20.º — direito de portabilidade dos dados',
    responsavel: 'LC Office Consulting',
    titular: { nome: ficha?.nome || conta?.nome || null, email: conta?.email || ficha?.email || null },
    conta,
    dados,
    ficheiros,
    ligacoes_validas_ate: ficheiros.length ? new Date(Date.now() + VALIDADE_LIGACOES * 1000).toISOString() : null,
    avisos,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não suportado.' })
  if (!URL || !SERVICE_KEY) return res.status(500).json({ error: 'Servidor sem configuração.' })
  const db = createClient(URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
  if (!token) return res.status(401).json({ error: 'Sessão em falta.' })
  const { data: quem, error: eq } = await db.auth.getUser(token)
  if (eq || !quem?.user) return res.status(401).json({ error: 'Sessão inválida.' })
  const { data: prof } = await db.from('profiles').select('role').eq('id', quem.user.id).single()
  if (prof?.role !== 'admin') return res.status(403).json({ error: 'Sem permissão.' })

  const { userId = null, clienteId = null } = req.body || {}
  if (!userId && !clienteId) return res.status(400).json({ error: 'Indique o cliente.' })
  try {
    return res.status(200).json(await exportar(db, { userId, clienteId }))
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erro inesperado.' })
  }
}
