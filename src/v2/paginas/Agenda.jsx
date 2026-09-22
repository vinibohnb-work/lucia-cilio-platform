import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useV2, acoes } from '../dados'
import { Titulo, Botao, Pilulas, useCampos, Ic } from '../ui'
import { PAISES, hojeIso, somaDias, somaMeses, dataDe, iso, fmtData, MESES_LONGOS, FECHADOS, estadoEfetivo } from '../regras'
import { tarefaAtrasada, clientePorId } from '../seletores'
import { FormTarefa } from '../partes/Tarefas'

// Agenda interna (documento, secção 4): tarefas e prazos fiscais de todos os
// clientes por dia, semana e mês, com os mesmos filtros das Tarefas.

const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']
const inicioSemana = (s) => { const d = dataDe(s); const w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return iso(d) }

export default function Agenda() {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const s = useV2()
  const c = useCampos()
  const navigate = useNavigate()
  const hoje = hojeIso()
  const [vista, setVista] = useState(isMobile ? 'dia' : 'mes')
  const [ref, setRef] = useState(hoje)
  const [f, setF] = useState({ cliente: '', pais: '', responsavel: '', obrigacoes: true, feitas: false })
  const [nova, setNova] = useState(null)

  const passaFiltros = (cid, resp) => {
    const cli = cid ? clientePorId(s, cid) : null
    return (!f.cliente || cid === f.cliente) && (!f.pais || cli?.pais === f.pais) && (!f.responsavel || resp === f.responsavel)
  }
  const itensDe = (dia) => [
    ...s.tarefas.filter(x => x.prazo === dia && (f.feitas || x.estado !== 'concluida') && passaFiltros(x.clienteId, x.responsavel))
      .map(x => ({ tipo: 'tarefa', id: x.id, x, titulo: x.titulo, cid: x.clienteId, atraso: tarefaAtrasada(x, hoje), feita: x.estado === 'concluida' })),
    ...(f.obrigacoes ? s.obrigacoes.filter(o => o.prazo === dia && (f.feitas || !FECHADOS.includes(o.estado)) && passaFiltros(o.clienteId, clientePorId(s, o.clienteId)?.responsavel))
      .map(o => ({ tipo: 'obrig', id: o.id, titulo: `${o.nome} · ${o.periodo}`, cid: o.clienteId, atraso: estadoEfetivo(o, hoje) === 'em_atraso', feita: FECHADOS.includes(o.estado) })) : []),
  ]

  const mover = (n) => setRef(vista === 'dia' ? somaDias(ref, n) : vista === 'semana' ? somaDias(ref, 7 * n) : somaMeses(ref.slice(0, 8) + '01', n))
  const d0 = dataDe(ref)
  const tituloPeriodo = vista === 'mes' ? `${MESES_LONGOS[d0.getMonth()]} ${d0.getFullYear()}`
    : vista === 'semana' ? `Semana de ${fmtData(inicioSemana(ref))}` : fmtData(ref)

  const Item = ({ it, compacto }) => {
    const cli = it.cid ? clientePorId(s, it.cid) : null
    const cor = it.atraso ? { bg: t.dueLate.bg, ink: t.dueLate.ink } : it.tipo === 'obrig' ? { bg: t.chipBg, ink: t.chipText } : { bg: t.softCardBg, ink: t.heading }
    return (
      <div onClick={() => it.cid ? navigate(`/v2/clientes/${it.cid}/${it.tipo === 'obrig' ? 'obrigacoes' : 'tarefas'}`) : setNova(it.x)}
        title={`${cli ? cli.nome + ' — ' : ''}${it.titulo}`}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: compacto ? '2px 6px' : '8px 10px', borderRadius: '7px', background: cor.bg, color: cor.ink, fontSize: compacto ? '11px' : '13px', cursor: 'pointer', opacity: it.feita ? 0.5 : 1, overflow: 'hidden', whiteSpace: compacto ? 'nowrap' : 'normal', marginBottom: '3px', border: it.tipo === 'obrig' ? `1px solid ${t.accent}55` : 'none' }}>
        {it.tipo === 'tarefa' && !compacto && <input type="checkbox" checked={it.feita} onClick={e => e.stopPropagation()} onChange={() => acoes.alternarTarefa(it.id)} style={{ accentColor: '#1f6b45', flex: 'none' }} />}
        <span style={{ flex: 'none' }}>{it.tipo === 'obrig' ? '📅' : '✓'}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{compacto && cli ? `${cli.nome.split(' ')[0]} · ` : ''}{it.titulo}{!compacto && cli ? <span style={{ opacity: .7 }}> — {cli.nome}</span> : ''}</span>
      </div>
    )
  }

  let corpo
  if (vista === 'mes') {
    const primeiro = ref.slice(0, 8) + '01'
    const ini = inicioSemana(primeiro)
    const dias = [...Array(42)].map((_, i) => somaDias(ini, i))
    corpo = (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', border: `1px solid ${t.cardBorder}`, borderRadius: '14px', overflow: 'hidden', background: t.cardBg }}>
        {DIAS.map(d => <div key={d} style={{ padding: '8px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: t.textMuted, background: t.softCardBg, borderBottom: `1px solid ${t.cardBorder}` }}>{d}</div>)}
        {dias.map(dia => {
          const its = itensDe(dia)
          const fora = dia.slice(0, 7) !== ref.slice(0, 7)
          return (
            <div key={dia} onClick={() => { setRef(dia); setVista('dia') }} style={{ minHeight: '104px', padding: '6px', borderRight: `1px solid ${t.rowBorder}`, borderBottom: `1px solid ${t.rowBorder}`, background: dia === hoje ? 'rgba(201,168,76,.08)' : 'transparent', opacity: fora ? 0.45 : 1, cursor: 'pointer', minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: dia === hoje ? 800 : 600, color: dia === hoje ? t.accentText : t.textMuted, marginBottom: '4px' }}>{Number(dia.slice(8))}</div>
              {its.slice(0, 3).map(it => <div key={it.id} onClick={e => e.stopPropagation()}><Item it={it} compacto /></div>)}
              {its.length > 3 && <div style={{ fontSize: '11px', color: t.accentText, fontWeight: 700 }}>+{its.length - 3} mais</div>}
            </div>
          )
        })}
      </div>
    )
  } else if (vista === 'semana') {
    const ini = inicioSemana(ref)
    corpo = (
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(7, minmax(0, 1fr))', gap: '8px' }}>
        {[...Array(7)].map((_, i) => {
          const dia = somaDias(ini, i)
          const its = itensDe(dia)
          return (
            <div key={dia} style={{ background: t.cardBg, border: `1px solid ${dia === hoje ? t.accent : t.cardBorder}`, borderRadius: '12px', padding: '10px', minHeight: isMobile ? 0 : '240px', minWidth: 0 }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: dia === hoje ? t.accentText : t.heading, marginBottom: '8px' }}>{DIAS[i]} {Number(dia.slice(8))}</div>
              {its.length === 0 ? <div style={{ fontSize: '11.5px', color: t.subtle }}>—</div> : its.map(it => <Item key={it.id} it={it} compacto={!isMobile} />)}
            </div>
          )
        })}
      </div>
    )
  } else {
    const its = itensDe(ref)
    corpo = (
      <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: '14px', padding: '16px' }}>
        {its.length === 0 ? <div style={{ fontSize: '13px', color: t.subtle, padding: '20px', textAlign: 'center' }}>Nada marcado para este dia.</div> : its.map(it => <Item key={it.id} it={it} />)}
      </div>
    )
  }

  return (
    <div>
      <Titulo eyebrow="Área interna" titulo="Agenda" sub="Tarefas e prazos fiscais de todos os clientes. Clique num dia para o ver em detalhe."
        acoes={<Botao variante="primario" onClick={() => setNova({ prazo: ref })}><Ic.mais size={16} />Nova tarefa</Botao>} />
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
        <Pilulas valor={vista} aoMudar={setVista} opcoes={[['dia', 'Dia'], ['semana', 'Semana'], ['mes', 'Mês']]} />
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <Botao onClick={() => mover(-1)} aria-label="Anterior" estilo={{ padding: '0 11px' }}>‹</Botao>
          <Botao onClick={() => setRef(hoje)}>Hoje</Botao>
          <Botao onClick={() => mover(1)} aria-label="Seguinte" estilo={{ padding: '0 11px' }}>›</Botao>
        </div>
        <strong style={{ fontSize: '16px', color: t.heading, textTransform: 'capitalize' }}>{tituloPeriodo}</strong>
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'center' }}>
        <select value={f.cliente} onChange={e => setF(p => ({ ...p, cliente: e.target.value }))} style={{ ...c.input, width: 'auto', cursor: 'pointer' }} aria-label="Cliente"><option value="">Todos os clientes</option>{s.clientes.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}</select>
        <select value={f.pais} onChange={e => setF(p => ({ ...p, pais: e.target.value }))} style={{ ...c.input, width: 'auto', cursor: 'pointer' }} aria-label="País"><option value="">Todos os países</option>{Object.entries(PAISES).map(([k, r]) => <option key={k} value={k}>{r}</option>)}</select>
        <select value={f.responsavel} onChange={e => setF(p => ({ ...p, responsavel: e.target.value }))} style={{ ...c.input, width: 'auto', cursor: 'pointer' }} aria-label="Responsável"><option value="">Toda a equipa</option>{s.equipa.map(x => <option key={x}>{x}</option>)}</select>
        <label style={{ fontSize: '12.5px', display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer' }}><input type="checkbox" checked={f.obrigacoes} onChange={e => setF(p => ({ ...p, obrigacoes: e.target.checked }))} style={{ accentColor: t.btnBg }} />Prazos fiscais</label>
        <label style={{ fontSize: '12.5px', display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer' }}><input type="checkbox" checked={f.feitas} onChange={e => setF(p => ({ ...p, feitas: e.target.checked }))} style={{ accentColor: t.btnBg }} />Mostrar concluídas</label>
        <span style={{ fontSize: '11.5px', color: t.subtle, marginLeft: 'auto' }}>📅 prazo fiscal · ✓ tarefa · <span style={{ color: t.neg }}>vermelho = em atraso</span></span>
      </div>
      {corpo}
      {nova && <FormTarefa inicial={nova} aoFechar={() => setNova(null)} />}
    </div>
  )
}
