import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { BLOCOS, progressoTotal, progressoBloco } from '../../data/consultoriaBlocos'

// Lista de consultorias. A Lúcia trabalha aqui como administradora e regista o
// contacto sem criar conta ao cliente (decisão da reunião de 13/08).

const EMPTY = { nome: '', empresa: '', email: '', telefone: '', setor: '', tipo: 'implementacao' }

export default function Consultorias() {
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filtro, setFiltro] = useState('ativa')

  const L = lang === 'de' ? {
    eyebrow: 'Verwaltung', title: 'Beratungen', subtitle: 'Begleitete Beratungen — Kontakt wird ohne Konto erfasst.',
    nova: '+ Neue Beratung', nome: 'Name', empresa: 'Firma', email: 'E-Mail', telefone: 'Telefon', setor: 'Branche',
    tipo: 'Art', tGratuita: 'Kostenlos', tImplementacao: 'Geschäftsaufbau',
    criar: 'Anlegen und beginnen', cancelar: 'Abbrechen', abrir: 'Öffnen →',
    ativa: 'Laufend', concluida: 'Abgeschlossen', pausada: 'Pausiert', todas: 'Alle',
    bloco: 'Block', vazio: 'Noch keine Beratung. Legen Sie die erste an.',
    loading: 'Wird geladen…', erro: 'Fehler (Migration 029 nötig).',
    semNome: 'Name ist erforderlich.',
  } : lang === 'en' ? {
    eyebrow: 'Management', title: 'Consultancies', subtitle: 'Guided consultancies — the contact is recorded without an account.',
    nova: '+ New consultancy', nome: 'Name', empresa: 'Company', email: 'Email', telefone: 'Phone', setor: 'Sector',
    tipo: 'Type', tGratuita: 'Free', tImplementacao: 'Business setup',
    criar: 'Create and start', cancelar: 'Cancel', abrir: 'Open →',
    ativa: 'Active', concluida: 'Completed', pausada: 'Paused', todas: 'All',
    bloco: 'Block', vazio: 'No consultancies yet. Create the first one.',
    loading: 'Loading…', erro: 'Error (migration 029 required).',
    semNome: 'Name is required.',
  } : {
    eyebrow: 'Gestão', title: 'Consultorias', subtitle: 'Consultorias acompanhadas — o contacto fica registado sem precisar de conta.',
    nova: '+ Nova consultoria', nome: 'Nome', empresa: 'Empresa', email: 'E-mail', telefone: 'Telefone', setor: 'Setor',
    tipo: 'Tipo', tGratuita: 'Gratuita', tImplementacao: 'Implementação de negócio',
    criar: 'Criar e começar', cancelar: 'Cancelar', abrir: 'Abrir →',
    ativa: 'Ativa', concluida: 'Concluída', pausada: 'Pausada', todas: 'Todas',
    bloco: 'Bloco', vazio: 'Ainda não há consultorias. Cria a primeira.',
    loading: 'A carregar…', erro: 'Erro (é necessária a migração 029).',
    semNome: 'O nome é obrigatório.',
  }

  const tipoLabel = (x) => x === 'gratuita' ? L.tGratuita : L.tImplementacao
  const statusLabel = { ativa: L.ativa, concluida: L.concluida, pausada: L.pausada }
  const statusTone = { ativa: t.dueOk, concluida: { bg: t.chipBg, ink: t.chipText }, pausada: { bg: t.segBg, ink: t.textMuted } }

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    const { data, error } = await supabase.from('consultorias').select('*').order('updated_at', { ascending: false })
    if (error) setErr(L.erro); else setLista(data || [])
    setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])

  async function criar() {
    if (!form?.nome.trim()) { setErr(L.semNome); return }
    setSaving(true); setErr('')
    const { data, error } = await supabase.from('consultorias').insert({
      nome: form.nome.trim(), empresa: form.empresa || null, email: form.email || null,
      telefone: form.telefone || null, setor: form.setor || null, tipo: form.tipo,
    }).select('id').single()
    setSaving(false)
    if (error || !data) { setErr(L.erro); return }
    navigate(`/gestao/consultorias/${data.id}`)   // entra logo a trabalhar
  }

  const visiveis = filtro === 'todas' ? lista : lista.filter(c => c.status === filtro)

  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px' }
  const inputStyle = { padding: '10px 12px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }
  const lblStyle = { fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody, maxWidth: '1020px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div>
          <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accentText }}>{L.eyebrow}</div>
          <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '27px' : '34px', lineHeight: 1.05, letterSpacing: '-.5px', color: t.heading }}>{L.title}</h1>
          <p style={{ fontSize: '12.5px', color: t.textMuted, margin: '8px 0 0', maxWidth: '560px', lineHeight: 1.5 }}>{L.subtitle}</p>
        </div>
        {!form && <button onClick={() => setForm({ ...EMPTY })} style={{ padding: '10px 20px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>{L.nova}</button>}
      </div>

      {err && <div style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '10px', padding: '11px 15px', fontSize: '12.5px', fontWeight: 600, marginBottom: '14px' }}>{err}</div>}

      {/* Criar — só o essencial, para arrancar em segundos numa sessão ao vivo */}
      {form && (
        <div style={{ ...card, padding: '18px 20px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1.3fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div><div style={lblStyle}>{L.nome} *</div><input autoFocus value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} style={inputStyle} /></div>
            <div><div style={lblStyle}>{L.empresa}</div><input value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} style={inputStyle} /></div>
            <div><div style={lblStyle}>{L.tipo}</div>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="implementacao">{L.tImplementacao}</option>
                <option value="gratuita">{L.tGratuita}</option>
              </select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px' }}>
            <div><div style={lblStyle}>{L.email}</div><input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} /></div>
            <div><div style={lblStyle}>{L.telefone}</div><input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} style={inputStyle} /></div>
            <div><div style={lblStyle}>{L.setor}</div><input value={form.setor} onChange={e => setForm(f => ({ ...f, setor: e.target.value }))} style={inputStyle} /></div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={criar} disabled={saving || !form.nome.trim()} style={{ padding: '10px 20px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '9px', fontWeight: 700, fontSize: '13px', cursor: form.nome.trim() ? 'pointer' : 'default', opacity: form.nome.trim() ? 1 : .5 }}>{saving ? '…' : L.criar}</button>
            <button onClick={() => { setForm(null); setErr('') }} style={{ padding: '10px 16px', background: t.segBg, border: `1px solid ${t.segBorder}`, borderRadius: '9px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: t.textMuted }}>{L.cancelar}</button>
          </div>
        </div>
      )}

      {/* Filtro por estado */}
      <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {['ativa', 'concluida', 'pausada', 'todas'].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: '7px 14px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer',
            border: `1px solid ${filtro === f ? t.accent : t.cardBorder}`,
            background: filtro === f ? t.softCardBg : 'transparent', color: filtro === f ? t.accentText : t.textMuted,
          }}>{f === 'todas' ? L.todas : statusLabel[f]}</button>
        ))}
      </div>

      {loading && <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.loading}</div>}
      {!loading && visiveis.length === 0 && (
        <div style={{ ...card, padding: '34px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: '34px', marginBottom: '10px' }}>🗂</div>
          <div style={{ fontSize: '14px', color: t.textMuted }}>{L.vazio}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
        {visiveis.map(c => {
          const prog = progressoTotal(c)
          const tone = statusTone[c.status] || statusTone.ativa
          return (
            <div key={c.id} onClick={() => navigate(`/gestao/consultorias/${c.id}`)}
              style={{ ...card, padding: '18px 20px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: t.heading }}>{c.nome}</div>
                  {c.empresa && <div style={{ fontSize: '12px', color: t.textMuted, marginTop: '2px' }}>{c.empresa}</div>}
                </div>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 700, background: tone.bg, color: tone.ink }}>{statusLabel[c.status]}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 700, background: t.chipBg, color: t.chipText }}>{tipoLabel(c.tipo)}</span>
                {c.setor && <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 600, background: t.softCardBg, color: t.textMuted }}>{c.setor}</span>}
              </div>

              {/* Progresso por bloco */}
              <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
                {BLOCOS.map(b => {
                  const p = progressoBloco(b.n, c)
                  const atual = c.bloco === b.n
                  return (
                    <div key={b.n} style={{ flex: 1 }} title={`${L.bloco} ${b.n} · ${b[lang] || b.pt} — ${p.pct}%`}>
                      <div style={{ height: '5px', borderRadius: '20px', background: t.trackBg, overflow: 'hidden' }}>
                        <div style={{ width: `${p.pct}%`, height: '100%', background: b.porConstruir ? t.subtle : t.accent }} />
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: atual ? 800 : 600, color: atual ? t.accentText : t.subtle, marginTop: '3px', textAlign: 'center' }}>{b.n}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', color: t.subtle }}>{prog.feitas}/{prog.total}</span>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: t.accentText, whiteSpace: 'nowrap' }}>{L.abrir}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
