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
import { overheadPerHour, computePlanTotals, famvCheck } from '../../lib/planCalc'

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
      const [{ data: ce }, { data: fo }, { data: esg }, { data: cl }, { data: cs }, { data: mp }] = await Promise.all([
        supabase.from('cash_entries').select('user_id,type,amount,private,entry_date'),
        supabase.from('fiscal_obligations').select('user_id,status'),
        supabase.from('esg_diagnostics').select('user_id,answers,reference_year'),
        supabase.from('clients').select('user_id'),
        supabase.from('company_settings').select('user_id,country,de_famv_limit'),
        supabase.from('monthly_plans').select('user_id,items,monthly_fixed,productive_hours'),
      ])
      const year = String(new Date().getFullYear())
      const monthsElapsed = new Date().getMonth() + 1
      const by = {}
      const ensure = (id) => (by[id] ||= { revenue: 0, saldo: 0, yearProfit: 0, pending: 0, clients: 0, esgAnswered: null, esgYear: null, famv: null })
      ;(ce || []).forEach(e => {
        if (e.private) return
        const b = ensure(e.user_id); const amt = Number(e.amount) || 0
        const sign = e.type === 'entrada' ? 1 : -1
        b.saldo += sign * amt
        if (e.entry_date?.slice(0, 4) === year) {
          b.yearProfit += sign * amt
          if (e.type === 'entrada') b.revenue += amt
        }
      })
      ;(fo || []).forEach(o => { if (o.status === 'pending') ensure(o.user_id).pending++ })
      ;(cl || []).forEach(c => ensure(c.user_id).clients++)
      ;(esg || []).forEach(d => { const b = ensure(d.user_id); b.esgAnswered = ESG_QUESTIONS.filter(q => isAnswered(d.answers, q)).length; b.esgYear = d.reference_year })
      // Limite de lucro (Familienversicherung): clientes DE com limite definido.
      // Lucro mensal = Planeamento Mensal (se existir), senão média real do ano.
      const planBy = Object.fromEntries((mp || []).map(p => [p.user_id, p]))
      ;(cs || []).forEach(s => {
        if (s.country !== 'DE') return
        const limit = Number(s.de_famv_limit) || 0
        if (limit <= 0) return
        const b = ensure(s.user_id)
        const p = planBy[s.user_id]
        const monthlyProfit = p?.items?.length
          ? computePlanTotals(p.items, overheadPerHour(p.monthly_fixed, p.productive_hours), 0, 'gewinn').profit
          : b.yearProfit / monthsElapsed
        b.famv = { ...famvCheck(monthlyProfit, limit), monthlyProfit, limit, fromPlan: !!p?.items?.length }
      })
      setStats(by)
    } catch (e) { setErr(e.message) }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const L = lang === 'de' ? {
    eyebrow: 'Verwaltung', title: 'Aktive Mandanten', subtitle: 'Übersicht der Mandanten und Schnellzugang zur vollständigen Ansicht.',
    platAcc: 'Buchhaltung', platEsg: 'ESG', platBoth: 'Buchh. + ESG', active: 'aktiv', pending: 'ausstehend',
    revenue: 'Umsatz (Jahr)', balance: 'Saldo', obligations: 'Offene Fristen', clientsN: 'Mandanten',
    esgProgress: 'ESG-Diagnose', view: 'Vollständige Ansicht', loading: 'Wird geladen…', empty: 'Noch keine Mandanten.',
    apiHint: 'Benötigt die bereitgestellte Version (Vercel).',
    limitLabel: 'Gewinn / Grenze (Monat)', fromPlan: 'aus Monatsplanung', fromReal: 'Ø real',
    file: 'Daten & Verlauf', viewShort: 'Plattform',
    alertTitle: 'Gewinngrenze (Familienversicherung)',
    alertNear: (n, list) => `${n} Mandant(en) nähern sich der Gewinngrenze oder liegen darüber: ${list}`,
  } : lang === 'en' ? {
    eyebrow: 'Management', title: 'Active Clients', subtitle: 'Overview of clients and quick access to the full view.',
    platAcc: 'Accounting', platEsg: 'ESG', platBoth: 'Acc. + ESG', active: 'active', pending: 'pending',
    revenue: 'Revenue (year)', balance: 'Balance', obligations: 'Pending deadlines', clientsN: 'Clients',
    esgProgress: 'ESG assessment', view: 'Full view', loading: 'Loading…', empty: 'No clients yet.',
    apiHint: 'Requires the published version (Vercel).',
    limitLabel: 'Profit / limit (month)', fromPlan: 'from Monthly Plan', fromReal: 'real avg.',
    file: 'Data & History', viewShort: 'Platform',
    alertTitle: 'Profit limit (family insurance)',
    alertNear: (n, list) => `${n} client(s) approaching or above the profit limit: ${list}`,
  } : {
    eyebrow: 'Gestão', title: 'Clientes Ativos', subtitle: 'Visão geral dos clientes e acesso rápido à visualização completa.',
    platAcc: 'Contabilidade', platEsg: 'ESG', platBoth: 'Contab. + ESG', active: 'ativo', pending: 'pendente',
    revenue: 'Receita (ano)', balance: 'Saldo', obligations: 'Obrigações pendentes', clientsN: 'Clientes',
    esgProgress: 'Diagnóstico ESG', view: 'Visualização completa', loading: 'A carregar…', empty: 'Ainda não há clientes.',
    apiHint: 'Requer a versão publicada (Vercel).',
    limitLabel: 'Lucro / limite (mês)', fromPlan: 'do Planeamento Mensal', fromReal: 'média real',
    file: 'Dados & Histórico', viewShort: 'Plataforma',
    alertTitle: 'Limite de lucro (Familienversicherung)',
    alertNear: (n, list) => `${n} cliente(s) a aproximar-se do limite de lucro ou acima dele: ${list}`,
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

      {/* Alerta agregado: clientes ≥80% do limite de lucro (Familienversicherung) */}
      {!loading && (() => {
        const near = clients
          .filter(u => u.platform !== 'esg')
          .map(u => ({ u, famv: stats[u.id]?.famv }))
          .filter(x => x.famv && x.famv.ratio >= 0.8)
          .sort((a, b) => b.famv.ratio - a.famv.ratio)
        if (near.length === 0) return null
        const anyOver = near.some(x => !x.famv.ok)
        const list = near.map(x => `${x.u.display_name || x.u.email.split('@')[0]} (${Math.round(x.famv.ratio * 100)}%)`).join(' · ')
        return (
          <div style={{ background: anyOver ? '#fdeaea' : '#fffbeb', border: `1px solid ${anyOver ? '#f5b5b5' : '#fcd34d'}`, borderRadius: '12px', padding: '13px 17px', marginBottom: '18px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '17px' }}>{anyOver ? '🔴' : '⚠️'}</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: anyOver ? '#991b1b' : '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>{L.alertTitle}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: anyOver ? '#991b1b' : '#92400e', lineHeight: 1.5 }}>{L.alertNear(near.length, list)}</div>
            </div>
          </div>
        )
      })()}

      {loading && <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.loading}</div>}
      {!loading && !err && clients.length === 0 && <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.empty}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {!loading && clients.map(u => {
          const s = stats[u.id] || {}
          const isEsg = u.platform === 'esg'
          const isBoth = u.platform === 'both'
          const showAcc = !isEsg
          const showEsg = isEsg || isBoth
          // Conta ativada = email confirmado ou já entrou (contas seed/demo não têm login prévio)
          const activated = !!(u.last_sign_in_at || u.email_confirmed_at)
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
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: isEsg ? '#e8f0fb' : isBoth ? '#ede9fe' : '#eaf5ee', color: isEsg ? '#1e60c8' : isBoth ? '#5b21b6' : '#0a7a3e' }}>{isEsg ? L.platEsg : isBoth ? L.platBoth : L.platAcc}</span>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: activated ? '#d1fae5' : '#fef3c7', color: activated ? '#065f46' : '#92400e' }}>{activated ? `● ${L.active}` : `○ ${L.pending}`}</span>
              </div>

              {/* Semáforo de limite de lucro (clientes DE de Contabilidade) */}
              {!isEsg && s.famv && (() => {
                const pct = Math.round(s.famv.ratio * 100)
                const tone = !s.famv.ok ? { bg: '#fdeaea', ink: '#991b1b', dot: '🔴' }
                  : s.famv.ratio >= 0.8 ? { bg: '#fffbeb', ink: '#92400e', dot: '🟡' }
                  : { bg: '#eaf5ee', ink: '#0a7a3e', dot: '🟢' }
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: tone.bg, borderRadius: '10px', padding: '9px 12px' }}>
                    <span style={{ fontSize: '12px' }}>{tone.dot}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px' }}>{L.limitLabel}</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: tone.ink }}>
                        {fmt(s.famv.monthlyProfit)} / {fmt(s.famv.limit)} · {pct}%
                        <span style={{ fontSize: '10px', fontWeight: 600, color: t.subtle, marginLeft: '6px' }}>({s.famv.fromPlan ? L.fromPlan : L.fromReal})</span>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Indicadores por plataforma ('both' mostra os dois blocos) */}
              {showAcc && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {miniStat(L.revenue, fmt(s.revenue), '#0a7a3e')}
                  {miniStat(L.balance, fmt(s.saldo), (s.saldo || 0) >= 0 ? t.heading : t.neg)}
                  {miniStat(L.obligations, s.pending || 0, (s.pending || 0) > 0 ? '#b45309' : t.heading)}
                  {miniStat(L.clientsN, s.clients || 0)}
                </div>
              )}
              {showEsg && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {miniStat(L.esgProgress, s.esgAnswered != null ? `${s.esgAnswered}/${ESG_TOTAL}` : '—', t.accent)}
                  {miniStat(lang === 'de' ? 'Bezugsjahr' : lang === 'en' ? 'Ref. year' : 'Ano ref.', s.esgYear || '—')}
                </div>
              )}

              {/* Ações: plataforma completa (quando ativada) + ficha interna */}
              <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                {activated && (
                  <button onClick={() => viewClient(u)} title={L.view} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '10px 8px', borderRadius: '10px', border: 'none', background: t.btnBg, color: t.btnInk, fontWeight: 700, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ flexShrink: 0 }}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
                    {L.viewShort}
                  </button>
                )}
                <button onClick={() => navigate(`/gestao/clientes/${u.id}`)} title={L.file} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', padding: '10px 8px', borderRadius: '10px', border: `1px solid ${t.cardBorder}`, background: t.softCardBg, color: t.heading, fontWeight: 700, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ flexShrink: 0 }}><path d="M3.5 7.5a2 2 0 0 1 2-2H10l2 2.2h6.5a2 2 0 0 1 2 2v7.8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/></svg>
                  {L.file}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
