import { useLang } from '../context/LangContext'
import { useTheme } from '../context/ThemeContext'
import { useIsMobile } from '../hooks/useIsMobile'

// Cabeçalho padrão das páginas (eyebrow + título + subtítulo), o mesmo das
// páginas mais recentes. Existe para os ecrãs que começavam direto nos
// controlos, sem título nenhum — o achado do QA de 13/08 ("sete ecrãs sem
// <h1>"): quem usa leitor de ecrã não sabia em que página estava, e quem vê
// também não tinha um título a que se agarrar.
//
// Textos em { pt, de, en }; strings simples servem para as três línguas.

export default function CabecalhoPagina({ eyebrow, titulo, sub, acoes }) {
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const tr = (x) => (x && typeof x === 'object' ? (x[lang] || x.pt) : x)

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap', marginBottom: '18px' }}>
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accentText }}>{tr(eyebrow)}</div>}
        <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '27px' : '34px', lineHeight: 1.05, letterSpacing: '-.5px', color: t.heading }}>{tr(titulo)}</h1>
        {sub && <p style={{ fontSize: '12.5px', color: t.textMuted, margin: '8px 0 0', maxWidth: '600px', lineHeight: 1.5 }}>{tr(sub)}</p>}
      </div>
      {acoes && <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>{acoes}</div>}
    </div>
  )
}
