import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { useTheme } from '../context/ThemeContext'

// Ecrã do código da verificação em dois passos (R5a). Aparece depois da
// palavra-passe, só a quem ativou a verificação; sem o código não se entra.

const TXT = {
  pt: { titulo: 'Verificação em dois passos', sub: 'Escreva o código de 6 dígitos que aparece na sua aplicação de autenticação.', codigo: 'Código', entrar: 'Confirmar', aVerificar: 'A confirmar…', erro: 'Código errado ou expirado. Tente o código seguinte.', sair: 'Terminar sessão' },
  de: { titulo: 'Zwei-Faktor-Bestätigung', sub: 'Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein.', codigo: 'Code', entrar: 'Bestätigen', aVerificar: 'Wird bestätigt…', erro: 'Falscher oder abgelaufener Code. Versuchen Sie den nächsten.', sair: 'Abmelden' },
  en: { titulo: 'Two-step verification', sub: 'Enter the 6-digit code shown in your authenticator app.', codigo: 'Code', entrar: 'Confirm', aVerificar: 'Confirming…', erro: 'Wrong or expired code. Try the next one.', sair: 'Sign out' },
}

export default function VerificarMfa() {
  const { reverMfa, signOut } = useAuth()
  const { lang } = useLang()
  const { t } = useTheme()
  const L = TXT[lang] || TXT.pt
  const [codigo, setCodigo] = useState('')
  const [aVerificar, setAVerificar] = useState(false)
  const [erro, setErro] = useState('')

  async function confirmar(e) {
    e.preventDefault()
    setAVerificar(true); setErro('')
    const { data: f } = await supabase.auth.mfa.listFactors()
    const fator = f?.totp?.[0]
    const { error } = fator
      ? await supabase.auth.mfa.challengeAndVerify({ factorId: fator.id, code: codigo.replace(/\s/g, '') })
      : { error: true }
    setAVerificar(false)
    if (error) { setErro(L.erro); setCodigo(''); return }
    await reverMfa()
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.loginBg, padding: '20px', fontFamily: t.fontBody }}>
      <form onSubmit={confirmar} style={{ width: '100%', maxWidth: '380px', background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: '16px', boxShadow: t.loginShadow, padding: '28px 26px' }}>
        <h1 style={{ margin: '0 0 6px', fontFamily: t.fontDisplay, fontSize: '22px', color: t.heading }}>{L.titulo}</h1>
        <p style={{ margin: '0 0 18px', fontSize: '13.5px', color: t.textMuted, lineHeight: 1.5 }}>{L.sub}</p>
        <label htmlFor="mfa-codigo" style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: t.text, marginBottom: '6px' }}>{L.codigo}</label>
        <input id="mfa-codigo" autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={7} value={codigo}
          onChange={e => setCodigo(e.target.value.replace(/[^\d ]/g, ''))}
          style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '10px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '22px', letterSpacing: '6px', textAlign: 'center', fontFamily: 'inherit' }} />
        {erro && <div role="alert" style={{ marginTop: '10px', fontSize: '12.5px', fontWeight: 700, color: t.dueLate.ink }}>{erro}</div>}
        <button type="submit" disabled={aVerificar || codigo.replace(/\s/g, '').length < 6}
          style={{ width: '100%', marginTop: '16px', padding: '13px', borderRadius: '10px', border: 'none', background: t.btnBg, color: t.btnInk, fontWeight: 800, fontSize: '14px', cursor: 'pointer', opacity: codigo.replace(/\s/g, '').length < 6 ? .6 : 1 }}>{aVerificar ? L.aVerificar : L.entrar}</button>
        <button type="button" onClick={signOut} style={{ width: '100%', marginTop: '10px', padding: '10px', border: 'none', background: 'none', color: t.accentText, fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>{L.sair}</button>
      </form>
    </div>
  )
}
