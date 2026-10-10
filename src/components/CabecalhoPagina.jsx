import { useLang } from '../context/LangContext'

// Cabeçalho padrão das páginas (eyebrow + título + subtítulo), o mesmo das
// páginas mais recentes. Existe para os ecrãs que começavam direto nos
// controlos, sem título nenhum — o achado do QA de 13/08 ("sete ecrãs sem
// <h1>"): quem usa leitor de ecrã não sabia em que página estava, e quem vê
// também não tinha um título a que se agarrar.
//
// Textos em { pt, de, en }; strings simples servem para as três línguas.

// 10/10: o eyebrow, o título e o subtítulo deixaram de se ver (ocupavam a área
// útil sem acrescentar nada — o menu já diz onde se está). O <h1> fica, só para
// leitores de ecrã; as ações, quando as há, continuam à direita.
export default function CabecalhoPagina({ titulo, acoes }) {
  const { lang } = useLang()
  const tr = (x) => (x && typeof x === 'object' ? (x[lang] || x.pt) : x)

  return (
    <>
      <h1 className="so-leitores">{tr(titulo)}</h1>
      {acoes && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>{acoes}</div>}
    </>
  )
}
