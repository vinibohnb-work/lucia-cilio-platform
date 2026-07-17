import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useViewAs } from '../../context/ViewAsContext'
import { supabase } from '../../lib/supabase'
import { listUsers } from '../../lib/adminApi'
import { ESG_QUESTIONS, ESG_TOTAL } from '../../data/esgQuestions'
import { isAnswered } from '../../lib/esgKpis'

const fmt = (n) => `€ ${(Number(n) || 0).toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

export default function ClientesAtivos() {
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const { setViewAs } = useViewAs()

  const [clients, setClients] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    try {
      const users = await listUsers()
      const list = users.filter(u => u.role !== 'admin')
      setClients(list)
      // Indicadores por utilizador (admin lê todas as linhas via RLS)
      const [{ data: ce }, { data: fo }, { data: esg }, { data: cl }] = await Promise.all([
        supabase.from('cash_entries').select('user_id,type,amount,private,entry_date'),
        supabase.from('fiscal_obligations').select('user_id,status'),
        supabase.from('esg_diagnostics').select('user_id,answers,reference_year'),
        supabase.from('clients').select('user_id'),
      ])
      const year = String(new Date().getFullYear())
      const by = {}
      const ensure = (id) => (by[id] ||= { revenue: 0, saldo: 0, pending: 0, clients: 0, esgAnswered: null, esgYear: null })
      ;(ce || []).forEach(e => {
        if (e.private) return
        const b = ensure(e.user_id); const amt = Number(e.amount) || 0
        if (e.type === 'entrada') { b.saldo += amt; if (e.entry_date?.slice(0, 4) === year) b.revenue += amt }
        else b.saldo -= amt
      })
      ;(fo || []).forEach(o => { if (o.status === 'pending') ensure(o.user_id).pending++ })
      ;(cl || []).forEach(c => ensure(c.user_id).clients++)
      ;(esg || []).forEach(d => { const b = ensure(d.user_id); b.esgAnswered = ESG_QUESTIONS.filter(q => isAnswered(d.answers, q)).length; b.esgYear = d.reference_year })
      setStats(by)
    } catch (e) { setErr(e.message) }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const L = lang === 'de' ? {
    eyebrow: 'Verwaltung', title: 'Aktive Mandanten', subtitle: 'Übersicht der Mandanten und Schnellzugang zur vollständigen Ansicht.',
    platAcc: 'Buchhaltung', platEsg: 'ESG', active: 'aktiv', pending: 'ausstehend',
    revenue: 'Umsatz (Jahr)', balance: 'Saldo', obligations: 'Offene Fristen', clientsN: 'Mandanten',
    esgProgress: 'ESG-Diagnose', view: 'Vollständige Ansicht', loading: 'Wird geladen…', empty: 'Noch keine Mandanten.',
    apiHint: 'Benötigt die bereitgestellte Version (Vercel).',
  } : lang === 'en' ? {
    eyebrow: 'Management', title: 'Active Clients', subtitle: 'Overview of clients and quick access to the full view.',
    platAcc: 'Accounting', platEsg: 'ESG', active: 'active', pending: 'pending',
    revenue: 'Revenue (year)', balance: 'Balance', obligations: 'Pending deadlines', clientsN: 'Clients',
    esgProgress: 'ESG assessment', view: 'Full view', loading: 'Loading…', empty: 'No clients yet.',
    apiHint: 'Requires the published version (Vercel).',
  } : {
    eyebrow: 'Gestão', title: 'Clientes Ativos', subtitle: 'Visão geral dos clientes e acesso rápido à visualização completa.',
    platAcc: 'Contabilidade', platEsg: 'ESG', active: 'ativo', pending: 'pendente',
    revenue: 'Receita (ano)', balance: 'Saldo', obligations: 'Obrigações pendentes', clientsN: 'Clientes',
    esgProgress: 'Diagnóstico ESG', view: 'Visualização completa', loading: 'A carregar…', empty: 'Ainda não há clientes.',
    apiHint: 'Requer a versão publicada (Vercel).',
  }

  function viewClient(u) {
    setViewAs({ id: u.id, name: u.display_name || u.email, platform: u.platform || 'accounting' })
    navigate(u.platform === 'esg' ? '/esg/diagnostico' : '/contabilidade/dashboard')
  }

  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '16px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }
  const miniStat = (label, value, color) => (
    <div style={{ background: t.softCardBg, borderRadius: '11px', padding: '11px 13px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 800, color: color || t.heading, fontFamily: t.fontNum || t.fontDisplay }}>{value}</div>
    </div>
  )

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody }}>
      <div style={{ marginBottom: '22px' }}>
        <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accent }}>{L.eyebrow}</div>
        <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '28px' : '38px', lineHeight: 1, letterSpacing: '-.5px', color: t.heading }}>{L.title}</h1>
        <p style={{ fontSize: '13px', color: t.textMuted, margin: '8px 0 0' }}>{L.subtitle}</p>
      </div>

      {err && <div style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '10px', padding: '12px 16px', fontSize: '12.5px', fontWeight: 600, marginBottom: '16px' }}>{err} · {L.apiHint}</div>}
      {loading && <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.loading}</div>}
      {!loading && !err && clients.length === 0 && <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.empty}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {!loading && clients.map(u => {
          const s = stats[u.id] || {}
          const isEsg = u.platform === 'esg'
          const activated = !!u.last_sign_in_at
          return (
            <div key={u.id} style={card}>
              {/* Cabeçalho do cartão */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', flex: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, fontFamily: t.fontDisplay, background: t.avatarBg, color: t.avatarInk, border: t.avatarBorder }}>
                  {(u.display_name || u.email || 'LC').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: t.heading, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.display_name || u.email.split('@')[0]}</div>
                  <div style={{ fontSize: '11.5px', color: t.subtle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                </div>
              </div>

              {/* Chips: plataforma + estado */}
              <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: isEsg ? '#e8f0fb' : '#eaf5ee', color: isEsg ? '#1e60c8' : '#0a7a3e' }}>{isEsg ? L.platEsg : L.platAcc}</span>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: activated ? '#d1fae5' : '#fef3c7', color: activated ? '#065f46' : '#92400e' }}>{activated ? `● ${L.active}` : `○ ${L.pending}`}</span>
              </div>

              {/* Indicadores por plataforma */}
              {isEsg ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {miniStat(L.esgProgress, s.esgAnswered != null ? `${s.esgAnswered}/${ESG_TOTAL}` : '—', t.accent)}
                  {miniStat(lang === 'de' ? 'Bezugsjahr' : lang === 'en' ? 'Ref. year' : 'Ano ref.', s.esgYear || '—')}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {miniStat(L.revenue, fmt(s.revenue), '#0a7a3e')}
                  {miniStat(L.balance, fmt(s.saldo), (s.saldo || 0) >= 0 ? t.heading : t.neg)}
                  {miniStat(L.obligations, s.pending || 0, (s.pending || 0) > 0 ? '#b45309' : t.heading)}
                  {miniStat(L.clientsN, s.clients || 0)}
                </div>
              )}

              {/* Ação: ver como */}
              <button onClick={() => viewClient(u)} style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '10px', border: 'none', background: t.btnBg, color: t.btnInk, fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                {L.view}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
