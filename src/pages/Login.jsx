import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { homePathFor } from '../lib/platformHome'
import Flag from '../components/Flag'

const SunIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.8"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
const MoonIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>

export default function Login() {
  const navigate = useNavigate()
  const { signIn, session, role, platform, loading: authLoading } = useAuth()
  const { lang, setLang } = useLang()
  const { t, night, toggle } = useTheme()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (!authLoading && session) navigate(homePathFor(role, platform), { replace: true })
  }, [authLoading, session, role, platform, navigate])

  const L = lang === 'de' ? {
    subtitle: 'Office Consulting', email: 'E-Mail', password: 'Passwort',
    enter: 'Anmelden', entering: 'Wird angemeldet…',
    invalid: 'E-Mail oder Passwort ungültig.', generic: 'Anmeldung fehlgeschlagen. Bitte erneut versuchen.',
    contact: 'Zugang auf Einladung · keine öffentliche Registrierung', show: 'Anzeigen', hide: 'Verbergen',
  } : lang === 'en' ? {
    subtitle: 'Office Consulting', email: 'Email', password: 'Password',
    enter: 'Sign in', entering: 'Signing in…',
    invalid: 'Invalid email or password.', generic: 'Could not sign in. Please try again.',
    contact: 'Invite-only access · no public sign-up', show: 'Show', hide: 'Hide',
  } : {
    subtitle: 'Office Consulting', email: 'E-mail', password: 'Palavra-passe',
    enter: 'Entrar', entering: 'A entrar…',
    invalid: 'E-mail ou palavra-passe incorretos.', generic: 'Não foi possível entrar. Tente novamente.',
    contact: 'Acesso restrito · sem registo público', show: 'Mostrar', hide: 'Ocultar',
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    const { data, error } = await signIn(email.trim(), password)
    if (error) { setLoading(false); setError(error.message?.toLowerCase().includes('invalid') ? L.invalid : L.generic); return }
    let r = 'user', p = 'accounting'
    try {
      const { data: prof } = await supabase.from('profiles').select('role, platform').eq('id', data.user.id).single()
      if (prof?.role) r = prof.role
      if (prof?.platform) p = prof.platform
    } catch { /* pré-migração */ }
    setLoading(false)
    navigate(homePathFor(r, p), { replace: true })
  }

  const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '10px', fontSize: '14px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.heading, outline: 'none' }
  const label = (txt) => <label style={{ display: 'block', fontSize: '11px', letterSpacing: '.5px', fontWeight: 600, marginBottom: '7px', color: t.textMuted }}>{txt}</label>

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', fontFamily: t.fontBody, background: t.loginBg, position: 'relative' }}>
      {/* Idioma + tema */}
      <div style={{ position: 'absolute', top: 'calc(26px + env(safe-area-inset-top))', right: '30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'inline-flex', borderRadius: '8px', overflow: 'hidden', fontSize: '11px', fontWeight: 600, border: `1px solid ${t.sidebarBorder}` }}>
          {['pt','de','en'].map(code => (
            <span key={code} onClick={() => setLang(code)} title={code.toUpperCase()} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 9px', cursor: 'pointer', opacity: lang === code ? 1 : 0.5, background: lang === code ? t.accent : 'transparent' }}><Flag code={code} size={20} /></span>
          ))}
        </div>
        <button onClick={toggle} style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: t.toggleBg, border: `1px solid ${t.sidebarBorder}` }}>
          {night ? <MoonIcon /> : <SunIcon />}
        </button>
      </div>

      {/* Card */}
      <div style={{ width: '400px', maxWidth: '100%', borderRadius: '20px', padding: '40px 38px', background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.loginShadow }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '30px' }}>
          <img src="/logo.png" alt="LC" style={{ width: '68px', height: '68px', objectFit: 'contain', marginBottom: '14px' }} />
          <div style={{ fontFamily: t.fontDisplay, fontStyle: 'italic', fontSize: '26px', color: t.heading, lineHeight: 1 }}>Lúcia Cílio</div>
          <div style={{ fontSize: '10px', letterSpacing: '2.6px', textTransform: 'uppercase', marginTop: '5px', color: t.accentText }}>{L.subtitle}</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>{label(L.email)}<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="nome@email.com" style={inputStyle} /></div>
          <div>
            {label(L.password)}
            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" placeholder="••••••••" style={{ ...inputStyle, paddingRight: '64px' }} />
              <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: t.accentText }}>{showPw ? L.hide : L.show}</button>
            </div>
          </div>

          {error && <div style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '8px', padding: '10px 12px', fontSize: '12px', fontWeight: 600 }}>{error}</div>}

          <button type="submit" disabled={loading} style={{ marginTop: '8px', width: '100%', padding: '13px', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'wait' : 'pointer', background: t.btnBg, color: t.btnInk }}>
            {loading ? L.entering : L.enter}
          </button>
          <div style={{ textAlign: 'center', fontSize: '12px', marginTop: '4px', color: t.subtle }}>{L.contact}</div>
        </form>
      </div>
    </div>
  )
}
