import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { BLOCOS, SWOT_QUADRANTES, TOWS_CELULAS, progressoBloco, progressoTotal } from '../../data/consultoriaBlocos'

// Ficha da consultoria — usada AO VIVO, muitas vezes presencial e com o cliente
// a ver o ecrã. Daí: guardar automático (nada de botão), campos que crescem com
// o texto e o TOWS a mostrar de onde vem cada estratégia.

export default function ConsultoriaDetalhe() {
  const { id } = useParams()
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  const [c, setC] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [estado, setEstado] = useState('')     // '', 'a guardar', 'guardado'
  const [blocoAtivo, setBlocoAtivo] = useState(1)
  const [novaEstrategia, setNovaEstrategia] = useState({})   // { celulaKey: { texto, origem:[] } }
  const timer = useRef(null)

  const L = lang === 'de' ? {
    voltar: '← Beratungen', guardado: 'Gespeichert ✓', aGuardar: 'Wird gespeichert…',
    bloco: 'Block', porConstruir: 'Dieser Block kommt in der nächsten Phase.',
    swotVazio: 'Fügen Sie Punkte in die vier Quadranten ein.',
    towsAjuda: 'Was soll ich mit dem tun, was die SWOT gezeigt hat?',
    origem: 'Woraus entsteht', addEstrategia: 'Strategie hinzufügen', escolherOrigem: 'Punkte anklicken, aus denen die Strategie entsteht',
    add: 'Hinzufügen', remover: 'Entfernen', semItens: 'Noch keine Punkte in der SWOT.',
    contacto: 'Kontakt', estado: 'Status', ativa: 'Laufend', concluida: 'Abgeschlossen', pausada: 'Pausiert',
    tGratuita: 'Kostenlos', tImplementacao: 'Geschäftsaufbau',
    notas: 'Interne Notizen', recursos: 'Ressourcen (Links)', addLink: '+ Link',
    titulo: 'Titel', url: 'URL', loading: 'Wird geladen…', erroSave: 'Speichern fehlgeschlagen.',
    naoEncontrada: 'Beratung nicht gefunden.',
  } : lang === 'en' ? {
    voltar: '← Consultancies', guardado: 'Saved ✓', aGuardar: 'Saving…',
    bloco: 'Block', porConstruir: 'This block arrives in the next phase.',
    swotVazio: 'Add items to the four quadrants.',
    towsAjuda: 'With what the SWOT revealed, what should I do?',
    origem: 'Comes from', addEstrategia: 'Add strategy', escolherOrigem: 'Click the items this strategy comes from',
    add: 'Add', remover: 'Remove', semItens: 'No SWOT items yet.',
    contacto: 'Contact', estado: 'Status', ativa: 'Active', concluida: 'Completed', pausada: 'Paused',
    tGratuita: 'Free', tImplementacao: 'Business setup',
    notas: 'Internal notes', recursos: 'Resources (links)', addLink: '+ Link',
    titulo: 'Title', url: 'URL', loading: 'Loading…', erroSave: 'Save failed.',
    naoEncontrada: 'Consultancy not found.',
  } : {
    voltar: '← Consultorias', guardado: 'Guardado ✓', aGuardar: 'A guardar…',
    bloco: 'Bloco', porConstruir: 'Este bloco chega na próxima fase.',
    swotVazio: 'Acrescenta pontos aos quatro quadrantes.',
    towsAjuda: 'Com aquilo que a SWOT mostrou, o que devo fazer?',
    origem: 'Nasce de', addEstrategia: 'Acrescentar estratégia', escolherOrigem: 'Clica nos pontos de onde nasce a estratégia',
    add: 'Acrescentar', remover: 'Remover', semItens: 'Ainda não há pontos na SWOT.',
    contacto: 'Contacto', estado: 'Estado', ativa: 'Ativa', concluida: 'Concluída', pausada: 'Pausada',
    tGratuita: 'Gratuita', tImplementacao: 'Implementação de negócio',
    notas: 'Notas internas', recursos: 'Recursos (links)', addLink: '+ Link',
    titulo: 'Título', url: 'URL', loading: 'A carregar…', erroSave: 'Falha ao guardar.',
    naoEncontrada: 'Consultoria não encontrada.',
  }

  const txt = (o, campo = '') => {
    if (!o) return ''
    const k = campo ? campo + lang.charAt(0).toUpperCase() + lang.slice(1) : lang
    return o[k] ?? o[campo ? campo + 'Pt' : 'pt'] ?? ''
  }

  useEffect(() => {
    (async () => {
      setLoading(true)
      const { data } = await supabase.from('consultorias').select('*').eq('id', id).maybeSingle()
      setC(data || null)
      if (data?.bloco) setBlocoAtivo(data.bloco)
      setLoading(false)
    })()
  }, [id])

  // ── Guardar automático: o campo muda o estado local e agenda a gravação ──
  const guardar = useCallback(async (patch) => {
    setEstado(L.aGuardar)
    const { error } = await supabase.from('consultorias')
      .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { setErro(L.erroSave); setEstado(''); return }
    setErro(''); setEstado(L.guardado)
    setTimeout(() => setEstado(''), 1800)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const alterar = (patch, imediato = false) => {
    setC(prev => ({ ...prev, ...patch }))
    clearTimeout(timer.current)
    if (imediato) guardar(patch)
    else timer.current = setTimeout(() => guardar(patch), 700)
  }
  useEffect(() => () => clearTimeout(timer.current), [])

  const responder = (key, valor) =>
    alterar({ respostas: { ...(c.respostas || {}), [key]: valor } })

  // ── SWOT ──
  const addSwot = (q, texto) => {
    if (!texto.trim()) return
    const atual = c.swot?.[q] || []
    alterar({ swot: { ...(c.swot || {}), [q]: [...atual, texto.trim()] } }, true)
  }
  const removeSwot = (q, i) => {
    const atual = [...(c.swot?.[q] || [])]; atual.splice(i, 1)
    alterar({ swot: { ...(c.swot || {}), [q]: atual } }, true)
  }

  // ── TOWS ──
  const addTows = (cel) => {
    const n = novaEstrategia[cel.key]
    if (!n?.texto?.trim()) return
    const atual = c.tows?.[cel.key] || []
    alterar({ tows: { ...(c.tows || {}), [cel.key]: [...atual, { texto: n.texto.trim(), origem: n.origem || [] }] } }, true)
    setNovaEstrategia(p => ({ ...p, [cel.key]: { texto: '', origem: [] } }))
  }
  const removeTows = (celKey, i) => {
    const atual = [...(c.tows?.[celKey] || [])]; atual.splice(i, 1)
    alterar({ tows: { ...(c.tows || {}), [celKey]: atual } }, true)
  }
  const toggleOrigem = (celKey, ref) => {
    setNovaEstrategia(p => {
      const cur = p[celKey] || { texto: '', origem: [] }
      const tem = cur.origem.includes(ref)
      return { ...p, [celKey]: { ...cur, origem: tem ? cur.origem.filter(x => x !== ref) : [...cur.origem, ref] } }
    })
  }

  // ── Recursos ──
  const addRecurso = () => alterar({ recursos: [...(c.recursos || []), { titulo: '', url: '' }] }, true)
  const setRecurso = (i, campo, v) => {
    const r = [...(c.recursos || [])]; r[i] = { ...r[i], [campo]: v }
    alterar({ recursos: r })
  }
  const removeRecurso = (i) => {
    const r = [...(c.recursos || [])]; r.splice(i, 1)
    alterar({ recursos: r }, true)
  }

  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px' }
  const inputStyle = { padding: '9px 11px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: t.fontBody }
  const lblStyle = { fontSize: '10.5px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }

  if (loading) return <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.loading}</div>
  if (!c) return <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.naoEncontrada}</div>

  const b = BLOCOS.find(x => x.n === blocoAtivo)
  const prog = progressoTotal(c)
  const swotItens = (q) => c.swot?.[q] || []

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody, maxWidth: '1020px' }}>
      {/* Cabeçalho */}
      <button onClick={() => navigate('/gestao/consultorias')} style={{ background: 'none', border: 'none', color: t.accent, fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: '12px' }}>{L.voltar}</button>

      <div style={{ ...card, padding: '18px 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input value={c.nome} onChange={e => alterar({ nome: e.target.value })}
              style={{ ...inputStyle, border: 'none', background: 'transparent', padding: 0, fontFamily: t.fontDisplay, fontSize: isMobile ? '24px' : '30px', fontWeight: 600, color: t.heading, letterSpacing: '-.5px' }} />
            <input value={c.empresa || ''} onChange={e => alterar({ empresa: e.target.value })} placeholder="—"
              style={{ ...inputStyle, border: 'none', background: 'transparent', padding: 0, fontSize: '13px', color: t.textMuted, marginTop: '2px' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap' }}>
            {estado && <span style={{ fontSize: '11.5px', fontWeight: 700, color: estado === L.guardado ? '#0a7a3e' : t.subtle }}>{estado}</span>}
            {erro && <span style={{ fontSize: '11.5px', fontWeight: 700, color: t.neg }}>{erro}</span>}
            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 700, background: t.chipBg, color: t.chipText }}>{c.tipo === 'gratuita' ? L.tGratuita : L.tImplementacao}</span>
            <select value={c.status} onChange={e => alterar({ status: e.target.value }, true)} style={{ ...inputStyle, width: 'auto', cursor: 'pointer', fontSize: '12px', padding: '6px 9px' }}>
              <option value="ativa">{L.ativa}</option><option value="concluida">{L.concluida}</option><option value="pausada">{L.pausada}</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: '10px' }}>
          {[['email', 'E-mail'], ['telefone', L.contacto], ['setor', 'Setor']].map(([campo, rot]) => (
            <div key={campo}><div style={lblStyle}>{rot}</div>
              <input value={c[campo] || ''} onChange={e => alterar({ [campo]: e.target.value })} style={inputStyle} /></div>
          ))}
        </div>
      </div>

      {/* Stepper dos 4 blocos */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {BLOCOS.map(bl => {
          const p = progressoBloco(bl.n, c)
          const on = bl.n === blocoAtivo
          return (
            <button key={bl.n} onClick={() => { setBlocoAtivo(bl.n); if (c.bloco !== bl.n) alterar({ bloco: bl.n }, true) }}
              style={{ flex: isMobile ? '1 1 45%' : '1 1 0', textAlign: 'left', padding: '11px 13px', borderRadius: '11px', cursor: 'pointer',
                border: `1px solid ${on ? t.accent : t.cardBorder}`, background: on ? t.softCardBg : t.cardBg, opacity: bl.porConstruir ? .65 : 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '5px' }}>
                <span style={{ width: '19px', height: '19px', borderRadius: '50%', background: on ? t.accent : t.trackBg, color: on ? '#0a2f1a' : t.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800 }}>{bl.n}</span>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: on ? t.heading : t.textMuted }}>{txt(bl)}</span>
              </div>
              <div style={{ height: '4px', borderRadius: '20px', background: t.trackBg, overflow: 'hidden' }}>
                <div style={{ width: `${p.pct}%`, height: '100%', background: t.accent }} />
              </div>
            </button>
          )
        })}
      </div>

      {/* Bloco ativo */}
      <div style={{ fontSize: '12px', color: t.textMuted, marginBottom: '14px' }}>{txt(b, 'sub')}</div>

      {b.porConstruir && (
        <div style={{ ...card, padding: '30px 24px', textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🚧</div>
          <div style={{ fontSize: '13px', color: t.textMuted }}>{L.porConstruir}</div>
        </div>
      )}

      {(b.seccoes || []).map(sec => (
        <div key={sec.key} style={{ ...card, padding: '18px 20px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '9px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: t.accent }}>{sec.num}</span>
            <h3 style={{ margin: 0, fontFamily: t.fontDisplay, fontSize: '18px', fontWeight: 600, color: t.heading }}>{txt(sec)}</h3>
          </div>
          {txt(sec, 'nota') && <p style={{ fontSize: '11.5px', color: t.subtle, margin: '0 0 14px', lineHeight: 1.5 }}>ⓘ {txt(sec, 'nota')}</p>}

          {/* Perguntas */}
          {(sec.perguntas || []).map(q => (
            <div key={q.key} style={{ padding: '11px 0', borderTop: `1px solid ${t.rowBorder || t.cardBorder}` }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: t.heading, marginBottom: '6px', lineHeight: 1.45 }}>{txt(q)}</div>
              <textarea value={c.respostas?.[q.key] || ''} onChange={e => responder(q.key, e.target.value)} rows={2}
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          ))}

          {/* SWOT */}
          {sec.tipo === 'swot' && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px', marginTop: '12px' }}>
              {SWOT_QUADRANTES.map(q => (
                <QuadranteSwot key={q.key} q={q} itens={swotItens(q.key)} t={t} txt={txt} lang={lang}
                  onAdd={(v) => addSwot(q.key, v)} onRemove={(i) => removeSwot(q.key, i)} inputStyle={inputStyle} />
              ))}
              {/* Perguntas de apoio do documento original */}
              {sec.apoio && (
                <div style={{ gridColumn: isMobile ? 'auto' : 'span 2', background: t.softCardBg, borderRadius: '11px', padding: '12px 14px' }}>
                  <div style={{ ...lblStyle, marginBottom: '7px' }}>ⓘ {lang === 'de' ? 'Leitfragen' : lang === 'en' ? 'Prompts' : 'Perguntas de apoio'}</div>
                  {sec.apoio.map((a, i) => {
                    const quad = SWOT_QUADRANTES.find(x => x.key === a.quadrante)
                    return (
                      <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '11.5px', color: t.text, marginBottom: '5px', lineHeight: 1.45 }}>
                        <span style={{ flex: 'none', fontSize: '9px', fontWeight: 800, padding: '1px 7px', borderRadius: '20px', background: quad?.bg, color: quad?.cor, marginTop: '1px' }}>{txt(quad)}</span>
                        <span>{txt(a)}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TOWS */}
          {sec.tipo === 'tows' && (
            <div style={{ marginTop: '10px' }}>
              <p style={{ fontSize: '12.5px', color: t.text, margin: '0 0 14px', fontStyle: 'italic' }}>{L.towsAjuda}</p>
              {SWOT_QUADRANTES.every(q => !swotItens(q.key).length) ? (
                <div style={{ background: t.softCardBg, borderRadius: '11px', padding: '18px', textAlign: 'center', fontSize: '12.5px', color: t.textMuted }}>{L.semItens}</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                  {TOWS_CELULAS.map(cel => (
                    <CelulaTows key={cel.key} cel={cel} c={c} t={t} txt={txt} L={L} lang={lang}
                      swotItens={swotItens} nova={novaEstrategia[cel.key] || { texto: '', origem: [] }}
                      onTexto={(v) => setNovaEstrategia(p => ({ ...p, [cel.key]: { ...(p[cel.key] || { origem: [] }), texto: v } }))}
                      onToggleOrigem={(ref) => toggleOrigem(cel.key, ref)}
                      onAdd={() => addTows(cel)} onRemove={(i) => removeTows(cel.key, i)}
                      inputStyle={inputStyle} lblStyle={lblStyle} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Notas internas + recursos */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1fr', gap: '14px', marginTop: '4px' }}>
        <div style={{ ...card, padding: '18px 20px' }}>
          <div style={lblStyle}>{L.notas}</div>
          <textarea value={c.notas || ''} onChange={e => alterar({ notas: e.target.value })} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
        <div style={{ ...card, padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '9px' }}>
            <span style={lblStyle}>{L.recursos}</span>
            <button onClick={addRecurso} style={{ background: 'none', border: 'none', color: t.accent, fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}>{L.addLink}</button>
          </div>
          {(c.recursos || []).map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
              <input value={r.titulo || ''} onChange={e => setRecurso(i, 'titulo', e.target.value)} placeholder={L.titulo} style={{ ...inputStyle, flex: 1, fontSize: '12px', padding: '7px 9px' }} />
              <input value={r.url || ''} onChange={e => setRecurso(i, 'url', e.target.value)} placeholder={L.url} style={{ ...inputStyle, flex: 1.2, fontSize: '12px', padding: '7px 9px' }} />
              <button onClick={() => removeRecurso(i)} style={{ background: 'none', border: 'none', color: t.subtle, cursor: 'pointer', fontSize: '13px', padding: '0 4px' }}>✕</button>
            </div>
          ))}
          {!(c.recursos || []).length && <div style={{ fontSize: '11.5px', color: t.subtle }}>—</div>}
        </div>
      </div>

      <div style={{ fontSize: '11px', color: t.subtle, marginTop: '14px', textAlign: 'right' }}>{prog.feitas}/{prog.total}</div>
    </div>
  )
}

// ── Quadrante da SWOT ──────────────────────────────────────────────────────
function QuadranteSwot({ q, itens, t, txt, onAdd, onRemove, inputStyle }) {
  const [v, setV] = useState('')
  const submeter = () => { onAdd(v); setV('') }
  return (
    <div style={{ background: t.softCardBg, borderRadius: '12px', padding: '13px 15px', borderTop: `3px solid ${q.cor}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '9px' }}>
        <span style={{ fontSize: '13px', fontWeight: 800, color: q.cor }}>{txt(q)}</span>
        <span style={{ fontSize: '10px', color: t.subtle }}>{q.eixo} {q.sinal}</span>
        <span style={{ marginLeft: 'auto', fontSize: '10.5px', fontWeight: 700, color: t.subtle }}>{itens.length}</span>
      </div>
      {itens.map((it, i) => (
        <div key={i} style={{ display: 'flex', gap: '7px', alignItems: 'flex-start', fontSize: '12px', color: t.text, padding: '5px 0', borderTop: i ? `1px solid ${t.rowBorder || t.cardBorder}` : 'none', lineHeight: 1.4 }}>
          <span style={{ flex: 1 }}>{it}</span>
          <button onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', color: t.subtle, cursor: 'pointer', fontSize: '11px', padding: 0, flex: 'none' }}>✕</button>
        </div>
      ))}
      <input value={v} onChange={e => setV(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submeter() }} onBlur={submeter}
        placeholder="+" style={{ ...inputStyle, marginTop: '7px', fontSize: '12px', padding: '7px 9px' }} />
    </div>
  )
}

// ── Célula do TOWS ─────────────────────────────────────────────────────────
// Mostra os itens da SWOT que alimentam este cruzamento; ao clicar, marcam-se
// como origem da estratégia — é o que torna a estratégia rastreável.
function CelulaTows({ cel, c, t, txt, L, swotItens, nova, onTexto, onToggleOrigem, onAdd, onRemove, inputStyle, lblStyle }) {
  const q1 = SWOT_QUADRANTES.find(q => q.key === cel.de1)
  const q2 = SWOT_QUADRANTES.find(q => q.key === cel.de2)
  const fontes = [
    ...swotItens(cel.de1).map((it, i) => ({ ref: `${cel.de1}:${i}`, texto: it, q: q1 })),
    ...swotItens(cel.de2).map((it, i) => ({ ref: `${cel.de2}:${i}`, texto: it, q: q2 })),
  ]
  const estrategias = c.tows?.[cel.key] || []
  const rotuloDe = (ref) => {
    const [qk, i] = ref.split(':')
    return swotItens(qk)[Number(i)] || ''
  }
  return (
    <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: '12px', padding: '13px 15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px' }}>
        <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', background: t.chipBg, color: t.chipText }}>{cel.sigla}</span>
        <span style={{ fontSize: '13px', fontWeight: 800, color: t.heading }}>{txt(cel)}</span>
      </div>
      <div style={{ fontSize: '11px', color: t.subtle, marginBottom: '10px', lineHeight: 1.4 }}>{txt(cel, 'de')}</div>

      {/* Estratégias já escritas, com a origem à vista */}
      {estrategias.map((e, i) => (
        <div key={i} style={{ background: t.softCardBg, borderRadius: '9px', padding: '9px 11px', marginBottom: '7px' }}>
          <div style={{ display: 'flex', gap: '7px', alignItems: 'flex-start' }}>
            <span style={{ flex: 1, fontSize: '12.5px', color: t.text, lineHeight: 1.45 }}>{e.texto}</span>
            <button onClick={() => onRemove(i)} style={{ background: 'none', border: 'none', color: t.subtle, cursor: 'pointer', fontSize: '11px', padding: 0 }}>✕</button>
          </div>
          {!!(e.origem || []).length && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
              <span style={{ fontSize: '9.5px', color: t.subtle, fontWeight: 700 }}>{L.origem}:</span>
              {e.origem.map(ref => {
                const q = SWOT_QUADRANTES.find(x => x.key === ref.split(':')[0])
                return <span key={ref} style={{ fontSize: '9.5px', padding: '1px 7px', borderRadius: '20px', background: q?.bg, color: q?.cor, fontWeight: 600 }}>{rotuloDe(ref)}</span>
              })}
            </div>
          )}
        </div>
      ))}

      {/* Nova estratégia: escolher origem e escrever */}
      {fontes.length > 0 && (
        <>
          <div style={{ ...lblStyle, marginTop: '10px', marginBottom: '5px' }}>{L.escolherOrigem}</div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '7px' }}>
            {fontes.map(f => {
              const on = (nova.origem || []).includes(f.ref)
              return (
                <button key={f.ref} onClick={() => onToggleOrigem(f.ref)} title={f.texto}
                  style={{ fontSize: '10px', padding: '3px 9px', borderRadius: '20px', cursor: 'pointer', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    border: `1px solid ${on ? f.q.cor : t.cardBorder}`, background: on ? f.q.bg : 'transparent', color: on ? f.q.cor : t.textMuted, fontWeight: on ? 700 : 500 }}>
                  {on ? '✓ ' : ''}{f.texto}
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input value={nova.texto || ''} onChange={e => onTexto(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onAdd() }}
              placeholder={L.addEstrategia} style={{ ...inputStyle, fontSize: '12px', padding: '7px 9px' }} />
            <button onClick={onAdd} disabled={!nova.texto?.trim()} style={{ padding: '7px 12px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '11.5px', cursor: nova.texto?.trim() ? 'pointer' : 'default', opacity: nova.texto?.trim() ? 1 : .45, whiteSpace: 'nowrap' }}>{L.add}</button>
          </div>
        </>
      )}
    </div>
  )
}
