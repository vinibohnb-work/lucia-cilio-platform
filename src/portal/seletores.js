import { linkGoogleCalendar } from '../lib/googleCalendar'
// Portal · leituras derivadas do estado — o que o Resumo, a Agenda e as listas
// mostram é sempre calculado daqui, nunca guardado à parte.
import { estadoEfetivo, FECHADOS, hojeIso, diasAte } from './regras'

export const obrigacoesDe = (s, cid) => s.obrigacoes.filter(o => o.clienteId === cid).sort((a, b) => a.prazo.localeCompare(b.prazo))
export const abertas = (lista) => lista.filter(o => !FECHADOS.includes(o.estado))
export const proximaObrigacao = (s, cid) => abertas(obrigacoesDe(s, cid))[0] || null
export const docsEmFalta = (s, cid) => s.documentos.filter(d => (!cid || d.clienteId === cid) && d.estado === 'em_falta')

// Valores a pagar já apurados: obrigações em curso ou entregues com valor a
// pagar e ainda não pagas. Os adiantamentos futuros "por preparar" ficam de
// fora — contam quando a obrigação começa a ser tratada.
export const valorAPagar = (s, cid) => obrigacoesDe(s, cid)
  .filter(o => o.valor?.tipo === 'pagar' && !['pago', 'nao_aplicavel', 'por_preparar'].includes(o.estado) && Number(o.valor.montante) > 0)
  .reduce((t, o) => t + Number(o.valor.montante), 0)
export const entregues = (s, cid) => obrigacoesDe(s, cid).filter(o => ['entregue', 'pago'].includes(o.estado)).sort((a, b) => b.prazo.localeCompare(a.prazo))
export const relatoriosDe = (s, cid) => s.relatorios.filter(r => r.clienteId === cid).sort((a, b) => (b.ano - a.ano) || (b.trimestre - a.trimestre))
export const ultimoRelatorio = (s, cid) => relatoriosDe(s, cid).find(r => r.estado === 'enviado') || null

export const tarefaAtrasada = (t, hoje = hojeIso()) => t.estado !== 'concluida' && t.prazo < hoje
// Lembrete: faltam "lembreteDias" ou menos e ainda não está feita.
export const lembreteAtivo = (t, hoje = hojeIso()) => t.estado !== 'concluida' && diasAte(t.prazo, hoje) <= Number(t.lembreteDias || 0)

export const naoLidas = (s, cid) => s.mensagens.filter(m => (!cid || m.clienteId === cid) && m.de === 'cliente' && !m.lida)
export const obrigacoesEmAtraso = (s) => s.obrigacoes.filter(o => estadoEfetivo(o) === 'em_atraso')
export const clientePorId = (s, id) => s.clientes.find(c => c.id === id)
// Regra única para as contagens da equipa (Início, Relatórios, Mensagens):
// os clientes inativos não contam (13-D, 13/10).
export const clienteEmCurso = (c) => !!c && c.estado !== 'inativo'

// Link "Adicionar ao Google Calendar" de uma reunião (29/10, opção 1)
export function linkReuniao(s, x) {
  if (x.tipo !== 'reuniao') return null
  const cli = x.clienteId ? clientePorId(s, x.clienteId) : null
  const detalhes = [cli ? `Cliente: ${cli.nome}` : '', cli?.telefone ? `Telefone: ${cli.telefone}` : '', cli?.email ? `E-mail: ${cli.email}` : '', x.notas || ''].filter(Boolean).join('\n')
  return linkGoogleCalendar({ titulo: cli ? `${x.titulo} — ${cli.nome}` : x.titulo, data: x.prazo, hora: x.hora, duracaoMin: x.duracaoMin, detalhes })
}
