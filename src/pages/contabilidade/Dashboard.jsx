import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { supabase } from '../../lib/supabase'
import { getCategory } from '../../data/expenseCategories'
import { getCompanySettings } from '../../lib/companySettings'
import { businessOnly } from '../../lib/cashEntry'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useTheme } from '../../context/ThemeContext'
import { FlagPT } from '../../components/Flag'

const G = '#0a2f1a'
const GOLD = '#c9a84c'
const BG = '#f2f6f3'
const GREEN = '#16a34a'
const RED = '#e53e3e'

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTHS_DE = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const fmt = (n) => `€ ${(Number(n)||0).toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const fmt2 = (n) => `€ ${(Number(n)||0).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function Dashboard() {
  const { lang } = useLang()
  const { t, night } = useTheme()
  const G = t.heading, GOLD = t.accent, BG = t.softCardBg
  const GREEN = t.pos, RED = t.neg
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [entries, setEntries] = useState([])
  const [catalog, setCatalog] = useState([])
  const [loading, setLoading] = useState(true)
  const [year] = useState(2026)
  const [period, setPeriod]   = useState('year')  // 'year' | 'quarter'
  const [quarter, setQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3))

  const [recurring, setRecurring] = useState([])
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    (async () => {
      setLoading(true)
      const [{ data: ce }, { data: ci }, { data: re }, cs] = await Promise.all([
        supabase.from('cash_entries').select('*'),
        supabase.from('catalog_items').select('id,name,kind'),
        supabase.from('recurring_expenses').select('*').eq('active', true),
        getCompanySettings(),
      ])
      // Movimentos privados (Privatentnahme/Privateinlage) não entram em
      // lucro, IVA, reservas nem gráficos — o Dashboard é uma visão de resultados.
      setEntries(businessOnly(ce))
      setCatalog(ci || [])
      setRecurring(re || [])
      setSettings(cs)
      setLoading(false)
    })()
  }, [])

  const months = lang === 'de' ? MONTHS_DE : lang === 'en' ? MONTHS_EN : MONTHS_PT

  // ── Período (ano inteiro ou trimestre) ──
  const isQuarter = period === 'quarter'
  const scoped = entries.filter(e => {
    if (e.entry_date?.slice(0,4) !== String(year)) return false
    if (isQuarter) return Math.ceil(parseInt(e.entry_date.slice(5,7), 10) / 3) === quarter
    return true
  })
  const periodLabel = isQuarter ? `T${quarter} ${year}` : `${year}`

  // ── Custos fixos recorrentes previstos por confirmar (por mês, respeitando vigência) ──
  const toYm = (p) => { const [y, m] = p.split('-').map(Number); return y * 12 + (m - 1) }
  const inRange = (p, s, e) => { const ym = toYm(p); if (s && ym < toYm(s)) return false; if (e && ym > toYm(e)) return false; return true }
  const isDue = (per, m) => per === 'monthly' || (per === 'quarterly' && [1,4,7,10].includes(m)) || (per === 'annual' && m === 1)
  const confirmedByPeriod = {}
  entries.forEach(e => { if (e.recurring_expense_id && e.period) { (confirmedByPeriod[e.period] ||= new Set()).add(e.recurring_expense_id) } })
  const pendingForMonth = (monthNum) => {
    const periodStr = `${year}-${String(monthNum).padStart(2, '0')}`
    const done = confirmedByPeriod[periodStr]
    return recurring.filter(r => isDue(r.periodicity, monthNum) && inRange(periodStr, r.start_month, r.end_month) && !(done && done.has(r.id)))
  }
  const predictedForMonth = (monthNum) => pendingForMonth(monthNum).reduce((s, r) => s + Number(r.amount), 0)

  // ── Timeline (meses do período) ──
  const monthIdx = isQuarter
    ? [(quarter - 1) * 3, (quarter - 1) * 3 + 1, (quarter - 1) * 3 + 2]
    : months.map((_, i) => i)
  const monthly = monthIdx.map(i => {
    const mm = String(i + 1).padStart(2, '0')
    const inMonth = scoped.filter(e => e.entry_date?.slice(5,7) === mm)
    const inc = inMonth.filter(e => e.type === 'entrada').reduce((s,e)=>s+Number(e.amount),0)
    const exp = inMonth.filter(e => e.type === 'saida'  ).reduce((s,e)=>s+Number(e.amount),0)
    const predicted = predictedForMonth(i + 1)
    return { label: months[i], inc, exp, predicted, net: inc - exp }
  })
  const maxVal = Math.max(1, ...monthly.map(m => Math.max(m.inc, m.exp + m.predicted)))

  // Total previsto acumulado no período mostrado + nº de ocorrências
  const periodPredicted = monthly.reduce((s, m) => s + m.predicted, 0)
  const pendingCountPeriod = monthIdx.reduce((c, i) => c + pendingForMonth(i + 1).length, 0)

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
  // Inclui os custos fixos previstos por confirmar (acumulados no período mostrado)
  const fixedTotal = fixedC + otherC + periodPredicted
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

  // ── Apuramento de IVA (período) ──
  const ivaLiquidado = scoped.filter(e => e.type === 'entrada').reduce((s,e)=>s+Number(e.vat_amount||0),0)
  const ivaDedutivel = scoped.filter(e => e.type === 'saida'  ).reduce((s,e)=>s+Number(e.vat_amount||0),0)
  const ivaApagar = ivaLiquidado - ivaDedutivel
  const hasIva = ivaLiquidado > 0 || ivaDedutivel > 0

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
    predictedFixed: 'Geplante Fixkosten (offen)', predictedCta: 'Bestätigen →', predicted: 'Geplant',
    ivaTitle: 'MwSt.', ivaLiq: 'MwSt. (Verkäufe)', ivaDed: 'Vorsteuer (Einkäufe)', ivaPay: 'MwSt.-Zahllast', ivaRec: 'MwSt.-Guthaben',
    irTitle: 'Steuerrücklage', irBase: 'Ergebnis (Basis)', irReserve: 'Zurückzulegen', irHint: 'auf das Periodenergebnis', irNoResult: 'Kein positives Ergebnis — nichts zurückzulegen.',
  } : lang === 'en' ? {
    timeline: 'Cash Flow by Month', breakeven: 'Break-even Analysis',
    income: 'Income', expense: 'Expenses', net: 'Net',
    revenue: 'Revenue', fixed: 'Fixed Costs', variable: 'Variable Costs',
    cmRatio: 'Contribution Margin', bePoint: 'Break-even Point',
    above: 'Above break-even ✓', below: 'Below break-even',
    needRevenue: 'Revenue needed to reach break-even', loading: 'Loading…',
    noData: 'No data yet. Add entries in the Cash Book.',
    beHint: 'Minimum revenue to cover all costs.',
    yearNet: 'Year result', surplus: 'Surplus',
    byProduct: 'Revenue by Product/Service', share: 'Share',
    unassigned: 'No product assigned', noProducts: 'No income linked to products/services yet.',
    quarterly: 'Quarter', annual: 'Year',
    ssTitle: 'Social Security base (PT)',
    ssHint: 'Quarterly income — basis for the quarterly Social Security return in Portugal.',
    ssIncome: 'Quarterly income', ssBase: 'Contribution base (70%)',
    ssEst: 'Estimated contribution (21.4%)',
    ssNote: 'Estimate for service providers (70% × 21.4%). Confirm your classification.',
    predictedFixed: 'Planned fixed costs (open)', predictedCta: 'Confirm →', predicted: 'Planned',
    ivaTitle: 'VAT', ivaLiq: 'VAT charged (sales)', ivaDed: 'Deductible VAT (purchases)', ivaPay: 'VAT payable', ivaRec: 'VAT refundable',
    irTitle: 'Income tax reserve', irBase: 'Result (base)', irReserve: 'To reserve', irHint: 'on the period result', irNoResult: 'No positive result — nothing to reserve.',
    product: 'Product', service: 'Service',
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
    predictedFixed: 'Custos fixos previstos (por confirmar)', predictedCta: 'Confirmar →', predicted: 'Previsto',
    ivaTitle: 'IVA', ivaLiq: 'IVA liquidado (vendas)', ivaDed: 'IVA dedutível (compras)', ivaPay: 'IVA a entregar', ivaRec: 'IVA a recuperar',
    irTitle: 'Reserva para IR', irBase: 'Resultado (base)', irReserve: 'A reservar', irHint: 'sobre o resultado do período', irNoResult: 'Sem resultado positivo — nada a reservar.',
    product: 'Produto', service: 'Serviço',
  }

  if (loading) return <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.loading}</div>

  const yearNet = revenue - (fixedTotal + varC)
  const netLabel = isQuarter ? `${lang === 'de' ? 'Ergebnis' : lang === 'en' ? 'Result' : 'Resultado'} ${periodLabel}` : L.yearNet
  const ssBase = revenue * 0.70
  // Reserva de IR: % da empresa sobre o resultado positivo do período
  const irPct = settings?.ir_reserve_pct != null ? Number(settings.ir_reserve_pct) : 25
  const irBase = Math.max(0, yearNet)
  const irReserve = irBase * irPct / 100
  const ssEst  = ssBase * 0.214

  // Toggle do período
  const segBtn = (active) => ({
    padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
    border: 'none', background: active ? G : 'transparent', color: active ? '#fff' : '#64748b',
  })
  const qBtn = (active) => ({
    padding: '6px 12px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
    border: `1px solid ${active ? G : '#dde8de'}`, background: active ? t.accent : t.cardBg, color: active ? '#fff' : '#64748b',
  })

  return (
    <div style={{ width: '100%' }}>

      {/* Toggle período */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '4px', background: t.cardBg, borderRadius: '10px', padding: '4px', border: `1px solid ${t.cardBorder}` }}>
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
          <div key={k.label} style={{ background: k.bg, borderRadius: '14px', padding: '18px 20px', border: `1px solid ${t.cardBorder}` }}>
            <div style={{ fontSize: '22px', fontWeight: 900, color: k.color }}>{fmt(k.value)}</div>
            <div style={{ fontSize: '11px', color: t.textMuted, fontWeight: 600, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {entries.length === 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '14px 18px', marginBottom: '20px', fontSize: '13px', color: '#92400e', fontWeight: 600 }}>
          {L.noData}
        </div>
      )}

      {/* ── Custos fixos previstos por confirmar (acumulado no período) ── */}
      {periodPredicted > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '18px' }}>🔁</span>
          <span style={{ fontSize: '13px', color: '#92400e', fontWeight: 600 }}>
            {L.predictedFixed} · {periodLabel}: <strong>{fmt2(periodPredicted)}</strong> · {pendingCountPeriod}
          </span>
          <button onClick={() => navigate('/contabilidade/recorrentes')} style={{ marginLeft: 'auto', padding: '7px 14px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
            {L.predictedCta}
          </button>
        </div>
      )}

      {/* ── Apuramento de IVA ── */}
      {hasIva && (
        <div style={{ background: t.cardBg, borderRadius: '14px', border: `1px solid ${t.cardBorder}`, padding: '18px 22px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: G, margin: '0 0 14px' }}>{L.ivaTitle} · {periodLabel}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? '10px' : '16px' }}>
            {[
              { label: L.ivaLiq, value: ivaLiquidado, color: '#065f46', bg: '#f0fdf4' },
              { label: L.ivaDed, value: ivaDedutivel, color: '#1d4ed8', bg: '#eff6ff' },
              { label: ivaApagar >= 0 ? L.ivaPay : L.ivaRec, value: Math.abs(ivaApagar), color: ivaApagar >= 0 ? '#c2410c' : '#065f46', bg: ivaApagar >= 0 ? '#fff7ed' : '#f0fdf4', strong: true },
            ].map(c => (
              <div key={c.label} style={{ background: c.bg, borderRadius: '10px', padding: '14px 16px', border: `1px solid ${t.cardBorder}` }}>
                <div style={{ fontSize: '11px', color: t.textMuted, fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</div>
                <div style={{ fontSize: c.strong ? '22px' : '19px', fontWeight: 900, color: c.color }}>{fmt2(c.value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Reserva para IR ── */}
      {revenue > 0 && (
        <div style={{ background: t.cardBg, borderRadius: '14px', border: `1px solid ${t.cardBorder}`, padding: '18px 22px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: G, margin: 0 }}>{L.irTitle} · {periodLabel}</h3>
            <span style={{ fontSize: '11px', color: t.subtle }}>{irPct}% {L.irHint}</span>
          </div>
          {irBase > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? '10px' : '16px' }}>
              {[
                { label: L.irBase, value: irBase, color: G, bg: BG },
                { label: `${L.irReserve} (${irPct}%)`, value: irReserve, color: '#b45309', bg: '#fffbeb', strong: true },
                { label: netLabel, value: yearNet - irReserve, color: (yearNet - irReserve) >= 0 ? '#065f46' : RED, bg: '#f0fdf4' },
              ].map(c => (
                <div key={c.label} style={{ background: c.bg, borderRadius: '10px', padding: '14px 16px', border: `1px solid ${t.cardBorder}` }}>
                  <div style={{ fontSize: '11px', color: t.textMuted, fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.label}</div>
                  <div style={{ fontSize: c.strong ? '22px' : '19px', fontWeight: 900, color: c.color }}>{fmt2(c.value)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: t.subtle }}>{L.irNoResult}</div>
          )}
        </div>
      )}

      {/* ── Base Segurança Social (apenas trimestral, só Portugal) ── */}
      {isQuarter && settings?.country !== 'DE' && (
        <div style={{ background: `linear-gradient(135deg, ${G} 0%, #164e2b 100%)`, borderRadius: '14px', padding: '20px 22px', marginBottom: '20px', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <FlagPT size={20} />
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
        <div style={{ background: t.cardBg, borderRadius: '14px', border: `1px solid ${t.cardBorder}`, padding: '20px 22px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: G, margin: 0 }}>{L.timeline} · {periodLabel}</h3>
            <div style={{ display: 'flex', gap: '14px' }}>
              <Legend color={GREEN} label={L.income} />
              <Legend color={RED} label={L.expense} />
              {periodPredicted > 0 && <Legend color="rgba(229,62,62,.38)" label={L.predicted} />}
            </div>
          </div>

          {/* Bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', flex: 1, minHeight: '180px', borderBottom: '2px solid #e2e8f0', paddingBottom: '0' }}>
            {monthly.map((m, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '100%', width: '100%', justifyContent: 'center' }}>
                  <div title={`${L.income}: ${fmt2(m.inc)}`} style={{ width: '42%', height: `${(m.inc/maxVal)*100}%`, minHeight: m.inc>0?'3px':'0', background: GREEN, borderRadius: '3px 3px 0 0', transition: 'height .3s' }} />
                  {/* Coluna de saídas: realizado (sólido) + previsto por confirmar (opaco) empilhado */}
                  <div style={{ width: '42%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    {m.predicted > 0 && (
                      <div title={`${L.predicted}: ${fmt2(m.predicted)}`} style={{ height: `${(m.predicted/maxVal)*100}%`, minHeight: '2px', background: 'rgba(229,62,62,.38)', borderRadius: '3px 3px 0 0', transition: 'height .3s' }} />
                    )}
                    <div title={`${L.expense}: ${fmt2(m.exp)}`} style={{ height: `${(m.exp/maxVal)*100}%`, minHeight: m.exp>0?'3px':'0', background: RED, borderRadius: m.predicted>0 ? '0' : '3px 3px 0 0', transition: 'height .3s' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
            {monthly.map((m, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '10px', color: t.subtle, fontWeight: 600 }}>{m.label}</div>
            ))}
          </div>
        </div>

        {/* ── Breakeven ── */}
        <div style={{ background: t.cardBg, borderRadius: '14px', border: `1px solid ${t.cardBorder}`, padding: '20px 22px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: G, margin: '0 0 4px' }}>{L.breakeven}</h3>
          <p style={{ fontSize: '11px', color: t.subtle, margin: '0 0 18px' }}>{L.beHint}</p>

          {/* Breakeven value */}
          <div style={{ background: BG, borderRadius: '12px', padding: '16px', textAlign: 'center', marginBottom: '16px', border: `1px solid ${t.cardBorder}` }}>
            <div style={{ fontSize: '11px', color: t.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{L.bePoint}</div>
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
              <div style={{ fontSize: '11px', color: t.textMuted, marginTop: '8px' }}>
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
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: `1px solid ${t.rowBorder}` }}>
              <span style={{ fontSize: '12px', color: t.text }}>{r.label}</span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: r.color }}>{r.isText ? r.value : fmt2(r.value)}</span>
            </div>
          ))}
        </div>

      </div>

      {/* ── Receita por produto/serviço ── */}
      <div style={{ background: t.cardBg, borderRadius: '14px', border: `1px solid ${t.cardBorder}`, padding: '20px 22px', marginTop: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 800, color: G, margin: '0 0 16px' }}>{L.byProduct}</h3>

        {productRows.length === 0 && (
          <div style={{ fontSize: '13px', color: t.subtle, padding: '8px 0' }}>{L.noProducts}</div>
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
                    {fmt2(r.total)} <span style={{ fontSize: '11px', color: t.subtle, fontWeight: 600 }}>· {Math.round(pct)}%</span>
                  </span>
                </div>
                <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ width: `${(r.total / maxProductRev) * 100}%`, height: '100%', background: `linear-gradient(90deg,${G},${GOLD})`, borderRadius: '99px', transition: 'width .4s' }} />
                </div>
              </div>
            )
          })}

          {unassignedRev > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: `1px solid ${t.rowBorder}` }}>
              <span style={{ fontSize: '12px', color: t.subtle, fontStyle: 'italic' }}>{L.unassigned}</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: t.subtle }}>{fmt2(unassignedRev)}</span>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

function Legend({ color, label }) {
  const { t } = useTheme()
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: t.textMuted, fontWeight: 600 }}>
      <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: color }} />
      {label}
    </span>
  )
}
