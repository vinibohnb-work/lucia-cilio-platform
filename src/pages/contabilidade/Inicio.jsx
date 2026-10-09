import { useState, useEffect, useCallback } from 'react'
import EsqueletoPagina from '../../components/EsqueletoPagina'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { localeDe } from '../../lib/formato'
import { useEffectiveUserId, useViewAs } from '../../context/ViewAsContext'
import { useAuth } from '../../context/AuthContext'
import { usePedidosDocumentos, useUltimoRelatorio, ESTADO_PEDIDO } from '../../lib/pedidosDocumentos'
import { getCompanySettings } from '../../lib/companySettings'

// Início — a primeira coisa que o cliente vê.
//
// Reunião de 10/09: a plataforma passa a ser o canal de comunicação com o
// cliente, não só a ferramenta de contas.
// Reunião de 08/10: página enxuta e sem valores — mensagens, próximas
// obrigações, documentos em falta, último relatório e o que está pendente da
// parte dele. O valor da avença saiu daqui; o contrato continua acessível.

export default function Inicio() {
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const eid = useEffectiveUserId()
  const { user, displayName = '' } = useAuth()
  const isViewing = !!user && eid !== user.id
  const { viewAs } = useViewAs()

  const [avisos, setAvisos] = useState([])
  const [obrigacoes, setObrigacoes] = useState([])
  const [contrato, setContrato] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const agora = new Date()
  const { pedidos } = usePedidosDocumentos(eid, agora.getFullYear(), agora.getMonth() + 1)
  const ultimoRel = useUltimoRelatorio(eid)

  const L = lang === 'de' ? {
    eyebrow: 'Übersicht', ola: 'Willkommen zurück', semNome: 'Ihr Unternehmen',
    avisos: 'Nachrichten von Lúcia', semAvisos: 'Keine neuen Nachrichten.',
    proxObr: 'Nächste steuerliche Fristen', semObr: 'Nichts in nächster Zeit.',
    ultRel: 'Letzter Bericht', semRel: 'Noch kein Bericht.', trim: (q, a) => `${q}. Quartal ${a}`, enviadoA: (d) => `gesendet am ${d}`,
    pend: 'Was noch von Ihnen fehlt', semPend: 'Nichts offen — danke! ✓',
    pendDocs: (n) => n === 1 ? '1 Beleg für diesen Monat senden' : `${n} Belege für diesen Monat senden`,
    pendObr: (o) => `Unterlagen für ${o}`, pendMsg: (n) => n === 1 ? '1 ungelesene Nachricht' : `${n} ungelesene Nachrichten`,
    docs: 'Belege dieses Monats', docsCta: 'Belege senden →', verObr: 'Alle Fristen →',
    hoje: 'heute', amanha: 'morgen', emDias: (n) => `in ${n} Tagen`, atrasado: (n) => `${n} Tage überfällig`,
    completaPais: 'Für korrekte Steuerregeln fehlt noch das Land Ihres Unternehmens.',
    completaCta: 'Jetzt ergänzen →', lido: 'Gelesen', marcarLido: 'Als gelesen markieren',
    verContrato: 'Vertrag ansehen →',
    emFalta: (n) => n === 1 ? '1 Beleg fehlt noch.' : `${n} Belege fehlen noch.`, tudoEntregue: 'Alles eingereicht ✓',
  } : lang === 'en' ? {
    eyebrow: 'Overview', ola: 'Welcome back', semNome: 'Your company',
    avisos: 'Messages from Lúcia', semAvisos: 'No new messages.',
    proxObr: 'Next tax deadlines', semObr: 'Nothing coming up.',
    ultRel: 'Latest report', semRel: 'No report yet.', trim: (q, a) => `Q${q} ${a}`, enviadoA: (d) => `sent on ${d}`,
    pend: 'Waiting on you', semPend: 'Nothing pending — thank you! ✓',
    pendDocs: (n) => n === 1 ? 'Send 1 document for this month' : `Send ${n} documents for this month`,
    pendObr: (o) => `Documents for ${o}`, pendMsg: (n) => n === 1 ? '1 unread message' : `${n} unread messages`,
    docs: 'This month’s documents', docsCta: 'Send documents →', verObr: 'All deadlines →',
    hoje: 'today', amanha: 'tomorrow', emDias: (n) => `in ${n} days`, atrasado: (n) => `${n} days overdue`,
    completaPais: 'Your company country is missing — the tax rules depend on it.',
    completaCta: 'Complete now →', lido: 'Read', marcarLido: 'Mark as read',
    verContrato: 'See contract →',
    emFalta: (n) => n === 1 ? '1 document still missing.' : `${n} documents still missing.`, tudoEntregue: 'All sent ✓',
  } : {
    eyebrow: 'Resumo', ola: 'Olá', semNome: 'A sua empresa',   // neutro: a saudação leva o nome da pessoa (teste de 05/10)
    avisos: 'Mensagens da Lúcia', semAvisos: 'Não há mensagens novas.',
    proxObr: 'Próximas obrigações fiscais', semObr: 'Nada por agora.',
    ultRel: 'Último relatório', semRel: 'Ainda nenhum relatório.', trim: (q, a) => `${q}.º trimestre ${a}`, enviadoA: (d) => `enviado a ${d}`,
    pend: 'Pendente da sua parte', semPend: 'Nada pendente — obrigada! ✓',
    pendDocs: (n) => n === 1 ? 'Enviar 1 documento deste mês' : `Enviar ${n} documentos deste mês`,
    pendObr: (o) => `Documentos para ${o}`, pendMsg: (n) => n === 1 ? '1 mensagem por ler' : `${n} mensagens por ler`,
    docs: 'Documentos deste mês', docsCta: 'Enviar documentos →', verObr: 'Ver todas as obrigações →',
    hoje: 'hoje', amanha: 'amanhã', emDias: (n) => `daqui a ${n} dias`, atrasado: (n) => `${n} dias em atraso`,
    completaPais: 'Falta o país da sua empresa — é ele que determina as regras fiscais.',
    completaCta: 'Completar agora →', lido: 'Lido', marcarLido: 'Marcar como lido',
    verContrato: 'Ver contrato →',
    emFalta: (n) => n === 1 ? 'Falta 1 documento.' : `Faltam ${n} documentos.`, tudoEntregue: 'Tudo entregue ✓',
  }

  const load = useCallback(async () => {
    if (!eid) return
    setLoading(true)
    const [{ data: av }, { data: ob }, { data: cb }, cs] = await Promise.all([
      supabase.from('client_notices').select('*').eq('user_id', eid).order('created_at', { ascending: false }).limit(5),
      supabase.from('fiscal_obligations').select('*').eq('user_id', eid).eq('status', 'pending').order('deadline', { ascending: true }).limit(20),   // a mais antiga primeiro: uma em atraso aparece aqui (R-B3)
      supabase.from('client_billing').select('*').eq('user_id', eid).eq('active', true).limit(1),
      getCompanySettings(eid),
    ])
    setAvisos(av || [])
    setObrigacoes(ob || [])
    setContrato((cb || [])[0] || null)
    setSettings(cs)
    setLoading(false)
  }, [eid])
  useEffect(() => { load() }, [load])

  // O contrato vive no bucket privado: abre-se com uma ligação temporária.
  async function abrirContrato(caminho) {
    const { data } = await supabase.storage.from('client-docs').createSignedUrl(caminho, 120)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener')
  }

  async function marcarLido(aviso) {
    await supabase.from('client_notices').update({ lido_em: new Date().toISOString() }).eq('id', aviso.id)
    setAvisos(prev => prev.map(a => a.id === aviso.id ? { ...a, lido_em: new Date().toISOString() } : a))
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

  if (loading) return <EsqueletoPagina cartoes={3} linhas={3} />

  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px', padding: '18px 20px' }
  const rotulo = { fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '8px' }
  const tom = { info: { bg: t.chipBg, ink: t.chipText }, ok: t.dueOk, acao: t.dueSoon }
  const emFalta = pedidos.filter(p => p.estado === 'em_falta')
  const proximas = obrigacoes.slice(0, 3)
  const porLer = avisos.filter(a => !a.lido_em).length
  // Pendências do lado do cliente: o que a equipa está à espera que ele faça.
  const pendencias = [
    ...(emFalta.length ? [{ k: 'docs', txt: L.pendDocs(emFalta.length), ir: '/contabilidade/empresa' }] : []),
    ...obrigacoes.filter(o => o.estado === 'aguardar_docs').map(o => ({ k: o.id, txt: L.pendObr(o.obligation_type), ir: '/contabilidade/empresa' })),
    ...(porLer ? [{ k: 'msg', txt: L.pendMsg(porLer) }] : []),
  ]
  const link = { marginTop: '10px', background: 'none', border: 'none', padding: 0, color: t.accentText, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }
  // Primeiro nome da pessoa; sem ele, o nome da empresa. (Em "ver como", é a empresa vista.)
  const quem = (!isViewing && displayName.split(' ')[0]) || settings?.company_name || (isViewing && viewAs?.name) || ''

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accentText }}>{L.eyebrow}</div>
        <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '27px' : '34px', lineHeight: 1.05, letterSpacing: '-.5px', color: t.heading }}>
          {L.ola}{quem ? `, ${quem}` : ''}
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
          {proximas.length ? proximas.map((o, i) => (
            <div key={o.id} style={{ padding: '8px 0', borderTop: i ? `1px solid ${t.rowBorder || t.cardBorder}` : 'none' }}>
              <div style={{ fontSize: i ? '14px' : '16px', fontWeight: 800, color: t.heading }}>{o.obligation_type}</div>
              <div style={{ fontSize: '12.5px', color: t.textMuted, marginTop: '2px' }}>
                {dataFmt(o.deadline)} · <strong style={{ color: diasAte(o.deadline) <= 7 ? t.dueLate.ink : t.textMuted }}>{prazoTexto(o.deadline)}</strong>
              </div>
            </div>
          )) : <div style={{ fontSize: '13px', color: t.subtle }}>{L.semObr}</div>}
          <button onClick={() => navigate('/contabilidade/obrigacoes')} style={link}>{L.verObr}</button>
        </div>

        {/* Documentos do mês — com o que a equipa pediu e ainda falta (039) */}
        <div style={card}>
          <div style={{ ...rotulo, marginBottom: '4px' }}>{L.docs}</div>
          <div style={{ fontSize: '12.5px', color: t.subtle }}>{new Date().toLocaleDateString(localeDe(lang), { month: 'long', year: 'numeric' })}</div>
          {pedidos.length > 0 && (
            <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {pedidos.map(p => {
                const cor = p.estado === 'em_falta' ? t.dueSoon : t.dueOk
                return <span key={p.id} style={{ fontSize: '11.5px', fontWeight: 700, padding: '3px 9px', borderRadius: '999px', background: cor.bg, color: cor.ink }}>{p.tipo} · {(ESTADO_PEDIDO[p.estado] || {})[lang] || p.estado}</span>
              })}
            </div>
          )}
          {pedidos.length > 0 && <div style={{ fontSize: '12px', color: emFalta.length ? t.dueSoon.ink : t.subtle, marginTop: '6px', fontWeight: emFalta.length ? 700 : 400 }}>{emFalta.length ? L.emFalta(emFalta.length) : L.tudoEntregue}</div>}
          <button onClick={() => navigate('/contabilidade/empresa')} style={link}>{L.docsCta}</button>
        </div>

        <div style={card}>
          <div style={rotulo}>{L.ultRel}</div>
          {ultimoRel ? (
            <>
              <div style={{ fontSize: '16px', fontWeight: 800, color: t.heading }}>{L.trim(ultimoRel.trimestre, ultimoRel.ano)}</div>
              {ultimoRel.enviado_em && <div style={{ fontSize: '12.5px', color: t.textMuted, marginTop: '2px' }}>{L.enviadoA(dataFmt(ultimoRel.enviado_em))}</div>}
            </>
          ) : <div style={{ fontSize: '13px', color: t.subtle }}>{L.semRel}</div>}
          {contrato?.contract_path && <div><button onClick={() => abrirContrato(contrato.contract_path)} style={link}>{L.verContrato}</button></div>}
        </div>

        <div style={card}>
          <div style={rotulo}>{L.pend}</div>
          {pendencias.length ? (
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13.5px', lineHeight: 1.7, color: t.heading }}>
              {pendencias.map(p => (
                <li key={p.k}>{p.ir
                  ? <button onClick={() => navigate(p.ir)} style={{ ...link, marginTop: 0, fontSize: '13.5px', fontWeight: 600, color: t.heading, textAlign: 'left' }}>{p.txt} →</button>
                  : p.txt}</li>
              ))}
            </ul>
          ) : <div style={{ fontSize: '13px', color: t.dueOk.ink, fontWeight: 600 }}>{L.semPend}</div>}
        </div>
      </div>
    </div>
  )
}
