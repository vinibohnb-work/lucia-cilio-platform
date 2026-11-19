// Relatório de horas (pedido da Letícia, 06/11): os registos de um período,
// filtrados por pessoa e por cliente/atividade, com totais por cliente e
// atividade, por pessoa e a lista dos registos. Sai em duas formas:
//   · imprimir / guardar em PDF (janela própria, sempre em tema claro);
//   · descarregar para Excel (CSV com ";" e vírgula decimal, como o Excel pt espera).
// Funções puras: o ecrã está em partes/RelatorioHoras.jsx.

import { fmtData } from './regras'

export const TODOS = ''

const soma = (lista) => lista.reduce((t, h) => t + Number(h.horas || 0), 0)
export const fmtHoras = (n) => `${(Math.round(n * 100) / 100).toLocaleString('pt-PT', { maximumFractionDigits: 2 })} h`
const numCsv = (n) => String(Math.round(Number(n || 0) * 100) / 100).replace('.', ',')

// destino: '' (todos), 'c:<clienteId>' ou 'a:<atividade>'
export function filtrarHoras(horas, { de, ate, pessoa = TODOS, destino = TODOS }) {
  return horas
    .filter(h => (!de || h.data >= de) && (!ate || h.data <= ate))
    .filter(h => !pessoa || h.pessoa === pessoa)
    .filter(h => !destino
      || (destino.startsWith('c:') && h.clienteId === destino.slice(2))
      || (destino.startsWith('a:') && !h.clienteId && h.atividade === destino.slice(2)))
    .sort((a, b) => a.data.localeCompare(b.data) || (a.pessoa || '').localeCompare(b.pessoa || ''))
}

export function resumoHoras(lista, nomeCliente) {
  const destinoDe = (h) => (h.clienteId ? (nomeCliente[h.clienteId] || 'Cliente removido') : (h.atividade || '—'))
  const agrupar = (chave, nome, extra = () => ({})) => Object.values(lista.reduce((acc, h) => {
    const k = chave(h)
    acc[k] = acc[k] || { k, nome: nome(h), horas: 0, registos: 0, ...extra(h) }
    acc[k].horas += Number(h.horas || 0); acc[k].registos += 1
    return acc
  }, {})).sort((a, b) => b.horas - a.horas || a.nome.localeCompare(b.nome))
  return {
    total: soma(lista),
    registos: lista.length,
    destinoDe,
    porDestino: agrupar(h => (h.clienteId ? `c:${h.clienteId}` : `a:${h.atividade}`), destinoDe, h => ({ cliente: !!h.clienteId })),
    porPessoa: agrupar(h => h.pessoa || '—', h => h.pessoa || '—'),
  }
}

export function csvHoras(lista, nomeCliente) {
  const { destinoDe } = resumoHoras([], nomeCliente)
  const cel = (v) => { const s = String(v ?? ''); return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
  const linhas = [['Dia', 'Quem', 'Cliente ou atividade', 'Tipo', 'Horas', 'O que foi feito']]
  for (const h of lista) linhas.push([h.data, h.pessoa || '', destinoDe(h), h.clienteId ? 'Cliente' : 'Atividade', numCsv(h.horas), h.descricao || ''])
  linhas.push(['', '', '', 'Total', numCsv(soma(lista)), ''])
  // BOM para o Excel abrir os acentos certos
  return '﻿' + linhas.map(l => l.map(cel).join(';')).join('\r\n')
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export function htmlHoras(lista, nomeCliente, { de, ate, pessoaTxt, destinoTxt, origem = '' }) {
  const r = resumoHoras(lista, nomeCliente)
  const pct = (h) => (r.total ? `${Math.round((h / r.total) * 100)} %` : '')
  const tabelaResumo = (titulo, linhas, rotulo) => `
    <h2>${esc(titulo)}</h2>
    <table><thead><tr><th>${esc(rotulo)}</th><th class="n">Registos</th><th class="n">Horas</th><th class="n">%</th></tr></thead>
    <tbody>${linhas.map(l => `<tr><td>${esc(l.nome)}${l.cliente === false ? ' <span class="sub">· atividade</span>' : ''}</td><td class="n">${l.registos}</td><td class="n">${fmtHoras(l.horas)}</td><td class="n">${pct(l.horas)}</td></tr>`).join('')}
    <tr class="total"><td>Total</td><td class="n">${r.registos}</td><td class="n">${fmtHoras(r.total)}</td><td></td></tr></tbody></table>`
  return `<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><title>Relatório de horas · ${esc(fmtData(de))} a ${esc(fmtData(ate))}</title>
  <style>
    @page { size: A4; margin: 16mm 14mm; }
    * { box-sizing: border-box; }
    body { font-family: Archivo, 'Segoe UI', Arial, sans-serif; color: #1d2b26; font-size: 11.5px; margin: 0; }
    header { border-bottom: 3px solid #0E3D33; padding-bottom: 10px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; }
    .marca { font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #8a6a22; }
    h1 { font-size: 21px; color: #0E3D33; margin: 2px 0 0; }
    .filtros { text-align: right; color: #4b5a55; line-height: 1.5; }
    .kpis { display: flex; gap: 10px; margin-bottom: 16px; }
    .kpi { flex: 1; border: 1px solid #d9d2c0; border-radius: 8px; padding: 9px 12px; }
    .kpi b { display: block; font-size: 18px; color: #0E3D33; font-variant-numeric: tabular-nums; }
    .kpi span { font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #6b7a75; font-weight: 700; }
    h2 { font-size: 13px; color: #0E3D33; margin: 18px 0 6px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #6b7a75; border-bottom: 1.5px solid #0E3D33; padding: 5px 6px; }
    td { padding: 5px 6px; border-bottom: 1px solid #e6e0d0; vertical-align: top; }
    tr { page-break-inside: avoid; }
    .n { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .sub { color: #7a8783; font-size: 10.5px; }
    .total td { font-weight: 800; border-bottom: none; border-top: 1.5px solid #0E3D33; }
    footer { margin-top: 18px; font-size: 10px; color: #7a8783; }
  </style></head><body>
  <header>
    <div><div class="marca">LC Office · Lúcia Cílio Office Consulting</div><h1>Relatório de horas</h1></div>
    <div class="filtros">${esc(fmtData(de))} a ${esc(fmtData(ate))}<br>${esc(pessoaTxt)} · ${esc(destinoTxt)}</div>
  </header>
  <div class="kpis">
    <div class="kpi"><span>Total de horas</span><b>${fmtHoras(r.total)}</b></div>
    <div class="kpi"><span>Registos</span><b>${r.registos}</b></div>
    <div class="kpi"><span>Clientes e atividades</span><b>${r.porDestino.length}</b></div>
  </div>
  ${r.porDestino.length > 1 ? tabelaResumo('Por cliente e atividade', r.porDestino, 'Cliente ou atividade') : ''}
  ${r.porPessoa.length > 1 ? tabelaResumo('Por pessoa', r.porPessoa, 'Quem') : ''}
  <h2>Registos</h2>
  <table><thead><tr><th>Dia</th><th>Quem</th><th>Cliente ou atividade</th><th>O que foi feito</th><th class="n">Horas</th></tr></thead>
  <tbody>${lista.map(h => `<tr><td style="white-space:nowrap">${esc(fmtData(h.data))}</td><td>${esc(h.pessoa || '—')}</td><td>${esc(r.destinoDe(h))}</td><td>${esc(h.descricao || '')}</td><td class="n">${fmtHoras(h.horas)}</td></tr>`).join('')}
  <tr class="total"><td colspan="4">Total</td><td class="n">${fmtHoras(r.total)}</td></tr></tbody></table>
  <footer>Gerado em ${esc(fmtData(origem))} na plataforma LC Office.</footer>
  </body></html>`
}
