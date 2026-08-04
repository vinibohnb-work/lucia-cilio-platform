import { useState, useEffect, useCallback } from 'react'
import { useLang } from '../../context/LangContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { getCompanySettings } from '../../lib/companySettings'
import { overheadPerHour, computePlanTotals } from '../../lib/planCalc'
import { useEffectiveUserId, useViewAs } from '../../context/ViewAsContext'
import EstimateNote from '../../components/EstimateNote'

const fmt = (n) => (Number(n) || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const EMPTY_ROW = { name: '', durationMin: '', price: '', qty: '', material: '' }

export default function PlaneamentoMensal() {
  const { lang } = useLang()
  const { user } = useAuth()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const eid = useEffectiveUserId()
  const { isViewing } = useViewAs()

  const [rows, setRows] = useState([{ ...EMPTY_ROW }])
  const [monthlyFixed, setMonthlyFixed] = useState('')
  const [productiveHours, setProductiveHours] = useState('')
  const [reserveBasis, setReserveBasis] = useState('gewinn')
  const [reservePct, setReservePct] = useState(20)
  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = useCallback(async () => {
    if (!eid) return
    setLoading(true)
    const [{ data: plan }, { data: ci }, cs] = await Promise.all([
      supabase.from('monthly_plans').select('*').eq('user_id', eid).maybeSingle(),
      supabase.from('catalog_items').select('id,name,kind,price').eq('user_id', eid).order('name'),
      getCompanySettings(eid),
    ])
    if (plan) {
      setRows(plan.items?.length ? plan.items : [{ ...EMPTY_ROW }])
      setMonthlyFixed(plan.monthly_fixed ? String(plan.monthly_fixed) : '')
      setProductiveHours(plan.productive_hours ? String(plan.productive_hours) : '')
      setReserveBasis(plan.reserve_basis || 'gewinn')
    }
    setCatalog(ci || [])
    if (cs?.ir_reserve_pct != null) setReservePct(Number(cs.ir_reserve_pct))
    setLoading(false)
  }, [eid])
  useEffect(() => { load() }, [load])

  let L = lang === 'de' ? {
    eyebrow: 'Planung', title: 'Monatsplanung',
    subtitle: 'Behandlungen/Leistungen pro Monat planen: Umsatz, Kosten, Gewinn (EÜR) und Rücklage.',
    service: 'Behandlung/Leistung', duration: 'Dauer Min.', price: 'Preis netto', qty: 'Anzahl/Monat',
    material: 'Material je Einheit', revenue: 'Umsatz', matTotal: 'Material ges.', overhead: 'Gemeinkosten',
    profit: 'Gewinn (EÜR)', reserve: 'Rücklage', after: 'Nach Rücklage', total: 'TOTAL',
    addRow: '+ Zeile', fromCatalog: 'Aus Katalog…', remove: 'Entfernen',
    settings: 'Planungsbasis', monthlyFixed: 'Fixkosten monatlich (€)', productiveHours: 'Produktive Stunden/Monat',
    ohPerHour: 'Gemeinkosten pro Stunde', reservePctL: 'Rücklage (%)', basis: 'Rücklage auf', gewinn: 'Gewinn', umsatz: 'Umsatz',
    save: 'Speichern', saving: 'Wird gespeichert…', saved: 'Gespeichert ✓',
    saveErr: 'Speichern fehlgeschlagen (Migration 014 nötig).', loading: 'Wird geladen…',
    hint: 'Der Gemeinkostenanteil je Zeile = (Dauer ÷ 60) × Gemeinkosten pro Stunde × Anzahl.',
  } : {
    eyebrow: 'Planeamento', title: 'Planeamento Mensal',
    subtitle: 'Planeie tratamentos/serviços por mês: receita, custos, lucro (EÜR) e reserva.',
    service: 'Tratamento/Serviço', duration: 'Duração (min)', price: 'Preço líquido', qty: 'Qtd./mês',
    material: 'Material/unid.', revenue: 'Receita', matTotal: 'Material total', overhead: 'Custos indiretos',
    profit: 'Lucro (EÜR)', reserve: 'Reserva', after: 'Após reserva', total: 'TOTAL',
    addRow: '+ Linha', fromCatalog: 'Do catálogo…', remove: 'Remover',
    settings: 'Base do planeamento', monthlyFixed: 'Custos fixos mensais (€)', productiveHours: 'Horas produtivas/mês',
    ohPerHour: 'Custo indireto por hora', reservePctL: 'Reserva (%)', basis: 'Reserva sobre', gewinn: 'Lucro', umsatz: 'Faturação',
    save: 'Guardar', saving: 'A guardar…', saved: 'Guardado ✓',
    saveErr: 'Falha ao guardar (é necessária a migração 014).', loading: 'A carregar…',
    hint: 'O custo indireto de cada linha = (duração ÷ 60) × custo indireto/hora × quantidade.',
  }
  if (lang === 'en') L = {
    eyebrow: 'Planning', title: 'Monthly Plan',
    subtitle: 'Plan treatments/services per month: revenue, costs, profit (EÜR) and reserve.',
    service: 'Treatment/Service', duration: 'Duration (min)', price: 'Net price', qty: 'Qty./month',
    material: 'Material/unit', revenue: 'Revenue', matTotal: 'Total material', overhead: 'Indirect costs',
    profit: 'Profit (EÜR)', reserve: 'Reserve', after: 'After reserve', total: 'TOTAL',
    addRow: '+ Row', fromCatalog: 'From catalog…', remove: 'Remove',
    settings: 'Planning basis', monthlyFixed: 'Monthly fixed costs (€)', productiveHours: 'Productive hours/month',
    ohPerHour: 'Indirect cost per hour', reservePctL: 'Reserve (%)', basis: 'Reserve on', gewinn: 'Profit', umsatz: 'Revenue',
    save: 'Save', saving: 'Saving…', saved: 'Saved ✓',
    saveErr: 'Save failed (migration 014 required).', loading: 'Loading…',
    hint: 'Each row indirect cost = (duration ÷ 60) × indirect cost/hour × quantity.',
  }

  const oh = overheadPerHour(monthlyFixed, productiveHours)
  const totals = computePlanTotals(rows, oh, reservePct, reserveBasis)

  function updateRow(i, field, value) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }
  function pickFromCatalog(i, id) {
    const it = catalog.find(c => c.id === id)
    if (!it) return
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, name: it.name, price: it.price != null ? String(it.price) : r.price } : r))
  }
  function addRow() { setRows(prev => [...prev, { ...EMPTY_ROW }]) }
  function removeRow(i) { setRows(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev) }

  async function save() {
    if (isViewing || !user) return
    setSaving(true); setMsg('')
    const items = rows.filter(r => r.name || r.price || r.qty)
    const { error } = await supabase.from('monthly_plans').upsert({
      user_id: user.id, items,
      monthly_fixed: Number(String(monthlyFixed).replace(',', '.')) || 0,
      productive_hours: Number(String(productiveHours).replace(',', '.')) || 0,
      reserve_basis: reserveBasis,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    setSaving(false)
    setMsg(error ? L.saveErr : L.saved)
    setTimeout(() => setMsg(''), 2600)
  }

  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px' }
  const inputStyle = { padding: '7px 9px', borderRadius: '7px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box' }
  const GRID = 'minmax(150px, 1.4fr) 62px 78px 56px 82px 90px 90px 92px 92px 92px 96px 28px'
  const TABLE_MIN = 1120
  const headCell = { fontSize: '10px', fontWeight: 800, color: t.textMuted, letterSpacing: '0.6px', textTransform: 'uppercase' }
  const numCell = { fontSize: '12px', fontWeight: 700, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }

  if (loading) return <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.loading}</div>

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div>
          <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accent }}>{L.eyebrow}</div>
          <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '27px' : '34px', lineHeight: 1.05, letterSpacing: '-.5px', color: t.heading }}>{L.title}</h1>
          <p style={{ fontSize: '12.5px', color: t.textMuted, margin: '8px 0 0', maxWidth: '560px', lineHeight: 1.5 }}>{L.subtitle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {msg && <span style={{ fontSize: '12px', fontWeight: 700, color: msg === L.saved ? '#0a7a3e' : t.neg }}>{msg}</span>}
          {!isViewing && <button onClick={save} disabled={saving} style={{ padding: '10px 20px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: saving ? 'wait' : 'pointer' }}>{saving ? L.saving : L.save}</button>}
        </div>
      </div>

      {/* Base do planeamento */}
      <div style={{ ...card, padding: '16px 20px', marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: t.accent, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px' }}>{L.settings}</div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: '12px', alignItems: 'end' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '5px' }}>{L.monthlyFixed}</div>
            <input type="number" min="0" value={monthlyFixed} onChange={e => setMonthlyFixed(e.target.value)} placeholder="550" style={inputStyle} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '5px' }}>{L.productiveHours}</div>
            <input type="number" min="0" value={productiveHours} onChange={e => setProductiveHours(e.target.value)} placeholder="100" style={inputStyle} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '5px' }}>{L.ohPerHour}</div>
            <div style={{ ...inputStyle, background: t.softCardBg, fontWeight: 800, color: t.heading }}>€ {fmt(oh)}</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '5px' }}>{L.reservePctL}</div>
            <div style={{ ...inputStyle, background: t.softCardBg, fontWeight: 800, color: t.heading }}>{reservePct}%</div>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '5px' }}>{L.basis}</div>
            <select value={reserveBasis} onChange={e => setReserveBasis(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="gewinn">{L.gewinn}</option>
              <option value="umsatz">{L.umsatz}</option>
            </select>
          </div>
        </div>
        <div style={{ fontSize: '11px', color: t.subtle, marginTop: '10px' }}>ⓘ {L.hint}</div>
      </div>

      {/* Tabela do plano */}
      <div className="table-scroll">
      <div style={{ ...card, overflow: 'hidden', minWidth: `${TABLE_MIN}px` }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: '7px', padding: '11px 14px', background: t.headBg || t.softCardBg, borderBottom: `1px solid ${t.cardBorder}` }}>
          {[L.service, L.duration, L.price, L.qty, L.material, L.revenue, L.matTotal, L.overhead, L.profit, L.reserve, L.after, ''].map((h, i) => <div key={i} style={{ ...headCell, textAlign: i >= 5 && i <= 10 ? 'right' : 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h}</div>)}
        </div>
        {rows.map((r, i) => {
          const c = totals.rows[i]
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: GRID, gap: '7px', padding: '9px 14px', borderBottom: `1px solid ${t.rowBorder || t.cardBorder}`, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input value={r.name} onChange={e => updateRow(i, 'name', e.target.value)} placeholder={L.service} style={{ ...inputStyle, flex: 1 }} />
                {catalog.length > 0 && (
                  <select value="" onChange={e => pickFromCatalog(i, e.target.value)} title={L.fromCatalog} style={{ ...inputStyle, width: '30px', flex: 'none', cursor: 'pointer', padding: '7px 2px' }}>
                    <option value="">▾</option>
                    {catalog.map(ci => <option key={ci.id} value={ci.id}>{ci.name}</option>)}
                  </select>
                )}
              </div>
              <input type="number" min="0" value={r.durationMin} onChange={e => updateRow(i, 'durationMin', e.target.value)} placeholder="60" style={inputStyle} />
              <input type="number" min="0" step="0.5" value={r.price} onChange={e => updateRow(i, 'price', e.target.value)} placeholder="0,00" style={inputStyle} />
              <input type="number" min="0" value={r.qty} onChange={e => updateRow(i, 'qty', e.target.value)} placeholder="0" style={inputStyle} />
              <input type="number" min="0" step="0.5" value={r.material} onChange={e => updateRow(i, 'material', e.target.value)} placeholder="0,00" style={inputStyle} />
              <div style={{ ...numCell, color: t.heading }}>€ {fmt(c.revenue)}</div>
              <div style={{ ...numCell, color: t.textMuted }}>€ {fmt(c.materialTotal)}</div>
              <div style={{ ...numCell, color: t.textMuted }}>€ {fmt(c.overhead)}</div>
              <div style={{ ...numCell, color: c.profit >= 0 ? '#0a7a3e' : t.neg }}>€ {fmt(c.profit)}</div>
              <div style={{ ...numCell, color: '#a9781a' }}>€ {fmt(c.reserve)}</div>
              <div style={{ ...numCell, color: t.heading }}>€ {fmt(c.afterReserve)}</div>
              {!isViewing ? <button onClick={() => removeRow(i)} title={L.remove} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: t.subtle, padding: '2px', lineHeight: 1 }}>✕</button> : <div />}
            </div>
          )
        })}
        {/* Totais */}
        <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: '7px', padding: '12px 14px', background: t.softCardBg, alignItems: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: t.heading, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{L.total}</div>
          <div /><div /><div /><div />
          <div style={{ ...numCell, fontWeight: 900, color: t.heading }}>€ {fmt(totals.revenue)}</div>
          <div style={{ ...numCell, fontWeight: 900, color: t.textMuted }}>€ {fmt(totals.materialTotal)}</div>
          <div style={{ ...numCell, fontWeight: 900, color: t.textMuted }}>€ {fmt(totals.overhead)}</div>
          <div style={{ ...numCell, fontWeight: 900, color: totals.profit >= 0 ? '#0a7a3e' : t.neg }}>€ {fmt(totals.profit)}</div>
          <div style={{ ...numCell, fontWeight: 900, color: '#a9781a' }}>€ {fmt(totals.reserve)}</div>
          <div style={{ ...numCell, fontWeight: 900, color: t.heading }}>€ {fmt(totals.afterReserve)}</div>
          <div />
        </div>
      </div>
      </div>

      {!isViewing && <button onClick={addRow} style={{ marginTop: '12px', padding: '9px 16px', background: t.cardBg, border: `1px dashed ${t.cardBorder}`, borderRadius: '9px', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer', color: t.textMuted }}>{L.addRow}</button>}

      <EstimateNote />
    </div>
  )
}
