import { useLang } from '../../context/LangContext'

export default function RelatoriosESG() {
  const { lang } = useLang()
  const txt = lang === 'de' ? 'ESG-Berichte — in Arbeit' : lang === 'en' ? 'ESG Reports — under construction' : 'Relatórios ESG — em construção'
  return <div style={{ color: 'var(--green)', fontWeight: 700, fontSize: '18px' }}>🚧 {txt}</div>
}
