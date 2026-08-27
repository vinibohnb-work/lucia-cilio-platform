import { useState, useEffect, useCallback } from 'react'
import EsqueletoPagina from '../../components/EsqueletoPagina'
import { localeDe } from '../../lib/formato'
import { useLang } from '../../context/LangContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { useEffectiveUserId, useViewAs } from '../../context/ViewAsContext'
import { computeKpis } from '../../lib/esgKpis'
import { ESG_TOPICS, TOPIC_PILLAR_META, topicLabel, isMaterial } from '../../data/esgTopics'

// Relatório ESG descritivo — a estrutura da Lúcia:
//   1. Dupla materialidade (o que é importante para as duas partes + financeiro)
//   2. Diagnóstico (ano passado → este ano)
//   3. Projetos a implementar (custo/benefício)
//   4. KPIs (o resultado do que foi implementado)
// Os dados vêm ao vivo da plataforma; cada secção tem texto editável por cima.

const SECTIONS = ['materialidade', 'diagnostico', 'projetos', 'kpis']

export default function RelatoriosESG() {
  const { lang } = useLang()
  const { user } = useAuth()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const eid = useEffectiveUserId()
  const { isViewing } = useViewAs()

  const [byYear, setByYear] = useState({})
  const [year, setYear] = useState(null)
  const [materiality, setMateriality] = useState(null)
  const [projects, setProjects] = useState([])
  const [company, setCompany] = useState(null)
  const [sections, setSections] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const L = lang === 'de' ? {
    eyebrow: 'ESG-Bericht', title: 'Nachhaltigkeitsbericht',
    subtitle: 'Struktur mit Live-Daten der Plattform vorausgefüllt — der Text jeder Sektion ist frei editierbar.',
    refYear: 'Bezugsjahr', save: 'Speichern', saving: 'Wird gespeichert…', saved: 'Gespeichert ✓',
    saveErr: 'Speichern fehlgeschlagen (Migration 024 nötig).', loading: 'Wird geladen…', print: '🖨 Drucken / PDF',
    s1: '1. Doppelte Wesentlichkeit', s2: '2. Diagnose', s3: '3. Projekte & Maßnahmen', s4: '4. KPIs & Ergebnisse',
    textPh: 'Eigener Text für diese Sektion…', dataLbl: 'Live-Daten der Plattform',
    noData: 'Keine Daten vorhanden.', vs: 'ggü.', invest: 'Investition', saving2: 'Einsparung/Jahr', payback: 'Payback', yrs: 'Jahre',
    matHeader: ['Thema', 'Stakeholder', 'Unternehmen', 'Fin. Wirkung', 'Ziel'],
    kpiRows: { co2: 'CO₂ (t)', renew: 'Erneuerbarer Strom (%)', water: 'Wasser (m³)', waste: 'Recyclingquote (%)', emp: 'Mitarbeitende (FTE)', women: 'Frauenanteil (%)', train: 'Weiterbildung (Std./MA)', gov: 'Governance-Reife (%)' },
    stLbl: { planned: 'Geplant', active: 'Laufend', done: 'Abgeschlossen' },
  } : lang === 'en' ? {
    eyebrow: 'ESG Report', title: 'Sustainability Report',
    subtitle: 'Structure pre-filled with live platform data — the text of each section is fully editable.',
    refYear: 'Reference year', save: 'Save', saving: 'Saving…', saved: 'Saved ✓',
    saveErr: 'Save failed (migration 024 required).', loading: 'Loading…', print: '🖨 Print / PDF',
    s1: '1. Double Materiality', s2: '2. Assessment', s3: '3. Projects & Actions', s4: '4. KPIs & Results',
    textPh: 'Your own text for this section…', dataLbl: 'Live platform data',
    noData: 'No data yet.', vs: 'vs', invest: 'Investment', saving2: 'Saving/year', payback: 'Payback', yrs: 'years',
    matHeader: ['Topic', 'Stakeholders', 'Company', 'Fin. impact', 'Target'],
    kpiRows: { co2: 'CO₂ (t)', renew: 'Renewable electricity (%)', water: 'Water (m³)', waste: 'Recycling rate (%)', emp: 'Employees (FTE)', women: 'Share of women (%)', train: 'Training (h/emp.)', gov: 'Governance maturity (%)' },
    stLbl: { planned: 'Planned', active: 'In progress', done: 'Done' },
  } : {
    eyebrow: 'Relatório ESG', title: 'Relatório de Sustentabilidade',
    subtitle: 'Estrutura pré-preenchida com os dados ao vivo da plataforma — o texto de cada secção é editável.',
    refYear: 'Ano de referência', save: 'Guardar', saving: 'A guardar…', saved: 'Guardado ✓',
    saveErr: 'Falha ao guardar (é necessária a migração 024).', loading: 'A carregar…', print: '🖨 Imprimir / PDF',
    s1: '1. Dupla Materialidade', s2: '2. Diagnóstico', s3: '3. Projetos & Ações', s4: '4. KPIs & Resultados',
    textPh: 'O teu texto para esta secção…', dataLbl: 'Dados ao vivo da plataforma',
    noData: 'Ainda sem dados.', vs: 'vs', invest: 'Investimento', saving2: 'Poupança/ano', payback: 'Payback', yrs: 'anos',
    matHeader: ['Tema', 'Stakeholders', 'Empresa', 'Impacto fin.', 'Meta'],
    kpiRows: { co2: 'CO₂ (t)', renew: 'Eletricidade renovável (%)', water: 'Água (m³)', waste: 'Taxa de reciclagem (%)', emp: 'Colaboradores (FTE)', women: 'Percentagem de mulheres (%)', train: 'Formação (h/colab.)', gov: 'Maturidade de governança (%)' },
    stLbl: { planned: 'Planeado', active: 'Em curso', done: 'Concluído' },
  }

  const load = useCallback(async () => {
    if (!eid) return
    setLoading(true)
    const [{ data: diags }, { data: mat }, { data: pj }, { data: cs }] = await Promise.all([
      supabase.from('esg_diagnostics').select('answers, reference_year').eq('user_id', eid).order('reference_year', { ascending: false }),
      supabase.from('esg_materiality').select('topics, threshold').eq('user_id', eid).maybeSingle(),
      supabase.from('esg_projects').select('*').eq('user_id', eid).order('created_at', { ascending: true }),
      supabase.from('company_settings').select('company_name').eq('user_id', eid).maybeSingle(),
    ])
    const map = {}
    ;(diags || []).forEach(r => { if (r.answers && Object.keys(r.answers).length) map[r.reference_year] = r.answers })
    setByYear(map)
    const years = Object.keys(map).map(Number).sort((a, b) => b - a)
    const y = years[0] || new Date().getFullYear()
    setYear(y)
    setMateriality(mat || null)
    setProjects(pj || [])
    setCompany(cs || null)
    const { data: rep } = await supabase.from('esg_reports').select('sections').eq('user_id', eid).eq('reference_year', y).maybeSingle()
    setSections(rep?.sections || {})
    setLoading(false)
  }, [eid])
  useEffect(() => { load() }, [load])

  async function pickYear(y) {
    setYear(y)
    const { data: rep } = await supabase.from('esg_reports').select('sections').eq('user_id', eid).eq('reference_year', y).maybeSingle()
    setSections(rep?.sections || {})
  }

  async function save() {
    if (isViewing || !user) return
    setSaving(true); setMsg('')
    const { error } = await supabase.from('esg_reports').upsert(
      { user_id: user.id, reference_year: Number(year), sections, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,reference_year' }
    )
    setSaving(false)
    setMsg(error ? L.saveErr : L.saved)
    setTimeout(() => setMsg(''), 2600)
  }

  if (loading) return <EsqueletoPagina />

  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)
  const prevYear = years.find(y => y < year) || null
  const k = computeKpis(byYear[year] || {})
  const kPrev = prevYear ? computeKpis(byYear[prevYear] || {}) : null

  const material = materiality
    ? ESG_TOPICS.filter(tp => isMaterial(materiality.topics?.[tp.key], Number(materiality.threshold ?? 3.5)))
        .map(tp => ({ topic: tp, e: materiality.topics[tp.key] }))
        .sort((a, b) => (Number(b.e.stakeholder) + Number(b.e.company)) - (Number(a.e.stakeholder) + Number(a.e.company)))
    : []

  const fmt = (v, d = 0) => v == null ? '—' : Number(v).toLocaleString(localeDe(lang), { minimumFractionDigits: d, maximumFractionDigits: d })
  const kpiTable = [
    [L.kpiRows.co2, k.env.co2Total, kPrev?.env.co2Total, 1],
    [L.kpiRows.renew, k.env.elecRenewPct, kPrev?.env.elecRenewPct, 0],
    [L.kpiRows.water, k.env.water, kPrev?.env.water, 0],
    [L.kpiRows.waste, k.env.wasteRecycPct, kPrev?.env.wasteRecycPct, 0],
    [L.kpiRows.emp, k.social.employees, kPrev?.social.employees, 0],
    [L.kpiRows.women, k.social.womenAll, kPrev?.social.womenAll, 0],
    [L.kpiRows.train, k.social.trainingHours, kPrev?.social.trainingHours, 0],
    [L.kpiRows.gov, k.gov.maturityPct, kPrev?.gov.maturityPct, 0],
  ]

  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px' }
  const th = { textAlign: 'left', fontSize: '10.5px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', padding: '6px 10px', borderBottom: `1px solid ${t.cardBorder}` }
  const td = { fontSize: '12.5px', color: t.text, padding: '7px 10px', borderBottom: `1px solid ${t.rowBorder || t.cardBorder}` }

  // ── Impressão: gera um documento limpo numa nova janela ──
  function printReport() {
    const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
    const secText = (key) => sections[key] ? `<p class="txt">${esc(sections[key]).replace(/\n/g, '<br/>')}</p>` : ''
    const matRows = material.map(({ topic, e }) => `<tr><td>${esc(topicLabel(topic, lang))}</td><td>${e.stakeholder}/5</td><td>${e.company}/5</td><td>${e.financial?.impact ? e.financial.impact + '/5' : '—'}</td><td>${esc(e.goal?.target || '—')}</td></tr>`).join('')
    const kpiRows = kpiTable.map(([lbl, cur, prev, d]) => `<tr><td>${esc(lbl)}</td><td>${fmt(cur, d)}</td><td>${prevYear ? fmt(prev, d) : '—'}</td></tr>`).join('')
    const pjRows = projects.map(p => `<tr><td>${esc(p.name)}</td><td>${esc(L.stLbl[p.status] || p.status)}</td><td>${p.investment != null ? '€ ' + fmt(p.investment) : '—'}</td><td>${p.annual_saving != null ? '€ ' + fmt(p.annual_saving) : '—'}</td><td>${p.progress}%</td></tr>`).join('')
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>ESG ${year}</title><style>
      body{font-family:Georgia,serif;color:#1a2b20;max-width:760px;margin:40px auto;padding:0 20px;line-height:1.55}
      h1{font-size:26px;margin-bottom:4px} .sub{color:#667;font-size:13px;margin-bottom:28px}
      h2{font-size:17px;border-bottom:2px solid #c9a84c;padding-bottom:4px;margin-top:30px}
      table{width:100%;border-collapse:collapse;font-size:12px;margin:10px 0}
      th{ text-align:left;border-bottom:1px solid #999;padding:4px 8px;font-size:10.5px;text-transform:uppercase;color:#556}
      td{border-bottom:1px solid #ddd;padding:5px 8px} .txt{font-size:13px;white-space:pre-wrap}
    </style></head><body>
      <h1>${esc(L.title)} ${year}</h1>
      <div class="sub">${esc(company?.company_name || '')}</div>
      <h2>${esc(L.s1)}</h2>${secText('materialidade')}
      <table><tr>${L.matHeader.map(h => `<th>${esc(h)}</th>`).join('')}</tr>${matRows || `<tr><td colspan="5">${esc(L.noData)}</td></tr>`}</table>
      <h2>${esc(L.s2)}</h2>${secText('diagnostico')}
      <h2>${esc(L.s3)}</h2>${secText('projetos')}
      <table><tr><th>${esc(L.s3.slice(3))}</th><th>Status</th><th>${esc(L.invest)}</th><th>${esc(L.saving2)}</th><th>%</th></tr>${pjRows || `<tr><td colspan="5">${esc(L.noData)}</td></tr>`}</table>
      <h2>${esc(L.s4)}</h2>${secText('kpis')}
      <table><tr><th>KPI</th><th>${year}</th><th>${prevYear || '—'}</th></tr>${kpiRows}</table>
    </body></html>`
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html); w.document.close()
    setTimeout(() => w.print(), 300)
  }

  const SectionCard = ({ id, title, children }) => (
    <div style={{ ...card, padding: '18px 20px', marginBottom: '16px' }}>
      <h3 style={{ margin: '0 0 12px', fontFamily: t.fontDisplay, fontSize: '18px', fontWeight: 600, color: t.heading, borderBottom: `2px solid ${t.accent}`, paddingBottom: '6px' }}>{title}</h3>
      <textarea value={sections[id] || ''} disabled={isViewing} onChange={e => setSections(p => ({ ...p, [id]: e.target.value }))}
        placeholder={L.textPh} rows={3}
        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '13px', fontFamily: t.fontBody, resize: 'vertical', outline: 'none', marginBottom: '12px' }} />
      <div style={{ fontSize: '10px', fontWeight: 700, color: t.subtle, textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '6px' }}>{L.dataLbl}</div>
      {children}
    </div>
  )

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody, maxWidth: '860px' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div>
          <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accentText }}>{L.eyebrow}</div>
          <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '27px' : '34px', lineHeight: 1.05, letterSpacing: '-.5px', color: t.heading }}>{L.title}</h1>
          <p style={{ fontSize: '12.5px', color: t.textMuted, margin: '8px 0 0', maxWidth: '560px', lineHeight: 1.5 }}>{L.subtitle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {msg && <span style={{ fontSize: '12px', fontWeight: 700, color: msg === L.saved ? '#0a7a3e' : t.neg }}>{msg}</span>}
          <span style={{ fontSize: '12px', color: t.textMuted, fontWeight: 600 }}>{L.refYear}</span>
          <select value={year} onChange={e => pickYear(Number(e.target.value))} style={{ padding: '8px 11px', borderRadius: '9px', border: `1px solid ${t.cardBorder}`, background: t.cardBg, color: t.heading, fontSize: '13px', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
            {(years.length ? years : [year]).map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={printReport} style={{ padding: '9px 15px', borderRadius: '10px', border: `1px solid ${t.cardBorder}`, background: t.cardBg, color: t.heading, fontWeight: 700, fontSize: '12.5px', cursor: 'pointer' }}>{L.print}</button>
          {!isViewing && <button onClick={save} disabled={saving} style={{ padding: '10px 20px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: saving ? 'wait' : 'pointer' }}>{saving ? L.saving : L.save}</button>}
        </div>
      </div>

      {/* 1. Dupla Materialidade */}
      <SectionCard id="materialidade" title={L.s1}>
        {material.length === 0 ? <div style={{ fontSize: '12px', color: t.subtle }}>{L.noData}</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{L.matHeader.map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {material.map(({ topic, e }) => (
                  <tr key={topic.key}>
                    <td style={{ ...td, fontWeight: 700, color: TOPIC_PILLAR_META[topic.pillar].color }}>{topicLabel(topic, lang)}</td>
                    <td style={td}>{e.stakeholder}/5</td>
                    <td style={td}>{e.company}/5</td>
                    <td style={td}>{e.financial?.impact ? `${e.financial.impact}/5` : '—'}</td>
                    <td style={td}>{e.goal?.target || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* 2. Diagnóstico */}
      <SectionCard id="diagnostico" title={L.s2}>
        <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
          {[['E', '#0a7a3e'], ['S', '#1e60c8'], ['G', '#a9781a']].map(([p, color]) => {
            const c = k.completeness[p]
            return (
              <div key={p} style={{ fontSize: '12.5px', color: t.text }}>
                <span style={{ display: 'inline-flex', width: '18px', height: '18px', borderRadius: '5px', background: color, color: '#fff', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, marginRight: '6px', verticalAlign: 'middle' }}>{p}</span>
                <strong>{c.done}/{c.total}</strong>
              </div>
            )
          })}
          <div style={{ fontSize: '12.5px', color: t.textMuted }}>{L.refYear}: <strong style={{ color: t.heading }}>{year}</strong>{prevYear ? <> · {L.vs} <strong style={{ color: t.heading }}>{prevYear}</strong></> : null}</div>
        </div>
      </SectionCard>

      {/* 3. Projetos */}
      <SectionCard id="projetos" title={L.s3}>
        {projects.length === 0 ? <div style={{ fontSize: '12px', color: t.subtle }}>{L.noData}</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {projects.map(p => (
              <div key={p.id} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', fontSize: '12.5px', padding: '7px 10px', background: t.softCardBg, borderRadius: '9px' }}>
                <strong style={{ color: t.heading }}>{p.name}</strong>
                <span style={{ color: t.textMuted }}>{L.stLbl[p.status] || p.status} · {p.progress}%</span>
                {p.investment != null && <span style={{ color: t.textMuted }}>{L.invest}: € {fmt(p.investment)}</span>}
                {p.annual_saving != null && <span style={{ color: '#0a7a3e', fontWeight: 700 }}>{L.saving2}: € {fmt(p.annual_saving)}</span>}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* 4. KPIs */}
      <SectionCard id="kpis" title={L.s4}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>KPI</th><th style={th}>{year}</th><th style={th}>{prevYear || '—'}</th></tr></thead>
            <tbody>
              {kpiTable.map(([lbl, cur, prev, d]) => (
                <tr key={lbl}>
                  <td style={{ ...td, fontWeight: 600 }}>{lbl}</td>
                  <td style={{ ...td, fontWeight: 700, color: t.heading }}>{fmt(cur, d)}</td>
                  <td style={td}>{prevYear ? fmt(prev, d) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  )
}
