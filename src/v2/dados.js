// v2 · dados de demonstração, guardados no browser.
//
// A v2 é para mostrar o modelo à Lúcia e à Letícia ANTES de mexer na base de
// dados: não lê nem escreve no Supabase, não precisa de migração e não toca em
// produção. Os sete clientes são os do print que elas enviaram; tudo o resto
// (contactos, valores, prazos, mensagens) é inventado e gerado a partir da data
// de hoje, para a demonstração parecer viva em qualquer dia.
//
// Quando o modelo for aprovado, isto dá lugar às tabelas reais — a forma dos
// objetos aqui é, de propósito, a forma que as tabelas vão ter.

import { useSyncExternalStore } from 'react'
import {
  gerarCalendario, hojeIso, somaDias, somaMeses, diasAte, uid, docsEsperados, FECHADOS,
} from './regras'

const CHAVE = 'lc-v2-demo-4'

// ── Semente ────────────────────────────────────────────────────────────────
// Números "aleatórios" mas estáveis: a mesma pessoa vê os mesmos valores.
const h = (s) => { let x = 2166136261; for (const c of String(s)) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619) } return Math.abs(x) }
const entre = (s, a, b) => a + (h(s) % (b - a + 1))
const arred = (v) => Math.round(v * 100) / 100

const CLIENTES = [
  { id: 'cme', nome: 'CME Deutschland GmbH', pessoa: 'Markus Weber', pais: 'DE', forma: 'GmbH', setor: 'Construção', servicos: ['contabilidade', 'esg'], periodicidade: 'mensal', regime: 'regel', trabalhadores: true, software: 'DATEV', estado: 'ativo', responsavel: 'Lúcia Cílio', avenca: 450, avencaPeriodicidade: 'mensal', horasIncluidas: 8, escala: 6, cliente_desde: '2025-03-01' },
  { id: 'vania', nome: 'Vania Dermocosméticos', pessoa: 'Vania', pais: 'DE', forma: 'Einzelunternehmen', setor: 'Cosmética', servicos: ['contabilidade'], periodicidade: 'trimestral', regime: 'regel', trabalhadores: false, software: 'Lexware', estado: 'ativo', responsavel: 'Letícia Rodrigues', avenca: 180, avencaPeriodicidade: 'mensal', horasIncluidas: 3, escala: 2, cliente_desde: '2025-09-01' },
  { id: 'acai', nome: 'Acai Brazil', pessoa: 'Rafael Lima', pais: 'DE', forma: 'UG (haftungsbeschränkt)', setor: 'Alimentar', servicos: ['contabilidade'], periodicidade: 'trimestral', regime: 'regel', trabalhadores: true, software: 'Lexware', estado: 'ativo', responsavel: 'Lúcia Cílio', avenca: 260, avencaPeriodicidade: 'mensal', horasIncluidas: 4, escala: 3, cliente_desde: '2025-06-01' },
  { id: 'celia', nome: 'Célia Munster', pessoa: 'Célia', pais: 'DE', forma: 'Einzelunternehmen', setor: 'Cosmética', servicos: ['contabilidade', 'consultoria'], periodicidade: 'trimestral', regime: 'regel', trabalhadores: false, software: 'Lexware', estado: 'ativo', responsavel: 'Lúcia Cílio', avenca: 160, avencaPeriodicidade: 'mensal', horasIncluidas: 3, escala: 1.6, cliente_desde: '2025-01-15' },
  { id: 'piupiu', nome: 'Café piu piu', pessoa: 'Orlando Neves', pais: 'PT', forma: 'ENI (em nome individual)', setor: 'Restauração', servicos: ['contabilidade'], periodicidade: 'trimestral', regime: 'normal', trabalhadores: true, software: 'TOConline', estado: 'ativo', responsavel: 'Letícia Rodrigues', avenca: 150, avencaPeriodicidade: 'mensal', horasIncluidas: 3, escala: 2.2, cliente_desde: '2025-11-01' },
  { id: 'daniela', nome: 'Daniela Mattke', pessoa: 'Daniela', pais: 'DE', forma: 'Freiberufler', setor: 'Artesanato', servicos: ['contabilidade'], periodicidade: 'anual', regime: 'klein', trabalhadores: false, software: 'sevDesk', estado: 'ativo', responsavel: 'Letícia Rodrigues', avenca: 540, avencaPeriodicidade: 'anual', horasIncluidas: 6, escala: 0.8, cliente_desde: '2026-02-01' },
  { id: 'adalgisa', nome: 'Adalgisa Dias', pessoa: 'Adalgisa', pais: 'PT', forma: 'ENI (em nome individual)', setor: 'Alojamento local', servicos: ['contabilidade'], periodicidade: 'trimestral', regime: 'isento', trabalhadores: false, software: 'TOConline', estado: 'onboarding', responsavel: 'Lúcia Cílio', avenca: 120, avencaPeriodicidade: 'mensal', horasIncluidas: 2, escala: 1, cliente_desde: '2026-09-01' },
].map(c => ({ ...c, email: `${c.id}@example.com`, telefone: '' }))

// Obrigações que têm valor associado (declarações periódicas e adiantamentos)
const COM_VALOR = /^(IVA|USTVA|LSTA|DMR|SS|ESTVZ|KSTVZ|GEWVZ|PPC|UST|EST|KST|GEWST|IRS|IRC)-/

function semear() {
  const hoje = hojeIso()
  const ano = Number(hoje.slice(0, 4))
  const obrigacoes = [], tarefas = [], documentos = [], mensagens = [], relatorios = [], notas = [], horas = [], pagamentos = []

  for (const c of CLIENTES) {
    // ── Obrigações: ano anterior e ano corrente ──
    const lista = [...gerarCalendario(c, ano - 1), ...gerarCalendario(c, ano)]
    for (const g of lista) {
      const d = diasAte(g.prazo, hoje)
      const base = COM_VALOR.test(g.codigo) ? arred(entre(c.id + g.codigo, 90, 900) * c.escala) : null
      const tipoValor = !base ? null : h(g.codigo + c.id) % 9 === 0 ? 'credito' : h(g.codigo + c.id) % 23 === 0 ? 'reembolso' : 'pagar'
      const o = { id: uid(), clienteId: c.id, codigo: g.codigo, nome: g.nome, periodo: g.periodo, prazo: g.prazo, estado: 'por_preparar', valor: null, comprovativo: null, checklist: {}, notas: '' }
      if (d < -3) {
        o.estado = tipoValor === 'pagar' ? 'pago' : 'entregue'
        o.valor = base ? { tipo: tipoValor, montante: base } : null
        o.comprovativo = { nome: `Comprovativo_${g.codigo}.pdf`, data: somaDias(g.prazo, -2) }
        o.checklist = Object.fromEntries(['docs_recebidos', 'docs_verificados', 'contab_atualizada', 'reconciliacao', 'decl_revista', 'decl_submetida', 'comprov_arquivado', 'cliente_informado', 'pagamento_confirmado'].map(k => [k, true]))
      } else if (d <= 0) {
        o.estado = 'entregue'
        o.valor = base ? { tipo: tipoValor, montante: base } : null
        o.comprovativo = { nome: `Comprovativo_${g.codigo}.pdf`, data: g.prazo }
        o.checklist = { docs_recebidos: true, docs_verificados: true, contab_atualizada: true, reconciliacao: true, decl_revista: true, decl_submetida: true, comprov_arquivado: true }
      } else if (d <= 25) {
        o.estado = h(g.codigo) % 3 === 0 ? 'aguardar_docs' : 'em_preparacao'
        o.checklist = o.estado === 'aguardar_docs' ? {} : { docs_recebidos: true, contab_atualizada: true }
        if (/VZ|PPC/.test(g.codigo) && base) o.valor = { tipo: 'pagar', montante: base }
      } else if (/VZ|PPC/.test(g.codigo) && base) {
        o.valor = { tipo: 'pagar', montante: base }   // adiantamentos: o valor é conhecido de antemão
      }
      obrigacoes.push(o)
    }
    // Um atraso a sério, para a demonstração (a declaração mais recente já vencida da Acai)
    if (c.id === 'acai') {
      const vencidas = obrigacoes.filter(o => o.clienteId === 'acai' && o.codigo.startsWith('USTVA') && diasAte(o.prazo, hoje) < 0)
      const ult = vencidas[vencidas.length - 1]
      if (ult) Object.assign(ult, { estado: 'aguardar_docs', valor: null, comprovativo: null, checklist: {} })
    }

    // ── Tarefas: cada obrigação aberta nos próximos 45 dias tem a sua tarefa interna ──
    obrigacoes.filter(o => o.clienteId === c.id && !FECHADOS.includes(o.estado) && diasAte(o.prazo, hoje) <= 45 && diasAte(o.prazo, hoje) >= -30)
      .forEach(o => tarefas.push({
        id: uid(), titulo: `Entregar ${o.nome} (${o.periodo})`, clienteId: c.id, obrigacaoId: o.id,
        responsavel: c.responsavel, prazo: somaDias(o.prazo, -2),
        estado: o.estado === 'em_preparacao' ? 'em_curso' : 'pendente', recorrencia: 'nenhuma', lembreteDias: 3, notas: '',
      }))

    // ── Documentos: os três últimos meses ──
    for (let k = 3; k >= 1; k--) {
      const ref = somaMeses(hoje.slice(0, 8) + '01', -k)
      const [y, m] = ref.split('-').map(Number)
      docsEsperados(c).forEach((tipo, i) => {
        let estado = 'validado'
        if (k === 2) estado = i % 2 ? 'em_analise' : 'validado'
        if (k === 1) estado = (c.id === 'vania' || (c.id === 'acai' && tipo === 'Extrato bancário') || (c.id === 'piupiu' && tipo === 'Salários')) ? 'em_falta' : ['recebido', 'em_analise', 'recebido', 'validado'][i % 4]
        documentos.push({
          id: uid(), clienteId: c.id, ano: y, mes: m, tipo, estado,
          nome: estado === 'em_falta' ? null : `${tipo.split(' ')[0]}_${String(m).padStart(2, '0')}-${y}.pdf`,
          data: estado === 'em_falta' ? null : somaDias(ref, 12 + i), enviadoPor: 'cliente',
        })
      })
    }

    // ── Relatórios trimestrais: T4 do ano passado, T1 e T2 deste ano ──
    ;[[ano - 1, 4], [ano, 1], [ano, 2]].forEach(([y, q], i) => {
      // A crescer de trimestre para trimestre, para as observações baterem com os números.
      const fat = arred(entre(c.id + 'fat', 9000, 12000) * c.escala * [0.92, 0.97, 1.08][i])
      const desp = arred(fat * [0.68, 0.66, 0.62][i])
      relatorios.push({
        id: uid(), clienteId: c.id, ano: y, trimestre: q,
        faturacao: fat, despesas: desp, iva: arred((fat - desp) * 0.19), impostos: arred((fat - desp) * 0.12),
        liquidez: arred(entre(c.id + 'liq' + q, 3000, 9000) * c.escala),
        observacoes: i === 2 ? 'Trimestre acima do anterior, puxado pelo mês de junho.' : 'Trimestre em linha com o esperado.',
        recomendacoes: i === 2 ? 'Reforçar a reserva para impostos antes do fecho do ano.' : '',
        estado: 'enviado', enviadoEm: somaDias(`${y}-${String(q * 3).padStart(2, '0')}-28`, 20),
      })
    })

    // ── Área interna ──
    notas.push(
      { id: uid(), clienteId: c.id, tipo: 'contacto', texto: 'Chamada de acompanhamento — tudo em ordem, pediu para rever a previsão de impostos.', data: somaDias(hoje, -entre(c.id, 3, 20)), autor: c.responsavel, resolvido: false, com: null },
      { id: uid(), clienteId: c.id, tipo: 'duvida', texto: c.pais === 'DE' ? 'Confirmar se o carro da empresa entra como despesa a 100 % ou pelo método de 1 %.' : 'Confirmar se as despesas de representação do último trimestre são dedutíveis.', data: somaDias(hoje, -entre(c.id + 'd', 2, 10)), autor: 'Letícia Rodrigues', resolvido: false, com: null },
      { id: uid(), clienteId: c.id, tipo: 'esclarecer', texto: c.pais === 'DE' ? 'Enquadramento da Gewerbesteuer no próximo ano, com a mudança de atividade.' : 'Mudança de regime de IVA a partir de janeiro.', data: somaDias(hoje, -entre(c.id + 'e', 5, 25)), autor: 'Lúcia Cílio', resolvido: false, com: c.pais === 'DE' ? 'Steuerberater' : 'Contabilista' },
      { id: uid(), clienteId: c.id, tipo: 'nota', texto: `Cliente desde ${c.cliente_desde.slice(5, 7)}/${c.cliente_desde.slice(0, 4)}. Prefere contacto por WhatsApp de manhã.`, data: c.cliente_desde, autor: 'Lúcia Cílio', resolvido: false, com: null },
    )
    ;[3, 10, 17, 24].forEach(k => horas.push({ id: uid(), clienteId: c.id, data: somaDias(hoje, -k), horas: [0.5, 1, 1.5, 2][h(c.id + k) % 4], descricao: ['Lançamentos e reconciliação', 'Preparação da declaração', 'Reunião com o cliente', 'Resposta a dúvidas'][h(k + c.id) % 4], pessoa: c.responsavel }))
    for (let k = 3; k >= 1; k--) {
      if (c.avencaPeriodicidade === 'anual' && k !== 3) continue
      const per = somaMeses(hoje.slice(0, 8) + '01', -k).slice(0, 7)
      if (c.id === 'acai' && k === 1) continue   // avença em atraso, para a demonstração
      pagamentos.push({ id: uid(), clienteId: c.id, periodo: per, valor: c.avenca, data: somaDias(per + '-01', 5) })
    }

    // ── Mensagens ──
    mensagens.push(
      { id: uid(), clienteId: c.id, de: 'equipa', autor: c.responsavel, texto: `Olá, ${c.pessoa}! Bem-vinda à plataforma — a partir de agora os documentos e as mensagens ficam todos aqui.`, anexo: null, data: `${c.cliente_desde}T10:00`, canal: 'plataforma', lida: true },
      { id: uid(), clienteId: c.id, de: 'cliente', autor: c.pessoa, texto: 'Obrigada! Já enviei as faturas do mês passado.', anexo: { nome: 'Faturas_agosto.zip' }, data: `${somaDias(hoje, -entre(c.id, 6, 12))}T18:20`, canal: 'plataforma', lida: true },
    )
  }

  // ── O caso do mockup: Vania, USt-Voranmeldung do trimestre, € 1.245,00 ──
  const vUst = obrigacoes.filter(o => o.clienteId === 'vania' && o.codigo.startsWith('USTVA') && !FECHADOS.includes(o.estado)).sort((a, b) => a.prazo.localeCompare(b.prazo))[0]
  if (vUst) {
    Object.assign(vUst, { estado: 'em_preparacao', valor: { tipo: 'pagar', montante: 1245 }, checklist: { docs_recebidos: true, contab_atualizada: true } })
    tarefas.push(
      { id: uid(), titulo: 'Revisar documentos de IVA', clienteId: 'vania', obrigacaoId: vUst.id, responsavel: 'Letícia Rodrigues', prazo: somaDias(vUst.prazo, -5), estado: 'em_curso', recorrencia: 'trimestral', lembreteDias: 2, notas: '' },
      { id: uid(), titulo: 'Confirmar pagamento com o cliente', clienteId: 'vania', obrigacaoId: vUst.id, responsavel: 'Letícia Rodrigues', prazo: vUst.prazo, estado: 'pendente', recorrencia: 'trimestral', lembreteDias: 1, notas: '' },
      { id: uid(), titulo: 'Preparar relatório do trimestre', clienteId: 'vania', obrigacaoId: null, responsavel: 'Lúcia Cílio', prazo: somaDias(vUst.prazo, 10), estado: 'pendente', recorrencia: 'trimestral', lembreteDias: 5, notas: '' },
    )
    mensagens.push({ id: uid(), clienteId: 'vania', de: 'cliente', autor: 'Vania', texto: 'Bom dia! Já sabem quanto vou pagar de IVA este trimestre?', anexo: null, data: `${somaDias(hoje, -1)}T09:12`, canal: 'plataforma', lida: false })
  }
  // Tarefas gerais da equipa (sem cliente ou com prazos hoje/em atraso)
  tarefas.push(
    { id: uid(), titulo: 'Reunião de acompanhamento trimestral', clienteId: 'celia', obrigacaoId: null, responsavel: 'Lúcia Cílio', prazo: hoje, estado: 'pendente', recorrencia: 'trimestral', lembreteDias: 1, notas: 'Rever o planeamento do 4.º trimestre.' },
    { id: uid(), titulo: 'Pedir recibos de salários de agosto', clienteId: 'piupiu', obrigacaoId: null, responsavel: 'Letícia Rodrigues', prazo: somaDias(hoje, -2), estado: 'pendente', recorrencia: 'nenhuma', lembreteDias: 1, notas: '' },
    { id: uid(), titulo: 'Recolher documentos de abertura de atividade', clienteId: 'adalgisa', obrigacaoId: null, responsavel: 'Lúcia Cílio', prazo: somaDias(hoje, 3), estado: 'em_curso', recorrencia: 'nenhuma', lembreteDias: 2, notas: '' },
    { id: uid(), titulo: 'Atualizar os calendários fiscais do próximo ano', clienteId: null, obrigacaoId: null, responsavel: 'Lúcia Cílio', prazo: `${ano}-12-15`, estado: 'pendente', recorrencia: 'anual', lembreteDias: 14, notas: '' },
  )
  mensagens.push({ id: uid(), clienteId: 'acai', de: 'cliente', autor: 'Rafael Lima', texto: 'Desculpem o atraso com o extrato — o banco mudou o portal. Envio amanhã.', anexo: null, data: `${somaDias(hoje, -3)}T16:40`, canal: 'plataforma', lida: false })

  return {
    versao: CHAVE, semeadoEm: hoje,
    equipa: ['Lúcia Cílio', 'Letícia Rodrigues'],
    clientes: CLIENTES, obrigacoes, tarefas, documentos, mensagens, relatorios, notas, horas, pagamentos,
  }
}

// ── Armazém ────────────────────────────────────────────────────────────────
function carregar() {
  try {
    const s = JSON.parse(localStorage.getItem(CHAVE))
    if (s?.versao === CHAVE) return s
  } catch { /* sem armazenamento: começa do zero */ }
  return semear()
}
let estado = carregar()
const ouvintes = new Set()
function guardar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(estado)) } catch { /* modo privado: fica só em memória */ }
  ouvintes.forEach(f => f())
}
const subscrever = (f) => { ouvintes.add(f); return () => ouvintes.delete(f) }
export const useV2 = () => useSyncExternalStore(subscrever, () => estado)

// Todas as mudanças passam por aqui: copia, altera, guarda, avisa.
function mudar(fn) { const rascunho = structuredClone(estado); fn(rascunho); estado = rascunho; guardar() }

export function repor() { estado = semear(); guardar() }

// ── Ações ──────────────────────────────────────────────────────────────────
export const acoes = {
  criarCliente(dados) {
    const id = uid()
    mudar(s => { s.clientes.push({ id, estado: 'onboarding', servicos: ['contabilidade'], periodicidade: 'trimestral', trabalhadores: false, horasIncluidas: 2, escala: 1, cliente_desde: hojeIso(), telefone: '', email: '', ...dados }) })
    return id
  },
  atualizarCliente(id, patch) { mudar(s => { Object.assign(s.clientes.find(c => c.id === id), patch) }) },

  // Gera o calendário de um ano sem duplicar o que já lá está (pelo código).
  gerarAno(clienteId, ano) {
    let n = 0
    mudar(s => {
      const c = s.clientes.find(x => x.id === clienteId)
      const existentes = new Set(s.obrigacoes.filter(o => o.clienteId === clienteId).map(o => o.codigo))
      gerarCalendario(c, ano).filter(g => !existentes.has(g.codigo)).forEach(g => {
        n++; s.obrigacoes.push({ id: uid(), clienteId, codigo: g.codigo, nome: g.nome, periodo: g.periodo, prazo: g.prazo, estado: 'por_preparar', valor: null, comprovativo: null, checklist: {}, notas: '' })
      })
    })
    return n
  },
  criarObrigacao(dados) { mudar(s => { s.obrigacoes.push({ id: uid(), codigo: `MANUAL-${uid()}`, estado: 'por_preparar', valor: null, comprovativo: null, checklist: {}, notas: '', ...dados }) }) },
  atualizarObrigacao(id, patch) { mudar(s => { Object.assign(s.obrigacoes.find(o => o.id === id), patch) }) },
  alternarChecklist(id, chave) { mudar(s => { const o = s.obrigacoes.find(x => x.id === id); o.checklist = { ...o.checklist, [chave]: !o.checklist?.[chave] } }) },
  removerObrigacao(id) { mudar(s => { s.obrigacoes = s.obrigacoes.filter(o => o.id !== id); s.tarefas.forEach(t => { if (t.obrigacaoId === id) t.obrigacaoId = null }) }) },

  criarTarefa(dados) { mudar(s => { s.tarefas.push({ id: uid(), estado: 'pendente', recorrencia: 'nenhuma', lembreteDias: 2, notas: '', clienteId: null, obrigacaoId: null, ...dados }) }) },
  atualizarTarefa(id, patch) { mudar(s => { Object.assign(s.tarefas.find(t => t.id === id), patch) }) },
  // Concluir uma tarefa recorrente cria logo a próxima — é assim que "repetir
  // mensal, trimestral ou anualmente" funciona sem ninguém ter de se lembrar.
  alternarTarefa(id) {
    mudar(s => {
      const t = s.tarefas.find(x => x.id === id)
      if (t.estado === 'concluida') { t.estado = 'pendente'; return }
      t.estado = 'concluida'; t.concluidaEm = hojeIso()
      const passo = { mensal: 1, trimestral: 3, anual: 12 }[t.recorrencia]
      if (passo && !s.tarefas.some(x => x.origem === t.id)) {
        s.tarefas.push({ ...t, id: uid(), estado: 'pendente', concluidaEm: null, prazo: somaMeses(t.prazo, passo), origem: t.id, obrigacaoId: null })
      }
    })
  },
  removerTarefa(id) { mudar(s => { s.tarefas = s.tarefas.filter(t => t.id !== id) }) },

  criarDocumento(dados) { mudar(s => { s.documentos.push({ id: uid(), estado: 'recebido', data: hojeIso(), enviadoPor: 'equipa', ...dados }) }) },
  atualizarDocumento(id, patch) { mudar(s => { Object.assign(s.documentos.find(d => d.id === id), patch) }) },
  // "Pedir documentos do mês": cria os esperados como Em falta (os que ainda não existem).
  pedirDocumentos(clienteId, ano, mes) {
    let n = 0
    mudar(s => {
      const c = s.clientes.find(x => x.id === clienteId)
      docsEsperados(c).forEach(tipo => {
        if (s.documentos.some(d => d.clienteId === clienteId && d.ano === ano && d.mes === mes && d.tipo === tipo)) return
        n++; s.documentos.push({ id: uid(), clienteId, ano, mes, tipo, estado: 'em_falta', nome: null, data: null, enviadoPor: 'cliente' })
      })
    })
    return n
  },

  enviarMensagem(dados) { mudar(s => { s.mensagens.push({ id: uid(), data: new Date().toISOString().slice(0, 16), anexo: null, canal: 'plataforma', lida: dados.de === 'equipa', ...dados }) }) },
  marcarLidas(clienteId) { mudar(s => { s.mensagens.forEach(m => { if (m.clienteId === clienteId && m.de === 'cliente') m.lida = true }) }) },

  guardarRelatorio(dados) {
    mudar(s => {
      const i = s.relatorios.findIndex(r => r.id === dados.id)
      if (i >= 0) s.relatorios[i] = { ...s.relatorios[i], ...dados }
      else s.relatorios.push({ estado: 'rascunho', ...dados, id: dados.id || uid() })
    })
  },
  enviarRelatorio(id) {
    mudar(s => {
      const r = s.relatorios.find(x => x.id === id)
      r.estado = 'enviado'; r.enviadoEm = hojeIso()
      s.mensagens.push({ id: uid(), clienteId: r.clienteId, de: 'equipa', autor: 'Lúcia Cílio', texto: `O relatório do ${r.trimestre}.º trimestre de ${r.ano} já está disponível na plataforma.`, anexo: { nome: `Relatorio_T${r.trimestre}_${r.ano}.pdf` }, data: new Date().toISOString().slice(0, 16), canal: 'plataforma', lida: true })
    })
  },

  criarNota(dados) { mudar(s => { s.notas.push({ id: uid(), data: hojeIso(), resolvido: false, com: null, ...dados }) }) },
  alternarNota(id) { mudar(s => { const n = s.notas.find(x => x.id === id); n.resolvido = !n.resolvido }) },
  registarHoras(dados) { mudar(s => { s.horas.push({ id: uid(), data: hojeIso(), ...dados }) }) },
  registarPagamento(dados) { mudar(s => { s.pagamentos.push({ id: uid(), data: hojeIso(), ...dados }) }) },
}
