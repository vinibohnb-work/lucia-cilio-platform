import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useV2, acoes } from '../dados'
import { Janela, Campo, Botao, Chip, useCampos, Vazio } from '../ui'
import { RECORRENCIAS, ESTADOS_TAREFA, FECHADOS, fmtData, hojeIso, diasAte, PAISES } from '../regras'
import { tarefaAtrasada, lembreteAtivo, clientePorId } from '../seletores'

// Tarefas internas (documento, secção 4): criadas à mão, repetidas, ligadas a
// um cliente e a uma obrigação, atribuídas a alguém, fechadas com um check.

export function FormTarefa({ inicial, aoFechar }) {
  const s = useV2()
  const c = useCampos()
  const isMobile = useIsMobile()
  const [f, setF] = useState({ titulo: '', clienteId: '', obrigacaoId: '', responsavel: s.equipa[0], prazo: hojeIso(), recorrencia: 'nenhuma', lembreteDias: 2, notas: '', ...inicial })
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }))
  const obrigs = s.obrigacoes.filter(o => o.clienteId === f.clienteId && (!FECHADOS.includes(o.estado) || o.id === f.obrigacaoId)).sort((a, b) => a.prazo.localeCompare(b.prazo))

  function guardar() {
    if (!f.titulo.trim()) return
    const dados = { ...f, titulo: f.titulo.trim(), clienteId: f.clienteId || null, obrigacaoId: f.obrigacaoId || null, lembreteDias: Number(f.lembreteDias) || 0 }
    if (f.id) acoes.atualizarTarefa(f.id, dados); else acoes.criarTarefa(dados)
    aoFechar()
  }

  return (
    <Janela titulo={f.id ? 'Editar tarefa' : 'Adicionar tarefa'} aoFechar={aoFechar}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
        <Campo rotulo="Tarefa" largura="1 / -1"><input autoFocus value={f.titulo} onChange={set('titulo')} placeholder="Ex.: Entregar a declaração de IVA até dia 20" style={c.input} /></Campo>
        <Campo rotulo="Cliente">
          <select value={f.clienteId || ''} onChange={e => setF(p => ({ ...p, clienteId: e.target.value, obrigacaoId: '' }))} style={{ ...c.input, cursor: 'pointer' }}>
            <option value="">— Sem cliente (interna) —</option>
            {s.clientes.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}
          </select></Campo>
        <Campo rotulo="Obrigação associada">
          <select value={f.obrigacaoId || ''} onChange={set('obrigacaoId')} disabled={!f.clienteId} style={{ ...c.input, cursor: 'pointer' }}>
            <option value="">— Nenhuma —</option>
            {obrigs.map(o => <option key={o.id} value={o.id}>{o.nome} · {o.periodo} · {fmtData(o.prazo)}</option>)}
          </select></Campo>
        <Campo rotulo="Responsável">
          <select value={f.responsavel} onChange={set('responsavel')} style={{ ...c.input, cursor: 'pointer' }}>
            {s.equipa.map(x => <option key={x}>{x}</option>)}
          </select></Campo>
        <Campo rotulo="Prazo"><input type="date" value={f.prazo} onChange={set('prazo')} style={c.input} /></Campo>
        <Campo rotulo="Repetir">
          <select value={f.recorrencia} onChange={set('recorrencia')} style={{ ...c.input, cursor: 'pointer' }}>
            {RECORRENCIAS.map(([k, r]) => <option key={k} value={k}>{r}</option>)}
          </select></Campo>
        <Campo rotulo="Lembrete automático">
          <select value={f.lembreteDias} onChange={set('lembreteDias')} style={{ ...c.input, cursor: 'pointer' }}>
            {[0, 1, 2, 3, 5, 7, 14].map(n => <option key={n} value={n}>{n === 0 ? 'No próprio dia' : `${n} dia${n > 1 ? 's' : ''} antes`}</option>)}
          </select></Campo>
        <Campo rotulo="Notas" largura="1 / -1"><textarea value={f.notas} onChange={set('notas')} rows={2} style={{ ...c.input, resize: 'vertical' }} /></Campo>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
        <Botao variante="primario" onClick={guardar} disabled={!f.titulo.trim()}>Guardar tarefa</Botao>
        <Botao onClick={aoFechar}>Cancelar</Botao>
        {f.id && <Botao variante="perigo" estilo={{ marginLeft: 'auto' }} onClick={() => { if (window.confirm('Eliminar esta tarefa?')) { acoes.removerTarefa(f.id); aoFechar() } }}>Eliminar</Botao>}
      </div>
    </Janela>
  )
}

export function TabelaTarefas({ tarefas, mostrarCliente = true, vazio = 'Não há tarefas.' }) {
  const { t } = useTheme()
  const s = useV2()
  const c = useCampos()
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const [editar, setEditar] = useState(null)
  const hoje = hojeIso()

  if (!tarefas.length) return <Vazio>{vazio}</Vazio>
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? '640px' : 0 }}>
        <thead><tr>
          {['', 'Tarefa', ...(mostrarCliente ? ['Cliente'] : []), 'Responsável', 'Prazo', 'Estado', ''].map((h, i) => <th key={i} style={c.th}>{h}</th>)}
        </tr></thead>
        <tbody>
          {tarefas.map(x => {
            const cli = x.clienteId ? clientePorId(s, x.clienteId) : null
            const obr = x.obrigacaoId ? s.obrigacoes.find(o => o.id === x.obrigacaoId) : null
            const atraso = tarefaAtrasada(x, hoje)
            const d = diasAte(x.prazo, hoje)
            const feita = x.estado === 'concluida'
            return (
              <tr key={x.id} style={{ opacity: feita ? 0.55 : 1 }}>
                <td style={{ ...c.td, width: '34px' }}>
                  <input type="checkbox" checked={feita} onChange={() => acoes.alternarTarefa(x.id)} aria-label="Concluída"
                    style={{ width: '18px', height: '18px', accentColor: '#1f6b45', cursor: 'pointer' }} />
                </td>
                <td style={c.td}>
                  <div style={{ fontWeight: 700, color: t.heading, textDecoration: feita ? 'line-through' : 'none' }}>{x.titulo}</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '11.5px', color: t.subtle, marginTop: '2px' }}>
                    {obr && <span>↳ {obr.nome} · {obr.periodo}</span>}
                    {x.recorrencia !== 'nenhuma' && <span title="Repete-se">↻ {x.recorrencia}</span>}
                    {lembreteAtivo(x, hoje) && !atraso && <span style={{ color: t.accentText, fontWeight: 700 }}>🔔 lembrete</span>}
                  </div>
                </td>
                {mostrarCliente && (
                  <td style={c.td}>
                    {cli ? <button onClick={() => navigate(`/v2/clientes/${cli.id}`)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: t.heading, fontWeight: 600, fontSize: '13px', fontFamily: 'inherit', textAlign: 'left' }}>{cli.nome}<div style={{ fontSize: '11px', color: t.subtle, fontWeight: 500 }}>{PAISES[cli.pais]}</div></button> : <span style={{ color: t.subtle }}>Interna</span>}
                  </td>
                )}
                <td style={{ ...c.td, fontSize: '12.5px' }}>{x.responsavel}</td>
                <td style={{ ...c.td, whiteSpace: 'nowrap' }}>
                  <div style={{ fontWeight: 700, color: atraso ? t.neg : d === 0 && !feita ? t.accentText : t.heading, fontSize: '12.5px' }}>{fmtData(x.prazo)}</div>
                  {!feita && <div style={{ fontSize: '11px', color: atraso ? t.neg : t.subtle }}>{atraso ? `${-d} dia${d < -1 ? 's' : ''} em atraso` : d === 0 ? 'hoje' : `daqui a ${d} dia${d > 1 ? 's' : ''}`}</div>}
                </td>
                <td style={c.td}>
                  {atraso ? <Chip tom="erro">Em atraso</Chip> : feita ? <Chip tom="ok">Concluída</Chip> : (
                    <select value={x.estado} onChange={e => acoes.atualizarTarefa(x.id, { estado: e.target.value })}
                      style={{ border: 'none', borderRadius: '20px', padding: '3px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: x.estado === 'em_curso' ? t.dueSoon.bg : t.segBg, color: x.estado === 'em_curso' ? t.dueSoon.ink : t.textMuted }}>
                      {['pendente', 'em_curso'].map(k => <option key={k} value={k}>{ESTADOS_TAREFA[k].rotulo}</option>)}
                    </select>
                  )}
                </td>
                <td style={{ ...c.td, textAlign: 'right' }}><button onClick={() => setEditar(x)} style={{ background: 'none', border: 'none', color: t.accentText, fontWeight: 700, cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>Editar</button></td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {editar && <FormTarefa inicial={editar} aoFechar={() => setEditar(null)} />}
    </div>
  )
}
