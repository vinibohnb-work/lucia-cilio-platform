import { useState, useEffect } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import { useIsMobile } from '../../../hooks/useIsMobile'
import { usePortal, acoes, abrirFicheiro, listarPasta } from '../../dados'
import { Cartao, Chip, Botao, Pilulas, useCampos, Vazio, Ic } from '../../ui'
import { ESTADOS_DOC, TIPOS_DOC, MESES_LONGOS, hojeIso, fmtData } from '../../regras'

// Documentos (documento, secção 6): enviados pelo cliente pela plataforma e
// organizados por cliente → ano → mês ou trimestre → tipo, com quatro estados.
// Os ficheiros vão para a pasta do cliente, no mês certo — com conta, é a
// mesma pasta para onde ele envia os dele na plataforma.

export default function Documentos({ cliente, modoCliente }) {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const s = usePortal()
  const c = useCampos()
  const hoje = hojeIso()
  const docs = s.documentos.filter(d => d.clienteId === cliente.id)
  const anos = [...new Set([...docs.map(d => d.ano), Number(hoje.slice(0, 4))])].sort((a, b) => b - a)
  const [ano, setAno] = useState(anos[0])
  const [agrupar, setAgrupar] = useState(cliente.periodicidade === 'mensal' ? 'mes' : 'trimestre')
  const [filtro, setFiltro] = useState('todos')
  const [envio, setEnvio] = useState({ mes: Number(hoje.slice(5, 7)), tipo: TIPOS_DOC[0] })
  const [aviso, setAviso] = useState('')

  const doAno = docs.filter(d => d.ano === ano && (filtro === 'todos' || d.estado === filtro))
  const grupoDe = (d) => agrupar === 'mes' ? d.mes : Math.ceil(d.mes / 3)
  const grupos = [...new Set(doAno.map(grupoDe))].sort((a, b) => b - a)
  const rotuloGrupo = (g) => agrupar === 'mes' ? `${MESES_LONGOS[g - 1][0].toUpperCase()}${MESES_LONGOS[g - 1].slice(1)} ${ano}` : `${g}.º trimestre ${ano}`
  const contagem = Object.fromEntries(Object.keys(ESTADOS_DOC).map(k => [k, docs.filter(d => d.ano === ano && d.estado === k).length]))

  const [aEnviar, setAEnviar] = useState(false)
  // Enviar ficheiros: se havia um "em falta" deste tipo e mês, é esse que fica recebido.
  async function receber(ficheiros, mes, tipo) {
    setAEnviar(true)
    for (const ficheiro of ficheiros) await acoes.carregarDocumento({ clienteId: cliente.id, ano, mes, tipo, ficheiro })
    setAEnviar(false)
    setAviso(`${ficheiros.length} ficheiro(s) recebido(s).`); setTimeout(() => setAviso(''), 3000)
  }

  // O que o cliente enviou pela plataforma dele (Empresa → Enviar documentos), no mês escolhido.
  const [daConta, setDaConta] = useState([])
  const mesConta = `${ano}-${String(envio.mes).padStart(2, '0')}`
  const jaRegistados = docs.map(d => d.caminho).filter(Boolean).join('|')
  useEffect(() => {
    let vivo = true
    if (!cliente.userId) return
    listarPasta(`${cliente.userId}/${mesConta}`).then(l => { if (vivo) setDaConta(l.filter(x => !jaRegistados.split('|').includes(x.caminho))) })
    return () => { vivo = false }
  }, [cliente.userId, mesConta, jaRegistados])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', gap: '16px', alignItems: 'start' }}>
        <Cartao titulo={modoCliente ? 'Enviar documentos' : 'Receber documento'} icone={<Ic.doc />}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '10px', marginBottom: '10px' }}>
            <select value={envio.mes} onChange={e => setEnvio(p => ({ ...p, mes: Number(e.target.value) }))} style={{ ...c.input, cursor: 'pointer' }} aria-label="Mês">
              {MESES_LONGOS.map((m, i) => <option key={m} value={i + 1}>{m} {ano}</option>)}
            </select>
            <select value={envio.tipo} onChange={e => setEnvio(p => ({ ...p, tipo: e.target.value }))} style={{ ...c.input, cursor: 'pointer' }} aria-label="Tipo">
              {TIPOS_DOC.map(x => <option key={x}>{x}</option>)}
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '18px', borderRadius: '12px', border: `1.5px dashed ${t.accent}`, background: t.softCardBg, cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: t.accentText }}>
            <Ic.clip />{aEnviar ? 'A carregar…' : 'Escolher ficheiros'}
            <input type="file" multiple disabled={aEnviar} style={{ display: 'none' }} onChange={e => {
              const fs = [...(e.target.files || [])]; e.target.value = ''
              if (fs.length) receber(fs, envio.mes, envio.tipo)
            }} />
          </label>
          {aviso && <div style={{ marginTop: '8px', fontSize: '12.5px', fontWeight: 700, color: t.dueOk.ink }}>{aviso}</div>}
          {!modoCliente && cliente.userId && (
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.6px', color: t.textMuted, marginBottom: '6px' }}>Enviados pelo cliente em {MESES_LONGOS[envio.mes - 1]}</div>
              {daConta.length === 0 && <div style={{ fontSize: '12.5px', color: t.subtle }}>Nada por classificar na pasta deste mês.</div>}
              {daConta.map(x => (
                <div key={x.caminho} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderTop: `1px solid ${t.rowBorder}`, fontSize: '12.5px' }}>
                  <button onClick={() => abrirFicheiro(x.caminho)} style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: t.accentText, fontWeight: 600, fontFamily: 'inherit', fontSize: '12.5px' }}>📄 {x.nome}</button>
                  <span style={{ color: t.subtle }}>{fmtData(x.data)}</span>
                  <select value="" onChange={e => { if (e.target.value) acoes.criarDocumento({ clienteId: cliente.id, ano, mes: envio.mes, tipo: e.target.value, nome: x.nome, caminho: x.caminho, enviadoPor: 'cliente', data: x.data || hoje }) }}
                    style={{ ...c.input, width: 'auto', padding: '4px 6px', fontSize: '11.5px', cursor: 'pointer' }} aria-label="Classificar">
                    <option value="">Classificar…</option>{TIPOS_DOC.map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </Cartao>
        <Cartao titulo={`Estado em ${ano}`}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {Object.entries(ESTADOS_DOC).map(([k, v]) => (
              <button key={k} onClick={() => setFiltro(filtro === k ? 'todos' : k)} style={{ textAlign: 'left', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${filtro === k ? t.accent : t.cardBorder}`, background: filtro === k ? t.softCardBg : t.cardBg }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: t.heading }}>{contagem[k]}</div>
                <Chip tom={v.tom}>{v.rotulo}</Chip>
              </button>
            ))}
          </div>
          {!modoCliente && (
            <Botao estilo={{ marginTop: '12px', width: '100%' }} onClick={() => {
              // "Deste mês" é sempre o mês corrente, seja qual for o ano a ver (R-B11)
              const [y, m] = [Number(hoje.slice(0, 4)), Number(hoje.slice(5, 7))]
              const n = acoes.pedirDocumentos(cliente.id, y, m)
              setAviso(n ? `${n} documento(s) de ${MESES_LONGOS[m - 1]} marcados como em falta.` : 'Os documentos deste mês já estão pedidos.'); setTimeout(() => setAviso(''), 3500)
            }}>Pedir os documentos deste mês</Botao>
          )}
        </Cartao>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={ano} onChange={e => setAno(Number(e.target.value))} style={{ ...c.input, width: 'auto', fontWeight: 700, cursor: 'pointer' }} aria-label="Ano">
          {anos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <Pilulas valor={agrupar} aoMudar={setAgrupar} opcoes={[['mes', 'Por mês'], ['trimestre', 'Por trimestre']]} />
        {filtro !== 'todos' && <Botao variante="fantasma" onClick={() => setFiltro('todos')}>Limpar filtro ✕</Botao>}
      </div>

      {grupos.length === 0 && <Cartao><Vazio>Sem documentos neste ano.</Vazio></Cartao>}
      {grupos.map(g => (
        <Cartao key={g} titulo={rotuloGrupo(g)} semPadding>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {doAno.filter(d => grupoDe(d) === g).sort((a, b) => b.mes - a.mes || a.tipo.localeCompare(b.tipo)).map(d => (
                <tr key={d.id}>
                  <td style={{ ...c.td, width: isMobile ? 'auto' : '220px' }}><strong style={{ color: t.heading }}>{d.tipo}</strong>{agrupar === 'trimestre' && <div style={{ fontSize: '11px', color: t.subtle }}>{MESES_LONGOS[d.mes - 1]}</div>}</td>
                  <td style={c.td}>{d.nome ? (d.caminho ? <button onClick={() => abrirFicheiro(d.caminho)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '12.5px', color: t.accentText, fontWeight: 600, fontFamily: 'inherit', textAlign: 'left' }}>📄 {d.nome}</button> : <span style={{ fontSize: '12.5px' }}>📄 {d.nome}</span>) : <span style={{ color: t.subtle, fontSize: '12.5px' }}>ainda não enviado</span>}
                    {d.data && <div style={{ fontSize: '11px', color: t.subtle }}>{d.enviadoPor === 'cliente' ? 'enviado pelo cliente' : 'carregado pela equipa'}</div>}</td>
                  <td style={{ ...c.td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {modoCliente || d.estado === 'em_falta' ? (
                      d.estado === 'em_falta' ? (
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <Chip tom="erro">Em falta</Chip>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: t.accentText }}>Enviar</span>
                          <input type="file" style={{ display: 'none' }} onChange={e => { const fx = e.target.files?.[0]; e.target.value = ''; if (fx) acoes.carregarDocumento({ clienteId: cliente.id, ano: d.ano, mes: d.mes, tipo: d.tipo, ficheiro: fx }) }} />
                        </label>
                      ) : <Chip tom={ESTADOS_DOC[d.estado].tom}>{ESTADOS_DOC[d.estado].rotulo}</Chip>
                    ) : (
                      <select value={d.estado} onChange={e => acoes.atualizarDocumento(d.id, { estado: e.target.value })}
                        style={{ ...c.input, width: 'auto', padding: '5px 8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                        {Object.entries(ESTADOS_DOC).map(([k, v]) => <option key={k} value={k}>{v.rotulo}</option>)}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Cartao>
      ))}
    </div>
  )
}
