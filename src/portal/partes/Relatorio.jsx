import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { usePortal, acoes } from '../dados'
import { Botao, Campo, useCampos, Chip } from '../ui'
import { fmtEur, fmtData, hojeIso, PAISES } from '../regras'

// Relatório trimestral (documento, secção 8). Os números são introduzidos à
// mão porque a contabilidade pode estar no TOConline, Lexware, DATEV ou noutro
// sistema — a plataforma não finge que os calcula. O resultado e a comparação
// com o trimestre anterior, esses sim, calculam-se.

const CAMPOS = [['faturacao', 'Faturação'], ['despesas', 'Despesas'], ['iva', 'IVA do trimestre'], ['impostos', 'Impostos pagos ou previstos'], ['liquidez', 'Liquidez (saldo em bancos)']]
const num = (v) => (v === '' || v == null ? null : Number(v))
export const resultado = (r) => (num(r.faturacao) ?? 0) - (num(r.despesas) ?? 0)
export const anteriorDe = (lista, r) => lista.find(x => x.clienteId === r.clienteId && ((x.ano === r.ano && x.trimestre === r.trimestre - 1) || (r.trimestre === 1 && x.ano === r.ano - 1 && x.trimestre === 4)))

function Delta({ atual, antes, menosEMelhor }) {
  const { t } = useTheme()
  if (antes == null || atual == null || !antes) return <span style={{ color: t.subtle, fontSize: '11.5px' }}>—</span>
  const pct = ((atual - antes) / Math.abs(antes)) * 100
  const bom = menosEMelhor ? pct <= 0 : pct >= 0
  return <span style={{ fontSize: '11.5px', fontWeight: 800, color: bom ? t.dueOk.ink : t.neg }}>{pct >= 0 ? '▲' : '▼'} {Math.abs(pct).toFixed(1).replace('.', ',')} %</span>
}

export function exportarPdf(r, cli, ant) {
  const esc = (s) => String(s ?? '').replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]))
  const linhas = [...CAMPOS.slice(0, 2), ['resultado', 'Resultado'], ...CAMPOS.slice(2)].filter(([k]) => k === 'resultado' || num(r[k]) != null || (ant && num(ant[k]) != null)).map(([k, rot]) => {
    const v = k === 'resultado' ? resultado(r) : num(r[k]); const a = ant ? (k === 'resultado' ? resultado(ant) : num(ant[k])) : null
    const d = a ? `${(((v - a) / Math.abs(a)) * 100).toFixed(1).replace('.', ',')} %` : '—'
    return `<tr${k === 'resultado' ? ' class="res"' : ''}><td>${esc(rot)}</td><td>${fmtEur(v)}</td><td>${a != null ? fmtEur(a) : '—'}</td><td>${d}</td></tr>`
  }).join('')
  const html = `<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>Relatório T${r.trimestre} ${r.ano} — ${esc(cli.nome)}</title><style>
    body{font-family:Georgia,serif;color:#1a2b20;max-width:760px;margin:40px auto;padding:0 24px;line-height:1.55}
    .top{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #c9a84c;padding-bottom:12px;margin-bottom:24px}
    .marca{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6b5a2a}
    h1{font-size:26px;margin:4px 0 0} .sub{color:#667;font-size:13px}
    table{width:100%;border-collapse:collapse;font-size:13px;margin:8px 0 22px}
    th{text-align:left;border-bottom:1px solid #999;padding:6px 8px;font-size:11px;text-transform:uppercase;color:#556}
    td{border-bottom:1px solid #e3ddd0;padding:7px 8px} tr.res td{font-weight:bold;background:#f6f1e6}
    h2{font-size:16px;margin:22px 0 6px;color:#0a2f1a} p{font-size:13.5px;white-space:pre-wrap;margin:0}
    .pe{margin-top:34px;font-size:11px;color:#889;border-top:1px solid #e3ddd0;padding-top:10px}
  </style></head><body>
    <div class="top"><div><div class="marca">Lúcia Cílio · Office Consulting</div><h1>Resumo do ${r.trimestre}.º trimestre de ${r.ano}</h1><div class="sub">${esc(cli.nome)} · ${esc(PAISES[cli.pais])}</div></div></div>
    <table><tr><th></th><th>T${r.trimestre} ${r.ano}</th><th>${ant ? `T${ant.trimestre} ${ant.ano}` : 'Anterior'}</th><th>Variação</th></tr>${linhas}</table>
    ${r.observacoes ? `<h2>Observações</h2><p>${esc(r.observacoes)}</p>` : ''}
    ${r.recomendacoes ? `<h2>Recomendações</h2><p>${esc(r.recomendacoes)}</p>` : ''}
    <div class="pe">Valores introduzidos a partir da contabilidade (${esc(cli.software || '—')}). Documento de acompanhamento, não substitui as declarações oficiais.</div>
  </body></html>`
  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html); w.document.close()
  setTimeout(() => w.print(), 300)
}

export function EditorRelatorio({ inicial, aoFechar, soLeitura }) {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const s = usePortal()
  const c = useCampos()
  const [r, setR] = useState(inicial)
  const cli = s.clientes.find(x => x.id === r.clienteId)
  const ant = anteriorDe(s.relatorios, r)
  const set = (k) => (e) => setR(p => ({ ...p, [k]: e.target.value }))
  const guardar = (extra = {}) => acoes.guardarRelatorio({ ...r, ...Object.fromEntries(CAMPOS.map(([k]) => [k, num(r[k])])), ...extra })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: t.heading }}>{r.trimestre}.º trimestre de {r.ano}</h3>
        <Chip tom={r.estado === 'enviado' ? 'ok' : 'aviso'}>{r.estado === 'enviado' ? `Enviado a ${fmtData(r.enviadoEm)}` : 'Rascunho'}</Chip>
        {!soLeitura && <span style={{ fontSize: '12px', color: t.subtle }}>Contabilidade em {cli?.software || '—'} — valores introduzidos à mão.</span>}
      </div>

      <div style={{ overflowX: 'auto', marginBottom: '14px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
          <thead><tr>{['', `T${r.trimestre} ${r.ano}`, ant ? `T${ant.trimestre} ${ant.ano}` : 'Trimestre anterior', 'Variação'].map((h, i) => <th key={i} style={c.th}>{h}</th>)}</tr></thead>
          <tbody>
            {[...CAMPOS.slice(0, 2), ['resultado', 'Resultado'], ...CAMPOS.slice(2)].map(([k, rot]) => {
              const res = k === 'resultado'
              const v = res ? resultado(r) : num(r[k]); const a = ant ? (res ? resultado(ant) : num(ant[k])) : null
              return (
                <tr key={k} style={{ background: res ? t.softCardBg : 'transparent' }}>
                  <td style={{ ...c.td, fontWeight: res ? 800 : 600, color: t.heading }}>{rot}</td>
                  <td style={c.td}>
                    {res || soLeitura ? <strong style={{ color: res && v < 0 ? t.neg : t.heading }}>{fmtEur(v)}</strong>
                      : <input type="number" step="0.01" value={r[k] ?? ''} onChange={set(k)} style={{ ...c.input, maxWidth: '170px' }} />}
                  </td>
                  <td style={{ ...c.td, color: t.textMuted }}>{a != null ? fmtEur(a) : '—'}</td>
                  <td style={c.td}><Delta atual={v} antes={a} menosEMelhor={k === 'despesas'} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {!(soLeitura && !r.observacoes && !r.recomendacoes) && <div style={{ display: 'grid', gridTemplateColumns: isMobile || (soLeitura && !(r.observacoes && r.recomendacoes)) ? '1fr' : '1fr 1fr', gap: '12px' }}>
        {!(soLeitura && !r.observacoes) && <Campo rotulo="Observações">{soLeitura ? <p style={{ margin: 0, fontSize: '13px', whiteSpace: 'pre-wrap' }}>{r.observacoes || '—'}</p> : <textarea value={r.observacoes || ''} onChange={set('observacoes')} rows={4} style={{ ...c.input, resize: 'vertical' }} />}</Campo>}
        {!(soLeitura && !r.recomendacoes) && <Campo rotulo="Recomendações">{soLeitura ? <p style={{ margin: 0, fontSize: '13px', whiteSpace: 'pre-wrap' }}>{r.recomendacoes || '—'}</p> : <textarea value={r.recomendacoes || ''} onChange={set('recomendacoes')} rows={4} style={{ ...c.input, resize: 'vertical' }} />}</Campo>}
      </div>}

      <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
        {!soLeitura && <Botao variante="primario" onClick={() => { guardar(); aoFechar?.() }}>Guardar</Botao>}
        <Botao onClick={() => exportarPdf({ ...r, ...Object.fromEntries(CAMPOS.map(([k]) => [k, num(r[k])])) }, cli, ant)}>Exportar PDF</Botao>
        {!soLeitura && r.estado !== 'enviado' && <Botao variante="ouro" onClick={() => { guardar({ estado: 'enviado', enviadoEm: hojeIso() }); aoFechar?.() }} title="Depois de exportar o PDF e o enviar ao cliente">Guardar e marcar como enviado</Botao>}
        {aoFechar && <Botao variante="fantasma" onClick={aoFechar}>Fechar</Botao>}
      </div>
    </div>
  )
}
