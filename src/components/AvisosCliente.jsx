import { useState, useEffect, useCallback } from 'react'
import { useLang } from '../context/LangContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import { localeDe } from '../lib/formato'

// Avisos para o cliente — o lado da Lúcia do canal de comunicação criado na
// reunião de 10/09. Ela escreve aqui; o cliente vê no Início dele.
//
// O caso que apressou isto: um cliente à espera de saber que a declaração de
// IVA tinha sido entregue. Daí o tom "ok" existir — serve exatamente para isso.

export default function AvisosCliente({ userId }) {
  const { lang } = useLang()
  const { t } = useTheme()

  const [lista, setLista] = useState([])
  const [titulo, setTitulo] = useState('')
  const [corpo, setCorpo] = useState('')
  const [tom, setTom] = useState('info')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  const L = lang === 'de' ? {
    titulo: 'Titel', corpo: 'Nachricht (optional)', enviar: 'Senden', enviando: 'Wird gesendet…',
    vazio: 'Noch keine Nachricht an diese Kundin/diesen Kunden.',
    tomInfo: 'Information', tomOk: 'Erledigt', tomAcao: 'Aktion nötig',
    lido: 'gelesen', porLer: 'ungelesen', remover: 'Entfernen',
    erro: 'Fehler (Migration 033 nötig).', falta: 'Der Titel fehlt.',
    exemplo: 'z. B. Umsatzsteuererklärung eingereicht',
  } : lang === 'en' ? {
    titulo: 'Title', corpo: 'Message (optional)', enviar: 'Send', enviando: 'Sending…',
    vazio: 'No message sent to this client yet.',
    tomInfo: 'Information', tomOk: 'Done', tomAcao: 'Needs action',
    lido: 'read', porLer: 'unread', remover: 'Remove',
    erro: 'Error (migration 033 required).', falta: 'The title is missing.',
    exemplo: 'e.g. VAT return submitted',
  } : {
    titulo: 'Título', corpo: 'Mensagem (opcional)', enviar: 'Enviar', enviando: 'A enviar…',
    vazio: 'Ainda não enviaste nenhuma mensagem a este cliente.',
    tomInfo: 'Informação', tomOk: 'Tratado', tomAcao: 'Precisa de ação',
    lido: 'lido', porLer: 'por ler', remover: 'Remover',
    erro: 'Erro (é necessária a migração 033).', falta: 'Falta o título.',
    exemplo: 'ex.: declaração de IVA entregue',
  }

  const TONS = [['info', L.tomInfo], ['ok', L.tomOk], ['acao', L.tomAcao]]
  const cores = { info: { bg: t.chipBg, ink: t.chipText }, ok: t.dueOk, acao: t.dueSoon }

  const load = useCallback(async () => {
    if (!userId) return
    const { data, error } = await supabase.from('client_notices')
      .select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10)
    if (error) setErro(L.erro); else setLista(data || [])
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])

  async function enviar() {
    if (!titulo.trim()) { setErro(L.falta); return }
    setOcupado(true); setErro('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('client_notices').insert({
      user_id: userId, titulo: titulo.trim(), corpo: corpo.trim() || null, tom, created_by: user?.id || null,
    })
    setOcupado(false)
    if (error) { setErro(L.erro); return }
    setTitulo(''); setCorpo(''); setTom('info'); load()
  }

  async function remover(a) {
    await supabase.from('client_notices').delete().eq('id', a.id)
    load()
  }

  const inputStyle = { padding: '10px 12px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: t.fontBody }

  return (
    <div>
      {erro && <div style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '9px', padding: '9px 12px', fontSize: '12.5px', fontWeight: 600, marginBottom: '11px' }}>{erro}</div>}

      <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginBottom: '9px' }}>
        {TONS.map(([k, rot]) => (
          <button key={k} onClick={() => setTom(k)} style={{
            padding: '6px 13px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
            border: `1px solid ${tom === k ? cores[k].ink : t.cardBorder}`,
            background: tom === k ? cores[k].bg : 'transparent', color: tom === k ? cores[k].ink : t.textMuted,
          }}>{rot}</button>
        ))}
      </div>

      <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder={L.exemplo} style={{ ...inputStyle, marginBottom: '8px' }} />
      <textarea value={corpo} onChange={e => setCorpo(e.target.value)} placeholder={L.corpo} rows={2} style={{ ...inputStyle, resize: 'vertical', marginBottom: '9px' }} />
      <button onClick={enviar} disabled={ocupado || !titulo.trim()}
        style={{ padding: '10px 18px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '9px', fontWeight: 700, fontSize: '13px', cursor: ocupado ? 'wait' : 'pointer', opacity: titulo.trim() ? 1 : .5 }}>
        {ocupado ? L.enviando : L.enviar}
      </button>

      <div style={{ marginTop: '14px' }}>
        {!lista.length && <div style={{ fontSize: '12.5px', color: t.subtle }}>{L.vazio}</div>}
        {lista.map(a => {
          const cor = cores[a.tom] || cores.info
          return (
            <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '9px 0', borderBottom: `1px solid ${t.cardBorder}` }}>
              <span style={{ flex: 'none', padding: '2px 9px', borderRadius: '20px', fontSize: '10px', fontWeight: 800, background: cor.bg, color: cor.ink, whiteSpace: 'nowrap' }}>
                {a.tom === 'ok' ? L.tomOk : a.tom === 'acao' ? L.tomAcao : L.tomInfo}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: t.heading }}>{a.titulo}</div>
                {a.corpo && <div style={{ fontSize: '12px', color: t.textMuted, marginTop: '2px', whiteSpace: 'pre-wrap' }}>{a.corpo}</div>}
                <div style={{ fontSize: '11px', color: t.subtle, marginTop: '4px' }}>
                  {new Date(a.created_at).toLocaleDateString(localeDe(lang))} · {a.lido_em ? L.lido : L.porLer}
                </div>
              </div>
              <button onClick={() => remover(a)} title={L.remover} aria-label={L.remover}
                style={{ flex: 'none', width: '30px', height: '30px', background: 'transparent', border: `1px solid ${t.cardBorder}`, borderRadius: '7px', color: t.textMuted, cursor: 'pointer', fontSize: '12px' }}>✕</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
