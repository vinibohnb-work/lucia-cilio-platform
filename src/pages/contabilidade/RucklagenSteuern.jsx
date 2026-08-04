import { useState, useEffect } from 'react'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { getCompanySettings, saveCompanySettings } from '../../lib/companySettings'
import { overheadPerHour, computePlanTotals, famvCheck } from '../../lib/planCalc'
import { FlagDE } from '../../components/Flag'
import { useEffectiveUserId, useViewAs } from '../../context/ViewAsContext'
import EstimateNote from '../../components/EstimateNote'

const fmt2 = (n) => `${(Number(n) || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : 0 }

// Anel de progresso (donut) para a coluna Übersicht
function Ring({ pct, color, track }) {
  const r = 15, c = 2 * Math.PI * r
  const p = Math.max(0, Math.min(1, pct))
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" style={{ flex: 'none' }}>
      <circle cx="22" cy="22" r={r} fill="none" stroke={track} strokeWidth="5" />
      <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - p)} transform="rotate(-90 22 22)" />
    </svg>
  )
}

export default function RucklagenSteuern() {
  const { lang } = useLang()
  const { t, night } = useTheme()
  const isMobile = useIsMobile()
  const eid = useEffectiveUserId()
  const { isViewing } = useViewAs()

  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [year] = useState(new Date().getFullYear())

  // Estado editável
  const [pct, setPct] = useState(25)
  const [kranken, setKranken]   = useState('')
  const [renten, setRenten]     = useState('')
  const [sonstige, setSonstige] = useState('')
  const [savingMsg, setSavingMsg] = useState('')
  const [famvLimit, setFamvLimit] = useState('565')
  const [plan, setPlan] = useState(null)

  // Totais do período (ano corrente)
  const [einnahmen, setEinnahmen] = useState(0)
  const [ausgaben, setAusgaben]   = useState(0)
  const [ustEin, setUstEin]       = useState(0)   // eingenommene Umsatzsteuer
  const [vorsteuer, setVorsteuer] = useState(0)   // abziehbare Vorsteuer

  useEffect(() => {
    if (!eid) return
    (async () => {
      setLoading(true)
      const [{ data: ce }, cs, { data: mp }] = await Promise.all([
        supabase.from('cash_entries').select('type,amount,vat_amount,entry_date,private').eq('user_id', eid),
        getCompanySettings(eid),
        supabase.from('monthly_plans').select('*').eq('user_id', eid).maybeSingle(),
      ])
      setPlan(mp || null)
      // Exclui movimentos privados: não contam para Gewinn nem Umsatzsteuer (EÜR)
      const rows = (ce || []).filter(e => !e.private && e.entry_date?.slice(0, 4) === String(year))
      let inc = 0, exp = 0, ustI = 0, vst = 0
      rows.forEach(e => {
        if (e.type === 'entrada') { inc += Number(e.amount || 0); ustI += Number(e.vat_amount || 0) }
        else { exp += Number(e.amount || 0); vst += Number(e.vat_amount || 0) }
      })
      setEinnahmen(inc); setAusgaben(exp); setUstEin(ustI); setVorsteuer(vst)
      if (cs) {
        setSettings(cs)
        if (cs.ir_reserve_pct != null) setPct(Number(cs.ir_reserve_pct))
        setKranken(cs.de_krankenv ? String(cs.de_krankenv) : '')
        setRenten(cs.de_rentenv ? String(cs.de_rentenv) : '')
        setSonstige(cs.de_sonstige ? String(cs.de_sonstige) : '')
        if (cs.de_famv_limit != null) setFamvLimit(String(cs.de_famv_limit))
      }
      setLoading(false)
    })()
  }, [year, eid])

  const L = lang === 'de' ? {
    flag: '🇩🇪', title: 'Deutschland – Rücklagen & Steuern',
    subtitle: 'So behältst du den Überblick und vermeidest Überraschungen mit dem Finanzamt.',
    heroTitle: 'Dieses Geld ist nicht frei verfügbar', heroText: 'Es ist für Steuern und Verpflichtungen reserviert.',
    // 1
    s1: 'Einkommensteuer-Rücklage', gewinn: 'Gewinn bis heute', gewinnSub: '(Einnahmen − Ausgaben)',
    pctLabel: 'Rücklagen-Prozentsatz', pctSub: '(editierbar)',
    recTax: 'Empfohlene Steuerrücklage', recTaxSub: (p, g) => `(${p}% von ${g})`,
    s1Hint: 'Schätzung – abhängig von deiner persönlichen steuerlichen Situation.',
    // 2
    s2: 'Umsatzsteuer', s2Only: 'Nur bei Regelbesteuerung (mit Umsatzsteuer)',
    ustIn: 'Eingenommene Umsatzsteuer', ustInSub: '(z. B. aus Rechnungen)',
    vst: 'Abziehbare Vorsteuer', vstSub: '(z. B. aus Ausgaben)',
    zahllast: 'Voraussichtliche Zahllast ans Finanzamt', zahllastSub: (a, b) => `(${a} − ${b})`,
    s2Hint: 'Betrag, der voraussichtlich an das Finanzamt zu zahlen ist.',
    s2Klein: 'Kleinunternehmer / ohne Umsatzsteuer — es fällt keine Umsatzsteuer-Zahllast an.',
    // 3
    s3: 'Vorsorge / Versicherungen', s3Sub: 'Monatliche Rücklagen (manuell eintragen)',
    kv: 'Krankenversicherung', kvSub: '(z. B. gesetzlich / privat)',
    rv: 'Rentenversicherung', rvSub: '(freiwillig, falls zutreffend)',
    sv: 'Sonstige Rücklagen', svSub: '(z. B. Berufshaftpflicht, Rücklagen, etc.)',
    vorsorgeTotal: 'Gesamte monatliche Vorsorge',
    // Übersicht
    ov: 'Übersicht', ovSub: 'Aktueller Stand',
    ovTax: 'Empfohlene Steuerrücklage', ovTaxSub: (p) => `(${p}% von Gewinn)`,
    ovUst: 'Voraussichtliche USt-Zahllast', ovUstSub: 'An Finanzamt',
    ovVorsorge: 'Monatliche Vorsorge (gesamt)', ovVorsorgeSub: 'Für Versicherungen und Rücklagen',
    glance: 'Auf einen Blick', glanceSub: 'Dieser Betrag ist nicht frei verfügbar.',
    forTax: 'Für Steuern reserviert', forVorsorge: 'Für Vorsorge (monatlich)', total: 'Gesamt (aktuell)',
    tip: 'Tipp', tipText: 'Passe deine Rücklagen regelmäßig an deine tatsächliche Situation und deinen Gewinn an.',
    famvTitle: 'Familienversicherung – Check', famvLimitL: 'Grenze pro Monat', famvProfit: 'Monatsgewinn',
    famvSrcPlan: 'aus Monatsplanung', famvSrcReal: 'Ø aus Kassenbuch (laufendes Jahr)',
    famvOk: 'OK – unter Grenze', famvWarn: 'Achtung – über Grenze',
    famvDist: 'Abstand zur Grenze', famvRatio: 'Monatsgewinn / Grenze',
    famvNote: 'Für Selbständige zählt grundsätzlich der regelmäßige Gewinn, nicht der Umsatz. Die Krankenkasse entscheidet im Einzelfall — Angaben prüfen lassen.',
    goal: 'Ziel dieses Moduls',
    goalText: 'Wir zeigen, wie viel Geld du reservieren solltest, damit du liquide bleibst und keine Überraschungen erlebst.',
    avail: 'Verfügbar', availSub: '(frei nutzbar)', resFin: 'Reserviert für Finanzamt', resVor: 'Reserviert für Vorsorge',
    disclaimer: 'Alle Werte sind Schätzungen und dienen zur besseren Planung. Keine Steuerberatung.',
    saved: 'Gespeichert ✓', saveErr: 'Speichern fehlgeschlagen (Migration 009 nötig).', loading: 'Wird geladen…',
  } : lang === 'en' ? {
    flag: '🇩🇪', title: 'Germany – Reserves & Taxes',
    subtitle: 'Stay in control and avoid surprises with the Finanzamt (German tax office).',
    heroTitle: 'This money is not freely available', heroText: 'It is reserved for taxes and obligations.',
    s1: 'Income Tax Reserve', gewinn: 'Profit to date', gewinnSub: '(Income − Expenses)',
    pctLabel: 'Reserve percentage', pctSub: '(editable)',
    recTax: 'Recommended tax reserve', recTaxSub: (p, g) => `(${p}% of ${g})`,
    s1Hint: 'Estimate – depends on your personal tax situation.',
    s2: 'VAT (Umsatzsteuer)', s2Only: 'Only under standard taxation (Regelbesteuerung)',
    ustIn: 'VAT collected (Umsatzsteuer)', ustInSub: '(e.g. from invoices issued)',
    vst: 'Deductible input VAT (Vorsteuer)', vstSub: '(e.g. from expenses)',
    zahllast: 'Estimated amount payable to the Finanzamt', zahllastSub: (a, b) => `(${a} − ${b})`,
    s2Hint: 'Amount likely to be paid to the tax office.',
    s2Klein: 'Small business (Kleinunternehmer) / no VAT — no VAT payment due.',
    s3: 'Provision / Insurance', s3Sub: 'Monthly reserves (enter manually)',
    kv: 'Health insurance (Krankenversicherung)', kvSub: '(e.g. public / private)',
    rv: 'Pension (Rentenversicherung)', rvSub: '(voluntary, if applicable)',
    sv: 'Other reserves', svSub: '(e.g. professional liability, reserves, etc.)',
    vorsorgeTotal: 'Total monthly provision',
    ov: 'Overview', ovSub: 'Current status',
    ovTax: 'Recommended tax reserve', ovTaxSub: (p) => `(${p}% of profit)`,
    ovUst: 'Estimated VAT payable', ovUstSub: 'To the Finanzamt',
    ovVorsorge: 'Monthly provision (total)', ovVorsorgeSub: 'For insurance and reserves',
    glance: 'At a glance', glanceSub: 'This amount is not free to use.',
    forTax: 'Reserved for taxes', forVorsorge: 'For provision (monthly)', total: 'Total (current)',
    tip: 'Tip', tipText: 'Adjust your reserves regularly to your real situation and profit.',
    famvTitle: 'Family Insurance – Check', famvLimitL: 'Limit per month', famvProfit: 'Monthly profit',
    famvSrcPlan: 'from Monthly Plan', famvSrcReal: 'real average from Cash Book (current year)',
    famvOk: 'OK – below the limit', famvWarn: 'Warning – above the limit',
    famvDist: 'Distance to limit', famvRatio: 'Monthly profit / limit',
    famvNote: 'For the self-employed, regular profit counts, not revenue. The Krankenkasse (health insurer) decides case by case — have the figures confirmed.',
    goal: 'Purpose of this module',
    goalText: 'We show how much money you should set aside to stay liquid and avoid surprises.',
    avail: 'Available', availSub: '(free to use)', resFin: 'Reserved for Finanzamt', resVor: 'Reserved for provision',
    disclaimer: 'All values are estimates and serve for better planning. Not tax advice.',
    saved: 'Saved ✓', saveErr: 'Save failed (migration 009 required).', loading: 'Loading…',
  } : {
    flag: '🇩🇪', title: 'Alemanha – Reservas & Impostos',
    subtitle: 'Mantém o controlo e evita surpresas com o Finanzamt (autoridade fiscal alemã).',
    heroTitle: 'Este dinheiro não está livre', heroText: 'Está reservado para impostos e obrigações.',
    s1: 'Reserva de Imposto de Rendimento', gewinn: 'Lucro até hoje', gewinnSub: '(Receitas − Despesas)',
    pctLabel: 'Percentagem de reserva', pctSub: '(editável)',
    recTax: 'Reserva de imposto recomendada', recTaxSub: (p, g) => `(${p}% de ${g})`,
    s1Hint: 'Estimativa – depende da tua situação fiscal pessoal.',
    s2: 'Umsatzsteuer (IVA alemão)', s2Only: 'Apenas em Regelbesteuerung (com IVA)',
    ustIn: 'IVA recebido (Umsatzsteuer)', ustInSub: '(ex.: de faturas emitidas)',
    vst: 'IVA dedutível (Vorsteuer)', vstSub: '(ex.: de despesas)',
    zahllast: 'Valor previsto a pagar ao Finanzamt', zahllastSub: (a, b) => `(${a} − ${b})`,
    s2Hint: 'Montante que, previsivelmente, será entregue ao Finanzamt.',
    s2Klein: 'Kleinunternehmer / sem IVA — não há IVA a entregar.',
    s3: 'Previdência / Seguros', s3Sub: 'Reservas mensais (introduzir manualmente)',
    kv: 'Seguro de saúde (Krankenversicherung)', kvSub: '(ex.: público / privado)',
    rv: 'Seguro de reforma (Rentenversicherung)', rvSub: '(voluntário, se aplicável)',
    sv: 'Outras reservas', svSub: '(ex.: seguro profissional, reservas, etc.)',
    vorsorgeTotal: 'Previdência mensal total',
    ov: 'Resumo', ovSub: 'Situação atual',
    ovTax: 'Reserva de imposto recomendada', ovTaxSub: (p) => `(${p}% do lucro)`,
    ovUst: 'IVA previsto a pagar', ovUstSub: 'Ao Finanzamt',
    ovVorsorge: 'Previdência mensal (total)', ovVorsorgeSub: 'Para seguros e reservas',
    glance: 'Em resumo', glanceSub: 'Este montante não está livre para uso.',
    forTax: 'Reservado para impostos', forVorsorge: 'Para previdência (mensal)', total: 'Total (atual)',
    tip: 'Dica', tipText: 'Ajusta as tuas reservas regularmente à tua situação real e ao teu lucro.',
    famvTitle: 'Familienversicherung – Verificação', famvLimitL: 'Limite por mês', famvProfit: 'Lucro mensal',
    famvSrcPlan: 'do Planeamento Mensal', famvSrcReal: 'média real do Livro de Caixa (ano corrente)',
    famvOk: 'OK – abaixo do limite', famvWarn: 'Atenção – acima do limite',
    famvDist: 'Distância ao limite', famvRatio: 'Lucro mensal / limite',
    famvNote: 'Para independentes conta o lucro regular, não a faturação. A Krankenkasse (seguradora de saúde) decide caso a caso — confirmar os valores.',
    goal: 'Objetivo deste módulo',
    goalText: 'Mostramos quanto dinheiro deves reservar para te manteres líquido e não teres surpresas.',
    avail: 'Disponível', availSub: '(uso livre)', resFin: 'Reservado p/ Finanzamt', resVor: 'Reservado p/ previdência',
    disclaimer: 'Todos os valores são estimativas e servem para melhor planeamento. Não é aconselhamento fiscal.',
    saved: 'Guardado ✓', saveErr: 'Falha ao guardar (é necessária a migração 009).', loading: 'A carregar…',
  }

  // ── Cálculos ──
  const gewinn = einnahmen - ausgaben
  const gewinnPos = Math.max(0, gewinn)
  const steuerRuecklage = gewinnPos * pct / 100
  const isRegel = (settings?.vat_regime || 'normal') !== 'exempt'
  const zahllast = ustEin - vorsteuer
  const zahllastPos = Math.max(0, zahllast)
  const vorsorge = num(kranken) + num(renten) + num(sonstige)
  const fuerSteuer = steuerRuecklage + (isRegel ? zahllastPos : 0)
  const gesamt = fuerSteuer + vorsorge

  // ── Familienversicherung: lucro mensal (plano, senão média real) vs limite ──
  const planTotals = plan?.items?.length
    ? computePlanTotals(plan.items, overheadPerHour(plan.monthly_fixed, plan.productive_hours), pct, plan.reserve_basis)
    : null
  const monthsElapsed = year === new Date().getFullYear() ? new Date().getMonth() + 1 : 12
  const famvProfit = planTotals ? planTotals.profit : gewinn / monthsElapsed
  const famv = famvCheck(famvProfit, famvLimit)

  async function persist(partial) {
    if (isViewing) return
    setSavingMsg('')
    const { error } = await saveCompanySettings({
      ir_reserve_pct: Number(pct),
      de_krankenv: num(kranken), de_rentenv: num(renten), de_sonstige: num(sonstige),
      ...partial,
    })
    setSavingMsg(error ? L.saveErr : L.saved)
    setTimeout(() => setSavingMsg(''), 2500)
  }

  function changePct(next) {
    const v = Math.max(0, Math.min(60, next))
    setPct(v)
    persist({ ir_reserve_pct: v })
  }

  // ── Cores do módulo (fixas, alinhadas ao mockup; suaves no modo claro) ──
  const HEAD = night ? '#123a24' : '#0a2f1a'
  const GOLD = t.accent
  const tone = {
    green:  { bg: night ? 'rgba(22,163,74,.12)'  : '#eaf5ee', ink: '#0a7a3e', soft: night ? 'rgba(22,163,74,.28)' : '#d5ebdc' },
    yellow: { bg: night ? 'rgba(201,168,76,.14)' : '#fbf3d9', ink: '#a97e1a', soft: night ? 'rgba(201,168,76,.3)'  : '#f0e2b4' },
    blue:   { bg: night ? 'rgba(37,99,235,.14)'  : '#e8f0fb', ink: '#1e60c8', soft: night ? 'rgba(37,99,235,.3)'   : '#cfe0f5' },
  }
  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '16px', overflow: 'hidden' }
  const money = (c) => ({ fontSize: '26px', fontWeight: 800, color: c, letterSpacing: '-.5px', fontFamily: t.fontNum || t.fontDisplay })
  const capLabel = { fontSize: '12px', fontWeight: 700, color: t.text, marginBottom: '4px' }
  const sub = { fontSize: '11.5px', color: t.subtle }
  const inputStyle = { width: '100%', boxSizing: 'border-box', textAlign: 'right', padding: '10px 12px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '15px', fontWeight: 700, outline: 'none' }

  const SectionHead = ({ n, title }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '13px', background: HEAD, padding: '15px 22px' }}>
      <span style={{ width: '26px', height: '26px', flex: 'none', borderRadius: '50%', background: '#fff', color: HEAD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800 }}>{n}</span>
      <h3 style={{ margin: 0, fontFamily: t.fontDisplay, fontSize: '19px', fontWeight: 600, color: '#f3ecdb' }}>{title}</h3>
    </div>
  )

  const InfoBar = ({ text, toneKey = 'green' }) => (
    <div style={{ display: 'flex', gap: '9px', alignItems: 'flex-start', background: tone[toneKey].bg, borderRadius: '10px', padding: '12px 15px', fontSize: '12.5px', color: t.text, lineHeight: 1.5 }}>
      <span style={{ color: tone[toneKey].ink, fontWeight: 800 }}>ⓘ</span><span>{text}</span>
    </div>
  )

  if (loading) return <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.loading}</div>

  const gridMain = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: '22px', alignItems: 'start' }

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '18px', flexWrap: 'wrap', marginBottom: '22px' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
          <span style={{ marginTop: '4px' }}><FlagDE size={40} /></span>
          <div>
            <h1 style={{ margin: '0 0 6px', fontFamily: t.fontDisplay, fontWeight: 700, fontSize: isMobile ? '25px' : '32px', lineHeight: 1.1, letterSpacing: '-.5px', color: t.heading }}>{L.title}</h1>
            <p style={{ margin: 0, fontSize: '13.5px', color: t.textMuted, maxWidth: '440px', lineHeight: 1.5 }}>{L.subtitle}</p>
          </div>
        </div>
        <div style={{ background: tone.green.bg, borderRadius: '14px', padding: '15px 18px', maxWidth: '270px', display: 'flex', gap: '11px' }}>
          <span style={{ fontSize: '18px' }}>💡</span>
          <div>
            <div style={{ fontSize: '12.5px', fontWeight: 800, color: t.heading, lineHeight: 1.35 }}>{L.heroTitle}</div>
            <div style={{ fontSize: '11.5px', color: t.textMuted, marginTop: '4px', lineHeight: 1.4 }}>{L.heroText}</div>
          </div>
        </div>
      </div>

      <div style={gridMain}>
        {/* ─── Coluna principal ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

          {/* 1. Einkommensteuer-Rücklage */}
          <div style={card}>
            <SectionHead n="1" title={L.s1} />
            <div style={{ padding: '20px 22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1.1fr', gap: '16px', alignItems: 'stretch' }}>
                <div>
                  <div style={capLabel}>{L.gewinn}</div>
                  <div style={money(t.heading)}>{fmt2(gewinn)}</div>
                  <div style={sub}>{L.gewinnSub}</div>
                </div>
                <div>
                  <div style={capLabel}>{L.pctLabel}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', border: `1px solid ${t.inputBorder}`, borderRadius: '10px', overflow: 'hidden', background: t.inputBg }}>
                    <button onClick={() => changePct(pct - 1)} style={{ width: '34px', height: '38px', border: 'none', background: 'transparent', color: t.textMuted, fontSize: '18px', cursor: 'pointer' }}>−</button>
                    <span style={{ minWidth: '54px', textAlign: 'center', fontSize: '16px', fontWeight: 800, color: t.heading }}>{pct} %</span>
                    <button onClick={() => changePct(pct + 1)} style={{ width: '34px', height: '38px', border: 'none', background: 'transparent', color: t.textMuted, fontSize: '18px', cursor: 'pointer' }}>+</button>
                  </div>
                  <div style={{ ...sub, marginTop: '5px' }}>{L.pctSub}</div>
                </div>
                <div style={{ background: tone.green.bg, borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: t.text, marginBottom: '4px', lineHeight: 1.3 }}>{L.recTax}</div>
                  <div style={money(tone.green.ink)}>{fmt2(steuerRuecklage)}</div>
                  <div style={sub}>{L.recTaxSub(pct, fmt2(gewinnPos))}</div>
                </div>
              </div>
              <div style={{ marginTop: '16px' }}><InfoBar text={L.s1Hint} toneKey="green" /></div>
            </div>
          </div>

          {/* 2. Umsatzsteuer */}
          <div style={card}>
            <SectionHead n="2" title={L.s2} />
            <div style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: tone.blue.ink, marginBottom: '15px' }}>{L.s2Only}</div>
              {isRegel ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1.1fr', gap: '16px', alignItems: 'stretch' }}>
                    <div>
                      <div style={capLabel}>{L.ustIn}</div>
                      <div style={money(t.heading)}>{fmt2(ustEin)}</div>
                      <div style={sub}>{L.ustInSub}</div>
                    </div>
                    <div>
                      <div style={capLabel}>{L.vst}</div>
                      <div style={money(t.heading)}>{fmt2(vorsteuer)}</div>
                      <div style={sub}>{L.vstSub}</div>
                    </div>
                    <div style={{ background: tone.yellow.bg, borderRadius: '12px', padding: '14px 16px' }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 700, color: t.text, marginBottom: '4px', lineHeight: 1.3 }}>{L.zahllast}</div>
                      <div style={money(tone.yellow.ink)}>{fmt2(zahllastPos)}</div>
                      <div style={sub}>{L.zahllastSub(fmt2(ustEin), fmt2(vorsteuer))}</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '16px' }}><InfoBar text={L.s2Hint} toneKey="blue" /></div>
                </>
              ) : (
                <InfoBar text={L.s2Klein} toneKey="yellow" />
              )}
            </div>
          </div>

          {/* 3. Vorsorge / Versicherungen */}
          <div style={card}>
            <SectionHead n="3" title={L.s3} />
            <div style={{ padding: '20px 22px' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: tone.blue.ink, marginBottom: '15px' }}>{L.s3Sub}</div>
              {[
                { icon: '🛡️', label: L.kv, sub: L.kvSub, val: kranken, set: setKranken, key: 'de_krankenv' },
                { icon: '👥', label: L.rv, sub: L.rvSub, val: renten,  set: setRenten,  key: 'de_rentenv' },
                { icon: '⋯', label: L.sv, sub: L.svSub, val: sonstige, set: setSonstige, key: 'de_sonstige' },
              ].map(row => (
                <div key={row.key} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 0', borderBottom: `1px solid ${t.rowBorder || t.cardBorder}` }}>
                  <span style={{ width: '34px', height: '34px', flex: 'none', borderRadius: '10px', background: t.softCardBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>{row.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: t.heading }}>{row.label}</div>
                    <div style={sub}>{row.sub}</div>
                  </div>
                  <div style={{ width: isMobile ? '120px' : '160px', flex: 'none', position: 'relative' }}>
                    <input inputMode="decimal" value={row.val} placeholder="0,00"
                      onChange={e => row.set(e.target.value)}
                      onBlur={() => persist({ [row.key]: num(row.val) })}
                      style={{ ...inputStyle, paddingRight: '26px' }} />
                    <span style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: t.subtle, pointerEvents: 'none' }}>€</span>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: tone.green.bg, borderRadius: '12px', padding: '15px 18px', marginTop: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: t.heading }}>{L.vorsorgeTotal}</span>
                <span style={money(t.heading)}>{fmt2(vorsorge)}</span>
              </div>
            </div>
          </div>

          {/* 4. Familienversicherung Check */}
          <div style={card}>
            <SectionHead n="4" title={L.famvTitle} />
            <div style={{ padding: '20px 22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1.1fr', gap: '16px', alignItems: 'stretch' }}>
                <div>
                  <div style={capLabel}>{L.famvProfit}</div>
                  <div style={money(t.heading)}>{fmt2(famvProfit)}</div>
                  <div style={sub}>{planTotals ? L.famvSrcPlan : L.famvSrcReal}</div>
                </div>
                <div>
                  <div style={capLabel}>{L.famvLimitL}</div>
                  <div style={{ position: 'relative', width: '140px' }}>
                    <input inputMode="decimal" value={famvLimit} onChange={e => setFamvLimit(e.target.value)}
                      onBlur={() => persist({ de_famv_limit: num(famvLimit) })}
                      style={{ ...inputStyle, width: '100%', paddingRight: '26px' }} />
                    <span style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: t.subtle, pointerEvents: 'none' }}>€</span>
                  </div>
                  <div style={{ ...sub, marginTop: '5px' }}>{L.famvRatio}: {(famv.ratio * 100).toFixed(0)}%</div>
                </div>
                <div style={{ background: famv.ok ? tone.green.bg : (night ? 'rgba(229,62,62,.14)' : '#fdeaea'), borderRadius: '12px', padding: '14px 16px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: t.text, marginBottom: '4px', lineHeight: 1.3 }}>
                    {famv.ok ? '🟢 ' : '🔴 '}{famv.ok ? L.famvOk : L.famvWarn}
                  </div>
                  <div style={money(famv.ok ? tone.green.ink : t.neg)}>{fmt2(famv.distance)}</div>
                  <div style={sub}>{L.famvDist}</div>
                </div>
              </div>
              {/* Barra lucro/limite */}
              <div style={{ marginTop: '14px', height: '9px', borderRadius: '20px', background: night ? 'rgba(255,255,255,.1)' : '#e6ede8', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, famv.ratio * 100)}%`, background: famv.ok ? tone.green.ink : t.neg, transition: 'width .3s' }} />
              </div>
              <div style={{ marginTop: '14px' }}><InfoBar text={L.famvNote} toneKey={famv.ok ? 'green' : 'yellow'} /></div>
            </div>
          </div>

          {/* Rodapé: objetivo */}
          <div style={{ ...card, boxShadow: 'none', background: t.softCardBg, border: `1px solid ${t.cardBorder}` }}>
            <div style={{ padding: '20px 22px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px' }}>🎯</span>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: t.heading }}>{L.goal}</div>
                </div>
                <p style={{ margin: 0, fontSize: '12.5px', color: t.textMuted, lineHeight: 1.55 }}>{L.goalText}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: t.textMuted, textAlign: 'center' }}>
                <div><div style={{ fontSize: '22px' }}>👛</div><div style={{ marginTop: '3px' }}>{L.avail}<br/><span style={{ color: t.subtle }}>{L.availSub}</span></div></div>
                <span style={{ fontSize: '18px', color: t.subtle }}>=</span>
                <div><div style={{ fontSize: '22px' }}>🏛️</div><div style={{ marginTop: '3px' }}>{L.resFin}</div></div>
                <span style={{ fontSize: '18px', color: t.subtle }}>−</span>
                <div><div style={{ fontSize: '22px' }}>🛡️</div><div style={{ marginTop: '3px' }}>{L.resVor}</div></div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Coluna Übersicht ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: isMobile ? 'static' : 'sticky', top: '20px' }}>
          <div style={{ ...card, padding: '20px' }}>
            <div style={{ fontFamily: t.fontDisplay, fontSize: '19px', fontWeight: 600, color: t.heading }}>{L.ov}</div>
            <div style={{ ...sub, marginBottom: '16px' }}>{L.ovSub}</div>

            {/* Reserva imposto */}
            <div style={{ background: tone.green.bg, borderRadius: '12px', padding: '14px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '11px' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: t.text, lineHeight: 1.3 }}>{L.ovTax}</div>
                <div style={{ ...money(t.heading), fontSize: '21px', marginTop: '3px' }}>{fmt2(steuerRuecklage)}</div>
                <div style={sub}>{L.ovTaxSub(pct)}</div>
              </div>
              <Ring pct={pct / 100} color={tone.green.ink} track={tone.green.soft} />
            </div>
            {/* USt */}
            {isRegel && (
              <div style={{ background: tone.yellow.bg, borderRadius: '12px', padding: '14px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '11px' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: t.text, lineHeight: 1.3 }}>{L.ovUst}</div>
                  <div style={{ ...money(tone.yellow.ink), fontSize: '21px', marginTop: '3px' }}>{fmt2(zahllastPos)}</div>
                  <div style={sub}>{L.ovUstSub}</div>
                </div>
                <Ring pct={ustEin > 0 ? zahllastPos / ustEin : 0} color={tone.yellow.ink} track={tone.yellow.soft} />
              </div>
            )}
            {/* Vorsorge */}
            <div style={{ background: tone.blue.bg, borderRadius: '12px', padding: '14px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: t.text, lineHeight: 1.3 }}>{L.ovVorsorge}</div>
                <div style={{ ...money(tone.blue.ink), fontSize: '21px', marginTop: '3px' }}>{fmt2(vorsorge)}</div>
                <div style={sub}>{L.ovVorsorgeSub}</div>
              </div>
              <Ring pct={0.75} color={tone.blue.ink} track={tone.blue.soft} />
            </div>

            {/* Auf einen Blick */}
            <div style={{ borderTop: `1px solid ${t.cardBorder}`, marginTop: '18px', paddingTop: '16px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 800, color: t.heading }}>{L.glance}</div>
              <div style={{ ...sub, marginBottom: '13px' }}>{L.glanceSub}</div>
              <div style={{ marginBottom: '11px' }}>
                <div style={{ fontSize: '12px', color: t.textMuted, marginBottom: '2px' }}>{L.forTax}</div>
                <div style={{ ...money(tone.green.ink), fontSize: '20px' }}>{fmt2(fuerSteuer)}</div>
              </div>
              <div style={{ marginBottom: '13px' }}>
                <div style={{ fontSize: '12px', color: t.textMuted, marginBottom: '2px' }}>{L.forVorsorge}</div>
                <div style={{ ...money(tone.blue.ink), fontSize: '20px' }}>{fmt2(vorsorge)}</div>
              </div>
              <div style={{ borderTop: `1px solid ${t.cardBorder}`, paddingTop: '12px' }}>
                <div style={{ fontSize: '12px', color: t.textMuted, marginBottom: '2px' }}>{L.total}</div>
                <div style={{ ...money(t.heading), fontSize: '24px' }}>{fmt2(gesamt)}</div>
              </div>
              {savingMsg && <div style={{ fontSize: '11.5px', fontWeight: 700, color: savingMsg === L.saved ? tone.green.ink : t.neg, marginTop: '10px' }}>{savingMsg}</div>}
            </div>
          </div>

          {/* Tipp */}
          <div style={{ ...card, boxShadow: 'none', padding: '16px 18px', display: 'flex', gap: '10px' }}>
            <span style={{ fontSize: '16px' }}>💡</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: t.heading, marginBottom: '3px' }}>{L.tip}</div>
              <div style={{ fontSize: '11.5px', color: t.textMuted, lineHeight: 1.5 }}>{L.tipText}</div>
            </div>
          </div>
        </div>
      </div>

      <EstimateNote />
    </div>
  )
}
