import { useState, useEffect, useCallback } from 'react'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'

// CRM de prospeção (kanban). Cartões arrastáveis entre etapas (drag & drop
// nativo HTML5); mover para "Perdido" pede o motivo; "Em abordagem" tem
// contador de tentativas.

const STAGES = ['mapeado', 'abordagem', 'conectado', 'reuniao', 'proposta', 'fechado', 'perdido', 'futuro']

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

const EMPTY = { name: '', company: '', contact: '', notes: '' }

export default function Crm() {
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()

  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [formStage, setFormStage] = useState(null)   // etapa onde está o form aberto ('new' via topo → mapeado)
  const [editingId, setEditingId] = useState(null)
  const [dragId, setDragId] = useState(null)
  const [overStage, setOverStage] = useState(null)

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
    lostReason: 'Grund des Verlusts:', reason: 'Grund', loading: 'Wird geladen…',
    confirmDel: (n) => `Lead „${n}" löschen?`, saveErr: 'Fehler (Migration 020 nötig).',
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
    lostReason: 'Reason for losing:', reason: 'Reason', loading: 'Loading…',
    confirmDel: (n) => `Delete lead "${n}"?`, saveErr: 'Error (migration 020 required).',
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
    lostReason: 'Motivo da perda:', reason: 'Motivo', loading: 'A carregar…',
    confirmDel: (n) => `Eliminar o lead "${n}"?`, saveErr: 'Erro (é necessária a migração 020).',
  }

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    const { data, error } = await supabase.from('crm_leads').select('*').order('updated_at', { ascending: false })
    if (error) setErr(L.saveErr)
    else setLeads(data || [])
    setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])

  // ── CRUD ──
  async function saveLead(stage) {
    if (!form.name.trim()) return
    setErr('')
    const payload = { name: form.name.trim(), company: form.company || null, contact: form.contact || null, notes: form.notes || null, updated_at: new Date().toISOString() }
    const { error } = editingId
      ? await supabase.from('crm_leads').update(payload).eq('id', editingId)
      : await supabase.from('crm_leads').insert({ ...payload, stage })
    if (error) { setErr(L.saveErr); return }
    setForm(EMPTY); setFormStage(null); setEditingId(null); load()
  }
  async function removeLead(lead) {
    if (!window.confirm(L.confirmDel(lead.name))) return
    setLeads(prev => prev.filter(l => l.id !== lead.id))
    const { error } = await supabase.from('crm_leads').delete().eq('id', lead.id)
    if (error) { setErr(L.saveErr); load() }
  }
  async function addAttempt(lead) {
    const attempts = (lead.attempts || 0) + 1
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, attempts } : l))
    const { error } = await supabase.from('crm_leads').update({ attempts, updated_at: new Date().toISOString() }).eq('id', lead.id)
    if (error) { setErr(L.saveErr); load() }
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

  function openEdit(lead) {
    setEditingId(lead.id)
    setForm({ name: lead.name, company: lead.company || '', contact: lead.contact || '', notes: lead.notes || '' })
    setFormStage(lead.stage)
  }

  const inputStyle = { padding: '8px 10px', borderRadius: '8px', border: `1px solid ${t.inputBorder}`, fontSize: '12.5px', background: t.inputBg, color: t.heading, outline: 'none', width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div>
          <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accent }}>{L.eyebrow}</div>
          <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '28px' : '38px', lineHeight: 1, letterSpacing: '-.5px', color: t.heading }}>{L.title}</h1>
          <p style={{ fontSize: '13px', color: t.textMuted, margin: '8px 0 0' }}>{L.subtitle}</p>
        </div>
        <button onClick={() => { setEditingId(null); setForm(EMPTY); setFormStage(formStage === 'mapeado' && !editingId ? null : 'mapeado') }} style={{ padding: '10px 18px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>{L.add}</button>
      </div>

      {err && <div style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '10px', padding: '11px 15px', fontSize: '12.5px', fontWeight: 600, marginBottom: '14px' }}>{err}</div>}
      {loading && <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.loading}</div>}

      {/* Board */}
      {!loading && (
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '14px', alignItems: 'flex-start' }}>
        {STAGES.map(stage => {
          const tone = STAGE_TONE[stage]
          const [title, sub] = L.stages[stage]
          const cards = leads.filter(l => l.stage === stage)
          const isOver = overStage === stage
          return (
            <div key={stage}
              onDragOver={e => { e.preventDefault(); setOverStage(stage) }}
              onDragLeave={() => setOverStage(s => (s === stage ? null : s))}
              onDrop={e => { e.preventDefault(); setOverStage(null); if (dragId) moveTo(dragId, stage); setDragId(null) }}
              style={{ flex: '0 0 236px', width: '236px', borderRadius: '14px', background: isOver ? t.softCardBg : 'transparent', outline: isOver ? `2px dashed ${t.accent}` : 'none', transition: 'background .12s' }}
            >
              {/* Cabeçalho da coluna */}
              <div style={{ background: tone.bg, color: tone.ink, borderRadius: '12px', padding: '10px 14px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 800 }}>{title}</div>
                  <div style={{ fontSize: '10px', opacity: .8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
                </div>
                <span style={{ flex: 'none', minWidth: '22px', height: '22px', padding: '0 6px', borderRadius: '20px', background: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>{cards.length}</span>
              </div>

              {/* Form (novo nesta etapa ou edição) */}
              {formStage === stage && (
                <div style={{ background: t.cardBg, border: `2px solid ${t.accent}`, borderRadius: '12px', padding: '12px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input autoFocus value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={L.name} style={inputStyle} />
                  <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder={L.company} style={inputStyle} />
                  <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} placeholder={L.contact} style={inputStyle} />
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder={L.notes} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => saveLead(stage)} style={{ flex: 1, padding: '8px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>{L.save}</button>
                    <button onClick={() => { setFormStage(null); setEditingId(null); setForm(EMPTY) }} style={{ padding: '8px 11px', background: t.segBg, border: `1px solid ${t.segBorder}`, borderRadius: '8px', fontWeight: 600, fontSize: '12px', cursor: 'pointer', color: t.textMuted }}>✕</button>
                  </div>
                </div>
              )}

              {/* Cartões */}
              {cards.map(lead => (
                <div key={lead.id}
                  draggable
                  onDragStart={() => setDragId(lead.id)}
                  onDragEnd={() => { setDragId(null); setOverStage(null) }}
                  style={{
                    background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow,
                    borderRadius: '12px', padding: '11px 13px', marginBottom: '9px', cursor: 'grab',
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
                  {lead.contact && <div style={{ fontSize: '11px', color: t.subtle, marginTop: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✉ {lead.contact}</div>}
                  {lead.notes && <div style={{ fontSize: '11px', color: t.text, marginTop: '5px', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{lead.notes}</div>}
                  {stage === 'perdido' && lead.lost_reason && (
                    <div style={{ fontSize: '11px', color: '#991b1b', fontStyle: 'italic', marginTop: '6px' }}>“{lead.lost_reason}”</div>
                  )}
                  {stage === 'abordagem' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '8px' }}>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: t.softCardBg, color: t.heading }}>📞 {lead.attempts || 0} {L.attempts.toLowerCase()}</span>
                      <button onClick={() => addAttempt(lead)} style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'transparent', border: `1px dashed ${t.cardBorder}`, color: t.textMuted, cursor: 'pointer' }}>{L.addAttempt}</button>
                    </div>
                  )}
                </div>
              ))}

              {/* Atalho para adicionar nesta etapa */}
              {formStage !== stage && (
                <button onClick={() => { setEditingId(null); setForm(EMPTY); setFormStage(stage) }} style={{ width: '100%', padding: '8px', borderRadius: '10px', border: `1px dashed ${t.cardBorder}`, background: 'transparent', color: t.subtle, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>+</button>
              )}
            </div>
          )
        })}
      </div>
      )}
    </div>
  )
}
