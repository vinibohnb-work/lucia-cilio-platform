import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import { useIsMobile } from '../../../hooks/useIsMobile'
import { useV2, acoes } from '../../dados'
import { Cartao, Kpi, Chip, Ic, Vazio, useCampos, Botao } from '../../ui'
import { CHECKLIST, ESTADOS_OBRIG, estadoEfetivo, fmtData, fmtEur, hojeIso } from '../../regras'
import { obrigacoesDe, abertas, proximaObrigacao, docsEmFalta, valorAPagar, creditos, entregues, ultimoRelatorio } from '../../seletores'
import { CompositorWhatsApp } from '../../partes/Comunicacao'

// Resumo (documento, secção 2) com a disposição do mockup: quatro indicadores
// em cima, obrigações e checklist, tarefas e comunicação rápida.

const ROTULO_VALOR = { pagar: 'a pagar', credito: 'crédito', reembolso: 'reembolso' }

function EstadoO({ o }) { const e = estadoEfetivo(o); return <Chip tom={ESTADOS_OBRIG[e].tom}>{ESTADOS_OBRIG[e].rotulo}</Chip> }

export default function Resumo({ cliente, base, modoCliente }) {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const s = useV2()
  const c = useCampos()
  const navigate = useNavigate()
  const cid = cliente.id

  const prox = proximaObrigacao(s, cid)
  const falta = docsEmFalta(s, cid)
  const aPagar = valorAPagar(s, cid)
  const cred = creditos(s, cid)
  const somaCred = cred.reduce((x, o) => x + Number(o.valor.montante || 0), 0)
  const ult = ultimoRelatorio(s, cid)
  const lista = abertas(obrigacoesDe(s, cid)).slice(0, 5)
  const feitas = entregues(s, cid).slice(0, 4)
  const tarefas = s.tarefas.filter(x => x.clienteId === cid && x.estado !== 'concluida').sort((a, b) => a.prazo.localeCompare(b.prazo)).slice(0, 5)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px' }}>
        <Kpi icone={<Ic.agenda size={22} />} rotulo="Próxima obrigação" valor={prox ? <span style={{ fontSize: '14.5px' }}>{prox.nome} · {fmtData(prox.prazo)}</span> : 'Nenhuma'}
          sub={prox ? <EstadoO o={prox} /> : null} />
        <Kpi icone={<Ic.doc size={22} />} rotulo="Documentos em falta" valor={falta.length} tom={falta.length ? 'erro' : undefined}
          sub={falta.length ? [...new Set(falta.map(d => d.tipo))].slice(0, 2).join(', ') : 'Tudo recebido'} />
        <Kpi icone={<Ic.euro size={22} />} rotulo="Valor a pagar" valor={fmtEur(aPagar)} sub={aPagar ? 'obrigações ainda por pagar' : 'nada em aberto'} />
        <Kpi icone={<Ic.euro size={22} />} rotulo="Créditos ou reembolsos" valor={fmtEur(somaCred)} tom={somaCred ? 'ok' : undefined} sub={`${cred.length} este ano`} />
        <Kpi icone={<Ic.relatorios size={22} />} rotulo="Último relatório" valor={ult ? `${ult.trimestre}.º trimestre ${ult.ano}` : '—'} sub={ult ? `enviado a ${fmtData(ult.enviadoEm)}` : 'ainda nenhum'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile || modoCliente ? '1fr' : '1.35fr 1fr', gap: '16px', alignItems: 'start' }}>
        <Cartao titulo="Obrigações fiscais" icone={<Ic.agenda />} area={modoCliente ? undefined : 'cliente'}
          acao={<Botao variante="fantasma" onClick={() => navigate(`${base}/obrigacoes`)}>Ver todas →</Botao>}>
          {lista.length === 0 ? <Vazio>Sem obrigações em aberto.</Vazio> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Obrigação', 'Data-limite', 'Valor', 'Estado'].map(h => <th key={h} style={c.th}>{h}</th>)}</tr></thead>
              <tbody>{lista.map(o => (
                <tr key={o.id}>
                  <td style={c.td}><div style={{ fontWeight: 600, color: t.heading }}>{o.nome}</div><div style={{ fontSize: '11px', color: t.subtle }}>{o.periodo}</div></td>
                  <td style={{ ...c.td, whiteSpace: 'nowrap' }}>{fmtData(o.prazo)}</td>
                  <td style={{ ...c.td, whiteSpace: 'nowrap' }}>{o.valor?.montante ? <>{fmtEur(o.valor.montante)} <span style={{ fontSize: '11px', color: t.subtle }}>{ROTULO_VALOR[o.valor.tipo]}</span></> : '—'}</td>
                  <td style={c.td}><EstadoO o={o} /></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </Cartao>

        {!modoCliente && (
          <Cartao titulo={prox ? `Checklist interna` : 'Checklist interna'} icone={<Ic.check />} area="interna">
            {!prox ? <Vazio>Sem obrigação em curso.</Vazio> : (
              <>
                <div style={{ fontSize: '12px', color: t.subtle, marginTop: '-6px', marginBottom: '10px' }}>{prox.nome} · {prox.periodo}</div>
                {CHECKLIST.map(([k, rot]) => (
                  <label key={k} style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '6px 0', cursor: 'pointer', fontSize: '14px', color: prox.checklist?.[k] ? t.textMuted : t.heading }}>
                    <input type="checkbox" checked={!!prox.checklist?.[k]} onChange={() => acoes.alternarChecklist(prox.id, k)} style={{ width: '19px', height: '19px', accentColor: t.btnBg, cursor: 'pointer' }} />
                    {rot}
                  </label>
                ))}
              </>
            )}
          </Cartao>
        )}

        {!modoCliente && (
          <Cartao titulo="Próximas tarefas" icone={<Ic.lista />} area="interna"
            acao={<Botao variante="fantasma" onClick={() => navigate(`${base}/tarefas`)}>Ver todas →</Botao>}>
            {tarefas.length === 0 ? <Vazio>Sem tarefas em aberto.</Vazio> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['Data', 'Tarefa', 'Estado'].map(h => <th key={h} style={c.th}>{h}</th>)}</tr></thead>
                <tbody>{tarefas.map(x => {
                  const atraso = x.prazo < hojeIso()
                  return (
                    <tr key={x.id}>
                      <td style={{ ...c.td, whiteSpace: 'nowrap', color: atraso ? t.neg : t.text }}>{fmtData(x.prazo)}</td>
                      <td style={c.td}>{x.titulo}</td>
                      <td style={c.td}>{atraso ? <Chip tom="erro">Em atraso</Chip> : <Chip tom={x.estado === 'em_curso' ? 'aviso' : 'neutro'}>{x.estado === 'em_curso' ? 'Em curso' : 'Pendente'}</Chip>}</td>
                    </tr>
                  )
                })}</tbody>
              </table>
            )}
          </Cartao>
        )}

        {!modoCliente && (
          <Cartao titulo="Comunicação rápida" icone={<Ic.mensagens />}>
            <CompositorWhatsApp clienteId={cid} compacto />
          </Cartao>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', alignItems: 'start' }}>
        <Cartao titulo="Últimas declarações entregues" icone={<Ic.doc />} area={modoCliente ? undefined : 'cliente'}>
          {feitas.length === 0 ? <Vazio>Ainda nenhuma.</Vazio> : feitas.map(o => (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderTop: `1px solid ${t.rowBorder}`, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <div style={{ fontWeight: 700, color: t.heading, fontSize: '13px' }}>{o.nome} <span style={{ fontWeight: 500, color: t.subtle }}>· {o.periodo}</span></div>
                <div style={{ fontSize: '11.5px', color: t.subtle }}>Entregue · {fmtData(o.comprovativo?.data || o.prazo)}{o.comprovativo ? ` · 📎 ${o.comprovativo.nome}` : ''}</div>
              </div>
              {o.valor?.montante ? <span style={{ fontSize: '13px', fontWeight: 700, color: o.valor.tipo === 'pagar' ? t.heading : t.dueOk.ink }}>{fmtEur(o.valor.montante)} <span style={{ fontSize: '11px', fontWeight: 500, color: t.subtle }}>{ROTULO_VALOR[o.valor.tipo]}</span></span> : <span style={{ fontSize: '12px', color: t.subtle }}>sem valor</span>}
              <Chip tom={ESTADOS_OBRIG[o.estado].tom}>{ESTADOS_OBRIG[o.estado].rotulo}</Chip>
            </div>
          ))}
        </Cartao>
        <Cartao titulo="Documentos em falta" icone={<Ic.doc />} area={modoCliente ? undefined : 'cliente'}
          acao={<Botao variante="fantasma" onClick={() => navigate(`${base}/documentos`)}>{modoCliente ? 'Enviar →' : 'Ver →'}</Botao>}>
          {falta.length === 0 ? <Vazio>Nada em falta. 🎉</Vazio> : falta.map(d => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderTop: `1px solid ${t.rowBorder}` }}>
              <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: t.heading }}>{d.tipo}</span>
              <span style={{ fontSize: '12px', color: t.subtle }}>{String(d.mes).padStart(2, '0')}/{d.ano}</span>
              <Chip tom="erro">Em falta</Chip>
            </div>
          ))}
        </Cartao>
      </div>
    </div>
  )
}
