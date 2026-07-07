import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'

const G = '#0a2f1a'
const GOLD = '#c9a84c'

const FlagPT = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" style={{ borderRadius: '2px' }}>
    <rect width="8" height="14" fill="#006600"/><rect x="8" width="12" height="14" fill="#CC0000"/>
    <ellipse cx="8" cy="7" rx="2.8" ry="3.5" fill="#FFFF00" stroke="#006600" strokeWidth="0.4"/>
    <ellipse cx="8" cy="7" rx="1.6" ry="2.0" fill="#fff" stroke="#003399" strokeWidth="0.4"/>
  </svg>
)
const FlagDE = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" style={{ borderRadius: '2px' }}>
    <rect y="0" width="20" height="4.67" fill="#000"/><rect y="4.67" width="20" height="4.67" fill="#CC0000"/><rect y="9.33" width="20" height="4.67" fill="#FFCE00"/>
  </svg>
)

export default function DefinirSenha() {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()
  const { lang, setLang } = useLang()

  const [pw, setPw]         = useState('')
  const [pw2, setPw2]       = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError]   = useState('')
  const [saving, setSaving] = useState(false)

  const L = lang === 'de' ? {
    title: 'Passwort festlegen', subtitle: 'Legen Sie Ihr Zugangspasswort fest, um fortzufahren.',
    pw: 'Passwort', pw2: 'Passwort bestätigen', save: 'Passwort festlegen & anmelden', saving: 'Wird gespeichert…',
    show: 'Anzeigen', hide: 'Verbergen',
    mismatch: 'Die Passwörter stimmen nicht überein.', short: 'Mindestens 6 Zeichen.',
    invalid: 'Link ungültig oder abgelaufen. Bitten Sie um eine neue Einladung.',
    checking: 'Einladung wird geprüft…',
  } : {
    title: 'Definir palavra-passe', subtitle: 'Defina a sua palavra-passe de acesso para continuar.',
    pw: 'Palavra-passe', pw2: 'Confirmar palavra-passe', save: 'Definir e entrar', saving: 'A guardar…',
    show: 'Mostrar', hide: 'Ocultar',
    mismatch: 'As palavras-passe não coincidem.', short: 'Mínimo de 6 caracteres.',
    invalid: 'Ligação inválida ou expirada. Peça um novo convite.',
    checking: 'A validar o convite…',
  }

  // Enquanto o cliente processa o token do link, mostra "a validar…"
  const [waited, setWaited] = useState(false)
  useEffect(() => { const t = setTimeout(() => setWaited(true), 1500); return () => clearTimeout(t) }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (pw.length < 6) { setError(L.short); return }
    if (pw !== pw2) { setError(L.mismatch); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setSaving(false)
    if (error) { setError(error.message); return }
    navigate('/contabilidade/dashboard', { replace: true })
  }

  const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #dde8de', fontSize: '14px', background: '#fff', outline: 'none', boxSizing: 'border-box', color: '#1a2e1a' }

  const noSession = !authLoading && !session && waited

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${G} 0%, #164e2b 100%)`, fontFamily: "'Segoe UI', system-ui, sans-serif", padding: '20px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 'calc(20px + env(safe-area-inset-top))', right: '24px', display: 'flex', gap: '6px' }}>
        {[['pt', FlagPT, 'PT'], ['de', FlagDE, 'DE']].map(([code, Flag, label]) => (
          <button key={code} onClick={() => setLang(code)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: `1px solid ${lang === code ? GOLD : 'rgba(255,255,255,.25)'}`, background: lang === code ? GOLD : 'rgba(255,255,255,.08)', color: lang === code ? G : 'rgba(255,255,255,.85)' }}>
            <Flag /> {label}
          </button>
        ))}
      </div>

      <div style={{ width: '100%', maxWidth: '410px', background: '#fff', borderRadius: '20px', padding: '40px 36px', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
          <img src="/logo.png" alt="LC Office Consulting" style={{ width: '84px', height: '84px', objectFit: 'contain' }} />
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: 900, color: G, textAlign: 'center', margin: '0 0 6px' }}>{L.title}</h1>
        <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', margin: '0 0 26px' }}>{L.subtitle}</p>

        {noSession ? (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '10px', padding: '14px', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
            {L.invalid}
          </div>
        ) : !session ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '10px' }}>{L.checking}</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4a6355', marginBottom: '6px' }}>{L.pw}</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)} required autoComplete="new-password" placeholder="••••••••" style={{ ...inputStyle, paddingRight: '64px' }} />
                <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: GOLD }}>{showPw ? L.hide : L.show}</button>
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4a6355', marginBottom: '6px' }}>{L.pw2}</label>
              <input type={showPw ? 'text' : 'password'} value={pw2} onChange={e => setPw2(e.target.value)} required autoComplete="new-password" placeholder="••••••••" style={inputStyle} />
            </div>

            {error && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', fontWeight: 600, margin: '14px 0 0' }}>{error}</div>}

            <button type="submit" disabled={saving} style={{ width: '100%', padding: '13px', marginTop: '20px', borderRadius: '10px', border: 'none', background: saving ? '#164e2b' : G, color: '#fff', fontWeight: 800, fontSize: '15px', cursor: saving ? 'wait' : 'pointer', boxShadow: '0 4px 16px rgba(10,47,26,.3)' }}>
              {saving ? L.saving : `${L.save} →`}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
