import { useState, useEffect } from 'react'
import { useLang } from '../../context/LangContext'
import { supabase } from '../../lib/supabase'
import { getCategory } from '../../data/expenseCategories'
import { useIsMobile } from '../../hooks/useIsMobile'

const G = '#0a2f1a'
const GOLD = '#c9a84c'
const BG = '#f2f6f3'
const GREEN = '#16a34a'
const RED = '#e53e3e'

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTHS_DE = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']
const fmt = (n) => `€ ${(Number(n)||0).toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const fmt2 = (n) => `€ ${(Number(n)||0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function Dashboard() {
  const { lang } = useLang()
  const isMobile = useIsMobile()
  const [entries, setEntries] = useState([])
  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(true)
  const [year] = useState(2026)
  const [period, setPeriod]   = useState('year')  // 'year' | 'quarter'
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3))

  useEffect(() => {
    (async () => {
      setLoading(true)
      const [{ data: ce }, { data: ci }] = await Promise.all([
        supabase.from('cash_entries').select('*'),
        supabase.from('catalog_items').select('id,name,kind'),
      ])
      setEntries(ce || [])
      setCatalog(ci || [])
      setLoading(false)
    })()
  }, [])

  const months = lang === 'de' ? MONTHS_DE : MONTHS_PT

  // ── Período (ano inteiro ou trimestre) ──
  const isQuarter = period === 'quarter'
  const scoped = entries.filter(e => {
    if (e.entry_date?.slice(0,4) !== String(year)) return false
    if (isQuarter) return Math.ceil(parseInt(e.entry_date.slice(5,7), 10) / 3) === quarter
    return true
  })
  const periodLabel = isQuarter ? `T${quarter} ${year}` : `${year}`

  // ── Timeline (meses do período) ──
  const monthIdx = isQuarter
    ? [(quarter - 1) * 3, (quarter - 1) * 3 + 1, (quarter - 1) * 3 + 2]
    : months.map((_, i) => i)
  const monthly = monthIdx.map(i => {
    const mm = String(i + 1).padStart(2, '0')
    const inMonth = scoped.filter(e => e.entry_date?.slice(5,7) === mm)
    const inc = inMonth.filter(e => e.type === 'entrada').reduce((s,e)=>s+Number(e.amount),0)
    const exp = inMonth.filter(e => e.type === 'saida'  ).reduce((s,e)=>s+Number(e.amount),0)
    return { label: months[i], inc, exp, net: inc - exp }
  })
  const maxVal = Math.max(1, ...monthly.map(m => Math.max(m.inc, m.exp)))

  // ── Breakeven ──
  const revenue = scoped.filter(e => e.type === 'entrada').reduce((s,e)=>s+Number(e.amount),0)
  const saidas  = scoped.filter(e => e.type === 'saida')
  let fixedC = 0, varC = 0, otherC = 0
  saidas.forEach(e => {
    const ct = getCategory(e.category)?.costType
    if (ct === 'variable') varC += Number(e.amount)
    else if (ct === 'fixed') fixedC += Number(e.amount)
    else otherC += Number(e.amount) // 'other' ou sem categoria → tratado como estrutural
  })
  const fixedTotal = fixedC + otherC
  const cmRatio = revenue > 0 ? (revenue - varC) / revenue : 0          // margem de contribuição
  const breakeven = cmRatio > 0 ? fixedTotal / cmRatio : 0
  const aboveBE = revenue >= breakeven && breakeven > 0
  const progressBE = breakeven > 0 ? Math.min(100, (revenue / breakeven) * 100) : 0

  // ── Receita por produto/serviço do catálogo ──
  const catalogById = Object.fromEntries(catalog.map(c => [c.id, c]))
  const revByItem = {}
  let unassignedRev = 0
  scoped.filter(e => e.type === 'entrada').forEach(e => {
    if (e.catalog_item_id && catalogById[e.catalog_item_id]) {
      revByItem[e.catalog_item_id] = (revByItem[e.catalog_item_id] || 0) + Number(e.amount)
    } else {
      unassignedRev += Number(e.amount)
    }
  })
  const productRows = Object.entries(revByItem)
    .map(([id, total]) => ({ id, name: catalogById[id]?.name || '—', kind: catalogById[id]?.kind, total }))
    .sort((a, b) => b.total - a.total)
  const maxProductRev = Math.max(1, ...productRows.map(r => r.total))

  const L = lang === 'de' ? {
    timeline: 'Cashflow nach Monat', breakeven: 'Break-even-Analyse',
    income: 'Einnahmen', expense: 'Ausgaben', net: 'Netto',
    revenue: 'Umsatz', fixed: 'Fixkosten', variable: 'Variable Kosten',
    cmRatio: 'Deckungsbeitrag', bePoint: 'Break-even-Punkt',
    above: 'Über dem Break-even ✓', below: 'Unter dem Break-even',
    needRevenue: 'Noch Umsatz bis Break-even', loading: 'Wird geladen…',
    noData: 'Noch keine Daten. Fügen Sie Buchungen im Kassenbuch hinzu.',
    beHint: 'Mindestumsatz, um alle Kosten zu decken.',
    yearNet: 'Jahresergebnis', surplus: 'Überschuss',
    byProduct: 'Umsatz nach Produkt/Leistung', share: 'Anteil',
    unassigned: 'Ohne Produkt zugeordnet', noProducts: 'Noch keine Einnahmen mit Produkt/Leistung verknüpft.',
    product: 'Produkt', service: 'Leistung',
    quarterly: 'Quartal', annual: 'Jahr',
    ssTitle: 'Sozialversicherung (PT)',
    ssHint: 'Quartalseinkommen — Basis für die vierteljährliche SS-Meldung in Portugal.',
    ssIncome: 'Quartalseinkommen', ssBase: 'Bemessungsgrundlage (70 %)',
    ssEst: 'Geschätzter Beitrag (21,4 %)',
    ssNote: 'Schätzung für Dienstleister (70 % × 21,4 %). Einstufung prüfen.',
  } : {
    timeline: 'Fluxo de Caixa por Mês', breakeven: 'Análise de Break-even',
    income: 'Entradas', expense: 'Saídas', net: 'Líquido',
    revenue: 'Receita', fixed: 'Custos Fixos', variable: 'Custos Variáveis',
    cmRatio: 'Margem de Contribuição', bePoint: 'Ponto de Equilíbrio',
    above: 'Acima do break-even ✓', below: 'Abaixo do break-even',
    needRevenue: 'Falta de receita para o break-even', loading: 'A carregar…',
    noData: 'Ainda não há dados. Adicione lançamentos no Livro de Caixa.',
    beHint: 'Receita mínima para cobrir todos os custos.',
    yearNet: 'Resultado do ano', surplus: 'Excedente',
    byProduct: 'Receita por Produto/Serviço', share: 'Peso',
    unassigned: 'Sem produto associado', noProducts: 'Ainda não há entradas associadas a produtos/serviços.',
    quarterly: 'Trimestral', annual: 'Anual',
    ssTitle: 'Base Segurança Social',
    ssHint: 'Rendimento do trimestre — base para a declaração trimestral à Segurança Social.',
    ssIncome: 'Rendimento do trimestre', ssBase: 'Base de incidência (70%)',
    ssEst: 'Contribuição estimada (21,4%)',
    ssNote: 'Estimativa para prestadores de serviços (70% × 21,4%). Confirmar enquadramento.',
    product: 'Produto', service: 'Serviço',
  }

  if (loading) return <div style={{ padding: '40px', color: '#94a3b8', fontSize: '14px' }}>{L.loading}</div>

  const yearNet = revenue - (fixedTotal + varC)
  const netLabel = isQuarter ? `${lang === 'de' ? 'Ergebnis' : 'Resultado'} ${periodLabel}` : L.yearNet
  const ssBase = revenue * 0.70
  const ssEst  = ssBase * 0.214

  // Toggle do período
  const segBtn = (active) => ({
    padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
    border: 'none', background: active ? G : 'transparent', color: active ? '#fff' : '#64748b',
  })
  const qBtn = (active) => ({
    padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
    border: `1px solid ${active ? G : '#dde8de'}`, background: active ? G : '#fff', color: active ? '#fff' : '#64748b',
  })

  return (
    <div style={{ width: '100%' }}>

      {/* Toggle período */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px', background: '#fff', borderRadius: '10px', padding: '4px', border: '1px solid #dde8de' }}>
          <button style={segBtn(!isQuarter)} onClick={() => setPeriod('year')}>{L.annual}</button>
          <button style={segBtn(isQuarter)} onClick={() => setPeriod('quarter')}>{L.quarterly}</button>
        </div>
        {isQuarter && (
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1,2,3,4].map(q => (
              <button key={q} style={qBtn(quarter === q)} onClick={() => setQuarter(q)}>{`T${q}`}</button>
            ))}
          </div>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 700, color: GOLD }}>{periodLabel}</span>
      </div>

      {/* KPIs topo */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? '10px' : '14px', marginBottom: '20px' }}>
        {[
          { label: L.revenue, value: revenue,             color: GREEN, bg: '#f0fdf4' },
          { label: L.fixed,   value: fixedTotal,          color: '#1d4ed8', bg: '#eff6ff' },
          { label: L.variable,value: varC,                color: '#c2410c', bg: '#fff7ed' },
          { label: netLabel,  value: yearNet,             color: yearNet>=0?G:RED, bg: '#fff' },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, borderRadius: '14px', padding: '18px 20px', border: '1px solid #dde8de' }}>
            <div style={{ fontSize: '22px', fontWeight: 900, color: k.color }}>{fmt(k.value)}</div>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {entries.length === 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', fontSize: '13px', color: '#92400e', fontWeight: 600 }}>
          {L.noData}
        </div>
      )}

      {/* ── Base Segurança Social (apenas trimestral) ── */}
      {isQuarter && (
        <div style={{ background: `linear-gradient(135deg, ${G} 0%, #164e2b 100%)`, borderRadius: '14px', padding: '20px 22px', marginBottom: '20px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '16px' }}>🇵🇹</span>
            <h3 style={{ fontSize: '14px', fontWeight: 800, margin: 0 }}>{L.ssTitle} · {periodLabel}</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? '12px' : '16px' }}>
            {[
              { label: L.ssIncome, value: revenue, big: true },
              { label: L.ssBase,   value: ssBase },
              { label: L.ssEst,    value: ssEst, gold: true },
            ].map(c => (
              <div key={c.label} style={{ background: 'rgba(255,255,255,.08)', borderRadius: '10px', padding: '14px 16px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.6)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</div>
                <div style={{ fontSize: c.big ? '24px' : '20px', fontWeight: 900, color: c.gold ? GOLD : '#fff' }}>{fmt2(c.value)}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,.55)', margin: '14px 0 0', lineHeight: 1.5 }}>{L.ssNote}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr', gap: '16px', alignItems: 'stretch' }}>

        {/* ── Timeline ── */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #dde8de', padding: '20px 22px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: G, margin: 0 }}>{L.timeline} · {periodLabel}</h3>
            <div style={{ display: 'flex', gap: '14px' }}>
              <Legend color={GREEN} label={L.income} />
              <Legend color={RED} label={L.expense} />
            </div>
          </div>

          {/* Bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', flex: 1, minHeight: '180px', borderBottom: '2px solid #e2e8f0', paddingBottom: '0' }}>
            {monthly.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '100%', width: '100%', justifyContent: 'center' }}>
                  <div title={`${L.income}: ${fmt2(m.inc)}`} style={{ width: '42%', height: `${(m.inc/maxVal)*100}%`, minHeight: m.inc>0?'3px':'0', background: GREEN, borderRadius: '3px 3px 0 0', transition: 'height .3s' }} />
                  <div title={`${L.expense}: ${fmt2(m.exp)}`} style={{ width: '42%', height: `${(m.exp/maxVal)*100}%`, minHeight: m.exp>0?'3px':'0', background: RED, borderRadius: '3px 3px 0 0', transition: 'height .3s' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            {monthly.map((m, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>{m.label}</div>
            ))}
          </div>
        </div>

        {/* ── Breakeven ── */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #dde8de', padding: '20px 22px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: G, margin: '0 0 4px' }}>{L.breakeven}</h3>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 18px' }}>{L.beHint}</p>

          {/* Breakeven value */}
          <div style={{ background: BG, borderRadius: '12px', padding: '16px', textAlign: 'center', marginBottom: '16px', border: '1px solid #dde8de' }}>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{L.bePoint}</div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: G }}>{fmt2(breakeven)}</div>
          </div>

          {/* Progress to breakeven */}
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: aboveBE ? GREEN : '#92400e' }}>
                {breakeven > 0 ? (aboveBE ? L.above : L.below) : '—'}
              </span>
              <span style={{ fontSize: '11px', fontWeight: 800, color: aboveBE ? GREEN : GOLD }}>{Math.round(progressBE)}%</span>
            </div>
            <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ width: `${progressBE}%`, height: '100%', background: aboveBE ? `linear-gradient(90deg,${GREEN},${G})` : `linear-gradient(90deg,${GOLD},${RED})`, borderRadius: '99px', transition: 'width .4s' }} />
            </div>
            {!aboveBE && breakeven > 0 && (
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
                {L.needRevenue}: <strong style={{ color: RED }}>{fmt2(breakeven - revenue)}</strong>
              </div>
            )}
          </div>

          {/* Breakdown */}
          {[
            { label: L.revenue, value: revenue,    color: GREEN },
            { label: L.fixed,   value: fixedTotal, color: '#1d4ed8' },
            { label: L.variable,value: varC,       color: '#c2410c' },
            { label: L.cmRatio, value: `${Math.round(cmRatio*100)}%`, color: G, isText: true },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #f0f4f1' }}>
              <span style={{ fontSize: '12px', color: '#4a6355' }}>{r.label}</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: r.color }}>{r.isText ? r.value : fmt2(r.value)}</span>
            </div>
          ))}
        </div>

      </div>

      {/* ── Receita por produto/serviço ── */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #dde8de', padding: '20px 22px', marginTop: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 800, color: G, margin: '0 0 16px' }}>{L.byProduct}</h3>

        {productRows.length === 0 && (
          <div style={{ fontSize: '13px', color: '#94a3b8', padding: '8px 0' }}>{L.noProducts}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {productRows.map(r => {
            const pct = revenue > 0 ? (r.total / revenue) * 100 : 0
            return (
              <div key={r.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px', gap: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a2e1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.name}
                    <span style={{ fontSize: '10px', fontWeight: 700, color: r.kind === 'product' ? '#5b21b6' : G, marginLeft: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {r.kind === 'product' ? L.product : L.service}
                    </span>
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: G, flexShrink: 0 }}>
                    {fmt2(r.total)} <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>· {Math.round(pct)}%</span>
                  </span>
                </div>
                <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ width: `${(r.total / maxProductRev) * 100}%`, height: '100%', background: `linear-gradient(90deg,${G},${GOLD})`, borderRadius: '99px', transition: 'width .4s' }} />
                </div>
              </div>
            )
          })}

          {unassignedRev > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f0f4f1' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>{L.unassigned}</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>{fmt2(unassignedRev)}</span>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

function Legend({ color, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
      <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: color }} />
      {label}
    </span>
  )
}
