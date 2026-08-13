import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { retiradasPrivadas, necessidadeCapital, financiamento, projecao, verificacaoLucro, liquidez } from '../src/lib/consultoriaCalc.js'
import { BLOCOS, SWOT_QUADRANTES, TOWS_CELULAS } from '../src/data/consultoriaBlocos.js'

// ============================================================================
// Gera o relatório da consultoria com a IA.
//
// Vive no servidor por uma razão só: a ANTHROPIC_API_KEY nunca pode entrar no
// bundle do frontend. Mesmo princípio da SUPABASE_SERVICE_ROLE_KEY.
//
// Os dados são lidos aqui pelo id — não se confia no que o browser envia.
// ============================================================================

const URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

// A geração demora — o pedido do utilizador prevê isso.
export const config = { maxDuration: 60 }

// Secções do relatório. A ordem é a do documento da IHK, porque o destinatário
// final é o banco e é assim que um gestor de crédito espera lê-lo.
const SECCOES = [
  { key: 'sumario',  pt: 'Sumário',                         de: 'Zusammenfassung',            en: 'Summary' },
  { key: 'ideia',    pt: 'A ideia de negócio e a pessoa',    de: 'Geschäftsidee und Person',   en: 'The business idea and the person' },
  { key: 'mercado',  pt: 'Mercado, clientes e concorrência', de: 'Markt, Kunden, Wettbewerb',  en: 'Market, customers and competition' },
  { key: 'estrategia', pt: 'SWOT e estratégias',            de: 'SWOT und Strategien',        en: 'SWOT and strategies' },
  { key: 'capital',  pt: 'Necessidade de capital e financiamento', de: 'Kapitalbedarf und Finanzierung', en: 'Capital needs and financing' },
  { key: 'projecoes', pt: 'Projeções e viabilidade',        de: 'Vorschau und Tragfähigkeit', en: 'Projections and viability' },
]

const SCHEMA = {
  type: 'object',
  properties: {
    seccoes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string', enum: SECCOES.map(s => s.key) },
          texto: { type: 'string' },
        },
        required: ['key', 'texto'],
        additionalProperties: false,
      },
    },
    lacunas: {
      type: 'array',
      description: 'O que ficou por preencher e é preciso para o plano ficar completo. Uma frase cada.',
      items: { type: 'string' },
    },
  },
  required: ['seccoes', 'lacunas'],
  additionalProperties: false,
}

const eur = (v) => `${Math.round(Number(v) || 0).toLocaleString('pt-PT')} €`
const linhas = (arr) => (arr || []).filter(l => String(l?.valor ?? '').trim())
  .map(l => `    - ${l.desc || '(sem descrição)'}: ${eur(l.valor)}`).join('\n') || '    (vazio)'

// Converte a consultoria no texto que a IA lê. Só entra o que foi preenchido —
// a IA tem de conseguir distinguir "está vazio" de "não existe".
export function descrever(c, lang) {
  const L = (o) => o?.[lang] || o?.pt || ''
  const out = []
  out.push(`# Consultoria de Implementação de Negócio`)
  out.push(`Cliente: ${c.nome}${c.empresa ? ` — ${c.empresa}` : ''}`)
  if (c.setor) out.push(`Setor: ${c.setor}`)
  out.push(`Bloco atual: ${c.bloco} de 4`)

  // Blocos 1 e 2 — as respostas às perguntas
  for (const b of BLOCOS) {
    for (const sec of b.seccoes || []) {
      if (!sec.perguntas?.length) continue
      const respondidas = sec.perguntas
        .filter(q => (c.respostas?.[q.key] || '').trim())
        .map(q => `  - ${L(q)}\n    → ${c.respostas[q.key].trim()}`)
      out.push(`\n## ${sec.num} ${L(sec)}`)
      out.push(respondidas.length ? respondidas.join('\n') : '  (nenhuma pergunta respondida)')
      const porResponder = sec.perguntas.filter(q => !(c.respostas?.[q.key] || '').trim())
      if (porResponder.length && respondidas.length) {
        out.push(`  POR RESPONDER: ${porResponder.map(q => L(q)).join(' | ')}`)
      }
    }
  }

  // SWOT
  out.push(`\n## SWOT`)
  for (const q of SWOT_QUADRANTES) {
    const itens = c.swot?.[q.key] || []
    out.push(`  ${L(q)}: ${itens.length ? itens.join('; ') : '(vazio)'}`)
  }

  // TOWS, com a origem de cada estratégia
  out.push(`\n## TOWS — estratégias`)
  const rotulo = (ref) => {
    const [qk, i] = String(ref).split(':')
    return (c.swot?.[qk] || [])[Number(i)] || ref
  }
  for (const cel of TOWS_CELULAS) {
    const est = c.tows?.[cel.key] || []
    if (!est.length) { out.push(`  ${cel.sigla} (${L(cel)}): (vazio)`); continue }
    out.push(`  ${cel.sigla} (${L(cel)}):`)
    for (const e of est) {
      const orig = (e.origem || []).map(rotulo)
      out.push(`    - ${e.texto}${orig.length ? `  [nasce de: ${orig.join(' + ')}]` : ''}`)
    }
  }

  // Números — valores já calculados, para a IA não fazer aritmética
  const num = c.numeros || {}
  const ret = retiradasPrivadas(num.privadas)
  const proj = projecao(num.projecao)
  const cap = necessidadeCapital(num.capital, proj.custosAno1)
  const fin = financiamento(num.financiamento, cap.total)
  const ver = verificacaoLucro(num.projecao, ret.necessarioAno, fin.amortizacaoAno)
  const liq = liquidez(num.liquidez)

  out.push(`\n## 2.1 Retiradas privadas`)
  out.push(`  Rendimentos do agregado:\n${linhas(num.privadas?.rendimentos)}`)
  out.push(`  Despesas do agregado:\n${linhas(num.privadas?.despesas)}`)
  out.push(`  CALCULADO — retirada necessária: ${eur(ret.necessarioMes)}/mês · ${eur(ret.necessarioAno)}/ano`)

  out.push(`\n## 2.2.1 Necessidade de capital`)
  out.push(`  Investimentos:\n${linhas(num.capital?.investimentos)}`)
  out.push(`  Custos de constituição:\n${linhas(num.capital?.constituicao)}`)
  out.push(`  Reserva (${cap.meses} meses): ${eur(cap.reserva)}`)
  out.push(`  CALCULADO — necessidade total: ${eur(cap.total)}`)

  out.push(`\n## 2.2.2 Financiamento`)
  out.push(`  Capital próprio:\n${linhas(num.financiamento?.proprio)}`)
  out.push(`  Capital alheio:\n${linhas(num.financiamento?.alheio)}`)
  out.push(`  Amortização anual prevista: ${eur(fin.amortizacaoAno)}`)
  out.push(`  CALCULADO — financiamento total: ${eur(fin.total)}`)
  out.push(`  VERIFICAÇÃO 1 — o financiamento cobre a necessidade de capital? ${fin.cobre ? `SIM (excedente de ${eur(fin.diferenca)})` : `NÃO — faltam ${eur(Math.abs(fin.diferenca))}`}`)

  out.push(`\n## 2.2.3 Projeção a 3 anos (faturação líquida, sem IVA)`)
  for (const a of ver) {
    out.push(`  Ano ${a.ano}: receitas ${eur(a.receitas)} · custos ${eur(a.custos)} · lucro ${eur(a.lucro)}`)
    out.push(`    VERIFICAÇÃO 2 — o lucro cobre as retiradas privadas (${eur(ret.necessarioAno)}) + amortizações (${eur(fin.amortizacaoAno)}) = ${eur(a.exigido)}? ${a.cobre ? `SIM (folga de ${eur(a.folga)})` : `NÃO — faltam ${eur(Math.abs(a.folga))}`}`)
  }

  out.push(`\n## Liquidez (12 meses do ano 1)`)
  out.push(`  Saldo final do ano: ${eur(liq.saldoFinal)}`)
  out.push(liq.ok ? `  O saldo mantém-se positivo todo o ano.`
    : `  O saldo fica NEGATIVO a partir do mês ${liq.negativos[0].mes}.`)

  if (c.notas?.trim()) out.push(`\n## Notas internas da consultora\n  ${c.notas.trim()}`)
  return out.join('\n')
}

const IDIOMA = {
  pt: 'português de Portugal', de: 'alemão', en: 'inglês',
}

function instrucoes(lang) {
  const lista = SECCOES.map(s => `- ${s.key}: ${s.pt}`).join('\n')
  return `És assistente de uma consultora de negócios que acompanha quem está a montar uma empresa.
Ela preencheu a ficha de consultoria com o cliente à frente, sessão a sessão, seguindo o
guião da Câmara de Comércio alemã (IHK). O teu trabalho é transformar essa ficha num relatório.

# Para quem é este relatório
O destino é o **banco**: o cliente vai apresentá-lo para pedir financiamento. Escreve como
quem prepara um documento que um gestor de crédito vai ler — factual, ordenado, sem
adjetivação comercial. Não é um resumo bonito; é um dossiê.

# O limite mais importante
**Descreve, não decidas.** Organizas e narras o que foi preenchido; não emites juízo sobre se
o negócio é bom, não recomendas estratégias que a consultora não escreveu, não inventas
números, não estimas o que não está lá. Se algo falta, dizes que falta — não preenches.
A decisão é da consultora, não tua.

# Regras concretas
- Escreve em ${IDIOMA[lang] || IDIOMA.pt}.
- Usa apenas o que está na ficha. Zero suposições sobre o setor, o mercado ou a pessoa.
- Os valores marcados CALCULADO e VERIFICAÇÃO já vêm calculados — cita-os, nunca recalcules
  nem contradigas.
- As duas verificações são o coração do dossiê. Quando uma delas dá NÃO, diz isso com todas as
  letras e com o valor em falta: é precisamente o que o banco vai querer ver tratado.
- Prosa corrida, parágrafos curtos. Sem markdown, sem títulos, sem listas com marcas — cada
  secção já tem o seu título na página.
- Uma secção sem dados leva uma frase única a dizer que ainda não foi preenchida. Não a
  encham de texto genérico.
- Em 'lacunas', lista o que falta preencher para o plano ficar apresentável. Uma frase por
  item, concreta ("Falta X"). Se não faltar nada, devolve lista vazia.

# Secções a devolver (todas, por esta ordem)
${lista}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' })
  if (!URL || !SERVICE_KEY) return res.status(500).json({ error: 'Servidor sem SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.' })
  if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'Servidor sem ANTHROPIC_API_KEY configurada.' })

  const admin = createClient(URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })

  // ── 1. Autenticar quem chama ──
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
  if (!token) return res.status(401).json({ error: 'Sessão em falta.' })
  const { data: caller, error: callerErr } = await admin.auth.getUser(token)
  if (callerErr || !caller?.user) return res.status(401).json({ error: 'Sessão inválida.' })

  // ── 2. Confirmar que é admin (a consultoria tem dados de clientes) ──
  const { data: prof } = await admin.from('profiles').select('role').eq('id', caller.user.id).single()
  if (prof?.role !== 'admin') return res.status(403).json({ error: 'Sem permissão.' })

  const { id, lang = 'pt' } = req.body || {}
  if (!id) return res.status(400).json({ error: 'Falta o id da consultoria.' })

  try {
    // ── 3. Ler a consultoria aqui, não aceitar conteúdo do browser ──
    const { data: c, error } = await admin.from('consultorias').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    if (!c) return res.status(404).json({ error: 'Consultoria não encontrada.' })

    const idioma = ['pt', 'de', 'en'].includes(lang) ? lang : 'pt'
    const ficha = descrever(c, idioma)

    // ── 4. Gerar ──
    // Em stream para não bater no timeout HTTP; o cliente recebe o resultado
    // completo de uma vez, que é o que a página precisa.
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY })
    const stream = anthropic.messages.stream({
      model: 'claude-opus-5',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      output_config: {
        effort: 'medium',
        format: { type: 'json_schema', schema: SCHEMA },
      },
      system: instrucoes(idioma),
      messages: [{ role: 'user', content: `Ficha preenchida da consultoria:\n\n${ficha}` }],
    })
    const message = await stream.finalMessage()

    if (message.stop_reason === 'refusal') {
      return res.status(422).json({ error: 'O modelo recusou gerar este conteúdo.' })
    }
    const bloco = message.content.find(b => b.type === 'text')
    if (!bloco) return res.status(502).json({ error: 'Resposta vazia do modelo.' })

    let saida
    try { saida = JSON.parse(bloco.text) }
    catch { return res.status(502).json({ error: 'Resposta do modelo ilegível.' }) }

    // ── 5. Guardar, preservando o texto que ela já tenha editado à mão ──
    const anterior = c.relatorio || {}
    const relatorio = {
      seccoes: saida.seccoes || [],
      lacunas: saida.lacunas || [],
      gerado_em: new Date().toISOString(),
      modelo: message.model,
      lang: idioma,
      editado: anterior.editado || {},
    }
    await admin.from('consultorias').update({ relatorio, updated_at: new Date().toISOString() }).eq('id', id)

    return res.status(200).json({
      relatorio,
      usage: { input: message.usage?.input_tokens, output: message.usage?.output_tokens },
    })
  } catch (e) {
    // Erros da API da Anthropic trazem status; passa-o adiante para a página
    // poder distinguir "sem quota" de "falhou".
    const status = e?.status && e.status >= 400 && e.status < 600 ? e.status : 500
    return res.status(status).json({ error: e?.message || 'Falha ao gerar o relatório.' })
  }
}

export { SECCOES }
