import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { supabase } from '../../lib/supabase'
import { EXPENSE_CATEGORIES, COST_TYPE, getCategory } from '../../data/expenseCategories'
import InfoTooltip from '../../components/InfoTooltip'
import { useIsMobile } from '../../hooks/useIsMobile'
import { getCompanySettings, VAT_RATES } from '../../lib/companySettings'

// IVA contido num montante total (com IVA): total × taxa/(100+taxa)
const vatFromGross = (gross, rate) => (rate > 0 ? Number(gross) * rate / (100 + rate) : 0)

// Recorrência: mês devido e vigência
const isRecDue = (per, m) => per === 'monthly' || (per === 'quarterly' && [1,4,7,10].includes(m)) || (per === 'annual' && m === 1)
const toYm = (p) => { const [y, m] = p.split('-').map(Number); return y * 12 + (m - 1) }
const inRecRange = (p, s, e) => { const ym = toYm(p); if (s && ym < toYm(s)) return false; if (e && ym > toYm(e)) return false; return true }

const G = '#0a2f1a'
const GOLD = '#c9a84c'
const BG = '#f2f6f3'

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTHS_DE = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

const fmt = (n) => (Number(n)||0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function exportCSV(entries, lang) {
  const header = lang === 'de'
    ? 'Datum;Belegnr.;Beschreibung;Kategorie;Einnahme;Ausgabe;MwSt.-Satz;MwSt.-Betrag;Konto\n'
    : 'Data;Doc.;Descrição;Categoria;Entrada;Saída;Taxa IVA;Valor IVA;Destino\n'
  const rows = entries.map(e => {
    const inc = e.type === 'entrada' ? Number(e.amount).toFixed(2) : ''
    const exp = e.type === 'saida'   ? Number(e.amount).toFixed(2) : ''
    const dest = lang === 'de' ? (e.destination === 'caixa' ? 'Kasse' : 'Bank') : (e.destination === 'caixa' ? 'Caixa' : 'Banco')
    const cat = e.category ? (getCategory(e.category)?.[lang]?.label || '') : ''
    const vr = e.vat_rate != null ? `${e.vat_rate}%` : ''
    const va = e.vat_amount != null ? Number(e.vat_amount).toFixed(2) : ''
    return `${e.entry_date};${e.doc||''};${e.description};${cat};${inc};${exp};${vr};${va};${dest}`
  }).join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `livro-caixa-${new Date().toISOString().slice(0,7)}.csv`; a.click()
  URL.revokeObjectURL(url)
}

const EMPTY_FORM = { entry_date: new Date().toISOString().slice(0,10), doc: '', description: '', type: 'entrada', amount: '', destination: 'caixa', category: '', catalog_item_id: '', vat_rate: '' }

export default function LivroCaixa() {
  const { lang } = useLang()
  const isMobile = useIsMobile()
  const [searchParams, setSearchParams] = useSearchParams()
  const [entries, setEntries] = useState([])
  const [catalog, setCatalog] = useState([])
  const [recurring, setRecurring] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [filterMonth, setFilterMonth] = useState('all')

  const months = lang === 'de' ? MONTHS_DE : MONTHS_PT

  // Taxa de IVA por defeito e opções conforme a empresa
  const isExempt = settings?.vat_regime === 'exempt'
  const defaultRate = settings ? (isExempt ? 0 : Number(settings.vat_default_rate)) : 0
  const vatOptions = [...(VAT_RATES[settings?.country] || VAT_RATES.PT), 0]
  const formRate = form.vat_rate === '' ? defaultRate : Number(form.vat_rate)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: ce }, { data: ci }, { data: re }, cs] = await Promise.all([
      supabase.from('cash_entries').select('*').order('entry_date', { ascending: true }).order('created_at', { ascending: true }),
      supabase.from('catalog_items').select('id,name,kind,price').order('name', { ascending: true }),
      supabase.from('recurring_expenses').select('*').eq('active', true),
      getCompanySettings(),
    ])
    setEntries(ce || [])
    setCatalog(ci || [])
    setRecurring(re || [])
    setSettings(cs)
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  // Abrir formulário quando vier do botão "+ Nova Entrada" do cabeçalho (?new=1)
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setForm({ ...EMPTY_FORM })
      setShowForm(true)
      searchParams.delete('new')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const filtered = filterMonth === 'all' ? entries : entries.filter(e => e.entry_date.slice(5,7) === filterMonth)

  let running = 0
  const withBalance = filtered.map(e => {
    running += e.type === 'entrada' ? Number(e.amount) : -Number(e.amount)
    return { ...e, balance: running }
  })

  const totalIn  = filtered.filter(e => e.type === 'entrada').reduce((s,e)=>s+Number(e.amount),0)
  const totalOut = filtered.filter(e => e.type === 'saida'  ).reduce((s,e)=>s+Number(e.amount),0)
  const cashBal  = filtered.reduce((s,e)=> e.destination==='caixa' ? s+(e.type==='entrada'?Number(e.amount):-Number(e.amount)) : s, 0)
  const bankBal  = filtered.reduce((s,e)=> e.destination==='banco' ? s+(e.type==='entrada'?Number(e.amount):-Number(e.amount)) : s, 0)

  // ── Saídas previstas: recorrentes devidas no âmbito do filtro e ainda por confirmar ──
  const YEAR = 2026
  const confirmedByPeriod = {}
  entries.forEach(e => { if (e.recurring_expense_id && e.period) { (confirmedByPeriod[e.period] ||= new Set()).add(e.recurring_expense_id) } })
  const scopeMonths = filterMonth === 'all' ? Array.from({ length: 12 }, (_, i) => i + 1) : [Number(filterMonth)]
  let predictedOut = 0
  scopeMonths.forEach(m => {
    const periodStr = `${YEAR}-${String(m).padStart(2, '0')}`
    const done = confirmedByPeriod[periodStr]
    recurring.forEach(r => {
      if (isRecDue(r.periodicity, m) && inRecRange(periodStr, r.start_month, r.end_month) && !(done && done.has(r.id))) {
        predictedOut += Number(r.amount)
      }
    })
  })

  function pickCatalog(id) {
    const it = catalog.find(c => c.id === id)
    setForm(f => ({
      ...f,
      catalog_item_id: id,
      description: it && !f.description ? it.name : f.description,
      amount: it && it.price != null && !f.amount ? String(it.price) : f.amount,
    }))
  }

  async function addEntry() {
    if (!form.description || !form.amount || !form.entry_date) return
    setSaving(true)
    const gross = parseFloat(form.amount)
    const rate = formRate
    const { error } = await supabase.from('cash_entries').insert({
      entry_date: form.entry_date,
      doc: form.doc || null,
      description: form.description,
      type: form.type,
      amount: gross,
      destination: form.destination,
      category: form.type === 'saida' ? (form.category || null) : null,
      catalog_item_id: form.catalog_item_id || null,
      vat_rate: rate,
      vat_amount: Number(vatFromGross(gross, rate).toFixed(2)),
    })
    setSaving(false)
    if (error) { alert(error.message); return }
    setForm({ ...EMPTY_FORM }); setShowForm(false); load()
  }
  async function removeEntry(id) {
    setEntries(prev => prev.filter(e => e.id !== id))
    const { error } = await supabase.from('cash_entries').delete().eq('id', id)
    if (error) { alert(error.message); load() }
  }

  const L = lang === 'de' ? {
    export: 'CSV exportieren', balance: 'Kassenbestand', income: 'Einnahmen', expense: 'Ausgaben',
    cash: 'Kasse', bank: 'Bank', date: 'Datum', doc: 'Belegnr.', desc: 'Beschreibung', type: 'Art',
    amount: 'Betrag (€)', dest: 'Konto', running: 'Bestand', entrada: 'Einnahme', saida: 'Ausgabe',
    caixa: 'Kasse', banco: 'Bank', save: 'Speichern', all: 'Alle Monate',
    noEntries: 'Noch keine Buchungen. Über „+ Neue Buchung" oben hinzufügen.',
    loading: 'Wird geladen…', total: 'Summe', category: 'Kategorie', catalog: 'Produkt/Leistung',
    catalogNone: '— keine —', catHint: 'Wählen Sie eine Ausgabenkategorie.', costType: 'Kostenart',
    vat: 'MwSt.', vatExempt: 'befreit', predictedOut: 'Geplante Ausgaben', predictedOutSub: 'wiederkehrend, offen',
  } : {
    export: 'Exportar CSV', balance: 'Saldo Atual', income: 'Total Entradas', expense: 'Total Saídas',
    cash: 'Em Caixa', bank: 'No Banco', date: 'Data', doc: 'Doc.', desc: 'Descrição', type: 'Tipo',
    amount: 'Valor (€)', dest: 'Destino', running: 'Saldo', entrada: 'Entrada', saida: 'Saída',
    caixa: 'Caixa', banco: 'Banco', save: 'Guardar', all: 'Todos os meses',
    noEntries: 'Ainda não há registos. Adicione em "+ Nova Entrada" no topo.',
    loading: 'A carregar…', total: 'Total', category: 'Categoria', catalog: 'Produto/Serviço',
    catalogNone: '— nenhum —', catHint: 'Escolha a categoria da despesa.', costType: 'Tipo de custo',
    vat: 'IVA', vatExempt: 'isento', predictedOut: 'Saídas previstas', predictedOutSub: 'recorrentes a confirmar',
  }

  const inputStyle = { padding: '8px 10px', borderRadius: '7px', border: '1px solid #dde8de', fontSize: '13px', background: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }
  const GRID = '108px 64px 1fr 96px 92px 88px 92px 34px'

  const fieldWrap = (label, node, minW, extra) => (
    <div style={{ flex: `1 1 ${minW}`, minWidth: minW }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {label}{extra}
      </div>
      {node}
    </div>
  )

  const selCat = getCategory(form.category)

  return (
    <div style={{ width: '100%' }}>

      {/* Header (sem botão de Nova Entrada — está no topo) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ ...selectStyle, width: 'auto', padding: '7px 12px' }}>
          <option value="all">{L.all}</option>
          {months.map((m,i) => <option key={i} value={String(i+1).padStart(2,'0')}>{m} 2026</option>)}
        </select>
        <button onClick={() => exportCSV(filtered, lang)} style={{ padding: '8px 14px', background: BG, border: '1px solid #dde8de', borderRadius: '8px', fontWeight: 600, fontSize: '12px', cursor: 'pointer', color: '#4a6355' }}>
          ⬇ {L.export}
        </button>
      </div>

      {/* Summary — linha 1: Saldo / Entradas / Saídas / Saídas previstas */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '12px', marginBottom: '12px' }}>
        {[
          { label: L.balance, value: totalIn - totalOut, color: (totalIn-totalOut)>=0 ? G : '#e53e3e', bg: '#fff' },
          { label: L.income,  value: totalIn,  color: '#065f46', bg: '#d1fae5' },
          { label: L.expense, value: totalOut, color: '#e53e3e', bg: '#fee2e2' },
          { label: L.predictedOut, sub: L.predictedOutSub, value: predictedOut, color: '#b45309', bg: '#fffbeb' },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: '12px', padding: '16px 18px', border: '1px solid #dde8de', textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 900, color: c.color }}>€ {fmt(c.value)}</div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {c.sub ? '🔁 ' : ''}{c.label}
            </div>
            {c.sub && <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>({c.sub})</div>}
          </div>
        ))}
      </div>

      {/* Summary — linha 2: Em Caixa / No Banco */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: L.cash, value: cashBal, color: '#92400e', bg: '#f5edd6', icon: '💵' },
          { label: L.bank, value: bankBal, color: '#1d4ed8', bg: '#eff6ff', icon: '🏦' },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: '12px', padding: '16px 20px', border: '1px solid #dde8de', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.icon} {c.label}</span>
            <span style={{ fontSize: '20px', fontWeight: 900, color: c.color }}>€ {fmt(c.value)}</span>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background: '#fff', border: `2px solid ${GOLD}`, borderRadius: '12px', padding: '18px 20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
            {fieldWrap(L.date, <input type="date" value={form.entry_date} onChange={e=>setForm(f=>({...f,entry_date:e.target.value}))} style={inputStyle} />, '130px')}
            {fieldWrap(L.doc, <input value={form.doc} onChange={e=>setForm(f=>({...f,doc:e.target.value}))} placeholder="001" style={inputStyle} />, '80px')}
            {fieldWrap(L.desc, <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder={lang==='de'?'Beschreibung…':'Descrição…'} style={inputStyle} />, '180px')}
            {fieldWrap(L.type, (
              <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value, category: e.target.value==='entrada' ? '' : f.category}))} style={selectStyle}>
                <option value="entrada">{L.entrada}</option>
                <option value="saida">{L.saida}</option>
              </select>
            ), '110px')}
            {fieldWrap(L.amount, <input type="number" step="0.01" min="0" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0.00" style={inputStyle} />, '100px')}
            {fieldWrap(L.vat, (
              <select value={form.vat_rate === '' ? String(defaultRate) : form.vat_rate} onChange={e=>setForm(f=>({...f,vat_rate:e.target.value}))} style={selectStyle}>
                {vatOptions.map(r => <option key={r} value={r}>{r === 0 ? `0% (${L.vatExempt})` : `${r}%`}</option>)}
              </select>
            ), '110px')}
            {fieldWrap(L.dest, (
              <select value={form.destination} onChange={e=>setForm(f=>({...f,destination:e.target.value}))} style={selectStyle}>
                <option value="caixa">{L.caixa}</option>
                <option value="banco">{L.banco}</option>
              </select>
            ), '110px')}
            {fieldWrap(L.catalog, (
              <select value={form.catalog_item_id} onChange={e=>pickCatalog(e.target.value)} style={selectStyle}>
                <option value="">{L.catalogNone}</option>
                {catalog.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            ), '150px')}

            {/* Categoria — só para saídas */}
            {form.type === 'saida' && fieldWrap(
              L.category,
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={selectStyle}>
                <option value="">{L.catHint}</option>
                {EXPENSE_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c[lang].label}</option>)}
              </select>,
              '170px',
              selCat ? <InfoTooltip text={selCat[lang].explain} badge={`${L.costType}: ${COST_TYPE[selCat.costType][lang]}`} /> : null
            )}

            <div style={{ display: 'flex', gap: '6px', paddingBottom: '1px' }}>
              <button onClick={addEntry} disabled={saving} style={{ padding: '8px 16px', background: G, color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, fontSize: '13px', cursor: saving?'wait':'pointer', whiteSpace: 'nowrap' }}>{saving ? '…' : L.save}</button>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 12px', background: BG, border: '1px solid #dde8de', borderRadius: '7px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-scroll">
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #dde8de', overflow: 'hidden', minWidth: isMobile ? '760px' : 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '11px 18px', background: BG, borderBottom: '1px solid #dde8de', gap: '8px' }}>
          {[L.date, L.doc, L.desc, L.type, L.amount, L.dest, L.running, ''].map((h,i) => (
            <div key={i} style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {loading && <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>{L.loading}</div>}
        {!loading && withBalance.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>{L.noEntries}</div>}

        {!loading && withBalance.map((e, i) => {
          const cat = e.category ? getCategory(e.category) : null
          const linked = e.catalog_item_id ? catalog.find(c => c.id === e.catalog_item_id) : null
          return (
            <div key={e.id} style={{ display: 'grid', gridTemplateColumns: GRID, padding: '12px 18px', borderBottom: i < withBalance.length-1 ? '1px solid #f0f4f1' : 'none', alignItems: 'center', gap: '8px', background: e.type === 'saida' ? '#fffbfb' : '#fff' }}>
              <div style={{ fontSize: '12px', color: '#4a6355' }}>{e.entry_date.split('-').reverse().join('/')}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{e.doc}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: '#1a2e1a' }}>{e.description}</div>
                {(cat || linked || e.vat_amount > 0) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                    {cat && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '1px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: COST_TYPE[cat.costType].bg, color: COST_TYPE[cat.costType].color }}>
                        {cat[lang].label}
                        <InfoTooltip text={cat[lang].explain} badge={`${L.costType}: ${COST_TYPE[cat.costType][lang]}`} />
                      </span>
                    )}
                    {e.vat_amount > 0 && (
                      <span style={{ padding: '1px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: '#eff6ff', color: '#1d4ed8' }}>
                        {L.vat} {e.vat_rate}% · € {fmt(e.vat_amount)}
                      </span>
                    )}
                    {linked && (
                      <span style={{ padding: '1px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: '#ede9fe', color: '#5b21b6' }}>
                        🏷️ {linked.name}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div><span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '10px', fontWeight: 800, background: e.type==='entrada'?'#d1fae5':'#fee2e2', color: e.type==='entrada'?'#065f46':'#991b1b' }}>{e.type==='entrada'?L.entrada:L.saida}</span></div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: e.type==='entrada'?'#065f46':'#e53e3e', textAlign: 'right' }}>{e.type==='entrada'?'+':'−'} € {fmt(e.amount)}</div>
              <div><span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: e.destination==='caixa'?'#f5edd6':'#eff6ff', color: e.destination==='caixa'?'#92400e':'#1d4ed8' }}>{e.destination==='caixa'?L.caixa:L.banco}</span></div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: e.balance>=0?G:'#e53e3e', textAlign: 'right' }}>€ {fmt(e.balance)}</div>
              <button onClick={() => removeEntry(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#cbd5e1', padding: '2px', borderRadius: '4px', lineHeight: 1 }} title="Remover">✕</button>
            </div>
          )
        })}

        {!loading && withBalance.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '12px 18px', background: BG, borderTop: `2px solid ${G}`, gap: '8px', alignItems: 'center' }}>
            <div style={{ gridColumn: '1/4', fontSize: '11px', fontWeight: 800, color: G, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{L.total}</div>
            <div />
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#065f46', textAlign: 'right' }}>€ {fmt(totalIn)}</div>
            <div />
            <div style={{ fontSize: '13px', fontWeight: 900, color: G, textAlign: 'right' }}>€ {fmt(totalIn - totalOut)}</div>
            <div />
          </div>
        )}
      </div>
      </div>

    </div>
  )
}
