import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { Ic } from '../../portal/ui'
import { TEMPERATURES, SOURCES, leadScore, daysSinceContact, needsFollowUp, revenueRangesParaEscolher } from '../../lib/leadScore'

// CRM de prospeção (kanban). Cartões arrastáveis entre etapas (drag & drop
// nativo HTML5) e, desde 13/10, também pelo campo "Etapa" do modal — o arrastar
// não funciona em ecrã tátil e no telemóvel não havia forma de mover um lead (E4).
// Cada lead tem origem, temperatura, perfil de cliente ideal (pontuação) e
// alerta de follow-up por dias sem contacto.
//
// 13-D, 13/10: sem caixas do navegador (prompt/alert) — o motivo da perda, o
// valor e o contrato pedem-se em modais; o eliminar passou para dentro do modal;
// o "Criar acesso" deixou de criar contas aqui (vai para Acessos, com a
// mensagem de boas-vindas).

const STAGES = ['mapeado', 'abordagem', 'conectado', 'reuniao', 'proposta', 'fechado', 'perdido', 'futuro']
const FOLLOWUP_DAYS = 7

const EMPTY = { name: '', company: '', contact: '', notes: '', source: '', temperature: '', sector: '', revenue_range: '', pain: '', deal_value: '', stage: 'mapeado', lost_reason: '' }

// Normaliza nomes para propor a ficha certa no contrato (sem acentos, minúsculas)
const norm = (x) => String(x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

// Ícones pequenos (substituem ⏰ ⏱ ★ ✓ ✕ 🔥 🌤 ❄; regra do QA de 10/10)
const svgP = (tam = 12) => ({ width: tam, height: tam, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, style: { flex: 'none', verticalAlign: '-0.15em' } })
const IcRelogio = ({ tam }) => <svg {...svgP(tam)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
const IcVisto = ({ tam }) => <svg {...svgP(tam)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
const IcFechar = ({ tam }) => <svg {...svgP(tam)}><path d="M6 6l12 12M18 6 6 18" /></svg>
const IcEstrela = ({ tam }) => <svg {...svgP(tam)}><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" /></svg>
const IcTemp = {
  quente: ({ tam }) => <svg {...svgP(tam)}><path d="M12 21c-3.3 0-6-2.5-6-5.8 0-3.6 3-5.6 4-9.2 2.5 1.8 3.2 4 3 6 1-.6 1.8-1.7 2-3 1.7 1.6 3 3.8 3 6.2 0 3.3-2.7 5.8-6 5.8z" /></svg>,
  morno: ({ tam }) => <svg {...svgP(tam)}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" /></svg>,
  frio: ({ tam }) => <svg {...svgP(tam)}><path d="M12 2.5v19M4 7l16 10M20 7 4 17M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5" /></svg>,
}

export default function Crm() {
  const { lang } = useLang()
  const { t } = useTheme()
  const { isAdmin } = useAuth()   // o Financeiro e os Acessos são só do admin
  const isMobile = useIsMobile()
  const location = useLocation()
  const navigate = useNavigate()

  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [info, setInfo] = useState('')            // confirmação discreta (substitui o window.alert)
  const [form, setForm] = useState(null)          // null = modal fechado
  const [confirmDel, setConfirmDel] = useState(false)
  const [contrato, setContrato] = useState(null)  // { lead, ficha, valor } — modal do contrato
  const [fichas, setFichas] = useState(null)      // fichas (tabela clientes), lidas ao abrir o contrato
  const [dragId, setDragId] = useState(null)
  const [overStage, setOverStage] = useState(null)
  const [fSource, setFSource] = useState('')      // filtro de origem (⏳ decisão da Lúcia)
  const [fOverdue, setFOverdue] = useState(false) // só follow-up pendente
  // Vindo dos Diagnósticos ("Ver no CRM →"): abre o próprio lead
  const [abrirId] = useState(() => location.state?.abrirLead || null)

  const L = lang === 'de' ? {
    title: 'Akquise (CRM)',
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
    criarAcesso: 'Zugang anlegen →', criarAcessoHint: 'Öffnet die Zugangsverwaltung mit Name und E-Mail ausgefüllt',
    add: '+ Lead', name: 'Name', company: 'Firma', contact: 'Kontakt', notes: 'Notizen',
    save: 'Speichern', del: 'Löschen', attempts: 'Versuche',
    lostReason: 'Grund des Verlusts', loading: 'Wird geladen…', stage: 'Phase',
    confirmDelQ: 'Diesen Lead löschen? Das kann nicht rückgängig gemacht werden.', yesDel: 'Ja, löschen', saveErr: 'Fehler (Migration 025 nötig).',
    newLead: 'Neuer Lead', editLead: 'Lead bearbeiten', cancel: 'Abbrechen',
    source: 'Quelle', temperature: 'Temperatur', sector: 'Branche', sectorPh: 'z. B. Bauwesen',
    revenue: 'Jahresumsatz', pain: 'Hauptproblem', painPh: 'Was tut weh?', dealValue: 'Erwartetes Monatshonorar (€)',
    profile: 'Profil (ideale Kundschaft)',
    scoreHelp: (s) => `Umsatz ${s.revenue}/40 · Temperatur ${s.temp}/25 · Branche ${s.sector}/20 · Problem ${s.pain}/15`,
    all: 'Alle', markContact: 'Kontakt erfassen', markContactAttempt: 'Kontakt erfassen (zählt einen Versuch)',
    daysAgo: (d) => d === 0 ? 'heute' : d === 1 ? 'vor 1 Tag' : `vor ${d} Tagen`,
    never: 'kein Kontakt',
    followupTitle: (n) => `${n} Lead(s) ohne Kontakt seit ${FOLLOWUP_DAYS}+ Tagen`,
    toContract: '→ Vertrag anlegen', hasContract: 'Vertrag angelegt',
    contractT: 'Vertrag anlegen', ficha: 'Mandantenakte', escolherFicha: '— Akte wählen —', semFicha: '— Mandant ohne Akte —',
    contractHint: 'Der Vertrag wird mit der Akte verknüpft und erscheint auf der Seite des Mandanten.',
    semFichaHint: 'Ohne Akte erscheint das Honorar nicht auf der Seite des Mandanten.',
    criar: 'Vertrag anlegen', contractOk: 'Vertrag angelegt — Periodizität im Finanzbereich prüfen.',
    empty: 'Keine Leads mit diesen Filtern.',
  } : lang === 'en' ? {
    title: 'Prospecting (CRM)',
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
    criarAcesso: 'Create access →', criarAcessoHint: 'Opens Access management with name and e-mail filled in',
    add: '+ Lead', name: 'Name', company: 'Company', contact: 'Contact', notes: 'Notes',
    save: 'Save', del: 'Delete', attempts: 'Attempts',
    lostReason: 'Reason for losing', loading: 'Loading…', stage: 'Stage',
    confirmDelQ: 'Delete this lead? This cannot be undone.', yesDel: 'Yes, delete', saveErr: 'Error (migration 025 required).',
    newLead: 'New lead', editLead: 'Edit lead', cancel: 'Cancel',
    source: 'Source', temperature: 'Temperature', sector: 'Sector', sectorPh: 'e.g. construction',
    revenue: 'Annual revenue', pain: 'Main pain', painPh: 'What hurts?', dealValue: 'Expected monthly fee (€)',
    profile: 'Profile (ideal client)',
    scoreHelp: (s) => `Revenue ${s.revenue}/40 · Temperature ${s.temp}/25 · Sector ${s.sector}/20 · Pain ${s.pain}/15`,
    all: 'All', markContact: 'Log contact', markContactAttempt: 'Log contact (counts one attempt)',
    daysAgo: (d) => d === 0 ? 'today' : d === 1 ? '1 day ago' : `${d} days ago`,
    never: 'no contact',
    followupTitle: (n) => `${n} lead(s) with no contact for ${FOLLOWUP_DAYS}+ days`,
    toContract: '→ Create contract', hasContract: 'Contract created',
    contractT: 'Create contract', ficha: 'Client file', escolherFicha: '— choose a file —', semFicha: '— client without a file —',
    contractHint: 'The contract is linked to the client file and shows on the client page.',
    semFichaHint: 'Without a file the fee will not show on the client page.',
    criar: 'Create contract', contractOk: 'Contract created — check the periodicity in Finance.',
    empty: 'No leads match these filters.',
  } : {
    title: 'Prospeção (CRM)',
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
    criarAcesso: 'Criar acesso →', criarAcessoHint: 'Abre os Acessos com o nome e o e-mail já preenchidos',
    add: '+ Lead', name: 'Nome', company: 'Empresa', contact: 'Contacto', notes: 'Notas',
    save: 'Guardar', del: 'Eliminar', attempts: 'Tentativas',
    lostReason: 'Motivo da perda', loading: 'A carregar…', stage: 'Etapa',
    confirmDelQ: 'Eliminar este lead? Não se pode desfazer.', yesDel: 'Sim, eliminar', saveErr: 'Erro (é necessária a migração 025).',
    newLead: 'Novo lead', editLead: 'Editar lead', cancel: 'Cancelar',
    source: 'Origem', temperature: 'Temperatura', sector: 'Setor', sectorPh: 'ex.: construção',
    revenue: 'Faturação anual', pain: 'Dor principal', painPh: 'O que lhe dói?', dealValue: 'Avença mensal prevista (€)',
    profile: 'Perfil (cliente ideal)',
    scoreHelp: (s) => `Faturação ${s.revenue}/40 · Temperatura ${s.temp}/25 · Setor ${s.sector}/20 · Dor ${s.pain}/15`,
    all: 'Todos', markContact: 'Registar contacto', markContactAttempt: 'Registar contacto (conta uma tentativa)',
    daysAgo: (d) => d === 0 ? 'hoje' : d === 1 ? 'há 1 dia' : `há ${d} dias`,
    never: 'sem contacto',
    followupTitle: (n) => `${n} lead(s) sem contacto há ${FOLLOWUP_DAYS}+ dias`,
    toContract: '→ Criar contrato', hasContract: 'Contrato criado',
    contractT: 'Criar contrato', ficha: 'Ficha do cliente', escolherFicha: '— escolher a ficha —', semFicha: '— cliente sem ficha —',
    contractHint: 'O contrato fica ligado à ficha e a avença aparece na página do cliente.',
    semFichaHint: 'Sem ficha, a avença não aparece na página do cliente.',
    criar: 'Criar contrato', contractOk: 'Contrato criado — confirme a periodicidade no Financeiro.',
    empty: 'Nenhum lead com estes filtros.',
  }

  const tr = (list, key) => list.find(x => x.key === key)
  const label = (item) => item ? (item[lang] || item.pt) : ''

  const openEdit = (lead, extra = {}) => {
    setConfirmDel(false)
    setForm({ ...EMPTY, ...lead, deal_value: lead.deal_value ?? '', source: lead.source || '', temperature: lead.temperature || '', revenue_range: lead.revenue_range || '', sector: lead.sector || '', pain: lead.pain || '', company: lead.company || '', contact: lead.contact || '', notes: lead.notes || '', lost_reason: lead.lost_reason || '', ...extra })
  }

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    const { data, error } = await supabase.from('crm_leads').select('*').order('updated_at', { ascending: false })
    if (error) setErr(L.saveErr)
    else {
      setLeads(data || [])
      const alvo = abrirId && (data || []).find(l => l.id === abrirId)
      if (alvo) openEdit(alvo)
    }
    setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])
  // Limpa o estado do router para um F5 não reabrir o lead
  useEffect(() => {
    if (location.state?.abrirLead) navigate(location.pathname, { replace: true, state: null })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── CRUD ──
  async function saveLead() {
    if (!form?.name.trim()) return
    setErr('')
    const payload = {
      name: form.name.trim(), company: form.company || null, contact: form.contact || null,
      notes: form.notes || null, source: form.source || null, temperature: form.temperature || null,
      sector: form.sector || null, revenue_range: form.revenue_range || null, pain: form.pain || null,
      deal_value: form.deal_value === '' ? null : Number(form.deal_value),
      // A etapa passou a mudar-se também aqui (E4); o motivo só conta em "Perdido"
      stage: form.stage || 'mapeado',
      lost_reason: form.stage === 'perdido' ? (form.lost_reason?.trim() || null) : (form.lost_reason || null),
      updated_at: new Date().toISOString(),
    }
    const { error } = form.id
      ? await supabase.from('crm_leads').update(payload).eq('id', form.id)
      : await supabase.from('crm_leads').insert({ ...payload, source: form.source || 'manual', last_contact_at: new Date().toISOString() })
    if (error) { setErr(L.saveErr); return }
    setForm(null); load()
  }
  // O ✕ vivia no cartão, a 4 px do ✎, e era irreversível: passou para o modal,
  // com confirmação no próprio modal (13-D, 13/10).
  async function removeLead(lead) {
    setForm(null); setConfirmDel(false)
    setLeads(prev => prev.filter(l => l.id !== lead.id))
    const { error } = await supabase.from('crm_leads').delete().eq('id', lead.id)
    if (error) { setErr(L.saveErr); load() }
  }
  // Registar contacto: zera o contador de follow-up. Em "Em abordagem" também
  // soma uma tentativa — eram dois botões que atualizavam o mesmo (13-D, 13/10).
  async function markContact(lead) {
    const now = new Date().toISOString()
    const patch = { last_contact_at: now, updated_at: now }
    if (lead.stage === 'abordagem') patch.attempts = (lead.attempts || 0) + 1
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, ...patch } : l))
    const { error } = await supabase.from('crm_leads').update(patch).eq('id', lead.id)
    if (error) { setErr(L.saveErr); load() }
  }

  // ── Lead fechado → contrato no Financeiro ──
  // O contrato nascia sem cliente_id e a avença não aparecia na ficha, que lê
  // por cliente_id (E2). Agora escolhe-se a ficha num modal — proposta a que
  // tem o mesmo nome da empresa/lead — ou diz-se explicitamente "sem ficha".
  async function abrirContrato(lead) {
    setErr(''); setInfo('')
    let lista = fichas
    if (!lista) {
      const { data } = await supabase.from('clientes').select('id,nome,user_id').order('nome')
      lista = data || []
      setFichas(lista)
    }
    const alvo = norm(lead.company) || norm(lead.name)
    const proposta = lista.find(f => norm(f.nome) === alvo) || lista.find(f => norm(f.nome) === norm(lead.name))
    setContrato({ lead, ficha: proposta?.id || '', valor: lead.deal_value ? String(lead.deal_value) : '' })
  }
  async function criarContrato() {
    const { lead, ficha: fichaId, valor } = contrato
    const value = Number(String(valor).replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0 || !fichaId) return
    const ficha = fichaId === '__sem' ? null : (fichas || []).find(f => f.id === fichaId)
    setErr('')
    const { data, error } = await supabase.from('client_billing').insert({
      client_name: ficha?.nome || lead.company || lead.name,
      cliente_id: ficha?.id || null,
      user_id: ficha?.user_id || null,
      service: lead.pain || null,
      amount: value, periodicity: 'monthly',
      start_month: new Date().toISOString().slice(0, 7),
      notes: `CRM: ${lead.name}${lead.contact ? ' · ' + lead.contact : ''}`,
    }).select('id').single()
    if (error || !data) { setErr(L.saveErr); return }
    const patch = { converted_billing_id: data.id, deal_value: value, updated_at: new Date().toISOString() }
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, ...patch } : l))
    await supabase.from('crm_leads').update(patch).eq('id', lead.id)
    setContrato(null); setInfo(L.contractOk)
  }

  // ── Lead fechado → acesso à plataforma ──
  // Na reunião de 10/09 ficou que TODOS os clientes passam a ter acesso. O CRM
  // criava a conta sozinho, com a palavra-passe num window.alert, sem país nem
  // mensagem de boas-vindas (E10). Desde 13/10 só abre os Acessos com o
  // formulário preenchido — um só fluxo de criação de conta.
  function irCriarAcesso(lead) {
    const email = (lead.contact || '').includes('@') ? lead.contact.trim() : ''
    navigate('/gestao/acessos', { state: { novoAcesso: { email, display_name: lead.company || lead.name, billingId: lead.converted_billing_id || null } } })
  }

  // ── Drag & drop ──
  async function moveTo(leadId, stage) {
    const lead = leads.find(l => l.id === leadId)
    if (!lead || lead.stage === stage) return
    // Para "Perdido" pede-se o motivo no modal (antes: window.prompt). Só muda
    // de etapa ao guardar; cancelar deixa o lead onde estava.
    if (stage === 'perdido') { openEdit(lead, { stage }); return }
    const patch = { stage, updated_at: new Date().toISOString() }
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...patch } : l))
    const { error } = await supabase.from('crm_leads').update(patch).eq('id', leadId)
    if (error) { setErr(L.saveErr); load() }
  }

  // ── Filtros + ordenação por pontuação ──
  // Saíram o rótulo "Filtros" e o filtro de temperatura (a temperatura vê-se no
  // chip e os cartões já vêm ordenados por pontuação) — 13-D, 13/10.
  const visible = leads.filter(l =>
    (!fSource || l.source === fSource) &&
    (!fOverdue || needsFollowUp(l, FOLLOWUP_DAYS))
  )
  const overdueCount = leads.filter(l => needsFollowUp(l, FOLLOWUP_DAYS)).length

  // Cores das colunas a partir do tema (antes hex fixos que não seguiam o modo noturno)
  const STAGE_TONE = {
    mapeado:   { bg: t.segBg, ink: t.heading },
    abordagem: { bg: t.segBg, ink: t.heading },
    conectado: { bg: t.chipBg, ink: t.chipText },
    reuniao:   t.toneBlue,
    proposta:  t.dueSoon,
    fechado:   t.dueOk,
    perdido:   t.dueLate,
    futuro:    { bg: t.softCardBg, ink: t.textMuted },
  }
  const tomTemp = (temp) => (temp && t[temp.tom]) || { bg: t.softCardBg, ink: t.textMuted }

  const inputStyle = { padding: '8px 10px', borderRadius: '8px', border: `1px solid ${t.inputBorder}`, fontSize: '12.5px', background: t.inputBg, color: t.heading, outline: 'none', width: '100%', boxSizing: 'border-box' }
  const selStyle = { ...inputStyle, cursor: 'pointer' }
  const fieldLbl = { fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '3px' }
  const modalFundo = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '5vh 16px', overflowY: 'auto' }
  const modalCaixa = { background: t.cardBg, borderRadius: '16px', border: `1px solid ${t.cardBorder}`, boxShadow: '0 20px 60px rgba(0,0,0,.3)', padding: '20px 22px', width: '100%' }
  const btnPrim = (ativo) => ({ flex: 1, padding: '10px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '9px', fontWeight: 700, fontSize: '13px', cursor: ativo ? 'pointer' : 'default', opacity: ativo ? 1 : .5 })
  const btnSec = { padding: '10px 16px', background: t.segBg, border: `1px solid ${t.segBorder}`, borderRadius: '9px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: t.textMuted }

  const valorContrato = contrato ? Number(String(contrato.valor).replace(',', '.')) : 0
  const podeCriarContrato = !!contrato && !!contrato.ficha && Number.isFinite(valorContrato) && valorContrato > 0

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody }}>
      <h1 className="so-leitores">{L.title}</h1>

      {/* Filtro de origem (⏳: fica até a Lúcia decidir se mede de onde vêm os leads) e "+ Lead"
          na mesma linha (13/10). O lead novo nasce na primeira etapa; muda-se no modal. */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
        <select value={fSource} onChange={e => setFSource(e.target.value)} aria-label={L.source} style={{ ...selStyle, width: 'auto' }}>
          <option value="">{L.source}: {L.all}</option>
          {SOURCES.map(x => <option key={x.key} value={x.key}>{label(x)}</option>)}
        </select>
        {(fSource || fOverdue) && (
          <button onClick={() => { setFSource(''); setFOverdue(false) }} style={{ padding: '8px 11px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', border: 'none', background: 'transparent', color: t.subtle, display: 'inline-flex', alignItems: 'center', gap: '5px' }}><IcFechar tam={11} />{L.all}</button>
        )}
        <span style={{ flex: 1 }} />
        <button onClick={() => { setConfirmDel(false); setForm({ ...EMPTY }) }} style={{ padding: '10px 18px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>{L.add}</button>
      </div>

      {/* Alerta de follow-up — é o único controlo deste filtro (o botão
          "Só follow-up pendente" fazia o mesmo e saiu; 13-D, 13/10) */}
      {overdueCount > 0 && (
        <button onClick={() => setFOverdue(o => !o)} aria-pressed={fOverdue}
          style={{ width: '100%', textAlign: 'left', border: fOverdue ? `2px solid ${t.dueLate.ink}` : '2px solid transparent', background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '11px', padding: '10px 14px', fontSize: '12.5px', fontWeight: 700, marginBottom: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '9px', fontFamily: 'inherit' }}>
          <IcRelogio tam={14} /><span>{L.followupTitle(overdueCount)}</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 800, opacity: .8, display: 'inline-flex' }}>{fOverdue ? <IcFechar tam={12} /> : '→'}</span>
        </button>
      )}

      {err && <div style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '10px', padding: '11px 15px', fontSize: '12.5px', fontWeight: 600, marginBottom: '14px' }}>{err}</div>}
      {info && (
        <div role="status" style={{ background: t.dueOk.bg, color: t.dueOk.ink, borderRadius: '10px', padding: '11px 15px', fontSize: '12.5px', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IcVisto tam={13} /><span style={{ flex: 1 }}>{info}</span>
          <button onClick={() => setInfo('')} aria-label={L.cancel} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '2px', display: 'inline-flex' }}><IcFechar tam={12} /></button>
        </div>
      )}
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
              {/* Cabeçalho da coluna — a explicação fica só no tooltip (a 2.ª linha saiu) */}
              <div style={{ background: tone.bg, color: tone.ink, borderRadius: '10px', padding: '8px 10px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }} title={sub}>
                <div style={{ minWidth: 0, flex: 1, fontSize: '12px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
                <span style={{ flex: 'none', minWidth: '20px', height: '20px', padding: '0 5px', borderRadius: '20px', background: t.cardBg, color: tone.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800 }}>{cards.length}</span>
              </div>

              {/* Cartões — clicar abre a edição (o ✎ saiu) */}
              {cards.map(lead => {
                const temp = tr(TEMPERATURES, lead.temperature)
                const tt = tomTemp(temp)
                const TempIc = temp ? IcTemp[temp.key] : null
                const s = leadScore(lead)
                const days = daysSinceContact(lead)
                const overdue = needsFollowUp(lead, FOLLOWUP_DAYS)
                return (
                  <div key={lead.id}
                    role="button" tabIndex={0} aria-label={`${L.editLead}: ${lead.name}`}
                    onClick={() => openEdit(lead)}
                    onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openEdit(lead) } }}
                    draggable
                    onDragStart={() => setDragId(lead.id)}
                    onDragEnd={() => { setDragId(null); setOverStage(null) }}
                    style={{
                      background: t.cardBg,
                      // A borda colorida pela temperatura repetia o chip e saiu; fica
                      // só a vermelha para "em atraso" (13-D, 13/10).
                      border: `1px solid ${overdue ? t.dueLate.ink : t.cardBorder}`,
                      borderLeft: overdue ? `3px solid ${t.dueLate.ink}` : `1px solid ${t.cardBorder}`,
                      boxShadow: t.cardShadow, borderRadius: '10px', padding: '9px 10px', marginBottom: '7px', cursor: 'pointer',
                      opacity: dragId === lead.id ? 0.45 : 1,
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 700, color: t.heading, lineHeight: 1.3 }}>{lead.name}</div>
                    {lead.company && <div style={{ fontSize: '11px', color: t.textMuted, marginTop: '2px' }}>{lead.company}</div>}

                    {/* Etiquetas: temperatura · pontuação (a origem ficou só no modal) */}
                    {(temp || s.total > 0) && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {temp && <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 7px', borderRadius: '20px', background: tt.bg, color: tt.ink, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>{TempIc && <TempIc tam={11} />}{label(temp)}</span>}
                        {s.total > 0 && (
                          <span title={L.scoreHelp(s)} style={{ fontSize: '11px', fontWeight: 800, padding: '2px 7px', borderRadius: '20px', background: s.total >= 70 ? t.dueOk.bg : t.softCardBg, color: s.total >= 70 ? t.dueOk.ink : t.textMuted, cursor: 'help', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><IcEstrela tam={11} />{s.total}</span>
                        )}
                      </div>
                    )}

                    {lead.contact && <div style={{ fontSize: '11px', color: t.subtle, marginTop: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}><Ic.mail size={11} />{lead.contact}</div>}
                    {lead.pain && <div style={{ fontSize: '11px', color: t.text, marginTop: '5px', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{lead.pain}</div>}
                    {/* As notas saíram do cartão: num lead do diagnóstico são o
                        enquadramento inteiro e repetiam a dor. Ficam no modal. */}
                    {stage === 'perdido' && lead.lost_reason && (
                      <div style={{ fontSize: '11px', color: t.dueLate.ink, fontStyle: 'italic', marginTop: '6px' }}>“{lead.lost_reason}”</div>
                    )}

                    {/* Follow-up: dias desde o último contacto + registar contacto */}
                    {stage !== 'fechado' && stage !== 'perdido' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '7px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: overdue ? t.dueLate.ink : t.subtle, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <IcRelogio tam={11} />{days == null ? L.never : L.daysAgo(days)}
                        </span>
                        {stage === 'abordagem' && (
                          <span title={L.attempts} style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: t.softCardBg, color: t.heading, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><Ic.telefone size={11} />{lead.attempts || 0} {L.attempts.toLowerCase()}</span>
                        )}
                        <button onClick={e => { e.stopPropagation(); markContact(lead) }} title={stage === 'abordagem' ? L.markContactAttempt : L.markContact}
                          style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '20px', background: 'transparent', border: `1px dashed ${t.cardBorder}`, color: t.textMuted, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><IcVisto tam={11} />{L.markContact}</button>
                      </div>
                    )}

                    {/* Fechado → contrato no Financeiro e acesso (nos Acessos) */}
                    {stage === 'fechado' && (isAdmin || lead.converted_billing_id) && (
                      <div style={{ marginTop: '7px' }}>
                        {lead.converted_billing_id ? (
                          <span style={{ fontSize: '11px', fontWeight: 700, color: t.dueOk.ink, display: 'inline-flex', alignItems: 'center', gap: '4px' }}><IcVisto tam={11} />{L.hasContract}</span>
                        ) : (
                          <button onClick={e => { e.stopPropagation(); abrirContrato(lead) }} style={{ width: '100%', fontSize: '11px', fontWeight: 800, padding: '5px', borderRadius: '8px', background: t.softCardBg, border: `1px solid ${t.cardBorder}`, color: t.heading, cursor: 'pointer' }}>{L.toContract}</button>
                        )}
                        {isAdmin && (
                          <button onClick={e => { e.stopPropagation(); irCriarAcesso(lead) }} title={L.criarAcessoHint} style={{ width: '100%', marginTop: '5px', minHeight: '30px', fontSize: '11px', fontWeight: 800, padding: '5px', borderRadius: '8px', background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.accentText, cursor: 'pointer' }}>{L.criarAcesso}</button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      )}

      {/* Modal do lead (os campos não cabem na largura de uma coluna) */}
      {form && (
        <div onClick={() => setForm(null)} style={modalFundo}>
          <div onClick={e => e.stopPropagation()} style={{ ...modalCaixa, maxWidth: '520px' }}>
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
              {/* Etapa: a forma de mover um lead no telemóvel (E4) */}
              <div><div style={fieldLbl}>{L.stage}</div>
                <select value={form.stage || 'mapeado'} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))} style={selStyle}>
                  {STAGES.map(st => <option key={st} value={st}>{L.stages[st][0]}</option>)}
                </select></div>
              {form.stage === 'perdido' && (
                <div><div style={fieldLbl}>{L.lostReason}</div>
                  <input value={form.lost_reason || ''} onChange={e => setForm(f => ({ ...f, lost_reason: e.target.value }))} autoFocus={!!form.id} style={inputStyle} /></div>
              )}
            </div>

            {/* Perfil de cliente ideal */}
            <div style={{ background: t.softCardBg, borderRadius: '11px', padding: '12px', marginBottom: '10px' }}>
              <div style={{ ...fieldLbl, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>{L.profile} · <IcEstrela tam={11} /> {leadScore(form).total}/100</div>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
                <div><div style={fieldLbl}>{L.temperature}</div>
                  <select value={form.temperature} onChange={e => setForm(f => ({ ...f, temperature: e.target.value }))} style={selStyle}>
                    <option value="">—</option>
                    {TEMPERATURES.map(x => <option key={x.key} value={x.key}>{label(x)}</option>)}
                  </select></div>
                <div><div style={fieldLbl}>{L.revenue}</div>
                  <select value={form.revenue_range} onChange={e => setForm(f => ({ ...f, revenue_range: e.target.value }))} style={selStyle}>
                    <option value="">—</option>
                    {revenueRangesParaEscolher(form.revenue_range).map(x => <option key={x.key} value={x.key}>{label(x)}{x.mensal ? ` · ${x.mensal}` : ''}</option>)}
                  </select></div>
                <div><div style={fieldLbl}>{L.sector}</div>
                  <input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} placeholder={L.sectorPh} style={inputStyle} /></div>
                {/* "Valor do negócio" → avença mensal: o código sempre o tratou como valor por mês */}
                <div><div style={fieldLbl}>{L.dealValue}</div>
                  <input type="number" min="0" value={form.deal_value} onChange={e => setForm(f => ({ ...f, deal_value: e.target.value }))} style={inputStyle} /></div>
              </div>
              <div style={{ marginTop: '10px' }}><div style={fieldLbl}>{L.pain}</div>
                <input value={form.pain} onChange={e => setForm(f => ({ ...f, pain: e.target.value }))} placeholder={L.painPh} style={inputStyle} /></div>
            </div>

            <div style={{ marginBottom: '14px' }}><div style={fieldLbl}>{L.notes}</div>
              <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: t.fontBody }} /></div>

            {confirmDel ? (
              <div style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '10px', padding: '11px 13px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ flex: 1, minWidth: '180px', fontSize: '12.5px', fontWeight: 700 }}>{L.confirmDelQ}</span>
                <button onClick={() => removeLead(form)} style={{ padding: '8px 14px', background: t.dueLate.ink, color: t.cardBg, border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer' }}>{L.yesDel}</button>
                <button onClick={() => setConfirmDel(false)} style={{ ...btnSec, padding: '8px 12px', fontSize: '12.5px' }}>{L.cancel}</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={saveLead} disabled={!form.name.trim()} style={btnPrim(!!form.name.trim())}>{L.save}</button>
                <button onClick={() => setForm(null)} style={btnSec}>{L.cancel}</button>
                {form.id && (
                  <button onClick={() => setConfirmDel(true)} style={{ ...btnSec, background: 'transparent', border: `1px solid ${t.dueLate.ink}`, color: t.dueLate.ink }}>{L.del}</button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal do contrato: escolher a ficha e confirmar a avença (E2) */}
      {contrato && (
        <div onClick={() => setContrato(null)} style={modalFundo}>
          <div onClick={e => e.stopPropagation()} style={{ ...modalCaixa, maxWidth: '440px' }}>
            <h2 style={{ margin: '0 0 6px', fontFamily: t.fontDisplay, fontSize: '20px', fontWeight: 600, color: t.heading }}>{L.contractT}</h2>
            <div style={{ fontSize: '12.5px', color: t.textMuted, marginBottom: '14px' }}>{contrato.lead.company || contrato.lead.name}</div>
            <div style={{ marginBottom: '10px' }}><div style={fieldLbl}>{L.ficha}</div>
              <select value={contrato.ficha} onChange={e => setContrato(c => ({ ...c, ficha: e.target.value }))} style={selStyle}>
                <option value="">{L.escolherFicha}</option>
                {(fichas || []).map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                <option value="__sem">{L.semFicha}</option>
              </select>
              <div style={{ fontSize: '11.5px', color: contrato.ficha === '__sem' ? t.dueSoon.ink : t.subtle, marginTop: '5px', lineHeight: 1.45 }}>
                {contrato.ficha === '__sem' ? L.semFichaHint : L.contractHint}
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}><div style={fieldLbl}>{L.dealValue}</div>
              <input type="number" min="0" step="0.5" value={contrato.valor} onChange={e => setContrato(c => ({ ...c, valor: e.target.value }))} style={inputStyle} /></div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={criarContrato} disabled={!podeCriarContrato} style={btnPrim(podeCriarContrato)}>{L.criar}</button>
              <button onClick={() => setContrato(null)} style={btnSec}>{L.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
