// Ícones pequenos em linha (substituem emojis nos botões: o emoji muda de
// aspeto em cada sistema e os leitores de ecrã leem-no em voz alta).
// Herdam a cor do texto; aria-hidden porque o rótulo do botão já diz tudo.

const base = (tam) => ({ width: tam, height: tam, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, style: { flex: 'none', verticalAlign: '-0.15em' } })

export const IconImprimir = ({ tam = 14 }) => (
  <svg {...base(tam)}><path d="M6 9V3h12v6" /><rect x="3" y="9" width="18" height="8" rx="2" /><path d="M7 14h10v7H7z" /></svg>
)
export const IconFicheiro = ({ tam = 14 }) => (
  <svg {...base(tam)}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" /></svg>
)
export const IconRaio = ({ tam = 14 }) => (
  <svg {...base(tam)}><path d="M13 2 4 14h7l-1 8 9-12h-7z" /></svg>
)
export const IconBrilho = ({ tam = 14 }) => (
  <svg {...base(tam)}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></svg>
)
