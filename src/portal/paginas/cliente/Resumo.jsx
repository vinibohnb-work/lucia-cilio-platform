import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'
import { useIsMobile } from '../../../hooks/useIsMobile'
import { usePortal } from '../../dados'
import { Cartao, Chip, Ic, Vazio, useCampos, Botao } from '../../ui'
import { ESTADOS_OBRIG, estadoEfetivo, fmtData, fmtEur } from '../../regras'
import { obrigacoesDe, abertas, entregues } from '../../seletores'
import { TabelaTarefas } from '../../partes/Tarefas'

// Resumo do cliente. Simplificado a 12/10 (revisão ecrã a ecrã, 13-D): ficam só as
// obrigações em aberto e as tarefas — o que se precisa de ver ao abrir um cliente.
// Saíram os indicadores (repetiam a 1.ª linha das obrigações e o separador
// Relatórios), a checklist (vive no detalhe de cada obrigação), o WhatsApp (botão do
// cabeçalho) e as declarações entregues (filtro "Entregues" das Obrigações).
// As tarefas deixaram de ter separador próprio: vivem aqui.

const ROTULO_VALOR = { pagar: 'a pagar', credito: 'crédito', reembolso: 'reembolso' }

function EstadoO({ o }) { const e = estadoEfetivo(o); return <Chip tom={ESTADOS_OBRIG[e].tom}>{ESTADOS_OBRIG[e].rotulo}</Chip> }

export default function Resumo({ cliente, base, modoCliente }) {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const s = usePortal()
  const c = useCampos()
  const navigate = useNavigate()
  const [verConcluidas, setVerConcluidas] = useState(false)
  const cid = cliente.id

  const lista = abertas(obrigacoesDe(s, cid)).slice(0, 6)
  const doCliente = s.tarefas.filter(x => x.clienteId === cid)
  const concluidas = doCliente.filter(x => x.estado === 'concluida').length
  const tarefas = doCliente
    .filter(x => verConcluidas || x.estado !== 'concluida')
    .sort((a, b) => (a.estado === 'concluida') - (b.estado === 'concluida') || a.prazo.localeCompare(b.prazo))
  // O cliente não tem tarefas: no lugar delas vê o que já foi entregue
  const feitas = modoCliente ? entregues(s, cid).slice(0, 4) : []

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', alignItems: 'start' }}>
      <Cartao titulo="Obrigações em aberto" icone={<Ic.agenda />}
        acao={<Botao variante="fantasma" onClick={() => navigate(`${base}/obrigacoes`)}>Ver todas →</Botao>}>
        {lista.length === 0 ? <Vazio>Sem obrigações em aberto.</Vazio> : (
          <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>{['Obrigação', 'Data-limite', ...(modoCliente ? [] : ['Valor']), 'Estado'].map(h => <th key={h} style={c.th}>{h}</th>)}</tr></thead>
            <tbody>{lista.map(o => (
              <tr key={o.id}>
                <td style={c.td}><div style={{ fontWeight: 600, color: t.heading }}>{o.nome}</div><div style={{ fontSize: '11px', color: t.subtle }}>{o.periodo}</div></td>
                <td style={{ ...c.td, whiteSpace: 'nowrap' }}>{fmtData(o.prazo)}</td>
                {!modoCliente && <td style={{ ...c.td, whiteSpace: 'nowrap' }}>{o.valor?.montante ? <>{fmtEur(o.valor.montante)} <span style={{ fontSize: '11px', color: t.subtle }}>{ROTULO_VALOR[o.valor.tipo]}</span></> : '—'}</td>}
                <td style={c.td}><EstadoO o={o} /></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Cartao>

      {!modoCliente && (
        <Cartao titulo="Tarefas" icone={<Ic.lista />} area="interna" semPadding
          acao={concluidas > 0 && <Botao variante="fantasma" onClick={() => setVerConcluidas(v => !v)}>{verConcluidas ? 'Esconder concluídas' : `Ver concluídas (${concluidas})`}</Botao>}>
          <TabelaTarefas mostrarCliente={false} tarefas={tarefas} vazio="Sem tarefas em aberto." />
        </Cartao>
      )}

      {modoCliente && (
        <Cartao titulo="Últimas declarações entregues" icone={<Ic.doc />}>
          {feitas.length === 0 ? <Vazio>Ainda nenhuma.</Vazio> : feitas.map(o => (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderTop: `1px solid ${t.rowBorder}`, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '160px' }}>
                <div style={{ fontWeight: 700, color: t.heading, fontSize: '13px' }}>{o.nome} <span style={{ fontWeight: 500, color: t.subtle }}>· {o.periodo}</span></div>
                <div style={{ fontSize: '11.5px', color: t.subtle }}>Entregue · {fmtData(o.comprovativo?.data || o.prazo)}</div>
              </div>
              <Chip tom={ESTADOS_OBRIG[o.estado].tom}>{ESTADOS_OBRIG[o.estado].rotulo}</Chip>
            </div>
          ))}
        </Cartao>
      )}
    </div>
  )
}
