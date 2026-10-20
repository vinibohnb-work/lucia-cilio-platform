import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useMetodo } from '../../lib/useMetodoESG'
import { CampoTexto, CartaoMetodo } from './MetodoUI'
import { PILARES_FOTO, CAMPOS_FOTO, CAMPOS_DEVOLUCAO, txt } from '../../data/esgMetodo'

// Fase 1 do método — "Onde estamos?". Ao lado dos números do questionário, a
// fotografia qualitativa por pilar (o que já faz, lacunas, riscos e oportunidades,
// o que ficou sem resposta) e a primeira devolução ao cliente: o que mostra que
// é consultoria, não formação.
export default function FotografiaESG() {
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const { metodo, gravar, soLeitura } = useMetodo()
  const foto = metodo.fotografia || {}
  const dev = metodo.devolucao || {}

  const L = lang === 'de' ? {
    fotoT: 'Ist-Aufnahme je Säule', fotoSub: 'Was bei Gesprächen, Besichtigung, Website und Dokumenten aufgefallen ist.',
    devT: 'Erste Rückmeldung an den Kunden', devSub: 'Aus dem Gehörten: was schon gut läuft, was mehr Analyse braucht, welche Chancen es gibt.',
  } : lang === 'en' ? {
    fotoT: 'Snapshot by pillar', fotoSub: 'What came up in interviews, the site visit, the website and the documents.',
    devT: 'First feedback to the client', devSub: 'From what was heard: what is already developed, what needs more analysis, which opportunities exist.',
  } : {
    fotoT: 'Fotografia por pilar', fotoSub: 'O que surgiu nas entrevistas, na observação do espaço, no website e nos documentos.',
    devT: 'Primeira devolução ao cliente', devSub: 'A partir do que se ouviu: o que já está desenvolvido, o que precisa de mais análise e as oportunidades.',
  }

  return (
    <div style={{ marginTop: '18px' }}>
      <CartaoMetodo titulo={L.fotoT} sub={L.fotoSub}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: '16px' }}>
          {PILARES_FOTO.map(p => (
            <div key={p.key} style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: t.heading }}>{p.key} · {txt(p.nome, lang)}</div>
                <div style={{ fontSize: '11.5px', color: t.subtle, lineHeight: 1.4 }}>{txt(p.ajuda, lang)}</div>
              </div>
              {CAMPOS_FOTO.map(c => (
                <CampoTexto key={c.key} rotulo={txt(c.t, lang)} linhas={2} soLeitura={soLeitura}
                  valor={foto[p.key]?.[c.key]}
                  aoGravar={(v) => gravar('fotografia', { ...foto, [p.key]: { ...(foto[p.key] || {}), [c.key]: v } })} />
              ))}
            </div>
          ))}
        </div>
      </CartaoMetodo>

      <CartaoMetodo titulo={L.devT} sub={L.devSub}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: '14px' }}>
          {CAMPOS_DEVOLUCAO.map(c => (
            <CampoTexto key={c.key} rotulo={txt(c.t, lang)} linhas={4} soLeitura={soLeitura}
              valor={dev[c.key]} aoGravar={(v) => gravar('devolucao', { ...dev, [c.key]: v })} />
          ))}
        </div>
      </CartaoMetodo>
    </div>
  )
}
