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

// Datas "só data" (AAAA-MM-DD, como as colunas `date` do Postgres). Passadas
// tal e qual ao Date(), são lidas como meia-noite UTC — e num fuso a oeste de
// Greenwich aparecem UM DIA ATRÁS. Forçar a hora faz o JavaScript lê-las como
// locais, que é o que significam: "dia 1 de setembro" não tem fuso horário.
export const dataSo = (d) => {
  if (!d) return null
  const s = String(d)
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00') : new Date(s)
}

// Formata uma data só-data segundo a língua da interface.
export const dataCurta = (d, lang) => {
  const dt = dataSo(d)
  return dt ? dt.toLocaleDateString(localeDe(lang)) : ''
}
