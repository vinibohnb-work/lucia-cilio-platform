import { createContext, useContext } from 'react'

// O "alvo" das páginas ESG: o caso (esg_consultorias) em que se está a trabalhar.
//
// Reunião de 18/09: a ESG deixa de pertencer ao utilizador e passa a pertencer
// a um caso, como a Consultoria. As seis páginas não sabem se estão dentro da
// Gestão (a Lúcia a preencher) ou na área do cliente (só leitura) — perguntam
// aqui quem é o caso, onde vivem as rotas e se podem gravar.
//
//   caso      — a linha de esg_consultorias
//   id        — atalho para caso.id
//   base      — prefixo das rotas: /gestao/esg/:id ou /esg
//   soLeitura — true na área do cliente e no "Ver como"
//   recarregar— volta a ler o caso (depois de mudar estado, ligações…)

const AlvoESGContext = createContext(null)

export const AlvoESGProvider = AlvoESGContext.Provider

export function useAlvoESG() {
  const v = useContext(AlvoESGContext)
  if (!v) throw new Error('useAlvoESG fora de um CasoESG/ClienteESG')
  return v
}
