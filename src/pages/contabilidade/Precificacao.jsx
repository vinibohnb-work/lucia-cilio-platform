import { useState } from 'react'
import { useLang } from '../../context/LangContext'
import { useIsMobile } from '../../hooks/useIsMobile'

const G = '#0d3b20'
const GOLD = '#c9a84c'
const BG = '#f2f6f3'

const fmt = (n) => isNaN(n) ? '0,00' : n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const p   = (v)  => parseFloat(v) || 0

// ── Tipo: Evento / Catering ────────────────────────────────────────────────
function EventoCalculator({ lang }) {
  const isDE = lang === 'de'
  const isMobile = useIsMobile()
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
  const [round,      setRound     ] = useState(true)

  const menuTotal   = p(adults) * p(menuPrice) + p(children) * p(menuPrice) * 0.5
  const staffTotal  = staff.reduce((s, m) => s + p(m.hours) * p(m.rate), 0)
  const costsTotal  = menuTotal + staffTotal + p(extraCosts)
  const withMargin  = costsTotal * (1 + p(margin) / 100)
  const rounded     = round ? Math.ceil(withMargin / 10) * 10 : withMargin
  const ivaAmt      = rounded * p(ivaRate) / 100
  const total       = rounded + ivaAmt
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
  } : {
    guests: 'Convidados', adults: 'Adultos', children: 'Crianças (50%)', menuPrice: 'Preço/adulto (€)',
    menuTotal: 'Custo do Menu', staff: 'Equipa', hours: 'Horas', rate: '€/hora',
    addPerson: '+ Adicionar pessoa', extraCosts: 'Custos adicionais (€)', margin: 'Margem de lucro (%)',
    ivaRate: 'IVA (%)', round: 'Arredondar (a 10 €)', perPerson: 'Por pessoa',
    costLabel: 'Total de Custos', priceNoIva: 'Preço sem IVA', ivaLabel: `IVA (${ivaRate}%)`,
    priceWithIva: 'Preço final com IVA', name: 'Nome',
  }

  const inputSm = { padding: '7px 9px', border: '1px solid #dde8de', borderRadius: '7px', fontSize: '13px', background: '#fff', width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: '20px', alignItems: 'start' }}>

      {/* Left: inputs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Guests & menu */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '18px 20px', border: '1px solid #dde8de' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: G, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{L.guests}</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: '10px' }}>
            {[
              [L.adults,    adults,    setAdults   ],
              [L.children,  children,  setChildren ],
              [L.menuPrice, menuPrice, setMenuPrice],
            ].map(([label, val, set]) => (
              <div key={label}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '5px' }}>{label}</div>
                <input type="number" min="0" step="1" value={val} onChange={e => set(e.target.value)} style={inputSm} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#4a6355' }}>
            {L.menuTotal}: <strong>€ {fmt(menuTotal)}</strong>
            <span style={{ marginLeft: '12px', fontSize: '11px', color: '#94a3b8' }}>
              ({p(adults)} × €{fmt(p(menuPrice))} + {p(children)} × €{fmt(p(menuPrice)*0.5)})
            </span>
          </div>
        </div>

        {/* Staff */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '18px 20px', border: '1px solid #dde8de' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, color: G, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{L.staff}</div>
          {staff.map((m, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 90px 32px', gap: '8px', marginBottom: '8px', alignItems: 'end' }}>
              <div>
                {i === 0 && <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>{L.name}</div>}
                <input value={m.name} onChange={e => updateStaff(i,'name',e.target.value)} style={inputSm} placeholder={L.name} />
              </div>
              <div>
                {i === 0 && <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>{L.hours}</div>}
                <input type="number" min="0" value={m.hours} onChange={e => updateStaff(i,'hours',e.target.value)} style={inputSm} />
              </div>
              <div>
                {i === 0 && <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>{L.rate}</div>}
                <input type="number" min="0" value={m.rate} onChange={e => updateStaff(i,'rate',e.target.value)} style={inputSm} />
              </div>
              <button onClick={() => removeStaff(i)} style={{ background: 'none', border: '1px solid #dde8de', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', color: '#94a3b8', height: '34px', paddingBottom: '3px' }}>✕</button>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <button onClick={addStaff} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: G, fontWeight: 700, padding: 0 }}>{L.addPerson}</button>
            <span style={{ fontSize: '12px', color: '#4a6355' }}>{lang === 'de' ? 'Personal gesamt' : 'Total equipa'}: <strong>€ {fmt(staffTotal)}</strong></span>
          </div>
        </div>

        {/* Extra costs & margin */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '18px 20px', border: '1px solid #dde8de' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 160px', gap: '12px', alignItems: 'end' }}>
            {[
              [L.extraCosts, extraCosts, setExtraCosts],
              [L.margin,     margin,     setMargin    ],
              [L.ivaRate,    ivaRate,    setIvaRate   ],
            ].map(([label, val, set]) => (
              <div key={label}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '5px' }}>{label}</div>
                <input type="number" min="0" step="0.5" value={val} onChange={e => set(e.target.value)} style={inputSm} />
              </div>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#4a6355', fontWeight: 600, paddingBottom: '2px' }}>
              <input type="checkbox" checked={round} onChange={e => setRound(e.target.checked)} style={{ width: '15px', height: '15px', accentColor: G }} />
              {L.round}
            </label>
          </div>
        </div>
      </div>

      {/* Right: result card */}
      <div style={{ position: 'sticky', top: '20px' }}>
        <div style={{ background: G, borderRadius: '16px', padding: '24px', color: '#fff' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,.5)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '20px' }}>
            {lang === 'de' ? 'Kalkulation' : 'Resultado'}
          </div>

          {[
            { label: L.costLabel,   value: costsTotal, muted: true },
            { label: L.priceNoIva,  value: rounded,    muted: false },
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
function ServicoCalculator({ lang }) {
  const isDE = lang === 'de'
  const isMobile = useIsMobile()
  const [hours,     setHours    ] = useState(10)
  const [rate,      setRate     ] = useState(50)
  const [materials, setMaterials] = useState(0)
  const [fixedCosts,setFixedCosts] = useState(30)
  const [margin,    setMargin   ] = useState(20)
  const [ivaRate,   setIvaRate  ] = useState(isDE ? 19 : 23)

  const laborCost  = p(hours) * p(rate)
  const totalCosts = laborCost + p(materials) + p(fixedCosts)
  const withMargin = totalCosts * (1 + p(margin) / 100)
  const ivaAmt     = withMargin * p(ivaRate) / 100
  const total      = withMargin + ivaAmt

  const L = isDE ? {
    hours: 'Arbeitsstunden', rate: 'Stundensatz (€)', materials: 'Materialkosten (€)',
    fixedCosts: 'Fixkosten anteilig (€)', margin: 'Gewinnmarge (%)', ivaRate: 'MwSt. (%)',
    labor: 'Arbeitskosten', costs: 'Gesamtkosten', priceNoIva: 'Preis ohne MwSt.',
    ivaLabel: `MwSt. (${ivaRate}%)`, priceWithIva: 'Gesamtpreis',
  } : {
    hours: 'Horas de trabalho', rate: 'Valor/hora (€)', materials: 'Materiais (€)',
    fixedCosts: 'Custos fixos prop. (€)', margin: 'Margem de lucro (%)', ivaRate: 'IVA (%)',
    labor: 'Custo de mão-de-obra', costs: 'Total de custos', priceNoIva: 'Preço sem IVA',
    ivaLabel: `IVA (${ivaRate}%)`, priceWithIva: 'Preço final com IVA',
  }

  const inputSm = { padding: '7px 9px', border: '1px solid #dde8de', borderRadius: '7px', fontSize: '13px', background: '#fff', width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: '20px', alignItems: 'start' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #dde8de' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: '14px' }}>
          {[
            [L.hours, hours, setHours, 1],
            [L.rate, rate, setRate, 0.5],
            [L.materials, materials, setMaterials, 0.5],
            [L.fixedCosts, fixedCosts, setFixedCosts, 0.5],
            [L.margin, margin, setMargin, 1],
            [L.ivaRate, ivaRate, setIvaRate, 1],
          ].map(([label, val, set, step]) => (
            <div key={label}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '5px' }}>{label}</div>
              <input type="number" min="0" step={step} value={val} onChange={e => set(e.target.value)} style={inputSm} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: '14px', padding: '12px 14px', background: BG, borderRadius: '10px', fontSize: '12px', color: '#4a6355' }}>
          {L.labor}: <strong>€ {fmt(laborCost)}</strong>
          &ensp;·&ensp;
          {L.costs}: <strong>€ {fmt(totalCosts)}</strong>
        </div>
      </div>
      <div style={{ background: G, borderRadius: '16px', padding: '24px', color: '#fff' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,.5)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '20px' }}>
          {lang === 'de' ? 'Kalkulation' : 'Resultado'}
        </div>
        {[
          { label: L.costs,      value: totalCosts, muted: true },
          { label: L.priceNoIva, value: withMargin,  muted: false },
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
function ProdutoCalculator({ lang }) {
  const isDE = lang === 'de'
  const isMobile = useIsMobile()
  const [buyPrice,   setBuyPrice  ] = useState(10)
  const [indirect,   setIndirect  ] = useState(20)
  const [margin,     setMargin    ] = useState(40)
  const [discount,   setDiscount  ] = useState(5)
  const [ivaRate,    setIvaRate   ] = useState(isDE ? 19 : 23)

  const indirectAmt  = p(buyPrice) * p(indirect) / 100
  const costPrice    = p(buyPrice) + indirectAmt
  const sellingNoIva = costPrice / (1 - p(margin) / 100)
  const withDiscount = sellingNoIva * (1 - p(discount) / 100)
  const ivaAmt       = sellingNoIva * p(ivaRate) / 100
  const totalPrice   = sellingNoIva + ivaAmt

  const L = isDE ? {
    buyPrice: 'Einstandspreis (€)', indirect: 'Gemeinkosten (%)', margin: 'Gewinnmarge (%)',
    discount: 'Möglicher Rabatt (%)', ivaRate: 'MwSt. (%)',
    indirectAmt: 'Gemeinkosten', costPrice: 'Selbstkosten', minPrice: 'Mindestverkaufspreis',
    priceNoIva: 'Verkaufspreis ohne MwSt.', ivaLabel: `MwSt. (${ivaRate}%)`,
    priceWithIva: 'Endverkaufspreis', withDiscount: `Preis mit ${discount}% Rabatt`,
  } : {
    buyPrice: 'Custo de compra (€)', indirect: 'Custos indiretos (%)', margin: 'Margem de lucro (%)',
    discount: 'Desconto possível (%)', ivaRate: 'IVA (%)',
    indirectAmt: 'Custos indiretos', costPrice: 'Custo total', minPrice: 'Preço mínimo de venda',
    priceNoIva: 'Preço sem IVA', ivaLabel: `IVA (${ivaRate}%)`,
    priceWithIva: 'Preço final com IVA', withDiscount: `Preço com ${discount}% desconto`,
  }

  const inputSm = { padding: '7px 9px', border: '1px solid #dde8de', borderRadius: '7px', fontSize: '13px', background: '#fff', width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: '20px', alignItems: 'start' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #dde8de' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: '14px' }}>
          {[
            [L.buyPrice, buyPrice, setBuyPrice, 0.01],
            [L.indirect, indirect, setIndirect, 1],
            [L.margin,   margin,   setMargin,   1],
            [L.discount, discount, setDiscount, 1],
            [L.ivaRate,  ivaRate,  setIvaRate,  1],
          ].map(([label, val, set, step]) => (
            <div key={label}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '5px' }}>{label}</div>
              <input type="number" min="0" step={step} value={val} onChange={e => set(e.target.value)} style={inputSm} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: '14px', padding: '12px 14px', background: BG, borderRadius: '10px', fontSize: '12px', color: '#4a6355', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span>{L.indirectAmt}: <strong>€ {fmt(indirectAmt)}</strong></span>
          <span>{L.costPrice}: <strong>€ {fmt(costPrice)}</strong></span>
          <span>{L.withDiscount}: <strong>€ {fmt(withDiscount)}</strong></span>
        </div>
      </div>
      <div style={{ background: G, borderRadius: '16px', padding: '24px', color: '#fff' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,.5)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '20px' }}>
          {isDE ? 'MB-Kalkulation' : 'Resultado'}
        </div>
        {[
          { label: L.costPrice,   value: costPrice,    muted: true },
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

// ── Main Component ─────────────────────────────────────────────────────────
const TYPES = {
  evento:  { pt: 'Evento / Catering',   de: 'Event / Catering',       icon: '🍽️' },
  servico: { pt: 'Serviço por Hora',    de: 'Stundenbasierter Dienst', icon: '⏱️' },
  produto: { pt: 'Produto / Revenda',   de: 'Produkt / Handel',        icon: '📦' },
}

export default function Precificacao() {
  const { lang } = useLang()
  const [type, setType] = useState('evento')

  const tabStyle = (key) => ({
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', borderRadius: '10px', cursor: 'pointer',
    fontWeight: 700, fontSize: '13px', border: 'none', transition: 'all .15s',
    background: type === key ? G : '#fff',
    color: type === key ? '#fff' : '#4a6355',
    boxShadow: type === key ? '0 2px 10px rgba(13,59,32,.2)' : 'none',
    borderBottom: type === key ? 'none' : '1px solid #dde8de',
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
      {type === 'evento'  && <EventoCalculator  lang={lang} key={lang} />}
      {type === 'servico' && <ServicoCalculator lang={lang} key={lang} />}
      {type === 'produto' && <ProdutoCalculator lang={lang} key={lang} />}

    </div>
  )
}
