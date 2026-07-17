import { useState, useEffect, useCallback } from 'react'
import { useLang } from '../context/LangContext'
import { useTheme } from '../context/ThemeContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { supabase } from '../lib/supabase'
import { useEffectiveUserId } from '../context/ViewAsContext'

const KIND_STYLE = {
  note:           { bg: '#f1f5f9', ink: '#475569' },
  meeting:        { bg: '#ede9fe', ink: '#5b21b6' },
  recommendation: { bg: '#fffbeb', ink: '#92400e' },
  report:         { bg: '#e8f0fb', ink: '#1e60c8' },
}

// Lado do cliente: notas/recomendações/relatórios partilhados pela consultora.
export default function Consultoria() {
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const eid = useEffectiveUserId()

  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  const L = lang === 'de' ? {
    eyebrow: 'Beratung', title: 'Beratung & Berichte',
    subtitle: 'Notizen, Empfehlungen und Berichte, die Ihre Beraterin mit Ihnen geteilt hat.',
    note: 'Notiz', meeting: 'Besprechung', recommendation: 'Empfehlung', report: 'Bericht', open: 'Öffnen ↗',
    loading: 'Wird geladen…', empty: 'Noch keine geteilten Einträge.',
  } : lang === 'en' ? {
    eyebrow: 'Consulting', title: 'Consulting & Reports',
    subtitle: 'Notes, recommendations and reports your consultant shared with you.',
    note: 'Note', meeting: 'Meeting', recommendation: 'Recommendation', report: 'Report', open: 'Open ↗',
    loading: 'Loading…', empty: 'No shared entries yet.',
  } : {
    eyebrow: 'Consultoria', title: 'Consultoria & Relatórios',
    subtitle: 'Notas, recomendações e relatórios que a tua consultora partilhou contigo.',
    note: 'Nota', meeting: 'Reunião', recommendation: 'Recomendação', report: 'Relatório', open: 'Abrir ↗',
    loading: 'A carregar…', empty: 'Ainda não há registos partilhados.',
  }
  const kindLabel = { note: L.note, meeting: L.meeting, recommendation: L.recommendation, report: L.report }

  const load = useCallback(async () => {
    if (!eid) return
    setLoading(true)
    const { data } = await supabase.from('consulting_notes').select('*').eq('user_id', eid).order('created_at', { ascending: false })
    setNotes(data || [])
    setLoading(false)
  }, [eid])
  useEffect(() => { load() }, [load])

  const fmtDate = (d) => new Date(d).toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-GB' : 'pt-PT')
  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px' }

  if (loading) return <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.loading}</div>

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody, maxWidth: '780px' }}>
      <div style={{ marginBottom: '22px' }}>
        <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accent }}>{L.eyebrow}</div>
        <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '28px' : '38px', lineHeight: 1, letterSpacing: '-.5px', color: t.heading }}>{L.title}</h1>
        <p style={{ fontSize: '13px', color: t.textMuted, margin: '8px 0 0' }}>{L.subtitle}</p>
      </div>

      {notes.length === 0 && <div style={{ padding: '30px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>{L.empty}</div>}

      {notes.map(n => {
        const ks = KIND_STYLE[n.kind] || KIND_STYLE.note
        return (
          <div key={n.id} style={{ ...card, padding: '16px 20px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap', marginBottom: n.body || n.link_url ? '9px' : 0 }}>
              <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 700, background: ks.bg, color: ks.ink, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{kindLabel[n.kind]}</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: t.heading }}>{n.title}</span>
              <span style={{ fontSize: '11px', color: t.subtle, marginLeft: 'auto' }}>{fmtDate(n.created_at)}</span>
            </div>
            {n.body && <p style={{ margin: 0, fontSize: '13px', color: t.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{n.body}</p>}
            {n.link_url && <a href={n.link_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '8px', fontSize: '12.5px', fontWeight: 700, color: t.accent, textDecoration: 'none' }}>{L.open}</a>}
          </div>
        )
      })}
    </div>
  )
}
