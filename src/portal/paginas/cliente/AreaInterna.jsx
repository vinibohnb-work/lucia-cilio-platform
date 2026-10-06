import { useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import { useIsMobile } from '../../../hooks/useIsMobile'
import { usePortal, acoes } from '../../dados'
import { Cartao, Chip, Botao, Pilulas, useCampos, Vazio, usePerfil, pode, Ic } from '../../ui'
import { isDueInPeriod } from '../../../pages/gestao/Financeiro'
import { TIPOS_NOTA, ESCLARECER_COM, fmtData, fmtEur, hojeIso, somaMeses, somaDias, rotuloServico, MESES_LONGOS } from '../../regras'

// Área interna (documento, secção 9) — nunca visível ao cliente: notas,
// dúvidas e assuntos pendentes, histórico de contactos, assuntos a esclarecer
// com contabilista, Steuerberater ou advogado, serviços, avença, pagamentos,
// horas utilizadas e responsável.

export default function AreaInterna({ cliente }) {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const s = usePortal()
  const c = useCampos()
  const { papel } = usePerfil()
  const hoje = hojeIso()
  const [filtro, setFiltro] = useState('todas')
  const [nova, setNova] = useState({ tipo: 'nota', texto: '', com: ESCLARECER_COM[cliente.pais === 'DE' ? 1 : 0] })
  const [horas, setHoras] = useState({ horas: '', descricao: '' })   // vazio: um "+" sem nada escrito não regista "1 h" (teste de 05/10)

  const notas = s.notas.filter(n => n.clienteId === cliente.id).sort((a, b) => b.data.localeCompare(a.data))
  const visiveis = notas.filter(n => filtro === 'todas' || (filtro === 'pendentes' ? ['duvida', 'esclarecer'].includes(n.tipo) && !n.resolvido : n.tipo === filtro))
  const pendentes = notas.filter(n => ['duvida', 'esclarecer'].includes(n.tipo) && !n.resolvido).length

  const mesAtual = hoje.slice(0, 7)
  const hs = s.horas.filter(h => h.clienteId === cliente.id).sort((a, b) => b.data.localeCompare(a.data))
  const noMes = hs.filter(h => h.data.startsWith(mesAtual)).reduce((x, h) => x + Number(h.horas), 0)
  const ult30 = hs.filter(h => h.data > somaDias(hoje, -30)).reduce((x, h) => x + Number(h.horas), 0)   // 30 dias de facto (R-B11)
  const incl = Number(cliente.horasIncluidas || 0)

  // Controlo da avença: os últimos seis períodos, pagos ou não.
  const pags = s.pagamentos.filter(p => p.clienteId === cliente.id)
  // Os períodos devidos segundo o contrato do Financeiro (a mesma regra de lá).
  const periodos = !cliente.contrato ? [] : [...Array(24)].map((_, i) => somaMeses(mesAtual + '-01', -i).slice(0, 7))
    .filter(per => isDueInPeriod(cliente.contrato, per)).slice(0, 6)

  function guardarNota() {
    if (!nova.texto.trim()) return
    acoes.criarNota({ clienteId: cliente.id, tipo: nova.tipo, texto: nova.texto.trim(), com: nova.tipo === 'esclarecer' ? nova.com : null })
    setNova(p => ({ ...p, texto: '' }))
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: '16px', alignItems: 'start' }}>
      <Cartao titulo="Notas, dúvidas e contactos" icone={<Ic.lista />} area="interna">
        <div style={{ background: t.softCardBg, borderRadius: '12px', padding: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <select value={nova.tipo} onChange={e => setNova(p => ({ ...p, tipo: e.target.value }))} style={{ ...c.input, width: 'auto', cursor: 'pointer' }} aria-label="Tipo">
              {Object.entries(TIPOS_NOTA).map(([k, v]) => <option key={k} value={k}>{v.icone} {v.rotulo.replace('…', '')}</option>)}
            </select>
            {nova.tipo === 'esclarecer' && (
              <select value={nova.com} onChange={e => setNova(p => ({ ...p, com: e.target.value }))} style={{ ...c.input, width: 'auto', cursor: 'pointer' }} aria-label="Com quem">
                {ESCLARECER_COM.map(x => <option key={x}>{x}</option>)}
              </select>
            )}
          </div>
          <textarea value={nova.texto} onChange={e => setNova(p => ({ ...p, texto: e.target.value }))} rows={2} placeholder={nova.tipo === 'contacto' ? 'Ex.: Chamada — confirmou que envia o extrato na sexta.' : 'Escrever…'} style={{ ...c.input, resize: 'vertical' }} />
          <div style={{ marginTop: '8px', textAlign: 'right' }}><Botao variante="primario" onClick={guardarNota} disabled={!nova.texto.trim()}>Registar</Botao></div>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <Pilulas valor={filtro} aoMudar={setFiltro} opcoes={[['todas', 'Tudo'], ['pendentes', `Pendentes (${pendentes})`], ['nota', 'Notas'], ['contacto', 'Contactos'], ['esclarecer', 'A esclarecer']]} />
        </div>
        {visiveis.length === 0 ? <Vazio>Nada aqui.</Vazio> : visiveis.map(n => {
          const pend = ['duvida', 'esclarecer'].includes(n.tipo)
          return (
            <div key={n.id} style={{ display: 'flex', gap: '11px', padding: '11px 0', borderTop: `1px solid ${t.rowBorder}`, opacity: n.resolvido ? 0.55 : 1 }}>
              <span style={{ fontSize: '17px', lineHeight: 1.2 }}>{TIPOS_NOTA[n.tipo].icone}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '7px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '3px' }}>
                  <strong style={{ fontSize: '12px', color: t.heading }}>{n.tipo === 'esclarecer' ? `A esclarecer com ${n.com}` : TIPOS_NOTA[n.tipo].rotulo}</strong>
                  <span style={{ fontSize: '11px', color: t.subtle }}>{n.autor} · {fmtData(n.data)}</span>
                  {pend && (n.resolvido ? <Chip tom="ok">Resolvido</Chip> : <Chip tom="aviso">Pendente</Chip>)}
                </div>
                <div style={{ fontSize: '13px', color: t.text, lineHeight: 1.5, textDecoration: n.resolvido ? 'line-through' : 'none' }}>{n.texto}</div>
              </div>
              {pend && <button onClick={() => acoes.alternarNota(n.id)} style={{ flex: 'none', alignSelf: 'center', background: 'none', border: `1px solid ${t.cardBorder}`, borderRadius: '8px', padding: '5px 9px', fontSize: '11.5px', fontWeight: 700, color: t.accentText, cursor: 'pointer', fontFamily: 'inherit' }}>{n.resolvido ? 'Reabrir' : 'Resolvido ✓'}</button>}
            </div>
          )
        })}
      </Cartao>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Cartao titulo="Responsável e serviços" area="interna">
          <div style={{ fontSize: '13px', color: t.text, lineHeight: 1.9 }}>
            <div><span style={{ color: t.subtle }}>Responsável: </span>
              <select value={cliente.responsavel} onChange={e => acoes.atualizarCliente(cliente.id, { responsavel: e.target.value })} style={{ ...c.input, width: 'auto', padding: '4px 8px', display: 'inline-block' }}>
                {s.equipa.map(x => <option key={x}>{x}</option>)}
              </select></div>
            <div><span style={{ color: t.subtle }}>Cliente desde: </span><strong>{fmtData(cliente.cliente_desde)}</strong></div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '4px' }}>{cliente.servicos.map(k => <Chip key={k} tom="ouro">{rotuloServico(k)}</Chip>)}</div>
          </div>
        </Cartao>

        <Cartao titulo="Horas utilizadas" area="interna">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: incl && noMes > incl ? t.neg : t.heading }}>{noMes.toLocaleString('pt-PT')} h</span>
            <span style={{ fontSize: '12.5px', color: t.subtle }}>este mês · {incl} h incluídas · {ult30.toLocaleString('pt-PT')} h nos últimos 30 dias</span>
          </div>
          <div style={{ height: '7px', borderRadius: '20px', background: t.trackBg, overflow: 'hidden', margin: '8px 0 12px' }}>
            <div style={{ width: `${incl ? Math.min(100, (noMes / incl) * 100) : 0}%`, height: '100%', background: incl && noMes > incl ? t.neg : t.accent }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr auto', gap: '6px' }}>
            <input type="number" step="0.25" min="0" value={horas.horas} onChange={e => setHoras(p => ({ ...p, horas: e.target.value }))} style={c.input} aria-label="Horas" />
            <input value={horas.descricao} onChange={e => setHoras(p => ({ ...p, descricao: e.target.value }))} placeholder="O que foi feito" style={c.input} />
            <Botao onClick={() => { if (Number(horas.horas) > 0) { acoes.registarHoras({ clienteId: cliente.id, horas: Number(horas.horas), descricao: horas.descricao || 'Trabalho' }); setHoras({ horas: '', descricao: '' }) } }} title="Registar horas">+</Botao>
          </div>
          {hs.slice(0, 4).map(h => <div key={h.id} style={{ display: 'flex', gap: '8px', fontSize: '12px', padding: '6px 0', borderTop: `1px solid ${t.rowBorder}`, marginTop: '6px' }}><span style={{ color: t.subtle, width: '80px' }}>{fmtData(h.data)}</span><span style={{ flex: 1 }}>{h.descricao}</span><strong>{h.horas} h</strong></div>)}
        </Cartao>

        {pode(papel, 'avenca') && (
          <Cartao titulo="Controlo da avença" area="interna">
            {cliente.contratoId
              ? <div style={{ fontSize: '13px', marginBottom: '10px' }}><strong style={{ fontSize: '18px', color: t.heading }}>{fmtEur(cliente.avenca)}</strong> <span style={{ color: t.subtle }}>/ {{ anual: 'ano', trimestral: 'trimestre', unico: 'uma vez' }[cliente.avencaPeriodicidade] || 'mês'}</span>
                <a href="/gestao/financeiro" style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 700, color: t.accentText, textDecoration: 'none' }}>Financeiro →</a></div>
              : <div style={{ fontSize: '12.5px', color: t.subtle }}>Sem contrato no Financeiro. A avença cria-se em <a href="/gestao/financeiro" style={{ color: t.accentText, fontWeight: 700 }}>Financeiro</a>, com o nome do cliente ou a conta dele.</div>}
            {periodos.map(per => {
              const pg = pags.find(p => p.periodo === per)
              const [y, m] = per.split('-')
              return (
                <div key={per} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 0', borderTop: `1px solid ${t.rowBorder}`, fontSize: '12.5px' }}>
                  <span style={{ flex: 1 }}>{cliente.avencaPeriodicidade === 'anual' ? y : `${MESES_LONGOS[Number(m) - 1]} ${y}`}</span>
                  {pg ? <><span style={{ color: t.subtle }}>pago a {fmtData(pg.data)}</span><Chip tom="ok">Pago</Chip></>
                    : per === mesAtual ? <Chip tom="neutro">A decorrer</Chip>
                    : <><Chip tom="erro">Por pagar</Chip><button onClick={() => acoes.registarPagamento({ clienteId: cliente.id, periodo: per, valor: cliente.avenca })} style={{ background: 'none', border: 'none', color: t.accentText, fontWeight: 700, cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>Registar</button></>}
                </div>
              )
            })}
          </Cartao>
        )}
      </div>
    </div>
  )
}
