import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { useEffectiveUserId, useViewAs } from '../../context/ViewAsContext'
import { ESG_TOPICS, TOPIC_PILLAR_META, topicLabel, isMaterial } from '../../data/esgTopics'

// Projetos ESG do cliente — nascem da Dupla Materialidade ("os projetos devem
// vir da materialidade") e carregam sempre a relação custo/benefício:
// investimento, poupança anual e payback, além do impacto esperado no KPI.

const EMPTY = { topic_key: '', name: '', description: '', status: 'planned', start_month: '', progress: 0, investment: '', annual_saving: '', expected_impact: '' }

export default function ProjetosESG() {
  const { lang } = useLang()
  const { user } = useAuth()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const eid = useEffectiveUserId()
  const { isViewing } = useViewAs()
  const [searchParams, setSearchParams] = useSearchParams()

  const [projects, setProjects] = useState([])
  const [materiality, setMateriality] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(null)      // null = fechado · {} = novo · {id} = edição
  const [msg, setMsg] = useState('')

  const L = lang === 'de' ? {
    eyebrow: 'ESG-Projekte', title: 'Projekte & Maßnahmen',
    subtitle: 'Projekte entstehen aus der Wesentlichkeit — immer mit Kosten-Nutzen-Blick (Investition, Einsparung, Payback).',
    newProject: '+ Neues Projekt', edit: 'Bearbeiten', del: 'Löschen', confirmDel: 'Projekt löschen?',
    name: 'Projektname', description: 'Beschreibung', topic: 'Wesentlichkeits-Thema', topicNone: '— Ohne Thema —',
    status: 'Status', stPlanned: 'Geplant', stActive: 'Laufend', stDone: 'Abgeschlossen',
    start: 'Beginn', progress: 'Fortschritt', invest: 'Investition (€)', saving: 'Einsparung/Jahr (€)',
    payback: 'Payback', yrs: 'Jahre', impact: 'Erwartete Wirkung (KPI)', impactPh: 'z. B. CO₂ von 85 t auf 60 t senken',
    save: 'Speichern', saving2: 'Wird gespeichert…', cancel: 'Abbrechen', saved: 'Gespeichert ✓',
    saveErr: 'Speichern fehlgeschlagen (Migration 024 nötig).', loading: 'Wird geladen…',
    empty: 'Noch keine Projekte. Erstellen Sie das erste aus einem wesentlichen Thema.',
    emptyCta: 'Zur Wesentlichkeit →', totals: 'Übersicht',
    tInvest: 'Gesamtinvestition', tSaving: 'Einsparung/Jahr', tActive: 'laufend', tDone: 'abgeschlossen',
  } : lang === 'en' ? {
    eyebrow: 'ESG Projects', title: 'Projects & Actions',
    subtitle: 'Projects are born from materiality — always with a cost-benefit lens (investment, saving, payback).',
    newProject: '+ New project', edit: 'Edit', del: 'Delete', confirmDel: 'Delete project?',
    name: 'Project name', description: 'Description', topic: 'Materiality topic', topicNone: '— No topic —',
    status: 'Status', stPlanned: 'Planned', stActive: 'In progress', stDone: 'Done',
    start: 'Start', progress: 'Progress', invest: 'Investment (€)', saving: 'Saving/year (€)',
    payback: 'Payback', yrs: 'years', impact: 'Expected impact (KPI)', impactPh: 'e.g. cut CO₂ from 85 t to 60 t',
    save: 'Save', saving2: 'Saving…', cancel: 'Cancel', saved: 'Saved ✓',
    saveErr: 'Save failed (migration 024 required).', loading: 'Loading…',
    empty: 'No projects yet. Create the first one from a material topic.',
    emptyCta: 'Go to materiality →', totals: 'Overview',
    tInvest: 'Total investment', tSaving: 'Saving/year', tActive: 'in progress', tDone: 'done',
  } : {
    eyebrow: 'Projetos ESG', title: 'Projetos & Ações',
    subtitle: 'Os projetos nascem da materialidade — sempre com a lente custo/benefício (investimento, poupança, payback).',
    newProject: '+ Novo projeto', edit: 'Editar', del: 'Eliminar', confirmDel: 'Eliminar o projeto?',
    name: 'Nome do projeto', description: 'Descrição', topic: 'Tema da materialidade', topicNone: '— Sem tema —',
    status: 'Estado', stPlanned: 'Planeado', stActive: 'Em curso', stDone: 'Concluído',
    start: 'Início', progress: 'Progresso', invest: 'Investimento (€)', saving: 'Poupança/ano (€)',
    payback: 'Payback', yrs: 'anos', impact: 'Impacto esperado (KPI)', impactPh: 'ex.: reduzir CO₂ de 85 t para 60 t',
    save: 'Guardar', saving2: 'A guardar…', cancel: 'Cancelar', saved: 'Guardado ✓',
    saveErr: 'Falha ao guardar (é necessária a migração 024).', loading: 'A carregar…',
    empty: 'Ainda não há projetos. Cria o primeiro a partir de um tema material.',
    emptyCta: 'Ir à materialidade →', totals: 'Visão geral',
    tInvest: 'Investimento total', tSaving: 'Poupança/ano', tActive: 'em curso', tDone: 'concluídos',
  }

  const STATUS = {
    planned: { label: L.stPlanned, bg: '#e8f0fb', ink: '#1e60c8' },
    active:  { label: L.stActive,  bg: '#fbf3d9', ink: '#a9781a' },
    done:    { label: L.stDone,    bg: '#eaf5ee', ink: '#0a7a3e' },
  }

  const load = useCallback(async () => {
    if (!eid) return
    setLoading(true)
    const [{ data: pj }, { data: mat }] = await Promise.all([
      supabase.from('esg_projects').select('*').eq('user_id', eid).order('created_at', { ascending: true }),
      supabase.from('esg_materiality').select('topics, threshold').eq('user_id', eid).maybeSingle(),
    ])
    setProjects(pj || [])
    setMateriality(mat || null)
    setLoading(false)
  }, [eid])
  useEffect(() => { load() }, [load])

  // Vindo da Materialidade: /esg/projetos?topic=clima → abre o form pré-preenchido
  // (herda investimento/poupança do financeiro do tema e a meta como impacto)
  useEffect(() => {
    const topic = searchParams.get('topic')
    if (topic && !loading && !isViewing) {
      const e = materiality?.topics?.[topic]
      setForm({ ...EMPTY, topic_key: topic,
        investment: e?.financial?.investment || '', annual_saving: e?.financial?.saving || '',
        expected_impact: e?.goal ? [e.goal.baseline, e.goal.target].filter(Boolean).join(' → ') : '' })
      searchParams.delete('topic')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams, materiality, isViewing, loading])

  const materialKeys = new Set(materiality
    ? ESG_TOPICS.filter(tp => isMaterial(materiality.topics?.[tp.key], Number(materiality.threshold ?? 3.5))).map(tp => tp.key)
    : [])

  async function saveProject() {
    if (isViewing || !user || !form?.name) return
    setSaving(true); setMsg('')
    const row = {
      user_id: user.id, topic_key: form.topic_key || null, name: form.name, description: form.description || null,
      status: form.status, start_month: form.start_month || null, progress: Number(form.progress) || 0,
      investment: form.investment === '' ? null : Number(form.investment),
      annual_saving: form.annual_saving === '' ? null : Number(form.annual_saving),
      expected_impact: form.expected_impact || null, updated_at: new Date().toISOString(),
    }
    const q = form.id
      ? supabase.from('esg_projects').update(row).eq('id', form.id)
      : supabase.from('esg_projects').insert(row)
    const { error } = await q
    setSaving(false)
    if (error) { setMsg(L.saveErr); setTimeout(() => setMsg(''), 3000); return }
    setForm(null); setMsg(L.saved); setTimeout(() => setMsg(''), 2400)
    load()
  }

  async function deleteProject(id) {
    if (isViewing || !window.confirm(L.confirmDel)) return
    await supabase.from('esg_projects').delete().eq('id', id)
    load()
  }

  const payback = (inv, sav) => (Number(inv) > 0 && Number(sav) > 0 ? Number(inv) / Number(sav) : null)
  const fmtEur = (v) => v == null ? '—' : `€ ${Number(v).toLocaleString('pt-PT')}`

  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px' }
  const inputStyle = { padding: '9px 11px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box' }
  const labelStyle = { fontSize: '10.5px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }

  if (loading) return <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.loading}</div>

  const totInvest = projects.reduce((s, p) => s + (Number(p.investment) || 0), 0)
  const totSaving = projects.reduce((s, p) => s + (Number(p.annual_saving) || 0), 0)

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody, maxWidth: '900px' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div>
          <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accentText }}>{L.eyebrow}</div>
          <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '27px' : '34px', lineHeight: 1.05, letterSpacing: '-.5px', color: t.heading }}>{L.title}</h1>
          <p style={{ fontSize: '12.5px', color: t.textMuted, margin: '8px 0 0', maxWidth: '560px', lineHeight: 1.5 }}>{L.subtitle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {msg && <span style={{ fontSize: '12px', fontWeight: 700, color: msg === L.saved ? '#0a7a3e' : t.neg }}>{msg}</span>}
          {!isViewing && !form && (
            <button onClick={() => setForm({ ...EMPTY })} style={{ padding: '10px 20px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>{L.newProject}</button>
          )}
        </div>
      </div>

      {/* Totais */}
      {projects.length > 0 && (
        <div style={{ ...card, padding: '14px 18px', marginBottom: '16px', display: 'flex', gap: '22px', flexWrap: 'wrap' }}>
          {[[L.tInvest, fmtEur(totInvest), t.heading], [L.tSaving, fmtEur(totSaving), '#0a7a3e'],
            [L.tActive, projects.filter(p => p.status === 'active').length, '#a9781a'],
            [L.tDone, projects.filter(p => p.status === 'done').length, '#0a7a3e']].map(([lbl, val, color]) => (
            <div key={lbl}>
              <div style={labelStyle}>{lbl}</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color, fontFamily: t.fontNum || t.fontDisplay }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {/* Formulário */}
      {form && !isViewing && (
        <div style={{ ...card, padding: '18px 20px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1.4fr', gap: '12px' }}>
            <div><div style={labelStyle}>{L.name}</div>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={L.name} style={inputStyle} /></div>
            <div><div style={labelStyle}>{L.topic}</div>
              <select value={form.topic_key} onChange={e => setForm(f => ({ ...f, topic_key: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">{L.topicNone}</option>
                {ESG_TOPICS.map(tp => <option key={tp.key} value={tp.key}>{topicLabel(tp, lang)}{materialKeys.has(tp.key) ? ' ⭐' : ''}</option>)}
              </select></div>
          </div>
          <div><div style={labelStyle}>{L.description}</div>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical', fontFamily: t.fontBody }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '12px' }}>
            <div><div style={labelStyle}>{L.status}</div>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                {Object.entries(STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
              </select></div>
            <div><div style={labelStyle}>{L.start}</div>
              <input type="month" value={form.start_month || ''} onChange={e => setForm(f => ({ ...f, start_month: e.target.value }))} style={inputStyle} /></div>
            <div style={{ gridColumn: 'span 2' }}><div style={labelStyle}>{L.progress} ({form.progress}%)</div>
              <input type="range" min="0" max="100" step="5" value={form.progress} onChange={e => setForm(f => ({ ...f, progress: e.target.value }))} style={{ width: '100%', accentColor: t.accent, marginTop: '10px' }} /></div>
            <div><div style={labelStyle}>{L.invest}</div>
              <input type="number" value={form.investment} onChange={e => setForm(f => ({ ...f, investment: e.target.value }))} placeholder="0" style={inputStyle} /></div>
            <div><div style={labelStyle}>{L.saving}</div>
              <input type="number" value={form.annual_saving} onChange={e => setForm(f => ({ ...f, annual_saving: e.target.value }))} placeholder="0" style={inputStyle} /></div>
            <div style={{ gridColumn: 'span 2' }}><div style={labelStyle}>{L.impact}</div>
              <input value={form.expected_impact} onChange={e => setForm(f => ({ ...f, expected_impact: e.target.value }))} placeholder={L.impactPh} style={inputStyle} /></div>
          </div>
          {payback(form.investment, form.annual_saving) != null && (
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0a7a3e' }}>💶 {L.payback}: {payback(form.investment, form.annual_saving).toFixed(1)} {L.yrs}</div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={saveProject} disabled={saving || !form.name} style={{ padding: '9px 20px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '9px', fontWeight: 700, fontSize: '13px', cursor: form.name ? 'pointer' : 'default', opacity: form.name ? 1 : 0.5 }}>{saving ? L.saving2 : L.save}</button>
            <button onClick={() => setForm(null)} style={{ padding: '9px 16px', background: 'transparent', border: `1px solid ${t.cardBorder}`, borderRadius: '9px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: t.textMuted }}>{L.cancel}</button>
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {projects.length === 0 && !form && (
        <div style={{ ...card, padding: '34px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: '34px', marginBottom: '10px' }}>🚀</div>
          <div style={{ fontSize: '14px', color: t.textMuted, marginBottom: '16px', lineHeight: 1.5 }}>{L.empty}</div>
          <Link to="/esg/materialidade" style={{ display: 'inline-block', padding: '10px 20px', background: t.btnBg, color: t.btnInk, borderRadius: '10px', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>{L.emptyCta}</Link>
        </div>
      )}

      {/* Lista de projetos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {projects.map(p => {
          const tp = ESG_TOPICS.find(x => x.key === p.topic_key)
          const meta = tp ? TOPIC_PILLAR_META[tp.pillar] : null
          const st = STATUS[p.status] || STATUS.planned
          const pb = payback(p.investment, p.annual_saving)
          return (
            <div key={p.id} style={{ ...card, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span style={{ fontSize: '14.5px', fontWeight: 800, color: t.heading }}>{p.name}</span>
                {tp && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 700, background: meta.bg, color: meta.color }}>
                    {topicLabel(tp, lang)}{materialKeys.has(tp.key) ? ' ⭐' : ''}
                  </span>
                )}
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 700, background: st.bg, color: st.ink }}>{st.label}</span>
                {p.start_month && <span style={{ fontSize: '11px', color: t.subtle }}>{L.start}: {p.start_month}</span>}
                {!isViewing && (
                  <span style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                    <button onClick={() => setForm({ ...EMPTY, ...p, investment: p.investment ?? '', annual_saving: p.annual_saving ?? '', description: p.description || '', expected_impact: p.expected_impact || '', topic_key: p.topic_key || '', start_month: p.start_month || '' })} style={{ padding: '5px 11px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', border: `1px solid ${t.cardBorder}`, background: 'transparent', color: t.textMuted }}>{L.edit}</button>
                    <button onClick={() => deleteProject(p.id)} style={{ padding: '5px 11px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', border: `1px solid ${t.cardBorder}`, background: 'transparent', color: t.neg }}>{L.del}</button>
                  </span>
                )}
              </div>
              {p.description && <div style={{ fontSize: '12.5px', color: t.text, lineHeight: 1.5, marginBottom: '8px' }}>{p.description}</div>}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px', fontSize: '12px' }}>
                {p.investment != null && <span style={{ color: t.textMuted }}>{L.invest.split(' (')[0]}: <strong style={{ color: t.heading }}>{fmtEur(p.investment)}</strong></span>}
                {p.annual_saving != null && <span style={{ color: t.textMuted }}>{L.saving.split('/')[0]}: <strong style={{ color: '#0a7a3e' }}>{fmtEur(p.annual_saving)}</strong></span>}
                {pb != null && <span style={{ fontWeight: 800, color: '#0a7a3e' }}>💶 {L.payback}: {pb.toFixed(1)} {L.yrs}</span>}
                {p.expected_impact && <span style={{ color: t.textMuted }}>🎯 {p.expected_impact}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '6px', background: t.softCardBg, borderRadius: '20px', overflow: 'hidden' }}>
                  <div style={{ width: `${p.progress}%`, height: '100%', background: `linear-gradient(90deg, ${t.heading}, ${t.accent})`, borderRadius: '20px', transition: 'width .3s' }} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, minWidth: '32px' }}>{p.progress}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
