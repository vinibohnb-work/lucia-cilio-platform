import { useState, useEffect, useCallback } from 'react'
import { useLang } from '../../context/LangContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { REVENUE_RANGES, TEMPERATURES, SOURCES, leadScore, daysSinceContact, needsFollowUp } from '../../lib/leadScore'

// CRM de prospeção (kanban). Cartões arrastáveis entre etapas (drag & drop
// nativo HTML5); mover para "Perdido" pede o motivo; "Em abordagem" tem
// contador de tentativas. Cada lead tem origem, temperatura, perfil de cliente
// ideal (pontuação) e alerta de follow-up por dias sem contacto.

const STAGES = ['mapeado', 'abordagem', 'conectado', 'reuniao', 'proposta', 'fechado', 'perdido', 'futuro']
const FOLLOWUP_DAYS = 7

// Cores dos cabeçalhos das colunas (progressão de verdes + vinho p/ perdido)
const STAGE_TONE = {
  mapeado:   { bg: '#9ccbaa', ink: '#0a2f1a' },
  abordagem: { bg: '#7dbb92', ink: '#0a2f1a' },
  conectado: { bg: '#5aa87a', ink: '#ffffff' },
  reuniao:   { bg: '#3d9163', ink: '#ffffff' },
  proposta:  { bg: '#1f7a4c', ink: '#ffffff' },
  fechado:   { bg: '#0a5c36', ink: '#ffffff' },
  perdido:   { bg: '#7a1f2b', ink: '#ffffff' },
  futuro:    { bg: '#8a9990', ink: '#ffffff' },
}

const EMPTY = { name: '', company: '', contact: '', notes: '', source: '', temperature: '', sector: '', revenue_range: '', pain: '', deal_value: '' }

export default function Crm() {
  const { lang } = useLang()
  const { t } = useTheme()
  const { isAdmin } = useAuth()   // o Financeiro é só do admin (ver botão de contrato)
  const isMobile = useIsMobile()

  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [form, setForm] = useState(null)          // null = modal fechado
  const [dragId, setDragId] = useState(null)
  const [overStage, setOverStage] = useState(null)
  const [fTemp, setFTemp] = useState('')          // filtro de temperatura
  const [fSource, setFSource] = useState('')      // filtro de origem
  const [fOverdue, setFOverdue] = useState(false) // só follow-up pendente

  const L = lang === 'de' ? {
    eyebrow: 'Verwaltung', title: 'Akquise (CRM)', subtitle: 'Pipeline der aktiven Akquise — Karten zwischen Phasen ziehen.',
    stages: {
      mapeado:   ['Erfasst', 'auf der Liste, kein Kontakt'],
      abordagem: ['In Ansprache', 'Versuche werden gezählt'],
      conectado: ['Verbunden', 'hat geantwortet, Gespräch läuft'],
      reuniao:   ['Termin', 'vereinbart'],
      proposta:  ['Angebot', 'Termin erfolgt, liegt auf dem Tisch'],
      fechado:   ['Gewonnen', 'Vertrag unterschrieben'],
      perdido:   ['Verloren', 'mit erfasstem Grund'],
      futuro:    ['Später', 'will, aber nicht jetzt'],
    },
    add: '+ Lead', name: 'Name', company: 'Firma', contact: 'Kontakt', notes: 'Notizen',
    save: 'Speichern', del: 'Löschen', edit: 'Bearbeiten', attempts: 'Versuche', addAttempt: '+1 Versuch',
    lostReason: 'Grund des Verlusts:', loading: 'Wird geladen…',
    confirmDel: (n) => `Lead „${n}" löschen?`, saveErr: 'Fehler (Migration 025 nötig).',
    newLead: 'Neuer Lead', editLead: 'Lead bearbeiten', cancel: 'Abbrechen',
    source: 'Quelle', temperature: 'Temperatur', sector: 'Branche', sectorPh: 'z. B. Bauwesen',
    revenue: 'Jahresumsatz', pain: 'Hauptproblem', painPh: 'Was tut weh?', dealValue: 'Auftragswert (€)',
    profile: 'Profil (ideale Kundschaft)', score: 'Punkte',
    scoreHelp: (s) => `Umsatz ${s.revenue}/40 · Temperatur ${s.temp}/25 · Branche ${s.sector}/20 · Problem ${s.pain}/15`,
    filters: 'Filter', all: 'Alle', overdueOnly: 'Nur überfällig',
    contacted: 'Kontakt erfasst', markContact: 'Kontakt erfassen',
    daysAgo: (d) => d === 0 ? 'heute' : d === 1 ? 'vor 1 Tag' : `vor ${d} Tagen`,
    never: 'kein Kontakt',
    followupTitle: (n) => `${n} Lead(s) ohne Kontakt seit ${FOLLOWUP_DAYS}+ Tagen`,
    toContract: '→ Vertrag anlegen', hasContract: '✓ Vertrag angelegt',
    askValue: 'Auftragswert pro Monat (€):',
    confirmContract: (n, v) => `Vertrag für „${n}" mit ${v} €/Monat im Finanzbereich anlegen?`,
    contractOk: 'Vertrag angelegt ✓ — Periodizität im Finanzbereich prüfen.',
    empty: 'Keine Leads mit diesen Filtern.',
  } : lang === 'en' ? {
    eyebrow: 'Management', title: 'Prospecting (CRM)', subtitle: 'Active prospecting pipeline — drag cards between stages.',
    stages: {
      mapeado:   ['Mapped', 'on the list, no contact'],
      abordagem: ['Reaching out', 'attempts are counted'],
      conectado: ['Connected', 'replied, conversation alive'],
      reuniao:   ['Meeting', 'scheduled'],
      proposta:  ['Proposal', 'meeting done, on the table'],
      fechado:   ['Won', 'contract signed'],
      perdido:   ['Lost', 'with recorded reason'],
      futuro:    ['Later', 'wants it, but not now'],
    },
    add: '+ Lead', name: 'Name', company: 'Company', contact: 'Contact', notes: 'Notes',
    save: 'Save', del: 'Delete', edit: 'Edit', attempts: 'Attempts', addAttempt: '+1 attempt',
    lostReason: 'Reason for losing:', loading: 'Loading…',
    confirmDel: (n) => `Delete lead "${n}"?`, saveErr: 'Error (migration 025 required).',
    newLead: 'New lead', editLead: 'Edit lead', cancel: 'Cancel',
    source: 'Source', temperature: 'Temperature', sector: 'Sector', sectorPh: 'e.g. construction',
    revenue: 'Annual revenue', pain: 'Main pain', painPh: 'What hurts?', dealValue: 'Deal value (€)',
    profile: 'Profile (ideal client)', score: 'Score',
    scoreHelp: (s) => `Revenue ${s.revenue}/40 · Temperature ${s.temp}/25 · Sector ${s.sector}/20 · Pain ${s.pain}/15`,
    filters: 'Filters', all: 'All', overdueOnly: 'Overdue only',
    contacted: 'Contact logged', markContact: 'Log contact',
    daysAgo: (d) => d === 0 ? 'today' : d === 1 ? '1 day ago' : `${d} days ago`,
    never: 'no contact',
    followupTitle: (n) => `${n} lead(s) with no contact for ${FOLLOWUP_DAYS}+ days`,
    toContract: '→ Create contract', hasContract: '✓ Contract created',
    askValue: 'Deal value per month (€):',
    confirmContract: (n, v) => `Create a contract for "${n}" at €${v}/month in Finance?`,
    contractOk: 'Contract created ✓ — check the periodicity in Finance.',
    empty: 'No leads match these filters.',
  } : {
    eyebrow: 'Gestão', title: 'Prospeção (CRM)', subtitle: 'Funil da prospeção ativa — arrasta os cartões entre as etapas.',
    stages: {
      mapeado:   ['Mapeado', 'na lista, sem contacto'],
      abordagem: ['Em abordagem', 'tentativas viram contador'],
      conectado: ['Conectado', 'respondeu, conversa viva'],
      reuniao:   ['Reunião', 'agendada'],
      proposta:  ['Proposta', 'reunião feita, na mesa'],
      fechado:   ['Fechado', 'contrato assinado'],
      perdido:   ['Perdido', 'com motivo registado'],
      futuro:    ['Futuro', 'quer, mas não agora'],
    },
    add: '+ Lead', name: 'Nome', company: 'Empresa', contact: 'Contacto', notes: 'Notas',
    save: 'Guardar', del: 'Eliminar', edit: 'Editar', attempts: 'Tentativas', addAttempt: '+1 tentativa',
    lostReason: 'Motivo da perda:', loading: 'A carregar…',
    confirmDel: (n) => `Eliminar o lead "${n}"?`, saveErr: 'Erro (é necessária a migração 025).',
    newLead: 'Novo lead', editLead: 'Editar lead', cancel: 'Cancelar',
    source: 'Origem', temperature: 'Temperatura', sector: 'Setor', sectorPh: 'ex.: construção',
    revenue: 'Faturação anual', pain: 'Dor principal', painPh: 'O que lhe dói?', dealValue: 'Valor do negócio (€)',
    profile: 'Perfil (cliente ideal)', score: 'Pontos',
    scoreHelp: (s) => `Faturação ${s.revenue}/40 · Temperatura ${s.temp}/25 · Setor ${s.sector}/20 · Dor ${s.pain}/15`,
    filters: 'Filtros', all: 'Todos', overdueOnly: 'Só follow-up pendente',
    contacted: 'Contacto registado', markContact: 'Registar contacto',
    daysAgo: (d) => d === 0 ? 'hoje' : d === 1 ? 'há 1 dia' : `há ${d} dias`,
    never: 'sem contacto',
    followupTitle: (n) => `${n} lead(s) sem contacto há ${FOLLOWUP_DAYS}+ dias`,
    toContract: '→ Criar contrato', hasContract: '✓ Contrato criado',
    askValue: 'Valor do negócio por mês (€):',
    confirmContract: (n, v) => `Criar contrato para "${n}" com ${v} €/mês no Financeiro?`,
    contractOk: 'Contrato criado ✓ — confirme a periodicidade no Financeiro.',
    empty: 'Nenhum lead com estes filtros.',
  }

  const tr = (list, key) => list.find(x => x.key === key)
  const label = (item) => item ? (item[lang] || item.pt) : ''

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    const { data, error } = await supabase.from('crm_leads').select('*').order('updated_at', { ascending: false })
    if (error) setErr(L.saveErr)
    else setLeads(data || [])
    setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])

  // ── CRUD ──
  async function saveLead() {
    if (!form?.name.trim()) return
    setErr('')
    const payload = {
      name: form.name.trim(), company: form.company || null, contact: form.contact || null,
      notes: form.notes || null, source: form.source || null, temperature: form.temperature || null,
      sector: form.sector || null, revenue_range: form.revenue_range || null, pain: form.pain || null,
      deal_value: form.deal_value === '' ? null : Number(form.deal_value),
      updated_at: new Date().toISOString(),
    }
    const { error } = form.id
      ? await supabase.from('crm_leads').update(payload).eq('id', form.id)
      : await supabase.from('crm_leads').insert({ ...payload, stage: form.stage || 'mapeado', source: form.source || 'manual', last_contact_at: new Date().toISOString() })
    if (error) { setErr(L.saveErr); return }
    setForm(null); load()
  }
  async function removeLead(lead) {
    if (!window.confirm(L.confirmDel(lead.name))) return
    setLeads(prev => prev.filter(l => l.id !== lead.id))
    const { error } = await supabase.from('crm_leads').delete().eq('id', lead.id)
    if (error) { setErr(L.saveErr); load() }
  }
  // Registar contacto: zera o contador de follow-up
  async function markContact(lead, extra = {}) {
    const now = new Date().toISOString()
    const patch = { last_contact_at: now, updated_at: now, ...extra }
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, ...patch } : l))
    const { error } = await supabase.from('crm_leads').update(patch).eq('id', lead.id)
    if (error) { setErr(L.saveErr); load() }
  }
  const addAttempt = (lead) => markContact(lead, { attempts: (lead.attempts || 0) + 1 })

  // ── Lead fechado → contrato no Financeiro ──
  async function toContract(lead) {
    let value = lead.deal_value
    if (!value) {
      const input = window.prompt(L.askValue, '')
      if (input === null) return
      value = Number(String(input).replace(',', '.'))
      if (!Number.isFinite(value) || value <= 0) return
    }
    if (!window.confirm(L.confirmContract(lead.company || lead.name, value))) return
    setErr('')
    const { data, error } = await supabase.from('client_billing').insert({
      client_name: lead.company || lead.name,
      service: lead.pain || lead.notes || null,
      amount: value, periodicity: 'monthly',
      start_month: new Date().toISOString().slice(0, 7),
      notes: `CRM: ${lead.name}${lead.contact ? ' · ' + lead.contact : ''}`,
    }).select('id').single()
    if (error || !data) { setErr(L.saveErr); return }
    const patch = { converted_billing_id: data.id, deal_value: value, updated_at: new Date().toISOString() }
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, ...patch } : l))
    await supabase.from('crm_leads').update(patch).eq('id', lead.id)
    window.alert(L.contractOk)
  }

  // ── Drag & drop ──
  async function moveTo(leadId, stage) {
    const lead = leads.find(l => l.id === leadId)
    if (!lead || lead.stage === stage) return
    const patch = { stage, updated_at: new Date().toISOString() }
    if (stage === 'perdido') {
      const reason = window.prompt(L.lostReason, lead.lost_reason || '')
      if (reason === null) return                    // cancelou o arrasto
      patch.lost_reason = reason.trim() || null
    }
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...patch } : l))
    const { error } = await supabase.from('crm_leads').update(patch).eq('id', leadId)
    if (error) { setErr(L.saveErr); load() }
  }

  const openEdit = (lead) => setForm({ ...EMPTY, ...lead, deal_value: lead.deal_value ?? '', source: lead.source || '', temperature: lead.temperature || '', revenue_range: lead.revenue_range || '', sector: lead.sector || '', pain: lead.pain || '', company: lead.company || '', contact: lead.contact || '', notes: lead.notes || '' })

  // ── Filtros + ordenação por pontuação ──
  const visible = leads.filter(l =>
    (!fTemp || l.temperature === fTemp) &&
    (!fSource || l.source === fSource) &&
    (!fOverdue || needsFollowUp(l, FOLLOWUP_DAYS))
  )
  const overdueCount = leads.filter(l => needsFollowUp(l, FOLLOWUP_DAYS)).length

  const inputStyle = { padding: '8px 10px', borderRadius: '8px', border: `1px solid ${t.inputBorder}`, fontSize: '12.5px', background: t.inputBg, color: t.heading, outline: 'none', width: '100%', boxSizing: 'border-box' }
  const selStyle = { ...inputStyle, cursor: 'pointer' }
  const fieldLbl = { fontSize: '10px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '3px' }

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accentText }}>{L.eyebrow}</div>
          <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '28px' : '38px', lineHeight: 1, letterSpacing: '-.5px', color: t.heading }}>{L.title}</h1>
          <p style={{ fontSize: '13px', color: t.textMuted, margin: '8px 0 0' }}>{L.subtitle}</p>
        </div>
        <button onClick={() => setForm({ ...EMPTY, stage: 'mapeado' })} style={{ padding: '10px 18px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>{L.add}</button>
      </div>

      {/* Alerta de follow-up */}
      {overdueCount > 0 && (
        <div onClick={() => setFOverdue(o => !o)} style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '11px', padding: '11px 15px', fontSize: '12.5px', fontWeight: 700, marginBottom: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '9px' }}>
          <span>⏰</span><span>{L.followupTitle(overdueCount)}</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 800, opacity: .8 }}>{fOverdue ? '✕' : '→'}</span>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px' }}>{L.filters}</span>
        <select value={fTemp} onChange={e => setFTemp(e.target.value)} style={{ ...selStyle, width: 'auto' }}>
          <option value="">{L.temperature}: {L.all}</option>
          {TEMPERATURES.map(x => <option key={x.key} value={x.key}>{x.emoji} {label(x)}</option>)}
        </select>
        <select value={fSource} onChange={e => setFSource(e.target.value)} style={{ ...selStyle, width: 'auto' }}>
          <option value="">{L.source}: {L.all}</option>
          {SOURCES.map(x => <option key={x.key} value={x.key}>{label(x)}</option>)}
        </select>
        <button onClick={() => setFOverdue(o => !o)} style={{ padding: '8px 13px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', border: `1px solid ${fOverdue ? t.accent : t.cardBorder}`, background: fOverdue ? t.softCardBg : 'transparent', color: fOverdue ? t.accentText : t.textMuted }}>⏰ {L.overdueOnly}</button>
        {(fTemp || fSource || fOverdue) && (
          <button onClick={() => { setFTemp(''); setFSource(''); setFOverdue(false) }} style={{ padding: '8px 11px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', border: 'none', background: 'transparent', color: t.subtle }}>✕ {L.all}</button>
        )}
      </div>

      {err && <div style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '10px', padding: '11px 15px', fontSize: '12.5px', fontWeight: 600, marginBottom: '14px' }}>{err}</div>}
      {loading && <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.loading}</div>}
      {!loading && leads.length > 0 && visible.length === 0 && (
        <div style={{ padding: '18px', color: t.subtle, fontSize: '13px' }}>{L.empty}</div>
      )}

      {/* Board */}
      {!loading && (
      <div style={{ display: 'flex', gap: '8px', overflowX: isMobile ? 'auto' : 'visible', paddingBottom: '14px', alignItems: 'flex-start' }}>
        {STAGES.map(stage => {
          const tone = STAGE_TONE[stage]
          const [title, sub] = L.stages[stage]
          // Ordena por pontuação: o cliente mais aderente ao perfil ideal vem primeiro
          const cards = visible.filter(l => l.stage === stage)
            .sort((a, b) => leadScore(b).total - leadScore(a).total)
          const isOver = overStage === stage
          return (
            <div key={stage}
              onDragOver={e => { e.preventDefault(); setOverStage(stage) }}
              onDragLeave={() => setOverStage(s => (s === stage ? null : s))}
              onDrop={e => { e.preventDefault(); setOverStage(null); if (dragId) moveTo(dragId, stage); setDragId(null) }}
              style={{ flex: isMobile ? '0 0 200px' : '1 1 0', width: isMobile ? '200px' : 'auto', minWidth: isMobile ? '200px' : 0, borderRadius: '12px', background: isOver ? t.softCardBg : 'transparent', outline: isOver ? `2px dashed ${t.accent}` : 'none', transition: 'background .12s' }}
            >
              {/* Cabeçalho da coluna */}
              <div style={{ background: tone.bg, color: tone.ink, borderRadius: '10px', padding: '8px 10px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }} title={sub}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
                  <div style={{ fontSize: '9.5px', opacity: .8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
                </div>
                <span style={{ flex: 'none', minWidth: '20px', height: '20px', padding: '0 5px', borderRadius: '20px', background: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10.5px', fontWeight: 800 }}>{cards.length}</span>
              </div>

              {/* Cartões */}
              {cards.map(lead => {
                const temp = tr(TEMPERATURES, lead.temperature)
                const src = tr(SOURCES, lead.source)
                const s = leadScore(lead)
                const days = daysSinceContact(lead)
                const overdue = needsFollowUp(lead, FOLLOWUP_DAYS)
                return (
                  <div key={lead.id}
                    draggable
                    onDragStart={() => setDragId(lead.id)}
                    onDragEnd={() => { setDragId(null); setOverStage(null) }}
                    style={{
                      background: t.cardBg,
                      border: `1px solid ${overdue ? '#dc2626' : t.cardBorder}`,
                      borderLeft: `3px solid ${overdue ? '#dc2626' : (temp?.color || t.cardBorder)}`,
                      boxShadow: t.cardShadow, borderRadius: '10px', padding: '9px 10px', marginBottom: '7px', cursor: 'grab',
                      opacity: dragId === lead.id ? 0.45 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: t.heading, lineHeight: 1.3 }}>{lead.name}</div>
                        {lead.company && <div style={{ fontSize: '11px', color: t.textMuted, marginTop: '2px' }}>{lead.company}</div>}
                      </div>
                      <button onClick={() => openEdit(lead)} title={L.edit} style={{ flex: 'none', background: 'none', border: 'none', cursor: 'pointer', color: t.subtle, padding: '2px', fontSize: '12px', lineHeight: 1 }}>✎</button>
                      <button onClick={() => removeLead(lead)} title={L.del} style={{ flex: 'none', background: 'none', border: 'none', cursor: 'pointer', color: t.subtle, padding: '2px', fontSize: '12px', lineHeight: 1 }}>✕</button>
                    </div>

                    {/* Etiquetas: temperatura · origem · pontuação */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {temp && <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '2px 7px', borderRadius: '20px', background: temp.bg, color: temp.color }}>{temp.emoji} {label(temp)}</span>}
                      {src && <span style={{ fontSize: '9.5px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', background: t.softCardBg, color: t.textMuted }}>{label(src)}</span>}
                      {s.total > 0 && (
                        <span title={L.scoreHelp(s)} style={{ fontSize: '9.5px', fontWeight: 800, padding: '2px 7px', borderRadius: '20px', background: s.total >= 70 ? '#eaf5ee' : t.softCardBg, color: s.total >= 70 ? '#0a7a3e' : t.textMuted, cursor: 'help' }}>★ {s.total}</span>
                      )}
                    </div>

                    {lead.contact && <div style={{ fontSize: '11px', color: t.subtle, marginTop: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✉ {lead.contact}</div>}
                    {lead.pain && <div style={{ fontSize: '11px', color: t.text, marginTop: '5px', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>💬 {lead.pain}</div>}
                    {lead.notes && <div style={{ fontSize: '11px', color: t.text, marginTop: '5px', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{lead.notes}</div>}
                    {stage === 'perdido' && lead.lost_reason && (
                      <div style={{ fontSize: '11px', color: '#991b1b', fontStyle: 'italic', marginTop: '6px' }}>“{lead.lost_reason}”</div>
                    )}

                    {/* Follow-up: dias desde o último contacto + registar contacto */}
                    {stage !== 'fechado' && stage !== 'perdido' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '7px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: overdue ? '#dc2626' : t.subtle }}>
                          ⏱ {days == null ? L.never : L.daysAgo(days)}
                        </span>
                        <button onClick={() => markContact(lead)} title={L.markContact} style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', background: 'transparent', border: `1px dashed ${t.cardBorder}`, color: t.textMuted, cursor: 'pointer' }}>✓ {L.markContact}</button>
                      </div>
                    )}

                    {stage === 'abordagem' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: t.softCardBg, color: t.heading }}>📞 {lead.attempts || 0} {L.attempts.toLowerCase()}</span>
                        <button onClick={() => addAttempt(lead)} style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'transparent', border: `1px dashed ${t.cardBorder}`, color: t.textMuted, cursor: 'pointer' }}>{L.addAttempt}</button>
                      </div>
                    )}

                    {/* Fechado → contrato no Financeiro */}
                    {stage === 'fechado' && (isAdmin || lead.converted_billing_id) && (
                      <div style={{ marginTop: '7px' }}>
                        {lead.converted_billing_id ? (
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#0a7a3e' }}>{L.hasContract}</span>
                        ) : (
                          <button onClick={() => toContract(lead)} style={{ width: '100%', fontSize: '10.5px', fontWeight: 800, padding: '5px', borderRadius: '8px', background: t.softCardBg, border: `1px solid ${t.cardBorder}`, color: t.heading, cursor: 'pointer' }}>{L.toContract}</button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Atalho para adicionar nesta etapa */}
              <button onClick={() => setForm({ ...EMPTY, stage })} style={{ width: '100%', padding: '8px', borderRadius: '10px', border: `1px dashed ${t.cardBorder}`, background: 'transparent', color: t.subtle, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>+</button>
            </div>
          )
        })}
      </div>
      )}

      {/* Modal do lead (os campos não cabem na largura de uma coluna) */}
      {form && (
        <div onClick={() => setForm(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.cardBorder}`, boxShadow: '0 20px 60px rgba(0,0,0,.3)', padding: '20px 22px', width: '100%', maxWidth: '520px' }}>
            <h2 style={{ margin: '0 0 16px', fontFamily: t.fontDisplay, fontSize: '20px', fontWeight: 600, color: t.heading }}>{form.id ? L.editLead : L.newLead}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div><div style={fieldLbl}>{L.name}</div>
                <input autoFocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} /></div>
              <div><div style={fieldLbl}>{L.company}</div>
                <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} style={inputStyle} /></div>
              <div><div style={fieldLbl}>{L.contact}</div>
                <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} style={inputStyle} /></div>
              <div><div style={fieldLbl}>{L.source}</div>
                <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} style={selStyle}>
                  <option value="">—</option>
                  {SOURCES.map(x => <option key={x.key} value={x.key}>{label(x)}</option>)}
                </select></div>
            </div>

            {/* Perfil de cliente ideal */}
            <div style={{ background: t.softCardBg, borderRadius: '11px', padding: '12px', marginBottom: '10px' }}>
              <div style={{ ...fieldLbl, marginBottom: '8px' }}>{L.profile} · ★ {leadScore(form).total}/100</div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                <div><div style={fieldLbl}>{L.temperature}</div>
                  <select value={form.temperature} onChange={e => setForm(f => ({ ...f, temperature: e.target.value }))} style={selStyle}>
                    <option value="">—</option>
                    {TEMPERATURES.map(x => <option key={x.key} value={x.key}>{x.emoji} {label(x)}</option>)}
                  </select></div>
                <div><div style={fieldLbl}>{L.revenue}</div>
                  <select value={form.revenue_range} onChange={e => setForm(f => ({ ...f, revenue_range: e.target.value }))} style={selStyle}>
                    <option value="">—</option>
                    {REVENUE_RANGES.map(x => <option key={x.key} value={x.key}>{label(x)}</option>)}
                  </select></div>
                <div><div style={fieldLbl}>{L.sector}</div>
                  <input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} placeholder={L.sectorPh} style={inputStyle} /></div>
                <div><div style={fieldLbl}>{L.dealValue}</div>
                  <input type="number" value={form.deal_value} onChange={e => setForm(f => ({ ...f, deal_value: e.target.value }))} style={inputStyle} /></div>
              </div>
              <div style={{ marginTop: '10px' }}><div style={fieldLbl}>{L.pain}</div>
                <input value={form.pain} onChange={e => setForm(f => ({ ...f, pain: e.target.value }))} placeholder={L.painPh} style={inputStyle} /></div>
            </div>

            <div style={{ marginBottom: '14px' }}><div style={fieldLbl}>{L.notes}</div>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: t.fontBody }} /></div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={saveLead} disabled={!form.name.trim()} style={{ flex: 1, padding: '10px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '9px', fontWeight: 700, fontSize: '13px', cursor: form.name.trim() ? 'pointer' : 'default', opacity: form.name.trim() ? 1 : .5 }}>{L.save}</button>
              <button onClick={() => setForm(null)} style={{ padding: '10px 16px', background: t.segBg, border: `1px solid ${t.segBorder}`, borderRadius: '9px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: t.textMuted }}>{L.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
