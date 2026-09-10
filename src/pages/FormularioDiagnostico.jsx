import { useState } from 'react'
import { useLang } from '../context/LangContext'
import { useTheme } from '../context/ThemeContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { supabase } from '../lib/supabase'
import { CAMPOS, rot } from '../data/enquadramento'
import { triar } from '../lib/triagem'
import Flag from '../components/Flag'

// Formulário de diagnóstico — página PÚBLICA, sem conta e sem sessão.
//
// Substitui o JotForm que a Lúcia usa no site (decisão de 27/08). As perguntas
// são exatamente as do Bloco 0 da consultoria (src/data/enquadramento.js), por
// isso o que for respondido aqui entra na ficha sem conversão nenhuma — e
// mudar uma pergunta é mudar num sítio só.
//
// Segurança: quem responde escreve como 'anon' e a política da migração 032 só
// lhe dá INSERT nesta tabela. Não lê nada, não altera nada, não toca no CRM.

export default function FormularioDiagnostico() {
  const { lang, setLang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()

  const [contacto, setContacto] = useState({ nome: '', email: '', telefone: '', empresa: '' })
  const [respostas, setRespostas] = useState({})
  const [armadilha, setArmadilha] = useState('')     // honeypot: humanos não preenchem
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  const L = lang === 'de' ? {
    eyebrow: 'Erstdiagnose', titulo: 'Erzählen Sie uns von Ihrer Situation',
    intro: 'Ein paar Minuten, damit wir das Gespräch vorbereiten können. Es gibt keine falschen Antworten — was Sie nicht wissen, lassen Sie offen.',
    nome: 'Name', email: 'E-Mail', telefone: 'Telefon', empresa: 'Firma (optional)',
    enviar: 'Absenden', enviando: 'Wird gesendet…',
    obrigado: 'Danke!', obrigadoTexto: 'Ihre Antworten sind angekommen. Lúcia meldet sich in Kürze.',
    faltaNome: 'Bitte geben Sie Ihren Namen an.', faltaContacto: 'Bitte hinterlassen Sie E-Mail oder Telefon.',
    erro: 'Senden fehlgeschlagen. Bitte versuchen Sie es erneut.',
    escolher: '—', outra: 'Welche?', obrigatorio: 'Pflichtfeld',
  } : lang === 'en' ? {
    eyebrow: 'Initial diagnosis', titulo: 'Tell us about your situation',
    intro: 'A few minutes so we can prepare the conversation. There are no wrong answers — leave blank whatever you do not know.',
    nome: 'Name', email: 'Email', telefone: 'Phone', empresa: 'Company (optional)',
    enviar: 'Send', enviando: 'Sending…',
    obrigado: 'Thank you!', obrigadoTexto: 'Your answers have arrived. Lúcia will be in touch shortly.',
    faltaNome: 'Please tell us your name.', faltaContacto: 'Please leave an email or a phone number.',
    erro: 'Could not send. Please try again.',
    escolher: '—', outra: 'Which one?', obrigatorio: 'Required',
  } : {
    eyebrow: 'Diagnóstico inicial', titulo: 'Conta-nos a tua situação',
    intro: 'São poucos minutos, e servem para prepararmos a conversa. Não há respostas erradas — o que não souberes, deixa em branco.',
    nome: 'Nome', email: 'E-mail', telefone: 'Telefone', empresa: 'Empresa (opcional)',
    enviar: 'Enviar', enviando: 'A enviar…',
    obrigado: 'Obrigada!', obrigadoTexto: 'As tuas respostas chegaram. A Lúcia entra em contacto em breve.',
    faltaNome: 'Falta o teu nome.', faltaContacto: 'Deixa um e-mail ou um telefone.',
    erro: 'Não foi possível enviar. Tenta novamente.',
    escolher: '—', outra: 'Qual?', obrigatorio: 'Obrigatório',
  }

  const set = (k, v) => setRespostas(p => ({ ...p, [k]: v }))

  async function enviar(e) {
    e.preventDefault()
    if (armadilha) return                       // bot: finge que correu bem
    if (!contacto.nome.trim()) { setErro(L.faltaNome); return }
    if (!contacto.email.trim() && !contacto.telefone.trim()) { setErro(L.faltaContacto); return }

    setEnviando(true); setErro('')
    const veredito = triar(respostas)
    const { error } = await supabase.from('diagnostico_submissoes').insert({
      nome: contacto.nome.trim(),
      email: contacto.email.trim() || null,
      telefone: contacto.telefone.trim() || null,
      empresa: contacto.empresa.trim() || null,
      respostas,
      qualificado: veredito.qualificado,
      motivo: veredito.motivo,
    })
    setEnviando(false)
    if (error) { setErro(L.erro); return }
    setEnviado(true)
  }

  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '16px' }
  const inputStyle = { padding: '11px 13px', borderRadius: '10px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: t.fontBody }
  const lbl = { fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '5px' }

  return (
    <div style={{ minHeight: '100vh', background: t.appBg, fontFamily: t.fontBody, color: t.text, padding: isMobile ? '20px 14px 50px' : '34px 20px 60px' }}>
      <div style={{ maxWidth: '660px', margin: '0 auto' }}>

        {/* Cabeçalho com a marca e a escolha de língua */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.png" alt="" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
            <div>
              <div style={{ fontFamily: t.fontDisplay, fontStyle: 'italic', fontSize: '19px', lineHeight: 1, color: t.heading }}>Lúcia Cílio</div>
              <div style={{ fontSize: '9.5px', letterSpacing: '2.4px', textTransform: 'uppercase', marginTop: '3px', color: t.accentText }}>Office Consulting</div>
            </div>
          </div>
          <div style={{ display: 'inline-flex', borderRadius: '9px', overflow: 'hidden', border: `1px solid ${t.cardBorder}` }}>
            {['pt', 'de', 'en'].map(code => (
              <span key={code} onClick={() => setLang(code)} title={code.toUpperCase()}
                style={{ display: 'inline-flex', alignItems: 'center', padding: '7px 10px', cursor: 'pointer', opacity: lang === code ? 1 : .5, background: lang === code ? t.accent : 'transparent' }}>
                <Flag code={code} size={18} />
              </span>
            ))}
          </div>
        </div>

        {enviado ? (
          <div style={{ ...card, padding: '40px 30px', textAlign: 'center' }}>
            <div style={{ fontFamily: t.fontDisplay, fontSize: '30px', fontWeight: 600, color: t.heading, marginBottom: '8px' }}>{L.obrigado}</div>
            <div style={{ fontSize: '14px', color: t.textMuted, lineHeight: 1.6 }}>{L.obrigadoTexto}</div>
          </div>
        ) : (
          <form onSubmit={enviar}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, color: t.accentText, marginBottom: '7px' }}>{L.eyebrow}</div>
              <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '27px' : '34px', lineHeight: 1.05, letterSpacing: '-.5px', color: t.heading }}>{L.titulo}</h1>
              <p style={{ fontSize: '13px', color: t.textMuted, margin: '10px 0 0', lineHeight: 1.55 }}>{L.intro}</p>
            </div>

            {/* Contacto */}
            <div style={{ ...card, padding: '20px 22px', marginBottom: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '13px' }}>
                <div>
                  <div style={lbl}>{L.nome} *</div>
                  <input value={contacto.nome} onChange={e => setContacto(c => ({ ...c, nome: e.target.value }))} style={inputStyle} required />
                </div>
                <div>
                  <div style={lbl}>{L.empresa}</div>
                  <input value={contacto.empresa} onChange={e => setContacto(c => ({ ...c, empresa: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <div style={lbl}>{L.email}</div>
                  <input type="email" value={contacto.email} onChange={e => setContacto(c => ({ ...c, email: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <div style={lbl}>{L.telefone}</div>
                  <input value={contacto.telefone} onChange={e => setContacto(c => ({ ...c, telefone: e.target.value }))} style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Enquadramento — as mesmas perguntas do Bloco 0 */}
            <div style={{ ...card, padding: '20px 22px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '13px' }}>
                {CAMPOS.map(cp => {
                  const valor = respostas[cp.key] ?? ''
                  const escolhida = (cp.opcoes || []).find(o => o.key === valor)
                  return (
                    <div key={cp.key} style={cp.key === 'dificuldade' && !isMobile ? { gridColumn: 'span 2' } : undefined}>
                      <div style={lbl}>{rot(cp, lang)}{cp.obrigatorio ? ' *' : ''}</div>
                      {cp.tipo === 'data' ? (
                        <input type="date" value={valor} onChange={e => set(cp.key, e.target.value)} style={inputStyle} />
                      ) : (
                        <select value={valor} onChange={e => set(cp.key, e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }} required={!!cp.obrigatorio}>
                          <option value="">{L.escolher}</option>
                          {(cp.opcoes || []).map(o => <option key={o.key} value={o.key}>{rot(o, lang)}</option>)}
                        </select>
                      )}
                      {rot({ pt: cp.ajudaPt, de: cp.ajudaDe, en: cp.ajudaEn }, lang) && (
                        <div style={{ fontSize: '11px', color: t.subtle, marginTop: '4px', lineHeight: 1.4 }}>
                          {rot({ pt: cp.ajudaPt, de: cp.ajudaDe, en: cp.ajudaEn }, lang)}
                        </div>
                      )}
                      {cp.outraKey && escolhida?.pedeTexto && (
                        <input value={respostas[cp.outraKey] ?? ''} onChange={e => set(cp.outraKey, e.target.value)}
                          placeholder={L.outra} style={{ ...inputStyle, marginTop: '7px' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Armadilha para robôs — invisível a olho humano */}
            <input value={armadilha} onChange={e => setArmadilha(e.target.value)} tabIndex={-1} autoComplete="off"
              aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }} />

            {erro && (
              <div style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '10px', padding: '11px 15px', fontSize: '13px', fontWeight: 600, marginBottom: '13px' }}>{erro}</div>
            )}

            <button type="submit" disabled={enviando}
              style={{ width: '100%', padding: '15px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '11px', fontWeight: 800, fontSize: '15px', cursor: enviando ? 'wait' : 'pointer' }}>
              {enviando ? L.enviando : L.enviar}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
