import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'

// Mensagem de entrega das credenciais (BACKLOG, ponto 16): sem convite por
// e-mail, a Lúcia entrega a palavra-passe temporária à mão. Aqui fica o texto
// pronto — boas-vindas, endereço, e-mail, palavra-passe e o aviso de que vai
// ter de a trocar — para copiar, abrir no WhatsApp ou num e-mail.

const TEXTOS = {
  pt: {
    rotulo: 'Português',
    ola: (n) => (n ? `Olá ${n},` : 'Olá,'),
    novo: 'A sua conta na plataforma da LC Office Consulting está pronta.',
    reset: 'A palavra-passe da sua conta na plataforma da LC Office Consulting foi redefinida.',
    endereco: 'Endereço', email: 'E-mail', pw: 'Palavra-passe temporária',
    trocar: 'No primeiro acesso, a plataforma pede-lhe para escolher uma palavra-passe sua. Por segurança, não partilhe estes dados com ninguém.',
    duvidas: 'Qualquer dúvida, responda a esta mensagem.',
    assunto: 'O seu acesso à plataforma LC Office Consulting',
  },
  de: {
    rotulo: 'Deutsch',
    ola: (n) => (n ? `Hallo ${n},` : 'Hallo,'),
    novo: 'Ihr Zugang zur Plattform von LC Office Consulting ist eingerichtet.',
    reset: 'Das Passwort für Ihren Zugang zur Plattform von LC Office Consulting wurde zurückgesetzt.',
    endereco: 'Adresse', email: 'E-Mail', pw: 'Vorläufiges Passwort',
    trocar: 'Beim ersten Login werden Sie gebeten, ein eigenes Passwort festzulegen. Bitte geben Sie diese Daten nicht weiter.',
    duvidas: 'Bei Fragen antworten Sie einfach auf diese Nachricht.',
    assunto: 'Ihr Zugang zur Plattform von LC Office Consulting',
  },
  en: {
    rotulo: 'English',
    ola: (n) => (n ? `Hello ${n},` : 'Hello,'),
    novo: 'Your account on the LC Office Consulting platform is ready.',
    reset: 'The password for your account on the LC Office Consulting platform has been reset.',
    endereco: 'Address', email: 'E-mail', pw: 'Temporary password',
    trocar: 'On your first login, the platform will ask you to choose your own password. For your security, please do not share these details.',
    duvidas: 'If you have any questions, just reply to this message.',
    assunto: 'Your access to the LC Office Consulting platform',
  },
}

export function textoBoasVindas({ nome, email, pw, novo }, lingua) {
  const T = TEXTOS[lingua] || TEXTOS.pt
  const primeiro = (nome || '').trim().split(/\s+/)[0] || ''
  return [
    T.ola(primeiro), '',
    novo ? T.novo : T.reset, '',
    `${T.endereco}: ${window.location.origin}`,
    `${T.email}: ${email}`,
    `${T.pw}: ${pw}`, '',
    T.trocar, '',
    T.duvidas, '',
    'Lúcia Cílio · LC Office Consulting',
  ].join('\n')
}

export default function BoasVindas({ dados, aoFechar }) {
  const { t } = useTheme()
  const [lingua, setLingua] = useState(dados.lingua || 'pt')
  const [copiado, setCopiado] = useState(false)
  const texto = textoBoasVindas(dados, lingua)

  function copiar() {
    navigator.clipboard?.writeText(texto)
    setCopiado(true); setTimeout(() => setCopiado(false), 1800)
  }

  const btn = { padding: '8px 14px', borderRadius: '9px', border: `1px solid ${t.cardBorder}`, background: t.cardBg, color: t.heading, fontWeight: 700, fontSize: '12.5px', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', fontFamily: 'inherit' }

  return (
    <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: '12px', padding: '14px 16px', marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <strong style={{ fontSize: '13.5px', color: t.heading, flex: 1, minWidth: '200px' }}>Mensagem para enviar ao cliente</strong>
        <div role="group" aria-label="Língua da mensagem" style={{ display: 'inline-flex', gap: '3px', padding: '3px', borderRadius: '10px', background: t.segBg }}>
          {Object.entries(TEXTOS).map(([k, v]) => (
            <button key={k} onClick={() => setLingua(k)} aria-pressed={lingua === k}
              style={{ padding: '5px 11px', borderRadius: '7px', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: lingua === k ? t.cardBg : 'transparent', color: lingua === k ? t.heading : t.textMuted }}>{v.rotulo}</button>
          ))}
        </div>
        <button onClick={aoFechar} aria-label="Fechar" style={{ background: 'none', border: 'none', color: t.subtle, cursor: 'pointer', fontSize: '15px' }}>✕</button>
      </div>
      <textarea readOnly value={texto} rows={12} aria-label="Mensagem de boas-vindas"
        style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, background: t.softCardBg, color: t.text, fontSize: '13px', lineHeight: 1.5, fontFamily: 'inherit', resize: 'vertical' }} />
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
        <button onClick={copiar} style={{ ...btn, background: t.btnBg, color: t.btnInk, border: 'none' }}>{copiado ? 'Copiado ✓' : 'Copiar mensagem'}</button>
        <a href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target="_blank" rel="noopener noreferrer" style={btn}>Abrir no WhatsApp</a>
        <a href={`mailto:${encodeURIComponent(dados.email)}?subject=${encodeURIComponent((TEXTOS[lingua] || TEXTOS.pt).assunto)}&body=${encodeURIComponent(texto)}`} style={btn}>Abrir num e-mail</a>
      </div>
    </div>
  )
}
