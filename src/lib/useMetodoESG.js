import { useAlvoESG } from '../context/AlvoESGContext'

// O método ESG da Lúcia (arranque, fotografia, problemas, acompanhamento) grava-se
// em esg_consultorias.metodo (migração 046); quem grava é o CasoESG
// (alterarMetodo). Na área do cliente não há quem grave: tudo fica só para leitura.

export function useMetodo() {
  const { caso, soLeitura, alterarMetodo } = useAlvoESG()
  const metodo = caso?.metodo || {}
  const podeGravar = !soLeitura && typeof alterarMetodo === 'function'
  return { metodo, soLeitura: !podeGravar, gravar: podeGravar ? alterarMetodo : () => {} }
}

export const novoIdLocal = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()))

// Lista de registos (problemas, reuniões, feedback) dentro de metodo[chave]
export function useLista(chave) {
  const { metodo, gravar, soLeitura } = useMetodo()
  const itens = Array.isArray(metodo[chave]) ? metodo[chave] : []
  return {
    itens, soLeitura,
    juntar: (novo) => gravar(chave, [...itens, { id: novoIdLocal(), ...novo }]),
    alterar: (id, patch) => gravar(chave, itens.map(i => i.id === id ? { ...i, ...patch } : i)),
    remover: (id) => gravar(chave, itens.filter(i => i.id !== id)),
  }
}
