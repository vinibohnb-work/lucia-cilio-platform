import { useState, useEffect, useCallback } from 'react'
import { useLang } from '../../context/LangContext'
import { supabase } from '../../lib/supabase'

const G = '#0d3b20'
const GOLD = '#c9a84c'
const BG = '#f2f6f3'

const SERVICE_STYLE = {
  esg:  { bg: '#e8f5ec', color: G },
  acc:  { bg: '#f5edd6', color: '#92400e' },
  both: { bg: '#ede9fe', color: '#5b21b6' },
}
const STATUS_STYLE = {
  active:   { bg: '#d1fae5', color: '#065f46' },
  inactive: { bg: '#f1f5f9', color: '#64748b' },
}

const EMPTY = { name: '', country: 'pt', sector: '', service: 'acc', status: 'active' }

export default function Clientes() {
  const { lang } = useLang()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [filter, setFilter]   = useState('all')
  const [form, setForm]       = useState(EMPTY)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: true })
    if (!error) setClients(data || [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const L = lang === 'de' ? {
    new: '+ Neuer Mandant', name: 'Name', country: 'Land', sector: 'Branche', service: 'Leistung', status: 'Status',
    active: 'Aktiv', inactive: 'Inaktiv', esg: 'ESG', acc: 'Buchhaltung', both: 'ESG + Buchh.',
    all: 'Alle', save: 'Speichern', loading: 'Wird geladen…', empty: 'Noch keine Mandanten. Fügen Sie den ersten hinzu.',
    total: 'Insgesamt', sectorPh: 'z.B. Bau, Industrie…',
  } : {
    new: '+ Novo Cliente', name: 'Nome', country: 'País', sector: 'Setor', service: 'Serviço', status: 'Estado',
    active: 'Ativo', inactive: 'Inativo', esg: 'ESG', acc: 'Contabilidade', both: 'ESG + Cont.',
    all: 'Todos', save: 'Guardar', loading: 'A carregar…', empty: 'Ainda não há clientes. Adicione o primeiro.',
    total: 'Total', sectorPh: 'ex: Construção, Indústria…',
  }

  const visible = filter === 'all' ? clients : clients.filter(c => c.country === filter)

  const filterBtnStyle = (val) => ({
    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
    border: `1px solid ${filter === val ? G : '#dde8de'}`,
    background: filter === val ? G : '#fff', color: filter === val ? '#fff' : '#64748b',
  })

  async function addClient() {
    if (!form.name) return
    setSaving(true)
    const { error } = await supabase.from('clients').insert({ ...form, sector: form.sector || null })
    setSaving(false)
    if (error) { alert(error.message); return }
    setForm(EMPTY); setShowForm(false); load()
  }
  async function removeClient(id) {
    setClients(prev => prev.filter(c => c.id !== id))
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) { alert(error.message); load() }
  }

  const inputStyle = { padding: '8px 10px', borderRadius: '7px', border: '1px solid #dde8de', fontSize: '13px', background: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }
  const GRID = '1fr 80px 150px 140px 110px 36px'

  return (
    <div style={{ width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[['all', L.all], ['pt', '🇵🇹 Portugal'], ['de', '🇩🇪 Deutschland']].map(([val, label]) => (
            <button key={val} style={filterBtnStyle(val)} onClick={() => setFilter(val)}>{label}</button>
          ))}
        </div>
        <button onClick={() => { setShowForm(v=>!v); setForm(EMPTY) }} style={{ padding: '9px 18px', background: G, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
          {L.new}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background: '#fff', border: `2px solid ${GOLD}`, borderRadius: '12px', padding: '18px 20px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 1fr 140px 130px auto', gap: '10px', alignItems: 'end' }}>
            {[
              [L.name, <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder={L.name} style={inputStyle} />],
              [L.country, <select value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))} style={selectStyle}><option value="pt">🇵🇹 PT</option><option value="de">🇩🇪 DE</option></select>],
              [L.sector, <input value={form.sector} onChange={e=>setForm(f=>({...f,sector:e.target.value}))} placeholder={L.sectorPh} style={inputStyle} />],
              [L.service, <select value={form.service} onChange={e=>setForm(f=>({...f,service:e.target.value}))} style={selectStyle}><option value="acc">{L.acc}</option><option value="esg">{L.esg}</option><option value="both">{L.both}</option></select>],
              [L.status, <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={selectStyle}><option value="active">{L.active}</option><option value="inactive">{L.inactive}</option></select>],
            ].map(([label, field], i) => (
              <div key={i}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '5px' }}>{label}</div>
                {field}
              </div>
            ))}
            <div style={{ display: 'flex', gap: '6px', paddingBottom: '1px' }}>
              <button onClick={addClient} disabled={saving} style={{ padding: '8px 14px', background: G, color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, fontSize: '13px', cursor: saving?'wait':'pointer' }}>{saving?'…':L.save}</button>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 12px', background: BG, border: '1px solid #dde8de', borderRadius: '7px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #dde8de', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '12px 20px', background: BG, borderBottom: '1px solid #dde8de', gap: '8px' }}>
          {[L.name, L.country, L.sector, L.service, L.status, ''].map((h,i) => (
            <div key={i} style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {loading && <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>{L.loading}</div>}
        {!loading && visible.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>{L.empty}</div>}

        {!loading && visible.map((c, i) => {
          const svc = SERVICE_STYLE[c.service] || {}
          const st  = STATUS_STYLE[c.status] || {}
          return (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: GRID, padding: '14px 20px', borderBottom: i < visible.length-1 ? '1px solid #f0f4f1' : 'none', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: G }}>{c.name}</div>
              <div style={{ fontSize: '20px' }}>{c.country === 'pt' ? '🇵🇹' : '🇩🇪'}</div>
              <div style={{ fontSize: '12px', color: '#4a6355' }}>{c.sector || '—'}</div>
              <div><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: svc.bg, color: svc.color }}>{L[c.service]}</span></div>
              <div><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: st.bg, color: st.color }}>{c.status==='active'?L.active:L.inactive}</span></div>
              <button onClick={() => removeClient(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#cbd5e1', padding: '2px', lineHeight: 1 }} title="Remover">✕</button>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      {!loading && (
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
          {[
            { label: L.total, val: clients.length, color: G },
            { label: 'Portugal', val: clients.filter(c=>c.country==='pt').length, color: '#1a5c32' },
            { label: 'Deutschland', val: clients.filter(c=>c.country==='de').length, color: GOLD },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: '10px', padding: '12px 18px', border: '1px solid #dde8de', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px', fontWeight: 900, color: s.color }}>{s.val}</span>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
