import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { supabase } from '../lib/supabase'

const G = '#0d3b20'
const GOLD = '#c9a84c'

const FlagPT = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" style={{ borderRadius: '2px' }}>
    <rect width="8" height="14" fill="#006600"/>
    <rect x="8" width="12" height="14" fill="#CC0000"/>
    <ellipse cx="8" cy="7" rx="2.8" ry="3.5" fill="#FFFF00" stroke="#006600" strokeWidth="0.4"/>
    <ellipse cx="8" cy="7" rx="1.6" ry="2.0" fill="#fff" stroke="#003399" strokeWidth="0.4"/>
  </svg>
)
const FlagDE = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" style={{ borderRadius: '2px' }}>
    <rect y="0" width="20" height="4.67" fill="#000"/>
    <rect y="4.67" width="20" height="4.67" fill="#CC0000"/>
    <rect y="9.33" width="20" height="4.67" fill="#FFCE00"/>
  </svg>
)

export default function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const { lang, setLang } = useLang()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const L = lang === 'de' ? {
    title: 'Anmelden',
    subtitle: 'Zugang zur Buchhaltungsplattform',
    email: 'E-Mail',
    password: 'Passwort',
    enter: 'Anmelden',
    entering: 'Wird angemeldet…',
    invalid: 'E-Mail oder Passwort ungültig.',
    generic: 'Anmeldung fehlgeschlagen. Bitte erneut versuchen.',
    contact: 'Noch kein Zugang? Kontaktieren Sie Lúcia Cílio.',
    show: 'Anzeigen', hide: 'Verbergen',
  } : {
    title: 'Entrar',
    subtitle: 'Acesso à plataforma de gestão contável',
    email: 'E-mail',
    password: 'Palavra-passe',
    enter: 'Entrar',
    entering: 'A entrar…',
    invalid: 'E-mail ou palavra-passe incorretos.',
    generic: 'Não foi possível entrar. Tente novamente.',
    contact: 'Ainda não tem acesso? Contacte a Lúcia Cílio.',
    show: 'Mostrar', hide: 'Ocultar',
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error } = await signIn(email.trim(), password)
    if (error) {
      setLoading(false)
      setError(error.message?.toLowerCase().includes('invalid') ? L.invalid : L.generic)
      return
    }
    // Redireciona consoante o role
    let role = 'user'
    try {
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      if (prof?.role) role = prof.role
    } catch { /* antes da migração 003 → trata como user */ }
    setLoading(false)
    navigate(role === 'admin' ? '/admin' : '/contabilidade/dashboard', { replace: true })
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: '10px',
    border: '1px solid #dde8de', fontSize: '14px', background: '#fff',
    outline: 'none', boxSizing: 'border-box', color: '#1a2e1a',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(135deg, ${G} 0%, #1a5c32 100%)`,
      fontFamily: "'Segoe UI', system-ui, sans-serif", padding: '20px', position: 'relative',
    }}>
      {/* Language toggle top-right */}
      <div style={{ position: 'absolute', top: '20px', right: '24px', display: 'flex', gap: '6px' }}>
        {[['pt', FlagPT, 'PT'], ['de', FlagDE, 'DE']].map(([code, Flag, label]) => (
          <button key={code} onClick={() => setLang(code)} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px',
            borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer',
            border: `1px solid ${lang === code ? GOLD : 'rgba(255,255,255,.25)'}`,
            background: lang === code ? GOLD : 'rgba(255,255,255,.08)',
            color: lang === code ? G : 'rgba(255,255,255,.85)',
          }}>
            <Flag /> {label}
          </button>
        ))}
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '410px', background: '#fff', borderRadius: '20px',
        padding: '40px 36px', boxShadow: '0 20px 60px rgba(0,0,0,.3)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
          <img src="/logo.png" alt="LC Office Consulting" style={{ width: '92px', height: '92px', objectFit: 'contain' }} />
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 900, color: G, textAlign: 'center', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
          {L.title}
        </h1>
        <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', margin: '0 0 28px' }}>
          {L.subtitle}
        </p>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4a6355', marginBottom: '6px' }}>{L.email}</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required autoComplete="email" placeholder="nome@email.com" style={inputStyle}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4a6355', marginBottom: '6px' }}>{L.password}</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                required autoComplete="current-password" placeholder="••••••••" style={{ ...inputStyle, paddingRight: '64px' }}
              />
              <button type="button" onClick={() => setShowPw(s => !s)} style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px',
                fontWeight: 700, color: GOLD,
              }}>
                {showPw ? L.hide : L.show}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', fontWeight: 600, margin: '14px 0 0' }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px', marginTop: '20px', borderRadius: '10px', border: 'none',
            background: loading ? '#1a5c32' : G, color: '#fff', fontWeight: 800, fontSize: '15px',
            cursor: loading ? 'wait' : 'pointer', boxShadow: '0 4px 16px rgba(13,59,32,.3)',
          }}>
            {loading ? L.entering : `${L.enter} →`}
          </button>
        </form>

        <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', marginTop: '22px', lineHeight: 1.6 }}>
          {L.contact}
        </p>
      </div>
    </div>
  )
}
