import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { listUsers } from '../../lib/adminApi'
import { FASES, rotuloFase, progressoESG } from '../../lib/esgPercurso'

// Lista das consultorias ESG. Decisão de 18/09: a ESG é trabalho da Lúcia, como
// a Consultoria — abre-se um caso por cliente, com ou sem conta na plataforma,
// e é ela que preenche. A fase de cada caso é calculada, não marcada à mão.

const EMPTY = { nome: '', empresa: '', email: '', telefone: '', setor: '', user_id: '' }

export default function ConsultoriasESG() {
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  const [lista, setLista] = useState([])
  const [progresso, setProgresso] = useState({})   // caso.id → progressoESG(...)
  const [contas, setContas] = useState([])         // clientes com conta, para ligar
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filtro, setFiltro] = useState('ativa')

  const L = lang === 'de' ? {
    eyebrow: 'Verwaltung', title: 'ESG-Beratungen', subtitle: 'Ein Fall pro Unternehmen — Sie füllen aus, der Kunde sieht Weg und Bericht.',
    nova: '+ Neue ESG-Beratung', nome: 'Ansprechpartner', empresa: 'Firma', email: 'E-Mail', telefone: 'Telefon', setor: 'Branche',
    conta: 'Konto auf der Plattform', semConta: '— ohne Konto —',
    criar: 'Anlegen und beginnen', cancelar: 'Abbrechen', abrir: 'Öffnen →',
    ativa: 'Laufend', concluida: 'Abgeschlossen', pausada: 'Pausiert', todas: 'Alle',
    fase: 'Phase', proxima: 'Nächster Schritt', tudoPronto: 'Alle Phasen abgeschlossen',
    vazio: 'Noch keine ESG-Beratung. Legen Sie die erste an.',
    loading: 'Wird geladen…', erro: 'Fehler (Migration 036 nötig).', semNome: 'Der Ansprechpartner ist erforderlich.',
  } : lang === 'en' ? {
    eyebrow: 'Management', title: 'ESG consultancies', subtitle: 'One case per company — you fill it in, the client sees the journey and the report.',
    nova: '+ New ESG consultancy', nome: 'Contact person', empresa: 'Company', email: 'Email', telefone: 'Phone', setor: 'Sector',
    conta: 'Platform account', semConta: '— no account —',
    criar: 'Create and start', cancelar: 'Cancel', abrir: 'Open →',
    ativa: 'Active', concluida: 'Completed', pausada: 'Paused', todas: 'All',
    fase: 'Phase', proxima: 'Next step', tudoPronto: 'Every phase complete',
    vazio: 'No ESG consultancies yet. Create the first one.',
    loading: 'Loading…', erro: 'Error (migration 036 required).', semNome: 'The contact person is required.',
  } : {
    eyebrow: 'Gestão', title: 'Consultorias ESG', subtitle: 'Um caso por empresa — a Lúcia preenche, o cliente vê o percurso e o relatório.',
    nova: '+ Nova consultoria ESG', nome: 'Pessoa de contacto', empresa: 'Empresa', email: 'E-mail', telefone: 'Telefone', setor: 'Setor',
    conta: 'Conta na plataforma', semConta: '— sem conta —',
    criar: 'Criar e começar', cancelar: 'Cancelar', abrir: 'Abrir →',
    ativa: 'Ativa', concluida: 'Concluída', pausada: 'Pausada', todas: 'Todas',
    fase: 'Fase', proxima: 'Próximo passo', tudoPronto: 'Todas as fases fechadas',
    vazio: 'Ainda não há consultorias ESG. Cria a primeira.',
    loading: 'A carregar…', erro: 'Erro (é necessária a migração 036).', semNome: 'A pessoa de contacto é obrigatória.',
  }

  const statusLabel = { ativa: L.ativa, concluida: L.concluida, pausada: L.pausada }
  const statusTone = { ativa: t.dueOk, concluida: { bg: t.chipBg, ink: t.chipText }, pausada: { bg: t.segBg, ink: t.textMuted } }

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    const ano = new Date().getFullYear()
    const [casos, mat, diag, proj, rep] = await Promise.all([
      supabase.from('esg_consultorias').select('*').order('updated_at', { ascending: false }),
      supabase.from('esg_materiality').select('consultoria_id,topics,threshold'),
      supabase.from('esg_diagnostics').select('consultoria_id,reference_year,answers').order('reference_year', { ascending: true }),
      supabase.from('esg_projects').select('consultoria_id,topic_key,status'),
      supabase.from('esg_reports').select('consultoria_id,reference_year,sections').order('reference_year', { ascending: true }),
    ])
    if (casos.error) { setErr(L.erro); setLoading(false); return }
    setLista(casos.data || [])

    // Agrupa por caso e mede a fase com a mesma régua do Percurso. No
    // diagnóstico e no relatório, o ano corrente vence; senão, o mais recente.
    const por = {}
    const de = (id) => (por[id] ||= { materiality: null, diagnostic: null, projects: [], report: null })
    ;(mat.data || []).forEach(m => { if (m.consultoria_id) de(m.consultoria_id).materiality = m })
    ;(diag.data || []).forEach(d => { if (!d.consultoria_id) return; const b = de(d.consultoria_id); if (!b.diagnostic || d.reference_year === ano || b.diagnostic.reference_year !== ano) b.diagnostic = d })
    ;(proj.data || []).forEach(p => { if (p.consultoria_id) de(p.consultoria_id).projects.push(p) })
    ;(rep.data || []).forEach(r => { if (!r.consultoria_id) return; const b = de(r.consultoria_id); if (!b.report || r.reference_year === ano || b.report.reference_year !== ano) b.report = r })
    const prog = {}
    ;(casos.data || []).forEach(c => { prog[c.id] = progressoESG(por[c.id] || {}) })
    setProgresso(prog)
    setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])

  // Clientes com conta, para ligar um caso novo (só quando o form abre).
  useEffect(() => {
    if (!form || contas.length) return
    listUsers().then(us => setContas(us.filter(u => u.role !== 'admin'))).catch(() => {})
  }, [form, contas.length])

  async function criar() {
    if (!form?.nome.trim()) { setErr(L.semNome); return }
    setSaving(true); setErr('')
    const conta = contas.find(u => u.id === form.user_id)
    const { data, error } = await supabase.from('esg_consultorias').insert({
      nome: form.nome.trim(), empresa: form.empresa || null, email: form.email || conta?.email || null,
      telefone: form.telefone || null, setor: form.setor || null, user_id: form.user_id || null,
    }).select('id').single()
    setSaving(false)
    if (error || !data) { setErr(L.erro); return }
    navigate(`/gestao/esg/${data.id}`)   // entra logo a trabalhar
  }

  // Ao escolher uma conta, o nome e o email preenchem-se sozinhos (se vazios).
  function escolherConta(uid) {
    const u = contas.find(x => x.id === uid)
    setForm(f => ({ ...f, user_id: uid, nome: f.nome || u?.display_name || '', email: f.email || u?.email || '' }))
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

      {form && (
        <div style={{ ...card, padding: '18px 20px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1.3fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div><div style={lblStyle}>{L.empresa}</div><input autoFocus value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} style={inputStyle} /></div>
            <div><div style={lblStyle}>{L.nome} *</div><input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} style={inputStyle} /></div>
            <div><div style={lblStyle}>{L.conta}</div>
              <select value={form.user_id} onChange={e => escolherConta(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">{L.semConta}</option>
                {contas.map(u => <option key={u.id} value={u.id}>{u.display_name || u.email}</option>)}
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
          <div style={{ fontSize: '34px', marginBottom: '10px' }}>🌱</div>
          <div style={{ fontSize: '14px', color: t.textMuted }}>{L.vazio}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
        {visiveis.map(c => {
          const p = progresso[c.id] || progressoESG({})
          const tone = statusTone[c.status] || statusTone.ativa
          const prox = FASES.find(f => f.key === p.proxima)
          return (
            <div key={c.id} onClick={() => navigate(`/gestao/esg/${c.id}`)} style={{ ...card, padding: '18px 20px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: t.heading }}>{c.empresa || c.nome}</div>
                  <div style={{ fontSize: '12px', color: t.textMuted, marginTop: '2px' }}>{c.empresa ? c.nome : (c.email || '')}{c.setor ? ` · ${c.setor}` : ''}</div>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 700, background: tone.bg, color: tone.ink }}>{statusLabel[c.status]}</span>
              </div>

              {/* As cinco fases, com a mesma régua do Percurso */}
              <div style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
                {FASES.map(f => {
                  const e = p[f.key]
                  const atual = f.key === p.proxima
                  return (
                    <div key={f.key} style={{ flex: 1 }} title={`${f.n} · ${rotuloFase(f, lang)} — ${e.pct}%`}>
                      <div style={{ height: '5px', borderRadius: '20px', background: t.trackBg, overflow: 'hidden' }}>
                        <div style={{ width: `${e.pct}%`, height: '100%', background: e.estado === 'pronto' ? t.dueOk.ink : t.accent }} />
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: atual ? 800 : 600, color: atual ? t.accentText : t.subtle, marginTop: '3px', textAlign: 'center' }}>{f.n}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11.5px', color: t.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {prox ? <>{L.proxima}: <strong style={{ color: t.heading }}>{rotuloFase(prox, lang)}</strong></> : <span style={{ color: t.dueOk.ink, fontWeight: 700 }}>{L.tudoPronto}</span>}
                  <span style={{ color: t.subtle }}> · {p.pctGeral}%</span>
                </span>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: t.accentText, whiteSpace: 'nowrap' }}>{L.abrir}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
