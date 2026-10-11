import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'

// Verificação em dois passos da própria conta (R5a, auditoria de 21/08).
// Ativar: ler o QR com uma aplicação de autenticação (Google Authenticator,
// Microsoft Authenticator, 1Password…) e confirmar com um código. A partir daí,
// cada entrada pede a palavra-passe e o código. Desativar pede confirmação.
// Recomendado para todas as administradoras — quem vê todos os clientes.

export default function SegurancaMfa() {
  const { t } = useTheme()
  const [estado, setEstado] = useState('a ler')     // 'a ler' | 'desligada' | 'a ativar' | 'ligada'
  const [fator, setFator] = useState(null)          // fator verificado
  const [novo, setNovo] = useState(null)            // { id, qr, segredo } durante a ativação
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const ler = useCallback(async () => {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) { setErro('Não foi possível ler o estado da verificação.'); setEstado('desligada'); return }
    const f = data?.totp?.[0] || null
    setFator(f); setEstado(f ? 'ligada' : 'desligada')
  }, [])
  useEffect(() => { ler() }, [ler])

  async function comecar() {
    setErro(''); setOcupado(true)
    // Uma ativação a meio (fator por verificar) bloqueia uma nova: limpa-se primeiro.
    const { data: todos } = await supabase.auth.mfa.listFactors()
    for (const f of (todos?.all || []).filter(f => f.status !== 'verified')) await supabase.auth.mfa.unenroll({ factorId: f.id })
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `LC Office ${new Date().toISOString().slice(0, 10)}` })
    setOcupado(false)
    if (error || !data) { setErro('Não foi possível começar a ativação.'); return }
    setNovo({ id: data.id, qr: data.totp.qr_code, segredo: data.totp.secret })
    setEstado('a ativar')
  }
  async function confirmar() {
    setErro(''); setOcupado(true)
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: novo.id, code: codigo.replace(/\s/g, '') })
    setOcupado(false)
    if (error) { setErro('Código errado ou expirado. Experimente o código seguinte.'); return }
    setNovo(null); setCodigo(''); ler()
  }
  async function cancelar() {
    if (novo) await supabase.auth.mfa.unenroll({ factorId: novo.id })
    setNovo(null); setCodigo(''); setErro(''); ler()
  }
  async function desligar() {
    if (!window.confirm('Desativar a verificação em dois passos? A conta passa a entrar só com a palavra-passe.')) return
    setOcupado(true)
    const { error } = await supabase.auth.mfa.unenroll({ factorId: fator.id })
    setOcupado(false)
    if (error) { setErro('Não foi possível desativar. Volte a entrar e tente de novo.'); return }
    ler()
  }

  const btn = (primario) => ({ padding: '9px 16px', borderRadius: '9px', border: primario ? 'none' : `1px solid ${t.cardBorder}`, background: primario ? t.btnBg : 'transparent', color: primario ? t.btnInk : t.heading, fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' })

  return (
    <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: '14px', padding: '16px 18px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: t.heading }}>Verificação em dois passos (a sua conta)</div>
          <div style={{ fontSize: '12.5px', color: t.textMuted, marginTop: '3px' }}>
            {estado === 'ligada' ? 'Ativa — cada entrada pede a palavra-passe e o código da aplicação.'
              : 'Recomendado para administradoras: além da palavra-passe, pede um código de 6 dígitos de uma aplicação no telemóvel.'}
          </div>
        </div>
        {estado === 'ligada' && <><span style={{ fontSize: '12px', fontWeight: 800, padding: '3px 10px', borderRadius: '999px', background: t.dueOk.bg, color: t.dueOk.ink }}>Ativa</span><button onClick={desligar} disabled={ocupado} style={btn(false)}>Desativar</button></>}
        {estado === 'desligada' && <button onClick={comecar} disabled={ocupado} style={btn(true)}>{ocupado ? 'A preparar…' : 'Ativar'}</button>}
      </div>

      {estado === 'a ativar' && novo && (
        <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${t.rowBorder}` }}>
          <img src={novo.qr} alt="Código QR para a aplicação de autenticação" width="168" height="168" style={{ background: '#fff', borderRadius: '8px', padding: '6px' }} />
          <div style={{ flex: '1 1 260px', fontSize: '13px', color: t.text, lineHeight: 1.55 }}>
            <ol style={{ margin: '0 0 10px', paddingLeft: '18px' }}>
              <li>Abra uma aplicação de autenticação no telemóvel (Google Authenticator, Microsoft Authenticator…).</li>
              <li>Leia o código QR. Se não der, escreva a chave: <code style={{ fontSize: '12px', wordBreak: 'break-all' }}>{novo.segredo}</code></li>
              <li>Escreva o código de 6 dígitos que a aplicação mostra.</li>
            </ol>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input aria-label="Código de 6 dígitos" inputMode="numeric" autoComplete="one-time-code" maxLength={7} value={codigo}
                onChange={e => setCodigo(e.target.value.replace(/[^\d ]/g, ''))} placeholder="123456"
                style={{ width: '130px', padding: '9px 12px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '16px', letterSpacing: '3px', fontFamily: 'inherit' }} />
              <button onClick={confirmar} disabled={ocupado || codigo.replace(/\s/g, '').length < 6} style={btn(true)}>{ocupado ? 'A confirmar…' : 'Confirmar e ativar'}</button>
              <button onClick={cancelar} style={btn(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {erro && <div role="alert" style={{ marginTop: '10px', fontSize: '12.5px', fontWeight: 700, color: t.dueLate.ink }}>{erro}</div>}
    </div>
  )
}
