// Formulário de feedback dos eventos (pedido da Letícia, 13/11; migração 062).
// O mesmo para todos os eventos, a partir do formulário em papel do Momentos
// entre Empreendedores. As chaves são as que a API aceita (PERGUNTAS_FEEDBACK em
// api/evento.js); a página pública (public/feedback/index.html) tem os mesmos
// textos. Ao mudar uma pergunta, mude nos três sítios.

export const PERGUNTAS_FEEDBACK = [
  ['gostou', 'Gostaste de participar no evento?'],
  ['temas', 'Consideras que os temas abordados foram relevantes para o teu percurso como empreendedor(a)?'],
  ['palestras', 'As palestras corresponderam às tuas expectativas?'],
  ['networking', 'Consideras que o evento proporcionou boas oportunidades de networking e criação de contactos?'],
  ['voltaria', 'Participarias numa próxima edição?'],
  ['recomendaria', 'Recomendarias este evento a outros empreendedores?'],
]

// Lisboa ou o domínio onde a Gestão está aberta (em local, o próprio servidor)
const ORIGEM = typeof window === 'undefined' ? '' : window.location.hostname.endsWith('lcoffice.pt') ? 'https://lcoffice.pt' : window.location.origin
export const linkFeedback = (eventoId) => `${ORIGEM}/feedback/#e=${eventoId}`
export const mensagemFeedback = (nome, eventoId) =>
  `Obrigado por teres estado no ${nome}! Queremos saber como foi a tua experiência: a tua opinião ajuda-nos a tornar os próximos encontros ainda melhores. São só 6 perguntas de sim ou não: ${linkFeedback(eventoId)}`
