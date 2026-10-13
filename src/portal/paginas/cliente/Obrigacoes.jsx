import { useState, Fragment } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import { useIsMobile } from '../../../hooks/useIsMobile'
import { usePortal, acoes, abrirFicheiro } from '../../dados'
import { Chip, Botao, Pilulas, useCampos, Vazio, Janela, Campo, Area, Ic } from '../../ui'
import InfoTooltip from '../../../components/InfoTooltip'
import { ESTADOS_OBRIG, CHECKLIST, estadoEfetivo, FECHADOS, fmtData, hojeIso, diasAte } from '../../regras'
import { obrigacoesDe } from '../../seletores'
import { FormTarefa } from '../../partes/Tarefas'
import { CompositorWhatsApp } from '../../partes/Comunicacao'

// Obrigações fiscais (documento, secção 3): calendário personalizado por
// cliente, os oito estados, valor/crédito/reembolso, comprovativo e a
// checklist de nove passos (secção 5).
// Simplificado a 12/10 (13-D): sem o cartão dos critérios (repetia os Dados do
// cliente), sem o "processo" em setas (repetia a checklist e o estado), sem o
// contador e com o período por baixo do nome.

export default function Obrigacoes({ cliente, modoCliente }) {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  // Até 1200 px a tabela junta colunas (período sob o nome; valor e comprovativo
  // na mesma célula) para caber sem deslizar para o lado.
  const compacto = useIsMobile(1200)
  const s = usePortal()
  const c = useCampos()
  const hoje = hojeIso()
  const anoAtual = Number(hoje.slice(0, 4))
  const todas = obrigacoesDe(s, cliente.id)
  const anosExistentes = [...new Set(todas.map(o => Number(o.periodo.match(/\d{4}/)?.[0])).filter(Boolean))]
  const anos = [...new Set([...anosExistentes, anoAtual, anoAtual + 1])].sort((a, b) => b - a)
  const [ano, setAno] = useState(anoAtual)
  const [filtro, setFiltro] = useState(modoCliente ? 'todas' : 'abertas')
  const [aberta, setAberta] = useState(null)

  const valorDe = (o) => (
    <div style={{ display: 'flex', gap: '5px' }}>
      <select value={o.valor?.tipo || ''} onChange={ev => acoes.atualizarObrigacao(o.id, { valor: ev.target.value ? { tipo: ev.target.value, montante: o.valor?.montante ?? '' } : null })}
        style={{ ...c.input, width: '96px', padding: '5px 6px', fontSize: '12px', cursor: 'pointer' }} aria-label="Tipo de valor">
        <option value="">Sem valor</option><option value="pagar">A pagar</option><option value="credito">Crédito</option><option value="reembolso">Reembolso</option>
      </select>
      {o.valor?.tipo && <input key={`${o.id}-montante`} type="number" step="0.01" defaultValue={o.valor.montante ?? ''} onBlur={ev => { if (ev.target.value !== String(o.valor.montante ?? '')) acoes.atualizarObrigacao(o.id, { valor: { ...o.valor, montante: ev.target.value } }) }} placeholder="€" style={{ ...c.input, width: '82px', padding: '5px 7px', fontSize: '12px' }} />}
    </div>
  )
  const comprovativoDe = (o) => (
    o.comprovativo ? (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: t.accentText }} title={`Arquivado a ${fmtData(o.comprovativo.data)}`}>
        <button onClick={() => abrirFicheiro(o.comprovativo.caminho)} disabled={!o.comprovativo.caminho} style={{ background: 'none', border: 'none', padding: 0, cursor: o.comprovativo.caminho ? 'pointer' : 'default', color: 'inherit', fontWeight: 600, fontSize: '12px', fontFamily: 'inherit' }}>📎 {o.comprovativo.nome}</button>
        {!modoCliente && <button onClick={() => acoes.atualizarObrigacao(o.id, { comprovativo: null, checklist: { ...o.checklist, comprov_arquivado: false } })} aria-label="Remover comprovativo" style={{ background: 'none', border: 'none', color: t.subtle, cursor: 'pointer', padding: 0 }}>✕</button>}
      </span>
    ) : modoCliente ? <span style={{ color: t.subtle }}>—</span> : (
      <label style={{ fontSize: '12px', fontWeight: 700, color: t.textMuted, cursor: 'pointer', border: `1px dashed ${t.inputBorder}`, borderRadius: '8px', padding: '5px 9px', whiteSpace: 'nowrap' }}>
        Anexar
        <input type="file" style={{ display: 'none' }} onChange={ev => {
          const fx = ev.target.files?.[0]; ev.target.value = ''
          if (fx) acoes.anexarComprovativo(o.id, fx)
        }} />
      </label>
    )
  )
  const [manual, setManual] = useState(null)
  const [tarefa, setTarefa] = useState(null)
  const [whats, setWhats] = useState(null)
  const [aviso, setAviso] = useState('')

  const doAno = todas.filter(o => o.periodo.includes(String(ano)))
  const lista = doAno.filter(o => {
    const e = estadoEfetivo(o, hoje)
    if (filtro === 'abertas') return !FECHADOS.includes(o.estado)
    if (filtro === 'atraso') return e === 'em_atraso'
    if (filtro === 'entregues') return ['entregue', 'pago'].includes(o.estado)
    return true
  })

  function gerar() {
    const n = acoes.gerarAno(cliente.id, ano)
    setAviso(n ? `${n} obrigação(ões) de ${ano} acrescentada(s) ao calendário.` : `O calendário de ${ano} já está completo — nada a acrescentar.`)
    setTimeout(() => setAviso(''), 4000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={ano} onChange={e => setAno(Number(e.target.value))} style={{ ...c.input, width: 'auto', cursor: 'pointer', fontWeight: 700 }} aria-label="Ano fiscal">
          {anos.map(a => <option key={a} value={a}>Ano fiscal {a}</option>)}
        </select>
        <Pilulas valor={filtro} aoMudar={setFiltro} opcoes={[['abertas', 'Em aberto'], ['atraso', 'Em atraso'], ['entregues', 'Entregues'], ['todas', 'Todas']]} />
        {!modoCliente && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginLeft: 'auto' }}>
            <InfoTooltip largura={300} text="O calendário é gerado a partir do perfil fiscal do cliente (país, forma jurídica, regime, periodicidade, trabalhadores e serviços — em Dados do cliente), com os prazos habituais, a confirmar. Cada obrigação pode ser ajustada: mudar a data, marcar como não aplicável ou acrescentar à mão. Gerar outra vez nunca duplica." />
            <Botao onClick={() => setManual({ nome: '', periodo: String(ano), prazo: hoje, tipo: '', montante: '' })}><Ic.mais size={15} />Obrigação</Botao>
            <Botao variante="primario" onClick={gerar}>Gerar calendário {ano}</Botao>
          </div>
        )}
      </div>
      {aviso && <div style={{ marginTop: '-6px', fontSize: '12.5px', fontWeight: 700, color: t.dueOk.ink }}>{aviso}</div>}

      <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px', overflowX: 'auto' }}>
        {lista.length === 0 ? <Vazio>{doAno.length ? 'Nenhuma obrigação com este filtro.' : `Ainda não há calendário para ${ano}.`}</Vazio> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? '720px' : 0 }}>
            <thead><tr>{(compacto
              ? ['Obrigação', 'Data-limite', 'Estado', modoCliente ? 'Comprovativo' : 'Valor · comprovativo']
              : ['Obrigação', 'Data-limite', 'Estado', ...(modoCliente ? [] : ['Valor']), 'Comprovativo']).map((h, i) => <th key={i} style={c.th}>{h}</th>)}</tr></thead>
            <tbody>
              {lista.map(o => {
                const e = estadoEfetivo(o, hoje)
                const d = diasAte(o.prazo, hoje)
                const aberto = aberta === o.id
                const feitos = CHECKLIST.filter(([k]) => o.checklist?.[k]).length
                return (
                  <Fragment key={o.id}>
                    <tr style={{ background: aberto ? t.softCardBg : 'transparent' }}>
                      <td style={c.td}>
                        <div style={{ fontWeight: 700, color: t.heading }}>{o.nome}</div>
                        <div style={{ fontSize: '11.5px', color: t.subtle }}>{o.periodo}</div>
                        {!modoCliente && (
                          <button onClick={() => setAberta(aberto ? null : o.id)} style={{ background: 'none', border: 'none', padding: 0, marginTop: '2px', color: t.accentText, fontWeight: 700, cursor: 'pointer', fontSize: '11.5px', fontFamily: 'inherit' }}>
                            Checklist {feitos}/{CHECKLIST.length} · {aberto ? 'fechar ▴' : 'detalhe ▾'}
                          </button>
                        )}
                      </td>
                      <td style={{ ...c.td, whiteSpace: 'nowrap' }}>
                        {modoCliente ? fmtData(o.prazo) : <input type="date" value={o.prazo} onChange={ev => acoes.atualizarObrigacao(o.id, { prazo: ev.target.value })} style={{ ...c.input, width: compacto ? '122px' : '132px', padding: '6px 7px' }} />}
                        {!FECHADOS.includes(o.estado) && <div style={{ fontSize: '11px', color: e === 'em_atraso' ? t.neg : d <= 7 ? t.accentText : t.subtle, marginTop: '2px' }}>{d < 0 ? `${-d} dias em atraso` : d === 0 ? 'hoje' : `faltam ${d} dias`}</div>}
                      </td>
                      <td style={c.td}>
                        {modoCliente ? <Chip tom={ESTADOS_OBRIG[e].tom}>{ESTADOS_OBRIG[e].rotulo}</Chip> : (
                          <div>
                            <select value={o.estado} onChange={ev => acoes.atualizarObrigacao(o.id, { estado: ev.target.value })}
                              style={{ ...c.input, width: 'auto', maxWidth: compacto ? '150px' : '168px', padding: '5px 8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                              {Object.entries(ESTADOS_OBRIG).map(([k, v]) => <option key={k} value={k}>{v.rotulo}</option>)}
                            </select>
                            {e === 'em_atraso' && o.estado !== 'em_atraso' && <div style={{ marginTop: '4px' }}><Chip tom="erro">Em atraso</Chip></div>}
                          </div>
                        )}
                      </td>
                      {/* O cliente não vê valores: o portal é informativo (25/09) */}
                      {compacto ? (
                        <td style={c.td}>
                          {!modoCliente && valorDe(o)}
                          <div style={{ marginTop: modoCliente ? 0 : '7px' }}>{comprovativoDe(o)}</div>
                        </td>
                      ) : (
                        <>
                          {!modoCliente && <td style={{ ...c.td, whiteSpace: 'nowrap' }}>{valorDe(o)}</td>}
                          <td style={c.td}>{comprovativoDe(o)}</td>
                        </>
                      )}
                    </tr>
                    {aberto && (
                      <tr><td colSpan={compacto ? 4 : modoCliente ? 4 : 5} style={{ padding: '4px 16px 18px', background: t.softCardBg }}>
                        <Detalhe o={o} aoTarefa={() => setTarefa({ clienteId: cliente.id, obrigacaoId: o.id, titulo: `Entregar ${o.nome} (${o.periodo})`, prazo: o.prazo < hoje ? hoje : o.prazo, responsavel: cliente.responsavel })} aoWhats={() => setWhats(o.id)} />
                      </td></tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {manual && (
        <Janela titulo="Nova obrigação" aoFechar={() => setManual(null)} largura={480}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Campo rotulo="Nome da obrigação" largura="1 / -1"><input autoFocus value={manual.nome} onChange={e => setManual(p => ({ ...p, nome: e.target.value }))} style={c.input} placeholder="Ex.: Declaração Modelo 10" /></Campo>
            <Campo rotulo="Período"><input value={manual.periodo} onChange={e => setManual(p => ({ ...p, periodo: e.target.value }))} style={c.input} placeholder="T3 2026, 09/2026, 2026" /></Campo>
            <Campo rotulo="Data-limite"><input type="date" value={manual.prazo} onChange={e => setManual(p => ({ ...p, prazo: e.target.value }))} style={c.input} /></Campo>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <Botao variante="primario" disabled={!manual.nome.trim()} onClick={() => { acoes.criarObrigacao({ clienteId: cliente.id, nome: manual.nome.trim(), periodo: manual.periodo, prazo: manual.prazo }); setManual(null) }}>Acrescentar</Botao>
            <Botao onClick={() => setManual(null)}>Cancelar</Botao>
          </div>
        </Janela>
      )}
      {tarefa && <FormTarefa inicial={tarefa} aoFechar={() => setTarefa(null)} />}
      {whats && (
        <Janela titulo="Comunicar ao cliente" aoFechar={() => setWhats(null)}>
          <CompositorWhatsApp clienteId={cliente.id} obrigacaoId={whats} aoEnviar={() => setWhats(null)} />
        </Janela>
      )}
    </div>
  )
}

function Detalhe({ o, aoTarefa, aoWhats }) {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const s = usePortal()
  const tarefas = s.tarefas.filter(x => x.obrigacaoId === o.id)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.3fr', gap: '18px', paddingTop: '10px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <strong style={{ fontSize: '13px', color: t.heading, flex: 1 }}>Checklist</strong><Area interna />
        </div>
        {CHECKLIST.map(([k, rot]) => (
          <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0', fontSize: '13px', cursor: 'pointer', color: o.checklist?.[k] ? t.textMuted : t.heading }}>
            <input type="checkbox" checked={!!o.checklist?.[k]} onChange={() => acoes.alternarChecklist(o.id, k)} style={{ width: '17px', height: '17px', accentColor: t.btnBg, cursor: 'pointer' }} />{rot}
          </label>
        ))}
      </div>
      <div>
        {tarefas.length > 0 && (
          <div style={{ fontSize: '12.5px', color: t.text, marginBottom: '12px' }}>
            <strong style={{ color: t.heading }}>Tarefas ligadas:</strong>{' '}
            {tarefas.map(x => <span key={x.id} style={{ marginRight: '10px' }}>{x.estado === 'concluida' ? '✓' : '○'} {x.titulo} ({x.responsavel.split(' ')[0]}, {fmtData(x.prazo)})</span>)}
          </div>
        )}
        <textarea key={`${o.id}-notas`} defaultValue={o.notas || ''} onBlur={e => { if (e.target.value !== (o.notas || '')) acoes.atualizarObrigacao(o.id, { notas: e.target.value }) }} rows={2} placeholder="Notas internas sobre esta obrigação…"
          style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '12.5px', fontFamily: 'inherit', resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
          <Botao onClick={aoTarefa}><Ic.lista size={15} />Criar tarefa interna</Botao>
          <Botao variante="whats" onClick={aoWhats}><Ic.whats size={15} />Comunicar por WhatsApp</Botao>
          {o.codigo.startsWith('MANUAL') && <Botao variante="perigo" onClick={() => { if (window.confirm('Eliminar esta obrigação?')) acoes.removerObrigacao(o.id) }}>Eliminar</Botao>}
        </div>
      </div>
    </div>
  )
}
