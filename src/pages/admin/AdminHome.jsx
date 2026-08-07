import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { listUsers, createUser, updateUser, deleteUser, resetPassword } from '../../lib/adminApi'
import { generatePassword } from '../../lib/passwordPolicy'

const EMPTY = { email: '', display_name: '', role: 'user', platform: 'accounting', password: '' }

export default function AdminHome() {
  const { user } = useAuth()
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()

  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr]       = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm]     = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const L = lang === 'de' ? {
    eyebrow: 'Verwaltung', title: 'Benutzerverwaltung',
    new: '+ Neuer Benutzer', email: 'E-Mail', name: 'Anzeigename',
    platform: 'Plattform', platAcc: 'Buchhaltung', platEsg: 'ESG', platBoth: 'Buchhaltung + ESG',
    platLite: 'Buchhaltung Lite', platLiteHint: 'Nur der Bereich „Buchhaltung" (ohne Preise, Planung, Mandanten, Firma und Beratung).',
    role: 'Rolle', admin: 'Administrator', userRole: 'Benutzer', created: 'Erstellt',
    roleComercial: 'Vertrieb (nur CRM)', roleMarketing: 'Marketing (nur Marketing)',
    lastLogin: 'Letzter Login', save: 'Speichern', invite: 'Einladung senden',
    edit: 'Bearbeiten', del: 'Löschen', loading: 'Wird geladen…', empty: 'Keine Benutzer.', never: 'nie',
    inviteHint: 'Es wird eine E-Mail mit einem Link zum Festlegen des Passworts gesendet.',
    invited: (e) => `Einladung an ${e} gesendet.`,
    confirmDel: (e) => `Benutzer „${e}" wirklich löschen?`,
    apiHint: 'Benutzerverwaltung benötigt die bereitgestellte Version (Vercel).',
    resend: 'Passwort zurücksetzen', pendingTag: 'ausstehend', resent: (e) => `Neues Passwort für ${e} gesetzt.`,
    tempPw: 'Vorläufiges Passwort', regen: 'Neu erzeugen', copy: 'Kopieren', copied: 'Kopiert ✓',
    pwHint: 'Die Person meldet sich damit an und muss beim ersten Zugriff ein eigenes Passwort festlegen.',
    createdPw: (e, p) => `Konto ${e} erstellt. Vorläufiges Passwort: ${p}`,
    resetPw: (e, p) => `Neues vorläufiges Passwort für ${e}: ${p}`,
    createBtn: 'Konto erstellen',
    view: 'Daten ansehen',
  } : lang === 'en' ? {
    eyebrow: 'Administration', title: 'User Management',
    new: '+ New User', email: 'Email', name: 'Display name',
    platform: 'Platform', platAcc: 'Accounting', platEsg: 'ESG', platBoth: 'Accounting + ESG',
    platLite: 'Accounting Lite', platLiteHint: 'Only the "Accounting" section (no pricing, planning, clients, company or consulting).',
    role: 'Role', admin: 'Administrator', userRole: 'User', created: 'Created',
    roleComercial: 'Sales (CRM only)', roleMarketing: 'Marketing (Marketing only)',
    lastLogin: 'Last login', save: 'Save', invite: 'Send invitation',
    edit: 'Edit', del: 'Delete', loading: 'Loading…', empty: 'No users.', never: 'never',
    inviteHint: 'An email will be sent with a link for the user to set their password.',
    invited: (e) => `Invitation sent to ${e}.`,
    confirmDel: (e) => `Delete user "${e}"?`,
    apiHint: 'User management requires the published version (Vercel).',
    resend: 'Reset password', pendingTag: 'pending', resent: (e) => `New password set for ${e}.`,
    tempPw: 'Temporary password', regen: 'Regenerate', copy: 'Copy', copied: 'Copied ✓',
    pwHint: 'The person signs in with this and must set their own password on first access.',
    createdPw: (e, p) => `Account ${e} created. Temporary password: ${p}`,
    resetPw: (e, p) => `New temporary password for ${e}: ${p}`,
    createBtn: 'Create account',
    view: 'View data',
  } : {
    eyebrow: 'Administração', title: 'Gestão de Utilizadores',
    new: '+ Novo Utilizador', email: 'E-mail', name: 'Nome de exibição',
    platform: 'Plataforma', platAcc: 'Contabilidade', platEsg: 'ESG', platBoth: 'Contabilidade + ESG',
    platLite: 'Contabilidade Lite', platLiteHint: 'Apenas a secção "Contabilidade" (sem preços, planeamento, clientes, empresa e consultoria).',
    role: 'Perfil', admin: 'Administrador', userRole: 'Utilizador', created: 'Criado',
    roleComercial: 'Comercial (só CRM)', roleMarketing: 'Marketing (só Marketing)',
    lastLogin: 'Último acesso', save: 'Guardar', invite: 'Enviar convite',
    edit: 'Editar', del: 'Eliminar', loading: 'A carregar…', empty: 'Sem utilizadores.', never: 'nunca',
    inviteHint: 'Será enviado um e-mail com um link para o utilizador definir a palavra-passe.',
    invited: (e) => `Convite enviado para ${e}.`,
    confirmDel: (e) => `Eliminar o utilizador "${e}"?`,
    apiHint: 'A gestão de utilizadores requer a versão publicada (Vercel).',
    resend: 'Redefinir palavra-passe', pendingTag: 'pendente', resent: (e) => `Nova palavra-passe definida para ${e}.`,
    tempPw: 'Palavra-passe temporária', regen: 'Gerar nova', copy: 'Copiar', copied: 'Copiado ✓',
    pwHint: 'A pessoa entra com esta palavra-passe e é obrigada a definir a sua no primeiro acesso.',
    createdPw: (e, p) => `Conta ${e} criada. Palavra-passe temporária: ${p}`,
    resetPw: (e, p) => `Nova palavra-passe temporária para ${e}: ${p}`,
    createBtn: 'Criar conta',
    view: 'Ver dados',
  }

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    try { setUsers(await listUsers()) } catch (e) { setErr(e.message) }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  function openCreate() { setForm({ ...EMPTY, password: generatePassword() }); setEditingId('new'); setErr(''); setNotice('') }
  function openEdit(u) { setForm({ email: u.email, display_name: u.display_name, role: u.role, platform: u.platform || 'accounting', password: '' }); setEditingId(u.id); setErr(''); setNotice('') }
  function closeForm() { setEditingId(null); setForm(EMPTY) }

  async function submit() {
    setSaving(true); setErr(''); setNotice('')
    try {
      if (editingId === 'new') {
        await createUser({ email: form.email, display_name: form.display_name, role: form.role, platform: form.platform, password: form.password })
        setNotice(L.createdPw(form.email, form.password))
      }
      else { await updateUser({ id: editingId, email: form.email, display_name: form.display_name, role: form.role, platform: form.platform }) }
      closeForm(); await load()
    } catch (e) { setErr(e.message) }
    setSaving(false)
  }
  async function remove(u) {
    if (!window.confirm(L.confirmDel(u.email))) return
    setBusyId(u.id); setErr('')
    try { await deleteUser(u.id); await load() } catch (e) { setErr(e.message) }
    setBusyId(null)
  }
  // Redefine a palavra-passe temporária e volta a exigir a mudança no acesso seguinte
  async function resend(u) {
    setBusyId(u.id); setErr(''); setNotice('')
    const pw = generatePassword()
    try { await resetPassword(u.id, pw); setNotice(L.resetPw(u.email, pw)); await load() } catch (e) { setErr(e.message) }
    setBusyId(null)
  }
  const [copied, setCopied] = useState(false)
  function copyPw() {
    navigator.clipboard?.writeText(form.password)
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-GB' : 'pt-PT') : L.never
  const inputStyle = { padding: '9px 11px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, fontSize: '13px', background: t.inputBg, color: t.heading, outline: 'none', width: '100%', boxSizing: 'border-box' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }
  const roleStyle = {
    admin:     { bg: t.chipBg, ink: t.chipText },
    user:      { bg: t.chipBg, ink: t.chipText },
    comercial: { bg: '#e8f0fb', ink: '#1e60c8' },
    marketing: { bg: '#fdeef7', ink: '#9d174d' },
  }
  const roleLabel = (r) => r === 'admin' ? L.admin : r === 'comercial' ? L.roleComercial : r === 'marketing' ? L.roleMarketing : L.userRole
  const platLabel = (p) => p === 'esg' ? L.platEsg : p === 'both' ? L.platBoth : p === 'accounting_lite' ? L.platLite : L.platAcc
  const platChip = (p) => p === 'esg' ? { bg: '#e8f0fb', ink: '#1e60c8' } : p === 'both' ? { bg: '#ede9fe', ink: '#5b21b6' } : p === 'accounting_lite' ? { bg: '#f0f7f2', ink: '#3d7a55' } : { bg: '#eaf5ee', ink: '#0a7a3e' }
  const GRID = '1.1fr 0.9fr 158px 108px 90px 100px 188px'

  return (
    <div style={{ width: '100%' }}>
      {/* Cabeçalho de página */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accent }}>{L.eyebrow}</div>
          <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '30px' : '38px', lineHeight: 1, letterSpacing: '-.5px', color: t.heading }}>{L.title}</h1>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none', background: t.btnBg, color: t.btnInk }}>
          <span style={{ color: t.accent, fontSize: '16px', lineHeight: 1 }}>+</span>{L.new.replace('+ ', '')}
        </button>
      </div>

      {err && <div style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '10px', padding: '10px 14px', fontSize: '12px', fontWeight: 600, marginBottom: '14px' }}>{err}</div>}
      {notice && <div style={{ background: t.dueOk.bg, color: t.dueOk.ink, borderRadius: '10px', padding: '10px 14px', fontSize: '12.5px', fontWeight: 600, marginBottom: '14px', fontFamily: 'ui-monospace, monospace' }}>🔑 {notice}</div>}

      {/* Form */}
      {editingId && (
        <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px', padding: '20px 22px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1.3fr 140px 120px auto', gap: '12px', alignItems: 'end' }}>
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '6px' }}>{L.email}</div><input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="nome@email.com" style={inputStyle} /></div>
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '6px' }}>{L.name}</div><input value={form.display_name} onChange={e=>setForm(f=>({...f,display_name:e.target.value}))} placeholder="Lúcia Cílio" style={inputStyle} /></div>
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '6px' }}>{L.platform}</div>
              <select value={form.platform} onChange={e=>setForm(f=>({...f,platform:e.target.value}))} style={selectStyle}><option value="accounting">{L.platAcc}</option><option value="accounting_lite">{L.platLite}</option><option value="esg">{L.platEsg}</option><option value="both">{L.platBoth}</option></select>
            </div>
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '6px' }}>{L.role}</div>
              <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} style={selectStyle}><option value="user">{L.userRole}</option><option value="admin">{L.admin}</option><option value="comercial">{L.roleComercial}</option><option value="marketing">{L.roleMarketing}</option></select>
            </div>
            <div style={{ display: 'flex', gap: '6px', paddingBottom: '1px' }}>
              <button onClick={submit} disabled={saving} style={{ padding: '9px 16px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '9px', fontWeight: 600, fontSize: '13px', cursor: saving?'wait':'pointer', whiteSpace: 'nowrap' }}>{saving ? '…' : (editingId === 'new' ? L.createBtn : L.save)}</button>
              <button onClick={closeForm} style={{ padding: '9px 12px', background: t.segBg, border: `1px solid ${t.segBorder}`, borderRadius: '9px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: t.textMuted }}>✕</button>
            </div>
          </div>

          {form.platform === 'accounting_lite' && (
            <div style={{ fontSize: '11.5px', color: t.textMuted, marginTop: '10px', lineHeight: 1.5 }}>ℹ️ {L.platLiteHint}</div>
          )}

          {/* Palavra-passe temporária (só na criação) */}
          {editingId === 'new' && (
            <div style={{ marginTop: '14px', background: t.softCardBg, borderRadius: '11px', padding: '13px 15px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '.5px' }}>{L.tempPw}</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}
                  style={{ ...inputStyle, width: 'auto', minWidth: '190px', flex: '0 1 240px', fontFamily: 'ui-monospace, monospace', fontWeight: 700, letterSpacing: '.5px' }} />
                <button type="button" onClick={() => setForm(f=>({...f,password:generatePassword()}))} style={{ padding: '9px 13px', background: 'transparent', border: `1px solid ${t.cardBorder}`, borderRadius: '9px', fontWeight: 600, fontSize: '12px', cursor: 'pointer', color: t.textMuted }}>↻ {L.regen}</button>
                <button type="button" onClick={copyPw} style={{ padding: '9px 13px', background: 'transparent', border: `1px solid ${copied ? '#0a7a3e' : t.cardBorder}`, borderRadius: '9px', fontWeight: 600, fontSize: '12px', cursor: 'pointer', color: copied ? '#0a7a3e' : t.textMuted }}>{copied ? L.copied : `⧉ ${L.copy}`}</button>
              </div>
              <div style={{ fontSize: '11px', color: t.subtle, marginTop: '9px', lineHeight: 1.5 }}>🔑 {L.pwHint}</div>
            </div>
          )}
        </div>
      )}

      {/* Tabela */}
      <div className="table-scroll">
      <div style={{ background: t.cardBg, borderRadius: '14px', border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, overflow: 'hidden', minWidth: isMobile ? '860px' : 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '13px 22px', background: t.headBg, gap: '12px', fontSize: '10.5px', letterSpacing: '1.2px', textTransform: 'uppercase', fontWeight: 600, color: t.textMuted }}>
          {[L.email, L.name, L.platform, L.role, L.created, L.lastLogin, ''].map((h,i) => <div key={i}>{h}</div>)}
        </div>
        {loading && <div style={{ padding: '32px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>{L.loading}</div>}
        {!loading && users.length === 0 && !err && <div style={{ padding: '32px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>{L.empty}</div>}
        {!loading && err && <div style={{ padding: '24px', textAlign: 'center', color: t.subtle, fontSize: '12px' }}>{L.apiHint}</div>}
        {!loading && users.map((u, i) => {
          const isSelf = u.id === user?.id
          const rs = roleStyle[u.role] || roleStyle.user
          // Pendente = convite ainda não aceite (sem confirmação de email nem login)
          // Nunca entrou: contas criadas com palavra-passe já têm o email confirmado
          const isPending = !u.last_sign_in_at
          return (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: GRID, padding: '14px 22px', borderTop: `1px solid ${t.rowBorder}`, alignItems: 'center', gap: '12px', fontSize: '13px' }}>
              <div style={{ fontWeight: 600, color: t.heading, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}{isSelf && <span style={{ fontSize: '10px', color: t.subtle, marginLeft: '6px' }}>({lang === 'de' ? 'ich' : lang === 'en' ? 'me' : 'eu'})</span>}</div>
              <div style={{ color: t.text }}>{u.display_name || '—'}</div>
              <div><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: platChip(u.platform).bg, color: platChip(u.platform).ink, whiteSpace: 'nowrap' }}>{platLabel(u.platform)}</span></div>
              <div><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: rs.bg, color: rs.ink }}>{roleLabel(u.role)}</span></div>
              <div style={{ color: t.textMuted }}>{fmtDate(u.created_at)}</div>
              <div style={{ color: t.textMuted }}>{u.last_sign_in_at ? fmtDate(u.last_sign_in_at) : isPending ? <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: '#fef3c7', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{L.pendingTag}</span> : '—'}</div>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                {!isSelf && (
                  <button onClick={() => resend(u)} disabled={busyId === u.id} title={L.resend} aria-label={L.resend} style={{ flex: 'none', width: '30px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.chipBg, border: `1px solid ${t.accent}`, borderRadius: '7px', cursor: busyId === u.id ? 'wait' : 'pointer', color: t.accent, padding: 0 }}>
                    {busyId === u.id ? '…' : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                        <circle cx="8" cy="15" r="4" /><path d="m11 12 8-8 3 3-3 3-2-2-3 3" />
                      </svg>
                    )}
                  </button>
                )}
                <button onClick={() => openEdit(u)} style={{ padding: '5px 11px', background: t.segBg, border: `1px solid ${t.segBorder}`, borderRadius: '7px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', color: t.text }}>{L.edit}</button>
                <button onClick={() => remove(u)} disabled={isSelf || busyId === u.id} style={{ padding: '5px 11px', background: isSelf ? t.segBg : t.dueLate.bg, border: 'none', borderRadius: '7px', fontSize: '11px', fontWeight: 600, cursor: isSelf ? 'not-allowed' : 'pointer', color: isSelf ? t.subtle : t.dueLate.ink }}>{busyId === u.id ? '…' : L.del}</button>
              </div>
            </div>
          )
        })}
      </div>
      </div>
    </div>
  )
}
