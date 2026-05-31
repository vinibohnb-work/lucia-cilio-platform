import { useState, useEffect, useCallback } from 'react'
import { useLang } from '../../context/LangContext'
import { supabase } from '../../lib/supabase'

const G = '#0d3b20'
const GOLD = '#c9a84c'
const BG = '#f2f6f3'

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTHS_DE = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']

const fmt = (n) => (Number(n)||0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function exportCSV(entries, lang) {
  const header = lang === 'de'
    ? 'Datum;Belegnr.;Beschreibung;Einnahme;Ausgabe;Konto\n'
    : 'Data;Doc.;Descrição;Entrada;Saída;Destino\n'
  const rows = entries.map(e => {
    const inc = e.type === 'entrada' ? Number(e.amount).toFixed(2) : ''
    const exp = e.type === 'saida'   ? Number(e.amount).toFixed(2) : ''
    const dest = lang === 'de'
      ? (e.destination === 'caixa' ? 'Kasse' : 'Bank')
      : (e.destination === 'caixa' ? 'Caixa' : 'Banco')
    return `${e.entry_date};${e.doc||''};${e.description};${inc};${exp};${dest}`
  }).join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `livro-caixa-${new Date().toISOString().slice(0,7)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const EMPTY_FORM = { entry_date: new Date().toISOString().slice(0,10), doc: '', description: '', type: 'entrada', amount: '', destination: 'caixa' }

export default function LivroCaixa() {
  const { lang } = useLang()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [filterMonth, setFilterMonth] = useState('all')

  const months = lang === 'de' ? MONTHS_DE : MONTHS_PT

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cash_entries')
      .select('*')
      .order('entry_date', { ascending: true })
      .order('created_at', { ascending: true })
    if (!error) setEntries(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = filterMonth === 'all'
    ? entries
    : entries.filter(e => e.entry_date.slice(5,7) === filterMonth)

  let running = 0
  const withBalance = filtered.map(e => {
    running += e.type === 'entrada' ? Number(e.amount) : -Number(e.amount)
    return { ...e, balance: running }
  })

  const totalIn  = filtered.filter(e => e.type === 'entrada').reduce((s,e)=>s+Number(e.amount),0)
  const totalOut = filtered.filter(e => e.type === 'saida'  ).reduce((s,e)=>s+Number(e.amount),0)
  const cashBal  = filtered.reduce((s,e)=> e.destination==='caixa' ? s+(e.type==='entrada'?Number(e.amount):-Number(e.amount)) : s, 0)
  const bankBal  = filtered.reduce((s,e)=> e.destination==='banco' ? s+(e.type==='entrada'?Number(e.amount):-Number(e.amount)) : s, 0)

  async function addEntry() {
    if (!form.description || !form.amount || !form.entry_date) return
    setSaving(true)
    const { error } = await supabase.from('cash_entries').insert({
      entry_date: form.entry_date,
      doc: form.doc || null,
      description: form.description,
      type: form.type,
      amount: parseFloat(form.amount),
      destination: form.destination,
    })
    setSaving(false)
    if (error) { alert(error.message); return }
    setForm({ ...EMPTY_FORM })
    setShowForm(false)
    load()
  }

  async function removeEntry(id) {
    setEntries(prev => prev.filter(e => e.id !== id)) // optimistic
    const { error } = await supabase.from('cash_entries').delete().eq('id', id)
    if (error) { alert(error.message); load() }
  }

  const L = lang === 'de' ? {
    newEntry: '+ Neue Buchung', export: 'CSV exportieren', balance: 'Kassenbestand',
    income: 'Einnahmen', expense: 'Ausgaben', cash: 'Kasse', bank: 'Bank',
    date: 'Datum', doc: 'Belegnr.', desc: 'Beschreibung', type: 'Art',
    amount: 'Betrag (€)', dest: 'Konto', running: 'Bestand',
    entrada: 'Einnahme', saida: 'Ausgabe', caixa: 'Kasse', banco: 'Bank',
    save: 'Speichern', all: 'Alle Monate', noEntries: 'Noch keine Buchungen. Fügen Sie die erste hinzu.',
    loading: 'Wird geladen…', total: 'Summe',
  } : {
    newEntry: '+ Nova Entrada', export: 'Exportar CSV', balance: 'Saldo Atual',
    income: 'Total Entradas', expense: 'Total Saídas', cash: 'Em Caixa', bank: 'No Banco',
    date: 'Data', doc: 'Doc.', desc: 'Descrição', type: 'Tipo',
    amount: 'Valor (€)', dest: 'Destino', running: 'Saldo',
    entrada: 'Entrada', saida: 'Saída', caixa: 'Caixa', banco: 'Banco',
    save: 'Guardar', all: 'Todos os meses', noEntries: 'Ainda não há registos. Adicione o primeiro.',
    loading: 'A carregar…', total: 'Total',
  }

  const inputStyle = { padding: '8px 10px', borderRadius: '7px', border: '1px solid #dde8de', fontSize: '13px', background: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }
  const GRID = '110px 70px 1fr 100px 90px 90px 90px 36px'

  return (
    <div style={{ width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={{ ...selectStyle, width: 'auto', padding: '7px 12px' }}>
          <option value="all">{L.all}</option>
          {months.map((m,i) => <option key={i} value={String(i+1).padStart(2,'0')}>{m} 2026</option>)}
        </select>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => exportCSV(filtered, lang)} style={{ padding: '8px 14px', background: BG, border: '1px solid #dde8de', borderRadius: '8px', fontWeight: 600, fontSize: '12px', cursor: 'pointer', color: '#4a6355' }}>
            ⬇ {L.export}
          </button>
          <button onClick={() => { setShowForm(v => !v); setForm({ ...EMPTY_FORM }) }} style={{ padding: '8px 18px', background: G, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
            {L.newEntry}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: L.balance, value: totalIn - totalOut, color: (totalIn-totalOut)>=0 ? G : '#e53e3e', bg: '#fff' },
          { label: L.income,  value: totalIn,  color: '#065f46', bg: '#d1fae5' },
          { label: L.expense, value: totalOut, color: '#e53e3e', bg: '#fee2e2' },
          { label: L.cash,    value: cashBal,  color: G,         bg: '#f5edd6' },
          { label: L.bank,    value: bankBal,  color: '#1d4ed8', bg: '#eff6ff' },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: '12px', padding: '16px 14px', border: '1px solid #dde8de', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 900, color: c.color }}>€ {fmt(c.value)}</div>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background: '#fff', border: `2px solid ${GOLD}`, borderRadius: '12px', padding: '18px 20px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '130px 90px 1fr 110px 110px 110px auto', gap: '10px', alignItems: 'end' }}>
            {[
              [L.date, <input type="date" value={form.entry_date} onChange={e=>setForm(f=>({...f,entry_date:e.target.value}))} style={inputStyle} />],
              [L.doc,  <input value={form.doc} onChange={e=>setForm(f=>({...f,doc:e.target.value}))} placeholder="001" style={inputStyle} />],
              [L.desc, <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder={lang==='de'?'Beschreibung…':'Descrição…'} style={inputStyle} />],
              [L.type, <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={selectStyle}><option value="entrada">{L.entrada}</option><option value="saida">{L.saida}</option></select>],
              [L.amount, <input type="number" step="0.01" min="0" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0.00" style={inputStyle} />],
              [L.dest, <select value={form.destination} onChange={e=>setForm(f=>({...f,destination:e.target.value}))} style={selectStyle}><option value="caixa">{L.caixa}</option><option value="banco">{L.banco}</option></select>],
            ].map(([label, field], i) => (
              <div key={i}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '5px' }}>{label}</div>
                {field}
              </div>
            ))}
            <div style={{ display: 'flex', gap: '6px', paddingBottom: '1px' }}>
              <button onClick={addEntry} disabled={saving} style={{ padding: '8px 14px', background: G, color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, fontSize: '13px', cursor: saving?'wait':'pointer', whiteSpace: 'nowrap' }}>{saving ? '…' : L.save}</button>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 12px', background: BG, border: '1px solid #dde8de', borderRadius: '7px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #dde8de', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '11px 18px', background: BG, borderBottom: '1px solid #dde8de', gap: '8px' }}>
          {[L.date, L.doc, L.desc, L.type, L.amount, L.dest, L.running, ''].map((h,i) => (
            <div key={i} style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {loading && <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>{L.loading}</div>}
        {!loading && withBalance.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>{L.noEntries}</div>}

        {!loading && withBalance.map((e, i) => (
          <div key={e.id} style={{ display: 'grid', gridTemplateColumns: GRID, padding: '13px 18px', borderBottom: i < withBalance.length-1 ? '1px solid #f0f4f1' : 'none', alignItems: 'center', gap: '8px', background: e.type === 'saida' ? '#fffbfb' : '#fff' }}>
            <div style={{ fontSize: '12px', color: '#4a6355' }}>{e.entry_date.split('-').reverse().join('/')}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{e.doc}</div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#1a2e1a' }}>{e.description}</div>
            <div><span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '10px', fontWeight: 800, background: e.type==='entrada'?'#d1fae5':'#fee2e2', color: e.type==='entrada'?'#065f46':'#991b1b' }}>{e.type==='entrada'?L.entrada:L.saida}</span></div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: e.type==='entrada'?'#065f46':'#e53e3e', textAlign: 'right' }}>{e.type==='entrada'?'+':'−'} € {fmt(e.amount)}</div>
            <div><span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: e.destination==='caixa'?'#f5edd6':'#eff6ff', color: e.destination==='caixa'?'#92400e':'#1d4ed8' }}>{e.destination==='caixa'?L.caixa:L.banco}</span></div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: e.balance>=0?G:'#e53e3e', textAlign: 'right' }}>€ {fmt(e.balance)}</div>
            <button onClick={() => removeEntry(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#cbd5e1', padding: '2px', borderRadius: '4px', lineHeight: 1 }} title="Remover">✕</button>
          </div>
        ))}

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
  )
}
