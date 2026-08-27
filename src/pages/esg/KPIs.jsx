import { useState, useEffect, useCallback } from 'react'
import EsqueletoPagina from '../../components/EsqueletoPagina'
import { Link } from 'react-router-dom'
import { localeDe } from '../../lib/formato'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { computeKpis } from '../../lib/esgKpis'
import { ESG_TOPICS, TOPIC_PILLAR_META, topicLabel, isMaterial } from '../../data/esgTopics'
import { useEffectiveUserId } from '../../context/ViewAsContext'

const E = '#0a7a3e', S = '#1e60c8', G = '#a9781a'

// Anel de progresso
function Ring({ pct, color, track, size = 54, label }) {
  const r = size / 2 - 5, c = 2 * Math.PI * r, p = Math.max(0, Math.min(1, (pct || 0) / 100))
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flex: 'none' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth="5" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      {label && <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" fontSize="12.5" fontWeight="800" fill={color}>{label}</text>}
    </svg>
  )
}

export default function KPIs() {
  const { lang } = useLang()
  const loc = localeDe(lang)
  const fmt = (v, d = 0) => v == null ? '—' : Number(v).toLocaleString(loc, { minimumFractionDigits: d, maximumFractionDigits: d })
  const { t, night } = useTheme()
  const isMobile = useIsMobile()
  const eid = useEffectiveUserId()

  const [byYear, setByYear] = useState({})     // ano → answers (dados reais do diagnóstico)
  const [year, setYear] = useState(null)
  const [materiality, setMateriality] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!eid) return
    setLoading(true)
    const [{ data: diags }, { data: mat }] = await Promise.all([
      supabase.from('esg_diagnostics').select('answers, reference_year').eq('user_id', eid).order('reference_year', { ascending: false }),
      supabase.from('esg_materiality').select('topics, threshold').eq('user_id', eid).maybeSingle(),
    ])
    const map = {}
    ;(diags || []).forEach(r => { if (r.answers && Object.keys(r.answers).length) map[r.reference_year] = r.answers })
    setByYear(map)
    const years = Object.keys(map).map(Number).sort((a, b) => b - a)
    setYear(years[0] || null)
    setMateriality(mat || null)
    setLoading(false)
  }, [eid])
  useEffect(() => { load() }, [load])

  const L = lang === 'de' ? {
    eyebrow: 'ESG-Monitoring', title: 'KPIs & Monitorização',
    subtitle: 'Kennzahlen aus dem Nachhaltigkeits-Fragebogen — automatisch berechnet.',
    empty: 'Noch kein Diagnose-Fragebogen ausgefüllt — die KPIs werden live aus den Antworten berechnet.',
    emptyCta: 'Diagnose ausfüllen →', vsPrev: 'ggü.', materialTitle: 'Wesentliche Themen & Ziele', goalLbl: 'Ziel',
    refYear: 'Bezugsjahr', loading: 'Wird geladen…',
    completeness: 'Ausfüllgrad', pillarE: 'Umwelt', pillarS: 'Soziales', pillarG: 'Unternehmensführung',
    co2: 'CO₂-Emissionen (gesamt)', employees: 'Mitarbeiter', renewElec: 'Erneuerbarer Strom', govMaturity: 'Governance-Reife',
    scopes: 'Emissionen nach Scope', energy: 'Energie & Ressourcen', elecTotal: 'Stromverbrauch', selfGen: 'Eigenerzeugung',
    water: 'Wasserverbrauch', waste: 'Abfall', recycled: 'recycelt', hazardous: 'Gefährlich', sources: 'Energiequellen',
    taxonomy: 'EU-Taxonomie', eligible: 'fähig', aligned: 'konform',
    flags: 'Klimamaßnahmen', target: 'Reduktionsziel', compensate: 'Kompensation', ecoInvest: 'Grüne Investitionen',
    women: 'Frauenanteil nach Position', all: 'Alle', lead: 'Führung', top: 'Top-Management', control: 'Kontrolle',
    payGap: 'Gender Pay Gap', accidents: 'Arbeitsunfälle', fatal: 'davon tödlich', turnover: 'Fluktuation',
    dismissals: 'Kündigungen', voluntary: 'freiwillig', training: 'Weiterbildung', hoursPerEmp: 'Std./MA', costPerEmp: '€/MA',
    ownership: 'Eigentum & Kontrolle', owners: 'Eigentümer', years: 'Ø Jahre beteiligt', checklist: 'Governance-Checkliste',
    yes: 'Ja', no: 'Nein', planned: 'Geplant', na: 'k. A.',
    g20: 'Alle Eigentümer im Management', g21: 'Letztverantwortliche/r im Management', g22: 'Abschlussprüfung',
    g23: 'Nachhaltigkeitsdaten im Reporting', g24: 'Umwelt-/Sozialfaktoren in Entscheidungen', g25: 'ESG-gebundene Vergütung',
    g26: 'Nachhaltigkeitszertifizierungen', g27: 'Antikorruptions-Richtlinie', g28: 'Compliance-Richtlinie',
  } : lang === 'en' ? {
    eyebrow: 'ESG Monitoring', title: 'KPIs & Monitoring',
    subtitle: 'Metrics extracted from the sustainability questionnaire — calculated automatically.',
    empty: 'No assessment filled in yet — KPIs are calculated live from the answers.',
    emptyCta: 'Fill in the assessment →', vsPrev: 'vs', materialTitle: 'Material topics & targets', goalLbl: 'Target',
    refYear: 'Reference year', loading: 'Loading…',
    completeness: 'Completeness', pillarE: 'Environment', pillarS: 'Social', pillarG: 'Governance',
    co2: 'CO₂ emissions (total)', employees: 'Employees', renewElec: 'Renewable electricity', govMaturity: 'Governance maturity',
    scopes: 'Emissions by Scope', energy: 'Energy & Resources', elecTotal: 'Electricity use', selfGen: 'Self-generation',
    water: 'Water use', waste: 'Waste', recycled: 'recycled', hazardous: 'Hazardous', sources: 'Energy sources',
    taxonomy: 'EU Taxonomy', eligible: 'eligible', aligned: 'aligned',
    flags: 'Climate actions', target: 'Reduction target', compensate: 'Offsetting', ecoInvest: 'Green investment',
    women: 'Share of women by position', all: 'All', lead: 'Leadership', top: 'Top management', control: 'Control',
    payGap: 'Gender pay gap', accidents: 'Work accidents', fatal: 'of which fatal', turnover: 'Turnover',
    dismissals: 'Terminations', voluntary: 'voluntary', training: 'Training', hoursPerEmp: 'h/emp.', costPerEmp: '€/emp.',
    ownership: 'Ownership & Control', owners: 'Owners', years: 'Avg. years involved', checklist: 'Governance checklist',
    yes: 'Yes', no: 'No', planned: 'Planned', na: 'n/a',
    g20: 'All owners in management', g21: 'Ultimate controller in management', g22: 'Financial audit',
    g23: 'Sustainability data in reporting', g24: 'Environmental/social factors in decisions', g25: 'ESG-linked remuneration',
    g26: 'Sustainability certifications', g27: 'Anti-corruption policy', g28: 'Compliance policy',
  } : {
    eyebrow: 'Monitorização ESG', title: 'KPIs & Monitorização',
    subtitle: 'Indicadores extraídos do questionário de sustentabilidade — calculados automaticamente.',
    empty: 'Ainda não há diagnóstico preenchido — os KPIs são calculados ao vivo a partir das respostas.',
    emptyCta: 'Preencher o diagnóstico →', vsPrev: 'vs', materialTitle: 'Temas materiais & metas', goalLbl: 'Meta',
    refYear: 'Ano de referência', loading: 'A carregar…',
    completeness: 'Preenchimento', pillarE: 'Ambiente', pillarS: 'Social', pillarG: 'Governança',
    co2: 'Emissões de CO₂ (total)', employees: 'Colaboradores', renewElec: 'Eletricidade renovável', govMaturity: 'Maturidade de governança',
    scopes: 'Emissões por Scope', energy: 'Energia & Recursos', elecTotal: 'Consumo de eletricidade', selfGen: 'Autogeração',
    water: 'Consumo de água', waste: 'Resíduos', recycled: 'reciclado', hazardous: 'Perigosos', sources: 'Fontes de energia',
    taxonomy: 'Taxonomia UE', eligible: 'elegível', aligned: 'alinhado',
    flags: 'Ações climáticas', target: 'Meta de redução', compensate: 'Compensação', ecoInvest: 'Investimento verde',
    women: 'Percentual de mulheres por posição', all: 'Todos', lead: 'Lideranças', top: 'Alta gestão', control: 'Controlo',
    payGap: 'Gap salarial de género', accidents: 'Acidentes de trabalho', fatal: 'dos quais fatais', turnover: 'Rotatividade',
    dismissals: 'Desligamentos', voluntary: 'voluntários', training: 'Formação', hoursPerEmp: 'h/colab.', costPerEmp: '€/colab.',
    ownership: 'Propriedade & Controlo', owners: 'Proprietários', years: 'Anos médios de participação', checklist: 'Checklist de governança',
    yes: 'Sim', no: 'Não', planned: 'Planeado', na: 's/ resp.',
    g20: 'Todos os proprietários na gestão', g21: 'Controlador último na gestão', g22: 'Auditoria de contas',
    g23: 'Dados de sustentabilidade no reporte', g24: 'Fatores ambientais/sociais nas decisões', g25: 'Remuneração ligada a ESG',
    g26: 'Certificações de sustentabilidade', g27: 'Política anticorrupção', g28: 'Política de compliance',
  }

  if (loading) return <EsqueletoPagina />

  // Estado vazio: sem diagnóstico não há KPIs (dados sempre ao vivo).
  if (!year) {
    return (
      <div style={{ width: '100%', fontFamily: t.fontBody }}>
        <h1 style={{ margin: '0 0 18px', fontFamily: t.fontDisplay, fontWeight: 600, fontSize: '30px', color: t.heading }}>{L.title}</h1>
        <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: '14px', padding: '34px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: '34px', marginBottom: '10px' }}>📊</div>
          <div style={{ fontSize: '14px', color: t.textMuted, marginBottom: '16px', lineHeight: 1.5 }}>{L.empty}</div>
          <Link to="/esg/diagnostico" style={{ display: 'inline-block', padding: '10px 20px', background: t.btnBg, color: t.btnInk, borderRadius: '10px', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>{L.emptyCta}</Link>
        </div>
      </div>
    )
  }

  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)
  const prevYear = years.find(y => y < year) || null
  const k = computeKpis(byYear[year] || {})
  const kPrev = prevYear ? computeKpis(byYear[prevYear] || {}) : null
  const track = night ? 'rgba(255,255,255,.12)' : '#e6ede8'

  // Variação vs ano anterior (▲/▼). lowerIsBetter inverte a cor (ex.: CO₂).
  const delta = (cur, prev, lowerIsBetter = false) => {
    if (cur == null || prev == null || !kPrev) return null
    const d = cur - prev
    if (d === 0) return <span style={{ fontSize: '11px', fontWeight: 700, color: t.subtle }}>= {prevYear}</span>
    const good = lowerIsBetter ? d < 0 : d > 0
    return (
      <span style={{ fontSize: '11px', fontWeight: 800, color: good ? '#0a7a3e' : '#c2410c' }}>
        {d > 0 ? '▲' : '▼'} {Math.abs(d) % 1 === 0 ? Math.abs(d) : Math.abs(d).toFixed(1)} {L.vsPrev} {prevYear}
      </span>
    )
  }

  // Temas materiais (da Dupla Materialidade) com as respetivas metas
  const materialTopics = materiality
    ? ESG_TOPICS.filter(tp => isMaterial(materiality.topics?.[tp.key], Number(materiality.threshold ?? 3.5)))
        .map(tp => ({ topic: tp, e: materiality.topics[tp.key] }))
        .sort((a, b) => (Number(b.e.stakeholder) + Number(b.e.company)) - (Number(a.e.stakeholder) + Number(a.e.company)))
    : []

  // ── blocos de estilo ──
  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px', padding: '18px 20px' }
  const secTitle = (txt, color) => <h3 style={{ margin: '0 0 14px', fontFamily: t.fontDisplay, fontSize: '18px', fontWeight: 600, color, display: 'flex', alignItems: 'center', gap: '9px' }}>{txt}</h3>
  const kpiBig = (label, value, sub, color, d) => (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</div>
      <div style={{ fontSize: '26px', fontWeight: 800, color, letterSpacing: '-.5px', fontFamily: t.fontNum || t.fontDisplay }}>{value}</div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', flexWrap: 'wrap' }}>
        {sub && <span style={{ fontSize: '11.5px', color: t.subtle }}>{sub}</span>}
        {d}
      </div>
    </div>
  )
  const miniStat = (label, value, sub, color = t.heading) => (
    <div style={{ background: t.softCardBg, borderRadius: '11px', padding: '13px 15px' }}>
      <div style={{ fontSize: '10.5px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: 800, color, fontFamily: t.fontNum || t.fontDisplay }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: t.subtle, marginTop: '2px' }}>{sub}</div>}
    </div>
  )
  const grid = (min, gap = '14px') => ({ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : `repeat(auto-fit, minmax(${min}, 1fr))`, gap })

  // Donut de Scopes
  const scopes = [
    { label: 'Scope 1', v: k.env.scope1 || 0, c: '#0a7a3e' },
    { label: 'Scope 2', v: k.env.scope2 || 0, c: '#3ba05f' },
    { label: 'Scope 3', v: k.env.scope3 || 0, c: '#9ccbaa' },
  ]
  const scopeSum = scopes.reduce((s, x) => s + x.v, 0) || 1
  let acc = 0
  const R = 52, CIRC = 2 * Math.PI * R

  // Barras de % mulheres
  const womenBars = [
    { label: L.all, v: k.social.womenAll }, { label: L.lead, v: k.social.womenLead },
    { label: L.top, v: k.social.womenTop }, { label: L.control, v: k.social.womenControl },
  ]

  const Flag = ({ label, value }) => {
    const on = value === 'yes', planned = value === 'planned'
    const bg = on ? '#eaf5ee' : planned ? '#fbf3d9' : (night ? 'rgba(255,255,255,.05)' : '#f3f5f4')
    const ink = on ? '#0a7a3e' : planned ? '#a9781a' : t.subtle
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px', background: night ? 'transparent' : bg, border: `1px solid ${t.cardBorder}`, borderRadius: '10px', padding: '10px 13px' }}>
        <span style={{ width: '20px', height: '20px', borderRadius: '50%', flex: 'none', background: ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>{on ? '✓' : planned ? '~' : (value === 'no' ? '✕' : '?')}</span>
        <span style={{ fontSize: '12.5px', fontWeight: 600, color: t.text }}>{label}</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: ink }}>{on ? L.yes : planned ? L.planned : value === 'no' ? L.no : L.na}</span>
      </div>
    )
  }

  const checklistLabels = { owners_mgmt: L.g20, controller_mgmt: L.g21, audit: L.g22, sust_data: L.g23, esg_decisions: L.g24, esg_pay: L.g25, certifications: L.g26, anticorruption: L.g27, compliance: L.g28 }

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div>
          <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accentText }}>{L.eyebrow}</div>
          <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '27px' : '34px', lineHeight: 1.05, letterSpacing: '-.5px', color: t.heading }}>{L.title}</h1>
          <p style={{ fontSize: '12.5px', color: t.textMuted, margin: '8px 0 0', maxWidth: '560px', lineHeight: 1.5 }}>{L.subtitle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: t.textMuted, fontWeight: 600 }}>{L.refYear}</span>
          <select value={year} onChange={e => setYear(Number(e.target.value))} style={{ padding: '8px 11px', borderRadius: '9px', border: `1px solid ${t.cardBorder}`, background: t.cardBg, color: t.heading, fontSize: '13px', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* ⭐ Temas materiais (Dupla Materialidade) — o que os KPIs devem seguir */}
      {materialTopics.length > 0 && (
        <div style={{ ...card, marginBottom: '16px', borderLeft: `4px solid ${t.accent}` }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '10px' }}>⭐ {L.materialTitle}</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {materialTopics.map(({ topic, e }) => {
              const meta = TOPIC_PILLAR_META[topic.pillar]
              const hasGoal = !!(e.goal && (e.goal.target || e.goal.how))
              return (
                <div key={topic.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '6px 12px', borderRadius: '20px', background: meta.bg, border: `1px solid ${meta.color}33` }}>
                  <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: meta.color, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '7.5px', fontWeight: 800 }}>{topic.abbr}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: meta.color }}>{topicLabel(topic, lang)}</span>
                  {hasGoal && e.goal.target && (
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: t.textMuted }}>🎯 {L.goalLbl}: {e.goal.target}{e.goal.deadline ? ` · ${e.goal.deadline}` : ''}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* KPIs de topo (com variação vs ano anterior) */}
      <div style={{ ...grid('190px'), marginBottom: '16px' }}>
        {kpiBig(L.co2, `${fmt(k.env.co2Total, 1)} t`, `Scope 1·2·3`, E, delta(k.env.co2Total, kPrev?.env.co2Total, true))}
        {kpiBig(L.employees, fmt(k.social.employees), 'FTE', S, delta(k.social.employees, kPrev?.social.employees))}
        {kpiBig(L.renewElec, k.env.elecRenewPct == null ? '—' : `${fmt(k.env.elecRenewPct)}%`, `${fmt(k.env.elecTotal)} kWh`, E, delta(k.env.elecRenewPct, kPrev?.env.elecRenewPct))}
        {kpiBig(L.govMaturity, `${k.gov.maturityPct}%`, L.pillarG, G, delta(k.gov.maturityPct, kPrev?.gov.maturityPct))}
      </div>

      {/* Preenchimento por pilar */}
      <div style={{ ...card, marginBottom: '22px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '12px' }}>{L.completeness}</div>
        <div style={grid('160px', '18px')}>
          {[['E', L.pillarE, E], ['S', L.pillarS, S], ['G', L.pillarG, G]].map(([key, label, color]) => {
            const c = k.completeness[key], pct = Math.round((c.done / c.total) * 100)
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Ring pct={pct} color={color} track={track} label={`${pct}%`} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: t.heading }}>{label}</div>
                  <div style={{ fontSize: '11.5px', color: t.subtle }}>{c.done}/{c.total}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ══ AMBIENTE ══ */}
      {secTitle(<><span style={{ width: '24px', height: '24px', borderRadius: '7px', background: E, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>E</span>{L.pillarE}</>, E)}
      <div style={{ ...grid('260px'), marginBottom: '14px' }}>
        {/* Scopes donut */}
        <div style={card}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '10px' }}>{L.scopes}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <svg width="130" height="130" viewBox="0 0 130 130" style={{ flex: 'none' }}>
              {scopes.map((s, i) => {
                const frac = s.v / scopeSum, dash = frac * CIRC
                const el = <circle key={i} cx="65" cy="65" r={R} fill="none" stroke={s.c} strokeWidth="16" strokeDasharray={`${dash} ${CIRC - dash}`} strokeDashoffset={-acc * CIRC} transform="rotate(-90 65 65)" />
                acc += frac; return el
              })}
              <text x="65" y="60" textAnchor="middle" fontSize="20" fontWeight="800" fill={t.heading}>{fmt(k.env.co2Total, 1)}</text>
              <text x="65" y="78" textAnchor="middle" fontSize="10" fill={t.subtle}>t CO₂</text>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {scopes.map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: s.c }} />
                  <span style={{ color: t.text, fontWeight: 600 }}>{s.label}</span>
                  <span style={{ color: t.subtle, marginLeft: 'auto' }}>{fmt(s.v, 1)} t</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Energia & recursos */}
        <div style={card}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '12px' }}>{L.energy}</div>
          <div style={grid('120px', '11px')}>
            {miniStat(L.elecTotal, `${fmt(k.env.elecTotal)}`, 'kWh')}
            {miniStat(L.renewElec, k.env.elecRenewPct == null ? '—' : `${fmt(k.env.elecRenewPct)}%`, `${L.selfGen} ${k.env.elecSelfPct == null ? '—' : fmt(k.env.elecSelfPct) + '%'}`, E)}
            {miniStat(L.water, `${fmt(k.env.water)}`, k.env.waterUnit)}
            {miniStat(L.waste, `${fmt(k.env.wasteTotal, 1)} ${k.env.wasteUnit}`, `${fmt(k.env.wasteRecycPct)}% ${L.recycled}`)}
          </div>
        </div>
      </div>

      <div style={{ ...grid('260px'), marginBottom: '26px' }}>
        {/* Taxonomia */}
        <div style={card}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '12px' }}>{L.taxonomy}</div>
          <div style={{ display: 'flex', gap: '22px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Ring pct={k.env.taxEligiblePct} color={E} track={track} label={k.env.taxEligiblePct == null ? '—' : `${fmt(k.env.taxEligiblePct)}%`} />
              <span style={{ fontSize: '12px', color: t.textMuted, fontWeight: 600 }}>{L.eligible}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Ring pct={k.env.taxAlignedPct} color="#3ba05f" track={track} label={k.env.taxAlignedPct == null ? '—' : `${fmt(k.env.taxAlignedPct)}%`} />
              <span style={{ fontSize: '12px', color: t.textMuted, fontWeight: 600 }}>{L.aligned}</span>
            </div>
          </div>
        </div>
        {/* Ações climáticas */}
        <div style={card}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '12px' }}>{L.flags}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Flag label={L.target} value={k.env.hasTarget} />
            <Flag label={L.compensate} value={k.env.compensates} />
            <Flag label={L.ecoInvest} value={k.env.ecoInvest} />
          </div>
        </div>
      </div>

      {/* ══ SOCIAL ══ */}
      {secTitle(<><span style={{ width: '24px', height: '24px', borderRadius: '7px', background: S, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>S</span>{L.pillarS}</>, S)}
      <div style={{ ...grid('260px'), marginBottom: '14px' }}>
        {/* Mulheres por posição */}
        <div style={card}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '14px' }}>{L.women}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
            {womenBars.map(b => (
              <div key={b.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ color: t.text, fontWeight: 600 }}>{b.label}</span>
                  <span style={{ color: t.subtle, fontWeight: 700 }}>{b.v == null ? '—' : `${fmt(b.v)}%`}</span>
                </div>
                <div style={{ height: '8px', borderRadius: '20px', background: track, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, b.v || 0)}%`, background: S, transition: 'width .3s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Indicadores sociais */}
        <div style={card}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '12px' }}>{L.pillarS}</div>
          <div style={grid('120px', '11px')}>
            {miniStat(L.payGap, k.social.payGap == null ? '—' : `${k.social.payGap > 0 ? '+' : ''}${fmt(k.social.payGap)}%`, null, k.social.payGap != null && k.social.payGap < 0 ? '#c2410c' : t.heading)}
            {miniStat(L.accidents, fmt(k.social.accidents), `${L.fatal}: ${fmt(k.social.accidentsFatal)}`)}
            {miniStat(L.turnover, fmt(k.social.dismissals), `${fmt(k.social.dismissalsVol)} ${L.voluntary}`)}
            {miniStat(L.training, `${fmt(k.social.trainingHours)} ${L.hoursPerEmp}`, `${fmt(k.social.trainingCost)} ${L.costPerEmp}`)}
          </div>
        </div>
      </div>

      {/* ══ GOVERNANÇA ══ */}
      {secTitle(<><span style={{ width: '24px', height: '24px', borderRadius: '7px', background: G, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>G</span>{L.pillarG}</>, G)}
      <div style={{ ...grid('260px') }}>
        {/* Propriedade + maturidade */}
        <div style={card}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '12px' }}>{L.ownership}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '12px' }}>
            <Ring pct={k.gov.maturityPct} color={G} track={track} size={64} label={`${k.gov.maturityPct}%`} />
            <div style={{ fontSize: '12px', color: t.textMuted, fontWeight: 600 }}>{L.govMaturity}</div>
          </div>
          <div style={grid('110px', '11px')}>
            {miniStat(L.owners, fmt(k.gov.owners), null, G)}
            {miniStat(L.years, `${fmt(k.gov.yearsInvolved)}`, 'anos', G)}
          </div>
        </div>
        {/* Checklist */}
        <div style={{ ...card, gridColumn: isMobile ? 'auto' : 'span 1' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '12px' }}>{L.checklist}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {k.gov.checklist.map(c => <Flag key={c.key} label={checklistLabels[c.key]} value={c.value} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
