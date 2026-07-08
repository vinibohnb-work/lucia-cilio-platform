import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { listUsers, createUser, updateUser, deleteUser } from '../../lib/adminApi'

const EMPTY = { email: '', display_name: '', role: 'user' }

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
    role: 'Rolle', admin: 'Administrator', userRole: 'Benutzer', created: 'Erstellt',
    lastLogin: 'Letzter Login', save: 'Speichern', invite: 'Einladung senden',
    edit: 'Bearbeiten', del: 'Löschen', loading: 'Wird geladen…', empty: 'Keine Benutzer.', never: 'nie',
    inviteHint: 'Es wird eine E-Mail mit einem Link zum Festlegen des Passworts gesendet.',
    invited: (e) => `Einladung an ${e} gesendet.`,
    confirmDel: (e) => `Benutzer „${e}" wirklich löschen?`,
    apiHint: 'Benutzerverwaltung benötigt die bereitgestellte Version (Vercel).',
  } : {
    eyebrow: 'Administração', title: 'Gestão de Utilizadores',
    new: '+ Novo Utilizador', email: 'E-mail', name: 'Nome de exibição',
    role: 'Perfil', admin: 'Administrador', userRole: 'Utilizador', created: 'Criado',
    lastLogin: 'Último acesso', save: 'Guardar', invite: 'Enviar convite',
    edit: 'Editar', del: 'Eliminar', loading: 'A carregar…', empty: 'Sem utilizadores.', never: 'nunca',
    inviteHint: 'Será enviado um e-mail com um link para o utilizador definir a palavra-passe.',
    invited: (e) => `Convite enviado para ${e}.`,
    confirmDel: (e) => `Eliminar o utilizador "${e}"?`,
    apiHint: 'A gestão de utilizadores requer a versão publicada (Vercel).',
  }

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    try { setUsers(await listUsers()) } catch (e) { setErr(e.message) }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  function openCreate() { setForm(EMPTY); setEditingId('new'); setErr(''); setNotice('') }
  function openEdit(u) { setForm({ email: u.email, display_name: u.display_name, role: u.role }); setEditingId(u.id); setErr(''); setNotice('') }
  function closeForm() { setEditingId(null); setForm(EMPTY) }

  async function submit() {
    setSaving(true); setErr(''); setNotice('')
    try {
      if (editingId === 'new') { await createUser({ email: form.email, display_name: form.display_name, role: form.role }); setNotice(L.invited(form.email)) }
      else { await updateUser({ id: editingId, email: form.email, display_name: form.display_name, role: form.role }) }
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

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString(lang === 'de' ? 'de-DE' : 'pt-PT') : L.never
  const inputStyle = { padding: '9px 11px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, fontSize: '13px', background: t.inputBg, color: t.heading, outline: 'none', width: '100%', boxSizing: 'border-box' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }
  const roleStyle = { admin: { bg: t.chipBg, ink: t.chipText }, user: { bg: t.chipBg, ink: t.chipText } }
  const GRID = '1fr 1fr 120px 110px 110px 150px'

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
      {notice && <div style={{ background: t.dueOk.bg, color: t.dueOk.ink, borderRadius: '10px', padding: '10px 14px', fontSize: '12px', fontWeight: 600, marginBottom: '14px' }}>✉️ {notice}</div>}

      {/* Form */}
      {editingId && (
        <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px', padding: '20px 22px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1.4fr 130px auto', gap: '12px', alignItems: 'end' }}>
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '6px' }}>{L.email}</div><input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="nome@email.com" style={inputStyle} /></div>
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '6px' }}>{L.name}</div><input value={form.display_name} onChange={e=>setForm(f=>({...f,display_name:e.target.value}))} placeholder="Lúcia Cílio" style={inputStyle} /></div>
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '6px' }}>{L.role}</div>
              <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} style={selectStyle}><option value="user">{L.userRole}</option><option value="admin">{L.admin}</option></select>
            </div>
            <div style={{ display: 'flex', gap: '6px', paddingBottom: '1px' }}>
              <button onClick={submit} disabled={saving} style={{ padding: '9px 16px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '9px', fontWeight: 600, fontSize: '13px', cursor: saving?'wait':'pointer', whiteSpace: 'nowrap' }}>{saving ? '…' : (editingId === 'new' ? L.invite : L.save)}</button>
              <button onClick={closeForm} style={{ padding: '9px 12px', background: t.segBg, border: `1px solid ${t.segBorder}`, borderRadius: '9px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: t.textMuted }}>✕</button>
            </div>
          </div>
          {editingId === 'new' && <div style={{ fontSize: '11px', color: t.subtle, marginTop: '10px' }}>✉️ {L.inviteHint}</div>}
        </div>
      )}

      {/* Tabela */}
      <div className="table-scroll">
      <div style={{ background: t.cardBg, borderRadius: '14px', border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, overflow: 'hidden', minWidth: isMobile ? '760px' : 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '13px 22px', background: t.headBg, gap: '12px', fontSize: '10.5px', letterSpacing: '1.2px', textTransform: 'uppercase', fontWeight: 600, color: t.textMuted }}>
          {[L.email, L.name, L.role, L.created, L.lastLogin, ''].map((h,i) => <div key={i}>{h}</div>)}
        </div>
        {loading && <div style={{ padding: '32px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>{L.loading}</div>}
        {!loading && users.length === 0 && !err && <div style={{ padding: '32px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>{L.empty}</div>}
        {!loading && err && <div style={{ padding: '24px', textAlign: 'center', color: t.subtle, fontSize: '12px' }}>{L.apiHint}</div>}
        {!loading && users.map((u, i) => {
          const isSelf = u.id === user?.id
          const rs = roleStyle[u.role] || roleStyle.user
          return (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: GRID, padding: '14px 22px', borderTop: `1px solid ${t.rowBorder}`, alignItems: 'center', gap: '12px', fontSize: '13px' }}>
              <div style={{ fontWeight: 600, color: t.heading, overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}{isSelf && <span style={{ fontSize: '10px', color: t.subtle, marginLeft: '6px' }}>(eu)</span>}</div>
              <div style={{ color: t.text }}>{u.display_name || '—'}</div>
              <div><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: rs.bg, color: rs.ink }}>{u.role === 'admin' ? L.admin : L.userRole}</span></div>
              <div style={{ color: t.textMuted }}>{fmtDate(u.created_at)}</div>
              <div style={{ color: t.textMuted }}>{fmtDate(u.last_sign_in_at)}</div>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
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
