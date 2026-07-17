import { useState, useEffect, useCallback, useRef } from 'react'
import { useLang } from '../context/LangContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'

// Repositório de documentos tipo Drive sobre o Supabase Storage (bucket
// 'client-docs'). Caminho: {userId}/{pastas...}/{ficheiro}. Pastas são
// implícitas (prefixos); pastas vazias usam um marcador '.keep'.
// readOnly: cliente (só navegar + descarregar). Admin: upload/pastas/eliminar.

const BUCKET = 'client-docs'
const KEEP = '.keep'

const extIcon = (name) => {
  const ext = (name.split('.').pop() || '').toLowerCase()
  if (['pdf'].includes(ext)) return '📄'
  if (['doc', 'docx', 'odt', 'txt', 'md', 'rtf'].includes(ext)) return '📝'
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return '📊'
  if (['ppt', 'pptx', 'odp'].includes(ext)) return '📽️'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'heic'].includes(ext)) return '🖼️'
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '🗜️'
  if (['mp3', 'wav', 'm4a', 'ogg'].includes(ext)) return '🎵'
  if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return '🎬'
  return '📎'
}
const fmtSize = (b) => {
  const n = Number(b) || 0
  if (n >= 1048576) return `${(n / 1048576).toFixed(1)} MB`
  if (n >= 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${n} B`
}

export default function DocsBrowser({ userId, readOnly = false }) {
  const { lang } = useLang()
  const { t } = useTheme()
  const fileInput = useRef(null)

  const [path, setPath] = useState([])          // segmentos abaixo de userId
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const L = lang === 'de' ? {
    root: 'Dokumente', upload: '⬆ Hochladen', newFolder: '+ Ordner',
    folderName: 'Ordnername:', empty: 'Dieser Ordner ist leer.',
    download: 'Herunterladen', del: 'Löschen', loading: 'Wird geladen…',
    confirmFile: (n) => `Datei „${n}" löschen?`, confirmFolder: (n) => `Ordner „${n}" und gesamten Inhalt löschen?`,
    uploadErr: 'Fehler (Migration 019 / Bucket client-docs nötig).', uploading: 'Wird hochgeladen…',
  } : lang === 'en' ? {
    root: 'Documents', upload: '⬆ Upload', newFolder: '+ Folder',
    folderName: 'Folder name:', empty: 'This folder is empty.',
    download: 'Download', del: 'Delete', loading: 'Loading…',
    confirmFile: (n) => `Delete file "${n}"?`, confirmFolder: (n) => `Delete folder "${n}" and all its contents?`,
    uploadErr: 'Error (migration 019 / client-docs bucket required).', uploading: 'Uploading…',
  } : {
    root: 'Documentos', upload: '⬆ Carregar', newFolder: '+ Pasta',
    folderName: 'Nome da pasta:', empty: 'Esta pasta está vazia.',
    download: 'Descarregar', del: 'Eliminar', loading: 'A carregar…',
    confirmFile: (n) => `Eliminar o ficheiro "${n}"?`, confirmFolder: (n) => `Eliminar a pasta "${n}" e todo o conteúdo?`,
    uploadErr: 'Erro (é necessária a migração 019 / bucket client-docs).', uploading: 'A carregar…',
  }

  const prefix = [userId, ...path].join('/')

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true); setErr('')
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 500, sortBy: { column: 'name', order: 'asc' } })
    if (error) { setErr(L.uploadErr); setItems([]) }
    else {
      const list = (data || []).filter(i => i.name !== KEEP)
      // Pastas primeiro (no Storage, pastas vêm sem id/metadata)
      list.sort((a, b) => ((a.id ? 1 : 0) - (b.id ? 1 : 0)) || a.name.localeCompare(b.name))
      setItems(list)
    }
    setLoading(false)
  }, [userId, prefix]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])

  async function uploadFiles(files) {
    if (!files?.length) return
    setBusy(true); setErr('')
    for (const f of files) {
      const { error } = await supabase.storage.from(BUCKET).upload(`${prefix}/${f.name}`, f, { upsert: true })
      if (error) { setErr(L.uploadErr); break }
    }
    setBusy(false); load()
  }
  async function newFolder() {
    const name = window.prompt(L.folderName)
    if (!name) return
    const clean = name.replace(/[/\\]/g, '-').trim()
    if (!clean) return
    setBusy(true); setErr('')
    const { error } = await supabase.storage.from(BUCKET).upload(`${prefix}/${clean}/${KEEP}`, new Blob(['']), { upsert: true })
    if (error) setErr(L.uploadErr)
    setBusy(false); load()
  }
  async function download(name) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(`${prefix}/${name}`, 120)
    if (error || !data?.signedUrl) { setErr(L.uploadErr); return }
    window.open(data.signedUrl, '_blank', 'noreferrer')
  }
  async function removeFile(name) {
    if (!window.confirm(L.confirmFile(name))) return
    setBusy(true)
    const { error } = await supabase.storage.from(BUCKET).remove([`${prefix}/${name}`])
    if (error) setErr(L.uploadErr)
    setBusy(false); load()
  }
  // Eliminar pasta = remover recursivamente todos os objetos sob o prefixo.
  async function collectPaths(p) {
    const { data } = await supabase.storage.from(BUCKET).list(p, { limit: 500 })
    let out = []
    for (const it of data || []) {
      if (it.id) out.push(`${p}/${it.name}`)
      else out = out.concat(await collectPaths(`${p}/${it.name}`))
    }
    return out
  }
  async function removeFolder(name) {
    if (!window.confirm(L.confirmFolder(name))) return
    setBusy(true)
    const paths = await collectPaths(`${prefix}/${name}`)
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths)
    setBusy(false); load()
  }

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-GB' : 'pt-PT') : ''
  const btn = { padding: '8px 13px', borderRadius: '9px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: `1px solid ${t.cardBorder}`, background: t.softCardBg, color: t.heading, whiteSpace: 'nowrap' }

  return (
    <div>
      {/* Barra: breadcrumb + ações */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', fontSize: '12.5px', fontWeight: 600, flex: 1, minWidth: '200px' }}>
          <span onClick={() => setPath([])} style={{ cursor: 'pointer', color: path.length ? t.accent : t.heading }}>📂 {L.root}</span>
          {path.map((seg, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ color: t.subtle }}>/</span>
              <span onClick={() => setPath(path.slice(0, i + 1))} style={{ cursor: 'pointer', color: i === path.length - 1 ? t.heading : t.accent }}>{seg}</span>
            </span>
          ))}
        </div>
        {!readOnly && (
          <div style={{ display: 'flex', gap: '7px' }}>
            <button onClick={newFolder} disabled={busy} style={btn}>{L.newFolder}</button>
            <button onClick={() => fileInput.current?.click()} disabled={busy} style={{ ...btn, background: t.btnBg, color: t.btnInk, border: 'none' }}>{busy ? L.uploading : L.upload}</button>
            <input ref={fileInput} type="file" multiple style={{ display: 'none' }} onChange={e => { uploadFiles(Array.from(e.target.files || [])); e.target.value = '' }} />
          </div>
        )}
      </div>

      {err && <div style={{ background: t.dueLate?.bg || '#fee2e2', color: t.dueLate?.ink || '#991b1b', borderRadius: '9px', padding: '9px 13px', fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>{err}</div>}
      {loading && <div style={{ padding: '22px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>{L.loading}</div>}
      {!loading && items.length === 0 && <div style={{ padding: '22px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>{L.empty}</div>}

      {/* Lista */}
      {!loading && items.map(it => {
        const isFolder = !it.id
        return (
          <div key={it.name}
            onClick={() => isFolder ? setPath([...path, it.name]) : download(it.name)}
            style={{ display: 'flex', alignItems: 'center', gap: '11px', padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', borderBottom: `1px solid ${t.rowBorder || t.cardBorder}` }}
            onMouseEnter={e => { e.currentTarget.style.background = t.softCardBg }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{ fontSize: '18px', flex: 'none' }}>{isFolder ? '📁' : extIcon(it.name)}</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: t.heading, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</span>
            {!isFolder && <span style={{ fontSize: '11px', color: t.subtle, flex: 'none' }}>{fmtSize(it.metadata?.size)}</span>}
            <span style={{ fontSize: '11px', color: t.subtle, flex: 'none', width: '78px', textAlign: 'right' }}>{fmtDate(it.updated_at || it.created_at)}</span>
            {!isFolder && (
              <button onClick={e => { e.stopPropagation(); download(it.name) }} title={L.download} style={{ flex: 'none', background: 'none', border: 'none', cursor: 'pointer', color: t.accent, padding: '3px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M12 3v12M6 11l6 6 6-6M4 21h16"/></svg>
              </button>
            )}
            {!readOnly && (
              <button onClick={e => { e.stopPropagation(); isFolder ? removeFolder(it.name) : removeFile(it.name) }} title={L.del} style={{ flex: 'none', background: 'none', border: 'none', cursor: 'pointer', color: t.subtle, padding: '3px', fontSize: '13px', lineHeight: 1 }}>✕</button>
            )}
          </div>
        )
      })}
    </div>
  )
}
