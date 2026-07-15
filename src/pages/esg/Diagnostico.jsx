import { useState, useEffect, useCallback } from 'react'
import { useLang } from '../../context/LangContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { ESG_PILLARS, ESG_QUESTIONS, ESG_TOTAL, questionsByPillar } from '../../data/esgQuestions'

export default function Diagnostico() {
  const { lang } = useLang()
  const { user } = useAuth()
  const { t } = useTheme()
  const isMobile = useIsMobile()

  const [answers, setAnswers] = useState({})
  const [year, setYear] = useState(2023)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [pillar, setPillar] = useState('E')

  const L = lang === 'de' ? {
    eyebrow: 'ESG-Diagnose', title: 'Nachhaltigkeits-Fragebogen',
    subtitle: 'Creditreform „Advanced" 2023 · ausgerichtet an ESRS/EFRAG. 28 Fragen (10 Umwelt, 7 Soziales, 11 Unternehmensführung).',
    refYear: 'Bezugsjahr', progress: 'Beantwortet', save: 'Speichern', saving: 'Wird gespeichert…',
    saved: 'Gespeichert ✓', saveErr: 'Speichern fehlgeschlagen (Migration 012 nötig).', loading: 'Wird geladen…',
    yes: 'Ja', no: 'Nein', planned: 'Geplant', unit: 'Einheit',
    cantAnswer: 'Ich kann nicht antworten', naUnavailable: 'Informationen derzeit nicht verfügbar',
    naUnclear: 'Frage ist nicht klar',
    disclaimer: 'Vorausgefüllte Werte können von der Plattform stammen. Alle Angaben dienen der Vorbereitung des ESG-Ratings.',
  } : lang === 'en' ? {
    eyebrow: 'ESG Assessment', title: 'Sustainability Questionnaire',
    subtitle: 'Creditreform "Advanced" 2023 · aligned with ESRS/EFRAG. 28 questions (10 Environment, 7 Social, 11 Governance).',
    refYear: 'Reference year', progress: 'Answered', save: 'Save', saving: 'Saving…',
    saved: 'Saved ✓', saveErr: 'Save failed (migration 012 required).', loading: 'Loading…',
    yes: 'Yes', no: 'No', planned: 'Planned', unit: 'Unit',
    cantAnswer: 'I cannot answer', naUnavailable: 'Information currently unavailable',
    naUnclear: 'The question is not clear',
    disclaimer: 'Pre-filled values may come from the platform. All data serves to prepare the ESG rating.',
  } : {
    eyebrow: 'Diagnóstico ESG', title: 'Questionário de Sustentabilidade',
    subtitle: 'Creditreform "Advanced" 2023 · alinhado ao ESRS/EFRAG. 28 perguntas (10 Ambiente, 7 Social, 11 Governança).',
    refYear: 'Ano de referência', progress: 'Respondidas', save: 'Guardar', saving: 'A guardar…',
    saved: 'Guardado ✓', saveErr: 'Falha ao guardar (é necessária a migração 012).', loading: 'A carregar…',
    yes: 'Sim', no: 'Não', planned: 'Planeado', unit: 'Unidade',
    cantAnswer: 'Não consigo responder', naUnavailable: 'Informação indisponível de momento',
    naUnclear: 'A pergunta não está clara',
    disclaimer: 'Valores pré-preenchidos podem ter origem na plataforma. Todos os dados servem para preparar o rating ESG.',
  }

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('esg_diagnostics').select('answers, reference_year').maybeSingle()
    if (data) { setAnswers(data.answers || {}); if (data.reference_year) setYear(data.reference_year) }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  // ── Escritas no estado ──
  const setSimple = (qId, patch) => setAnswers(p => ({ ...p, [qId]: { ...(p[qId] || {}), ...patch } }))
  const setField = (qId, fKey, patch) => setAnswers(p => {
    const cur = p[qId] || {}
    const fields = { ...(cur.fields || {}) }
    fields[fKey] = { ...(fields[fKey] || {}), ...patch }
    return { ...p, [qId]: { ...cur, fields } }
  })
  const toggleNa = (qId, val) => setAnswers(p => ({ ...p, [qId]: { ...(p[qId] || {}), na: p[qId]?.na === val ? null : val } }))

  // ── Progresso ──
  const isAnswered = (q) => {
    const a = answers[q.id]; if (!a) return false
    if (a.na) return true
    if (q.type === 'group') return q.fields.some(f => { const v = a.fields?.[f.key]?.value; return v !== undefined && v !== '' })
    return a.value !== undefined && a.value !== '' && a.value !== null
  }
  const answeredTotal = ESG_QUESTIONS.filter(isAnswered).length
  const answeredIn = (key) => questionsByPillar(key).filter(isAnswered).length

  async function save() {
    if (!user) return
    setSaving(true); setMsg('')
    const { error } = await supabase.from('esg_diagnostics').upsert(
      { user_id: user.id, reference_year: Number(year), answers, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    setSaving(false)
    setMsg(error ? L.saveErr : L.saved)
    setTimeout(() => setMsg(''), 2600)
  }

  // ── Estilos ──
  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px' }
  const inputStyle = { padding: '9px 11px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '14px', fontWeight: 600, outline: 'none', width: '130px', boxSizing: 'border-box' }
  const selStyle = { ...inputStyle, width: 'auto', cursor: 'pointer', fontWeight: 500 }
  const activePillarObj = ESG_PILLARS.find(p => p.key === pillar)

  // Botão Sim/Não/Planeado
  const ChoiceBtn = ({ active, color, children, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '8px 18px', borderRadius: '9px', fontSize: '13px', fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
      border: `1px solid ${active ? color : t.inputBorder}`, background: active ? color : 'transparent',
      color: active ? '#fff' : t.textMuted, opacity: disabled ? 0.45 : 1,
    }}>{children}</button>
  )

  // Renderiza o input de valor de uma pergunta simples ou de um subcampo de grupo
  function ValueInput({ spec, cur, onValue, onUnit, disabled }) {
    if (spec.type === 'boolean' || spec.type === 'boolean3') {
      const opts = spec.type === 'boolean3' ? [['yes', L.yes], ['no', L.no], ['planned', L.planned]] : [['yes', L.yes], ['no', L.no]]
      const color = activePillarObj.color
      return (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {opts.map(([v, lbl]) => <ChoiceBtn key={v} active={cur.value === v} color={color} disabled={disabled} onClick={() => onValue(cur.value === v ? '' : v)}>{lbl}</ChoiceBtn>)}
        </div>
      )
    }
    if (spec.type === 'percent') {
      return (
        <div style={{ position: 'relative', width: '130px' }}>
          <input type="number" step="0.01" value={cur.value ?? ''} disabled={disabled} onChange={e => onValue(e.target.value)} placeholder="0" style={{ ...inputStyle, width: '100%', paddingRight: '28px', opacity: disabled ? 0.45 : 1 }} />
          <span style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: t.subtle }}>%</span>
        </div>
      )
    }
    // number (com unidade opcional)
    const units = spec.units || []
    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <input type="number" step="any" value={cur.value ?? ''} disabled={disabled} onChange={e => onValue(e.target.value)} placeholder="0" style={{ ...inputStyle, opacity: disabled ? 0.45 : 1 }} />
        {units.length === 1 && <span style={{ fontSize: '13px', color: t.textMuted, fontWeight: 600 }}>{units[0]}</span>}
        {units.length > 1 && (
          <select value={cur.unit ?? units[0]} disabled={disabled} onChange={e => onUnit(e.target.value)} style={{ ...selStyle, opacity: disabled ? 0.45 : 1 }}>
            {units.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        )}
      </div>
    )
  }

  function QuestionCard({ q }) {
    const a = answers[q.id] || {}
    const na = a.na || null
    const disabled = !!na
    const primary = q[lang] || q.pt
    const secondary = lang === 'de' ? q.pt : q.de
    let lastSub = null
    return (
      <div style={{ ...card, padding: '18px 20px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', gap: '13px' }}>
          <span style={{ width: '26px', height: '26px', flex: 'none', borderRadius: '50%', background: activePillarObj.bg, color: activePillarObj.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>{q.id}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: t.heading, lineHeight: 1.45 }}>{primary}</div>
            <div style={{ fontSize: '11.5px', color: t.subtle, marginTop: '3px', lineHeight: 1.4 }}>{secondary}</div>

            {/* Resposta */}
            <div style={{ marginTop: '14px', opacity: disabled ? 0.55 : 1 }}>
              {q.type === 'group' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {q.fields.map(f => {
                    const showSub = f.sub && f.sub !== lastSub; lastSub = f.sub || lastSub
                    const fcur = a.fields?.[f.key] || {}
                    return (
                      <div key={f.key}>
                        {showSub && <div style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: activePillarObj.color, margin: '6px 0 4px' }}>{f.sub}</div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '12.5px', color: t.text }}>{f.pt}</span>
                          <ValueInput spec={f} cur={fcur} disabled={disabled}
                            onValue={v => setField(q.id, f.key, { value: v })}
                            onUnit={u => setField(q.id, f.key, { unit: u })} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <ValueInput spec={q} cur={a} disabled={disabled}
                  onValue={v => setSimple(q.id, { value: v })}
                  onUnit={u => setSimple(q.id, { unit: u })} />
              )}
            </div>

            {/* Não consigo responder */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
              <span style={{ fontSize: '11px', color: t.subtle, alignSelf: 'center' }}>{L.cantAnswer}:</span>
              {[['unavailable', L.naUnavailable], ['unclear', L.naUnclear]].map(([v, lbl]) => (
                <button key={v} onClick={() => toggleNa(q.id, v)} style={{
                  padding: '4px 10px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${na === v ? t.neg : t.inputBorder}`,
                  background: na === v ? (t.dueLate?.bg || '#fee2e2') : 'transparent',
                  color: na === v ? (t.dueLate?.ink || '#991b1b') : t.textMuted,
                }}>{lbl}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) return <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.loading}</div>

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody, maxWidth: '860px' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accent }}>{L.eyebrow}</div>
          <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '27px' : '34px', lineHeight: 1.05, letterSpacing: '-.5px', color: t.heading }}>{L.title}</h1>
          <p style={{ fontSize: '12.5px', color: t.textMuted, margin: '8px 0 0', maxWidth: '560px', lineHeight: 1.5 }}>{L.subtitle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '5px' }}>{L.refYear}</div>
            <input type="number" value={year} onChange={e => setYear(e.target.value)} style={{ ...inputStyle, width: '92px' }} />
          </div>
          <button onClick={save} disabled={saving} style={{ padding: '10px 20px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: saving ? 'wait' : 'pointer' }}>{saving ? L.saving : L.save}</button>
        </div>
      </div>

      {/* Progresso global */}
      <div style={{ ...card, padding: '14px 18px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '9px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: t.text }}>{L.progress}</span>
          <span style={{ fontSize: '13px', fontWeight: 800, color: t.accent }}>{answeredTotal} / {ESG_TOTAL}</span>
        </div>
        <div style={{ height: '8px', borderRadius: '20px', background: t.softCardBg, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(answeredTotal / ESG_TOTAL) * 100}%`, background: t.accent, transition: 'width .3s' }} />
        </div>
        {msg && <div style={{ fontSize: '11.5px', fontWeight: 700, color: msg === L.saved ? '#0a7a3e' : t.neg, marginTop: '9px' }}>{msg}</div>}
      </div>

      {/* Abas por pilar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {ESG_PILLARS.map(p => {
          const active = p.key === pillar
          return (
            <button key={p.key} onClick={() => setPillar(p.key)} style={{
              display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 15px', borderRadius: '10px', cursor: 'pointer',
              border: `1px solid ${active ? p.color : t.cardBorder}`, background: active ? p.bg : t.cardBg,
            }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: p.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>{p.letter}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: active ? p.color : t.textMuted }}>{p[lang] || p.pt}</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: t.subtle }}>{answeredIn(p.key)}/{questionsByPillar(p.key).length}</span>
            </button>
          )
        })}
      </div>

      {/* Intro do pilar */}
      <div style={{ background: activePillarObj.bg, borderRadius: '12px', padding: '13px 16px', marginBottom: '16px', fontSize: '12.5px', color: t.text, lineHeight: 1.5 }}>
        {lang === 'de' ? activePillarObj.introDe : lang === 'en' ? activePillarObj.introEn : activePillarObj.introPt}
      </div>

      {/* Perguntas do pilar ativo */}
      {questionsByPillar(pillar).map(q => <QuestionCard key={q.id} q={q} />)}

      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '14px', fontSize: '11.5px', color: t.subtle }}>
        <span>ⓘ</span><span>{L.disclaimer}</span>
      </div>
    </div>
  )
}
