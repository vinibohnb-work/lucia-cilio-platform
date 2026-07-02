import { useState, useEffect, useCallback } from 'react'
import { useLang } from '../../context/LangContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { EXPENSE_CATEGORIES, COST_TYPE, getCategory } from '../../data/expenseCategories'

const G = '#0a2f1a'
const GOLD = '#c9a84c'
const BG = '#f2f6f3'

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTHS_DE = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']
const fmt = (n) => (Number(n)||0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const daysInMonth = (y, m) => new Date(y, m, 0).getDate()

function isDue(periodicity, monthNum) {
  if (periodicity === 'monthly') return true
  if (periodicity === 'quarterly') return [1,4,7,10].includes(monthNum)
  if (periodicity === 'annual') return monthNum === 1
  return false
}

const EMPTY = { description: '', category: '', amount: '', periodicity: 'monthly', due_day: '', destination: 'banco', active: true }

export default function DespesasRecorrentes() {
  const { lang } = useLang()
  const isMobile = useIsMobile()
  const year = 2026
  const [templates, setTemplates] = useState([])
  const [confirmed, setConfirmed] = useState([]) // cash_entries recorrentes do período
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [showForm, setShowForm] = useState(false)
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7)) // 'YYYY-MM'
  const [actuals, setActuals] = useState({}) // id -> valor a confirmar

  const months = lang === 'de' ? MONTHS_DE : MONTHS_PT
  const monthNum = parseInt(period.slice(5, 7), 10)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: tpls }, { data: ce }] = await Promise.all([
      supabase.from('recurring_expenses').select('*').order('created_at', { ascending: true }),
      supabase.from('cash_entries').select('id,amount,recurring_expense_id,period').not('recurring_expense_id', 'is', null).eq('period', period),
    ])
    setTemplates(tpls || [])
    setConfirmed(ce || [])
    setLoading(false)
  }, [period])
  useEffect(() => { load() }, [load])

  const L = lang === 'de' ? {
    title: 'Wiederkehrende Ausgaben',
    subtitle: 'Fixkosten definieren und pro Monat den tatsächlichen Betrag bestätigen.',
    new: '+ Neue Ausgabe', desc: 'Beschreibung', category: 'Kategorie', amount: 'Betrag (€)',
    period_: 'Häufigkeit', monthly: 'Monatlich', quarterly: 'Vierteljährlich', annual: 'Jährlich',
    dueDay: 'Fälligkeitstag', dest: 'Konto', caixa: 'Kasse', banco: 'Bank',
    save: 'Speichern', active: 'Aktiv', del: 'Löschen',
    templates: 'Modelle', thisMonth: 'Diesen Monat bestätigen',
    predicted: 'Geplant', confirm: 'Bestätigen', confirmed: 'Bestätigt ✓', undo: 'Rückgängig',
    none: 'Noch keine wiederkehrenden Ausgaben.', noDue: 'Nichts in diesem Monat fällig.',
    loading: 'Wird geladen…', selectCat: '— Kategorie —', costType: 'Kostenart',
    totalPred: 'Geplant (offen)', totalConf: 'Bestätigt',
  } : {
    title: 'Despesas Recorrentes',
    subtitle: 'Defina os custos fixos e confirme o valor real gasto em cada mês.',
    new: '+ Nova Despesa', desc: 'Descrição', category: 'Categoria', amount: 'Valor (€)',
    period_: 'Periodicidade', monthly: 'Mensal', quarterly: 'Trimestral', annual: 'Anual',
    dueDay: 'Dia venc.', dest: 'Destino', caixa: 'Caixa', banco: 'Banco',
    save: 'Guardar', active: 'Ativa', del: 'Eliminar',
    templates: 'Modelos', thisMonth: 'Confirmar este mês',
    predicted: 'Previsto', confirm: 'Confirmar', confirmed: 'Confirmado ✓', undo: 'Anular',
    none: 'Ainda não há despesas recorrentes.', noDue: 'Nada previsto para este mês.',
    loading: 'A carregar…', selectCat: '— Categoria —', costType: 'Tipo de custo',
    totalPred: 'Previsto (por confirmar)', totalConf: 'Confirmado',
  }

  const catLabel = (key) => getCategory(key)?.[lang]?.label || '—'
  const confirmedByTpl = Object.fromEntries(confirmed.map(c => [c.recurring_expense_id, c]))

  const dueTemplates = templates.filter(t => t.active && isDue(t.periodicity, monthNum))
  const totalPredicted = dueTemplates.filter(t => !confirmedByTpl[t.id]).reduce((s,t)=>s+Number(t.amount),0)
  const totalConfirmed = dueTemplates.filter(t => confirmedByTpl[t.id]).reduce((s,t)=>s+Number(confirmedByTpl[t.id].amount),0)

  async function addTemplate() {
    if (!form.description || form.amount === '') return
    setSaving(true)
    const { error } = await supabase.from('recurring_expenses').insert({
      description: form.description,
      category: form.category || null,
      amount: parseFloat(form.amount) || 0,
      periodicity: form.periodicity,
      due_day: form.due_day ? parseInt(form.due_day, 10) : null,
      destination: form.destination,
      active: true,
    })
    setSaving(false)
    if (error) { alert(error.message); return }
    setForm(EMPTY); setShowForm(false); load()
  }

  async function removeTemplate(id) {
    setTemplates(prev => prev.filter(t => t.id !== id))
    const { error } = await supabase.from('recurring_expenses').delete().eq('id', id)
    if (error) { alert(error.message); load() }
  }

  async function confirmMonth(t) {
    const val = actuals[t.id] !== undefined && actuals[t.id] !== '' ? parseFloat(actuals[t.id]) : Number(t.amount)
    setBusyId(t.id)
    const day = Math.min(t.due_day || 1, daysInMonth(year, monthNum))
    const entry_date = `${period}-${String(day).padStart(2, '0')}`
    const { error } = await supabase.from('cash_entries').insert({
      entry_date, description: t.description, type: 'saida', amount: val,
      destination: t.destination, category: t.category || null,
      recurring_expense_id: t.id, period,
    })
    setBusyId(null)
    if (error) { alert(error.message); return }
    setActuals(a => ({ ...a, [t.id]: '' })); load()
  }

  async function undoMonth(t) {
    const ce = confirmedByTpl[t.id]
    if (!ce) return
    setBusyId(t.id)
    const { error } = await supabase.from('cash_entries').delete().eq('id', ce.id)
    setBusyId(null)
    if (error) { alert(error.message); return }
    load()
  }

  const inputStyle = { padding: '8px 10px', borderRadius: '7px', border: '1px solid #dde8de', fontSize: '13px', background: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }

  if (loading) return <div style={{ padding: '40px', color: '#94a3b8', fontSize: '14px' }}>{L.loading}</div>

  return (
    <div style={{ width: '100%', maxWidth: '1000px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 900, color: G, margin: '0 0 4px' }}>{L.title}</h2>
      <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px' }}>{L.subtitle}</p>

      {/* ── Confirmar este mês ── */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #dde8de', padding: '20px 22px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: G, margin: 0 }}>{L.thisMonth}</h3>
          <select value={period} onChange={e => setPeriod(e.target.value)} style={{ ...selectStyle, width: 'auto', padding: '7px 12px' }}>
            {months.map((m, i) => <option key={i} value={`${year}-${String(i+1).padStart(2,'0')}`}>{m} {year}</option>)}
          </select>
        </div>

        {dueTemplates.length === 0 && (
          <div style={{ padding: '18px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>{L.noDue}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {dueTemplates.map(t => {
            const ce = confirmedByTpl[t.id]
            const isConfirmed = !!ce
            const cat = t.category ? getCategory(t.category) : null
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '12px 14px', borderRadius: '10px', background: isConfirmed ? '#f0fdf4' : BG, border: `1px solid ${isConfirmed ? '#bbf7d0' : '#dde8de'}` }}>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: G }}>{t.description}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    {cat && <span style={{ color: COST_TYPE[cat.costType].color, fontWeight: 600 }}>{catLabel(t.category)}</span>}
                    <span style={{ marginLeft: cat ? '8px' : 0 }}>{L.predicted}: <strong>€ {fmt(t.amount)}</strong></span>
                  </div>
                </div>
                {isConfirmed ? (
                  <>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#065f46' }}>€ {fmt(ce.amount)}</span>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#d1fae5', color: '#065f46' }}>{L.confirmed}</span>
                    <button onClick={() => undoMonth(t)} disabled={busyId===t.id} style={{ padding: '6px 12px', background: '#fff', border: '1px solid #dde8de', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: '#64748b' }}>{L.undo}</button>
                  </>
                ) : (
                  <>
                    <input type="number" step="0.01" min="0" value={actuals[t.id] ?? ''} onChange={e => setActuals(a => ({ ...a, [t.id]: e.target.value }))} placeholder={fmt(t.amount)} style={{ ...inputStyle, width: '110px' }} />
                    <button onClick={() => confirmMonth(t)} disabled={busyId===t.id} style={{ padding: '8px 16px', background: G, color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, fontSize: '13px', cursor: busyId===t.id?'wait':'pointer' }}>{busyId===t.id ? '…' : L.confirm}</button>
                  </>
                )}
              </div>
            )
          })}
        </div>

        {dueTemplates.length > 0 && (
          <div style={{ display: 'flex', gap: '20px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f0f4f1', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: '#4a6355' }}>{L.totalPred}: <strong style={{ color: GOLD }}>€ {fmt(totalPredicted)}</strong></span>
            <span style={{ fontSize: '12px', color: '#4a6355' }}>{L.totalConf}: <strong style={{ color: '#065f46' }}>€ {fmt(totalConfirmed)}</strong></span>
          </div>
        )}
      </div>

      {/* ── Modelos ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 800, color: G, margin: 0 }}>{L.templates}</h3>
        <button onClick={() => { setShowForm(v=>!v); setForm(EMPTY) }} style={{ padding: '9px 18px', background: G, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>{L.new}</button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: `2px solid ${GOLD}`, borderRadius: '12px', padding: '18px 20px', marginBottom: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr 100px 120px 90px auto', gap: '10px', alignItems: 'end' }}>
            {[
              [L.desc, <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder={L.desc} style={inputStyle} />],
              [L.category, <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={selectStyle}><option value="">{L.selectCat}</option>{EXPENSE_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c[lang].label}</option>)}</select>],
              [L.amount, <input type="number" step="0.01" min="0" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0.00" style={inputStyle} />],
              [L.period_, <select value={form.periodicity} onChange={e=>setForm(f=>({...f,periodicity:e.target.value}))} style={selectStyle}><option value="monthly">{L.monthly}</option><option value="quarterly">{L.quarterly}</option><option value="annual">{L.annual}</option></select>],
              [L.dueDay, <input type="number" min="1" max="31" value={form.due_day} onChange={e=>setForm(f=>({...f,due_day:e.target.value}))} placeholder="—" style={inputStyle} />],
            ].map(([lb, field], i) => (
              <div key={i}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '5px' }}>{lb}</div>
                {field}
              </div>
            ))}
            <div style={{ display: 'flex', gap: '6px', paddingBottom: '1px' }}>
              <button onClick={addTemplate} disabled={saving} style={{ padding: '8px 14px', background: G, color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, fontSize: '13px', cursor: saving?'wait':'pointer' }}>{saving?'…':L.save}</button>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 12px', background: BG, border: '1px solid #dde8de', borderRadius: '7px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
          </div>
        </div>
      )}

      <div className="table-scroll">
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #dde8de', overflow: 'hidden', minWidth: isMobile ? '680px' : 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 110px 120px 80px 36px', padding: '12px 20px', background: BG, borderBottom: '1px solid #dde8de', gap: '8px' }}>
          {[L.desc, L.category, L.amount, L.period_, L.dueDay, ''].map((h,i) => (
            <div key={i} style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>
        {templates.length === 0 && <div style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>{L.none}</div>}
        {templates.map((t, i) => (
          <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 110px 120px 80px 36px', padding: '13px 20px', borderBottom: i < templates.length-1 ? '1px solid #f0f4f1' : 'none', alignItems: 'center', gap: '8px', opacity: t.active ? 1 : 0.5 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: G }}>{t.description}</div>
            <div style={{ fontSize: '12px', color: '#4a6355' }}>{catLabel(t.category)}</div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#4a6355' }}>€ {fmt(t.amount)}</div>
            <div style={{ fontSize: '12px', color: '#4a6355' }}>{t.periodicity==='monthly'?L.monthly:t.periodicity==='quarterly'?L.quarterly:L.annual}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>{t.due_day || '—'}</div>
            <button onClick={() => removeTemplate(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#cbd5e1', padding: '2px', lineHeight: 1 }} title={L.del}>✕</button>
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}
