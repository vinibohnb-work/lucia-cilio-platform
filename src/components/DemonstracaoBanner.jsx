import { useLocation } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import { useViewAs } from '../context/ViewAsContext'

// Faixa da demonstração (01/10): a administradora usa a Contabilidade com a
// própria conta, para testar e mostrar. Os dados ficam na conta dela e nenhum
// cliente os vê — a faixa diz isso, para não se confundir com um cliente real.
export default function DemonstracaoBanner() {
  const { lang } = useLang()
  const { role } = useAuth()
  const { isViewing } = useViewAs()
  const { pathname } = useLocation()
  if (role !== 'admin' || isViewing) return null
  if (!pathname.startsWith('/contabilidade') && !pathname.startsWith('/consultoria')) return null

  const L = lang === 'de'
    ? { tag: 'Demo', txt: 'Ihr eigenes Konto — die Daten bleiben bei Ihnen und kein Kunde sieht sie. Zum Testen und Vorführen.' }
    : lang === 'en'
    ? { tag: 'Demo', txt: 'Your own account — the data stays with you and no client sees it. For testing and demonstrating.' }
    : { tag: 'Demonstração', txt: 'A sua própria conta — os dados ficam consigo e nenhum cliente os vê. Para testar e mostrar.' }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', background: '#f3ead2', color: '#5c4a17', fontSize: '12.5px', borderBottom: '1px solid #e2d3a8' }}>
      <span style={{ flex: 'none', fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.6px', padding: '2px 9px', borderRadius: '20px', background: '#c9a84c', color: '#0a2f1a' }}>{L.tag}</span>
      <span>{L.txt}</span>
    </div>
  )
}
