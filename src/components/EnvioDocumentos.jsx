import { useState, useEffect, useCallback, useRef } from 'react'
import { useLang } from '../context/LangContext'
import { useTheme } from '../context/ThemeContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { supabase } from '../lib/supabase'
import { localeDe } from '../lib/formato'

// Envio de documentos pelo cliente — vive na área da Empresa e arruma tudo por
// mês (decisão de 27/08: "é como a Lúcia os procura ao fechar as contas").
//
// Caminho no bucket: {user_id}/{AAAA-MM}/{ficheiro}. O mesmo bucket que a Lúcia
// já navega do lado dela, por isso o que o cliente envia aparece-lhe na ficha
// sem mais nada.
//
// A política da migração 032 dá ao cliente INSERT dentro da sua própria pasta —
// e só isso. Não pode apagar nem substituir: um documento entregue não
// desaparece. Daí o upsert ficar desligado e os nomes repetidos ganharem sufixo.

const BUCKET = 'client-docs'

export default function EnvioDocumentos({ userId }) {
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const inputRef = useRef(null)

  const hoje = new Date()
  const [mes, setMes] = useState(`${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`)
  const [ficheiros, setFicheiros] = useState([])
  const [aCarregar, setACarregar] = useState(false)
  const [aEnviar, setAEnviar] = useState(false)
  const [erro, setErro] = useState('')
  const [ok, setOk] = useState('')

  const L = lang === 'de' ? {
    titulo: 'Belege senden', sub: 'Nach Monat abgelegt — so wie sie beim Abschluss gesucht werden.',
    mes: 'Monat', enviar: '⬆ Datei wählen', aEnviar: 'Wird gesendet…',
    vazio: 'Für diesen Monat noch nichts gesendet.', enviado: 'Gesendet ✓',
    erro: 'Senden fehlgeschlagen (Migration 032 nötig).', abrir: 'Öffnen',
    aviso: 'Einmal gesendet, bleibt die Datei — löschen kann nur Lúcia.',
  } : lang === 'en' ? {
    titulo: 'Send documents', sub: 'Filed by month — the way they are looked up at closing.',
    mes: 'Month', enviar: '⬆ Choose file', aEnviar: 'Sending…',
    vazio: 'Nothing sent for this month yet.', enviado: 'Sent ✓',
    erro: 'Could not send (migration 032 required).', abrir: 'Open',
    aviso: 'Once sent, the file stays — only Lúcia can remove it.',
  } : {
    titulo: 'Enviar documentos', sub: 'Arrumados por mês — como são procurados no fecho das contas.',
    mes: 'Mês', enviar: '⬆ Escolher ficheiro', aEnviar: 'A enviar…',
    vazio: 'Ainda não enviaste nada para este mês.', enviado: 'Enviado ✓',
    erro: 'Não foi possível enviar (é necessária a migração 032).', abrir: 'Abrir',
    aviso: 'Depois de enviado, o ficheiro fica — só a Lúcia o pode remover.',
  }

  // Últimos 18 meses: chega para quem está a pôr as contas em dia sem
  // transformar isto numa lista infinita.
  const meses = []
  for (let i = 0; i < 18; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const nome = d.toLocaleDateString(localeDe(lang), { month: 'long', year: 'numeric' })
    meses.push({ chave, nome: nome.charAt(0).toUpperCase() + nome.slice(1) })
  }

  const listar = useCallback(async () => {
    if (!userId) return
    setACarregar(true); setErro('')
    const { data, error } = await supabase.storage.from(BUCKET)
      .list(`${userId}/${mes}`, { limit: 200, sortBy: { column: 'name', order: 'asc' } })
    if (error) { setErro(L.erro); setFicheiros([]) }
    else setFicheiros((data || []).filter(f => f.id !== null))
    setACarregar(false)
  }, [userId, mes]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { listar() }, [listar])

  // Nome já existe? Acrescenta (2), (3)… em vez de substituir o que lá está.
  function nomeLivre(nome, existentes) {
    if (!existentes.includes(nome)) return nome
    const ponto = nome.lastIndexOf('.')
    const base = ponto > 0 ? nome.slice(0, ponto) : nome
    const ext = ponto > 0 ? nome.slice(ponto) : ''
    let n = 2
    while (existentes.includes(`${base} (${n})${ext}`)) n++
    return `${base} (${n})${ext}`
  }

  async function enviar(lista) {
    if (!lista?.length) return
    setAEnviar(true); setErro(''); setOk('')
    const existentes = ficheiros.map(f => f.name)
    for (const f of lista) {
      const nome = nomeLivre(f.name, existentes)
      const { error } = await supabase.storage.from(BUCKET)
        .upload(`${userId}/${mes}/${nome}`, f, { upsert: false })
      if (error) { setErro(L.erro); break }
      existentes.push(nome)
    }
    setAEnviar(false)
    if (inputRef.current) inputRef.current.value = ''
    setOk(L.enviado)
    setTimeout(() => setOk(''), 2500)
    listar()
  }

  async function abrir(nome) {
    const { data, error } = await supabase.storage.from(BUCKET)
      .createSignedUrl(`${userId}/${mes}/${nome}`, 120)
    if (error || !data?.signedUrl) { setErro(L.erro); return }
    window.open(data.signedUrl, '_blank', 'noopener')
  }

  const kb = (n) => n == null ? '' : n < 1024 * 1024
    ? `${Math.max(1, Math.round(n / 1024))} kB`
    : `${(n / 1024 / 1024).toFixed(1)} MB`

  const inputStyle = { padding: '10px 12px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '14px', outline: 'none', cursor: 'pointer' }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <div style={{ flex: isMobile ? '1 1 100%' : '0 0 220px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '5px' }}>{L.mes}</div>
          <select value={mes} onChange={e => setMes(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
            {meses.map(m => <option key={m.chave} value={m.chave}>{m.nome}</option>)}
          </select>
        </div>
        <label style={{ padding: '11px 18px', background: t.btnBg, color: t.btnInk, borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: aEnviar ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}>
          {aEnviar ? L.aEnviar : L.enviar}
          <input ref={inputRef} type="file" multiple disabled={aEnviar}
            onChange={e => enviar(Array.from(e.target.files || []))} style={{ display: 'none' }} />
        </label>
        {ok && <span style={{ fontSize: '12.5px', fontWeight: 700, color: t.dueOk.ink }}>{ok}</span>}
      </div>

      {erro && <div style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '9px', padding: '10px 13px', fontSize: '12.5px', fontWeight: 600, marginBottom: '12px' }}>{erro}</div>}

      <div style={{ background: t.softCardBg, borderRadius: '11px', padding: '4px 14px' }}>
        {aCarregar && <div style={{ padding: '14px 0', fontSize: '12.5px', color: t.subtle }}>…</div>}
        {!aCarregar && !ficheiros.length && <div style={{ padding: '14px 0', fontSize: '12.5px', color: t.subtle }}>{L.vazio}</div>}
        {ficheiros.map(f => (
          <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: `1px solid ${t.cardBorder}` }}>
            <span style={{ flex: 1, minWidth: 0, fontSize: '13px', color: t.heading, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
            <span style={{ flex: 'none', fontSize: '11.5px', color: t.subtle, fontVariantNumeric: 'tabular-nums' }}>{kb(f.metadata?.size)}</span>
            <button onClick={() => abrir(f.name)}
              style={{ flex: 'none', padding: '5px 12px', minHeight: '32px', background: 'transparent', border: `1px solid ${t.cardBorder}`, borderRadius: '7px', fontSize: '11.5px', fontWeight: 700, color: t.accentText, cursor: 'pointer' }}>{L.abrir}</button>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '11px', color: t.subtle, marginTop: '9px' }}>{L.aviso}</div>
    </div>
  )
}
