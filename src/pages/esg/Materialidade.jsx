import { useState, useEffect, useCallback } from 'react'
import { useLang } from '../../context/LangContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { useEffectiveUserId, useViewAs } from '../../context/ViewAsContext'
import { ESG_TOPICS, TOPIC_PILLAR_META, topicLabel, topicHint, isMaterial } from '../../data/esgTopics'

// Dupla materialidade simplificada (modelo VSME/PME):
// eixo X = importância/impacto para a empresa · eixo Y = importância para os
// stakeholders. O quadrante superior direito (≥ limiar em ambos) é material —
// "é onde nós temos que trabalhar" — e cada tema material pode receber uma meta.

const EMPTY_GOAL = { baseline: '', target: '', deadline: '', how: '' }

export default function Materialidade() {
  const { lang } = useLang()
  const { user } = useAuth()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const eid = useEffectiveUserId()
  const { isViewing } = useViewAs()

  const [topics, setTopics] = useState({})       // key -> { applicable, stakeholder, company, note, goal }
  const [threshold, setThreshold] = useState(3.5)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [goalOpen, setGoalOpen] = useState(null) // key do tema com o form de meta aberto
  const [goalForm, setGoalForm] = useState(EMPTY_GOAL)

  const L = lang === 'de' ? {
    eyebrow: 'Wesentlichkeit', title: 'Doppelte Wesentlichkeit',
    subtitle: 'Bewerten Sie jedes Thema aus zwei Blickwinkeln (1–5). Der Quadrant oben rechts ist wesentlich — dort wird gearbeitet.',
    axisX: 'Bedeutung / Auswirkung für das Unternehmen', axisY: 'Bedeutung für die Stakeholder',
    applicable: 'anwendbar', stakeholder: 'Stakeholder', company: 'Unternehmen', note: 'Notiz (warum?)',
    matrix: 'Wesentlichkeitsmatrix', thresholdL: 'Schwelle', materialZone: 'wesentlich',
    materialList: 'Wesentliche Themen', noMaterial: 'Noch keine Themen im wesentlichen Quadranten.',
    goal: 'Ziel definieren', goalEdit: 'Ziel bearbeiten', baseline: 'Ausgangswert (heute)', target: 'Zielwert',
    deadline: 'Frist', how: 'Wie? (Maßnahmen)', saveGoal: 'Ziel speichern', removeGoal: 'Ziel entfernen',
    save: 'Speichern', saving: 'Wird gespeichert…', saved: 'Gespeichert ✓',
    saveErr: 'Speichern fehlgeschlagen (Migration 022 nötig).', loading: 'Wird geladen…',
    scored: 'Bewertet', legendHint: 'Punkt anklicken = Thema in der Liste unten.',
  } : lang === 'en' ? {
    eyebrow: 'Materiality', title: 'Double Materiality',
    subtitle: 'Score each topic from two angles (1–5). The top-right quadrant is material — that is where the work happens.',
    axisX: 'Importance / impact for the company', axisY: 'Importance for stakeholders',
    applicable: 'applicable', stakeholder: 'Stakeholders', company: 'Company', note: 'Note (why?)',
    matrix: 'Materiality matrix', thresholdL: 'Threshold', materialZone: 'material',
    materialList: 'Material topics', noMaterial: 'No topics in the material quadrant yet.',
    goal: 'Set goal', goalEdit: 'Edit goal', baseline: 'Baseline (today)', target: 'Target',
    deadline: 'Deadline', how: 'How? (actions)', saveGoal: 'Save goal', removeGoal: 'Remove goal',
    save: 'Save', saving: 'Saving…', saved: 'Saved ✓',
    saveErr: 'Save failed (migration 022 required).', loading: 'Loading…',
    scored: 'Scored', legendHint: 'Each dot is a topic listed below.',
  } : {
    eyebrow: 'Materialidade', title: 'Dupla Materialidade',
    subtitle: 'Pontua cada tema em duas perspetivas (1–5). O quadrante superior direito é material — é onde se trabalha.',
    axisX: 'Importância / impacto para a empresa', axisY: 'Importância para os stakeholders',
    applicable: 'aplica-se', stakeholder: 'Stakeholders', company: 'Empresa', note: 'Nota (porquê?)',
    matrix: 'Matriz de materialidade', thresholdL: 'Limiar', materialZone: 'material',
    materialList: 'Temas materiais', noMaterial: 'Ainda não há temas no quadrante material.',
    goal: 'Definir meta', goalEdit: 'Editar meta', baseline: 'Valor atual (hoje)', target: 'Meta',
    deadline: 'Prazo', how: 'Como? (ações)', saveGoal: 'Guardar meta', removeGoal: 'Remover meta',
    save: 'Guardar', saving: 'A guardar…', saved: 'Guardado ✓',
    saveErr: 'Falha ao guardar (é necessária a migração 022).', loading: 'A carregar…',
    scored: 'Pontuados', legendHint: 'Cada ponto é um tema listado abaixo.',
  }

  const load = useCallback(async () => {
    if (!eid) return
    setLoading(true)
    const { data } = await supabase.from('esg_materiality').select('topics, threshold').eq('user_id', eid).maybeSingle()
    if (data) { setTopics(data.topics || {}); if (data.threshold != null) setThreshold(Number(data.threshold)) }
    setLoading(false)
  }, [eid])
  useEffect(() => { load() }, [load])

  async function save(next = topics, th = threshold) {
    if (isViewing || !user) return
    setSaving(true); setMsg('')
    const { error } = await supabase.from('esg_materiality').upsert(
      { user_id: user.id, topics: next, threshold: th, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    setSaving(false)
    setMsg(error ? L.saveErr : L.saved)
    setTimeout(() => setMsg(''), 2400)
  }

  const patch = (key, p) => setTopics(prev => ({ ...prev, [key]: { ...(prev[key] || {}), ...p } }))

  // ── Derivados ──
  const entries = ESG_TOPICS.map(tp => ({ topic: tp, e: topics[tp.key] || {} }))
  const scoredCount = entries.filter(({ e }) => e.applicable && e.stakeholder && e.company).length
  const material = entries
    .filter(({ e }) => isMaterial(e, threshold))
    .sort((a, b) => (Number(b.e.stakeholder) + Number(b.e.company)) - (Number(a.e.stakeholder) + Number(a.e.company)))

  // ── Metas ──
  function openGoal(key) {
    const g = topics[key]?.goal || EMPTY_GOAL
    setGoalForm({ ...EMPTY_GOAL, ...g })
    setGoalOpen(goalOpen === key ? null : key)
  }
  function saveGoal(key) {
    const next = { ...topics, [key]: { ...(topics[key] || {}), goal: { ...goalForm } } }
    setTopics(next); setGoalOpen(null); save(next)
  }
  function removeGoal(key) {
    const cur = { ...(topics[key] || {}) }; delete cur.goal
    const next = { ...topics, [key]: cur }
    setTopics(next); setGoalOpen(null); save(next)
  }

  // ── Estilos ──
  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px' }
  const inputStyle = { padding: '8px 10px', borderRadius: '8px', border: `1px solid ${t.inputBorder}`, fontSize: '12.5px', background: t.inputBg, color: t.heading, outline: 'none', width: '100%', boxSizing: 'border-box' }

  // Botões de pontuação 1–5
  const ScoreRow = ({ value, onPick, color, disabled }) => (
    <div style={{ display: 'flex', gap: '3px' }}>
      {[1, 2, 3, 4, 5].map(v => (
        <button key={v} disabled={disabled} onClick={() => onPick(v)} style={{
          width: '26px', height: '24px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
          cursor: disabled ? 'default' : 'pointer',
          border: `1px solid ${Number(value) === v ? color : t.inputBorder}`,
          background: Number(value) >= v && value ? color : 'transparent',
          color: Number(value) >= v && value ? '#fff' : t.subtle,
          opacity: disabled ? 0.5 : 1,
        }}>{v}</button>
      ))}
    </div>
  )

  // ── Matriz SVG ──
  function Matrix() {
    const S = isMobile ? 300 : 380
    const M = 42                    // margem p/ eixos
    const plot = S - M - 14
    const px = (v) => M + ((v - 1) / 4) * plot
    const py = (v) => (S - M) - ((v - 1) / 4) * plot
    const thX = px(threshold), thY = py(threshold)
    // agrupa pontos sobrepostos para os afastar ligeiramente
    const seen = {}
    const pts = entries.filter(({ e }) => e.applicable && e.stakeholder && e.company).map(({ topic, e }) => {
      const k = `${e.company}-${e.stakeholder}`
      const n = (seen[k] = (seen[k] || 0) + 1) - 1
      const ang = n * 2.4
      const off = n === 0 ? 0 : 9 + Math.floor(n / 6) * 8
      return { topic, e, x: px(Number(e.company)) + Math.cos(ang) * off, y: py(Number(e.stakeholder)) + Math.sin(ang) * off }
    })
    const grid = t.rowBorder || t.cardBorder
    return (
      <svg viewBox={`0 0 ${S} ${S + 16}`} style={{ width: '100%', maxWidth: `${S}px`, display: 'block' }}>
        {/* zona material (quadrante superior direito) */}
        <rect x={thX} y={14} width={(S - 14) - thX} height={thY - 14} fill={t.accent} opacity="0.13" />
        <text x={S - 18} y={28} textAnchor="end" fontSize="10" fontWeight="800" fill={t.accent} style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>{L.materialZone}</text>
        {/* grelha */}
        {[1, 2, 3, 4, 5].map(v => (
          <g key={v}>
            <line x1={px(v)} y1={14} x2={px(v)} y2={S - M} stroke={grid} strokeWidth="1" />
            <line x1={M} y1={py(v)} x2={S - 14} y2={py(v)} stroke={grid} strokeWidth="1" />
            <text x={px(v)} y={S - M + 14} textAnchor="middle" fontSize="9" fill={t.subtle}>{v}</text>
            <text x={M - 8} y={py(v) + 3} textAnchor="end" fontSize="9" fill={t.subtle}>{v}</text>
          </g>
        ))}
        {/* limiar */}
        <line x1={thX} y1={14} x2={thX} y2={S - M} stroke={t.accent} strokeWidth="1.5" strokeDasharray="5 4" />
        <line x1={M} y1={thY} x2={S - 14} y2={thY} stroke={t.accent} strokeWidth="1.5" strokeDasharray="5 4" />
        {/* eixos */}
        <line x1={M} y1={S - M} x2={S - 14} y2={S - M} stroke={t.textMuted} strokeWidth="1.5" />
        <line x1={M} y1={14} x2={M} y2={S - M} stroke={t.textMuted} strokeWidth="1.5" />
        <text x={(M + S - 14) / 2} y={S + 8} textAnchor="middle" fontSize="10" fontWeight="600" fill={t.textMuted}>{L.axisX} →</text>
        <text x={12} y={(S - M + 14) / 2} textAnchor="middle" fontSize="10" fontWeight="600" fill={t.textMuted} transform={`rotate(-90 12 ${(S - M + 14) / 2})`}>{L.axisY} →</text>
        {/* pontos */}
        {pts.map(({ topic, x, y, e }) => {
          const meta = TOPIC_PILLAR_META[topic.pillar]
          const mat = isMaterial(e, threshold)
          return (
            <g key={topic.key}>
              <title>{topicLabel(topic, lang)} · {L.company} {e.company} · {L.stakeholder} {e.stakeholder}</title>
              <circle cx={x} cy={y} r={mat ? 10 : 8} fill={meta.color} opacity={mat ? 0.95 : 0.72} stroke={mat ? t.accent : 'none'} strokeWidth={mat ? 2 : 0} />
              <text x={x} y={y + 3} textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#fff">{topic.abbr}</text>
            </g>
          )
        })}
      </svg>
    )
  }

  if (loading) return <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.loading}</div>

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody, maxWidth: '1020px' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div>
          <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accent }}>{L.eyebrow}</div>
          <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '27px' : '34px', lineHeight: 1.05, letterSpacing: '-.5px', color: t.heading }}>{L.title}</h1>
          <p style={{ fontSize: '12.5px', color: t.textMuted, margin: '8px 0 0', maxWidth: '560px', lineHeight: 1.5 }}>{L.subtitle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {msg && <span style={{ fontSize: '12px', fontWeight: 700, color: msg === L.saved ? '#0a7a3e' : t.neg }}>{msg}</span>}
          <span style={{ fontSize: '11.5px', color: t.subtle }}>{L.scored}: <strong style={{ color: t.heading }}>{scoredCount}/{ESG_TOPICS.length}</strong></span>
          {!isViewing && <button onClick={() => save()} disabled={saving} style={{ padding: '10px 20px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: saving ? 'wait' : 'pointer' }}>{saving ? L.saving : L.save}</button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 420px', gap: '18px', alignItems: 'start' }}>
        {/* ── Pontuação por tema ── */}
        <div>
          {['E', 'S', 'G'].map(p => {
            const meta = TOPIC_PILLAR_META[p]
            return (
              <div key={p} style={{ ...card, padding: '16px 18px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '12px' }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: meta.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>{p}</span>
                  <span style={{ fontFamily: t.fontDisplay, fontSize: '17px', fontWeight: 600, color: t.heading }}>{meta[lang] || meta.pt}</span>
                </div>
                {ESG_TOPICS.filter(tp => tp.pillar === p).map(tp => {
                  const e = topics[tp.key] || {}
                  const on = !!e.applicable
                  return (
                    <div key={tp.key} style={{ padding: '10px 0', borderTop: `1px solid ${t.rowBorder || t.cardBorder}` }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: isViewing ? 'default' : 'pointer', flex: 1, minWidth: '190px' }}>
                          <input type="checkbox" checked={on} disabled={isViewing} onChange={() => patch(tp.key, { applicable: !on })} style={{ marginTop: '3px', accentColor: meta.color }} />
                          <span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: on ? t.heading : t.subtle }}>{topicLabel(tp, lang)}</span>
                            <span style={{ display: 'block', fontSize: '11px', color: t.subtle, marginTop: '1px' }}>{topicHint(tp, lang)}</span>
                          </span>
                        </label>
                        {on && (
                          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ fontSize: '9.5px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '3px' }}>{L.stakeholder}</div>
                              <ScoreRow value={e.stakeholder} color={meta.color} disabled={isViewing} onPick={v => patch(tp.key, { stakeholder: v })} />
                            </div>
                            <div>
                              <div style={{ fontSize: '9.5px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '3px' }}>{L.company}</div>
                              <ScoreRow value={e.company} color={meta.color} disabled={isViewing} onPick={v => patch(tp.key, { company: v })} />
                            </div>
                          </div>
                        )}
                      </div>
                      {on && (
                        <input value={e.note || ''} disabled={isViewing} onChange={ev => patch(tp.key, { note: ev.target.value })} placeholder={L.note} style={{ ...inputStyle, marginTop: '8px', fontSize: '11.5px' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        {/* ── Matriz + temas materiais ── */}
        <div style={{ position: isMobile ? 'static' : 'sticky', top: '20px' }}>
          <div style={{ ...card, padding: '16px 18px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontFamily: t.fontDisplay, fontSize: '17px', fontWeight: 600, color: t.heading }}>{L.matrix}</span>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: t.textMuted, fontWeight: 600 }}>
                {L.thresholdL}
                <select value={threshold} disabled={isViewing} onChange={e => { const th = Number(e.target.value); setThreshold(th); save(topics, th) }} style={{ ...inputStyle, width: 'auto', padding: '4px 7px', cursor: 'pointer' }}>
                  {[2.5, 3, 3.5, 4].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
            </div>
            <Matrix />
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
              {['E', 'S', 'G'].map(p => (
                <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: t.textMuted }}>
                  <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: TOPIC_PILLAR_META[p].color }} />
                  {TOPIC_PILLAR_META[p][lang] || TOPIC_PILLAR_META[p].pt}
                </span>
              ))}
              <span style={{ fontSize: '10.5px', color: t.subtle }}>{L.legendHint}</span>
            </div>
          </div>

          {/* Temas materiais + metas */}
          <div style={{ ...card, padding: '16px 18px' }}>
            <div style={{ fontFamily: t.fontDisplay, fontSize: '17px', fontWeight: 600, color: t.heading, marginBottom: '10px' }}>⭐ {L.materialList} ({material.length})</div>
            {material.length === 0 && <div style={{ fontSize: '12px', color: t.subtle }}>{L.noMaterial}</div>}
            {material.map(({ topic, e }) => {
              const meta = TOPIC_PILLAR_META[topic.pillar]
              const hasGoal = !!(e.goal && (e.goal.target || e.goal.how))
              return (
                <div key={topic.key} style={{ padding: '10px 0', borderTop: `1px solid ${t.rowBorder || t.cardBorder}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '5px', background: meta.color, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 800, flex: 'none' }}>{topic.abbr}</span>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: t.heading, flex: 1, minWidth: '110px' }}>{topicLabel(topic, lang)}</span>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: t.subtle }}>{e.company}×{e.stakeholder}</span>
                    {!isViewing && (
                      <button onClick={() => openGoal(topic.key)} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer', border: `1px solid ${hasGoal ? meta.color : t.cardBorder}`, background: hasGoal ? meta.bg : 'transparent', color: hasGoal ? meta.color : t.textMuted }}>
                        🎯 {hasGoal ? L.goalEdit : L.goal}
                      </button>
                    )}
                  </div>
                  {hasGoal && goalOpen !== topic.key && (
                    <div style={{ fontSize: '11px', color: t.text, marginTop: '6px', lineHeight: 1.5, background: t.softCardBg, borderRadius: '8px', padding: '7px 10px' }}>
                      {e.goal.baseline && <span>{L.baseline}: <strong>{e.goal.baseline}</strong> · </span>}
                      {e.goal.target && <span>{L.target}: <strong>{e.goal.target}</strong></span>}
                      {e.goal.deadline && <span> · {L.deadline}: <strong>{e.goal.deadline}</strong></span>}
                      {e.goal.how && <span style={{ display: 'block', color: t.textMuted }}>→ {e.goal.how}</span>}
                    </div>
                  )}
                  {goalOpen === topic.key && !isViewing && (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '7px', background: t.softCardBg, borderRadius: '10px', padding: '10px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7px' }}>
                        <input value={goalForm.baseline} onChange={e2 => setGoalForm(f => ({ ...f, baseline: e2.target.value }))} placeholder={L.baseline} style={inputStyle} />
                        <input value={goalForm.target} onChange={e2 => setGoalForm(f => ({ ...f, target: e2.target.value }))} placeholder={L.target} style={inputStyle} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '7px' }}>
                        <input type="month" value={goalForm.deadline} onChange={e2 => setGoalForm(f => ({ ...f, deadline: e2.target.value }))} style={inputStyle} />
                        <input value={goalForm.how} onChange={e2 => setGoalForm(f => ({ ...f, how: e2.target.value }))} placeholder={L.how} style={inputStyle} />
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => saveGoal(topic.key)} style={{ flex: 1, padding: '7px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '11.5px', cursor: 'pointer' }}>{L.saveGoal}</button>
                        {hasGoal && <button onClick={() => removeGoal(topic.key)} style={{ padding: '7px 11px', background: 'transparent', border: `1px solid ${t.cardBorder}`, borderRadius: '8px', fontWeight: 600, fontSize: '11.5px', cursor: 'pointer', color: t.neg }}>{L.removeGoal}</button>}
                        <button onClick={() => setGoalOpen(null)} style={{ padding: '7px 10px', background: t.segBg, border: `1px solid ${t.segBorder}`, borderRadius: '8px', fontWeight: 600, fontSize: '11.5px', cursor: 'pointer', color: t.textMuted }}>✕</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
