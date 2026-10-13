import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { usePortal } from '../dados'
import { Titulo, Chip, useCampos } from '../ui'
import { hojeIso } from '../regras'
import { clienteEmCurso } from '../seletores'

// Relatórios trimestrais de todos os clientes (documento, secção 8): quem já
// recebeu o do último trimestre fechado, quem está em rascunho, quem falta.
// 13-D (13/10): só os 3 trimestres fechados (o corrente mostrava quase sempre
// "—"; o rascunho vê-se na ficha), sem o software por baixo do nome nem a
// coluna "Último resultado" (está no separador da ficha). Os clientes inativos
// não contam — a mesma regra do Início.

export default function Relatorios() {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const s = usePortal()
  const c = useCampos()
  const navigate = useNavigate()
  const hoje = hojeIso()
  const ano = Number(hoje.slice(0, 4)), tq = Math.ceil(Number(hoje.slice(5, 7)) / 3)
  // Os três últimos trimestres fechados, do mais recente para trás.
  const tris = [...Array(3)].map((_, i) => { let q = tq - 1 - i, y = ano; while (q < 1) { q += 4; y-- } return [y, q] })
  const clientes = s.clientes.filter(x => clienteEmCurso(x) && x.servicos.includes('contabilidade'))

  return (
    <div>
      <Titulo titulo="Relatórios trimestrais" />
      <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? '560px' : 0 }}>
          <thead><tr>
            <th style={c.th}>Cliente</th>
            {tris.map(([y, q], i) => <th key={i} style={c.th}>T{q} {y}</th>)}
            <th style={c.th}></th>
          </tr></thead>
          <tbody>
            {clientes.map(cli => {
              const rs = s.relatorios.filter(r => r.clienteId === cli.id)
              return (
                <tr key={cli.id} onClick={() => navigate(`/gestao/clientes/${cli.id}/relatorios`)} style={{ cursor: 'pointer' }}>
                  <td style={c.td}><strong style={{ color: t.heading }}>{cli.nome}</strong></td>
                  {tris.map(([y, q], i) => {
                    const r = rs.find(x => x.ano === y && x.trimestre === q)
                    // Trimestres que acabaram antes de o cliente entrar não ficam "por fazer" (R-B11)
                    const fimTri = `${y}-${String(q * 3).padStart(2, '0')}-31`
                    if (!r && cli.cliente_desde && fimTri < cli.cliente_desde) return <td key={i} style={c.td}><span style={{ color: t.subtle, fontSize: '12px' }}>—</span></td>
                    return <td key={i} style={c.td}>{r ? <Chip tom={r.estado === 'enviado' ? 'ok' : 'aviso'}>{r.estado === 'enviado' ? 'Enviado' : 'Rascunho'}</Chip> : <Chip tom="erro">Por fazer</Chip>}</td>
                  })}
                  {/* Sinal visível de que a linha abre o separador da ficha (o texto de ajuda não aparece). */}
                  <td style={{ ...c.td, textAlign: 'right', whiteSpace: 'nowrap', color: t.accentText, fontWeight: 700, fontSize: '12px' }}>Abrir →</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
