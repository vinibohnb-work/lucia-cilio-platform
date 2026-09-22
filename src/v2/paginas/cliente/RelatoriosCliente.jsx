import { useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import { useV2 } from '../../dados'
import { Cartao, Chip, Botao, useCampos, Vazio, Ic } from '../../ui'
import { fmtEur, fmtData, hojeIso, uid } from '../../regras'
import { relatoriosDe } from '../../seletores'
import { EditorRelatorio, resultado, anteriorDe } from '../../partes/Relatorio'

// Relatórios trimestrais do cliente (documento, secção 8).

export default function RelatoriosCliente({ cliente, modoCliente }) {
  const { t } = useTheme()
  const s = useV2()
  const c = useCampos()
  const lista = relatoriosDe(s, cliente.id).filter(r => !modoCliente || r.estado === 'enviado')
  const [aberto, setAberto] = useState(null)

  // O próximo trimestre a relatar é o último trimestre já fechado.
  const hoje = hojeIso()
  const tq = Math.ceil(Number(hoje.slice(5, 7)) / 3)
  const [anoNovo, triNovo] = tq === 1 ? [Number(hoje.slice(0, 4)) - 1, 4] : [Number(hoje.slice(0, 4)), tq - 1]
  const jaExiste = lista.find(r => r.ano === anoNovo && r.trimestre === triNovo)
  const proxAberto = !jaExiste && { ano: anoNovo, trimestre: triNovo }
  // Se o trimestre corrente ainda não fechou, também se pode começar o rascunho dele.
  const correnteExiste = s.relatorios.find(r => r.clienteId === cliente.id && r.ano === Number(hoje.slice(0, 4)) && r.trimestre === tq)

  function novo(ano, trimestre) {
    const ant = anteriorDe(s.relatorios, { clienteId: cliente.id, ano, trimestre })
    setAberto({ id: uid(), clienteId: cliente.id, ano, trimestre, estado: 'rascunho', faturacao: '', despesas: '', iva: '', impostos: '', liquidez: ant?.liquidez ?? '', observacoes: '', recomendacoes: '' })
  }

  if (aberto) return <Cartao><EditorRelatorio inicial={aberto} soLeitura={modoCliente} aoFechar={() => setAberto(null)} /></Cartao>

  return (
    <Cartao titulo="Relatórios trimestrais" icone={<Ic.relatorios />} area={modoCliente ? undefined : 'cliente'}
      acao={!modoCliente && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {proxAberto && <Botao variante="primario" onClick={() => novo(proxAberto.ano, proxAberto.trimestre)}><Ic.mais size={15} />Relatório do {proxAberto.trimestre}.º trimestre {proxAberto.ano}</Botao>}
          {!correnteExiste && <Botao onClick={() => novo(Number(hoje.slice(0, 4)), tq)}>Começar o {tq}.º trimestre</Botao>}
        </div>
      )}>
      {lista.length === 0 ? <Vazio>Ainda não há relatórios.</Vazio> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Trimestre', 'Faturação', 'Despesas', 'Resultado', 'Estado', ''].map((h, i) => <th key={i} style={c.th}>{h}</th>)}</tr></thead>
          <tbody>{lista.map(r => {
            const res = resultado(r)
            return (
              <tr key={r.id} onClick={() => setAberto(r)} style={{ cursor: 'pointer' }}>
                <td style={c.td}><strong style={{ color: t.heading }}>{r.trimestre}.º trimestre {r.ano}</strong></td>
                <td style={c.td}>{fmtEur(r.faturacao)}</td>
                <td style={c.td}>{fmtEur(r.despesas)}</td>
                <td style={{ ...c.td, fontWeight: 700, color: res < 0 ? t.neg : t.heading }}>{fmtEur(res)}</td>
                <td style={c.td}><Chip tom={r.estado === 'enviado' ? 'ok' : 'aviso'}>{r.estado === 'enviado' ? `Enviado · ${fmtData(r.enviadoEm)}` : 'Rascunho'}</Chip></td>
                <td style={{ ...c.td, textAlign: 'right', color: t.accentText, fontWeight: 700, fontSize: '12px' }}>Abrir →</td>
              </tr>
            )
          })}</tbody>
        </table>
      )}
    </Cartao>
  )
}
