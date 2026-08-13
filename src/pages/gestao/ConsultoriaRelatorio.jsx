import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { progressoTotal } from '../../data/consultoriaBlocos'

// Relatório da consultoria — o documento que vai ao banco.
// A IA escreve o primeiro rascunho a partir da ficha; a consultora edita por
// cima. O texto dela ganha sempre à IA e sobrevive a uma nova geração.

const SECCOES = [
  { key: 'sumario',    pt: 'Sumário',                               de: 'Zusammenfassung',                en: 'Summary' },
  { key: 'ideia',      pt: 'A ideia de negócio e a pessoa',          de: 'Geschäftsidee und Person',       en: 'The business idea and the person' },
  { key: 'mercado',    pt: 'Mercado, clientes e concorrência',       de: 'Markt, Kunden, Wettbewerb',      en: 'Market, customers and competition' },
  { key: 'estrategia', pt: 'SWOT e estratégias',                     de: 'SWOT und Strategien',            en: 'SWOT and strategies' },
  { key: 'capital',    pt: 'Necessidade de capital e financiamento', de: 'Kapitalbedarf und Finanzierung', en: 'Capital needs and financing' },
  { key: 'projecoes',  pt: 'Projeções e viabilidade',                de: 'Vorschau und Tragfähigkeit',     en: 'Projections and viability' },
]

export default function ConsultoriaRelatorio() {
  const { id } = useParams()
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  const [c, setC] = useState(null)
  const [loading, setLoading] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState('')
  const [estado, setEstado] = useState('')
  const timer = useRef(null)

  const L = lang === 'de' ? {
    voltar: '← Zur Beratung', eyebrow: 'Beratung', title: 'Bericht',
    subtitle: 'Der KI-Entwurf beschreibt, was ausgefüllt wurde. Ihr Text hat immer Vorrang.',
    gerar: '✨ Mit KI erstellen', regerar: '✨ Neu erstellen', gerando: 'Wird erstellt… das dauert etwas',
    print: '🖨 Drucken / PDF', vazio: 'Noch kein Bericht. Erstellen Sie den ersten Entwurf.',
    lacunas: 'Was noch fehlt', geradoEm: 'Erstellt am', editado: 'von Ihnen bearbeitet',
    reporEditado: 'Meinen Text verwerfen', preenchido: 'ausgefüllt',
    loading: 'Wird geladen…', guardado: 'Gespeichert ✓', aGuardar: 'Wird gespeichert…',
    naoEncontrada: 'Beratung nicht gefunden.', semDados: 'Füllen Sie zuerst die Beratung aus.',
    aviso: 'Die KI beschreibt nur — sie beurteilt das Geschäft nicht. Prüfen Sie den Text vor dem Versand.',
  } : lang === 'en' ? {
    voltar: '← Back to consultancy', eyebrow: 'Consultancy', title: 'Report',
    subtitle: 'The AI draft describes what was filled in. Your text always wins.',
    gerar: '✨ Generate with AI', regerar: '✨ Regenerate', gerando: 'Generating… this takes a moment',
    print: '🖨 Print / PDF', vazio: 'No report yet. Generate the first draft.',
    lacunas: 'What is still missing', geradoEm: 'Generated on', editado: 'edited by you',
    reporEditado: 'Discard my text', preenchido: 'filled in',
    loading: 'Loading…', guardado: 'Saved ✓', aGuardar: 'Saving…',
    naoEncontrada: 'Consultancy not found.', semDados: 'Fill in the consultancy first.',
    aviso: 'The AI only describes — it does not judge the business. Review the text before sending.',
  } : {
    voltar: '← Voltar à consultoria', eyebrow: 'Consultoria', title: 'Relatório',
    subtitle: 'O rascunho da IA descreve o que foi preenchido. O teu texto ganha sempre.',
    gerar: '✨ Gerar com IA', regerar: '✨ Gerar de novo', gerando: 'A gerar… demora um pouco',
    print: '🖨 Imprimir / PDF', vazio: 'Ainda não há relatório. Gera o primeiro rascunho.',
    lacunas: 'O que ainda falta', geradoEm: 'Gerado em', editado: 'editado por ti',
    reporEditado: 'Descartar o meu texto', preenchido: 'preenchido',
    loading: 'A carregar…', guardado: 'Guardado ✓', aGuardar: 'A guardar…',
    naoEncontrada: 'Consultoria não encontrada.', semDados: 'Preenche primeiro a consultoria.',
    aviso: 'A IA apenas descreve — não julga o negócio. Revê o texto antes de o enviares.',
  }

  const titulo = (s) => s[lang] || s.pt

  useEffect(() => {
    (async () => {
      setLoading(true)
      const { data } = await supabase.from('consultorias').select('*').eq('id', id).maybeSingle()
      setC(data || null); setLoading(false)
    })()
  }, [id])
  useEffect(() => () => clearTimeout(timer.current), [])

  const rel = c?.relatorio || {}
  const gerado = Object.fromEntries((rel.seccoes || []).map(s => [s.key, s.texto]))
  const editado = rel.editado || {}
  // O texto dela sobrepõe-se ao da IA, secção a secção
  const textoDe = (key) => (editado[key] !== undefined ? editado[key] : (gerado[key] || ''))
  const temRelatorio = (rel.seccoes || []).length > 0 || Object.keys(editado).length > 0
  const prog = c ? progressoTotal(c) : { feitas: 0, total: 0, pct: 0 }

  async function gerar() {
    setGerando(true); setErro('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Sessão expirada.')
      const r = await fetch('/api/consultoria-relatorio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ id, lang }),
      })
      const json = await r.json()
      if (!r.ok) throw new Error(json?.error || `Erro ${r.status}`)
      setC(prev => ({ ...prev, relatorio: json.relatorio }))
    } catch (e) {
      setErro(e.message)
    } finally {
      setGerando(false)
    }
  }

  function editar(key, valor) {
    const novo = { ...rel, editado: { ...editado, [key]: valor } }
    setC(prev => ({ ...prev, relatorio: novo }))
    clearTimeout(timer.current)
    setEstado(L.aGuardar)
    timer.current = setTimeout(async () => {
      await supabase.from('consultorias').update({ relatorio: novo, updated_at: new Date().toISOString() }).eq('id', id)
      setEstado(L.guardado); setTimeout(() => setEstado(''), 1800)
    }, 700)
  }

  async function reporSeccao(key) {
    const e = { ...editado }; delete e[key]
    const novo = { ...rel, editado: e }
    setC(prev => ({ ...prev, relatorio: novo }))
    await supabase.from('consultorias').update({ relatorio: novo, updated_at: new Date().toISOString() }).eq('id', id)
  }

  // Impressão: janela nova com HTML próprio, como no Relatório ESG
  function imprimir() {
    const esc = (s) => String(s ?? '').replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]))
    const corpo = SECCOES.map(s => {
      const txt = textoDe(s.key)
      if (!txt.trim()) return ''
      return `<h2>${esc(titulo(s))}</h2><p class="txt">${esc(txt).replace(/\n/g, '<br/>')}</p>`
    }).join('')
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(L.title)} — ${esc(c.nome)}</title><style>
      body{font-family:Georgia,serif;color:#1a2b20;max-width:760px;margin:40px auto;padding:0 20px;line-height:1.6}
      h1{font-size:26px;margin-bottom:4px} .sub{color:#667;font-size:13px;margin-bottom:28px}
      h2{font-size:17px;border-bottom:2px solid #c9a84c;padding-bottom:4px;margin-top:30px}
      .txt{font-size:13.5px;white-space:pre-wrap;text-align:justify}
      .pe{margin-top:40px;padding-top:12px;border-top:1px solid #ddd;color:#889;font-size:10.5px}
      @page{margin:18mm}
    </style></head><body>
      <h1>${esc(L.title)}</h1>
      <div class="sub">${esc(c.nome)}${c.empresa ? ` · ${esc(c.empresa)}` : ''}${c.setor ? ` · ${esc(c.setor)}` : ''}</div>
      ${corpo || `<p class="txt">${esc(L.vazio)}</p>`}
      <div class="pe">Lúcia Cílio · Office Consulting${rel.gerado_em ? ` — ${new Date(rel.gerado_em).toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-GB' : 'pt-PT')}` : ''}</div>
    </body></html>`
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html); w.document.close()
    setTimeout(() => w.print(), 300)
  }

  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px' }

  if (loading) return <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.loading}</div>
  if (!c) return <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.naoEncontrada}</div>

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody, maxWidth: '860px' }}>
      <button onClick={() => navigate(`/gestao/consultorias/${id}`)} style={{ background: 'none', border: 'none', color: t.accent, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: '12px' }}>{L.voltar}</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accent }}>{L.eyebrow}</div>
          <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '27px' : '34px', lineHeight: 1.05, letterSpacing: '-.5px', color: t.heading }}>{L.title}</h1>
          <p style={{ fontSize: '12.5px', color: t.textMuted, margin: '8px 0 0', maxWidth: '520px', lineHeight: 1.5 }}>
            {c.nome}{c.empresa ? ` · ${c.empresa}` : ''} — {prog.pct}% {L.preenchido}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {estado && <span style={{ fontSize: '11.5px', fontWeight: 700, color: estado === L.guardado ? '#0a7a3e' : t.subtle }}>{estado}</span>}
          {temRelatorio && (
            <button onClick={imprimir} style={{ padding: '9px 15px', borderRadius: '10px', border: `1px solid ${t.cardBorder}`, background: t.cardBg, color: t.heading, fontWeight: 700, fontSize: '12.5px', cursor: 'pointer' }}>{L.print}</button>
          )}
          <button onClick={gerar} disabled={gerando || prog.feitas === 0}
            title={prog.feitas === 0 ? L.semDados : ''}
            style={{ padding: '10px 20px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: gerando || prog.feitas === 0 ? 'default' : 'pointer', opacity: gerando || prog.feitas === 0 ? .55 : 1 }}>
            {gerando ? L.gerando : temRelatorio ? L.regerar : L.gerar}
          </button>
        </div>
      </div>

      <p style={{ fontSize: '11.5px', color: t.subtle, margin: '0 0 16px', lineHeight: 1.5 }}>ⓘ {L.subtitle} {L.aviso}</p>

      {erro && <div style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '10px', padding: '11px 15px', fontSize: '12.5px', fontWeight: 600, marginBottom: '14px' }}>{erro}</div>}

      {gerando && (
        <div style={{ ...card, padding: '30px 24px', textAlign: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '26px', marginBottom: '8px' }}>✨</div>
          <div style={{ fontSize: '13px', color: t.textMuted }}>{L.gerando}</div>
        </div>
      )}

      {!gerando && !temRelatorio && (
        <div style={{ ...card, padding: '34px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: '34px', marginBottom: '10px' }}>📄</div>
          <div style={{ fontSize: '14px', color: t.textMuted }}>{prog.feitas === 0 ? L.semDados : L.vazio}</div>
        </div>
      )}

      {/* Lacunas — o que a IA deu por faltar */}
      {!!(rel.lacunas || []).length && (
        <div style={{ background: t.dueSoon.bg, borderRadius: '12px', padding: '14px 17px', marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: t.dueSoon.ink, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '7px' }}>{L.lacunas}</div>
          {rel.lacunas.map((x, i) => (
            <div key={i} style={{ fontSize: '12.5px', color: t.dueSoon.ink, lineHeight: 1.5, marginBottom: '3px' }}>• {x}</div>
          ))}
        </div>
      )}

      {/* Secções editáveis */}
      {temRelatorio && SECCOES.map(s => {
        const txt = textoDe(s.key)
        const foiEditada = editado[s.key] !== undefined
        return (
          <div key={s.key} style={{ ...card, padding: '18px 20px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontFamily: t.fontDisplay, fontSize: '17px', fontWeight: 600, color: t.heading }}>{titulo(s)}</h3>
              {foiEditada && (
                <>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: t.chipBg, color: t.chipText }}>{L.editado}</span>
                  {gerado[s.key] && (
                    <button onClick={() => reporSeccao(s.key)} style={{ background: 'none', border: 'none', color: t.subtle, fontSize: '10.5px', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>{L.reporEditado}</button>
                  )}
                </>
              )}
            </div>
            <textarea value={txt} onChange={e => editar(s.key, e.target.value)} rows={Math.max(4, Math.ceil(txt.length / 90))}
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: '10px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.text, fontSize: '13.5px', lineHeight: 1.6, outline: 'none', resize: 'vertical', fontFamily: t.fontBody }} />
          </div>
        )
      })}

      {rel.gerado_em && (
        <div style={{ fontSize: '10.5px', color: t.subtle, textAlign: 'right', marginTop: '10px' }}>
          {L.geradoEm} {new Date(rel.gerado_em).toLocaleString(lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-GB' : 'pt-PT')}
          {rel.modelo ? ` · ${rel.modelo}` : ''}
        </div>
      )}
    </div>
  )
}
