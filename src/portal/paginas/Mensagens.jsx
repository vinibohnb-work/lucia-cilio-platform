import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { usePortal } from '../dados'
import { Titulo, Cartao, Ic, Botao, Janela } from '../ui'
import { fmtData, iso } from '../regras'
import { naoLidas, clienteEmCurso } from '../seletores'
import { Chat, CompositorWhatsApp } from '../partes/Comunicacao'

// Caixa de mensagens de todos os clientes (documento, secção 7).
// 13-D (13/10): sem os avatares com iniciais (decorativos, como na ficha); os
// inativos saem da lista (a não ser que tenham mensagens por ler, para nada se
// perder); os clientes sem conversa ficam no fim, em "Outros clientes (N)",
// para se poder começar uma.

export default function Mensagens() {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const s = usePortal()
  const navigate = useNavigate()
  const ultima = (cid) => s.mensagens.filter(m => m.clienteId === cid).sort((a, b) => b.data.localeCompare(a.data))[0]
  const lista = s.clientes.filter(x => clienteEmCurso(x) || naoLidas(s, x.id).length > 0)
  const conversas = lista.filter(x => ultima(x.id))
    .sort((a, b) => (naoLidas(s, b.id).length - naoLidas(s, a.id).length) || ultima(b.id).data.localeCompare(ultima(a.id).data))
  const outros = lista.filter(x => !ultima(x.id))
  const [sel, setSel] = useState(conversas[0]?.id || outros[0]?.id)
  const [verOutros, setVerOutros] = useState(!conversas.length)
  const [whats, setWhats] = useState(false)
  const cli = s.clientes.find(x => x.id === sel)

  const Linha = ({ x }) => {
    const u = ultima(x.id); const n = naoLidas(s, x.id).length
    return (
      <button onClick={() => setSel(x.id)} style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%', textAlign: 'left', padding: '12px 14px', border: 'none', borderBottom: `1px solid ${t.rowBorder}`, background: sel === x.id ? t.softCardBg : 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'flex', gap: '6px' }}>
            <strong style={{ fontSize: '13px', color: t.heading, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{x.nome}</strong>
            <span style={{ fontSize: '11px', color: t.subtle }}>{u ? fmtData(iso(new Date(u.data))).slice(0, 6) : ''}</span>
          </span>
          {u && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: n ? t.heading : t.subtle, fontWeight: n ? 700 : 400, minWidth: 0 }}>
              {u.de === 'equipa' && <span style={{ flex: 'none' }}>Tu:</span>}
              {!u.texto && u.anexo && <Ic.clip size={12} />}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.texto || u.anexo?.nome}</span>
            </span>
          )}
        </span>
        {n > 0 && <span style={{ flex: 'none', fontSize: '11px', fontWeight: 800, padding: '1px 7px', borderRadius: '20px', background: '#c0392b', color: '#fff' }}>{n}</span>}
      </button>
    )
  }

  return (
    <div>
      <Titulo titulo="Mensagens" />
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '320px 1fr', gap: '16px', alignItems: 'start' }}>
        <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: '14px', overflow: 'hidden' }}>
          {conversas.map(x => <Linha key={x.id} x={x} />)}
          {outros.length > 0 && (
            <button onClick={() => setVerOutros(v => !v)} aria-expanded={verOutros}
              style={{ display: 'flex', width: '100%', alignItems: 'center', padding: '10px 14px', border: 'none', borderBottom: verOutros ? `1px solid ${t.rowBorder}` : 'none', background: t.softCardBg, color: t.textMuted, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
              <span style={{ flex: 1 }}>Outros clientes ({outros.length})</span>
              <span aria-hidden>{verOutros ? '▴' : '▾'}</span>
            </button>
          )}
          {verOutros && outros.map(x => <Linha key={x.id} x={x} />)}
        </div>
        {cli && (
          <Cartao titulo={cli.nome} icone={<Ic.mensagens />} acao={
            <div style={{ display: 'flex', gap: '8px' }}>
              <Botao variante="whats" onClick={() => setWhats(true)}><Ic.whats size={15} />WhatsApp</Botao>
              <Botao variante="fantasma" onClick={() => navigate(`/gestao/clientes/${cli.id}`)}>Página do cliente →</Botao>
            </div>}>
            <Chat key={cli.id} clienteId={cli.id} como="equipa" />
          </Cartao>
        )}
      </div>
      {whats && cli && <Janela titulo={`WhatsApp · ${cli.nome}`} aoFechar={() => setWhats(false)}><CompositorWhatsApp clienteId={cli.id} aoEnviar={() => setWhats(false)} /></Janela>}
    </div>
  )
}
