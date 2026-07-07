import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { listUsers, createUser, updateUser, deleteUser } from '../../lib/adminApi'
import { useIsMobile } from '../../hooks/useIsMobile'

const G = '#0a2f1a'
const GOLD = '#c9a84c'
const BG = '#f2f6f3'

const FlagPT = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" style={{ borderRadius: '2px' }}>
    <rect width="8" height="14" fill="#006600"/><rect x="8" width="12" height="14" fill="#CC0000"/>
    <ellipse cx="8" cy="7" rx="2.8" ry="3.5" fill="#FFFF00" stroke="#006600" strokeWidth="0.4"/>
    <ellipse cx="8" cy="7" rx="1.6" ry="2.0" fill="#fff" stroke="#003399" strokeWidth="0.4"/>
  </svg>
)
const FlagDE = () => (
  <svg width="20" height="14" viewBox="0 0 20 14" style={{ borderRadius: '2px' }}>
    <rect y="0" width="20" height="4.67" fill="#000"/><rect y="4.67" width="20" height="4.67" fill="#CC0000"/><rect y="9.33" width="20" height="4.67" fill="#FFCE00"/>
  </svg>
)

const ROLE_STYLE = {
  admin: { bg: '#fef3c7', color: '#92400e' },
  user:  { bg: '#e8f5ec', color: G },
}

const EMPTY = { email: '', display_name: '', role: 'user' }

export default function AdminHome() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { lang, setLang } = useLang()
  const isMobile = useIsMobile()

  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr]       = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm]     = useState(EMPTY)
  const [editingId, setEditingId] = useState(null) // null = fechado, 'new' = criar, uuid = editar
  const [busyId, setBusyId] = useState(null)

  const L = lang === 'de' ? {
    title: 'Administration', badge: 'Administrator', logout: 'Abmelden',
    openPlatform: 'Plattform öffnen', users: 'Benutzerverwaltung',
    new: '+ Neuer Benutzer', email: 'E-Mail', name: 'Anzeigename',
    role: 'Rolle', admin: 'Administrator', userRole: 'Benutzer', created: 'Erstellt',
    lastLogin: 'Letzter Login', actions: '', save: 'Speichern', invite: 'Einladung senden', cancel: 'Abbrechen',
    edit: 'Bearbeiten', del: 'Löschen', loading: 'Wird geladen…',
    empty: 'Keine Benutzer.', never: 'nie',
    inviteHint: 'Es wird eine E-Mail mit einem Link zum Festlegen des Passworts gesendet.',
    invited: (e) => `Einladung an ${e} gesendet.`,
    confirmDel: (e) => `Benutzer „${e}" wirklich löschen?`,
    apiHint: 'Benutzerverwaltung benötigt die bereitgestellte Version (Vercel). Lokal nicht verfügbar.',
  } : {
    title: 'Administração', badge: 'Administrador', logout: 'Sair',
    openPlatform: 'Abrir plataforma', users: 'Gestão de Utilizadores',
    new: '+ Novo Utilizador', email: 'E-mail', name: 'Nome de exibição',
    role: 'Perfil', admin: 'Administrador', userRole: 'Utilizador', created: 'Criado',
    lastLogin: 'Último acesso', actions: '', save: 'Guardar', invite: 'Enviar convite', cancel: 'Cancelar',
    edit: 'Editar', del: 'Eliminar', loading: 'A carregar…',
    empty: 'Sem utilizadores.', never: 'nunca',
    inviteHint: 'Será enviado um e-mail com um link para o utilizador definir a palavra-passe.',
    invited: (e) => `Convite enviado para ${e}.`,
    confirmDel: (e) => `Eliminar o utilizador "${e}"?`,
    apiHint: 'A gestão de utilizadores requer a versão publicada (Vercel). Indisponível em modo local.',
  }

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    try { setUsers(await listUsers()) }
    catch (e) { setErr(e.message) }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  async function handleLogout() { await signOut(); navigate('/login', { replace: true }) }

  function openCreate() { setForm(EMPTY); setEditingId('new'); setErr(''); setNotice('') }
  function openEdit(u) { setForm({ email: u.email, display_name: u.display_name, role: u.role }); setEditingId(u.id); setErr(''); setNotice('') }
  function closeForm() { setEditingId(null); setForm(EMPTY) }

  async function submit() {
    setSaving(true); setErr(''); setNotice('')
    try {
      if (editingId === 'new') {
        await createUser({ email: form.email, display_name: form.display_name, role: form.role })
        setNotice(L.invited(form.email))
      } else {
        await updateUser({ id: editingId, email: form.email, display_name: form.display_name, role: form.role })
      }
      closeForm(); await load()
    } catch (e) { setErr(e.message) }
    setSaving(false)
  }

  async function remove(u) {
    if (!window.confirm(L.confirmDel(u.email))) return
    setBusyId(u.id); setErr('')
    try { await deleteUser(u.id); await load() }
    catch (e) { setErr(e.message) }
    setBusyId(null)
  }

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString(lang === 'de' ? 'de-DE' : 'pt-PT') : L.never
  const inputStyle = { padding: '8px 10px', borderRadius: '7px', border: '1px solid #dde8de', fontSize: '13px', background: '#fff', outline: 'none', width: '100%', boxSizing: 'border-box' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }
  const GRID = '1fr 1fr 120px 110px 110px 150px'

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* Top bar */}
      <div style={{ background: G, padding: '0 28px', paddingTop: 'env(safe-area-inset-top)', height: 'calc(64px + env(safe-area-inset-top))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '15px' }}>{L.title}</div>
            <div style={{ color: GOLD, fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' }}>{L.badge}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {[['pt', FlagPT], ['de', FlagDE]].map(([code, Flag]) => (
              <button key={code} onClick={() => setLang(code)} style={{
                display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 9px', borderRadius: '6px',
                fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${lang === code ? GOLD : 'rgba(255,255,255,.25)'}`,
                background: lang === code ? GOLD : 'transparent', color: lang === code ? G : 'rgba(255,255,255,.8)',
              }}><Flag /> {code.toUpperCase()}</button>
            ))}
          </div>
          <button onClick={() => navigate('/contabilidade/dashboard')} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.08)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
            {L.openPlatform}
          </button>
          <button onClick={handleLogout} style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.08)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
            {L.logout}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '28px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: G, margin: 0 }}>{L.users}</h2>
          <button onClick={openCreate} style={{ padding: '9px 18px', background: G, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
            {L.new}
          </button>
        </div>

        {err && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', fontWeight: 600, marginBottom: '14px' }}>
            {err}
          </div>
        )}
        {notice && (
          <div style={{ background: '#d1fae5', border: '1px solid #bbf7d0', color: '#065f46', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', fontWeight: 600, marginBottom: '14px' }}>
            ✉️ {notice}
          </div>
        )}

        {/* Form */}
        {editingId && (
          <div style={{ background: '#fff', border: `2px solid ${GOLD}`, borderRadius: '12px', padding: '18px 20px', marginBottom: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.4fr 1.4fr 130px auto', gap: '10px', alignItems: 'end' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '5px' }}>{L.email}</div>
                <input value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="nome@email.com" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '5px' }}>{L.name}</div>
                <input value={form.display_name} onChange={e=>setForm(f=>({...f,display_name:e.target.value}))} placeholder="Lúcia Cílio" style={inputStyle} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '5px' }}>{L.role}</div>
                <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} style={selectStyle}>
                  <option value="user">{L.userRole}</option>
                  <option value="admin">{L.admin}</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '6px', paddingBottom: '1px' }}>
                <button onClick={submit} disabled={saving} style={{ padding: '8px 16px', background: G, color: '#fff', border: 'none', borderRadius: '7px', fontWeight: 700, fontSize: '13px', cursor: saving?'wait':'pointer', whiteSpace: 'nowrap' }}>{saving ? '…' : (editingId === 'new' ? L.invite : L.save)}</button>
                <button onClick={closeForm} style={{ padding: '8px 12px', background: BG, border: '1px solid #dde8de', borderRadius: '7px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: '#64748b' }}>✕</button>
              </div>
            </div>
            {editingId === 'new' && (
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '10px' }}>✉️ {L.inviteHint}</div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="table-scroll">
        <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #dde8de', overflow: 'hidden', minWidth: isMobile ? '760px' : 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: GRID, padding: '12px 20px', background: BG, borderBottom: '1px solid #dde8de', gap: '8px' }}>
            {[L.email, L.name, L.role, L.created, L.lastLogin, ''].map((h,i) => (
              <div key={i} style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{h}</div>
            ))}
          </div>

          {loading && <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>{L.loading}</div>}
          {!loading && users.length === 0 && !err && <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>{L.empty}</div>}
          {!loading && err && <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>{L.apiHint}</div>}

          {!loading && users.map((u, i) => {
            const rs = ROLE_STYLE[u.role] || ROLE_STYLE.user
            const isSelf = u.id === user?.id
            return (
              <div key={u.id} style={{ display: 'grid', gridTemplateColumns: GRID, padding: '13px 20px', borderBottom: i < users.length-1 ? '1px solid #f0f4f1' : 'none', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: G, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {u.email}{isSelf && <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '6px' }}>(eu)</span>}
                </div>
                <div style={{ fontSize: '12px', color: '#4a6355' }}>{u.display_name || '—'}</div>
                <div><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: rs.bg, color: rs.color }}>{u.role === 'admin' ? L.admin : L.userRole}</span></div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{fmtDate(u.created_at)}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{fmtDate(u.last_sign_in_at)}</div>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <button onClick={() => openEdit(u)} style={{ padding: '5px 10px', background: BG, border: '1px solid #dde8de', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', color: '#4a6355' }}>{L.edit}</button>
                  <button onClick={() => remove(u)} disabled={isSelf || busyId === u.id} title={isSelf ? '' : L.del} style={{ padding: '5px 10px', background: isSelf ? '#f1f5f9' : '#fee2e2', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: isSelf ? 'not-allowed' : 'pointer', color: isSelf ? '#cbd5e1' : '#991b1b' }}>
                    {busyId === u.id ? '…' : L.del}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        </div>
      </div>

    </div>
  )
}
