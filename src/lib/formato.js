// Formatação de números e datas segundo a língua da interface.
//
// Antes, 14 ficheiros fixavam 'pt-PT' (e o Rücklagen fixava 'de-DE'), por isso
// quem usava a plataforma em alemão via números à portuguesa — e a plataforma
// ficava inconsistente consigo própria. Aqui fica a única fonte da verdade.
//
// Nota: '11 400,00' em vez de '11.400,00' não é erro em pt-PT — o português
// europeu não separa milhares em números de 4 dígitos. O que estava errado
// era a língua ser fixa.

export const localeDe = (lang) => lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-GB' : 'pt-PT'

export const dataDe = (lang) => (d) => d ? new Date(d).toLocaleDateString(localeDe(lang)) : ''
