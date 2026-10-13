import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { listUsers, createUser, updateUser, deleteUser, resetPassword } from '../../lib/adminApi'
import { generatePassword } from '../../lib/passwordPolicy'
import { supabase } from '../../lib/supabase'
import BoasVindas from '../../components/BoasVindas'
import SegurancaMfa from '../../components/SegurancaMfa'

// O campo Serviço saiu deste formulário (13-D, 13/10): só era escrito e lido
// aqui, e o serviço vive na ficha do cliente. A coluna company_settings.service
// fica na base de dados, sem perda — simplesmente deixa de ser editada aqui.
const EMPTY = { email: '', display_name: '', role: 'user', platform: 'accounting', password: '', country: '' }

// Ícones pequenos (substituem 🔑 ℹ️ ↻ ⧉; regra do QA de 10/10)
const svgBase = { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, style: { flex: 'none', verticalAlign: '-0.15em' } }
const IcChave = () => <svg {...svgBase}><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8 3 3-3 3-2-2-3 3" /></svg>
const IcInfo = () => <svg {...svgBase}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
const IcGerar = () => <svg {...svgBase}><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></svg>
const IcCopiar = () => <svg {...svgBase}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>

export default function AdminHome() {
  const { user } = useAuth()
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const location = useLocation()
  const navigate = useNavigate()

  // O CRM deixou de criar contas (E10, 13/10): o botão "Criar acesso" de um
  // lead fechado manda para aqui com nome e e-mail no estado do router, e o
  // formulário abre já preenchido — assim a conta nasce por um só fluxo, com
  // país, plataforma e a mensagem de boas-vindas (BoasVindas).
  const [prefill] = useState(() => location.state?.novoAcesso || null)
  // Contrato do lead (se já existir) que fica a apontar para a conta criada
  const [billingPendente, setBillingPendente] = useState(() => prefill?.billingId || null)

  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr]       = useState('')
  // O aviso verde com a palavra-passe saiu (13-D, 13/10): repetia-a logo acima
  // da mensagem de boas-vindas. A palavra-passe aparece uma vez, na mensagem.
  const [boasVindas, setBoasVindas] = useState(null)   // mensagem pronta a enviar ao cliente (ponto 16)
  const [saving, setSaving] = useState(false)
  const [form, setForm]     = useState(() => prefill
    ? { ...EMPTY, email: prefill.email || '', display_name: prefill.display_name || '', password: generatePassword() }
    : EMPTY)
  const [editingId, setEditingId] = useState(() => (prefill ? 'new' : null))
  const [busyId, setBusyId] = useState(null)

  const L = lang === 'de' ? {
    title: 'Benutzerverwaltung',
    new: '+ Neuer Benutzer', email: 'E-Mail', name: 'Anzeigename',
    pais: 'Land', semServico: '\u2014 keine \u2014',
    platform: 'Plattform', platAcc: 'Buchhaltung', platEsg: 'ESG', platBoth: 'Buchhaltung + ESG',
    platLite: 'Buchhaltung Lite', platLiteHint: 'Nur der Bereich „Buchhaltung" (ohne Preise, Planung, Mandanten, Firma und Beratung).',
    role: 'Rolle', admin: 'Administrator', userRole: 'Benutzer',
    roleComercial: 'Vertrieb (nur CRM)', roleMarketing: 'Marketing (nur Marketing)',
    lastLogin: 'Letzter Login', save: 'Speichern',
    edit: 'Bearbeiten', del: 'Löschen', loading: 'Wird geladen…', empty: 'Keine Benutzer.', never: 'nie',
    confirmDel: (e) => `Benutzer „${e}" wirklich löschen?`,
    apiHint: 'Benutzerverwaltung benötigt die bereitgestellte Version (Vercel).',
    resend: 'Passwort zurücksetzen', pendingTag: 'ausstehend',
    tempPw: 'Vorläufiges Passwort', regen: 'Neu erzeugen', copy: 'Kopieren', copied: 'Kopiert ✓',
    pwHint: 'Die Person meldet sich damit an und muss beim ersten Zugriff ein eigenes Passwort festlegen.',
    createBtn: 'Konto erstellen', cancel: 'Abbrechen',
    equipa: 'Team', clientes: 'Mandanten',
  } : lang === 'en' ? {
    title: 'User Management',
    new: '+ New User', email: 'Email', name: 'Display name',
    pais: 'Country', semServico: '\u2014 none \u2014',
    platform: 'Platform', platAcc: 'Accounting', platEsg: 'ESG', platBoth: 'Accounting + ESG',
    platLite: 'Accounting Lite', platLiteHint: 'Only the "Accounting" section (no pricing, planning, clients, company or consulting).',
    role: 'Role', admin: 'Administrator', userRole: 'User',
    roleComercial: 'Sales (CRM only)', roleMarketing: 'Marketing (Marketing only)',
    lastLogin: 'Last login', save: 'Save',
    edit: 'Edit', del: 'Delete', loading: 'Loading…', empty: 'No users.', never: 'never',
    confirmDel: (e) => `Delete user "${e}"?`,
    apiHint: 'User management requires the published version (Vercel).',
    resend: 'Reset password', pendingTag: 'pending',
    tempPw: 'Temporary password', regen: 'Regenerate', copy: 'Copy', copied: 'Copied ✓',
    pwHint: 'The person signs in with this and must set their own password on first access.',
    createBtn: 'Create account', cancel: 'Cancel',
    equipa: 'Team', clientes: 'Clients',
  } : {
    title: 'Gestão de Utilizadores',
    new: '+ Novo Utilizador', email: 'E-mail', name: 'Nome de exibição',
    pais: 'Pa\u00eds', semServico: '\u2014 nenhum \u2014',
    platform: 'Plataforma', platAcc: 'Contabilidade', platEsg: 'ESG', platBoth: 'Contabilidade + ESG',
    platLite: 'Contabilidade Lite', platLiteHint: 'Apenas a secção "Contabilidade" (sem preços, planeamento, clientes, empresa e consultoria).',
    role: 'Perfil', admin: 'Administrador', userRole: 'Utilizador',
    roleComercial: 'Comercial (só CRM)', roleMarketing: 'Marketing (só Marketing)',
    lastLogin: 'Último acesso', save: 'Guardar',
    edit: 'Editar', del: 'Eliminar', loading: 'A carregar…', empty: 'Sem utilizadores.', never: 'nunca',
    confirmDel: (e) => `Eliminar o utilizador "${e}"?`,
    apiHint: 'A gestão de utilizadores requer a versão publicada (Vercel).',
    resend: 'Redefinir palavra-passe', pendingTag: 'pendente',
    tempPw: 'Palavra-passe temporária', regen: 'Gerar nova', copy: 'Copiar', copied: 'Copiado ✓',
    pwHint: 'A pessoa entra com esta palavra-passe e é obrigada a definir a sua no primeiro acesso.',
    createBtn: 'Criar conta', cancel: 'Cancelar',
    equipa: 'Equipa', clientes: 'Clientes',
  }

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    try { setUsers(await listUsers()) } catch (e) { setErr(e.message) }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])
  // Limpa o estado do router para um F5 não voltar a abrir o formulário
  useEffect(() => {
    if (location.state?.novoAcesso) navigate(location.pathname, { replace: true, state: null })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function openCreate() { setForm({ ...EMPTY, password: generatePassword() }); setEditingId('new'); setBillingPendente(null); setErr(''); setBoasVindas(null) }
  async function openEdit(u) {
    setForm({ email: u.email, display_name: u.display_name, role: u.role, platform: u.platform || 'accounting', password: '', country: '' })
    setEditingId(u.id); setErr('')
    const { data } = await supabase.from('company_settings').select('country').eq('user_id', u.id).maybeSingle()
    if (data) setForm(prev => ({ ...prev, country: data.country || '' }))
  }
  function closeForm() { setEditingId(null); setForm(EMPTY) }

  async function submit() {
    setSaving(true); setErr('')
    try {
      if (editingId === 'new') {
        const criado = await createUser({ email: form.email, display_name: form.display_name, role: form.role, platform: form.platform, password: form.password })
        await guardarPerfilEmpresa(criado?.id)
        // Vindo do CRM com contrato já criado: o contrato passa a apontar para a
        // conta, para o cliente ver o próximo pagamento (o que o CRM fazia).
        if (billingPendente && criado?.id) {
          await supabase.from('client_billing').update({ user_id: criado.id }).eq('id', billingPendente)
          setBillingPendente(null)
        }
        setBoasVindas({ nome: form.display_name, email: form.email, pw: form.password, novo: true, lingua: form.country === 'DE' ? 'de' : 'pt' })
      }
      else {
        await updateUser({ id: editingId, email: form.email, display_name: form.display_name, role: form.role, platform: form.platform })
        await guardarPerfilEmpresa(editingId)
      }
      closeForm(); await load()
    } catch (e) { setErr(e.message) }
    setSaving(false)
  }
  // O país vive em company_settings porque é ele que decide as regras fiscais
  // da conta. Só se aplica a contas de clientes (perfil Utilizador).
  async function guardarPerfilEmpresa(userId) {
    if (!userId || form.role !== 'user' || !form.country) return
    await supabase.from('company_settings').upsert({ user_id: userId, country: form.country }, { onConflict: 'user_id' })
  }

  async function remove(u) {
    if (!window.confirm(L.confirmDel(u.email))) return
    setBusyId(u.id); setErr('')
    try { await deleteUser(u.id); await load() } catch (e) { setErr(e.message) }
    setBusyId(null)
  }
  // Redefine a palavra-passe temporária e volta a exigir a mudança no acesso seguinte
  async function resend(u) {
    setBusyId(u.id); setErr('')
    const pw = generatePassword()
    try {
      await resetPassword(u.id, pw)
      const { data: cs } = await supabase.from('company_settings').select('country').eq('user_id', u.id).maybeSingle()
      setBoasVindas({ nome: u.display_name, email: u.email, pw, novo: false, lingua: cs?.country === 'DE' ? 'de' : 'pt' })
      await load()
    } catch (e) { setErr(e.message) }
    setBusyId(null)
  }
  const [copied, setCopied] = useState(false)
  function copyPw() {
    navigator.clipboard?.writeText(form.password)
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-GB' : 'pt-PT') : L.never
  const eCliente = form.role === 'user'   // país e plataforma só para contas de clientes
  const inputStyle = { padding: '10px 12px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, fontSize: '14px', background: t.inputBg, color: t.heading, outline: 'none', width: '100%', boxSizing: 'border-box' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }
  const roleStyle = {
    admin:     { bg: t.chipBg, ink: t.chipText },
    user:      { bg: t.chipBg, ink: t.chipText },
    comercial: t.toneBlue,
    marketing: t.toneOrange,
  }
  const roleLabel = (r) => r === 'admin' ? L.admin : r === 'comercial' ? L.roleComercial : r === 'marketing' ? L.roleMarketing : L.userRole
  const platLabel = (p) => p === 'esg' ? L.platEsg : p === 'both' ? L.platBoth : p === 'accounting_lite' ? L.platLite : L.platAcc
  const platChip = (p) => p === 'esg' ? t.toneBlue : p === 'both' ? t.toneOrange : p === 'accounting_lite' ? { bg: t.segBg, ink: t.textMuted } : t.dueOk
  // Sem a coluna "Criado" (13-D, 13/10): o "Último acesso" diz o que interessa
  const GRID = '1.1fr 0.9fr 158px 108px 100px 188px'
  // Equipa (3–4 contas) e clientes em secções separadas, em vez de misturados
  const equipa = users.filter(u => u.role !== 'user')
  const clientes = users.filter(u => u.role === 'user')

  return (
    <div style={{ width: '100%' }}>
      {/* Cabeçalho de página */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="so-leitores">{L.title}</h1>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', background: t.btnBg, color: t.btnInk }}>
          <span style={{ color: t.accentText, fontSize: '16px', lineHeight: 1 }}>+</span>{L.new.replace('+ ', '')}
        </button>
      </div>

      {err && <div style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '10px', padding: '10px 14px', fontSize: '12px', fontWeight: 600, marginBottom: '14px' }}>{err}</div>}
      {/* Verificação em dois passos da própria administradora (R5a) */}
      <SegurancaMfa />
      {boasVindas && <BoasVindas key={boasVindas.email + boasVindas.pw} dados={boasVindas} aoFechar={() => setBoasVindas(null)} />}

      {/* Form */}
      {editingId && (
        <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px', padding: '20px 22px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : (eCliente ? '1.3fr 1.3fr 170px 120px 150px auto' : '1.3fr 1.3fr 150px auto'), gap: '12px', alignItems: 'end' }}>
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '6px' }}>{L.email}</div><input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="nome@email.com" style={inputStyle} /></div>
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '6px' }}>{L.name}</div><input value={form.display_name} onChange={e=>setForm(f=>({...f,display_name:e.target.value}))} placeholder="Lúcia Cílio" style={inputStyle} /></div>
            {/* Plataforma e País não se aplicam à equipa: só aparecem com o perfil
                Utilizador (cliente) (13-D, 13/10). */}
            {eCliente && (
              <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '6px' }}>{L.platform}</div>
                <select value={form.platform} onChange={e=>setForm(f=>({...f,platform:e.target.value}))} style={selectStyle}><option value="accounting">{L.platAcc}</option><option value="accounting_lite">{L.platLite}</option><option value="esg">{L.platEsg}</option><option value="both">{L.platBoth}</option></select>
              </div>
            )}
            {eCliente && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '6px' }}>{L.pais}</div>
                <select value={form.country} onChange={e=>setForm(f=>({...f,country:e.target.value}))} style={selectStyle}>
                  <option value="">{L.semServico}</option>
                  <option value="PT">Portugal</option>
                  <option value="DE">{lang === 'de' ? 'Deutschland' : lang === 'en' ? 'Germany' : 'Alemanha'}</option>
                </select>
              </div>
            )}
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '6px' }}>{L.role}</div>
              <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} style={selectStyle}><option value="user">{L.userRole}</option><option value="admin">{L.admin}</option><option value="comercial">{L.roleComercial}</option><option value="marketing">{L.roleMarketing}</option></select>
            </div>
            <div style={{ display: 'flex', gap: '6px', paddingBottom: '1px' }}>
              <button onClick={submit} disabled={saving} style={{ padding: '9px 16px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '9px', fontWeight: 600, fontSize: '13px', cursor: saving?'wait':'pointer', whiteSpace: 'nowrap' }}>{saving ? '…' : (editingId === 'new' ? L.createBtn : L.save)}</button>
              <button onClick={closeForm} style={{ padding: '9px 12px', background: t.segBg, border: `1px solid ${t.segBorder}`, borderRadius: '9px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: t.textMuted }}>{L.cancel}</button>
            </div>
          </div>

          {eCliente && form.platform === 'accounting_lite' && (
            <div style={{ fontSize: '11.5px', color: t.textMuted, marginTop: '10px', lineHeight: 1.5, display: 'flex', gap: '6px', alignItems: 'baseline' }}><IcInfo /><span>{L.platLiteHint}</span></div>
          )}

          {/* Palavra-passe temporária (só na criação) */}
          {editingId === 'new' && (
            <div style={{ marginTop: '14px', background: t.softCardBg, borderRadius: '11px', padding: '13px 15px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '.5px' }}>{L.tempPw}</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                  style={{ ...inputStyle, width: 'auto', minWidth: '190px', flex: '0 1 240px', fontFamily: 'ui-monospace, monospace', fontWeight: 700, letterSpacing: '.5px' }} />
                <button type="button" onClick={() => setForm(f=>({...f,password:generatePassword()}))} style={{ padding: '9px 13px', background: 'transparent', border: `1px solid ${t.cardBorder}`, borderRadius: '9px', fontWeight: 600, fontSize: '12px', cursor: 'pointer', color: t.textMuted, display: 'inline-flex', alignItems: 'center', gap: '6px' }}><IcGerar />{L.regen}</button>
                <button type="button" onClick={copyPw} style={{ padding: '9px 13px', background: 'transparent', border: `1px solid ${copied ? t.dueOk.ink : t.cardBorder}`, borderRadius: '9px', fontWeight: 600, fontSize: '12px', cursor: 'pointer', color: copied ? t.dueOk.ink : t.textMuted, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>{copied ? L.copied : <><IcCopiar />{L.copy}</>}</button>
              </div>
              <div style={{ fontSize: '11px', color: t.subtle, marginTop: '9px', lineHeight: 1.5, display: 'flex', gap: '6px', alignItems: 'baseline' }}><IcChave /><span>{L.pwHint}</span></div>
            </div>
          )}
        </div>
      )}

      {/* Tabelas: Equipa e Clientes em secções separadas (13-D, 13/10) */}
      {loading && <div style={{ padding: '32px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>{L.loading}</div>}
      {!loading && err && <div style={{ padding: '24px', textAlign: 'center', color: t.subtle, fontSize: '12px' }}>{L.apiHint}</div>}
      {!loading && users.length === 0 && !err && <div style={{ padding: '32px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>{L.empty}</div>}
      {!loading && [[L.equipa, equipa], [L.clientes, clientes]].filter(([, lista]) => lista.length > 0).map(([titulo, lista]) => (
        <section key={titulo} style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 10px', fontFamily: t.fontDisplay, fontWeight: 600, fontSize: '20px', color: t.heading }}>{titulo} <span style={{ fontSize: '13px', color: t.subtle, fontFamily: t.fontBody }}>({lista.length})</span></h2>
          <div className="table-scroll">
          <div style={{ background: t.cardBg, borderRadius: '14px', border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, overflow: 'hidden', minWidth: isMobile ? '780px' : 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '13px 22px', background: t.headBg, gap: '12px', fontSize: '11px', letterSpacing: '1.2px', textTransform: 'uppercase', fontWeight: 600, color: t.textMuted }}>
              {[L.email, L.name, L.platform, L.role, L.lastLogin, ''].map((h,i) => <div key={i}>{h}</div>)}
            </div>
            {lista.map(u => {
              const isSelf = u.id === user?.id
              const rs = roleStyle[u.role] || roleStyle.user
              // Nunca entrou: contas criadas com palavra-passe já têm o email confirmado
              const isPending = !u.last_sign_in_at
              return (
                <div key={u.id} style={{ display: 'grid', gridTemplateColumns: GRID, padding: '14px 22px', borderTop: `1px solid ${t.rowBorder}`, alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                  <div style={{ fontWeight: 600, color: t.heading, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}{isSelf && <span style={{ fontSize: '11px', color: t.subtle, marginLeft: '6px' }}>({lang === 'de' ? 'ich' : lang === 'en' ? 'me' : 'eu'})</span>}</div>
                  <div style={{ color: t.text }}>{u.display_name || '—'}</div>
                  <div><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: platChip(u.platform).bg, color: platChip(u.platform).ink, whiteSpace: 'nowrap' }}>{platLabel(u.platform)}</span></div>
                  <div><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: rs.bg, color: rs.ink }}>{roleLabel(u.role)}</span></div>
                  <div style={{ color: t.textMuted }}>{u.last_sign_in_at ? fmtDate(u.last_sign_in_at) : isPending ? <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: t.dueSoon.bg, color: t.dueSoon.ink, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{L.pendingTag}</span> : '—'}</div>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    {!isSelf && (
                      <button onClick={() => resend(u)} disabled={busyId === u.id} title={L.resend} aria-label={L.resend} style={{ flex: 'none', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.chipBg, border: `1px solid ${t.accent}`, borderRadius: '7px', cursor: busyId === u.id ? 'wait' : 'pointer', color: t.accentText, padding: 0 }}>
                        {busyId === u.id ? '…' : <IcChave />}
                      </button>
                    )}
                    <button onClick={() => openEdit(u)} style={{ padding: '5px 11px', background: t.segBg, border: `1px solid ${t.segBorder}`, borderRadius: '7px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', color: t.text }}>{L.edit}</button>
                    <button onClick={() => remove(u)} disabled={isSelf || busyId === u.id} style={{ padding: '0 12px', minHeight: '34px', background: isSelf ? t.segBg : t.dueLate.bg, border: 'none', borderRadius: '7px', fontSize: '11.5px', fontWeight: 600, cursor: isSelf ? 'not-allowed' : 'pointer', color: isSelf ? t.subtle : t.dueLate.ink }}>{busyId === u.id ? '…' : L.del}</button>
                  </div>
                </div>
              )
            })}
          </div>
          </div>
        </section>
      ))}
    </div>
  )
}
