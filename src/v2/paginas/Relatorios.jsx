import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useV2 } from '../dados'
import { Titulo, Chip, useCampos } from '../ui'
import { hojeIso, fmtEur } from '../regras'
import { resultado } from '../partes/Relatorio'

// Relatórios trimestrais de todos os clientes (documento, secção 8): quem já
// recebeu o do último trimestre fechado, quem está em rascunho, quem falta.

export default function Relatorios() {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const s = useV2()
  const c = useCampos()
  const navigate = useNavigate()
  const hoje = hojeIso()
  const ano = Number(hoje.slice(0, 4)), tq = Math.ceil(Number(hoje.slice(5, 7)) / 3)
  // Os quatro últimos trimestres, do mais recente (o corrente, ainda a decorrer) para trás.
  const tris = [...Array(4)].map((_, i) => { let q = tq - i, y = ano; while (q < 1) { q += 4; y-- } return [y, q] })
  const clientes = s.clientes.filter(x => x.servicos.includes('contabilidade'))

  return (
    <div>
      <Titulo eyebrow="Área interna" titulo="Relatórios trimestrais" sub="O resumo do negócio que cada cliente recebe por trimestre. Clique numa célula para abrir os relatórios do cliente." />
      <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? '720px' : 0 }}>
          <thead><tr>
            <th style={c.th}>Cliente</th>
            {tris.map(([y, q], i) => <th key={i} style={c.th}>T{q} {y}{i === 0 ? ' · a decorrer' : ''}</th>)}
            <th style={c.th}>Último resultado</th>
          </tr></thead>
          <tbody>
            {clientes.map(cli => {
              const rs = s.relatorios.filter(r => r.clienteId === cli.id)
              const ultimo = rs.filter(r => r.estado === 'enviado').sort((a, b) => (b.ano - a.ano) || (b.trimestre - a.trimestre))[0]
              return (
                <tr key={cli.id} onClick={() => navigate(`/v2/clientes/${cli.id}/relatorios`)} style={{ cursor: 'pointer' }}>
                  <td style={c.td}><strong style={{ color: t.heading }}>{cli.nome}</strong><div style={{ fontSize: '11px', color: t.subtle }}>{cli.software}</div></td>
                  {tris.map(([y, q], i) => {
                    const r = rs.find(x => x.ano === y && x.trimestre === q)
                    return <td key={i} style={c.td}>{r ? <Chip tom={r.estado === 'enviado' ? 'ok' : 'aviso'}>{r.estado === 'enviado' ? 'Enviado' : 'Rascunho'}</Chip> : i === 0 ? <span style={{ color: t.subtle, fontSize: '12px' }}>—</span> : <Chip tom="erro">Por fazer</Chip>}</td>
                  })}
                  <td style={{ ...c.td, fontWeight: 700, color: ultimo && resultado(ultimo) < 0 ? t.neg : t.heading }}>{ultimo ? `${fmtEur(resultado(ultimo))} · T${ultimo.trimestre}` : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
