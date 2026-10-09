import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { usePortal, acoes } from '../dados'
import { Titulo, Botao, Cartao, Campo, Kpi, Vazio, Ic, useCampos, usePerfil } from '../ui'
import { ATIVIDADES, MESES_LONGOS, hojeIso, somaDias, dataDe, fmtData } from '../regras'

// Horas da equipa (pedido da Letícia, 09/10): quanto tempo foi dedicado a cada
// cliente e a cada atividade (marketing, interno…). Regista-se só a quantidade
// de horas do dia — sem horário de entrada e saída. Em cima, os totais de hoje,
// da semana e do mês; em baixo, o mês por cliente/atividade e os registos.

const fmtH = (n) => `${(Math.round(n * 100) / 100).toLocaleString('pt-PT', { maximumFractionDigits: 2 })} h`
const soma = (lista) => lista.reduce((t, h) => t + Number(h.horas || 0), 0)
// A semana começa à segunda-feira.
const inicioSemana = (hoje) => somaDias(hoje, -((dataDe(hoje).getDay() + 6) % 7))
const OUTRA = '__outra'

export default function Horas() {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const s = usePortal()
  const c = useCampos()
  const { papel } = usePerfil()
  const hoje = hojeIso()

  const vazio = { data: hoje, pessoa: s.eu, destino: '', outra: '', horas: '', descricao: '' }
  const [novo, setNovo] = useState(vazio)
  const [aviso, setAviso] = useState('')
  const [quem, setQuem] = useState(s.eu)            // '' = toda a equipa
  const [mes, setMes] = useState(hoje.slice(0, 7))  // AAAA-MM
  const set = (k) => (e) => setNovo(p => ({ ...p, [k]: e.target.value }))

  const nomeCliente = Object.fromEntries(s.clientes.map(x => [x.id, x.nome]))
  const destinoDe = (h) => (h.clienteId ? (nomeCliente[h.clienteId] || 'Cliente removido') : (h.atividade || '—'))
  const atividadesUsadas = [...new Set(s.horas.filter(h => !h.clienteId && h.atividade && !ATIVIDADES.includes(h.atividade)).map(h => h.atividade))]

  function registar() {
    const horas = Number(String(novo.horas).replace(',', '.'))
    const atividade = novo.destino === OUTRA ? novo.outra.trim() : novo.destino.startsWith('a:') ? novo.destino.slice(2) : ''
    const clienteId = novo.destino.startsWith('c:') ? novo.destino.slice(2) : null
    if (!clienteId && !atividade) { setAviso('Escolha o cliente ou a atividade.'); return }
    if (!(horas > 0) || horas > 24) { setAviso('Indique as horas (entre 0,25 e 24).'); return }
    acoes.registarHoras({ data: novo.data || hoje, pessoa: novo.pessoa || s.eu, clienteId, atividade, horas, descricao: novo.descricao.trim() || null })
    setAviso('')
    // Fica a data, a pessoa e o destino: é comum registar várias linhas seguidas.
    setNovo(p => ({ ...p, horas: '', descricao: '' }))
  }

  // ── Totais ──
  const minhas = s.horas.filter(h => !quem || h.pessoa === quem)
  const semana0 = inicioSemana(hoje)
  const totHoje = soma(minhas.filter(h => h.data === hoje))
  const totSemana = soma(minhas.filter(h => h.data >= semana0 && h.data <= somaDias(semana0, 6)))
  const totMesAtual = soma(minhas.filter(h => h.data.startsWith(hoje.slice(0, 7))))

  const doMes = minhas.filter(h => h.data.startsWith(mes)).sort((a, b) => b.data.localeCompare(a.data) || (a.pessoa || '').localeCompare(b.pessoa || ''))
  const totMes = soma(doMes)
  const porDestino = Object.values(doMes.reduce((acc, h) => {
    const k = h.clienteId ? `c:${h.clienteId}` : `a:${h.atividade}`
    acc[k] = acc[k] || { k, nome: destinoDe(h), cliente: !!h.clienteId, clienteId: h.clienteId, horas: 0 }
    acc[k].horas += Number(h.horas)
    return acc
  }, {})).sort((a, b) => b.horas - a.horas)

  // Meses com registos + os últimos 6, para o seletor.
  const meses = [...new Set([...s.horas.map(h => h.data.slice(0, 7)), ...Array.from({ length: 6 }, (_, i) => {
    const d = dataDe(`${hoje.slice(0, 7)}-01`); d.setMonth(d.getMonth() - i); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })])].sort().reverse()
  const nomeMes = (k) => `${MESES_LONGOS[Number(k.slice(5, 7)) - 1]} ${k.slice(0, 4)}`
  const quemTxt = quem ? (quem === s.eu ? 'As minhas horas' : `Horas de ${quem}`) : 'Toda a equipa'
  const podeApagar = (h) => papel === 'admin' || h.pessoa === s.eu

  const sel = { ...c.input, cursor: 'pointer' }

  return (
    <div>
      <Titulo eyebrow="Gestão" titulo="Horas"
        sub="Quanto tempo foi dedicado a cada cliente e a cada atividade. Regista-se só a quantidade de horas do dia, sem horários." />

      {/* ── Registar ── */}
      <Cartao titulo="Registar horas" icone={<Ic.agenda />} estilo={{ marginBottom: '16px' }}>
        {/* Quebra em linhas conforme a largura: nunca empurra o botão para fora do cartão. */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 140px' }}><Campo rotulo="Dia"><input type="date" value={novo.data} max={hoje} onChange={set('data')} style={c.input} /></Campo></div>
          <div style={{ flex: '1 1 160px' }}><Campo rotulo="Quem">
            <select value={novo.pessoa} onChange={set('pessoa')} style={sel}>
              {[...new Set([s.eu, ...s.equipa])].filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Campo></div>
          <div style={{ flex: '2 1 240px' }}><Campo rotulo="Cliente ou atividade">
            <select value={novo.destino} onChange={set('destino')} style={sel}>
              <option value="">— Escolher —</option>
              <optgroup label="Clientes">
                {s.clientes.filter(x => x.estado !== 'inativo').map(x => <option key={x.id} value={`c:${x.id}`}>{x.nome}</option>)}
              </optgroup>
              <optgroup label="Atividades">
                {[...ATIVIDADES, ...atividadesUsadas].map(a => <option key={a} value={`a:${a}`}>{a}</option>)}
                <option value={OUTRA}>Outra atividade…</option>
              </optgroup>
            </select>
          </Campo></div>
          {novo.destino === OUTRA && (
            <div style={{ flex: '2 1 220px' }}><Campo rotulo="Nome da atividade"><input value={novo.outra} onChange={set('outra')} placeholder="ex.: Marketing · Newsletter" style={c.input} autoFocus /></Campo></div>
          )}
          <div style={{ flex: '0 1 110px' }}><Campo rotulo="Horas"><input type="number" inputMode="decimal" min="0.25" max="24" step="0.25" placeholder="ex.: 1,5" value={novo.horas} onChange={set('horas')} onKeyDown={e => { if (e.key === 'Enter') registar() }} style={c.input} /></Campo></div>
          <div style={{ flex: '2 1 200px' }}><Campo rotulo="O que foi feito (opcional)"><input value={novo.descricao} onChange={set('descricao')} onKeyDown={e => { if (e.key === 'Enter') registar() }} placeholder="ex.: fecho do trimestre" style={c.input} /></Campo></div>
          <Botao variante="primario" onClick={registar}><Ic.mais size={15} />Registar</Botao>
        </div>
        {aviso && <div role="alert" style={{ marginTop: '10px', fontSize: '12.5px', fontWeight: 700, color: t.dueLate.ink }}>{aviso}</div>}
      </Cartao>

      {/* ── Totais ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <span style={{ fontSize: '12.5px', fontWeight: 700, color: t.textMuted }}>Ver:</span>
        <select value={quem} onChange={e => setQuem(e.target.value)} style={{ ...sel, width: 'auto' }} aria-label="Pessoa">
          <option value={s.eu}>As minhas horas</option>
          {s.equipa.filter(p => p !== s.eu).map(p => <option key={p} value={p}>{p}</option>)}
          <option value="">Toda a equipa</option>
        </select>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: '14px', marginBottom: '16px' }}>
        <Kpi icone={<Ic.agenda size={22} />} rotulo="Hoje" valor={fmtH(totHoje)} sub={fmtData(hoje)} />
        <Kpi icone={<Ic.agenda size={22} />} rotulo="Esta semana" valor={fmtH(totSemana)} sub={`${fmtData(semana0)} – ${fmtData(somaDias(semana0, 6))}`} />
        <Kpi icone={<Ic.agenda size={22} />} rotulo="Este mês" valor={fmtH(totMesAtual)} sub={nomeMes(hoje.slice(0, 7))} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1.25fr)', gap: '16px', alignItems: 'start' }}>
        {/* ── Por cliente / atividade ── */}
        <Cartao titulo={`Por cliente e atividade · ${quemTxt.toLowerCase()}`} icone={<Ic.clientes />}
          acao={<select value={mes} onChange={e => setMes(e.target.value)} style={{ ...sel, width: 'auto', padding: '6px 10px' }} aria-label="Mês">
            {meses.map(m => <option key={m} value={m}>{nomeMes(m)}</option>)}
          </select>}>
          {porDestino.length === 0 ? <Vazio>Sem horas registadas em {nomeMes(mes)}.</Vazio> : (
            <div>
              {porDestino.map(d => {
                const cli = d.cliente ? s.clientes.find(x => x.id === d.clienteId) : null
                const incl = cli && !quem ? Number(cli.horasIncluidas || 0) : 0
                const acima = incl > 0 && d.horas > incl
                return (
                  <div key={d.k} style={{ padding: '9px 0', borderBottom: `1px solid ${t.rowBorder}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '13.5px' }}>
                      <span style={{ fontWeight: 700, color: t.heading, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.nome}{!d.cliente && <span style={{ fontWeight: 500, color: t.subtle }}> · atividade</span>}
                      </span>
                      <strong style={{ color: acima ? t.dueLate.ink : t.heading, whiteSpace: 'nowrap' }}>{fmtH(d.horas)}{incl > 0 && <span style={{ fontWeight: 500, color: t.subtle }}> de {fmtH(incl)}</span>}</strong>
                    </div>
                    <div style={{ height: '6px', borderRadius: '6px', background: t.trackBg, marginTop: '6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.max(3, (d.horas / totMes) * 100)}%`, background: d.cliente ? t.bar1 : t.accent, borderRadius: '6px' }} />
                    </div>
                  </div>
                )
              })}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', fontSize: '13.5px', fontWeight: 800, color: t.heading }}>
                <span>Total de {nomeMes(mes)}</span><span>{fmtH(totMes)}</span>
              </div>
              {!quem && <div style={{ fontSize: '11.5px', color: t.subtle, marginTop: '6px' }}>"de X h" = horas incluídas por mês na ficha do cliente.</div>}
            </div>
          )}
        </Cartao>

        {/* ── Registos ── */}
        <Cartao titulo={`Registos de ${nomeMes(mes)}`} icone={<Ic.lista />} semPadding>
          {doMes.length === 0 ? <Vazio>Nada registado neste mês.</Vazio> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
                <thead><tr>{['Dia', 'Quem', 'Cliente ou atividade', 'Horas', ''].map(h => <th key={h} style={c.th}>{h}</th>)}</tr></thead>
                <tbody>{doMes.map(h => (
                  <tr key={h.id}>
                    <td style={{ ...c.td, whiteSpace: 'nowrap' }}>{fmtData(h.data)}</td>
                    <td style={c.td}>{h.pessoa || '—'}</td>
                    <td style={c.td}><div style={{ fontWeight: 600, color: t.heading }}>{destinoDe(h)}</div>{h.descricao && <div style={{ fontSize: '11.5px', color: t.subtle }}>{h.descricao}</div>}</td>
                    <td style={{ ...c.td, whiteSpace: 'nowrap', fontWeight: 700 }}>{fmtH(h.horas)}</td>
                    <td style={{ ...c.td, textAlign: 'right' }}>
                      {podeApagar(h) && <button onClick={() => { if (window.confirm('Apagar este registo de horas?')) acoes.apagarHoras(h.id) }} aria-label="Apagar registo"
                        style={{ background: 'none', border: 'none', color: t.subtle, cursor: 'pointer', fontSize: '14px', padding: '6px' }}>✕</button>}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </Cartao>
      </div>
    </div>
  )
}
