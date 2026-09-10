// Triagem do formulário de diagnóstico — a regra que decide se uma resposta
// entra no CRM como lead ou fica apenas registada.
//
// Decisão de 27/08: "usar o formulário de qualificação como filtro antes de
// inserir leads no CRM". Esta é a PRIMEIRA VERSÃO da regra, escrita para ser
// discutida e afinada com a Lúcia — os pesos estão todos aqui em cima, à vista,
// e mudá-los não obriga a mexer em mais nada.
//
// Duas notas sobre o desenho:
//
// 1. Ninguém se perde. Uma resposta não qualificada NÃO é apagada nem escondida
//    — fica na lista com o motivo à vista. A regra decide o que sobe ao CRM,
//    não o que existe.
// 2. A decisão final continua a ser dela. Mesmo qualificado, o lead só entra no
//    CRM quando a Lúcia carrega no botão (human-in-the-loop, como pediu).

export const PESOS = {
  jaFatura: 2,          // iniciou = sim
  vaiAbrir: 2,          // iniciou = planeia
  aindaNaoSabe: 1,      // iniciou = nao
  querMudarContabilista: 3,  // sinal mais forte que existe no formulário
  semContabilista: 2,
  faturacaoRelevante: 2,     // 1.000 €/mês ou mais
  dificuldadeIdentificada: 1,
}

export const CORTE = 4        // pontuação a partir da qual sobe ao CRM

const FATURACAO_RELEVANTE = ['1k_3k', '3k_5k', '5k_10k', 'gt10k']

/**
 * Avalia as respostas do enquadramento.
 * Devolve { qualificado, pontos, motivo } — o motivo é texto para a Lúcia ler,
 * não um código.
 */
export function triar(respostas = {}) {
  const razoes = []
  let pontos = 0

  // O país é eliminatório: a Lúcia trabalha Portugal e Alemanha.
  if (respostas.pais !== 'PT' && respostas.pais !== 'DE') {
    return {
      qualificado: false,
      pontos: 0,
      motivo: 'Fora de Portugal e da Alemanha — os únicos países que a plataforma cobre.',
    }
  }

  if (respostas.iniciou === 'sim') { pontos += PESOS.jaFatura; razoes.push('já está a faturar') }
  else if (respostas.iniciou === 'planeia') { pontos += PESOS.vaiAbrir; razoes.push('está a planear abrir atividade') }
  else if (respostas.iniciou === 'nao') { pontos += PESOS.aindaNaoSabe }

  if (respostas.contabilista === 'sim_mudar') { pontos += PESOS.querMudarContabilista; razoes.push('tem contabilista mas quer mudar') }
  else if (respostas.contabilista === 'nao') { pontos += PESOS.semContabilista; razoes.push('não tem contabilista') }

  if (FATURACAO_RELEVANTE.includes(respostas.faturacao)) {
    pontos += PESOS.faturacaoRelevante
    razoes.push('faturação já com dimensão')
  }

  if (respostas.dificuldade) { pontos += PESOS.dificuldadeIdentificada; razoes.push('identificou uma dificuldade concreta') }

  const qualificado = pontos >= CORTE
  const motivo = qualificado
    ? `Qualificado (${pontos} pontos): ${razoes.join(', ')}.`
    : `Abaixo do corte (${pontos} de ${CORTE} pontos)${razoes.length ? ': ' + razoes.join(', ') : ''}. Fica registado para acompanhares à mão.`

  return { qualificado, pontos, motivo }
}
