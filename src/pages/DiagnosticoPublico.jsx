import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Brand tokens ────────────────────────────────────────────────────────────
const GREEN      = '#0a2f1a'
const GREEN_MID  = '#164e2b'
const GREEN_LIGHT= '#e8f5ec'
const GOLD       = '#c9a84c'
const BG         = '#f2f6f3'

// ─── LC Logo (matches Sidebar) ───────────────────────────────────────────────
function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="18" fill={GREEN} />
      <path d="M10 10 L10 26 L18 26" stroke={GOLD} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M20 18 A7 7 0 1 1 20 18.001" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

// ─── Questions per pillar ─────────────────────────────────────────────────────
const QUESTIONS = {
  E: [
    {
      id: 'e1',
      text: 'A sua empresa monitoriza as emissões de CO₂ e gases de efeito estufa (Âmbito 1 e 2)?',
      hint: 'Âmbito 1: emissões diretas (combustão, frota). Âmbito 2: energia elétrica consumida.',
      type: 'scale',
    },
    {
      id: 'e2',
      text: 'Existem iniciativas formais para reduzir o consumo de energia, água ou geração de resíduos?',
      hint: 'Ex.: política de papel zero, equipamentos de baixo consumo, separação de resíduos.',
      type: 'yn',
    },
    {
      id: 'e3',
      text: 'A empresa avalia o impacto ambiental da sua cadeia de fornecedores (Âmbito 3)?',
      hint: 'Âmbito 3 inclui emissões indiretas: compras, deslocações de colaboradores, logística.',
      type: 'yn',
    },
    {
      id: 'e4',
      text: 'Existem metas ambientais documentadas com prazos e responsáveis definidos?',
      hint: 'Ex.: reduzir emissões 30% até 2030, neutralidade carbónica até 2035.',
      type: 'yn',
    },
  ],
  S: [
    {
      id: 's1',
      text: 'A empresa possui políticas formais de diversidade, equidade e inclusão (DEI)?',
      hint: 'Ex.: política de igualdade salarial, recrutamento inclusivo, diversidade no leadership.',
      type: 'yn',
    },
    {
      id: 's2',
      text: 'Como avalia o bem-estar e satisfação dos colaboradores na sua empresa?',
      hint: 'Considera saúde mental, horários flexíveis, formação contínua e ambiente de trabalho.',
      type: 'scale',
    },
    {
      id: 's3',
      text: 'A empresa tem programas de impacto social ou envolvimento com a comunidade local?',
      hint: 'Ex.: voluntariado corporativo, parcerias com ONGs, apoio a causas sociais.',
      type: 'yn',
    },
    {
      id: 's4',
      text: 'Existe um mecanismo formal para recolha e resposta a feedback de clientes e colaboradores?',
      hint: 'Ex.: inquéritos de satisfação, canais de denúncia, reuniões de feedback estruturadas.',
      type: 'yn',
    },
  ],
  G: [
    {
      id: 'g1',
      text: 'A empresa dispõe de um código de ética ou conduta formalmente documentado?',
      hint: 'Deve cobrir conflitos de interesse, anticorrupção, proteção de dados e whistleblowing.',
      type: 'yn',
    },
    {
      id: 'g2',
      text: 'Qual é o nível de transparência nos relatórios financeiros e de gestão?',
      hint: 'Considera relatórios auditados, divulgação a stakeholders e cumprimento de normas.',
      type: 'scale',
    },
    {
      id: 'g3',
      text: 'Existem controlos internos para prevenção de fraude e gestão de riscos?',
      hint: 'Ex.: segregação de funções, auditorias internas, mapeamento de riscos operacionais.',
      type: 'yn',
    },
    {
      id: 'g4',
      text: 'A liderança da empresa tem formação ou acompanhamento especializado em ESG?',
      hint: 'Ex.: consultoria ESG contratada, formações certificadas, reporte a framework (GRI, ESRS).',
      type: 'yn',
    },
  ],
}

const SECTORS = [
  'Indústria / Manufatura',
  'Construção e Imobiliário',
  'Comércio a Retalho',
  'Serviços Profissionais',
  'Tecnologia / Software',
  'Saúde e Farmácia',
  'Transportes e Logística',
  'Agricultura e Alimentação',
  'Energia e Ambiente',
  'Outro',
]

const SIZES = [
  { value: 'micro', label: 'Micro (< 10 colaboradores)' },
  { value: 'pequena', label: 'Pequena (10–49 colaboradores)' },
  { value: 'media', label: 'Média (50–249 colaboradores)' },
  { value: 'grande', label: 'Grande (≥ 250 colaboradores)' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function scoreAnswers(answers) {
  let total = 0
  let max = 0
  Object.entries(answers).forEach(([key, val]) => {
    if (key === 'company' || key === 'email') return
    if (typeof val === 'number') { total += val; max += 5 }         // scale 1-5
    else if (val === 'sim')      { total += 5; max += 5 }
    else if (val === 'parcial')  { total += 2.5; max += 5 }
    else if (val === 'nao')      { total += 0; max += 5 }
  })
  return max > 0 ? Math.round((total / max) * 100) : 0
}

function pillarScore(answers, pillar) {
  const qs = QUESTIONS[pillar]
  let t = 0, m = 0
  qs.forEach(q => {
    const v = answers[q.id]
    if (v === undefined) return
    if (typeof v === 'number') { t += v; m += 5 }
    else if (v === 'sim')   { t += 5; m += 5 }
    else if (v === 'parcial'){ t += 2.5; m += 5 }
    else if (v === 'nao')   { t += 0; m += 5 }
  })
  return m > 0 ? Math.round((t / m) * 100) : 0
}

function getLevel(score) {
  if (score >= 75) return { label: 'Avançado', color: '#16a34a', bg: '#dcfce7' }
  if (score >= 50) return { label: 'Em Desenvolvimento', color: '#d97706', bg: '#fef3c7' }
  if (score >= 25) return { label: 'Inicial', color: '#ea580c', bg: '#ffedd5' }
  return { label: 'Crítico', color: '#dc2626', bg: '#fee2e2' }
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ProgressBar({ step, total }) {
  const pct = Math.round(((step) / total) * 100)
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: '#64748b' }}>Passo {step} de {total}</span>
        <span style={{ fontSize: 13, color: GREEN, fontWeight: 600 }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99 }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${GREEN}, ${GREEN_MID})`,
          borderRadius: 99,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  )
}

function ScaleQuestion({ id, text, hint, value, onChange }) {
  const labels = ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre']
  return (
    <div style={{ marginBottom: 32 }}>
      <p style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 4, lineHeight: 1.5 }}>{text}</p>
      {hint && <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>{hint}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => onChange(id, n)}
            style={{
              flex: 1,
              padding: '14px 4px 10px',
              borderRadius: 10,
              border: value === n ? `2px solid ${GREEN}` : '2px solid #e2e8f0',
              background: value === n ? GREEN_LIGHT : '#fff',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 700, color: value === n ? GREEN : '#94a3b8' }}>{n}</span>
            <span style={{ fontSize: 10, color: value === n ? GREEN : '#94a3b8', textAlign: 'center', lineHeight: 1.2 }}>{labels[n-1]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function YNQuestion({ id, text, hint, value, onChange }) {
  const opts = [
    { value: 'sim', label: 'Sim', icon: '✓' },
    { value: 'parcial', label: 'Parcialmente', icon: '~' },
    { value: 'nao', label: 'Não', icon: '✗' },
  ]
  const colors = { sim: GREEN, parcial: '#d97706', nao: '#dc2626' }
  return (
    <div style={{ marginBottom: 32 }}>
      <p style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 4, lineHeight: 1.5 }}>{text}</p>
      {hint && <p style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>{hint}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        {opts.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(id, opt.value)}
            style={{
              flex: 1,
              padding: '14px 8px',
              borderRadius: 10,
              border: value === opt.value ? `2px solid ${colors[opt.value]}` : '2px solid #e2e8f0',
              background: value === opt.value ? (opt.value === 'sim' ? GREEN_LIGHT : opt.value === 'parcial' ? '#fef3c7' : '#fee2e2') : '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              fontWeight: 600,
              fontSize: 14,
              color: value === opt.value ? colors[opt.value] : '#94a3b8',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 16 }}>{opt.icon}</span>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function PillarBar({ label, score, color }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{score}%</span>
      </div>
      <div style={{ height: 8, background: '#e2e8f0', borderRadius: 99 }}>
        <div style={{
          height: '100%',
          width: `${score}%`,
          background: color,
          borderRadius: 99,
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DiagnosticoPublico() {
  const navigate = useNavigate()
  const TOTAL_STEPS = 6  // 1=intro, 2=company, 3=E, 4=S, 5=G, 6=result

  const [step, setStep] = useState(1)
  const [answers, setAnswers] = useState({})
  const [emailSent, setEmailSent] = useState(false)
  const [emailVal, setEmailVal] = useState('')
  const [nameVal, setNameVal] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const company = answers.company || {}

  function setAnswer(id, val) {
    setAnswers(prev => ({ ...prev, [id]: val }))
  }
  function setCompany(field, val) {
    setAnswers(prev => ({ ...prev, company: { ...prev.company, [field]: val } }))
  }

  function canAdvance() {
    if (step === 2) {
      return company.name && company.sector && company.size
    }
    if (step === 3) {
      return QUESTIONS.E.every(q => answers[q.id] !== undefined)
    }
    if (step === 4) {
      return QUESTIONS.S.every(q => answers[q.id] !== undefined)
    }
    if (step === 5) {
      return QUESTIONS.G.every(q => answers[q.id] !== undefined)
    }
    return true
  }

  function handleNext() {
    if (!canAdvance()) return
    if (step === 5) setStep(6)
    else setStep(s => s + 1)
  }

  function handleSubmitLead(e) {
    e.preventDefault()
    // In production: POST to CRM / email service
    setSubmitted(true)
  }

  const score = scoreAnswers(answers)
  const eScore = pillarScore(answers, 'E')
  const sScore = pillarScore(answers, 'S')
  const gScore = pillarScore(answers, 'G')
  const level = getLevel(score)

  // ── Layout wrapper ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* Navbar */}
      <nav style={{
        background: GREEN,
        padding: '0 32px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <button
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <Logo size={32} />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: '0.01em' }}>
            LC Office <span style={{ color: GOLD }}>Consulting</span>
          </span>
        </button>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
          Diagnóstico ESG Gratuito
        </span>
      </nav>

      {/* Card */}
      <div style={{
        maxWidth: 660,
        margin: '48px auto',
        padding: '0 16px 80px',
      }}>

        {/* ── STEP 1: Intro ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '48px 40px',
            boxShadow: '0 4px 24px rgba(10,47,26,0.08)',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: GREEN_LIGHT,
              color: GREEN,
              borderRadius: 99,
              padding: '4px 14px',
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 24,
              letterSpacing: '0.05em',
            }}>
              ✦ GRATUITO · SEM COMPROMISSO
            </div>

            <h1 style={{ fontSize: 28, fontWeight: 800, color: GREEN, lineHeight: 1.25, marginBottom: 16 }}>
              Diagnóstico ESG da sua Empresa
            </h1>
            <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.7, marginBottom: 32 }}>
              Responda a <strong>12 perguntas</strong> sobre as práticas Ambientais, Sociais e de Governação da sua empresa e receba uma análise do seu nível ESG atual — em menos de <strong>5 minutos</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
              {[
                { icon: '🌿', text: 'Ambiental — Emissões, energia e cadeia de valor' },
                { icon: '🤝', text: 'Social — Pessoas, diversidade e comunidade' },
                { icon: '⚖️', text: 'Governação — Ética, transparência e controlos' },
              ].map(item => (
                <div key={item.text} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: GREEN_LIGHT, borderRadius: 10, padding: '12px 16px',
                }}>
                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                  <span style={{ fontSize: 14, color: GREEN, fontWeight: 500 }}>{item.text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              style={{
                width: '100%',
                padding: '16px',
                background: GREEN,
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.02em',
              }}
            >
              Iniciar Diagnóstico →
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 16 }}>
              Os seus dados são confidenciais e nunca partilhados sem consentimento.
            </p>
          </div>
        )}

        {/* ── STEP 2: Company Info ──────────────────────────────────────── */}
        {step === 2 && (
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '40px',
            boxShadow: '0 4px 24px rgba(10,47,26,0.08)',
          }}>
            <ProgressBar step={1} total={5} />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: GREEN, marginBottom: 6 }}>
              Sobre a sua empresa
            </h2>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 32 }}>
              Ajuda-nos a contextualizar o diagnóstico.
            </p>

            {/* Company name */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Nome da empresa *
              </label>
              <input
                type="text"
                placeholder="Ex.: Empresa Lda."
                value={company.name || ''}
                onChange={e => setCompany('name', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 15,
                  outline: 'none',
                  boxSizing: 'border-box',
                  color: '#1e293b',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = GREEN}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Sector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Setor de atividade *
              </label>
              <select
                value={company.sector || ''}
                onChange={e => setCompany('sector', e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '2px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 15,
                  outline: 'none',
                  boxSizing: 'border-box',
                  color: company.sector ? '#1e293b' : '#94a3b8',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                <option value="">Selecione o setor…</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Size */}
            <div style={{ marginBottom: 36 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
                Dimensão da empresa *
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SIZES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setCompany('size', s.value)}
                    style={{
                      padding: '12px 16px',
                      border: company.size === s.value ? `2px solid ${GREEN}` : '2px solid #e2e8f0',
                      borderRadius: 10,
                      background: company.size === s.value ? GREEN_LIGHT : '#fff',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 500,
                      color: company.size === s.value ? GREEN : '#374151',
                      transition: 'all 0.15s',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <NavButtons
              onBack={() => setStep(1)}
              onNext={handleNext}
              canNext={canAdvance()}
            />
          </div>
        )}

        {/* ── STEP 3: Environmental ─────────────────────────────────────── */}
        {step === 3 && (
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '40px',
            boxShadow: '0 4px 24px rgba(10,47,26,0.08)',
          }}>
            <ProgressBar step={2} total={5} />
            <PillarHeader
              icon="🌿"
              label="Ambiental (E)"
              description="Avaliamos a sua pegada ecológica, gestão de emissões e metas ambientais."
              color="#16a34a"
            />
            {QUESTIONS.E.map(q =>
              q.type === 'scale'
                ? <ScaleQuestion key={q.id} {...q} value={answers[q.id]} onChange={setAnswer} />
                : <YNQuestion key={q.id} {...q} value={answers[q.id]} onChange={setAnswer} />
            )}
            <NavButtons onBack={() => setStep(2)} onNext={handleNext} canNext={canAdvance()} />
          </div>
        )}

        {/* ── STEP 4: Social ────────────────────────────────────────────── */}
        {step === 4 && (
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '40px',
            boxShadow: '0 4px 24px rgba(10,47,26,0.08)',
          }}>
            <ProgressBar step={3} total={5} />
            <PillarHeader
              icon="🤝"
              label="Social (S)"
              description="Analisamos o impacto da empresa nas pessoas: colaboradores, clientes e comunidade."
              color="#2563eb"
            />
            {QUESTIONS.S.map(q =>
              q.type === 'scale'
                ? <ScaleQuestion key={q.id} {...q} value={answers[q.id]} onChange={setAnswer} />
                : <YNQuestion key={q.id} {...q} value={answers[q.id]} onChange={setAnswer} />
            )}
            <NavButtons onBack={() => setStep(3)} onNext={handleNext} canNext={canAdvance()} />
          </div>
        )}

        {/* ── STEP 5: Governance ────────────────────────────────────────── */}
        {step === 5 && (
          <div style={{
            background: '#fff',
            borderRadius: 20,
            padding: '40px',
            boxShadow: '0 4px 24px rgba(10,47,26,0.08)',
          }}>
            <ProgressBar step={4} total={5} />
            <PillarHeader
              icon="⚖️"
              label="Governação (G)"
              description="Verificamos a solidez ética, a transparência e os mecanismos de controlo."
              color="#7c3aed"
            />
            {QUESTIONS.G.map(q =>
              q.type === 'scale'
                ? <ScaleQuestion key={q.id} {...q} value={answers[q.id]} onChange={setAnswer} />
                : <YNQuestion key={q.id} {...q} value={answers[q.id]} onChange={setAnswer} />
            )}
            <NavButtons onBack={() => setStep(4)} onNext={handleNext} canNext={canAdvance()} />
          </div>
        )}

        {/* ── STEP 6: Results ───────────────────────────────────────────── */}
        {step === 6 && (
          <div>
            {/* Score card */}
            <div style={{
              background: `linear-gradient(135deg, ${GREEN} 0%, ${GREEN_MID} 100%)`,
              borderRadius: 20,
              padding: '40px',
              color: '#fff',
              marginBottom: 20,
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(10,47,26,0.25)',
            }}>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 8, letterSpacing: '0.08em' }}>
                RESULTADO DO DIAGNÓSTICO
              </p>
              <p style={{ fontSize: 15, fontWeight: 600, color: GOLD, marginBottom: 24 }}>
                {company.name || 'A sua empresa'}
              </p>

              {/* Circular score */}
              <div style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                border: `6px solid ${GOLD}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                background: 'rgba(255,255,255,0.07)',
              }}>
                <span style={{ fontSize: 44, fontWeight: 800, lineHeight: 1 }}>{score}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>/ 100</span>
              </div>

              <span style={{
                display: 'inline-block',
                background: level.bg,
                color: level.color,
                borderRadius: 99,
                padding: '6px 18px',
                fontWeight: 700,
                fontSize: 15,
                marginBottom: 12,
              }}>
                {level.label}
              </span>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', maxWidth: 360, margin: '0 auto' }}>
                {score >= 75
                  ? 'A sua empresa demonstra práticas ESG consolidadas. Apoiamos na estruturação do relatório e comunicação a stakeholders.'
                  : score >= 50
                  ? 'Há práticas implementadas, mas com lacunas importantes. Um plano estruturado maximizará o impacto e reduzirá riscos.'
                  : score >= 25
                  ? 'A sua empresa está a dar os primeiros passos. Um diagnóstico aprofundado permite definir prioridades com impacto real.'
                  : 'Identificámos oportunidades significativas de melhoria. A intervenção agora reduz riscos regulatórios e de reputação.'}
              </p>
            </div>

            {/* Pillar breakdown */}
            <div style={{
              background: '#fff',
              borderRadius: 20,
              padding: '32px 40px',
              boxShadow: '0 4px 24px rgba(10,47,26,0.08)',
              marginBottom: 20,
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: GREEN, marginBottom: 24 }}>
                Resultados por Pilar
              </h3>
              <PillarBar label="🌿 Ambiental (E)" score={eScore} color="#16a34a" />
              <PillarBar label="🤝 Social (S)"     score={sScore} color="#2563eb" />
              <PillarBar label="⚖️ Governação (G)" score={gScore} color="#7c3aed" />
            </div>

            {/* Recommendations */}
            <div style={{
              background: '#fff',
              borderRadius: 20,
              padding: '32px 40px',
              boxShadow: '0 4px 24px rgba(10,47,26,0.08)',
              marginBottom: 20,
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: GREEN, marginBottom: 20 }}>
                Próximos Passos Recomendados
              </h3>
              {getRecommendations(eScore, sScore, gScore).map((rec, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 14, marginBottom: 16,
                  padding: '14px 16px',
                  background: rec.urgent ? '#fff7ed' : GREEN_LIGHT,
                  borderRadius: 10,
                  borderLeft: `4px solid ${rec.urgent ? '#f97316' : GREEN}`,
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{rec.icon}</span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 2 }}>{rec.title}</p>
                    <p style={{ fontSize: 13, color: '#64748b' }}>{rec.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Lead capture */}
            <div style={{
              background: '#fff',
              borderRadius: 20,
              padding: '32px 40px',
              boxShadow: '0 4px 24px rgba(10,47,26,0.08)',
              border: `2px solid ${GOLD}`,
            }}>
              {!submitted ? (
                <>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: GREEN, marginBottom: 8 }}>
                    Receba o Relatório Completo — Gratuitamente
                  </h3>
                  <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>
                    A Lúcia Cilio analisa pessoalmente os seus resultados e envia um relatório detalhado com recomendações específicas para a sua empresa, sem compromisso.
                  </p>

                  <form onSubmit={handleSubmitLead} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <input
                      type="text"
                      placeholder="O seu nome"
                      required
                      value={nameVal}
                      onChange={e => setNameVal(e.target.value)}
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = GREEN}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                    <input
                      type="email"
                      placeholder="O seu e-mail"
                      required
                      value={emailVal}
                      onChange={e => setEmailVal(e.target.value)}
                      style={inputStyle}
                      onFocus={e => e.target.style.borderColor = GREEN}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                    <button
                      type="submit"
                      style={{
                        padding: '15px',
                        background: GREEN,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: 'pointer',
                        letterSpacing: '0.02em',
                      }}
                    >
                      Receber Relatório Personalizado →
                    </button>
                    <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center' }}>
                      Os seus dados são confidenciais. Não partilhamos com terceiros.
                    </p>
                  </form>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: GREEN_LIGHT, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', margin: '0 auto 20px', fontSize: 28,
                  }}>✓</div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: GREEN, marginBottom: 10 }}>
                    Pedido recebido, {nameVal}!
                  </h3>
                  <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
                    A Lúcia entrará em contacto em breve com a análise personalizada dos seus resultados.
                    Fique atento ao e-mail <strong>{emailVal}</strong>.
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    style={{
                      marginTop: 24,
                      padding: '12px 28px',
                      background: 'none',
                      border: `2px solid ${GREEN}`,
                      borderRadius: 10,
                      color: GREEN,
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                    }}
                  >
                    ← Voltar ao início
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Shared nav buttons ───────────────────────────────────────────────────────
function NavButtons({ onBack, onNext, canNext }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
      <button
        onClick={onBack}
        style={{
          flex: 1,
          padding: '14px',
          background: 'none',
          border: '2px solid #e2e8f0',
          borderRadius: 10,
          fontSize: 15,
          fontWeight: 600,
          color: '#64748b',
          cursor: 'pointer',
        }}
      >
        ← Anterior
      </button>
      <button
        onClick={onNext}
        disabled={!canNext}
        style={{
          flex: 2,
          padding: '14px',
          background: canNext ? GREEN : '#e2e8f0',
          color: canNext ? '#fff' : '#94a3b8',
          border: 'none',
          borderRadius: 10,
          fontSize: 15,
          fontWeight: 700,
          cursor: canNext ? 'pointer' : 'not-allowed',
          transition: 'all 0.15s',
        }}
      >
        Continuar →
      </button>
    </div>
  )
}

// ─── Pillar header ────────────────────────────────────────────────────────────
function PillarHeader({ icon, label, description, color }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: `${color}15`, borderRadius: 99,
        padding: '4px 14px', marginBottom: 12,
      }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color, letterSpacing: '0.05em' }}>{label}</span>
      </div>
      <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{description}</p>
    </div>
  )
}

// ─── Input style ──────────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '2px solid #e2e8f0',
  borderRadius: 10,
  fontSize: 15,
  outline: 'none',
  boxSizing: 'border-box',
  color: '#1e293b',
  transition: 'border-color 0.15s',
}

// ─── Recommendations logic ────────────────────────────────────────────────────
function getRecommendations(e, s, g) {
  const recs = []

  if (e < 50) recs.push({
    icon: '🌿',
    title: 'Implementar rastreio de emissões (Âmbito 1 e 2)',
    text: 'O primeiro passo ESG é conhecer a pegada de carbono. Definimos os indicadores certos para o seu setor.',
    urgent: e < 25,
  })
  if (e >= 50 && e < 75) recs.push({
    icon: '🌱',
    title: 'Expandir para Âmbito 3 e definir metas de redução',
    text: 'Com base nos dados existentes, é possível estabelecer metas SMART alinhadas ao Acordo de Paris.',
    urgent: false,
  })
  if (s < 50) recs.push({
    icon: '🤝',
    title: 'Estruturar política de pessoas e DEI',
    text: 'Empresas com políticas sociais formais atraem mais talento e têm menor rotatividade.',
    urgent: s < 25,
  })
  if (g < 50) recs.push({
    icon: '⚖️',
    title: 'Documentar código de ética e controlos internos',
    text: 'A ausência de governação é o principal fator de risco para financiamento e parcerias B2B.',
    urgent: g < 25,
  })
  if (e >= 75 && s >= 75 && g >= 75) recs.push({
    icon: '📋',
    title: 'Elaborar Relatório ESG alinhado ao ESRS / GRI',
    text: 'O seu nível de maturidade permite avançar para reporte formal, exigido pela CSRD a partir de 2026.',
    urgent: false,
  })

  if (recs.length === 0) recs.push({
    icon: '✦',
    title: 'Agendar sessão de aprofundamento',
    text: 'Os seus resultados são positivos. Uma sessão de revisão garante que nenhuma área fica por explorar.',
    urgent: false,
  })

  return recs
}
