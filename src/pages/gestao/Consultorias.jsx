import { useState, useEffect, useCallback } from 'react'
import { useLang } from '../../context/LangContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { listUsers } from '../../lib/adminApi'

const KIND_STYLE = {
  note:           { bg: '#f1f5f9', ink: '#475569' },
  recommendation: { bg: '#fffbeb', ink: '#92400e' },
  report:         { bg: '#e8f0fb', ink: '#1e60c8' },
}
const EMPTY = { kind: 'note', title: '', body: '', link_url: '' }

export default function Consultorias() {
  const { lang } = useLang()
  const { user } = useAuth()
  const { t } = useTheme()
  const isMobile = useIsMobile()

  const [clients, setClients] = useState([])
  const [selected, setSelected] = useState('')
  const [notes, setNotes] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const L = lang === 'de' ? {
    eyebrow: 'Verwaltung', title: 'Beratungen',
    subtitle: 'Notizen, Empfehlungen und Berichte je Mandant — der Mandant sieht sie in seiner Plattform.',
    client: 'Mandant', selectClient: '— Mandant wählen —', new: '+ Neuer Eintrag',
    kind: 'Typ', note: 'Notiz', recommendation: 'Empfehlung', report: 'Bericht',
    titleL: 'Titel', body: 'Inhalt', link: 'Link (optional)', linkPh: 'https://…',
    save: 'Speichern', del: 'Löschen', open: 'Öffnen ↗', loading: 'Wird geladen…',
    empty: 'Noch keine Einträge für diesen Mandanten.', pick: 'Wählen Sie einen Mandanten, um die Einträge zu sehen.',
    confirmDel: 'Eintrag wirklich löschen?', saveErr: 'Speichern fehlgeschlagen (Migration 017 nötig).',
  } : lang === 'en' ? {
    eyebrow: 'Management', title: 'Consulting',
    subtitle: 'Notes, recommendations and reports per client — the client sees them in their platform.',
    client: 'Client', selectClient: '— Select client —', new: '+ New entry',
    kind: 'Type', note: 'Note', recommendation: 'Recommendation', report: 'Report',
    titleL: 'Title', body: 'Content', link: 'Link (optional)', linkPh: 'https://…',
    save: 'Save', del: 'Delete', open: 'Open ↗', loading: 'Loading…',
    empty: 'No entries for this client yet.', pick: 'Select a client to see the entries.',
    confirmDel: 'Delete this entry?', saveErr: 'Save failed (migration 017 required).',
  } : {
    eyebrow: 'Gestão', title: 'Consultorias',
    subtitle: 'Notas, recomendações e relatórios por cliente — o cliente vê-os na plataforma dele.',
    client: 'Cliente', selectClient: '— Selecionar cliente —', new: '+ Novo registo',
    kind: 'Tipo', note: 'Nota', recommendation: 'Recomendação', report: 'Relatório',
    titleL: 'Título', body: 'Conteúdo', link: 'Ligação (opcional)', linkPh: 'https://…',
    save: 'Guardar', del: 'Eliminar', open: 'Abrir ↗', loading: 'A carregar…',
    empty: 'Ainda não há registos para este cliente.', pick: 'Seleciona um cliente para veres os registos.',
    confirmDel: 'Eliminar este registo?', saveErr: 'Falha ao guardar (é necessária a migração 017).',
  }
  const kindLabel = { note: L.note, recommendation: L.recommendation, report: L.report }

  useEffect(() => {
    (async () => {
      try { setClients((await listUsers()).filter(u => u.role !== 'admin')) } catch (e) { setErr(e.message) }
      setLoading(false)
    })()
  }, [])

  const loadNotes = useCallback(async () => {
    if (!selected) { setNotes([]); return }
    const { data, error } = await supabase.from('consulting_notes').select('*').eq('user_id', selected).order('created_at', { ascending: false })
    if (error) setErr(L.saveErr)
    else setNotes(data || [])
  }, [selected]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadNotes() }, [loadNotes])

  async function addNote() {
    if (!selected || !form.title) return
    setSaving(true); setErr('')
    const { error } = await supabase.from('consulting_notes').insert({
      user_id: selected, author_id: user?.id, kind: form.kind,
      title: form.title, body: form.body || null, link_url: form.link_url || null,
    })
    setSaving(false)
    if (error) { setErr(L.saveErr); return }
    setForm(EMPTY); setShowForm(false); loadNotes()
  }
  async function removeNote(id) {
    if (!window.confirm(L.confirmDel)) return
    setNotes(prev => prev.filter(n => n.id !== id))
    const { error } = await supabase.from('consulting_notes').delete().eq('id', id)
    if (error) { setErr(L.saveErr); loadNotes() }
  }

  const fmtDate = (d) => new Date(d).toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-GB' : 'pt-PT')
  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px' }
  const inputStyle = { padding: '9px 11px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, fontSize: '13px', background: t.inputBg, color: t.heading, outline: 'none', width: '100%', boxSizing: 'border-box' }

  if (loading) return <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.loading}</div>

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody, maxWidth: '860px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accent }}>{L.eyebrow}</div>
          <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '28px' : '38px', lineHeight: 1, letterSpacing: '-.5px', color: t.heading }}>{L.title}</h1>
          <p style={{ fontSize: '13px', color: t.textMuted, margin: '8px 0 0', maxWidth: '520px' }}>{L.subtitle}</p>
        </div>
        {selected && (
          <button onClick={() => { setShowForm(v => !v); setForm(EMPTY) }} style={{ padding: '10px 18px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>{L.new}</button>
        )}
      </div>

      {err && <div style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '10px', padding: '11px 15px', fontSize: '12.5px', fontWeight: 600, marginBottom: '14px' }}>{err}</div>}

      {/* Seletor de cliente */}
      <div style={{ ...card, padding: '15px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: t.textMuted }}>{L.client}:</span>
        <select value={selected} onChange={e => setSelected(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: '260px', cursor: 'pointer' }}>
          <option value="">{L.selectClient}</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.display_name || c.email}</option>)}
        </select>
      </div>

      {/* Novo registo */}
      {showForm && selected && (
        <div style={{ ...card, border: `2px solid ${t.accent}`, padding: '18px 20px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '150px 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '6px' }}>{L.kind}</div>
              <select value={form.kind} onChange={e => setForm(f => ({ ...f, kind: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="note">{L.note}</option>
                <option value="recommendation">{L.recommendation}</option>
                <option value="report">{L.report}</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '6px' }}>{L.titleL}</div>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '6px' }}>{L.body}</div>
            <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={5} style={{ ...inputStyle, resize: 'vertical', fontFamily: t.fontBody, lineHeight: 1.5 }} />
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '6px' }}>{L.link}</div>
              <input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} placeholder={L.linkPh} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={addNote} disabled={saving} style={{ padding: '9px 18px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '9px', fontWeight: 700, fontSize: '13px', cursor: saving ? 'wait' : 'pointer' }}>{saving ? '…' : L.save}</button>
              <button onClick={() => setShowForm(false)} style={{ padding: '9px 12px', background: t.segBg, border: `1px solid ${t.segBorder}`, borderRadius: '9px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: t.textMuted }}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      {!selected && <div style={{ padding: '30px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>{L.pick}</div>}
      {selected && notes.length === 0 && <div style={{ padding: '30px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>{L.empty}</div>}
      {selected && notes.map(n => {
        const ks = KIND_STYLE[n.kind] || KIND_STYLE.note
        return (
          <div key={n.id} style={{ ...card, padding: '16px 20px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap', marginBottom: n.body || n.link_url ? '9px' : 0 }}>
              <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 700, background: ks.bg, color: ks.ink, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{kindLabel[n.kind]}</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: t.heading }}>{n.title}</span>
              <span style={{ fontSize: '11px', color: t.subtle, marginLeft: 'auto' }}>{fmtDate(n.created_at)}</span>
              <button onClick={() => removeNote(n.id)} title={L.del} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: t.subtle, padding: '2px', lineHeight: 1 }}>✕</button>
            </div>
            {n.body && <p style={{ margin: 0, fontSize: '13px', color: t.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{n.body}</p>}
            {n.link_url && <a href={n.link_url} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '8px', fontSize: '12.5px', fontWeight: 700, color: t.accent, textDecoration: 'none' }}>{L.open}</a>}
          </div>
        )
      })}
    </div>
  )
}
