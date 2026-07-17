import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useViewAs } from '../../context/ViewAsContext'
import { supabase } from '../../lib/supabase'
import { listUsers } from '../../lib/adminApi'
import { ESG_QUESTIONS, ESG_TOTAL } from '../../data/esgQuestions'
import { isAnswered } from '../../lib/esgKpis'
import { overheadPerHour, computePlanTotals, famvCheck } from '../../lib/planCalc'

const fmt = (n) => `€ ${(Number(n) || 0).toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const KIND_STYLE = {
  note:           { bg: '#f1f5f9', ink: '#475569' },
  meeting:        { bg: '#ede9fe', ink: '#5b21b6' },
  recommendation: { bg: '#fffbeb', ink: '#92400e' },
  report:         { bg: '#e8f0fb', ink: '#1e60c8' },
}
const EMPTY = { kind: 'meeting', title: '', body: '', link_url: '' }

// Ficha interna do cliente (Gestão): resumo de dados + histórico de consultoria.
export default function ClienteDetalhe() {
  const { id } = useParams()
  const { lang } = useLang()
  const { user } = useAuth()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const { setViewAs } = useViewAs()

  const [client, setClient] = useState(null)
  const [stats, setStats] = useState(null)
  const [notes, setNotes] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const L = lang === 'de' ? {
    back: '← Aktive Mandanten', eyebrow: 'Mandantenakte',
    platAcc: 'Buchhaltung', platEsg: 'ESG', active: 'aktiv', pending: 'ausstehend',
    summary: 'Übersicht', revenue: 'Umsatz (Jahr)', balance: 'Saldo', obligations: 'Offene Fristen',
    clientsN: 'Mandanten', esgProgress: 'ESG-Diagnose', refYear: 'Bezugsjahr',
    limitLabel: 'Gewinn / Grenze (Monat)', fromPlan: 'aus Monatsplanung', fromReal: 'Ø real',
    history: 'Beratung & Verlauf', new: '+ Neuer Eintrag',
    kind: 'Typ', note: 'Notiz', meeting: 'Besprechung', recommendation: 'Empfehlung', report: 'Bericht',
    titleL: 'Titel', body: 'Inhalt', link: 'Link (optional)', linkPh: 'https://…',
    save: 'Speichern', del: 'Löschen', open: 'Öffnen ↗', loading: 'Wird geladen…',
    emptyNotes: 'Noch keine Einträge für diesen Mandanten.', notFound: 'Mandant nicht gefunden.',
    confirmDel: 'Eintrag wirklich löschen?', saveErr: 'Speichern fehlgeschlagen (Migration 017/018 nötig).',
    view: 'Vollständige Ansicht',
  } : lang === 'en' ? {
    back: '← Active Clients', eyebrow: 'Client File',
    platAcc: 'Accounting', platEsg: 'ESG', active: 'active', pending: 'pending',
    summary: 'Overview', revenue: 'Revenue (year)', balance: 'Balance', obligations: 'Pending deadlines',
    clientsN: 'Clients', esgProgress: 'ESG assessment', refYear: 'Ref. year',
    limitLabel: 'Profit / limit (month)', fromPlan: 'from Monthly Plan', fromReal: 'real avg.',
    history: 'Consulting & History', new: '+ New entry',
    kind: 'Type', note: 'Note', meeting: 'Meeting', recommendation: 'Recommendation', report: 'Report',
    titleL: 'Title', body: 'Content', link: 'Link (optional)', linkPh: 'https://…',
    save: 'Save', del: 'Delete', open: 'Open ↗', loading: 'Loading…',
    emptyNotes: 'No entries for this client yet.', notFound: 'Client not found.',
    confirmDel: 'Delete this entry?', saveErr: 'Save failed (migration 017/018 required).',
    view: 'Full view',
  } : {
    back: '← Clientes Ativos', eyebrow: 'Ficha do Cliente',
    platAcc: 'Contabilidade', platEsg: 'ESG', active: 'ativo', pending: 'pendente',
    summary: 'Resumo', revenue: 'Receita (ano)', balance: 'Saldo', obligations: 'Obrigações pendentes',
    clientsN: 'Clientes', esgProgress: 'Diagnóstico ESG', refYear: 'Ano ref.',
    limitLabel: 'Lucro / limite (mês)', fromPlan: 'do Planeamento Mensal', fromReal: 'média real',
    history: 'Consultoria & Histórico', new: '+ Novo registo',
    kind: 'Tipo', note: 'Nota', meeting: 'Reunião', recommendation: 'Recomendação', report: 'Relatório',
    titleL: 'Título', body: 'Conteúdo', link: 'Ligação (opcional)', linkPh: 'https://…',
    save: 'Guardar', del: 'Eliminar', open: 'Abrir ↗', loading: 'A carregar…',
    emptyNotes: 'Ainda não há registos para este cliente.', notFound: 'Cliente não encontrado.',
    confirmDel: 'Eliminar este registo?', saveErr: 'Falha ao guardar (é necessária a migração 017/018).',
    view: 'Visualização completa',
  }
  const kindLabel = { note: L.note, meeting: L.meeting, recommendation: L.recommendation, report: L.report }

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    try {
      const users = await listUsers()
      const u = users.find(x => x.id === id) || null
      setClient(u)
      if (u) {
        const [{ data: ce }, { data: fo }, { data: esg }, { data: cl }, { data: cs }, { data: mp }, { data: cn }] = await Promise.all([
          supabase.from('cash_entries').select('type,amount,private,entry_date').eq('user_id', id),
          supabase.from('fiscal_obligations').select('status').eq('user_id', id),
          supabase.from('esg_diagnostics').select('answers,reference_year').eq('user_id', id).maybeSingle(),
          supabase.from('clients').select('id').eq('user_id', id),
          supabase.from('company_settings').select('country,de_famv_limit').eq('user_id', id).maybeSingle(),
          supabase.from('monthly_plans').select('items,monthly_fixed,productive_hours').eq('user_id', id).maybeSingle(),
          supabase.from('consulting_notes').select('*').eq('user_id', id).order('created_at', { ascending: false }),
        ])
        const year = String(new Date().getFullYear())
        const monthsElapsed = new Date().getMonth() + 1
        let revenue = 0, saldo = 0, yearProfit = 0
        ;(ce || []).forEach(e => {
          if (e.private) return
          const amt = Number(e.amount) || 0
          const sign = e.type === 'entrada' ? 1 : -1
          saldo += sign * amt
          if (e.entry_date?.slice(0, 4) === year) { yearProfit += sign * amt; if (e.type === 'entrada') revenue += amt }
        })
        let famv = null
        if (cs?.country === 'DE' && Number(cs.de_famv_limit) > 0) {
          const limit = Number(cs.de_famv_limit)
          const monthlyProfit = mp?.items?.length
            ? computePlanTotals(mp.items, overheadPerHour(mp.monthly_fixed, mp.productive_hours), 0, 'gewinn').profit
            : yearProfit / monthsElapsed
          famv = { ...famvCheck(monthlyProfit, limit), monthlyProfit, limit, fromPlan: !!mp?.items?.length }
        }
        setStats({
          revenue, saldo,
          pending: (fo || []).filter(o => o.status === 'pending').length,
          clients: (cl || []).length,
          esgAnswered: esg ? ESG_QUESTIONS.filter(q => isAnswered(esg.answers, q)).length : null,
          esgYear: esg?.reference_year || null,
          famv,
        })
        setNotes(cn || [])
      }
    } catch (e) { setErr(e.message) }
    setLoading(false)
  }, [id])
  useEffect(() => { load() }, [load])

  async function addNote() {
    if (!form.title) return
    setSaving(true); setErr('')
    const { error } = await supabase.from('consulting_notes').insert({
      user_id: id, author_id: user?.id, kind: form.kind,
      title: form.title, body: form.body || null, link_url: form.link_url || null,
    })
    setSaving(false)
    if (error) { setErr(L.saveErr); return }
    setForm(EMPTY); setShowForm(false); load()
  }
  async function removeNote(nid) {
    if (!window.confirm(L.confirmDel)) return
    setNotes(prev => prev.filter(n => n.id !== nid))
    const { error } = await supabase.from('consulting_notes').delete().eq('id', nid)
    if (error) { setErr(L.saveErr); load() }
  }
  function viewFull() {
    if (!client) return
    setViewAs({ id: client.id, name: client.display_name || client.email, platform: client.platform || 'accounting' })
    navigate(client.platform === 'esg' ? '/esg/diagnostico' : '/contabilidade/dashboard')
  }

  const fmtDate = (d) => new Date(d).toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-GB' : 'pt-PT')
  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px' }
  const inputStyle = { padding: '9px 11px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, fontSize: '13px', background: t.inputBg, color: t.heading, outline: 'none', width: '100%', boxSizing: 'border-box' }
  const miniStat = (label, value, color) => (
    <div style={{ background: t.softCardBg, borderRadius: '11px', padding: '11px 13px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 800, color: color || t.heading, fontFamily: t.fontNum || t.fontDisplay }}>{value}</div>
    </div>
  )

  if (loading) return <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.loading}</div>
  if (!client) return (
    <div style={{ padding: '40px' }}>
      <button onClick={() => navigate('/gestao/clientes')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.accent, fontWeight: 700, fontSize: '13px', padding: 0, marginBottom: '12px' }}>{L.back}</button>
      <div style={{ color: t.subtle, fontSize: '14px' }}>{L.notFound}</div>
    </div>
  )

  const isEsg = client.platform === 'esg'
  const activated = !!client.last_sign_in_at
  const s = stats || {}

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody, maxWidth: '860px' }}>
      <button onClick={() => navigate('/gestao/clientes')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.accent, fontWeight: 700, fontSize: '13px', padding: 0, marginBottom: '14px' }}>{L.back}</button>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '52px', height: '52px', flex: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px', fontWeight: 700, fontFamily: t.fontDisplay, background: t.avatarBg, color: t.avatarInk, border: t.avatarBorder }}>
            {(client.display_name || client.email || 'LC').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, color: t.accent, marginBottom: '3px' }}>{L.eyebrow}</div>
            <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '24px' : '30px', lineHeight: 1.05, color: t.heading }}>{client.display_name || client.email.split('@')[0]}</h1>
            <div style={{ fontSize: '12px', color: t.subtle, marginTop: '3px' }}>{client.email}</div>
          </div>
        </div>
        {activated && (
          <button onClick={viewFull} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', border: 'none', background: t.btnBg, color: t.btnInk, fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
            {L.view}
          </button>
        )}
      </div>

      {/* Chips */}
      <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: isEsg ? '#e8f0fb' : '#eaf5ee', color: isEsg ? '#1e60c8' : '#0a7a3e' }}>{isEsg ? L.platEsg : L.platAcc}</span>
        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: activated ? '#d1fae5' : '#fef3c7', color: activated ? '#065f46' : '#92400e' }}>{activated ? `● ${L.active}` : `○ ${L.pending}`}</span>
      </div>

      {/* Resumo */}
      <div style={{ ...card, padding: '18px 20px', marginBottom: '18px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: t.accent, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '13px' }}>{L.summary}</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '10px' }}>
          {isEsg ? (
            <>
              {miniStat(L.esgProgress, s.esgAnswered != null ? `${s.esgAnswered}/${ESG_TOTAL}` : '—', t.accent)}
              {miniStat(L.refYear, s.esgYear || '—')}
            </>
          ) : (
            <>
              {miniStat(L.revenue, fmt(s.revenue), '#0a7a3e')}
              {miniStat(L.balance, fmt(s.saldo), (s.saldo || 0) >= 0 ? t.heading : t.neg)}
              {miniStat(L.obligations, s.pending || 0, (s.pending || 0) > 0 ? '#b45309' : t.heading)}
              {miniStat(L.clientsN, s.clients || 0)}
            </>
          )}
        </div>
        {s.famv && (() => {
          const pct = Math.round(s.famv.ratio * 100)
          const tone = !s.famv.ok ? { bg: '#fdeaea', ink: '#991b1b', dot: '🔴' } : s.famv.ratio >= 0.8 ? { bg: '#fffbeb', ink: '#92400e', dot: '🟡' } : { bg: '#eaf5ee', ink: '#0a7a3e', dot: '🟢' }
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: tone.bg, borderRadius: '10px', padding: '9px 12px', marginTop: '12px' }}>
              <span style={{ fontSize: '12px' }}>{tone.dot}</span>
              <span style={{ fontSize: '10px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px' }}>{L.limitLabel}</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: tone.ink }}>{fmt(s.famv.monthlyProfit)} / {fmt(s.famv.limit)} · {pct}%</span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: t.subtle }}>({s.famv.fromPlan ? L.fromPlan : L.fromReal})</span>
            </div>
          )
        })()}
      </div>

      {/* Consultoria & Histórico */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: '21px', color: t.heading }}>{L.history}</h2>
        <button onClick={() => { setShowForm(v => !v); setForm(EMPTY) }} style={{ padding: '9px 16px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '9px', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer' }}>{L.new}</button>
      </div>

      {err && <div style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '10px', padding: '11px 15px', fontSize: '12.5px', fontWeight: 600, marginBottom: '12px' }}>{err}</div>}

      {showForm && (
        <div style={{ ...card, border: `2px solid ${t.accent}`, padding: '18px 20px', marginBottom: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '160px 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '6px' }}>{L.kind}</div>
              <select value={form.kind} onChange={e => setForm(f => ({ ...f, kind: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="meeting">{L.meeting}</option>
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

      {notes.length === 0 && !showForm && <div style={{ padding: '26px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>{L.emptyNotes}</div>}
      {notes.map(n => {
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
