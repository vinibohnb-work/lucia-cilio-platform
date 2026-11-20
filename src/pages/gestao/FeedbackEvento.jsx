import { useState, useEffect, useCallback } from 'react'
import QRCode from 'qrcode'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import { dataCurta } from '../../lib/formato'
import { Cartao, Botao, Chip, Vazio, useCampos } from '../../portal/ui'
import { PERGUNTAS_FEEDBACK, linkFeedback, mensagemFeedback } from '../../data/feedbackEvento'

// Feedback dos participantes de um evento (pedido da Letícia, 13/11; migração 062).
// A Lúcia abre o formulário quando quiser (no fim do evento, por exemplo); o link
// vai para os participantes por WhatsApp ou e-mail, o QR pode ser projetado no fecho
// e a landing mostra o botão enquanto estiver aberto. As respostas são anónimas.

const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0)

export default function FeedbackEvento({ evento, alterar, avisar }) {
  const { t } = useTheme()
  const c = useCampos()
  const [respostas, setRespostas] = useState([])
  const [qr, setQr] = useState('')
  const [verTodos, setVerTodos] = useState(false)
  const link = linkFeedback(evento.id)

  const carregar = useCallback(async () => {
    const { data, error } = await supabase.from('evento_feedback').select('id, respostas, comentario, created_at')
      .eq('evento_id', evento.id).order('created_at', { ascending: false })
    if (!error) setRespostas(data || [])
  }, [evento.id])
  useEffect(() => { carregar() }, [carregar])
  useEffect(() => {
    let vivo = true
    QRCode.toDataURL(link, { width: 520, margin: 2, color: { dark: '#0E3D33', light: '#FFFFFF' } }).then(u => { if (vivo) setQr(u) })
    return () => { vivo = false }
  }, [link])

  async function copiar(texto, ok) {
    try { await navigator.clipboard.writeText(texto); avisar('ok', ok) }
    catch { window.prompt('Copie o texto:', texto) }
  }
  async function apagar(r) {
    if (!window.confirm('Apagar esta resposta? Use só para respostas de teste ou abusivas.')) return
    const { error, count } = await supabase.from('evento_feedback').delete({ count: 'exact' }).eq('id', r.id)
    if (error || count === 0) { avisar('erro', 'Não foi possível apagar a resposta.'); return }
    setRespostas(rs => rs.filter(x => x.id !== r.id))
  }

  const total = respostas.length
  const linhas = PERGUNTAS_FEEDBACK.map(([k, texto]) => {
    const sim = respostas.filter(r => r.respostas?.[k] === true).length
    const nao = respostas.filter(r => r.respostas?.[k] === false).length
    return { k, texto, sim, nao, respondidas: sim + nao }
  })
  const comentarios = respostas.filter(r => r.comentario)
  const mostrar = verTodos ? comentarios : comentarios.slice(0, 5)
  const th = { ...c.th, textTransform: 'uppercase', letterSpacing: '.04em' }
  const num = { ...c.td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }
  const ligacao = { color: t.accentText, fontWeight: 700, fontSize: '13px', textDecoration: 'none' }

  return (
    <Cartao titulo="Feedback dos participantes" semPadding
      acao={<Chip tom={evento.feedback_aberto ? 'ok' : 'neutro'} forte={evento.feedback_aberto}>{evento.feedback_aberto ? 'Formulário aberto' : 'Formulário fechado'}</Chip>}>
      <div style={{ padding: '0 20px 18px', display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '0 0 auto', textAlign: 'center' }}>
          {qr && <img src={qr} alt={`QR code do formulário de feedback de ${evento.nome}`} width="160" height="160" style={{ display: 'block', borderRadius: '12px', border: `1px solid ${t.cardBorder}`, background: '#fff', opacity: evento.feedback_aberto ? 1 : 0.45 }} />}
          {qr && <a href={qr} download={`qr-feedback-${evento.id}.png`} style={{ display: 'inline-block', marginTop: '8px', ...ligacao }}>Descarregar o QR (PNG)</a>}
        </div>
        <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ margin: 0, fontSize: '13.5px', color: t.text, lineHeight: 1.5 }}>
            O formulário "A tua opinião é importante!": seis perguntas de sim ou não e uma sugestão. As respostas são anónimas.
            Enquanto estiver aberto, aparece na landing do evento e qualquer pessoa com o link responde.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {evento.feedback_aberto
              ? <Botao onClick={() => alterar({ feedback_aberto: false }, 'Formulário de feedback fechado. Já não recebe respostas.')}>Fechar o formulário</Botao>
              : <Botao variante="primario" onClick={() => alterar({ feedback_aberto: true }, 'Formulário de feedback aberto. Já pode enviar o link.')}>Abrir o formulário</Botao>}
            <Botao onClick={() => copiar(link, 'Link do formulário copiado.')}>Copiar o link</Botao>
            <Botao onClick={() => copiar(mensagemFeedback(evento.nome, evento.id), 'Mensagem copiada. Cole no WhatsApp ou no e-mail.')}>Copiar mensagem para enviar</Botao>
            <a href={link} target="_blank" rel="noopener noreferrer" style={ligacao}>Abrir o formulário ↗</a>
          </div>
          {!evento.feedback_aberto && total === 0 && <span style={{ fontSize: '12px', color: t.subtle }}>Abra o formulário antes de enviar o link: fechado, quem o abrir vê "formulário fechado".</span>}
        </div>
      </div>

      {total === 0
        ? <div style={{ padding: '0 20px 20px' }}><Vazio>Ainda sem respostas.</Vazio></div>
        : (
          <>
            <div style={{ padding: '0 20px 10px', fontSize: '13px', color: t.textMuted }}>
              <strong style={{ fontSize: '20px', color: t.heading }}>{total}</strong> {total === 1 ? 'resposta' : 'respostas'}
            </div>
            <div className="table-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>Pergunta</th><th style={{ ...th, textAlign: 'right' }}>Sim</th><th style={{ ...th, textAlign: 'right' }}>Não</th><th style={{ ...th, width: '34%' }}>% de sim</th></tr></thead>
                <tbody>
                  {linhas.map((l, i) => (
                    <tr key={l.k}>
                      <td style={{ ...c.td, color: t.heading }}>{i + 1}. {l.texto}</td>
                      <td style={num}>{l.sim}</td>
                      <td style={num}>{l.nao}</td>
                      <td style={c.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ flex: 1, height: '8px', borderRadius: '8px', background: t.trackBg, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct(l.sim, l.respondidas)}%`, background: t.bar1, borderRadius: '8px' }} />
                          </div>
                          <strong style={{ fontVariantNumeric: 'tabular-nums', color: t.heading, minWidth: '42px', textAlign: 'right' }}>{l.respondidas ? `${pct(l.sim, l.respondidas)} %` : '—'}</strong>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '16px 20px 18px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: t.textMuted, marginBottom: '10px' }}>O que poderíamos melhorar ({comentarios.length})</div>
              {comentarios.length === 0 ? <Vazio>Ninguém deixou sugestões.</Vazio> : (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '10px' }}>
                  {mostrar.map(r => (
                    <li key={r.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', fontSize: '13.5px', color: t.text, borderBottom: `1px solid ${t.rowBorder}`, paddingBottom: '10px' }}>
                      <span style={{ flex: '0 0 auto', fontSize: '12px', color: t.subtle, fontVariantNumeric: 'tabular-nums', paddingTop: '2px' }}>{dataCurta(r.created_at.slice(0, 10))}</span>
                      <span style={{ flex: 1, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{r.comentario}</span>
                      <button onClick={() => apagar(r)} aria-label="Apagar esta resposta" title="Apagar esta resposta" className="lc-compacto"
                        style={{ background: 'none', border: 'none', color: t.subtle, cursor: 'pointer', fontSize: '14px', padding: '4px 6px' }}>✕</button>
                    </li>
                  ))}
                </ul>
              )}
              {comentarios.length > 5 && <div style={{ marginTop: '10px' }}><Botao variante="fantasma" onClick={() => setVerTodos(v => !v)}>{verTodos ? 'Ver menos' : `Ver todas (${comentarios.length})`}</Botao></div>}
            </div>
          </>
        )}
    </Cartao>
  )
}
