// Portal de gestão de clientes · dados.
//
// Lê e grava no Supabase (migração 037). As páginas do portal nasceram na v2
// com dados de demonstração; a forma dos objetos aqui é exatamente a mesma, por
// isso as páginas não mudaram — só deixaram de viver num browser.
//
// Como funciona: carrega tudo uma vez (a carteira da Lúcia é pequena), guarda
// num armazém em memória e cada ação muda o armazém logo (o ecrã responde sem
// esperar) e grava a seguir. Os ids são gerados aqui, para uma tarefa acabada
// de criar poder ser editada antes de a gravação voltar. Se a gravação falhar,
// aparece o erro e o armazém volta a ser lido da base de dados.

import { useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabase'
import { listUsers } from '../lib/adminApi'
import { gerarCalendario, hojeIso, iso, somaMeses, diasAte, docsEsperados } from './regras'

const novoId = () => crypto.randomUUID()
const BUCKET = 'client-docs'

const VAZIO = {
  carregado: false, erro: '', eu: '', admin: false,
  equipa: [], contas: [],
  clientes: [], obrigacoes: [], tarefas: [], documentos: [], mensagens: [], relatorios: [], notas: [], horas: [], pagamentos: [],
}

// ── Armazém ────────────────────────────────────────────────────────────────
let estado = VAZIO
const ouvintes = new Set()
const avisar = () => ouvintes.forEach(f => f())
const subscrever = (f) => { ouvintes.add(f); return () => ouvintes.delete(f) }
export const usePortal = () => useSyncExternalStore(subscrever, () => estado)

function mudar(fn) { const r = structuredClone(estado); fn(r); estado = r; avisar() }
export function limparErro() { if (estado.erro) { estado = { ...estado, erro: '' }; avisar() } }

// Grava e, se falhar, mostra o erro e volta a ler tudo — o ecrã nunca fica a
// mostrar uma coisa que não está na base de dados.
async function gravar(pedido) {
  const { error } = await pedido
  if (error) {
    console.error('[portal]', error)
    estado = { ...estado, erro: `Não foi possível guardar (${error.message}). Os dados foram relidos.` }
    avisar()
    recarregar()
    return false
  }
  return true
}

// ── Conversões base de dados ⇄ portal ──────────────────────────────────────
const PER_DB = { monthly: 'mensal', quarterly: 'trimestral', annual: 'anual', once: 'unico' }

function deCliente(r, contrato) {
  return {
    id: r.id, nome: r.nome, pessoa: r.pessoa || '', email: r.email || '', telefone: r.telefone || '',
    pais: r.pais || 'PT', forma: r.forma || '', setor: r.setor || '', servicos: r.servicos || [],
    periodicidade: r.periodicidade, regime: r.regime || '', trabalhadores: !!r.trabalhadores,
    software: r.software || '', estado: r.estado, responsavel: r.responsavel || '',
    horasIncluidas: Number(r.horas_incluidas || 0), cliente_desde: r.cliente_desde, notas: r.notas || '',
    userId: r.user_id || null,
    // A avença vive no Financeiro (client_billing); aqui só se lê.
    contratoId: contrato?.id || null,
    avenca: contrato ? Number(contrato.amount) : null,
    avencaPeriodicidade: contrato ? PER_DB[contrato.periodicity] || 'mensal' : null,
    contrato: contrato ? { periodicity: contrato.periodicity, start_month: contrato.start_month } : null,
  }
}
function paraCliente(p) {
  const m = { horasIncluidas: 'horas_incluidas', userId: 'user_id' }
  const out = {}
  for (const [k, v] of Object.entries(p)) {
    if (['id', 'contratoId', 'avenca', 'avencaPeriodicidade', 'contrato'].includes(k)) continue
    out[m[k] || k] = v === '' && ['cliente_desde', 'userId'].includes(k) ? null : v === '' && k === 'horasIncluidas' ? 0 : v
  }
  return out
}

// As obrigações geradas na conta do cliente (v1) não têm período: tira-se do
// código (PT-IVA-2026-T1 → "T1 2026"; as declarações anuais da v1 são do ano
// anterior ao do código) ou, em último caso, do nome e do prazo.
function periodoDe(r) {
  if (r.periodo) return r.periodo
  const m = /^(?:PT|DE)-[A-Z]+-(\d{4})(?:-([TQ]\d))?$/.exec(r.code || '')
  if (m) return m[2] ? `${m[2]} ${m[1]}` : String(Number(m[1]) - 1)
  const n = /\(([TQ]\d)\/(\d{4})\)/.exec(r.obligation_type || '')
  if (n) return `${n[1]} ${n[2]}`
  return String(r.deadline || '').slice(0, 4)
}

function deObrigacao(r) {
  return {
    id: r.id, clienteId: r.cliente_id, codigo: r.code || `MANUAL-${r.id}`, nome: r.obligation_type,
    periodo: periodoDe(r), prazo: r.deadline, estado: r.estado || (r.status === 'done' ? 'entregue' : 'por_preparar'),
    valor: r.valor_tipo ? { tipo: r.valor_tipo, montante: r.valor == null ? '' : Number(r.valor) } : null,
    comprovativo: r.comprovativo_nome ? { nome: r.comprovativo_nome, caminho: r.comprovativo_path, data: r.comprovativo_data } : null,
    checklist: r.checklist || {}, notas: r.notas || '', origem: r.source,
  }
}
function paraObrigacao(p) {
  const out = {}
  for (const [k, v] of Object.entries(p)) {
    if (k === 'nome') out.obligation_type = v
    else if (k === 'prazo') out.deadline = v
    else if (k === 'codigo') out.code = v
    else if (k === 'valor') { out.valor_tipo = v?.tipo || null; out.valor = v?.tipo && v.montante !== '' && v.montante != null ? Number(v.montante) : null }
    else if (k === 'comprovativo') { out.comprovativo_nome = v?.nome || null; out.comprovativo_path = v?.caminho || null; out.comprovativo_data = v?.data || null }
    else if (['periodo', 'estado', 'checklist', 'notas'].includes(k)) out[k] = v
  }
  return out
}

const deTarefa = (r) => ({
  id: r.id, titulo: r.titulo, clienteId: r.cliente_id, obrigacaoId: r.obrigacao_id, responsavel: r.responsavel || '',
  prazo: r.prazo, estado: r.estado, recorrencia: r.recorrencia, lembreteDias: r.lembrete_dias, notas: r.notas || '',
  origem: r.origem, concluidaEm: r.concluida_em,
})
function paraTarefa(p) {
  const m = { clienteId: 'cliente_id', obrigacaoId: 'obrigacao_id', lembreteDias: 'lembrete_dias', concluidaEm: 'concluida_em' }
  const out = {}
  for (const [k, v] of Object.entries(p)) {
    if (!['id', 'titulo', 'clienteId', 'obrigacaoId', 'responsavel', 'prazo', 'estado', 'recorrencia', 'lembreteDias', 'notas', 'origem', 'concluidaEm'].includes(k)) continue
    out[m[k] || k] = v === '' ? null : v
  }
  return out
}

const deDocumento = (r) => ({
  id: r.id, clienteId: r.cliente_id, ano: r.ano, mes: r.mes, tipo: r.tipo, estado: r.estado,
  nome: r.nome, caminho: r.caminho, enviadoPor: r.enviado_por, data: r.data,
})
function paraDocumento(p) {
  const m = { clienteId: 'cliente_id', enviadoPor: 'enviado_por' }
  const out = {}
  for (const [k, v] of Object.entries(p)) if (['id', 'clienteId', 'ano', 'mes', 'tipo', 'estado', 'nome', 'caminho', 'enviadoPor', 'data'].includes(k)) out[m[k] || k] = v
  return out
}

const deRelatorio = (r) => ({
  id: r.id, clienteId: r.cliente_id, ano: r.ano, trimestre: r.trimestre,
  faturacao: r.faturacao, despesas: r.despesas, iva: r.iva, impostos: r.impostos, liquidez: r.liquidez,
  observacoes: r.observacoes || '', recomendacoes: r.recomendacoes || '', estado: r.estado, enviadoEm: r.enviado_em,
})
const paraRelatorio = (p) => ({
  id: p.id, cliente_id: p.clienteId, ano: p.ano, trimestre: p.trimestre,
  faturacao: p.faturacao ?? null, despesas: p.despesas ?? null, iva: p.iva ?? null, impostos: p.impostos ?? null, liquidez: p.liquidez ?? null,
  observacoes: p.observacoes || null, recomendacoes: p.recomendacoes || null, estado: p.estado || 'rascunho', enviado_em: p.enviadoEm || null,
  updated_at: new Date().toISOString(),
})

const deNota = (r) => ({ id: r.id, clienteId: r.cliente_id, tipo: r.tipo, texto: r.texto, com: r.com, autor: r.autor, resolvido: r.resolvido, data: r.data })
const deHoras = (r) => ({ id: r.id, clienteId: r.cliente_id, atividade: r.atividade || '', data: r.data, horas: Number(r.horas), descricao: r.descricao, pessoa: r.pessoa })

// As mensagens são duas fontes numa só conversa: o que a equipa escreveu na
// plataforma do cliente (client_notices — é o que ele vê no Início) e o registo
// do que foi por WhatsApp ou combinado fora (mensagens_cliente).
const deMensagem = (r) => ({
  id: r.id, clienteId: r.cliente_id, de: r.de, autor: r.autor, texto: r.texto || '',
  anexo: r.anexo_nome ? { nome: r.anexo_nome, caminho: r.anexo_path } : null,
  data: r.created_at, canal: r.canal, lida: r.lida,
})
const deAviso = (r, clienteId) => ({
  id: r.id, clienteId, de: 'equipa', autor: r.autor || 'LC Office Consulting',
  texto: [r.titulo, r.corpo].filter(Boolean).join('\n'),
  anexo: r.anexo_nome ? { nome: r.anexo_nome, caminho: r.anexo_path } : null,
  data: r.created_at, canal: 'plataforma', lida: true, lidaPeloCliente: !!r.lido_em,
})

// ── Carregar ───────────────────────────────────────────────────────────────
let aCarregar = null
let quem = { eu: '', admin: false }

export function carregar({ eu, admin }) {
  quem = { eu, admin }
  if (!aCarregar) aCarregar = ler().finally(() => { aCarregar = null })
  return aCarregar
}
export function recarregar() { return carregar(quem) }

async function ler() {
  const q = (p) => p.then(({ data, error }) => { if (error) throw error; return data || [] })
  try {
    const [clientes, obrig, tarefas, docs, msgs, avisos, rels, notas, horas, contratos, pagamentos] = await Promise.all([
      q(supabase.from('clientes').select('*').order('nome')),
      q(supabase.from('fiscal_obligations').select('*').not('cliente_id', 'is', null)),
      q(supabase.from('tarefas').select('*')),
      q(supabase.from('documentos_cliente').select('*')),
      q(supabase.from('mensagens_cliente').select('*')),
      q(supabase.from('client_notices').select('*').order('created_at')),
      q(supabase.from('relatorios_trimestrais').select('*')),
      q(supabase.from('notas_cliente').select('*').order('created_at')),
      q(supabase.from('horas_cliente').select('*')),
      // A avença é da administradora: para a restante equipa as políticas devolvem vazio.
      q(supabase.from('client_billing').select('id,cliente_id,amount,periodicity,start_month,active,created_at').not('cliente_id', 'is', null).order('created_at')),
      q(supabase.from('billing_payments').select('*')),
    ])
    const contratoDe = {}
    contratos.filter(b => b.active).forEach(b => { if (!contratoDe[b.cliente_id]) contratoDe[b.cliente_id] = b })
    const clientePorBilling = Object.fromEntries(contratos.map(b => [b.id, b.cliente_id]))
    const clientePorUser = Object.fromEntries(clientes.filter(c => c.user_id).map(c => [c.user_id, c.id]))

    // Contas da plataforma (para ligar uma ficha a uma conta) e nomes da equipa:
    // só a administradora os consegue listar; para as outras fica o que as fichas dizem.
    let contas = [], equipa = []
    if (quem.admin) {
      try {
        const users = await listUsers()
        contas = users.filter(u => u.role === 'user').map(u => ({ id: u.id, nome: u.display_name || u.email, email: u.email, ativo: !!u.last_sign_in_at /* as contas nascem com o e-mail confirmado: só o acesso conta (R-B11) */, platform: u.platform }))
        equipa = users.filter(u => ['admin', 'comercial', 'marketing'].includes(u.role)).map(u => u.display_name || u.email.split('@')[0])
      } catch (e) { console.warn('[portal] contas', e) }
    }
    const nomes = new Set([...equipa, quem.eu, ...clientes.map(c => c.responsavel), ...tarefas.map(t => t.responsavel)].filter(Boolean))

    estado = {
      carregado: true, erro: '', eu: quem.eu, admin: quem.admin,
      equipa: [...nomes].sort((a, b) => a.localeCompare(b, 'pt')),
      contas,
      clientes: clientes.map(c => deCliente(c, contratoDe[c.id])),
      obrigacoes: obrig.map(deObrigacao),
      tarefas: tarefas.map(deTarefa),
      documentos: docs.map(deDocumento),
      mensagens: [
        ...msgs.map(deMensagem),
        ...avisos.filter(a => clientePorUser[a.user_id]).map(a => deAviso(a, clientePorUser[a.user_id])),
      ].sort((a, b) => a.data.localeCompare(b.data)),
      relatorios: rels.map(deRelatorio),
      notas: notas.map(deNota),
      horas: horas.map(deHoras),
      pagamentos: pagamentos.filter(p => clientePorBilling[p.billing_id]).map(p => ({ id: p.id, clienteId: clientePorBilling[p.billing_id], billingId: p.billing_id, periodo: p.period, valor: Number(p.amount), data: p.paid_at })),
    }
  } catch (e) {
    console.error('[portal] carregar', e)
    estado = { ...VAZIO, eu: quem.eu, admin: quem.admin, carregado: true, erro: `Não foi possível ler os dados (${e.message || e}). A migração 037 já foi aplicada?` }
  }
  avisar()
}

// ── Ficheiros ──────────────────────────────────────────────────────────────
// Clientes com conta: a pasta deles ({user_id}/…), a mesma que veem e para onde
// enviam — o que a equipa carrega por mês aparece-lhes no mês certo. Clientes
// sem conta: uma pasta só da equipa.
const limparNome = (n) => n.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').slice(-80)
export function pastaDoCliente(c) { return c.userId || `portal/${c.id}` }

export async function enviarFicheiro(clienteId, subpasta, ficheiro) {
  const c = estado.clientes.find(x => x.id === clienteId)
  const caminho = `${pastaDoCliente(c)}/${subpasta}/${Date.now().toString(36)}-${limparNome(ficheiro.name)}`
  const { error } = await supabase.storage.from(BUCKET).upload(caminho, ficheiro, { upsert: false })
  if (error) {
    estado = { ...estado, erro: `O ficheiro não foi carregado (${error.message}).` }
    avisar()
    return null
  }
  return caminho
}
export async function abrirFicheiro(caminho) {
  if (!caminho) return
  const janela = window.open('', '_blank')   // aberta já, para o browser não a bloquear
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(caminho, 300)
  if (error || !data?.signedUrl) { janela?.close(); estado = { ...estado, erro: 'Não foi possível abrir o ficheiro.' }; avisar(); return }
  if (janela) janela.location.href = data.signedUrl
  else window.location.href = data.signedUrl
}
export async function listarPasta(caminho) {
  const { data } = await supabase.storage.from(BUCKET).list(caminho, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })
  return (data || []).filter(f => f.id && f.name !== '.keep').map(f => ({ nome: f.name.replace(/^[a-z0-9]{6,9}-/, ''), caminho: `${caminho}/${f.name}`, data: f.created_at ? iso(new Date(f.created_at)) : '' }))
}

// ── Calendário: sem duplicar o que o cliente já gerou na conta dele ────────
// A plataforma do cliente tem um gerador mais simples, com outros códigos
// (PT-IVA-2026-T1…). O mesmo prazo não entra duas vezes: mesma família de
// obrigação e prazo a menos de duas semanas é a mesma obrigação.
const FAMILIA_V1 = { 'PT-IVA': 'IVA', 'PT-SS': 'SS', 'PT-IRS': 'IRS', 'DE-UST': 'USTVA', 'DE-GEW': 'GEWVZ', 'DE-EST': 'EST' }
function familia(codigo = '') {
  const v1 = Object.keys(FAMILIA_V1).find(k => codigo.startsWith(k + '-'))
  return v1 ? FAMILIA_V1[v1] : codigo.split('-')[0]
}

// Um cliente acabado de criar ainda pode estar a caminho da base de dados
// quando se gera o calendário dele: as obrigações esperam pela ficha.
const fichasAGravar = {}
const depoisDaFicha = (clienteId, fn) => (fichasAGravar[clienteId] || Promise.resolve()).then(fn)

// ── Ações ──────────────────────────────────────────────────────────────────
export const acoes = {
  criarCliente(dados) {
    const id = novoId()
    const c = {
      id, estado: 'onboarding', servicos: ['contabilidade'], periodicidade: 'trimestral', trabalhadores: false,
      horasIncluidas: 0, cliente_desde: hojeIso(), telefone: '', email: '', pessoa: '', userId: null, ...dados,
    }
    mudar(s => { s.clientes.push({ ...c, contratoId: null, avenca: null, avencaPeriodicidade: null, contrato: null }); s.clientes.sort((a, b) => a.nome.localeCompare(b.nome, 'pt')) })
    // O id vai no insert: é o que o calendário gerado a seguir referencia (teste de 05/10).
    fichasAGravar[id] = gravar(supabase.from('clientes').insert({ id, ...paraCliente(c) })).finally(() => { delete fichasAGravar[id] })
    return id
  },
  // Apagar a ficha leva tudo o que lhe pertence (as tabelas da 037 têm on delete
  // cascade): calendário da equipa, tarefas, pedidos de documentos, relatórios,
  // notas, horas, registo de mensagens. A conta na plataforma, se existir, fica.
  async apagarCliente(id) {
    mudar(s => {
      s.clientes = s.clientes.filter(c => c.id !== id)
      for (const k of ['obrigacoes', 'tarefas', 'documentos', 'mensagens', 'relatorios', 'notas', 'horas', 'pagamentos']) s[k] = s[k].filter(x => x.clienteId !== id)
    })
    return gravar(supabase.from('clientes').delete().eq('id', id))
  },
  atualizarCliente(id, patch) {
    mudar(s => { Object.assign(s.clientes.find(c => c.id === id), patch) })
    gravar(supabase.from('clientes').update({ ...paraCliente(patch), updated_at: new Date().toISOString() }).eq('id', id))
  },
  // Ligar a ficha a uma conta da plataforma: as obrigações que o cliente já
  // tinha passam a aparecer aqui, e as daqui passam a aparecer-lhe.
  async ligarConta(id, userId) {
    mudar(s => { s.clientes.find(c => c.id === id).userId = userId || null })
    if (!await gravar(supabase.from('clientes').update({ user_id: userId || null }).eq('id', id))) return
    if (userId) {
      await gravar(supabase.from('fiscal_obligations').update({ cliente_id: id }).eq('user_id', userId).is('cliente_id', null))
      await gravar(supabase.from('fiscal_obligations').update({ user_id: userId }).eq('cliente_id', id).is('user_id', null))
    }
    recarregar()
  },

  // Gera o calendário de um ano sem duplicar o que já lá está.
  gerarAno(clienteId, ano) {
    const c = estado.clientes.find(x => x.id === clienteId)
    const existentes = estado.obrigacoes.filter(o => o.clienteId === clienteId)
    const codigos = new Set(existentes.map(o => o.codigo))
    const novas = gerarCalendario(c, ano)
      .filter(g => !codigos.has(g.codigo))
      .filter(g => !existentes.some(o => familia(o.codigo) === familia(g.codigo) && Math.abs(diasAte(o.prazo, g.prazo)) <= 14))
      .map(g => ({ id: novoId(), clienteId, codigo: g.codigo, nome: g.nome, periodo: g.periodo, prazo: g.prazo, estado: 'por_preparar', valor: null, comprovativo: null, checklist: {}, notas: '', origem: 'portal' }))
    if (!novas.length) return 0
    mudar(s => { s.obrigacoes.push(...novas) })
    depoisDaFicha(clienteId, () => gravar(supabase.from('fiscal_obligations').insert(novas.map(o => ({ id: o.id, cliente_id: clienteId, user_id: c.userId, country: c.pais, client: c.nome, source: 'portal', status: 'pending', ...paraObrigacao(o) })))))
    return novas.length
  },
  criarObrigacao(dados) {
    const c = estado.clientes.find(x => x.id === dados.clienteId)
    const o = { id: novoId(), estado: 'por_preparar', valor: null, comprovativo: null, checklist: {}, notas: '', origem: 'manual', ...dados }
    o.codigo = `MANUAL-${o.id}`
    mudar(s => { s.obrigacoes.push(o) })
    const linha = { id: o.id, cliente_id: o.clienteId, user_id: c?.userId || null, country: c?.pais || 'PT', client: c?.nome, source: 'manual', status: 'pending', ...paraObrigacao(o) }
    delete linha.code   // manuais não têm código (o índice único é só para o calendário)
    gravar(supabase.from('fiscal_obligations').insert(linha))
  },
  atualizarObrigacao(id, patch) {
    mudar(s => { Object.assign(s.obrigacoes.find(o => o.id === id), patch) })
    gravar(supabase.from('fiscal_obligations').update(paraObrigacao(patch)).eq('id', id))
  },
  alternarChecklist(id, chave) {
    const o = estado.obrigacoes.find(x => x.id === id)
    acoes.atualizarObrigacao(id, { checklist: { ...o.checklist, [chave]: !o.checklist?.[chave] } })
  },
  removerObrigacao(id) {
    mudar(s => { s.obrigacoes = s.obrigacoes.filter(o => o.id !== id); s.tarefas.forEach(t => { if (t.obrigacaoId === id) t.obrigacaoId = null }) })
    gravar(supabase.from('fiscal_obligations').delete().eq('id', id))
  },
  async anexarComprovativo(id, ficheiro) {
    const o = estado.obrigacoes.find(x => x.id === id)
    const caminho = await enviarFicheiro(o.clienteId, 'Comprovativos', ficheiro)
    if (!caminho) return
    acoes.atualizarObrigacao(id, { comprovativo: { nome: ficheiro.name, caminho, data: hojeIso() }, checklist: { ...o.checklist, comprov_arquivado: true } })
  },

  criarTarefa(dados) {
    const t = { id: novoId(), estado: 'pendente', recorrencia: 'nenhuma', lembreteDias: 2, notas: '', clienteId: null, obrigacaoId: null, ...dados }
    mudar(s => { s.tarefas.push(t) })
    gravar(supabase.from('tarefas').insert(paraTarefa(t)))
  },
  atualizarTarefa(id, patch) {
    mudar(s => { Object.assign(s.tarefas.find(t => t.id === id), patch) })
    gravar(supabase.from('tarefas').update(paraTarefa(patch)).eq('id', id))
  },
  // Concluir uma tarefa recorrente cria logo a próxima — é assim que "repetir
  // mensal, trimestral ou anualmente" funciona sem ninguém ter de se lembrar.
  alternarTarefa(id) {
    const t = estado.tarefas.find(x => x.id === id)
    if (t.estado === 'concluida') { acoes.atualizarTarefa(id, { estado: 'pendente', concluidaEm: null }); return }
    acoes.atualizarTarefa(id, { estado: 'concluida', concluidaEm: hojeIso() })
    const passo = { mensal: 1, trimestral: 3, anual: 12 }[t.recorrencia]
    if (passo && !estado.tarefas.some(x => x.origem === t.id)) {
      acoes.criarTarefa({ ...t, id: novoId(), estado: 'pendente', concluidaEm: null, prazo: somaMeses(t.prazo, passo), origem: t.id, obrigacaoId: null })
    }
  },
  removerTarefa(id) {
    mudar(s => { s.tarefas = s.tarefas.filter(t => t.id !== id) })
    gravar(supabase.from('tarefas').delete().eq('id', id))
  },

  criarDocumento(dados) {
    const d = { id: novoId(), estado: 'recebido', data: hojeIso(), enviadoPor: 'equipa', ...dados }
    mudar(s => { s.documentos.push(d) })
    gravar(supabase.from('documentos_cliente').insert(paraDocumento(d)))
  },
  atualizarDocumento(id, patch) {
    mudar(s => { Object.assign(s.documentos.find(d => d.id === id), patch) })
    gravar(supabase.from('documentos_cliente').update(paraDocumento(patch)).eq('id', id))
  },
  // Carrega o ficheiro para a pasta do mês e regista-o (preenche o "em falta" do mesmo tipo, se houver).
  async carregarDocumento({ clienteId, ano, mes, tipo, ficheiro }) {
    const caminho = await enviarFicheiro(clienteId, `${ano}-${String(mes).padStart(2, '0')}`, ficheiro)
    if (!caminho) return
    const falta = estado.documentos.find(d => d.clienteId === clienteId && d.ano === ano && d.mes === mes && d.tipo === tipo && d.estado === 'em_falta')
    const dados = { nome: ficheiro.name, caminho, estado: 'recebido', data: hojeIso(), enviadoPor: 'equipa' }
    if (falta) acoes.atualizarDocumento(falta.id, dados)
    else acoes.criarDocumento({ clienteId, ano, mes, tipo, ...dados })
  },
  // "Pedir documentos do mês": cria os esperados como Em falta (os que ainda não existem).
  pedirDocumentos(clienteId, ano, mes) {
    const c = estado.clientes.find(x => x.id === clienteId)
    const novos = docsEsperados(c)
      .filter(tipo => !estado.documentos.some(d => d.clienteId === clienteId && d.ano === ano && d.mes === mes && d.tipo === tipo))
      .map(tipo => ({ id: novoId(), clienteId, ano, mes, tipo, estado: 'em_falta', nome: null, caminho: null, data: null, enviadoPor: 'cliente' }))
    if (!novos.length) return 0
    mudar(s => { s.documentos.push(...novos) })
    gravar(supabase.from('documentos_cliente').insert(novos.map(paraDocumento)))
    return novos.length
  },

  // Cliente com conta: a mensagem vai para o Início da plataforma dele.
  // Cliente sem conta, ou WhatsApp: fica registada na ficha.
  async enviarMensagem({ clienteId, texto, canal = 'plataforma', ficheiro = null }) {
    const c = estado.clientes.find(x => x.id === clienteId)
    const anexo = ficheiro ? await enviarFicheiro(clienteId, 'Mensagens', ficheiro) : null
    if (ficheiro && !anexo) return
    const id = novoId()
    const agora = new Date().toISOString()
    const m = { id, clienteId, de: 'equipa', autor: estado.eu, texto, anexo: anexo ? { nome: ficheiro.name, caminho: anexo } : null, data: agora, lida: true }
    if (canal === 'plataforma' && c.userId) {
      mudar(s => { s.mensagens.push({ ...m, canal: 'plataforma', lidaPeloCliente: false }) })
      const [titulo, ...resto] = texto.split('\n')
      const { data: sessao } = await supabase.auth.getSession()
      gravar(supabase.from('client_notices').insert({
        id, user_id: c.userId, titulo: titulo.slice(0, 140) || (ficheiro ? ficheiro.name : 'Mensagem'), corpo: resto.join('\n').trim() || null,
        tom: 'info', created_by: sessao.session?.user?.id || null, anexo_nome: m.anexo?.nome || null, anexo_path: anexo,
      }))
    } else {
      const canalReg = canal === 'whatsapp' ? 'whatsapp' : 'registo'
      mudar(s => { s.mensagens.push({ ...m, canal: canalReg }) })
      gravar(supabase.from('mensagens_cliente').insert({ id, cliente_id: clienteId, de: 'equipa', autor: estado.eu, texto, canal: canalReg, anexo_nome: m.anexo?.nome || null, anexo_path: anexo }))
    }
  },
  marcarLidas(clienteId) {
    const ids = estado.mensagens.filter(m => m.clienteId === clienteId && m.de === 'cliente' && !m.lida).map(m => m.id)
    if (!ids.length) return
    mudar(s => { s.mensagens.forEach(m => { if (ids.includes(m.id)) m.lida = true }) })
    gravar(supabase.from('mensagens_cliente').update({ lida: true }).in('id', ids))
  },

  guardarRelatorio(dados) {
    const existe = estado.relatorios.find(r => r.id === dados.id)
    const r = { estado: 'rascunho', ...existe, ...dados, id: dados.id || novoId() }
    mudar(s => { const i = s.relatorios.findIndex(x => x.id === r.id); if (i >= 0) s.relatorios[i] = r; else s.relatorios.push(r) })
    gravar(supabase.from('relatorios_trimestrais').upsert(paraRelatorio(r)))
    return r.id
  },
  // "Enviado" (o cliente ainda não vê relatórios na plataforma: quer dizer que a
  // Lúcia exportou o PDF e o mandou) grava-se pelo guardarRelatorio, com
  // estado e enviadoEm no próprio upsert — um update à parte corria antes de
  // o upsert chegar à base e atualizava 0 linhas sem erro (teste de 05/10).

  criarNota(dados) {
    const n = { id: novoId(), data: hojeIso(), resolvido: false, com: null, autor: estado.eu, ...dados }
    mudar(s => { s.notas.push(n) })
    gravar(supabase.from('notas_cliente').insert({ id: n.id, cliente_id: n.clienteId, tipo: n.tipo, texto: n.texto, com: n.com, autor: n.autor, resolvido: n.resolvido, data: n.data }))
  },
  alternarNota(id) {
    const n = estado.notas.find(x => x.id === id)
    mudar(s => { s.notas.find(x => x.id === id).resolvido = !n.resolvido })
    gravar(supabase.from('notas_cliente').update({ resolvido: !n.resolvido }).eq('id', id))
  },
  // Horas da equipa: para um cliente (clienteId) ou para uma atividade
  // (atividade: marketing, interno…) — migração 041.
  registarHoras(dados) {
    const h = { id: novoId(), data: hojeIso(), pessoa: estado.eu, clienteId: null, atividade: '', ...dados }
    mudar(s => { s.horas.push(h) })
    gravar(supabase.from('horas_cliente').insert({ id: h.id, cliente_id: h.clienteId || null, atividade: h.clienteId ? null : h.atividade, data: h.data, horas: h.horas, descricao: h.descricao, pessoa: h.pessoa }))
  },
  apagarHoras(id) {
    mudar(s => { s.horas = s.horas.filter(h => h.id !== id) })
    gravar(supabase.from('horas_cliente').delete().eq('id', id))
  },
  // Pagamento da avença: grava no Financeiro (billing_payments), o mesmo sítio
  // onde a Lúcia já os marcava.
  registarPagamento({ clienteId, periodo, valor }) {
    const c = estado.clientes.find(x => x.id === clienteId)
    if (!c?.contratoId) return
    const p = { id: novoId(), clienteId, billingId: c.contratoId, periodo, valor, data: hojeIso() }
    mudar(s => { s.pagamentos.push(p) })
    gravar(supabase.from('billing_payments').insert({ id: p.id, billing_id: p.billingId, period: periodo, amount: valor, paid_at: p.data }))
  },
}
