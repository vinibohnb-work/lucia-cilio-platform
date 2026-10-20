import { useState, useEffect } from 'react'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'

// Notas internas de um caso ESG — a "caixa de comentários" pedida a 15/10.
// Vivem na tabela esg_interno (migração 046), que só a administradora lê: nunca
// aparecem ao cliente, no modo apresentação nem no relatório. Gravam ao sair do campo.
export default function NotasInternasESG({ casoId }) {
  const { lang } = useLang()
  const { t } = useTheme()
  const [aberto, setAberto] = useState(false)
  const [notas, setNotas] = useState(null)       // null = ainda por ler
  const [rascunho, setRascunho] = useState(null)
  const [estado, setEstado] = useState('')

  const L = lang === 'de' ? { titulo: 'Interne Notizen', sub: 'Nur für das Team — erscheinen weder beim Kunden, noch in der Präsentation, noch im Bericht.', ph: 'Gesprächseindrücke, nächste Schritte, offene Fragen…', ok: 'Gespeichert ✓', erro: 'Speichern fehlgeschlagen (Migration 046 nötig?)' }
    : lang === 'en' ? { titulo: 'Internal notes', sub: 'Team only — never shown to the client, in presentation mode or in the report.', ph: 'Meeting impressions, next steps, open questions…', ok: 'Saved ✓', erro: 'Save failed (migration 046 needed?)' }
    : { titulo: 'Notas internas', sub: 'Só da equipa — não aparecem ao cliente, no modo apresentação nem no relatório.', ph: 'Impressões das reuniões, próximos passos, dúvidas…', ok: 'Guardado ✓', erro: 'Falha ao guardar (falta a migração 046?)' }

  useEffect(() => {
    if (!aberto || notas !== null) return
    let vivo = true
    supabase.from('esg_interno').select('notas').eq('consultoria_id', casoId).maybeSingle()
      .then(({ data }) => { if (vivo) setNotas(data?.notas || '') })
    return () => { vivo = false }
  }, [aberto, notas, casoId])

  async function gravar() {
    if (rascunho === null || rascunho === notas) { setRascunho(null); return }
    const valor = rascunho
    setNotas(valor); setRascunho(null)
    const { error } = await supabase.from('esg_interno')
      .upsert({ consultoria_id: casoId, notas: valor, updated_at: new Date().toISOString() }, { onConflict: 'consultoria_id' })
    setEstado(error ? L.erro : L.ok)
    setTimeout(() => setEstado(''), 2500)
  }

  return (
    <section style={{ marginTop: '22px', borderTop: `1px dashed ${t.cardBorder}`, paddingTop: '14px' }}>
      <button type="button" onClick={() => setAberto(a => !a)} aria-expanded={aberto}
        style={{ background: 'none', border: 'none', padding: '6px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: t.heading, fontWeight: 800, fontSize: '13px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
        {L.titulo} <span aria-hidden="true" style={{ color: t.subtle }}>{aberto ? '▾' : '▸'}</span>
        {estado && <span style={{ fontSize: '11.5px', fontWeight: 700, color: estado === L.ok ? t.pos : t.neg }}>{estado}</span>}
      </button>
      {aberto && (
        <div>
          <p style={{ margin: '0 0 8px', fontSize: '12px', color: t.subtle }}>{L.sub}</p>
          <textarea rows={5} value={rascunho ?? notas ?? ''} disabled={notas === null} placeholder={L.ph} aria-label={L.titulo}
            onChange={e => setRascunho(e.target.value)} onBlur={gravar}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '10px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '13px', lineHeight: 1.5, fontFamily: t.fontBody, resize: 'vertical' }} />
        </div>
      )}
    </section>
  )
}
