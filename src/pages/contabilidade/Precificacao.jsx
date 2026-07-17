import { useState, useEffect } from 'react'
import { useLang } from '../../context/LangContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { getCompanySettings } from '../../lib/companySettings'
import { useTheme } from '../../context/ThemeContext'
import { computeTreatment } from '../../lib/treatmentCalc'
import { useEffectiveUserId } from '../../context/ViewAsContext'

const G = '#0a2f1a'
const GOLD = '#c9a84c'
const BG = '#f2f6f3'

const fmt = (n) => isNaN(n) ? '0,00' : n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const p   = (v)  => parseFloat(v) || 0

// ── Tipo: Evento / Catering ────────────────────────────────────────────────
function EventoCalculator({ lang, irDefault }) {
  const isDE = lang === 'de'
  const isMobile = useIsMobile()
  const { t } = useTheme()
  const G = t.heading, GOLD = t.accent, BG = t.softCardBg
  const ivaDefault = isDE ? 19 : 23

  const [adults,   setAdults  ] = useState(50)
  const [children, setChildren] = useState(7)
  const [menuPrice,setMenuPrice] = useState(25)
  const [staff, setStaff] = useState([
    { name: isDE ? 'Köchin' : 'Chefe de Cozinha', hours: 18, rate: 45 },
    { name: isDE ? 'Helfer' : 'Assistente',        hours: 8,  rate: 20 },
  ])
  const [extraCosts, setExtraCosts] = useState(120)
  const [margin,     setMargin    ] = useState(10)
  const [ivaRate,    setIvaRate   ] = useState(ivaDefault)
  const [irPct,      setIrPct     ] = useState(0)
  const [round,      setRound     ] = useState(true)

  const menuTotal   = p(adults) * p(menuPrice) + p(children) * p(menuPrice) * 0.5
  const staffTotal  = staff.reduce((s, m) => s + p(m.hours) * p(m.rate), 0)
  const costsTotal  = menuTotal + staffTotal + p(extraCosts)
  const withMargin  = costsTotal * (1 + p(margin) / 100)
  const rounded     = round ? Math.ceil(withMargin / 10) * 10 : withMargin
  const irAmt       = rounded * p(irPct) / 100
  const baseNoIva   = rounded + irAmt
  const ivaAmt      = baseNoIva * p(ivaRate) / 100
  const total       = baseNoIva + ivaAmt
  const perPerson   = p(adults) + p(children) > 0 ? total / (p(adults) + p(children)) : 0

  function updateStaff(i, field, val) {
    setStaff(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m))
  }
  function addStaff()    { setStaff(prev => [...prev, { name: '', hours: 0, rate: 0 }]) }
  function removeStaff(i){ setStaff(prev => prev.filter((_,idx) => idx !== i)) }

  const L = isDE ? {
    guests: 'Gäste', adults: 'Erwachsene', children: 'Kinder (50%)', menuPrice: 'Preis/Person (€)',
    menuTotal: 'Menü-Kosten', staff: 'Personal', hours: 'Std.', rate: '€/Std.',
    addPerson: '+ Person', extraCosts: 'Sonstige Kosten (€)', margin: 'Gewinnmarge (%)',
    ivaRate: 'MwSt. (%)', round: 'Runden (auf 10 €)', perPerson: 'Pro Person',
    costLabel: 'Gesamtkosten', priceNoIva: 'Preis ohne MwSt.', ivaLabel: `MwSt. (${ivaRate}%)`,
    priceWithIva: 'Gesamtpreis mit MwSt.', name: 'Name',
    ir: 'IR-Rücklage (%)', irAmount: 'IR-Rücklage', irHint: 'Vorschlag',
  } : lang === 'en' ? {
    guests: 'Guests', adults: 'Adults', children: 'Children (50%)', menuPrice: 'Price/person (€)',
    menuTotal: 'Menu Cost', staff: 'Staff', hours: 'Hours', rate: '€/hour',
    addPerson: '+ Add person', extraCosts: 'Additional costs (€)', margin: 'Profit margin (%)',
    ivaRate: 'VAT (%)', round: 'Round (to €10)', perPerson: 'Per person',
    costLabel: 'Total Costs', priceNoIva: 'Price excl. VAT', ivaLabel: `VAT (${ivaRate}%)`,
    priceWithIva: 'Final price incl. VAT', name: 'Name',
    ir: 'Income tax reserve (%)', irAmount: 'Income tax reserve', irHint: 'suggested',
  } : {
    guests: 'Convidados', adults: 'Adultos', children: 'Crianças (50%)', menuPrice: 'Preço/adulto (€)',
    menuTotal: 'Custo do Menu', staff: 'Equipa', hours: 'Horas', rate: '€/hora',
    addPerson: '+ Adicionar pessoa', extraCosts: 'Custos adicionais (€)', margin: 'Margem de lucro (%)',
    ivaRate: 'IVA (%)', round: 'Arredondar (a 10 €)', perPerson: 'Por pessoa',
    costLabel: 'Total de Custos', priceNoIva: 'Preço sem IVA', ivaLabel: `IVA (${ivaRate}%)`,
    priceWithIva: 'Preço final com IVA', name: 'Nome',
    ir: 'Reserva IR (%)', irAmount: 'Reserva IR', irHint: 'sugestão',
  }

  const inputSm = { padding: '7px 9px', border: `1px solid ${t.cardBorder}`, borderRadius: '7px', fontSize: '13px', background: t.cardBg, width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: '20px', alignItems: 'start' }}>

      {/* Left: inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Guests & menu */}
        <div style={{ background: t.cardBg, borderRadius: '12px', padding: '18px 20px', border: `1px solid ${t.cardBorder}` }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: G, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{L.guests}</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: '10px' }}>
            {[
              [L.adults,    adults,    setAdults   ],
              [L.children,  children,  setChildren ],
              [L.menuPrice, menuPrice, setMenuPrice],
            ].map(([label, val, set]) => (
              <div key={label}>
                <div style={{ fontSize: '11px', color: t.textMuted, fontWeight: 600, marginBottom: '5px' }}>{label}</div>
                <input type="number" min="0" step="1" value={val} onChange={e => set(e.target.value)} style={inputSm} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: t.text }}>
            {L.menuTotal}: <strong>€ {fmt(menuTotal)}</strong>
            <span style={{ marginLeft: '12px', fontSize: '11px', color: t.subtle }}>
              ({p(adults)} × €{fmt(p(menuPrice))} + {p(children)} × €{fmt(p(menuPrice)*0.5)})
            </span>
          </div>
        </div>

        {/* Staff */}
        <div style={{ background: t.cardBg, borderRadius: '12px', padding: '18px 20px', border: `1px solid ${t.cardBorder}` }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: G, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{L.staff}</div>
          {staff.map((m, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px 32px', gap: '8px', marginBottom: '8px', alignItems: 'end' }}>
              <div>
                {i === 0 && <div style={{ fontSize: '11px', color: t.textMuted, fontWeight: 600, marginBottom: '4px' }}>{L.name}</div>}
                <input value={m.name} onChange={e => updateStaff(i,'name',e.target.value)} style={inputSm} placeholder={L.name} />
              </div>
              <div>
                {i === 0 && <div style={{ fontSize: '11px', color: t.textMuted, fontWeight: 600, marginBottom: '4px' }}>{L.hours}</div>}
                <input type="number" min="0" value={m.hours} onChange={e => updateStaff(i,'hours',e.target.value)} style={inputSm} />
              </div>
              <div>
                {i === 0 && <div style={{ fontSize: '11px', color: t.textMuted, fontWeight: 600, marginBottom: '4px' }}>{L.rate}</div>}
                <input type="number" min="0" value={m.rate} onChange={e => updateStaff(i,'rate',e.target.value)} style={inputSm} />
              </div>
              <button onClick={() => removeStaff(i)} style={{ background: 'none', border: `1px solid ${t.cardBorder}`, borderRadius: '7px', cursor: 'pointer', fontSize: '13px', color: t.subtle, height: '34px', paddingBottom: '3px' }}>✕</button>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <button onClick={addStaff} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: G, fontWeight: 700, padding: 0 }}>{L.addPerson}</button>
            <span style={{ fontSize: '12px', color: t.text }}>{lang === 'de' ? 'Personal gesamt' : lang === 'en' ? 'Staff total' : 'Total equipa'}: <strong>€ {fmt(staffTotal)}</strong></span>
          </div>
        </div>

        {/* Extra costs & margin */}
        <div style={{ background: t.cardBg, borderRadius: '12px', padding: '18px 20px', border: `1px solid ${t.cardBorder}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr 150px', gap: '12px', alignItems: 'end' }}>
            {[
              [L.extraCosts, extraCosts, setExtraCosts, null],
              [L.margin,     margin,     setMargin,     null],
              [L.ivaRate,    ivaRate,    setIvaRate,    null],
              [L.ir,         irPct,      setIrPct,      irDefault ? `${L.irHint}: ${irDefault}%` : null],
            ].map(([label, val, set, hint]) => (
              <div key={label}>
                <div style={{ fontSize: '11px', color: t.textMuted, fontWeight: 600, marginBottom: '5px' }}>{label}</div>
                <input type="number" min="0" step="0.5" value={val} onChange={e => set(e.target.value)} style={inputSm} />
                {hint && <div style={{ fontSize: '10px', color: t.subtle, marginTop: '3px' }}>{hint}</div>}
              </div>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: t.text, fontWeight: 600, paddingBottom: '2px' }}>
              <input type="checkbox" checked={round} onChange={e => setRound(e.target.checked)} style={{ width: '15px', height: '15px', accentColor: G }} />
              {L.round}
            </label>
          </div>
        </div>
      </div>

      {/* Right: result card */}
      <div style={{ position: 'sticky', top: '20px' }}>
        <div style={{ background: t.highlightBg, borderRadius: '16px', padding: '24px', color: t.highlightValue }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,.5)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '20px' }}>
            {lang === 'de' ? 'Kalkulation' : lang === 'en' ? 'Result' : 'Resultado'}
          </div>

          {[
            { label: L.costLabel,   value: costsTotal, muted: true },
            { label: L.priceNoIva,  value: rounded,    muted: false },
            ...(irAmt > 0 ? [{ label: `${L.irAmount} (${irPct}%)`, value: irAmt, muted: true }] : []),
            { label: L.ivaLabel,    value: ivaAmt,     muted: true },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: r.muted ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.85)', fontWeight: 500 }}>{r.label}</span>
              <span style={{ fontSize: '14px', fontWeight: r.muted ? 600 : 800, color: r.muted ? 'rgba(255,255,255,.7)' : '#fff' }}>€ {fmt(r.value)}</span>
            </div>
          ))}

          <div style={{ borderTop: '1px solid rgba(255,255,255,.2)', margin: '14px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', color: '#fff', fontWeight: 700 }}>{L.priceWithIva}</span>
            <span style={{ fontSize: '24px', fontWeight: 900, color: GOLD }}>€ {fmt(total)}</span>
          </div>

          <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: '10px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.6)', fontWeight: 600 }}>{L.perPerson}</span>
            <span style={{ fontSize: '16px', fontWeight: 800, color: GOLD }}>€ {fmt(perPerson)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Tipo: Serviço por Hora ─────────────────────────────────────────────────
function ServicoCalculator({ lang, irDefault }) {
  const isDE = lang === 'de'
  const isMobile = useIsMobile()
  const { t } = useTheme()
  const G = t.heading, GOLD = t.accent, BG = t.softCardBg
  const [hours,     setHours    ] = useState(10)
  const [rate,      setRate     ] = useState(50)
  const [materialItems, setMaterialItems] = useState([{ name: '', qty: '', unit: '' }])
  const [fixedCosts,setFixedCosts] = useState(30)
  const [margin,    setMargin   ] = useState(20)
  const [ivaRate,   setIvaRate  ] = useState(isDE ? 19 : 23)
  const [irPct,     setIrPct    ] = useState(0)

  const updateMat = (i, field, value) => setMaterialItems(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m))
  const addMat = () => setMaterialItems(prev => [...prev, { name: '', qty: '', unit: '' }])
  const removeMat = (i) => setMaterialItems(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)
  const materialsTotal = materialItems.reduce((s, m) => s + p(m.qty) * p(m.unit), 0)

  const laborCost  = p(hours) * p(rate)
  const totalCosts = laborCost + materialsTotal + p(fixedCosts)
  const withMargin = totalCosts * (1 + p(margin) / 100)
  const irAmt      = withMargin * p(irPct) / 100
  const baseNoIva  = withMargin + irAmt
  const ivaAmt     = baseNoIva * p(ivaRate) / 100
  const total      = baseNoIva + ivaAmt

  const L = isDE ? {
    hours: 'Arbeitsstunden', rate: 'Stundensatz (€)',
    fixedCosts: 'Fixkosten anteilig (€)', margin: 'Gewinnmarge (%)', ivaRate: 'MwSt. (%)',
    labor: 'Arbeitskosten', costs: 'Gesamtkosten', priceNoIva: 'Preis ohne MwSt.',
    ivaLabel: `MwSt. (${ivaRate}%)`, priceWithIva: 'Gesamtpreis',
    ir: 'IR-Rücklage (%)', irAmount: 'IR-Rücklage', irHint: 'Vorschlag',
    matTitle: 'Materialverbrauch', matName: 'Material', matQty: 'Menge', matUnit: 'Kosten/Einheit (€)',
    matTotal: 'Material gesamt', addMat: '+ Material',
  } : lang === 'en' ? {
    hours: 'Work hours', rate: 'Rate/hour (€)',
    fixedCosts: 'Allocated fixed costs (€)', margin: 'Profit margin (%)', ivaRate: 'VAT (%)',
    labor: 'Labor cost', costs: 'Total costs', priceNoIva: 'Price excl. VAT',
    ivaLabel: `VAT (${ivaRate}%)`, priceWithIva: 'Final price',
    ir: 'Income tax reserve (%)', irAmount: 'Income tax reserve', irHint: 'suggested',
    matTitle: 'Material consumed', matName: 'Material', matQty: 'Qty', matUnit: 'Cost/unit (€)',
    matTotal: 'Material total', addMat: '+ Material',
  } : {
    hours: 'Horas de trabalho', rate: 'Valor/hora (€)',
    fixedCosts: 'Custos fixos prop. (€)', margin: 'Margem de lucro (%)', ivaRate: 'IVA (%)',
    labor: 'Custo de mão-de-obra', costs: 'Total de custos', priceNoIva: 'Preço sem IVA',
    ivaLabel: `IVA (${ivaRate}%)`, priceWithIva: 'Preço final com IVA',
    ir: 'Reserva IR (%)', irAmount: 'Reserva IR', irHint: 'sugestão',
    matTitle: 'Material consumido', matName: 'Material', matQty: 'Qtd.', matUnit: 'Custo/unid. (€)',
    matTotal: 'Total de material', addMat: '+ Material',
  }

  const inputSm = { padding: '7px 9px', border: `1px solid ${t.cardBorder}`, borderRadius: '7px', fontSize: '13px', background: t.cardBg, width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: '20px', alignItems: 'start' }}>
      <div style={{ background: t.cardBg, borderRadius: '12px', padding: '20px', border: `1px solid ${t.cardBorder}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: '14px' }}>
          {[
            [L.hours, hours, setHours, 1],
            [L.rate, rate, setRate, 0.5],
            [L.fixedCosts, fixedCosts, setFixedCosts, 0.5],
            [L.margin, margin, setMargin, 1],
            [L.ivaRate, ivaRate, setIvaRate, 1],
            [L.ir, irPct, setIrPct, 1, irDefault ? `${L.irHint}: ${irDefault}%` : null],
          ].map(([label, val, set, step, hint]) => (
            <div key={label}>
              <div style={{ fontSize: '11px', color: t.textMuted, fontWeight: 600, marginBottom: '5px' }}>{label}</div>
              <input type="number" min="0" step={step} value={val} onChange={e => set(e.target.value)} style={inputSm} />
              {hint && <div style={{ fontSize: '10px', color: t.subtle, marginTop: '3px' }}>{hint}</div>}
            </div>
          ))}
        </div>

        {/* Material consumido (lista itemizada) */}
        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${t.cardBorder}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: G, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{L.matTitle}</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: GOLD }}>{L.matTotal}: € {fmt(materialsTotal)}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 110px 28px', gap: '8px', marginBottom: '5px' }}>
            {[L.matName, L.matQty, L.matUnit, ''].map((h, i) => <div key={i} style={{ fontSize: '10px', color: t.textMuted, fontWeight: 700 }}>{h}</div>)}
          </div>
          {materialItems.map((m, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 110px 28px', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
              <input value={m.name} onChange={e => updateMat(i, 'name', e.target.value)} placeholder={L.matName} style={inputSm} />
              <input type="number" min="0" step="1" value={m.qty} onChange={e => updateMat(i, 'qty', e.target.value)} placeholder="0" style={inputSm} />
              <input type="number" min="0" step="0.5" value={m.unit} onChange={e => updateMat(i, 'unit', e.target.value)} placeholder="0,00" style={inputSm} />
              <button onClick={() => removeMat(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: t.subtle, padding: 0 }}>✕</button>
            </div>
          ))}
          <button onClick={addMat} style={{ marginTop: '4px', padding: '6px 12px', background: BG, border: `1px dashed ${t.cardBorder}`, borderRadius: '7px', fontWeight: 700, fontSize: '11.5px', cursor: 'pointer', color: t.textMuted }}>{L.addMat}</button>
        </div>

        <div style={{ marginTop: '14px', padding: '12px 14px', background: BG, borderRadius: '10px', fontSize: '12px', color: t.text }}>
          {L.labor}: <strong>€ {fmt(laborCost)}</strong>
          &ensp;·&ensp;
          {L.matTotal}: <strong>€ {fmt(materialsTotal)}</strong>
          &ensp;·&ensp;
          {L.costs}: <strong>€ {fmt(totalCosts)}</strong>
        </div>
      </div>
      <div style={{ background: t.highlightBg, borderRadius: '16px', padding: '24px', color: t.highlightValue }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,.5)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '20px' }}>
          {lang === 'de' ? 'Kalkulation' : lang === 'en' ? 'Result' : 'Resultado'}
        </div>
        {[
          { label: L.costs,      value: totalCosts, muted: true },
          { label: L.priceNoIva, value: withMargin,  muted: false },
          ...(irAmt > 0 ? [{ label: `${L.irAmount} (${irPct}%)`, value: irAmt, muted: true }] : []),
          { label: L.ivaLabel,   value: ivaAmt,      muted: true },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: r.muted ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.85)', fontWeight: 500 }}>{r.label}</span>
            <span style={{ fontSize: '14px', fontWeight: r.muted ? 600 : 800, color: r.muted ? 'rgba(255,255,255,.7)' : '#fff' }}>€ {fmt(r.value)}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.2)', margin: '14px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#fff', fontWeight: 700 }}>{L.priceWithIva}</span>
          <span style={{ fontSize: '26px', fontWeight: 900, color: GOLD }}>€ {fmt(total)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Tipo: Produto / Revenda (MB Standard) ─────────────────────────────────
function ProdutoCalculator({ lang, irDefault }) {
  const isDE = lang === 'de'
  const isMobile = useIsMobile()
  const { t } = useTheme()
  const G = t.heading, GOLD = t.accent, BG = t.softCardBg
  const [buyPrice,   setBuyPrice  ] = useState(10)
  const [indirect,   setIndirect  ] = useState(20)
  const [margin,     setMargin    ] = useState(40)
  const [discount,   setDiscount  ] = useState(5)
  const [ivaRate,    setIvaRate   ] = useState(isDE ? 19 : 23)
  const [irPct,      setIrPct     ] = useState(0)

  const indirectAmt  = p(buyPrice) * p(indirect) / 100
  const costPrice    = p(buyPrice) + indirectAmt
  const sellingBase  = costPrice / (1 - p(margin) / 100)
  const irAmt        = sellingBase * p(irPct) / 100
  const sellingNoIva = sellingBase + irAmt
  const withDiscount = sellingNoIva * (1 - p(discount) / 100)
  const ivaAmt       = sellingNoIva * p(ivaRate) / 100
  const totalPrice   = sellingNoIva + ivaAmt

  const L = isDE ? {
    buyPrice: 'Einstandspreis (€)', indirect: 'Gemeinkosten (%)', margin: 'Gewinnmarge (%)',
    discount: 'Möglicher Rabatt (%)', ivaRate: 'MwSt. (%)',
    indirectAmt: 'Gemeinkosten', costPrice: 'Selbstkosten', minPrice: 'Mindestverkaufspreis',
    priceNoIva: 'Verkaufspreis ohne MwSt.', ivaLabel: `MwSt. (${ivaRate}%)`,
    priceWithIva: 'Endverkaufspreis', withDiscount: `Preis mit ${discount}% Rabatt`,
    ir: 'IR-Rücklage (%)', irAmount: 'IR-Rücklage', irHint: 'Vorschlag',
  } : lang === 'en' ? {
    buyPrice: 'Purchase cost (€)', indirect: 'Indirect costs (%)', margin: 'Profit margin (%)',
    discount: 'Possible discount (%)', ivaRate: 'VAT (%)',
    indirectAmt: 'Indirect costs', costPrice: 'Total cost', minPrice: 'Minimum selling price',
    priceNoIva: 'Price excl. VAT', ivaLabel: `VAT (${ivaRate}%)`,
    priceWithIva: 'Final price incl. VAT', withDiscount: `Price with ${discount}% discount`,
    ir: 'Income tax reserve (%)', irAmount: 'Income tax reserve', irHint: 'suggested',
  } : {
    buyPrice: 'Custo de compra (€)', indirect: 'Custos indiretos (%)', margin: 'Margem de lucro (%)',
    discount: 'Desconto possível (%)', ivaRate: 'IVA (%)',
    indirectAmt: 'Custos indiretos', costPrice: 'Custo total', minPrice: 'Preço mínimo de venda',
    priceNoIva: 'Preço sem IVA', ivaLabel: `IVA (${ivaRate}%)`,
    priceWithIva: 'Preço final com IVA', withDiscount: `Preço com ${discount}% desconto`,
    ir: 'Reserva IR (%)', irAmount: 'Reserva IR', irHint: 'sugestão',
  }

  const inputSm = { padding: '7px 9px', border: `1px solid ${t.cardBorder}`, borderRadius: '7px', fontSize: '13px', background: t.cardBg, width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: '20px', alignItems: 'start' }}>
      <div style={{ background: t.cardBg, borderRadius: '12px', padding: '20px', border: `1px solid ${t.cardBorder}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: '14px' }}>
          {[
            [L.buyPrice, buyPrice, setBuyPrice, 0.01],
            [L.indirect, indirect, setIndirect, 1],
            [L.margin,   margin,   setMargin,   1],
            [L.discount, discount, setDiscount, 1],
            [L.ivaRate,  ivaRate,  setIvaRate,  1],
            [L.ir,       irPct,    setIrPct,    1, irDefault ? `${L.irHint}: ${irDefault}%` : null],
          ].map(([label, val, set, step, hint]) => (
            <div key={label}>
              <div style={{ fontSize: '11px', color: t.textMuted, fontWeight: 600, marginBottom: '5px' }}>{label}</div>
              <input type="number" min="0" step={step} value={val} onChange={e => set(e.target.value)} style={inputSm} />
              {hint && <div style={{ fontSize: '10px', color: t.subtle, marginTop: '3px' }}>{hint}</div>}
            </div>
          ))}
        </div>
        <div style={{ marginTop: '14px', padding: '12px 14px', background: BG, borderRadius: '10px', fontSize: '12px', color: t.text, display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span>{L.indirectAmt}: <strong>€ {fmt(indirectAmt)}</strong></span>
          <span>{L.costPrice}: <strong>€ {fmt(costPrice)}</strong></span>
          <span>{L.withDiscount}: <strong>€ {fmt(withDiscount)}</strong></span>
        </div>
      </div>
      <div style={{ background: t.highlightBg, borderRadius: '16px', padding: '24px', color: t.highlightValue }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,.5)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '20px' }}>
          {isDE ? 'MB-Kalkulation' : lang === 'en' ? 'Result' : 'Resultado'}
        </div>
        {[
          { label: L.costPrice,   value: costPrice,    muted: true },
          ...(irAmt > 0 ? [{ label: `${L.irAmount} (${irPct}%)`, value: irAmt, muted: true }] : []),
          { label: L.priceNoIva,  value: sellingNoIva, muted: false },
          { label: L.ivaLabel,    value: ivaAmt,        muted: true },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: r.muted ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.85)', fontWeight: 500 }}>{r.label}</span>
            <span style={{ fontSize: '14px', fontWeight: r.muted ? 600 : 800, color: r.muted ? 'rgba(255,255,255,.7)' : '#fff' }}>€ {fmt(r.value)}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.2)', margin: '14px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#fff', fontWeight: 700 }}>{L.priceWithIva}</span>
          <span style={{ fontSize: '26px', fontWeight: 900, color: GOLD }}>€ {fmt(totalPrice)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Tipo: Tratamento (Preiskalkulation pro Behandlung — modelo da Célia) ──
function TratamentoCalculator({ lang, irDefault, settings }) {
  const isDE = lang === 'de'
  const isMobile = useIsMobile()
  const { t } = useTheme()
  const GOLD = t.accent, BG = t.softCardBg

  const [minutePrice, setMinutePrice] = useState(2)
  const [durationMin, setDurationMin] = useState(90)
  const [material, setMaterial] = useState(5)
  const [monthlyFixed, setMonthlyFixed] = useState(550)
  const [productiveHours, setProductiveHours] = useState(100)
  const [profitPct, setProfitPct] = useState(20)
  const [reservePct, setReservePct] = useState(irDefault || 20)
  const [currentPrice, setCurrentPrice] = useState(75)
  const [reserveBasis, setReserveBasis] = useState('gewinn')

  const vatRegime = settings?.vat_regime || 'exempt'
  const vatPct = Number(settings?.vat_default_rate) || (isDE ? 19 : 23)
  const r = computeTreatment({ minutePrice, durationMin, material, monthlyFixed, productiveHours, profitPct, reservePct, vatPct, vatRegime, currentPrice, reserveBasis })

  const L = isDE ? {
    minutePrice: 'Minutenpreis (€)', duration: 'Behandlungsdauer (Min.)', material: 'Materialkosten (€)',
    monthlyFixed: 'Fixkosten monatlich (€)', productiveHours: 'Produktive Stunden/Monat',
    profit: 'Gewinnaufschlag (%)', reserve: 'Rücklage (%)', currentPrice: 'Aktuell verlangter Preis (€)',
    basis: 'Rücklage berechnen auf', gewinn: 'Gewinn', umsatz: 'Umsatz',
    hourValue: 'Stundenwert', overheadH: 'Gemeinkosten pro Stunde', overheadShare: 'Gemeinkostenanteil Behandlung',
    labor: 'Arbeitswert', minBase: 'Selbstkosten / Mindestbasis', priceNet: 'Empfohlener Preis netto',
    priceGross: 'Empfohlener Preis brutto', diff: 'Differenz zu Mindestbasis', resCur: 'Rücklage aus aktuellem Preis',
    result: 'Kalkulation', regelNote: `inkl. ${vatPct}% USt (Regelbesteuerung)`, kleinNote: 'Kleinunternehmer — keine USt',
    warnBelow: 'Achtung: aktueller Preis liegt UNTER den Selbstkosten.', okAbove: 'Aktueller Preis deckt die Selbstkosten.',
    markup: 'Aufschläge',
  } : lang === 'en' ? {
    minutePrice: 'Price per minute (€)', duration: 'Treatment duration (min)', material: 'Materials (€)',
    monthlyFixed: 'Monthly fixed costs (€)', productiveHours: 'Productive hours/month',
    profit: 'Profit margin (%)', reserve: 'Reserve (%)', currentPrice: 'Current price charged (€)',
    basis: 'Reserve calculated on', gewinn: 'Profit', umsatz: 'Revenue',
    hourValue: 'Hourly value', overheadH: 'Indirect cost per hour', overheadShare: 'Treatment indirect cost',
    labor: 'Labor value', minBase: 'Own cost / minimum base', priceNet: 'Recommended price (net)',
    priceGross: 'Recommended price (final)', diff: 'Difference vs. minimum base', resCur: 'Reserve from current price',
    result: 'Calculation', regelNote: `incl. ${vatPct}% VAT`, kleinNote: 'Small business — no VAT',
    warnBelow: 'Warning: current price is BELOW own cost.', okAbove: 'Current price covers own cost.',
    markup: 'Margin + Reserve',
  } : {
    minutePrice: 'Preço por minuto (€)', duration: 'Duração do tratamento (min)', material: 'Materiais (€)',
    monthlyFixed: 'Custos fixos mensais (€)', productiveHours: 'Horas produtivas/mês',
    profit: 'Margem de lucro (%)', reserve: 'Reserva (%)', currentPrice: 'Preço atual cobrado (€)',
    basis: 'Reserva calculada sobre', gewinn: 'Lucro', umsatz: 'Faturação',
    hourValue: 'Valor da hora', overheadH: 'Custo indireto por hora', overheadShare: 'Custo indireto do tratamento',
    labor: 'Valor do trabalho', minBase: 'Custo próprio / base mínima', priceNet: 'Preço recomendado (líquido)',
    priceGross: 'Preço recomendado (final)', diff: 'Diferença vs. base mínima', resCur: 'Reserva do preço atual',
    result: 'Cálculo', regelNote: `inclui ${vatPct}% de IVA`, kleinNote: 'Isento — sem IVA',
    warnBelow: 'Atenção: o preço atual está ABAIXO do custo próprio.', okAbove: 'O preço atual cobre o custo próprio.',
    markup: 'Margem + Reserva',
  }

  const inputSm = { padding: '7px 9px', border: `1px solid ${t.cardBorder}`, borderRadius: '7px', fontSize: '13px', background: t.cardBg, width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: '20px', alignItems: 'start' }}>
      <div style={{ background: t.cardBg, borderRadius: '12px', padding: '20px', border: `1px solid ${t.cardBorder}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: '14px' }}>
          {[
            [L.minutePrice, minutePrice, setMinutePrice, 0.1],
            [L.duration, durationMin, setDurationMin, 5],
            [L.material, material, setMaterial, 0.5],
            [L.monthlyFixed, monthlyFixed, setMonthlyFixed, 10],
            [L.productiveHours, productiveHours, setProductiveHours, 1],
            [L.profit, profitPct, setProfitPct, 1],
            [L.reserve, reservePct, setReservePct, 1, irDefault ? `${isDE ? 'Vorschlag' : lang === 'en' ? 'suggested' : 'sugestão'}: ${irDefault}%` : null],
            [L.currentPrice, currentPrice, setCurrentPrice, 1],
          ].map(([label, val, set, step, hint]) => (
            <div key={label}>
              <div style={{ fontSize: '11px', color: t.textMuted, fontWeight: 600, marginBottom: '5px' }}>{label}</div>
              <input type="number" min="0" step={step} value={val} onChange={e => set(e.target.value)} style={inputSm} />
              {hint && <div style={{ fontSize: '10px', color: t.subtle, marginTop: '3px' }}>{hint}</div>}
            </div>
          ))}
          <div>
            <div style={{ fontSize: '11px', color: t.textMuted, fontWeight: 600, marginBottom: '5px' }}>{L.basis}</div>
            <select value={reserveBasis} onChange={e => setReserveBasis(e.target.value)} style={{ ...inputSm, cursor: 'pointer' }}>
              <option value="gewinn">{L.gewinn}</option>
              <option value="umsatz">{L.umsatz}</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: '14px', padding: '12px 14px', background: BG, borderRadius: '10px', fontSize: '12px', color: t.text, display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span>{L.hourValue}: <strong>€ {fmt(r.hourValue)}</strong></span>
          <span>{L.overheadH}: <strong>€ {fmt(r.overheadPerHour)}</strong></span>
          <span>{L.overheadShare}: <strong>€ {fmt(r.overheadShare)}</strong></span>
          <span>{L.labor}: <strong>€ {fmt(r.laborValue)}</strong></span>
        </div>
        {/* Comparação com o preço atual */}
        <div style={{ marginTop: '10px', padding: '12px 14px', borderRadius: '10px', fontSize: '12.5px', fontWeight: 600, background: r.diffToMinBase < 0 ? '#fee2e2' : '#d1fae5', color: r.diffToMinBase < 0 ? '#991b1b' : '#065f46' }}>
          {r.diffToMinBase < 0 ? '⚠️ ' : '✓ '}{r.diffToMinBase < 0 ? L.warnBelow : L.okAbove}
          {' '}({L.diff}: € {fmt(r.diffToMinBase)} · {L.resCur}: € {fmt(r.reserveFromCurrent)})
        </div>
      </div>
      <div style={{ background: t.highlightBg, borderRadius: '16px', padding: '24px', color: t.highlightValue }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,.5)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '20px' }}>{L.result}</div>
        {[
          { label: L.minBase, value: r.minBase, muted: false },
          { label: `${L.markup} (${profitPct}% + ${reservePct}%)`, value: r.priceNet - r.minBase, muted: true },
          { label: L.priceNet, value: r.priceNet, muted: false },
        ].map(row => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', color: row.muted ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.85)', fontWeight: 500 }}>{row.label}</span>
            <span style={{ fontSize: '14px', fontWeight: row.muted ? 600 : 800, color: row.muted ? 'rgba(255,255,255,.7)' : '#fff' }}>€ {fmt(row.value)}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.2)', margin: '14px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#fff', fontWeight: 700 }}>{L.priceGross}</span>
          <span style={{ fontSize: '26px', fontWeight: 900, color: GOLD }}>€ {fmt(r.priceGross)}</span>
        </div>
        <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,.5)', marginTop: '6px', textAlign: 'right' }}>
          {vatRegime === 'normal' ? L.regelNote : L.kleinNote}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────
const TYPES = {
  evento:     { pt: 'Evento / Catering',   de: 'Event / Catering',        en: 'Event / Catering',   icon: '🍽️' },
  servico:    { pt: 'Serviço por Hora',    de: 'Stundenbasierter Dienst', en: 'Hourly Service',     icon: '⏱️' },
  produto:    { pt: 'Produto / Revenda',   de: 'Produkt / Handel',        en: 'Product / Resale',   icon: '📦' },
  tratamento: { pt: 'Tratamento',          de: 'Behandlung',              en: 'Treatment',          icon: '💅' },
}

export default function Precificacao() {
  const { lang } = useLang()
  const { t } = useTheme()
  const G = t.heading, GOLD = t.accent, BG = t.softCardBg
  const eid = useEffectiveUserId()
  const [type, setType] = useState('evento')
  const [irDefault, setIrDefault] = useState(0)
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    if (!eid) return
    getCompanySettings(eid).then(cs => {
      setSettings(cs)
      if (cs?.ir_reserve_pct != null) setIrDefault(Number(cs.ir_reserve_pct))
    })
  }, [eid])

  const tabStyle = (key) => ({
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', borderRadius: '10px', cursor: 'pointer',
    fontWeight: 700, fontSize: '13px', border: 'none', transition: 'all .15s',
    background: type === key ? t.accent : t.cardBg,
    color: type === key ? '#fff' : '#4a6355',
    boxShadow: type === key ? '0 2px 10px rgba(10,47,26,.2)' : 'none',
    borderBottom: type === key ? 'none' : `1px solid ${t.cardBorder}`,
  })

  return (
    <div style={{ width: '100%' }}>

      {/* Type selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {Object.entries(TYPES).map(([key, val]) => (
          <button key={key} style={tabStyle(key)} onClick={() => setType(key)}>
            <span>{val.icon}</span>
            <span>{val[lang] || val.pt}</span>
          </button>
        ))}
      </div>

      {/* Calculator */}
      {type === 'evento'     && <EventoCalculator     lang={lang} irDefault={irDefault} key={lang} />}
      {type === 'servico'    && <ServicoCalculator    lang={lang} irDefault={irDefault} key={lang} />}
      {type === 'produto'    && <ProdutoCalculator    lang={lang} irDefault={irDefault} key={lang} />}
      {type === 'tratamento' && <TratamentoCalculator lang={lang} irDefault={irDefault} settings={settings} key={lang} />}

    </div>
  )
}
