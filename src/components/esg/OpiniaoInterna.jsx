import { useState, useEffect } from 'react'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useAlvoESG } from '../../context/AlvoESGContext'

// "Do lado direito, uma caixa aberta para nós pormos a nossa opinião" (Lúcia,
// 15/10): o que a equipa acha que se pode fazer ou não, antes de começar. É
// interna, como as notas: vive em esg_interno.opiniao[chave] (migração 047), que
// só a administradora lê. Na área do cliente e no "Ver como" não aparece.
export default function OpiniaoInterna({ chave }) {
  const { lang } = useLang()
  const { t } = useTheme()
  const { isAdmin } = useAuth()
  const { id: cid, soLeitura } = useAlvoESG()
  const [valor, setValor] = useState(null)
  const [rascunho, setRascunho] = useState(null)
  const [erro, setErro] = useState('')
  const mostrar = isAdmin && !soLeitura

  const L = lang === 'de' ? { rot: 'Unsere Einschätzung (intern)', ph: 'Was wir hier tun können — und was nicht…', erro: 'Speichern fehlgeschlagen.' }
    : lang === 'en' ? { rot: 'Our view (internal)', ph: 'What we think can be done here — and what cannot…', erro: 'Save failed.' }
    : { rot: 'A nossa opinião (interna)', ph: 'O que achamos que se pode fazer aqui — e o que não…', erro: 'Falha ao guardar.' }

  useEffect(() => {
    if (!mostrar) return
    let vivo = true
    supabase.from('esg_interno').select('opiniao').eq('consultoria_id', cid).maybeSingle()
      .then(({ data }) => { if (vivo) setValor(data?.opiniao?.[chave] || '') })
    return () => { vivo = false }
  }, [mostrar, cid, chave])

  async function gravar() {
    if (rascunho === null || rascunho === valor) { setRascunho(null); return }
    const novo = rascunho
    setValor(novo); setRascunho(null); setErro('')
    // Lê a linha antes de gravar, para não apagar a opinião de outra reunião
    const { data } = await supabase.from('esg_interno').select('opiniao').eq('consultoria_id', cid).maybeSingle()
    const { error } = await supabase.from('esg_interno')
      .upsert({ consultoria_id: cid, opiniao: { ...(data?.opiniao || {}), [chave]: novo }, updated_at: new Date().toISOString() }, { onConflict: 'consultoria_id' })
    if (error) setErro(L.erro)
  }

  if (!mostrar || valor === null) return null
  return (
    <label style={{ display: 'block', minWidth: 0 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: t.textMuted, marginBottom: '4px' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
        {L.rot}
      </span>
      <textarea rows={5} value={rascunho ?? valor} placeholder={L.ph} onChange={e => setRascunho(e.target.value)} onBlur={gravar}
        style={{ width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: '9px', border: `1px dashed ${t.inputBorder}`, background: t.softCardBg, color: t.heading, fontSize: '13px', lineHeight: 1.5, fontFamily: t.fontBody, resize: 'vertical' }} />
      {erro && <span role="alert" style={{ fontSize: '12px', color: t.neg }}>{erro}</span>}
    </label>
  )
}
