import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useViewAs } from '../context/ViewAsContext'

// Barra fixa no topo quando um admin está a "Ver como" outro utilizador.
export default function ViewAsBanner() {
  const { lang } = useLang()
  const { viewAs, isViewing, clearViewAs } = useViewAs()
  const navigate = useNavigate()
  if (!isViewing) return null

  const L = lang === 'de'
    ? { label: 'Ansicht als', readonly: 'nur Lesen', exit: 'Beenden' }
    : lang === 'en'
    ? { label: 'Viewing as', readonly: 'read-only', exit: 'Exit' }
    : { label: 'A visualizar como', readonly: 'só leitura', exit: 'Sair' }

  function exit() { clearViewAs(); navigate('/gestao/clientes') }

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 70, display: 'flex', alignItems: 'center', gap: '10px',
      padding: '9px 16px', background: '#5b21b6', color: '#fff', fontSize: '12.5px', fontWeight: 600,
    }}>
      <span style={{ fontSize: '14px' }}>👁</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {L.label} <strong>{viewAs?.name}</strong>
      </span>
      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,.22)', textTransform: 'uppercase', letterSpacing: '0.5px', flex: 'none' }}>{L.readonly}</span>
      <button onClick={exit} style={{ marginLeft: 'auto', flex: 'none', padding: '5px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,.4)', background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>✕ {L.exit}</button>
    </div>
  )
}
