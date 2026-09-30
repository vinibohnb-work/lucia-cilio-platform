import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { usePortal } from '../dados'
import { Titulo, Botao, Cartao, useCampos, Ic, Chip, Vazio } from '../ui'
import { PAISES, hojeIso, somaDias, fmtData, MESES_LONGOS, FECHADOS, estadoEfetivo } from '../regras'
import { tarefaAtrasada, docsEmFalta, clientePorId } from '../seletores'
import { FormTarefa, TabelaTarefas } from '../partes/Tarefas'

// Área interna de tarefas (documento, secção 4): a agenda de todos os clientes
// numa lista, com os quatro destaques pedidos — hoje, próximos prazos, em
// atraso e documentos em falta — e os filtros por cliente, país, responsável,
// estado e prazo.

export default function Tarefas() {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const s = usePortal()
  const c = useCampos()
  const navigate = useNavigate()
  const hoje = hojeIso()
  const em7 = somaDias(hoje, 7)
  const [nova, setNova] = useState(false)
  const [f, setF] = useState({ cliente: '', pais: '', responsavel: '', estado: 'abertas', prazo: 'todos' })
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }))

  const abertas = s.tarefas.filter(x => x.estado !== 'concluida')
  const deHoje = abertas.filter(x => x.prazo === hoje)
  const proximas = abertas.filter(x => x.prazo > hoje && x.prazo <= em7)
  const obrigProx = s.obrigacoes.filter(o => !FECHADOS.includes(o.estado) && o.prazo >= hoje && o.prazo <= em7)
  const atraso = abertas.filter(x => tarefaAtrasada(x, hoje))
  const falta = docsEmFalta(s)

  const lista = s.tarefas.filter(x => {
    const cli = x.clienteId ? clientePorId(s, x.clienteId) : null
    if (f.cliente && x.clienteId !== f.cliente) return false
    if (f.pais && cli?.pais !== f.pais) return false
    if (f.responsavel && x.responsavel !== f.responsavel) return false
    if (f.estado === 'abertas' && x.estado === 'concluida') return false
    if (!['abertas', 'todas'].includes(f.estado) && x.estado !== f.estado) return false
    if (f.prazo === 'hoje' && x.prazo !== hoje) return false
    if (f.prazo === '7dias' && !(x.prazo >= hoje && x.prazo <= em7)) return false
    if (f.prazo === 'mes' && x.prazo.slice(0, 7) !== hoje.slice(0, 7)) return false
    if (f.prazo === 'atraso' && !tarefaAtrasada(x, hoje)) return false
    return true
  }).sort((a, b) => (a.estado === 'concluida') - (b.estado === 'concluida') || a.prazo.localeCompare(b.prazo))

  const destaque = (rot, n, sub, tom, ativo, aoClicar) => (
    <button onClick={aoClicar} style={{ textAlign: 'left', padding: '16px 18px', borderRadius: '14px', cursor: 'pointer', fontFamily: 'inherit', background: t.cardBg, border: `1.5px solid ${ativo ? t.accent : t.cardBorder}`, boxShadow: t.cardShadow }}>
      <div style={{ fontSize: '12.5px', color: t.textMuted, fontWeight: 600 }}>{rot}</div>
      <div style={{ fontSize: '28px', fontWeight: 800, color: n && tom ? tom : t.heading, lineHeight: 1.2 }}>{n}</div>
      <div style={{ fontSize: '11.5px', color: t.subtle }}>{sub}</div>
    </button>
  )
  const [verDocs, setVerDocs] = useState(false)

  return (
    <div>
      <Titulo eyebrow="Área interna" titulo="Tarefas" sub="As tarefas de todos os clientes. As que se repetem criam a próxima sozinhas quando se marcam como feitas."
        acoes={<Botao variante="primario" onClick={() => setNova(true)}><Ic.mais size={16} />Nova tarefa</Botao>} />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '12px', marginBottom: '18px' }}>
        {destaque('Tarefas de hoje', deHoje.length, fmtData(hoje), t.accentText, f.prazo === 'hoje' && !verDocs, () => { setVerDocs(false); setF(p => ({ ...p, prazo: 'hoje', estado: 'abertas' })) })}
        {destaque('Próximos prazos', proximas.length + obrigProx.length, `${proximas.length} tarefas · ${obrigProx.length} obrigações em 7 dias`, null, f.prazo === '7dias' && !verDocs, () => { setVerDocs(false); setF(p => ({ ...p, prazo: '7dias', estado: 'abertas' })) })}
        {destaque('Em atraso', atraso.length, 'tarefas por fechar', t.neg, f.prazo === 'atraso' && !verDocs, () => { setVerDocs(false); setF(p => ({ ...p, prazo: 'atraso', estado: 'abertas' })) })}
        {destaque('Documentos em falta', falta.length, `${new Set(falta.map(d => d.clienteId)).size} clientes`, t.neg, verDocs, () => setVerDocs(v => !v))}
      </div>

      {verDocs ? (
        <Cartao titulo="Documentos em falta" icone={<Ic.doc />}>
          {falta.length === 0 ? <Vazio>Nada em falta.</Vazio> : [...new Set(falta.map(d => d.clienteId))].map(cid => {
            const cli = clientePorId(s, cid)
            const ds = falta.filter(d => d.clienteId === cid)
            return (
              <div key={cid} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 0', borderTop: `1px solid ${t.rowBorder}`, flexWrap: 'wrap' }}>
                <strong style={{ color: t.heading, minWidth: '180px' }}>{cli?.nome}</strong>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', flex: 1 }}>{ds.map(d => <Chip key={d.id} tom="erro">{d.tipo} · {MESES_LONGOS[d.mes - 1].slice(0, 3)}</Chip>)}</div>
                <Botao variante="fantasma" onClick={() => navigate(`/gestao/clientes/${cid}/documentos`)}>Abrir →</Botao>
              </div>
            )
          })}
        </Cartao>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: '10px', marginBottom: '14px' }}>
            <select value={f.cliente} onChange={set('cliente')} style={{ ...c.input, cursor: 'pointer' }} aria-label="Cliente"><option value="">Todos os clientes</option>{s.clientes.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}</select>
            <select value={f.pais} onChange={set('pais')} style={{ ...c.input, cursor: 'pointer' }} aria-label="País"><option value="">Todos os países</option>{Object.entries(PAISES).map(([k, r]) => <option key={k} value={k}>{r}</option>)}</select>
            <select value={f.responsavel} onChange={set('responsavel')} style={{ ...c.input, cursor: 'pointer' }} aria-label="Responsável"><option value="">Toda a equipa</option>{s.equipa.map(x => <option key={x}>{x}</option>)}</select>
            <select value={f.estado} onChange={set('estado')} style={{ ...c.input, cursor: 'pointer' }} aria-label="Estado"><option value="abertas">Por fazer</option><option value="pendente">Pendentes</option><option value="em_curso">Em curso</option><option value="concluida">Concluídas</option><option value="todas">Todas</option></select>
            <select value={f.prazo} onChange={set('prazo')} style={{ ...c.input, cursor: 'pointer' }} aria-label="Prazo"><option value="todos">Qualquer prazo</option><option value="hoje">Hoje</option><option value="7dias">Próximos 7 dias</option><option value="mes">Este mês</option><option value="atraso">Em atraso</option></select>
          </div>
          <Cartao semPadding><TabelaTarefas tarefas={lista} vazio="Nenhuma tarefa com estes filtros." /></Cartao>
          {f.prazo === '7dias' && obrigProx.length > 0 && (
            <Cartao titulo="Obrigações com prazo nos próximos 7 dias" icone={<Ic.agenda />} estilo={{ marginTop: '16px' }}>
              {obrigProx.sort((a, b) => a.prazo.localeCompare(b.prazo)).map(o => (
                <div key={o.id} onClick={() => navigate(`/gestao/clientes/${o.clienteId}/obrigacoes`)} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '9px 0', borderTop: `1px solid ${t.rowBorder}`, cursor: 'pointer', flexWrap: 'wrap' }}>
                  <span style={{ width: '90px', fontWeight: 700, color: t.heading, fontSize: '12.5px' }}>{fmtData(o.prazo)}</span>
                  <span style={{ flex: 1, fontSize: '13px' }}><strong>{clientePorId(s, o.clienteId)?.nome}</strong> · {o.nome} ({o.periodo})</span>
                  <Chip tom={estadoEfetivo(o) === 'em_atraso' ? 'erro' : 'aviso'}>{o.estado === 'aguardar_docs' ? 'A aguardar documentos' : o.estado === 'em_preparacao' ? 'Em preparação' : 'Por preparar'}</Chip>
                </div>
              ))}
            </Cartao>
          )}
        </>
      )}
      {nova && <FormTarefa aoFechar={() => setNova(false)} />}
    </div>
  )
}
