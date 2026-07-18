import { useState, useEffect, useCallback } from 'react'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { listUsers } from '../../lib/adminApi'

// Financeiro da Gestão: contratos/mensalidades dos clientes da Lúcia e
// confirmação de recebimentos por mês (padrão igual às Despesas Recorrentes).

const fmt = (n) => `€ ${(Number(n) || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const toYm = (p) => { const [y, m] = String(p).split('-').map(Number); return y * 12 + (m - 1) }

// O contrato é devido no período? (âncora = start_month)
export function isDueInPeriod(b, period) {
  const ym = toYm(period)
  const start = b.start_month ? toYm(b.start_month) : null
  if (start != null && ym < start) return false
  const monthNum = Number(period.slice(5, 7))
  switch (b.periodicity) {
    case 'monthly':   return true
    case 'quarterly': return start != null ? (ym - start) % 3 === 0 : [1, 4, 7, 10].includes(monthNum)
    case 'annual':    return start != null ? (ym - start) % 12 === 0 : monthNum === 1
    case 'once':      return start != null && ym === start
    default:          return false
  }
}

const EMPTY = { client_name: '', user_id: '', service: '', amount: '', periodicity: 'monthly', start_month: new Date().toISOString().slice(0, 7), notes: '' }

export default function Financeiro() {
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()

  const [billing, setBilling] = useState([])
  const [payments, setPayments] = useState([])
  const [users, setUsers] = useState([])
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7))
  const [form, setForm] = useState(EMPTY)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [actuals, setActuals] = useState({})     // billing_id -> valor a confirmar
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [err, setErr] = useState('')

  const L = lang === 'de' ? {
    eyebrow: 'Verwaltung', title: 'Finanzen', subtitle: 'Verträge und Zahlungseingänge Ihrer Mandanten — pro Monat bestätigen.',
    expected: 'Erwartet (Monat)', received: 'Erhalten (Monat)', pendingK: 'Ausstehend', contracts: 'Aktive Verträge',
    contractsT: 'Verträge', monthT: 'Eingänge im Monat', new: '+ Neuer Vertrag',
    client: 'Mandant', linkUser: 'Plattform-Nutzer (optional)', none: '— keiner —', service: 'Leistung',
    amount: 'Betrag (€)', periodicity: 'Häufigkeit', monthly: 'Monatlich', quarterly: 'Vierteljährlich',
    annual: 'Jährlich', once: 'Einmalig', startM: 'Beginn', notes: 'Notizen', active: 'Aktiv',
    save: 'Speichern', edit: 'Bearbeiten', del: 'Löschen', confirm: 'Bestätigen', confirmed: 'Erhalten ✓', undo: 'Rückgängig',
    noDue: 'In diesem Monat ist nichts fällig.', noContracts: 'Noch keine Verträge.',
    loading: 'Wird geladen…', confirmDel: (n) => `Vertrag von „${n}" löschen?`, saveErr: 'Fehler (Migration 021 nötig).',
    servicePh: 'z.B. Plattform, ESG-Beratung…',
  } : lang === 'en' ? {
    eyebrow: 'Management', title: 'Finance', subtitle: 'Your clients\' contracts and incoming payments — confirm month by month.',
    expected: 'Expected (month)', received: 'Received (month)', pendingK: 'Outstanding', contracts: 'Active contracts',
    contractsT: 'Contracts', monthT: 'Payments this month', new: '+ New contract',
    client: 'Client', linkUser: 'Platform user (optional)', none: '— none —', service: 'Service',
    amount: 'Amount (€)', periodicity: 'Frequency', monthly: 'Monthly', quarterly: 'Quarterly',
    annual: 'Yearly', once: 'One-off', startM: 'Start', notes: 'Notes', active: 'Active',
    save: 'Save', edit: 'Edit', del: 'Delete', confirm: 'Confirm', confirmed: 'Received ✓', undo: 'Undo',
    noDue: 'Nothing due this month.', noContracts: 'No contracts yet.',
    loading: 'Loading…', confirmDel: (n) => `Delete contract of "${n}"?`, saveErr: 'Error (migration 021 required).',
    servicePh: 'e.g. Platform, ESG consulting…',
  } : {
    eyebrow: 'Gestão', title: 'Financeiro', subtitle: 'Contratos e recebimentos dos teus clientes — confirma mês a mês.',
    expected: 'Previsto (mês)', received: 'Recebido (mês)', pendingK: 'Por receber', contracts: 'Contratos ativos',
    contractsT: 'Contratos', monthT: 'Recebimentos do mês', new: '+ Novo contrato',
    client: 'Cliente', linkUser: 'Utilizador da plataforma (opcional)', none: '— nenhum —', service: 'Serviço',
    amount: 'Valor (€)', periodicity: 'Periodicidade', monthly: 'Mensal', quarterly: 'Trimestral',
    annual: 'Anual', once: 'Pontual', startM: 'Início', notes: 'Notas', active: 'Ativo',
    save: 'Guardar', edit: 'Editar', del: 'Eliminar', confirm: 'Confirmar', confirmed: 'Recebido ✓', undo: 'Anular',
    noDue: 'Nada previsto para este mês.', noContracts: 'Ainda não há contratos.',
    loading: 'A carregar…', confirmDel: (n) => `Eliminar o contrato de "${n}"?`, saveErr: 'Erro (é necessária a migração 021).',
    servicePh: 'ex: Plataforma, Consultoria ESG…',
  }
  const perLabel = { monthly: L.monthly, quarterly: L.quarterly, annual: L.annual, once: L.once }

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    try {
      const [{ data: b, error: e1 }, { data: p, error: e2 }, us] = await Promise.all([
        supabase.from('client_billing').select('*').order('created_at', { ascending: true }),
        supabase.from('billing_payments').select('*').eq('period', period),
        listUsers().catch(() => []),
      ])
      if (e1 || e2) throw (e1 || e2)
      setBilling(b || []); setPayments(p || []); setUsers((us || []).filter(u => u.role !== 'admin'))
    } catch { setErr(L.saveErr) }
    setLoading(false)
  }, [period]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])

  // ── Derivados do mês ──
  const paidByBilling = Object.fromEntries(payments.map(p => [p.billing_id, p]))
  const dueThisMonth = billing.filter(b => b.active && isDueInPeriod(b, period))
  const expected = dueThisMonth.reduce((s, b) => s + Number(b.amount), 0)
  const received = dueThisMonth.reduce((s, b) => s + (paidByBilling[b.id] ? Number(paidByBilling[b.id].amount) : 0), 0)
  const outstanding = dueThisMonth.filter(b => !paidByBilling[b.id]).reduce((s, b) => s + Number(b.amount), 0)
  const activeCount = billing.filter(b => b.active).length

  // ── CRUD contratos ──
  async function saveContract() {
    if (!form.client_name.trim() || form.amount === '') return
    setErr('')
    const payload = {
      client_name: form.client_name.trim(), user_id: form.user_id || null,
      service: form.service || null, amount: parseFloat(form.amount) || 0,
      periodicity: form.periodicity, start_month: form.start_month || null, notes: form.notes || null,
    }
    const { error } = editingId
      ? await supabase.from('client_billing').update(payload).eq('id', editingId)
      : await supabase.from('client_billing').insert({ ...payload, active: true })
    if (error) { setErr(L.saveErr); return }
    setForm(EMPTY); setShowForm(false); setEditingId(null); load()
  }
  async function removeContract(b) {
    if (!window.confirm(L.confirmDel(b.client_name))) return
    const { error } = await supabase.from('client_billing').delete().eq('id', b.id)
    if (error) setErr(L.saveErr)
    load()
  }
  async function toggleActive(b) {
    const { error } = await supabase.from('client_billing').update({ active: !b.active }).eq('id', b.id)
    if (error) setErr(L.saveErr)
    load()
  }
  function openEdit(b) {
    setEditingId(b.id)
    setForm({ client_name: b.client_name, user_id: b.user_id || '', service: b.service || '', amount: String(b.amount), periodicity: b.periodicity, start_month: b.start_month || '', notes: b.notes || '' })
    setShowForm(true)
  }

  // ── Recebimentos ──
  async function confirmPayment(b) {
    const val = actuals[b.id] !== undefined && actuals[b.id] !== '' ? parseFloat(actuals[b.id]) : Number(b.amount)
    setBusyId(b.id)
    const { error } = await supabase.from('billing_payments').insert({ billing_id: b.id, period, amount: val })
    setBusyId(null)
    if (error) { setErr(L.saveErr); return }
    setActuals(a => ({ ...a, [b.id]: '' })); load()
  }
  async function undoPayment(b) {
    const p = paidByBilling[b.id]; if (!p) return
    setBusyId(b.id)
    const { error } = await supabase.from('billing_payments').delete().eq('id', p.id)
    setBusyId(null)
    if (error) setErr(L.saveErr)
    load()
  }

  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px' }
  const inputStyle = { padding: '8px 10px', borderRadius: '8px', border: `1px solid ${t.inputBorder}`, fontSize: '13px', background: t.inputBg, color: t.heading, outline: 'none', width: '100%', boxSizing: 'border-box' }

  if (loading) return <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.loading}</div>

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody, maxWidth: '980px' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div>
          <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accent }}>{L.eyebrow}</div>
          <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '28px' : '38px', lineHeight: 1, letterSpacing: '-.5px', color: t.heading }}>{L.title}</h1>
          <p style={{ fontSize: '13px', color: t.textMuted, margin: '8px 0 0' }}>{L.subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input type="month" value={period} onChange={e => setPeriod(e.target.value)} style={{ ...inputStyle, width: 'auto' }} />
          <button onClick={() => { setEditingId(null); setForm(EMPTY); setShowForm(v => !v) }} style={{ padding: '10px 18px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{L.new}</button>
        </div>
      </div>

      {err && <div style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '10px', padding: '11px 15px', fontSize: '12.5px', fontWeight: 600, marginBottom: '14px' }}>{err}</div>}

      {/* KPIs do mês */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '12px', marginBottom: '18px' }}>
        {[
          { label: L.expected, value: fmt(expected), color: t.heading },
          { label: L.received, value: fmt(received), color: '#0a7a3e' },
          { label: L.pendingK, value: fmt(outstanding), color: outstanding > 0 ? '#b45309' : t.heading },
          { label: L.contracts, value: activeCount, color: t.heading },
        ].map(k => (
          <div key={k.label} style={{ ...card, padding: '15px 17px' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '5px' }}>{k.label}</div>
            <div style={{ fontSize: '21px', fontWeight: 800, color: k.color, fontFamily: t.fontNum || t.fontDisplay }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Form contrato */}
      {showForm && (
        <div style={{ ...card, border: `2px solid ${t.accent}`, padding: '16px 18px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1.2fr 1fr', gap: '11px', marginBottom: '11px' }}>
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '5px' }}>{L.client}</div>
              <input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} style={inputStyle} /></div>
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '5px' }}>{L.linkUser}</div>
              <select value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">{L.none}</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.display_name || u.email}</option>)}
              </select></div>
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '5px' }}>{L.service}</div>
              <input value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} placeholder={L.servicePh} style={inputStyle} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '120px 150px 130px 1fr auto', gap: '11px', alignItems: 'end' }}>
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '5px' }}>{L.amount}</div>
              <input type="number" min="0" step="0.5" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={inputStyle} /></div>
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '5px' }}>{L.periodicity}</div>
              <select value={form.periodicity} onChange={e => setForm(f => ({ ...f, periodicity: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="monthly">{L.monthly}</option><option value="quarterly">{L.quarterly}</option>
                <option value="annual">{L.annual}</option><option value="once">{L.once}</option>
              </select></div>
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '5px' }}>{L.startM}</div>
              <input type="month" value={form.start_month} onChange={e => setForm(f => ({ ...f, start_month: e.target.value }))} style={inputStyle} /></div>
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '5px' }}>{L.notes}</div>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={inputStyle} /></div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={saveContract} style={{ padding: '9px 16px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '9px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>{L.save}</button>
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY) }} style={{ padding: '9px 12px', background: t.segBg, border: `1px solid ${t.segBorder}`, borderRadius: '9px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: t.textMuted }}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* Recebimentos do mês */}
      <h2 style={{ margin: '0 0 10px', fontFamily: t.fontDisplay, fontWeight: 600, fontSize: '20px', color: t.heading }}>{L.monthT} · {period}</h2>
      <div style={{ ...card, overflow: 'hidden', marginBottom: '22px' }}>
        {dueThisMonth.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>{L.noDue}</div>}
        {dueThisMonth.map((b, i) => {
          const paid = paidByBilling[b.id]
          return (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: i < dueThisMonth.length - 1 ? `1px solid ${t.rowBorder || t.cardBorder}` : 'none', flexWrap: 'wrap' }}>
              <div style={{ minWidth: '150px', flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: t.heading }}>{b.client_name}</div>
                <div style={{ fontSize: '11px', color: t.subtle }}>{b.service || '—'} · {perLabel[b.periodicity]}</div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: t.heading, width: '96px', textAlign: 'right' }}>{fmt(paid ? paid.amount : b.amount)}</div>
              {paid ? (
                <button onClick={() => undoPayment(b)} disabled={busyId === b.id} style={{ padding: '6px 13px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700, border: 'none', background: '#d1fae5', color: '#065f46', cursor: 'pointer' }} title={L.undo}>{L.confirmed}</button>
              ) : (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input type="number" min="0" step="0.5" placeholder={String(b.amount)} value={actuals[b.id] ?? ''} onChange={e => setActuals(a => ({ ...a, [b.id]: e.target.value }))} style={{ ...inputStyle, width: '90px' }} />
                  <button onClick={() => confirmPayment(b)} disabled={busyId === b.id} style={{ padding: '7px 14px', borderRadius: '9px', fontSize: '12px', fontWeight: 700, border: 'none', background: t.btnBg, color: t.btnInk, cursor: busyId === b.id ? 'wait' : 'pointer' }}>{busyId === b.id ? '…' : L.confirm}</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Contratos */}
      <h2 style={{ margin: '0 0 10px', fontFamily: t.fontDisplay, fontWeight: 600, fontSize: '20px', color: t.heading }}>{L.contractsT}</h2>
      <div style={{ ...card, overflow: 'hidden' }}>
        {billing.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>{L.noContracts}</div>}
        {billing.map((b, i) => (
          <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: i < billing.length - 1 ? `1px solid ${t.rowBorder || t.cardBorder}` : 'none', flexWrap: 'wrap', opacity: b.active ? 1 : 0.55 }}>
            <div style={{ minWidth: '150px', flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: t.heading }}>{b.client_name}{b.user_id && <span title="Utilizador da plataforma" style={{ marginLeft: '6px', fontSize: '10px' }}>🔗</span>}</div>
              <div style={{ fontSize: '11px', color: t.subtle }}>{b.service || '—'}{b.notes ? ` · ${b.notes}` : ''}</div>
            </div>
            <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 700, background: t.softCardBg, color: t.textMuted }}>{perLabel[b.periodicity]}</span>
            <div style={{ fontSize: '13px', fontWeight: 800, color: t.heading, width: '96px', textAlign: 'right' }}>{fmt(b.amount)}</div>
            <button onClick={() => toggleActive(b)} style={{ padding: '4px 11px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 700, border: 'none', cursor: 'pointer', background: b.active ? '#d1fae5' : '#f1f5f9', color: b.active ? '#065f46' : '#64748b' }}>{L.active}</button>
            <button onClick={() => openEdit(b)} title={L.edit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.subtle, fontSize: '13px', padding: '2px' }}>✎</button>
            <button onClick={() => removeContract(b)} title={L.del} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.subtle, fontSize: '13px', padding: '2px' }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}
