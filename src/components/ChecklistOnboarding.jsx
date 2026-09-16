import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'

// Checklist de onboarding de um cliente — o "Fazer Onboarding" da reunião de
// 06/08, agora que o cliente tem de facto um sítio onde aterrar (10/09).
//
// Nenhum passo é marcado à mão: todos são lidos do que já existe. Uma checklist
// com caixas para marcar acaba sempre por mentir — alguém marca e não faz, ou
// faz e não marca. Assim, o que está verde está mesmo feito.

export default function ChecklistOnboarding({ userId, cliente }) {
  const { lang } = useLang()
  const { t } = useTheme()
  const navigate = useNavigate()

  const [estado, setEstado] = useState(null)
  const [aberto, setAberto] = useState(false)

  const L = lang === 'de' ? {
    titulo: 'Onboarding', feitos: (a, b) => `${a} von ${b} erledigt`, completo: 'Onboarding abgeschlossen',
    verPassos: 'Schritte anzeigen', esconder: 'Ausblenden',
    p_conta: 'Konto angelegt', p_conta_s: 'Zugang existiert',
    p_acesso: 'Erster Login', p_acesso_s: 'Die Kundin/der Kunde war schon drin',
    p_empresa: 'Firmendaten', p_empresa_s: 'Land und Name ausgefüllt',
    p_contrato: 'Vertrag angehängt', p_contrato_s: 'PDF im Finanzbereich',
    p_docs: 'Erste Belege', p_docs_s: 'Etwas wurde hochgeladen',
    p_msg: 'Willkommensnachricht', p_msg_s: 'Mindestens eine Nachricht gesendet',
    ir: 'Erledigen →',
  } : lang === 'en' ? {
    titulo: 'Onboarding', feitos: (a, b) => `${a} of ${b} done`, completo: 'Onboarding complete',
    verPassos: 'Show steps', esconder: 'Hide',
    p_conta: 'Account created', p_conta_s: 'Access exists',
    p_acesso: 'First sign-in', p_acesso_s: 'The client has been in',
    p_empresa: 'Company details', p_empresa_s: 'Country and name filled in',
    p_contrato: 'Contract attached', p_contrato_s: 'PDF in the finance area',
    p_docs: 'First documents', p_docs_s: 'Something has been uploaded',
    p_msg: 'Welcome message', p_msg_s: 'At least one message sent',
    ir: 'Do it →',
  } : {
    titulo: 'Onboarding', feitos: (a, b) => `${a} de ${b} feitos`, completo: 'Onboarding completo',
    verPassos: 'Ver passos', esconder: 'Esconder',
    p_conta: 'Conta criada', p_conta_s: 'o acesso existe',
    p_acesso: 'Primeiro acesso', p_acesso_s: 'o cliente já entrou',
    p_empresa: 'Dados da empresa', p_empresa_s: 'país e nome preenchidos',
    p_contrato: 'Contrato anexado', p_contrato_s: 'PDF no Financeiro',
    p_docs: 'Primeiros documentos', p_docs_s: 'já foi enviado alguma coisa',
    p_msg: 'Mensagem de boas-vindas', p_msg_s: 'pelo menos uma mensagem enviada',
    ir: 'Tratar →',
  }

  const load = useCallback(async () => {
    if (!userId) return
    const [cfg, bil, avisos, docs] = await Promise.all([
      supabase.from('company_settings').select('country,company_name').eq('user_id', userId).maybeSingle(),
      supabase.from('client_billing').select('contract_path').eq('user_id', userId).limit(1),
      supabase.from('client_notices').select('id').eq('user_id', userId).limit(1),
      supabase.storage.from('client-docs').list(userId, { limit: 20 }),
    ])
    // Pastas vêm com id a null; só contam ficheiros, incluindo os de dentro das
    // pastas por mês (basta haver uma pasta criada por um envio).
    const temDocs = (docs.data || []).length > 0
    setEstado({
      empresa: !!(cfg.data?.country && cfg.data?.company_name),
      contrato: !!(bil.data || []).some(b => b.contract_path),
      avisos: (avisos.data || []).length > 0,
      docs: temDocs,
    })
  }, [userId])
  useEffect(() => { load() }, [load])

  if (!estado) return null

  const jaEntrou = !!(cliente?.last_sign_in_at)
  const passos = [
    { key: 'conta', ok: true, rot: L.p_conta, sub: L.p_conta_s },
    { key: 'empresa', ok: estado.empresa, rot: L.p_empresa, sub: L.p_empresa_s, ir: () => navigate('/gestao/acessos') },
    { key: 'contrato', ok: estado.contrato, rot: L.p_contrato, sub: L.p_contrato_s, ir: () => navigate('/gestao/financeiro') },
    // A caixa de mensagens está logo por baixo, por isso este passo não leva atalho.
    { key: 'msg', ok: estado.avisos, rot: L.p_msg, sub: L.p_msg_s },
    { key: 'acesso', ok: jaEntrou, rot: L.p_acesso, sub: L.p_acesso_s },
    { key: 'docs', ok: estado.docs, rot: L.p_docs, sub: L.p_docs_s },
  ]
  const feitos = passos.filter(p => p.ok).length
  const completo = feitos === passos.length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: completo ? t.dueOk.ink : t.heading }}>
            {completo ? L.completo : L.feitos(feitos, passos.length)}
          </div>
          <div style={{ height: '6px', borderRadius: '20px', background: t.trackBg, overflow: 'hidden', marginTop: '7px' }}>
            <div style={{ width: `${Math.round((feitos / passos.length) * 100)}%`, height: '100%', background: completo ? t.dueOk.ink : t.accent }} />
          </div>
        </div>
        <button onClick={() => setAberto(v => !v)}
          style={{ flex: 'none', minHeight: '32px', padding: '0 13px', background: 'transparent', border: `1px solid ${t.cardBorder}`, borderRadius: '8px', fontSize: '11.5px', fontWeight: 700, color: t.textMuted, cursor: 'pointer' }}>
          {aberto ? L.esconder : L.verPassos}
        </button>
      </div>

      {aberto && (
        <div style={{ marginTop: '12px' }}>
          {passos.map(p => (
            <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: `1px solid ${t.cardBorder}` }}>
              <span style={{ flex: 'none', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, background: p.ok ? t.dueOk.bg : t.trackBg, color: p.ok ? t.dueOk.ink : t.subtle }}>
                {p.ok ? '✓' : ''}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: p.ok ? t.textMuted : t.heading }}>{p.rot}</div>
                <div style={{ fontSize: '11px', color: t.subtle }}>{p.sub}</div>
              </div>
              {!p.ok && p.ir && (
                <button onClick={p.ir}
                  style={{ flex: 'none', minHeight: '30px', padding: '0 12px', background: 'transparent', border: `1px solid ${t.cardBorder}`, borderRadius: '8px', fontSize: '11px', fontWeight: 700, color: t.accentText, cursor: 'pointer', whiteSpace: 'nowrap' }}>{L.ir}</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
