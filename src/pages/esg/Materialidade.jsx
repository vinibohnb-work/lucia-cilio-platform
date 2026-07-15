import { useLang } from '../../context/LangContext'

export default function Materialidade() {
  const { lang } = useLang()
  const txt = lang === 'de' ? 'Wesentlichkeit — in Arbeit' : lang === 'en' ? 'Materiality — under construction' : 'Materialidade — em construção'
  return <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: '18px' }}>🚧 {txt}</div>
}
