import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { usePortal, acoes } from '../dados'
import { Janela, Botao, Chip, Vazio } from '../ui'
import { fmtData, FECHADOS } from '../regras'
import { compararComAT } from '../../lib/agendaFiscalPT'
import { obterAgendaFiscalPT } from '../../lib/adminApi'

// Item 2 da reunião de 15/10: conferir os prazos das obrigações de Portugal com
// os quadros oficiais da AT (Portal das Finanças). Mostra só as diferenças e só
// muda os prazos que a equipa escolher — nada é atualizado sozinho.
export default function PrazosAT({ aoFechar }) {
  const { t } = useTheme()
  const s = usePortal()
  const [estado, setEstado] = useState({ aCarregar: false, erro: '', dados: null })
  const [escolhidos, setEscolhidos] = useState(null)
  const ano = new Date().getFullYear()

  async function conferir() {
    setEstado({ aCarregar: true, erro: '', dados: null })
    try {
      const dados = await obterAgendaFiscalPT(ano)
      const difs = compararComAT(s.obrigacoes, s.clientes, dados.anos, FECHADOS)
      setEstado({ aCarregar: false, erro: '', dados: { ...dados, difs } })
      // Por omissão ficam marcadas as que caem no mês esperado; as "a confirmar" não
      setEscolhidos(new Set(difs.filter(d => !d.confirmar).map(d => d.obrigacao.id)))
    } catch (e) {
      setEstado({ aCarregar: false, erro: e.message || 'Não foi possível ler o Portal das Finanças.', dados: null })
    }
  }

  function aplicar() {
    const difs = estado.dados.difs.filter(d => escolhidos.has(d.obrigacao.id))
    difs.forEach(d => acoes.atualizarObrigacao(d.obrigacao.id, { prazo: d.prazoOficial }))
    setEstado(e => ({ ...e, dados: { ...e.dados, difs: e.dados.difs.filter(d => !escolhidos.has(d.obrigacao.id)), aplicadas: difs.length } }))
    setEscolhidos(new Set())
  }

  const alternar = (id) => setEscolhidos(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const anosPublicados = estado.dados ? Object.entries(estado.dados.anos).filter(([, v]) => v).map(([a]) => a) : []
  const th = { textAlign: 'left', padding: '8px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: t.textMuted, borderBottom: `1px solid ${t.cardBorder}` }
  const td = { padding: '9px 10px', fontSize: '13px', color: t.text, borderBottom: `1px solid ${t.rowBorder}`, verticalAlign: 'top' }

  return (
    <Janela titulo="Prazos oficiais · Portal das Finanças" aoFechar={aoFechar} largura={820}>
      <p style={{ fontSize: '13px', color: t.textMuted, margin: '0 0 14px', lineHeight: 1.5 }}>
        Compara os prazos das obrigações em aberto dos clientes de Portugal com os quadros-resumo da AT
        (obrigações declarativas e pagamentos), que já trazem os dias úteis e as prorrogações por despacho.
        Só muda o que marcar. Os prazos da Alemanha continuam a vir das regras da plataforma.
      </p>
      {!estado.dados && (
        <Botao variante="primario" onClick={conferir} disabled={estado.aCarregar}>{estado.aCarregar ? 'A ler o Portal das Finanças…' : `Conferir prazos de ${ano}`}</Botao>
      )}
      {estado.erro && <div role="alert" style={{ marginTop: '12px', fontSize: '13px', color: t.neg }}>{estado.erro}</div>}
      {estado.dados && (
        <>
          <div style={{ fontSize: '12px', color: t.subtle, marginBottom: '10px' }}>
            Quadros publicados: {anosPublicados.join(', ') || 'nenhum'} · lido em {fmtData(estado.dados.obtidoEm.slice(0, 10))} ·{' '}
            <a href={estado.dados.fontes[0]} target="_blank" rel="noopener noreferrer" style={{ color: t.accentText, fontWeight: 700 }}>ver na AT</a>
            {estado.dados.aplicadas ? <span style={{ color: t.pos, fontWeight: 700 }}> · {estado.dados.aplicadas} prazo(s) atualizado(s)</span> : null}
          </div>
          {estado.dados.difs.length === 0
            ? <Vazio>Os prazos em aberto já coincidem com os da AT (ou o ano ainda não foi publicado).</Vazio>
            : (
              <div className="table-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}><span className="so-leitores">Atualizar</span></th><th style={th}>Cliente</th><th style={th}>Obrigação</th><th style={th}>Prazo atual</th><th style={th}>Prazo da AT</th></tr></thead>
                  <tbody>
                    {estado.dados.difs.map(d => (
                      <tr key={d.obrigacao.id}>
                        <td style={td}><input type="checkbox" checked={escolhidos.has(d.obrigacao.id)} onChange={() => alternar(d.obrigacao.id)} aria-label={`Atualizar ${d.obrigacao.nome} ${d.obrigacao.periodo}`} style={{ accentColor: t.btnBg, width: '18px', height: '18px' }} /></td>
                        <td style={td}>{d.cliente.nome}</td>
                        <td style={td}>{d.obrigacao.nome} · {d.obrigacao.periodo}<div style={{ fontSize: '11.5px', color: t.subtle }}>{d.fonte}</div></td>
                        <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{fmtData(d.prazoAtual)}</td>
                        <td style={{ ...td, fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
                          {fmtData(d.prazoOficial)}
                          {d.confirmar && <div style={{ marginTop: '4px' }}><Chip tom="aviso" title="O prazo da AT cai noutro mês que não o habitual (ex.: agosto sem entregas). Confirme antes de atualizar.">confirmar</Chip></div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px', flexWrap: 'wrap' }}>
            <Botao onClick={aoFechar}>Fechar</Botao>
            {estado.dados.difs.length > 0 && <Botao variante="primario" onClick={aplicar} disabled={!escolhidos?.size}>Atualizar {escolhidos?.size || 0} prazo(s)</Botao>}
          </div>
        </>
      )}
    </Janela>
  )
}
