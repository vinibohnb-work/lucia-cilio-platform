import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLang } from '../../context/LangContext'
import { supabase } from '../../lib/supabase'
import { getCountryOptions, countryName } from '../../data/countries'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useTheme } from '../../context/ThemeContext'
import { getCompanySettings } from '../../lib/companySettings'
import { generateFiscalCalendar } from '../../lib/fiscalCalendar'
import { useEffectiveUserId, useViewAs } from '../../context/ViewAsContext'
import EstimateNote from '../../components/EstimateNote'

const G = '#0a2f1a'
const GOLD = '#c9a84c'
const BG = '#f2f6f3'

const STATUS_STYLE = {
  pending: { bg: '#fef3c7', color: '#92400e' },
  done:    { bg: '#d1fae5', color: '#065f46' },
}

function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0,0,0,0)
  const target = new Date(dateStr)
  return Math.round((target - today) / 86400000)
}

const EMPTY = { obligation_type: '', client: '', country: '', deadline: new Date().toISOString().slice(0,10), status: 'pending' }

export default function ObrigacoesFiscais() {
  const { lang } = useLang()
  const { t } = useTheme()
  const G = t.heading, GOLD = t.accent, BG = t.softCardBg
  const isMobile = useIsMobile()
  const [items, setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [filter, setFilter]   = useState('all')      // 'all' | 'pending'
  const [countryFilter, setCountryFilter] = useState('all')
  const [form, setForm]       = useState(EMPTY)
  const [showForm, setShowForm] = useState(false)
  const [genYear, setGenYear] = useState(new Date().getFullYear())
  const [generating, setGenerating] = useState(false)
  const [genMsg, setGenMsg]   = useState('')

  const eid = useEffectiveUserId()
  const { isViewing } = useViewAs()
  const countryOptions = useMemo(() => getCountryOptions(lang), [lang])

  const load = useCallback(async () => {
    if (!eid) return
    setLoading(true)
    const { data, error } = await supabase.from('fiscal_obligations').select('*').eq('user_id', eid).order('deadline', { ascending: true })
    if (!error) setItems(data || [])
    setLoading(false)
  }, [eid])
  useEffect(() => { load() }, [load])

  const presentCountries = useMemo(() => {
    const codes = [...new Set(items.map(o => (o.country || '').toUpperCase()).filter(Boolean))]
    return codes.map(code => ({ code, name: countryName(code, lang) })).sort((a,b) => a.name.localeCompare(b.name))
  }, [items, lang])

  const L = lang === 'de' ? {
    new: '+ Neuer Termin', pending: 'Offen', done: 'Erledigt', deadline: 'Frist',
    country: 'Land', client: 'Mandant', type: 'Verpflichtung', status: 'Status',
    all: 'Alle', save: 'Speichern', loading: 'Wird geladen…',
    empty: 'Noch keine Termine. Fügen Sie den ersten hinzu.', typePh: 'z.B. Umsatzsteuervoranmeldung',
    days: 'Tage', today: 'Heute', overdue: 'überfällig', markDone: 'Als erledigt markieren',
    alert1: 'offene Frist', alert2: 'offene Fristen', allCountries: 'Alle Länder', selectCountry: '— Land wählen —',
    generate: 'Kalender erzeugen', auto: 'auto', genNone: 'Keine neuen Fristen — bereits erzeugt.',
    genOk: (n) => `${n} Frist(en) erzeugt.`, genErr: 'Erzeugen fehlgeschlagen (Migration 015 nötig).',
    genHint: 'Erzeugt USt-, Gewerbe- und Einkommensteuertermine aus den Firmendaten (Schätzung).',
  } : lang === 'en' ? {
    new: '+ New Obligation', pending: 'Pending', done: 'Submitted', deadline: 'Deadline',
    country: 'Country', client: 'Client', type: 'Obligation', status: 'Status',
    all: 'All', save: 'Save', loading: 'Loading…',
    empty: 'No obligations yet. Add the first one.', typePh: 'e.g. VAT return, income tax…',
    days: 'days', today: 'Today', overdue: 'overdue', markDone: 'Mark as submitted',
    alert1: 'pending obligation', alert2: 'pending obligations', allCountries: 'All countries', selectCountry: '— Select country —',
    generate: 'Generate calendar', auto: 'auto', genNone: 'No new deadlines — already generated.',
    genOk: (n) => `${n} deadline(s) generated.`, genErr: 'Generation failed (migration 015 required).',
    genHint: 'Generates VAT, trade and income tax deadlines from the company details (estimate).',
  } : {
    new: '+ Nova Obrigação', pending: 'Pendente', done: 'Entregue', deadline: 'Prazo',
    country: 'País', client: 'Cliente', type: 'Obrigação', status: 'Estado',
    all: 'Todas', save: 'Guardar', loading: 'A carregar…',
    empty: 'Ainda não há obrigações. Adicione a primeira.', typePh: 'ex: DMR, IRS, IVA…',
    days: 'dias', today: 'Hoje', overdue: 'em atraso', markDone: 'Marcar como entregue',
    alert1: 'obrigação pendente', alert2: 'obrigações pendentes', allCountries: 'Todos os países', selectCountry: '— Selecionar país —',
    generate: 'Gerar calendário', auto: 'auto', genNone: 'Sem novos prazos — já foram gerados.',
    genOk: (n) => `${n} prazo(s) gerado(s).`, genErr: 'Falha ao gerar (é necessária a migração 015).',
    genHint: 'Gera prazos de IVA, Segurança Social e IRS a partir dos Dados da Empresa (estimativa).',
  }

  const visible = items.filter(o => {
    if (filter === 'pending' && o.status !== 'pending') return false
    if (countryFilter !== 'all' && (o.country || '').toUpperCase() !== countryFilter) return false
    return true
  })

  const filterBtnStyle = (val) => ({
    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
    border: `1px solid ${filter === val ? G : '#dde8de'}`,
    background: filter === val ? t.accent : t.cardBg, color: filter === val ? '#fff' : '#64748b',
  })

  const pendingCount = items.filter(o => o.status === 'pending').length

  async function addItem() {
    if (isViewing) return
    if (!form.obligation_type || !form.deadline || !form.country) return
    setSaving(true)
    const { error } = await supabase.from('fiscal_obligations').insert({ ...form, country: form.country.toUpperCase(), client: form.client || null })
    setSaving(false)
    if (error) { alert(error.message); return }
    setForm(EMPTY); setShowForm(false); load()
  }
  async function toggleStatus(o) {
    if (isViewing) return
    const next = o.status === 'done' ? 'pending' : 'done'
    setItems(prev => prev.map(x => x.id === o.id ? { ...x, status: next } : x))
    const { error } = await supabase.from('fiscal_obligations').update({ status: next }).eq('id', o.id)
    if (error) { alert(error.message); load() }
  }
  async function removeItem(id) {
    if (isViewing) return
    setItems(prev => prev.filter(o => o.id !== id))
    const { error } = await supabase.from('fiscal_obligations').delete().eq('id', id)
    if (error) { alert(error.message); load() }
  }

  // Gera o calendário fiscal do ano a partir dos Dados da Empresa (país/regime),
  // ignorando os prazos já gerados (por `code`).
  async function generateCalendar() {
    if (isViewing) return
    setGenerating(true); setGenMsg('')
    try {
      const settings = await getCompanySettings(eid)
      const generated = generateFiscalCalendar(settings, Number(genYear))
      const existingCodes = new Set(items.filter(o => o.code).map(o => o.code))
      const toInsert = generated.filter(g => !existingCodes.has(g.code)).map(g => ({ ...g, status: 'pending' }))
      if (toInsert.length === 0) { setGenMsg(L.genNone); setGenerating(false); return }
      const { error } = await supabase.from('fiscal_obligations').insert(toInsert)
      if (error) throw error
      setGenMsg(L.genOk(toInsert.length))
      await load()
    } catch (e) {
      setGenMsg(L.genErr)
    }
    setGenerating(false)
    setTimeout(() => setGenMsg(''), 4000)
  }

  const inputStyle = { padding: '8px 10px', borderRadius: '7px', border: `1px solid ${t.cardBorder}`, fontSize: '13px', background: t.cardBg, outline: 'none', width: '100%', boxSizing: 'border-box' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }
  const GRID = '2fr 1fr 140px 120px 110px 90px'

  return (
    <div style={{ width: '100%' }}>
      <EstimateNote />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {[['all', L.all], ['pending', L.pending]].map(([val, label]) => (
            <button key={val} style={filterBtnStyle(val)} onClick={() => setFilter(val)}>{label}</button>
          ))}
          <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} style={{ ...selectStyle, width: 'auto', minWidth: '180px', padding: '7px 12px' }}>
            <option value="all">{L.allCountries}</option>
            {presentCountries.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </div>
        {!isViewing && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="number" value={genYear} onChange={e => setGenYear(e.target.value)} title={L.genHint} style={{ ...selectStyle, width: '84px', padding: '8px 10px' }} />
          <button onClick={generateCalendar} disabled={generating} title={L.genHint} style={{ padding: '9px 14px', background: BG, color: '#4a6355', border: `1px solid ${t.cardBorder}`, borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: generating ? 'wait' : 'pointer' }}>
            📅 {generating ? '…' : L.generate}
          </button>
          <button onClick={() => { setShowForm(v=>!v); setForm(EMPTY) }} style={{ padding: '9px 18px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
            {L.new}
          </button>
        </div>
        )}
      </div>
      {genMsg && <div style={{ fontSize: '12px', fontWeight: 700, color: genMsg === L.genErr ? t.neg : '#0a7a3e', marginBottom: '14px' }}>{genMsg}</div>}

      {/* Alert */}
      {!loading && pendingCount > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '12px 18px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#92400e' }}>
            {pendingCount} {pendingCount > 1 ? L.alert2 : L.alert1}
          </span>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div style={{ background: t.cardBg, border: `2px solid ${GOLD}`, borderRadius: '12px', padding: '18px 20px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr 150px auto', gap: '10px', alignItems: 'end' }}>
            {[
              [L.type, <input value={form.obligation_type} onChange={e=>setForm(f=>({...f,obligation_type:e.target.value}))} placeholder={L.typePh} style={inputStyle} />],
              [L.client, <input value={form.client} onChange={e=>setForm(f=>({...f,client:e.target.value}))} placeholder={L.client} style={inputStyle} />],
              [L.country, (
                <select value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))} style={selectStyle}>
                  <option value="">{L.selectCountry}</option>
                  {countryOptions.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              )],
              [L.deadline, <input type="date" value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))} style={inputStyle} />],
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

      {/* List */}
      <div className="table-scroll">
      <div style={{ background: t.cardBg, borderRadius: '14px', border: `1px solid ${t.cardBorder}`, overflow: 'hidden', minWidth: isMobile ? '720px' : 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '12px 20px', background: BG, borderBottom: `1px solid ${t.cardBorder}`, gap: '8px' }}>
          {[L.type, L.client, L.country, L.deadline, L.status, ''].map((h,i) => (
            <div key={i} style={{ fontSize: '10px', fontWeight: 800, color: t.textMuted, letterSpacing: '0.8px', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {loading && <div style={{ padding: '32px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>{L.loading}</div>}
        {!loading && visible.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>{L.empty}</div>}

        {!loading && visible.map((o, i) => {
          const st = STATUS_STYLE[o.status] || {}
          const days = daysUntil(o.deadline)
          const isDone = o.status === 'done'
          const dateColor = isDone ? '#64748b' : days < 0 ? '#991b1b' : days <= 14 ? '#e53e3e' : G
          return (
            <div key={o.id} style={{ display: 'grid', gridTemplateColumns: GRID, padding: '14px 20px', borderBottom: i < visible.length-1 ? `1px solid ${t.rowBorder}` : 'none', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#1a2e1a', lineHeight: 1.4 }}>
                {o.obligation_type}
                {o.source === 'auto' && <span style={{ marginLeft: '7px', fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '20px', background: '#ede9fe', color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{L.auto}</span>}
              </div>
              <div style={{ fontSize: '12px', color: t.text, fontWeight: 500 }}>{o.client || '—'}</div>
              <div style={{ fontSize: '12px', color: t.text }}>{countryName(o.country, lang) || '—'}</div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: dateColor }}>{o.deadline.split('-').reverse().join('/')}</div>
                {!isDone && (
                  <div style={{ fontSize: '10px', color: days <= 14 ? '#e53e3e' : '#64748b', marginTop: '2px' }}>
                    {days > 0 ? `${days} ${L.days}` : days === 0 ? L.today : `${Math.abs(days)} ${L.days} ${L.overdue}`}
                  </div>
                )}
              </div>
              <div>
                <button onClick={() => toggleStatus(o)} disabled={isViewing} title={L.markDone} style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: st.bg, color: st.color, border: 'none', cursor: isViewing ? 'default' : 'pointer' }}>
                  {isDone ? `✓ ${L.done}` : L.pending}
                </button>
              </div>
              {!isViewing && <button onClick={() => removeItem(o.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#cbd5e1', padding: '2px', lineHeight: 1, justifySelf: 'start' }} title="Remover">✕</button>}
            </div>
          )
        })}
      </div>
      </div>

    </div>
  )
}
