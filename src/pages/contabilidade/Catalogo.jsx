import { useState, useEffect, useCallback } from 'react'
import { useLang } from '../../context/LangContext'
import { supabase } from '../../lib/supabase'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useTheme } from '../../context/ThemeContext'
import { useEffectiveUserId, useViewAs } from '../../context/ViewAsContext'

const G = '#0a2f1a'
const GOLD = '#c9a84c'
const BG = '#f2f6f3'

const fmt = (n) => n == null || n === '' ? '—' : `€ ${(Number(n)||0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const KIND_STYLE = {
  product: { bg: '#ede9fe', color: '#5b21b6' },
  service: { bg: '#e8f5ec', color: G },
}

const EMPTY = { name: '', kind: 'service', price: '' }

export default function Catalogo() {
  const { lang } = useLang()
  const { t } = useTheme()
  const G = t.heading, GOLD = t.accent, BG = t.softCardBg
  const isMobile = useIsMobile()
  const eid = useEffectiveUserId()
  const { isViewing } = useViewAs()
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [filter, setFilter]   = useState('all')
  const [form, setForm]       = useState(EMPTY)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    if (!eid) return
    setLoading(true)
    const { data, error } = await supabase.from('catalog_items').select('*').eq('user_id', eid).order('created_at', { ascending: true })
    if (!error) setItems(data || [])
    setLoading(false)
  }, [eid])
  useEffect(() => { load() }, [load])

  const L = lang === 'de' ? {
    new: '+ Neuer Eintrag', name: 'Bezeichnung', kind: 'Typ', price: 'Preis (€)',
    product: 'Produkt', service: 'Dienstleistung', all: 'Alle',
    save: 'Speichern', loading: 'Wird geladen…', empty: 'Noch keine Einträge. Fügen Sie den ersten hinzu.',
    namePh: 'z.B. Beratungsstunde, Menü A…', intro: 'Produkte und Dienstleistungen, die Sie mit Buchungen verknüpfen können.',
  } : lang === 'en' ? {
    new: '+ New Item', name: 'Name', kind: 'Type', price: 'Price (€)',
    product: 'Product', service: 'Service', all: 'All',
    save: 'Save', loading: 'Loading…', empty: 'No items yet. Add the first one.',
    namePh: 'e.g. Consulting hour, Menu A…', intro: 'Products and services you can link to Cash Book entries.',
  } : {
    new: '+ Novo Item', name: 'Designação', kind: 'Tipo', price: 'Preço (€)',
    product: 'Produto', service: 'Serviço', all: 'Todos',
    save: 'Guardar', loading: 'A carregar…', empty: 'Ainda não há itens. Adicione o primeiro.',
    namePh: 'ex: Hora de consultoria, Menu A…', intro: 'Produtos e serviços que pode vincular aos lançamentos do Livro de Caixa.',
  }

  const visible = filter === 'all' ? items : items.filter(i => i.kind === filter)

  const filterBtnStyle = (val) => ({
    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
    border: `1px solid ${filter === val ? G : '#dde8de'}`,
    background: filter === val ? t.accent : t.cardBg, color: filter === val ? '#fff' : '#64748b',
  })

  async function addItem() {
    if (isViewing) return
    if (!form.name) return
    setSaving(true)
    const { error } = await supabase.from('catalog_items').insert({
      name: form.name, kind: form.kind,
      price: form.price === '' ? null : parseFloat(form.price),
    })
    setSaving(false)
    if (error) { alert(error.message); return }
    setForm(EMPTY); setShowForm(false); load()
  }
  async function removeItem(id) {
    if (isViewing) return
    setItems(prev => prev.filter(i => i.id !== id))
    const { error } = await supabase.from('catalog_items').delete().eq('id', id)
    if (error) { alert(error.message); load() }
  }

  const inputStyle = { padding: '8px 10px', borderRadius: '7px', border: `1px solid ${t.cardBorder}`, fontSize: '13px', background: t.cardBg, outline: 'none', width: '100%', boxSizing: 'border-box' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }
  const GRID = '1fr 140px 140px 36px'

  return (
    <div style={{ width: '100%' }}>

      {/* Intro + header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '16px' }}>
        <p style={{ fontSize: '13px', color: t.textMuted, margin: 0 }}>{L.intro}</p>
        {!isViewing && <button onClick={() => { setShowForm(v=>!v); setForm(EMPTY) }} style={{ padding: '9px 18px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          {L.new}
        </button>}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px', margin: '14px 0 16px' }}>
        {[['all', L.all], ['service', L.service], ['product', L.product]].map(([val, label]) => (
          <button key={val} style={filterBtnStyle(val)} onClick={() => setFilter(val)}>{label}</button>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background: t.cardBg, border: `2px solid ${GOLD}`, borderRadius: '12px', padding: '18px 20px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 160px 160px auto', gap: '10px', alignItems: 'end' }}>
            {[
              [L.name, <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder={L.namePh} style={inputStyle} />],
              [L.kind, <select value={form.kind} onChange={e=>setForm(f=>({...f,kind:e.target.value}))} style={selectStyle}><option value="service">{L.service}</option><option value="product">{L.product}</option></select>],
              [L.price, <input type="number" step="0.01" min="0" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} placeholder="0.00" style={inputStyle} />],
            ].map(([label, field], i) => (
              <div key={i}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, marginBottom: '5px' }}>{label}</div>
                {field}
              </div>
            ))}
            <div style={{ display: 'flex', gap: '6px', paddingBottom: '1px' }}>
              <button onClick={addItem} disabled={saving} style={{ padding: '8px 14px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '7px', fontWeight: 700, fontSize: '13px', cursor: saving?'wait':'pointer' }}>{saving?'…':L.save}</button>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 12px', background: BG, border: `1px solid ${t.cardBorder}`, borderRadius: '7px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: t.textMuted }}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-scroll">
      <div style={{ background: t.cardBg, borderRadius: '14px', border: `1px solid ${t.cardBorder}`, overflow: 'hidden', minWidth: isMobile ? '520px' : 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '12px 20px', background: BG, borderBottom: `1px solid ${t.cardBorder}`, gap: '8px' }}>
          {[L.name, L.kind, L.price, ''].map((h,i) => (
            <div key={i} style={{ fontSize: '10px', fontWeight: 800, color: t.textMuted, letterSpacing: '0.8px', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {loading && <div style={{ padding: '32px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>{L.loading}</div>}
        {!loading && visible.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>{L.empty}</div>}

        {!loading && visible.map((it, i) => {
          const ks = KIND_STYLE[it.kind] || {}
          return (
            <div key={it.id} style={{ display: 'grid', gridTemplateColumns: GRID, padding: '14px 20px', borderBottom: i < visible.length-1 ? `1px solid ${t.rowBorder}` : 'none', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: G }}>{it.name}</div>
              <div><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: ks.bg, color: ks.color }}>{it.kind === 'product' ? L.product : L.service}</span></div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: t.text }}>{fmt(it.price)}</div>
              {!isViewing && <button onClick={() => removeItem(it.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#cbd5e1', padding: '2px', lineHeight: 1 }} title="Remover">✕</button>}
            </div>
          )
        })}
      </div>
      </div>

    </div>
  )
}
