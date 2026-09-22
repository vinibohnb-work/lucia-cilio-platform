import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useV2 } from '../dados'
import { Titulo, Cartao, Ic, Botao, Janela } from '../ui'
import { fmtData, iniciais } from '../regras'
import { naoLidas } from '../seletores'
import { Chat, CompositorWhatsApp } from '../partes/Comunicacao'

// Caixa de mensagens de todos os clientes (documento, secção 7).

export default function Mensagens() {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const s = useV2()
  const navigate = useNavigate()
  const ultima = (cid) => s.mensagens.filter(m => m.clienteId === cid).sort((a, b) => b.data.localeCompare(a.data))[0]
  const ordem = [...s.clientes].sort((a, b) => (naoLidas(s, b.id).length - naoLidas(s, a.id).length) || (ultima(b.id)?.data || '').localeCompare(ultima(a.id)?.data || ''))
  const [sel, setSel] = useState(ordem[0]?.id)
  const [whats, setWhats] = useState(false)
  const cli = s.clientes.find(x => x.id === sel)

  return (
    <div>
      <Titulo eyebrow="Comunicação" titulo="Mensagens" sub="As conversas com todos os clientes, com histórico e anexos. O WhatsApp abre com o texto já preenchido." />
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '320px 1fr', gap: '16px', alignItems: 'start' }}>
        <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: '14px', overflow: 'hidden' }}>
          {ordem.map(x => {
            const u = ultima(x.id); const n = naoLidas(s, x.id).length
            return (
              <button key={x.id} onClick={() => setSel(x.id)} style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%', textAlign: 'left', padding: '12px 14px', border: 'none', borderBottom: `1px solid ${t.rowBorder}`, background: sel === x.id ? t.softCardBg : 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span style={{ flex: 'none', width: '36px', height: '36px', borderRadius: '50%', background: t.avatarBg, color: t.avatarInk, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700 }}>{iniciais(x.nome)}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', gap: '6px' }}>
                    <strong style={{ fontSize: '13px', color: t.heading, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.nome}</strong>
                    <span style={{ fontSize: '10.5px', color: t.subtle }}>{u ? fmtData(u.data.slice(0, 10)).slice(0, 6) : ''}</span>
                  </span>
                  <span style={{ display: 'block', fontSize: '12px', color: n ? t.heading : t.subtle, fontWeight: n ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u ? `${u.de === 'equipa' ? 'Tu: ' : ''}${u.texto || '📎 ' + u.anexo?.nome}` : 'Sem mensagens'}</span>
                </span>
                {n > 0 && <span style={{ flex: 'none', fontSize: '10.5px', fontWeight: 800, padding: '1px 7px', borderRadius: '20px', background: '#c0392b', color: '#fff' }}>{n}</span>}
              </button>
            )
          })}
        </div>
        {cli && (
          <Cartao titulo={cli.nome} icone={<Ic.mensagens />} acao={
            <div style={{ display: 'flex', gap: '8px' }}>
              <Botao variante="whats" onClick={() => setWhats(true)}><Ic.whats size={15} />WhatsApp</Botao>
              <Botao variante="fantasma" onClick={() => navigate(`/v2/clientes/${cli.id}`)}>Página do cliente →</Botao>
            </div>}>
            <Chat key={cli.id} clienteId={cli.id} como="equipa" />
          </Cartao>
        )}
      </div>
      {whats && cli && <Janela titulo={`WhatsApp · ${cli.nome}`} aoFechar={() => setWhats(false)}><CompositorWhatsApp clienteId={cli.id} aoEnviar={() => setWhats(false)} /></Janela>}
    </div>
  )
}
