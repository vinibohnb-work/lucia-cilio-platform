import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { useTheme } from '../context/ThemeContext'
import { homePathFor } from '../lib/platformHome'
import Flag from '../components/Flag'

const SunIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.8"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
const MoonIcon = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>

export default function DefinirSenha() {
  const navigate = useNavigate()
  const { session, role, platform, loading: authLoading } = useAuth()
  const { lang, setLang } = useLang()
  const { t, night, toggle } = useTheme()

  const [pw, setPw]         = useState('')
  const [pw2, setPw2]       = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)
  const [waited, setWaited] = useState(false)
  useEffect(() => { const id = setTimeout(() => setWaited(true), 1500); return () => clearTimeout(id) }, [])

  const L = lang === 'de' ? {
    title: 'Passwort festlegen', subtitle: 'Legen Sie Ihr Zugangspasswort fest, um fortzufahren.',
    pw: 'Passwort', pw2: 'Passwort bestätigen', save: 'Festlegen & anmelden', saving: 'Wird gespeichert…',
    show: 'Anzeigen', hide: 'Verbergen', mismatch: 'Die Passwörter stimmen nicht überein.', short: 'Mindestens 6 Zeichen.',
    invalid: 'Link ungültig oder abgelaufen. Bitten Sie um eine neue Einladung.', checking: 'Einladung wird geprüft…',
  } : lang === 'en' ? {
    title: 'Set your password', subtitle: 'Set your access password to continue.',
    pw: 'Password', pw2: 'Confirm password', save: 'Set & sign in', saving: 'Saving…',
    show: 'Show', hide: 'Hide', mismatch: 'The passwords do not match.', short: 'At least 6 characters.',
    invalid: 'Link invalid or expired. Please request a new invitation.', checking: 'Verifying invitation…',
  } : {
    title: 'Definir palavra-passe', subtitle: 'Defina a sua palavra-passe de acesso para continuar.',
    pw: 'Palavra-passe', pw2: 'Confirmar palavra-passe', save: 'Definir e entrar', saving: 'A guardar…',
    show: 'Mostrar', hide: 'Ocultar', mismatch: 'As palavras-passe não coincidem.', short: 'Mínimo de 6 caracteres.',
    invalid: 'Ligação inválida ou expirada. Peça um novo convite.', checking: 'A validar o convite…',
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError('')
    if (pw.length < 6) { setError(L.short); return }
    if (pw !== pw2) { setError(L.mismatch); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setSaving(false)
    if (error) { setError(error.message); return }
    navigate(homePathFor(role, platform), { replace: true })
  }

  const inputStyle = { width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '10px', fontSize: '14px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.heading, outline: 'none' }
  const label = (txt) => <label style={{ display: 'block', fontSize: '11px', letterSpacing: '.5px', fontWeight: 600, marginBottom: '7px', color: t.textMuted }}>{txt}</label>
  const noSession = !authLoading && !session && waited

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', fontFamily: t.fontBody, background: t.loginBg, position: 'relative' }}>
      <div style={{ position: 'absolute', top: 'calc(26px + env(safe-area-inset-top))', right: '30px', display: 'flex', gap: '12px' }}>
        <div style={{ display: 'inline-flex', borderRadius: '8px', overflow: 'hidden', fontSize: '11px', fontWeight: 600, border: `1px solid ${t.sidebarBorder}` }}>
          {['pt','de','en'].map(code => <span key={code} onClick={() => setLang(code)} title={code.toUpperCase()} style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 9px', cursor: 'pointer', opacity: lang === code ? 1 : 0.5, background: lang === code ? t.accent : 'transparent' }}><Flag code={code} size={20} /></span>)}
        </div>
        <button onClick={toggle} style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: t.toggleBg, border: `1px solid ${t.sidebarBorder}` }}>{night ? <MoonIcon /> : <SunIcon />}</button>
      </div>

      <div style={{ width: '400px', maxWidth: '100%', borderRadius: '20px', padding: '40px 38px', background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.loginShadow }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '26px' }}>
          <img src="/logo.png" alt="LC" style={{ width: '68px', height: '68px', objectFit: 'contain', marginBottom: '14px' }} />
          <h1 style={{ fontFamily: t.fontDisplay, fontSize: '24px', fontWeight: 600, color: t.heading, margin: '0 0 6px' }}>{L.title}</h1>
          <p style={{ fontSize: '13px', color: t.textMuted, margin: 0 }}>{L.subtitle}</p>
        </div>

        {noSession ? (
          <div style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '10px', padding: '14px', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>{L.invalid}</div>
        ) : !session ? (
          <div style={{ textAlign: 'center', color: t.subtle, fontSize: '13px', padding: '10px' }}>{L.checking}</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              {label(L.pw)}
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} required autoComplete="new-password" placeholder="••••••••" style={{ ...inputStyle, paddingRight: '64px' }} />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: t.accent }}>{showPw ? L.hide : L.show}</button>
              </div>
            </div>
            <div>{label(L.pw2)}<input type={showPw ? 'text' : 'password'} value={pw2} onChange={e => setPw2(e.target.value)} required autoComplete="new-password" placeholder="••••••••" style={inputStyle} /></div>
            {error && <div style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '8px', padding: '10px 12px', fontSize: '12px', fontWeight: 600 }}>{error}</div>}
            <button type="submit" disabled={saving} style={{ marginTop: '8px', width: '100%', padding: '13px', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', background: t.btnBg, color: t.btnInk }}>{saving ? L.saving : L.save}</button>
          </form>
        )}
      </div>
    </div>
  )
}
