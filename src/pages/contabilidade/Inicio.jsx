import { useState, useEffect, useCallback } from 'react'
import EsqueletoPagina from '../../components/EsqueletoPagina'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { localeDe } from '../../lib/formato'
import { useEffectiveUserId } from '../../context/ViewAsContext'
import { getCompanySettings } from '../../lib/companySettings'
import { isDueInPeriod } from '../gestao/Financeiro'

// Início — a primeira coisa que o cliente vê.
//
// Reunião de 10/09: a plataforma passa a ser o canal de comunicação com o
// cliente, não só a ferramenta de contas. Responde às três perguntas que ele
// faz por mensagem: como estou, o que tenho a seguir, e quanto tenho a pagar.
//
// Deliberadamente curto: quem quiser detalhe tem o Painel e o Livro de Caixa.

const ymDe = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

export default function Inicio() {
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const eid = useEffectiveUserId()

  const [avisos, setAvisos] = useState([])
  const [obrigacao, setObrigacao] = useState(null)
  const [contrato, setContrato] = useState(null)
  const [pagamentos, setPagamentos] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  const L = lang === 'de' ? {
    eyebrow: 'Übersicht', ola: 'Willkommen zurück', semNome: 'Ihr Unternehmen',
    avisos: 'Nachrichten von Lúcia', semAvisos: 'Keine neuen Nachrichten.',
    proxObr: 'Nächste steuerliche Frist', semObr: 'Nichts in nächster Zeit.',
    proxPag: 'Nächste Zahlung', semPag: 'Kein laufender Vertrag.',
    docs: 'Belege dieses Monats', docsCta: 'Belege senden →', verObr: 'Alle Fristen →',
    hoje: 'heute', amanha: 'morgen', emDias: (n) => `in ${n} Tagen`, atrasado: (n) => `${n} Tage überfällig`,
    completaPais: 'Für korrekte Steuerregeln fehlt noch das Land Ihres Unternehmens.',
    completaCta: 'Jetzt ergänzen →', lido: 'Gelesen', marcarLido: 'Als gelesen markieren',
    porMes: { monthly: 'pro Monat', quarterly: 'pro Quartal', annual: 'pro Jahr', once: 'einmalig' },
  } : lang === 'en' ? {
    eyebrow: 'Overview', ola: 'Welcome back', semNome: 'Your company',
    avisos: 'Messages from Lúcia', semAvisos: 'No new messages.',
    proxObr: 'Next tax deadline', semObr: 'Nothing coming up.',
    proxPag: 'Next payment', semPag: 'No active contract.',
    docs: 'This month’s documents', docsCta: 'Send documents →', verObr: 'All deadlines →',
    hoje: 'today', amanha: 'tomorrow', emDias: (n) => `in ${n} days`, atrasado: (n) => `${n} days overdue`,
    completaPais: 'Your company country is missing — the tax rules depend on it.',
    completaCta: 'Complete now →', lido: 'Read', marcarLido: 'Mark as read',
    porMes: { monthly: 'per month', quarterly: 'per quarter', annual: 'per year', once: 'one-off' },
  } : {
    eyebrow: 'Resumo', ola: 'Bem-vinda de volta', semNome: 'A tua empresa',
    avisos: 'Mensagens da Lúcia', semAvisos: 'Não há mensagens novas.',
    proxObr: 'Próxima obrigação fiscal', semObr: 'Nada por agora.',
    proxPag: 'Próximo pagamento', semPag: 'Sem contrato ativo.',
    docs: 'Documentos deste mês', docsCta: 'Enviar documentos →', verObr: 'Ver todas as obrigações →',
    hoje: 'hoje', amanha: 'amanhã', emDias: (n) => `daqui a ${n} dias`, atrasado: (n) => `${n} dias em atraso`,
    completaPais: 'Falta o país da tua empresa — é ele que determina as regras fiscais.',
    completaCta: 'Completar agora →', lido: 'Lido', marcarLido: 'Marcar como lido',
    porMes: { monthly: 'por mês', quarterly: 'por trimestre', annual: 'por ano', once: 'pagamento único' },
  }

  const load = useCallback(async () => {
    if (!eid) return
    setLoading(true)
    const hoje = new Date().toISOString().slice(0, 10)
    const [{ data: av }, { data: ob }, { data: cb }, cs] = await Promise.all([
      supabase.from('client_notices').select('*').eq('user_id', eid).order('created_at', { ascending: false }).limit(5),
      supabase.from('fiscal_obligations').select('*').eq('user_id', eid).eq('status', 'pending').gte('deadline', hoje).order('deadline', { ascending: true }).limit(1),
      supabase.from('client_billing').select('*').eq('user_id', eid).eq('active', true).limit(1),
      getCompanySettings(eid),
    ])
    setAvisos(av || [])
    setObrigacao((ob || [])[0] || null)
    const c = (cb || [])[0] || null
    setContrato(c)
    if (c) {
      const { data: pg } = await supabase.from('billing_payments').select('period').eq('billing_id', c.id)
      setPagamentos((pg || []).map(p => p.period))
    }
    setSettings(cs)
    setLoading(false)
  }, [eid])
  useEffect(() => { load() }, [load])

  async function marcarLido(aviso) {
    await supabase.from('client_notices').update({ lido_em: new Date().toISOString() }).eq('id', aviso.id)
    setAvisos(prev => prev.map(a => a.id === aviso.id ? { ...a, lido_em: new Date().toISOString() } : a))
  }

  // Próximo período por pagar: anda para a frente a partir deste mês até
  // encontrar um em que o contrato é devido e ainda não foi recebido.
  function proximoPeriodo() {
    if (!contrato) return null
    const base = new Date()
    for (let i = 0; i < 24; i++) {
      const d = new Date(base.getFullYear(), base.getMonth() + i, 1)
      const p = ymDe(d)
      if (isDueInPeriod(contrato, p) && !pagamentos.includes(p)) return { periodo: p, data: d }
    }
    return null
  }

  const diasAte = (iso) => Math.round((new Date(iso + 'T00:00:00') - new Date(new Date().toDateString())) / 864e5)
  const prazoTexto = (iso) => {
    const d = diasAte(iso)
    if (d < 0) return L.atrasado(Math.abs(d))
    if (d === 0) return L.hoje
    if (d === 1) return L.amanha
    return L.emDias(d)
  }
  const dataFmt = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString(localeDe(lang), { day: '2-digit', month: 'long' })
  const eur = (v) => `€ ${(Number(v) || 0).toLocaleString(localeDe(lang), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  if (loading) return <EsqueletoPagina cartoes={3} linhas={3} />

  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px', padding: '18px 20px' }
  const rotulo = { fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }
  const tom = { info: { bg: t.chipBg, ink: t.chipText }, ok: t.dueOk, acao: t.dueSoon }
  const prox = proximoPeriodo()

  return (
    <div style={{ width: '100%', maxWidth: '900px', fontFamily: t.fontBody }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accentText }}>{L.eyebrow}</div>
        <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '27px' : '34px', lineHeight: 1.05, letterSpacing: '-.5px', color: t.heading }}>
          {L.ola}{settings?.company_name ? `, ${settings.company_name}` : ''}
        </h1>
      </div>

      {/* Falta o país: sem ele as regras fiscais saem erradas */}
      {!settings?.country && (
        <div style={{ background: t.dueSoon.bg, border: `1px solid ${t.dueSoon.ink}44`, borderRadius: '12px', padding: '13px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ flex: 1, minWidth: '220px', fontSize: '13px', fontWeight: 600, color: t.dueSoon.ink }}>{L.completaPais}</span>
          <button onClick={() => navigate('/contabilidade/empresa')}
            style={{ padding: '8px 14px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '9px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{L.completaCta}</button>
        </div>
      )}

      {/* Mensagens da Lúcia — o canal de comunicação */}
      <div style={{ ...card, marginBottom: '14px' }}>
        <div style={rotulo}>{L.avisos}</div>
        {!avisos.length && <div style={{ fontSize: '13px', color: t.subtle }}>{L.semAvisos}</div>}
        {avisos.map(a => {
          const cor = tom[a.tom] || tom.info
          return (
            <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '11px', padding: '11px 0', borderBottom: `1px solid ${t.rowBorder || t.cardBorder}` }}>
              <span style={{ flex: 'none', width: '8px', height: '8px', borderRadius: '50%', marginTop: '6px', background: a.lido_em ? t.subtle : cor.ink }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', fontWeight: a.lido_em ? 600 : 800, color: t.heading }}>{a.titulo}</div>
                {a.corpo && <div style={{ fontSize: '12.5px', color: t.textMuted, marginTop: '3px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{a.corpo}</div>}
                <div style={{ fontSize: '11px', color: t.subtle, marginTop: '5px' }}>
                  {new Date(a.created_at).toLocaleDateString(localeDe(lang))}
                  {a.lido_em ? ` · ${L.lido}` : ''}
                </div>
              </div>
              {!a.lido_em && (
                <button onClick={() => marcarLido(a)}
                  style={{ flex: 'none', minHeight: '32px', padding: '0 11px', background: 'transparent', border: `1px solid ${t.cardBorder}`, borderRadius: '8px', fontSize: '11px', fontWeight: 700, color: t.textMuted, cursor: 'pointer' }}>{L.marcarLido}</button>
              )}
            </div>
          )
        })}
      </div>

      {/* O que vem a seguir */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
        <div style={card}>
          <div style={rotulo}>{L.proxObr}</div>
          {obrigacao ? (
            <>
              <div style={{ fontSize: '17px', fontWeight: 800, color: t.heading }}>{obrigacao.obligation_type}</div>
              <div style={{ fontSize: '13px', color: t.textMuted, marginTop: '4px' }}>
                {dataFmt(obrigacao.deadline)} · <strong style={{ color: diasAte(obrigacao.deadline) <= 7 ? t.dueLate.ink : t.textMuted }}>{prazoTexto(obrigacao.deadline)}</strong>
              </div>
              <button onClick={() => navigate('/contabilidade/obrigacoes')}
                style={{ marginTop: '10px', background: 'none', border: 'none', padding: 0, color: t.accentText, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>{L.verObr}</button>
            </>
          ) : <div style={{ fontSize: '13px', color: t.subtle }}>{L.semObr}</div>}
        </div>

        <div style={card}>
          <div style={rotulo}>{L.proxPag}</div>
          {contrato && prox ? (
            <>
              <div style={{ fontSize: '17px', fontWeight: 800, color: t.heading, fontVariantNumeric: 'tabular-nums' }}>{eur(contrato.amount)}</div>
              <div style={{ fontSize: '13px', color: t.textMuted, marginTop: '4px' }}>
                {prox.data.toLocaleDateString(localeDe(lang), { month: 'long', year: 'numeric' })} · {L.porMes[contrato.periodicity] || ''}
              </div>
              {contrato.service && <div style={{ fontSize: '11.5px', color: t.subtle, marginTop: '5px' }}>{contrato.service}</div>}
            </>
          ) : <div style={{ fontSize: '13px', color: t.subtle }}>{L.semPag}</div>}
        </div>
      </div>

      {/* Documentos do mês */}
      <div style={{ ...card, marginTop: '14px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ ...rotulo, marginBottom: '4px' }}>{L.docs}</div>
          <div style={{ fontSize: '12.5px', color: t.subtle }}>{new Date().toLocaleDateString(localeDe(lang), { month: 'long', year: 'numeric' })}</div>
        </div>
        <button onClick={() => navigate('/contabilidade/empresa')}
          style={{ padding: '9px 15px', background: 'transparent', border: `1px solid ${t.cardBorder}`, borderRadius: '9px', fontWeight: 700, fontSize: '12px', color: t.accentText, cursor: 'pointer', whiteSpace: 'nowrap' }}>{L.docsCta}</button>
      </div>
    </div>
  )
}
