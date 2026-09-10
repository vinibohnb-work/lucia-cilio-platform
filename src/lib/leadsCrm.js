// Ponte para o CRM — cria um lead a partir de um contacto que já existe noutro
// sítio da plataforma: a ficha de uma consultoria ou uma submissão do
// formulário de diagnóstico.
//
// Decisão de 27/08: os contactos das consultorias passam a alimentar o CRM, e o
// formulário de qualificação funciona como filtro antes disso. Em ambos os
// casos quem carrega no botão é a Lúcia — a plataforma propõe, ela decide
// (o princípio human-in-the-loop que ela pediu desde julho).

import { supabase } from './supabase'
import { opcaoDe } from '../data/enquadramento'

// A dor do lead, tirada da pergunta "principal dificuldade" do enquadramento.
export function dorDoEnquadramento(enq = {}, lang = 'pt') {
  if (!enq?.dificuldade) return null
  if (enq.dificuldade === 'outra') return enq.dificuldade_outra || null
  return opcaoDe('dificuldade', enq.dificuldade, lang) || null
}

// Resumo em texto do enquadramento, para ficar nas notas do lead: quando ela
// abrir o cartão no CRM tem ali o essencial sem ter de saltar para outro ecrã.
export function resumoEnquadramento(enq = {}, lang = 'pt') {
  const linhas = []
  const põe = (rotulo, valor) => { if (valor) linhas.push(`${rotulo}: ${valor}`) }
  põe('País', opcaoDe('pais', enq.pais, lang))
  põe('Já iniciou atividade', opcaoDe('iniciou', enq.iniciou, lang))
  põe('Regime', opcaoDe('regime', enq.regime, lang))
  põe('IVA', opcaoDe('iva', enq.iva, lang))
  põe('Faturação mensal', opcaoDe('faturacao', enq.faturacao, lang))
  põe('Contabilista', opcaoDe('contabilista', enq.contabilista, lang))
  põe('Dificuldade', dorDoEnquadramento(enq, lang))
  return linhas.join('\n')
}

/**
 * Cria o lead no CRM a partir de um contacto.
 *
 * Nota sobre a faturação: o `revenue_range` fica deliberadamente por preencher.
 * As bandas do formulário são MENSAIS e as do CRM são ANUAIS — 10.000 €/mês cai
 * já na 2.ª banda anual do CRM. Converter às cegas estragaria a pontuação de
 * "cliente ideal", por isso a banda fica para a Lúcia escolher (é um item aberto
 * no backlog). A faturação declarada vai nas notas, para ela não ter de perguntar.
 */
export async function criarLeadDeContacto({
  nome, empresa, email, telefone, setor,
  enquadramento = {}, origem = 'manual', notaExtra = '', lang = 'pt',
}) {
  if (!nome?.trim()) return { error: { message: 'Falta o nome.' } }

  const notas = [notaExtra, resumoEnquadramento(enquadramento, lang)]
    .filter(Boolean).join('\n')

  const { data, error } = await supabase.from('crm_leads').insert({
    name: nome.trim(),
    company: empresa?.trim() || null,
    contact: email?.trim() || telefone?.trim() || null,
    sector: setor?.trim() || null,
    pain: dorDoEnquadramento(enquadramento, lang),
    notes: notas || null,
    source: origem,
    stage: 'mapeado',
    last_contact_at: new Date().toISOString(),
  }).select('id').single()

  return { data, error }
}
