import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useAlvoESG } from '../../context/AlvoESGContext'
import DocsBrowser from '../../components/DocsBrowser'
import { CartaoMetodo } from '../../components/esg/MetodoUI'

// "Um local onde eu possa guardar documentos" (Lúcia, 15/10): artigos, políticas,
// consumos, fotografias, atas — tudo o que fundamenta o relatório, desde o
// arranque. Pasta esg/<id do caso> no bucket client-docs; só a equipa a vê (o
// cliente não tem leitura nesta pasta e esta página não está no menu dele).
export default function DocumentosESG() {
  const { lang } = useLang()
  const { t } = useTheme()
  const { caso, soLeitura } = useAlvoESG()
  const L = lang === 'de' ? { titulo: 'Dokumente', sub: 'Richtlinien, Verbräuche, Fotos, Protokolle, Artikel des Kunden — alles, was Diagnose und Bericht stützt. Nur für das Team sichtbar.', semAcesso: 'Nur für das Team.' }
    : lang === 'en' ? { titulo: 'Documents', sub: 'Policies, consumption data, photos, minutes, the client’s articles — everything that grounds the diagnosis and the report. Team only.', semAcesso: 'Team only.' }
    : { titulo: 'Documentos', sub: 'Políticas, consumos, fotografias, atas, artigos do cliente — tudo o que fundamenta o diagnóstico e o relatório. Só a equipa os vê.', semAcesso: 'Só para a equipa.' }
  return (
    <div style={{ width: '100%', fontFamily: t.fontBody }}>
      <h1 className="so-leitores">{L.titulo}</h1>
      {soLeitura
        ? <div style={{ fontSize: '13px', color: t.subtle }}>{L.semAcesso}</div>
        : <CartaoMetodo titulo={L.titulo} sub={L.sub}><DocsBrowser userId={`esg/${caso.id}`} /></CartaoMetodo>}
    </div>
  )
}
