import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLang } from '../../context/LangContext'
import { supabase } from '../../lib/supabase'
import { getCountryOptions, countryName } from '../../data/countries'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useTheme } from '../../context/ThemeContext'

const BRAND_G = '#0a2f1a'

const SERVICE_STYLE = {
  esg:  { bg: '#e8f5ec', color: BRAND_G },
  acc:  { bg: '#f5edd6', color: '#92400e' },
  both: { bg: '#ede9fe', color: '#5b21b6' },
}
const STATUS_STYLE = {
  active:   { bg: '#d1fae5', color: '#065f46' },
  inactive: { bg: '#f1f5f9', color: '#8a9990' },
}

const EMPTY = { name: '', country: '', sector: '', service: 'acc', status: 'active' }

export default function Clientes() {
  const { lang } = useLang()
  const { t } = useTheme()
  const G = t.heading, GOLD = t.accent, BG = t.softCardBg
  const isMobile = useIsMobile()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [filter, setFilter]   = useState('all') // 'all' | código de país
  const [form, setForm]       = useState(EMPTY)
  const [showForm, setShowForm] = useState(false)

  const countryOptions = useMemo(() => getCountryOptions(lang), [lang])

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
    all: 'Alle Länder', save: 'Speichern', loading: 'Wird geladen…', empty: 'Noch keine Mandanten. Fügen Sie den ersten hinzu.',
    total: 'Insgesamt', countries: 'Länder', sectorPh: 'z.B. Bau, Industrie…', selectCountry: '— Land wählen —',
  } : {
    new: '+ Novo Cliente', name: 'Nome', country: 'País', sector: 'Setor', service: 'Serviço', status: 'Estado',
    active: 'Ativo', inactive: 'Inativo', esg: 'ESG', acc: 'Contabilidade', both: 'ESG + Cont.',
    all: 'Todos os países', save: 'Guardar', loading: 'A carregar…', empty: 'Ainda não há clientes. Adicione o primeiro.',
    total: 'Total', countries: 'Países', sectorPh: 'ex: Construção, Indústria…', selectCountry: '— Selecionar país —',
  }

  // Países presentes nos dados (para o filtro dinâmico)
  const presentCountries = useMemo(() => {
    const codes = [...new Set(clients.map(c => (c.country || '').toUpperCase()).filter(Boolean))]
    return codes.map(code => ({ code, name: countryName(code, lang) })).sort((a,b) => a.name.localeCompare(b.name))
  }, [clients, lang])

  const visible = filter === 'all' ? clients : clients.filter(c => (c.country || '').toUpperCase() === filter)

  async function addClient() {
    if (!form.name || !form.country) return
    setSaving(true)
    const { error } = await supabase.from('clients').insert({ ...form, country: form.country.toUpperCase(), sector: form.sector || null })
    setSaving(false)
    if (error) { alert(error.message); return }
    setForm(EMPTY); setShowForm(false); load()
  }
  async function removeClient(id) {
    setClients(prev => prev.filter(c => c.id !== id))
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) { alert(error.message); load() }
  }

  const inputStyle = { padding: '8px 10px', borderRadius: '7px', border: `1px solid ${t.cardBorder}`, fontSize: '13px', background: t.cardBg, outline: 'none', width: '100%', boxSizing: 'border-box' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }
  const GRID = '1fr 150px 150px 140px 110px 36px'

  return (
    <div style={{ width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        {/* Filtro dinâmico por país (só os que existem nos dados) */}
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ ...selectStyle, width: 'auto', minWidth: '200px', padding: '7px 12px' }}>
          <option value="all">{L.all}</option>
          {presentCountries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
        </select>
        <button onClick={() => { setShowForm(v=>!v); setForm(EMPTY) }} style={{ padding: '9px 18px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
          {L.new}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background: t.cardBg, border: `2px solid ${GOLD}`, borderRadius: '12px', padding: '18px 20px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr 140px 130px auto', gap: '10px', alignItems: 'end' }}>
            {[
              [L.name, <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder={L.name} style={inputStyle} />],
              [L.country, (
                <select value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))} style={selectStyle}>
                  <option value="">{L.selectCountry}</option>
                  {countryOptions.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              )],
              [L.sector, <input value={form.sector} onChange={e=>setForm(f=>({...f,sector:e.target.value}))} placeholder={L.sectorPh} style={inputStyle} />],
              [L.service, <select value={form.service} onChange={e=>setForm(f=>({...f,service:e.target.value}))} style={selectStyle}><option value="acc">{L.acc}</option><option value="esg">{L.esg}</option><option value="both">{L.both}</option></select>],
              [L.status, <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={selectStyle}><option value="active">{L.active}</option><option value="inactive">{L.inactive}</option></select>],
            ].map(([label, field], i) => (
              <div key={i}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, marginBottom: '5px' }}>{label}</div>
                {field}
              </div>
            ))}
            <div style={{ display: 'flex', gap: '6px', paddingBottom: '1px' }}>
              <button onClick={addClient} disabled={saving} style={{ padding: '8px 14px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '7px', fontWeight: 700, fontSize: '13px', cursor: saving?'wait':'pointer' }}>{saving?'…':L.save}</button>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 12px', background: BG, border: `1px solid ${t.cardBorder}`, borderRadius: '7px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: t.textMuted }}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-scroll">
      <div style={{ background: t.cardBg, borderRadius: '14px', border: `1px solid ${t.cardBorder}`, overflow: 'hidden', minWidth: isMobile ? '720px' : 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '12px 20px', background: BG, borderBottom: `1px solid ${t.cardBorder}`, gap: '8px' }}>
          {[L.name, L.country, L.sector, L.service, L.status, ''].map((h,i) => (
            <div key={i} style={{ fontSize: '10px', fontWeight: 800, color: t.textMuted, letterSpacing: '0.8px', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {loading && <div style={{ padding: '32px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>{L.loading}</div>}
        {!loading && visible.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>{L.empty}</div>}

        {!loading && visible.map((c, i) => {
          const svc = SERVICE_STYLE[c.service] || {}
          const st  = STATUS_STYLE[c.status] || {}
          return (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: GRID, padding: '14px 20px', borderBottom: i < visible.length-1 ? `1px solid ${t.rowBorder}` : 'none', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: G }}>{c.name}</div>
              <div style={{ fontSize: '12px', color: t.text }}>{countryName(c.country, lang) || '—'}</div>
              <div style={{ fontSize: '12px', color: t.text }}>{c.sector || '—'}</div>
              <div><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: svc.bg, color: svc.color }}>{L[c.service]}</span></div>
              <div><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: st.bg, color: st.color }}>{c.status==='active'?L.active:L.inactive}</span></div>
              <button onClick={() => removeClient(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#cbd5e1', padding: '2px', lineHeight: 1 }} title="Remover">✕</button>
            </div>
          )
        })}
      </div>
      </div>

      {/* Summary */}
      {!loading && (
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
          {[
            { label: L.total, val: clients.length, color: G },
            { label: L.countries, val: presentCountries.length, color: GOLD },
          ].map(s => (
            <div key={s.label} style={{ background: t.cardBg, borderRadius: '10px', padding: '12px 18px', border: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px', fontWeight: 900, color: s.color }}>{s.val}</span>
              <span style={{ fontSize: '11px', color: t.textMuted, fontWeight: 500 }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
