// ============================================================================
// Gera o HTML do relatório de consultoria segundo o modelo de design aprovado.
//
// Divisão de responsabilidades, e é deliberada:
//   · os NÚMEROS saem daqui (consultoriaCalc) — nunca da IA;
//   · a PROSA e os juízos qualitativos saem da IA, que os escreve a partir da
//     ficha e a consultora edita por cima;
//   · o que não foi preenchido é omitido, não inventado — uma página sem dados
//     desaparece em vez de aparecer vazia.
//
// Função pura: entra a consultoria e o relatório, sai uma string de HTML.
// ============================================================================

import {
  retiradasPrivadas, necessidadeCapital, financiamento,
  projecao, verificacaoLucro, liquidez, soma,
} from './consultoriaCalc.js'
import { SWOT_QUADRANTES, TOWS_CELULAS, BLOCOS } from '../data/consultoriaBlocos.js'
import { CAMPOS as CAMPOS_ENQ, opcaoDe } from '../data/enquadramento.js'

// ── Paleta do modelo ────────────────────────────────────────────────────────
const C = {
  verde: '#0a2f1a', verdeMed: '#164e2b', verdeClaro: '#2f7d4f', verdeSuave: '#3d6b4c',
  ouro: '#c9a84c', creme: '#f3ecdb', tinta: '#1d2b22', texto: '#2c3b31',
  suave: '#5b6b60', mudo: '#8b998f', mudo2: '#7c8c82', linha: '#dfe6e0',
  linhaLeve: '#eef2ee', linha2: '#e6ebe6', fundoSuave: '#f7f9f7', fundoVerde: '#f5f9f6',
  alertaFundo: '#fdf6ef', alertaFundo2: '#fdf7f4', alerta: '#b4552e', alertaLinha: '#f6eae5',
  laranja: '#d98f4e', vermelho: '#c25a3a', positivo: '#8fc9a2', negativo: '#e08a6a',
  verdeMudo: '#8ba394', azul: '#2f6b8a', azul2: '#4a86a5', azul3: '#7aa8bf', azul4: '#a9c6d4',
}
const SERIF = "'Cormorant Garamond',Georgia,serif"
const SANS = "'Instrument Sans',system-ui,sans-serif"

export const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const T = {
  pt: { relatorio: 'Relatório de consultoria', cliente: 'Cliente', setor: 'Setor',
    emitido: 'Relatório emitido em', rodape: 'Lúcia Cílio · Office Consulting',
    v1: 'Verificação 1 · Financiamento cobre a necessidade',
    v2: 'Verificação 2 · Lucro cobre retiradas e amortizações',
    sim: 'SIM', nao: 'NÃO', faltam: 'faltam', nosTres: 'nos três anos', naoTodos: 'não em todos os anos',
    sumario: 'Sumário executivo', necessidade: 'Necessidade', financiamento: 'Financiamento',
    defice: 'Défice', excedente: 'Excedente', lucroAno1: 'Lucro ano 1',
    posicao: 'Posição do dossiê', bandas: ['Inviável', 'Frágil', 'Viável com correções', 'Sólido', 'Muito sólido'],
    atual: 'Situação atual', confirmado: 'O que está confirmado', emAberto: 'O que fica em aberto',
    ideia: 'A ideia de negócio e a pessoa', mercado: 'Mercado, clientes e concorrência',
    swot: 'Análise SWOT', pesos: 'Peso dos fatores', tows: 'Matriz TOWS · estratégias',
    prioridades: 'Por onde começar', capital: 'Necessidade de capital e financiamento',
    projecoes: 'Projeções e viabilidade', aberto: 'Em aberto',
    porResponder: 'Por responder na ficha', notaInterna: 'Nota interna',
    ajuda: 'Ajuda', trava: 'Trava', interno: 'Interno', externo: 'Externo',
    forcas: 'Forças', fraquezas: 'Fraquezas', oportunidades: 'Oportunidades', ameacas: 'Ameaças',
    leitura: 'Leitura', impacto: 'Impacto →', esforco: 'Esforço →', baixo: 'Baixo', alto: 'Alto',
    quadrantes: ['FAZER PRIMEIRO', 'PLANEAR', 'OPORTUNISTA', 'DEIXAR PARA DEPOIS'],
    sequencia: 'Sequência até à abertura', invConst: 'Investimentos e constituição',
    fontes: 'Fontes de financiamento', necTotal: 'Necessidade total', finTotal: 'Financiamento total',
    amortizacao: 'Amortização anual prevista', reserva: 'Reserva de três meses',
    ano: 'Ano', receitas: 'Receitas', custos: 'Custos', lucro: 'Lucro', exigido: 'Exigido', folga: 'Folga',
    retiradaMes: 'Retirada privada necessária', liquidezT: 'Liquidez do ano 1',
    saldoFinal: 'Saldo final', semprePositivo: 'positivo todo o ano', negativoNoMes: 'negativo a partir do mês',
    pesosNota: 'A ficha não atribui números a estes fatores. As barras abaixo são a leitura de prioridade da consultora, em três níveis, e servem para decidir por onde começar — não são medições.',
    prioNota: 'As estratégias da matriz colocadas por impacto no negócio e por esforço exigido. Posições atribuídas pela consultora.',
    swotNota: 'Os quatro quadrantes reúnem o que foi registado na ficha. A metade de cima é interna ao negócio, a de baixo é o que vem de fora; a coluna da esquerda ajuda, a da direita trava.',
    towsNota: 'Cada estratégia nasce do cruzamento de um fator interno com um fator externo. A referência entre parênteses indica que fatores foram cruzados.',
    niveis: { alto: 'Alto', medio: 'Médio', baixo: 'Baixo' },
    tiposTows: { so: 'Ataque', wo: 'Melhoria', st: 'Defesa', wt: 'Proteção' },
  },
}
T.de = { ...T.pt, relatorio: 'Beratungsbericht', cliente: 'Kunde', setor: 'Branche',
  emitido: 'Bericht erstellt am', sumario: 'Zusammenfassung', sim: 'JA', nao: 'NEIN',
  aberto: 'Offen', porResponder: 'Im Fragebogen offen', notaInterna: 'Interne Notiz' }
T.en = { ...T.pt, relatorio: 'Consultancy report', cliente: 'Client', setor: 'Sector',
  emitido: 'Report issued on', sumario: 'Executive summary', sim: 'YES', nao: 'NO',
  aberto: 'Open items', porResponder: 'Unanswered in the form', notaInterna: 'Internal note' }

// ── Formatação ──────────────────────────────────────────────────────────────
const locale = (lang) => lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-GB' : 'pt-PT'
const eur = (v, lang) => `${Math.round(Number(v) || 0).toLocaleString(locale(lang))} €`
const dataCurta = (d, lang) => new Date(d).toLocaleDateString(locale(lang))

// ── Blocos reutilizáveis do modelo ──────────────────────────────────────────
const cabecalhoPagina = (titulo, num) => `
  <div style="display:flex;align-items:baseline;justify-content:space-between;border-bottom:2px solid ${C.verde};padding-bottom:12px;margin-bottom:22px">
    <h2 style="margin:0;font-family:${SERIF};font-size:38px;font-weight:600;color:${C.verde};line-height:1">${esc(titulo)}</h2>
    <span style="font-size:11.5px;letter-spacing:2px;text-transform:uppercase;color:${C.ouro}">${String(num).padStart(2, '0')}</span>
  </div>`

const rodape = (L, c, n) => `
  <div style="margin-top:auto;padding-top:22px;border-top:1px solid ${C.linha2};display:flex;justify-content:space-between;font-size:11.5px;color:${C.mudo}">
    <span>${esc(L.rodape)}</span><span>${esc(c.nome)}${c.empresa ? ` · ${esc(c.empresa)}` : ''}</span><span>${n}</span>
  </div>`

const pagina = (conteudo, extra = '') => `
<section class="page" style="display:flex;flex-direction:column;background:#fff;padding:56px 62px 40px;color:${C.tinta};${extra}">${conteudo}</section>`

const rotulo = (txt, cor = C.verde) =>
  `<h3 style="margin:0 0 12px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${cor}">${esc(txt)}</h3>`

const caixaAlerta = (titulo, itens) => `
  <div style="background:${C.alertaFundo};border-left:3px solid ${C.alerta};padding:16px 18px">
    ${rotulo(titulo, C.alerta)}
    <ul style="margin:0;padding-left:17px;font-size:14.5px;line-height:1.6;color:#3a2b23">
      ${itens.map(i => `<li style="margin-bottom:6px">${esc(i)}</li>`).join('')}
    </ul>
  </div>`

const paragrafos = (texto, tam = 15) => String(texto || '').split(/\n{2,}/).filter(p => p.trim())
  .map(p => `<p style="margin:0 0 16px;font-size:${tam}px;line-height:1.62;color:${C.texto}">${esc(p.trim()).replace(/\n/g, '<br/>')}</p>`).join('')

// ── O documento ─────────────────────────────────────────────────────────────
export function construirHTML({ c, lang = 'pt' }) {
  const L = T[lang] || T.pt
  const rel = c.relatorio || {}
  const editado = rel.editado || {}
  const gerado = Object.fromEntries((rel.seccoes || []).map(s => [s.key, s.texto]))
  const txt = (k) => (editado[k] !== undefined ? editado[k] : (gerado[k] || ''))

  // ── Números (deterministas) ──
  const num = c.numeros || {}
  const ret = retiradasPrivadas(num.privadas)
  const proj = projecao(num.projecao)
  const cap = necessidadeCapital(num.capital, proj.custosAno1)
  const fin = financiamento(num.financiamento, cap.total)
  const ver = verificacaoLucro(num.projecao, ret.necessarioAno, fin.amortizacaoAno)
  const liq = liquidez(num.liquidez)
  const temNumeros = cap.total > 0 || fin.total > 0 || proj.porAno.some(a => a.receitas || a.custos)
  const v2Todos = ver.every(a => a.cobre)

  // ── SWOT com referências S1/W2/O3/T1 ──
  const siglas = { forcas: 'S', fraquezas: 'W', oportunidades: 'O', ameacas: 'T' }
  const swotRef = {}       // 'forcas:0' → { ref:'S1', texto }
  const swotPorQuadrante = {}
  for (const q of SWOT_QUADRANTES) {
    const itens = (c.swot?.[q.key] || []).map((texto, i) => {
      const ref = `${siglas[q.key]}${i + 1}`
      swotRef[`${q.key}:${i}`] = { ref, texto }
      return { ref, texto }
    })
    swotPorQuadrante[q.key] = itens
  }
  const temSwot = Object.values(swotPorQuadrante).some(a => a.length)

  const estrategias = TOWS_CELULAS.flatMap(cel =>
    (c.tows?.[cel.key] || []).map(e => ({
      cel, texto: e.texto,
      origens: (e.origem || []).map(r => swotRef[r]).filter(Boolean),
    })))
  const temTows = estrategias.length > 0

  // ── Contribuições da IA ──
  const pesos = Object.fromEntries((rel.pesos || []).map(p => [p.ref, p.peso]))
  const prioridades = rel.prioridades || []
  const sequencia = rel.sequencia || []
  const confirmado = rel.confirmado || []
  const emAberto = rel.emAberto || []
  const lacunas = rel.lacunas || []
  const banda = Math.min(5, Math.max(1, Number(rel.posicao?.banda) || 3))

  // ── Por responder (determinista: sai da ficha, não da IA) ──
  const porResponder = BLOCOS.flatMap(b => (b.seccoes || []).flatMap(s => (s.perguntas || [])))
    .filter(q => !(c.respostas?.[q.key] || '').trim())
    .map(q => q[lang] || q.pt)

  // Enquadramento na capa — o país à frente, porque decide as regras fiscais
  const enq = c.enquadramento || {}
  const NA_CAPA = ['pais', 'iniciou', 'regime', 'faturacao']
  const linhasEnq = NA_CAPA
    .map(k => [CAMPOS_ENQ.find(x => x.key === k), enq[k]])
    .filter(([cp, v]) => cp && String(v ?? '').trim())
    .map(([cp, v]) => [cp[lang] || cp.pt, opcaoDe(cp.key, v, lang) || v])

  const paginas = []
  let n = 1
  const addPagina = (html) => paginas.push(html)

  // ═══ 1 · CAPA ═══
  const setorLinha = [c.setor, txt('ideia') ? '' : ''].filter(Boolean).join(' · ')
  addPagina(`
<section class="page" style="display:flex;flex-direction:column;background:${C.verde};color:${C.creme};padding:0">
  <div style="flex:none;padding:64px 64px 0;display:flex;justify-content:space-between;align-items:flex-start">
    <div style="font-family:${SERIF};font-size:26px;font-style:italic;color:${C.ouro}">Lúcia Cílio</div>
    <div style="text-align:right;font-size:12px;letter-spacing:2.4px;text-transform:uppercase;color:${C.verdeMudo};line-height:2">${esc(L.relatorio)}<br/><span style="color:${C.ouro}">${dataCurta(rel.gerado_em || Date.now(), lang)}</span></div>
  </div>
  <div style="flex:1;padding:0 64px;display:flex;flex-direction:column;justify-content:center;gap:26px">
    <h1 style="margin:0;font-family:${SERIF};font-weight:600;font-size:${(c.empresa || c.nome).length > 22 ? 54 : 74}px;line-height:.98;color:#fff;letter-spacing:-.5px">${esc(c.empresa || c.nome)}</h1>
    <div style="width:78px;height:3px;background:${C.ouro}"></div>
    <div style="display:flex;flex-direction:column;gap:8px;font-size:16px;color:#cfdcd3">
      <div><span style="color:${C.verdeMudo}">${esc(L.cliente)}</span> &nbsp;${esc(c.nome)}</div>
      ${setorLinha ? `<div><span style="color:${C.verdeMudo}">${esc(L.setor)}</span> &nbsp;${esc(setorLinha)}</div>` : ''}
      ${linhasEnq.map(([rot, val]) => `<div><span style="color:${C.verdeMudo}">${esc(rot)}</span> &nbsp;${esc(val)}</div>`).join('')}
    </div>
  </div>
  ${temNumeros ? `
  <div style="flex:none;margin:0 64px;display:grid;grid-template-columns:1fr 1fr;gap:1px;background:rgba(201,168,76,.28);border:1px solid rgba(201,168,76,.28)">
    <div style="background:${C.verde};padding:20px 22px">
      <div style="font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:${C.verdeMudo};margin-bottom:9px">${esc(L.v1)}</div>
      <div style="display:flex;align-items:baseline;gap:10px">
        <span style="font-family:${SERIF};font-size:34px;font-weight:600;color:${fin.cobre ? C.positivo : C.negativo};line-height:1">${fin.cobre ? L.sim : L.nao}</span>
        <span style="font-size:14px;color:#cfdcd3">${fin.cobre ? '' : `${esc(L.faltam)} ${eur(Math.abs(fin.diferenca), lang)}`}</span>
      </div>
    </div>
    <div style="background:${C.verde};padding:20px 22px">
      <div style="font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:${C.verdeMudo};margin-bottom:9px">${esc(L.v2)}</div>
      <div style="display:flex;align-items:baseline;gap:10px">
        <span style="font-family:${SERIF};font-size:34px;font-weight:600;color:${v2Todos ? C.positivo : C.negativo};line-height:1">${v2Todos ? L.sim : L.nao}</span>
        <span style="font-size:14px;color:#cfdcd3">${v2Todos ? esc(L.nosTres) : esc(L.naoTodos)}</span>
      </div>
    </div>
  </div>` : ''}
  <div style="flex:none;padding:26px 64px 34px;font-size:12.5px;color:#6f8a7a;display:flex;justify-content:space-between">
    <span>${esc(L.rodape)}</span><span>${esc(L.emitido)} ${dataCurta(rel.gerado_em || Date.now(), lang)}</span>
  </div>
</section>`)

  // ═══ 2 · SUMÁRIO EXECUTIVO ═══
  if (txt('sumario') || temNumeros) {
    const kpi = (rot, val, alerta = false) => `
      <div style="background:${alerta ? C.alertaFundo : C.fundoSuave};padding:16px 18px">
        <div style="font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:${alerta ? C.alerta : C.mudo2};margin-bottom:8px">${esc(rot)}</div>
        <div style="font-family:${SERIF};font-size:29px;font-weight:600;color:${alerta ? C.alerta : C.verde};line-height:1">${esc(val)}</div>
      </div>`
    const larguraBanda = 134, x = (banda - 1) * 135 + larguraBanda / 2
    addPagina(pagina(`
  ${cabecalhoPagina(L.sumario, 1)}
  ${paragrafos(txt('sumario'), 15.5)}
  ${temNumeros ? `
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:${C.linha};border:1px solid ${C.linha};margin-bottom:22px">
    ${kpi(L.necessidade, eur(cap.total, lang))}
    ${kpi(L.financiamento, eur(fin.total, lang))}
    ${kpi(fin.cobre ? L.excedente : L.defice, eur(Math.abs(fin.diferenca), lang), !fin.cobre)}
    ${kpi(L.lucroAno1, eur(ver[0]?.lucro || 0, lang), (ver[0]?.lucro || 0) < 0)}
  </div>` : ''}
  ${rel.posicao ? `
  ${rotulo(L.posicao)}
  <svg viewBox="0 0 674 96" style="width:100%;height:auto;display:block;margin-bottom:6px" font-family="${SANS}">
    <g>${[C.vermelho, C.laranja, C.ouro, '#6d9e6a', C.verdeClaro].map((cor, i) =>
      `<rect x="${i * 135}" y="34" width="${larguraBanda}" height="18" fill="${cor}"/>`).join('')}</g>
    <g font-size="10.5" fill="${C.mudo2}" text-anchor="middle">${L.bandas.map((b, i) =>
      `<text x="${i * 135 + larguraBanda / 2}" y="68">${esc(b)}</text>`).join('')}</g>
    <g>
      <path d="M${x},26 l9,-13 h-18 Z" fill="${C.verde}"/>
      <text x="${x}" y="9" font-size="11.5" font-weight="600" fill="${C.verde}" text-anchor="middle">${esc(L.atual)}</text>
      <rect x="${x - 1.5}" y="34" width="3" height="18" fill="${C.verde}"/>
    </g>
    ${rel.posicao.nota ? `<text x="0" y="90" font-size="11" fill="${C.mudo}">${esc(rel.posicao.nota)}</text>` : ''}
  </svg>` : ''}
  ${(confirmado.length || emAberto.length) ? `
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:22px">
    <div>
      ${confirmado.length ? `${rotulo(L.confirmado)}<ul style="margin:0;padding-left:17px;font-size:14.5px;line-height:1.6;color:${C.texto}">${confirmado.map(i => `<li style="margin-bottom:7px">${esc(i)}</li>`).join('')}</ul>` : ''}
    </div>
    ${emAberto.length ? caixaAlerta(L.emAberto, emAberto) : '<div></div>'}
  </div>` : ''}
  ${rodape(L, c, ++n)}`))
  }

  // ═══ 3 · IDEIA E PESSOA ═══
  if (txt('ideia')) {
    addPagina(pagina(`
  ${cabecalhoPagina(L.ideia, 2)}
  ${paragrafos(txt('ideia'))}
  ${porResponder.length ? `
  <h3 style="margin:26px 0 12px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${C.verde}">${esc(L.porResponder)}</h3>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:${C.linha2};border:1px solid ${C.linha2}">
    ${porResponder.slice(0, 9).map(q => `<div style="background:#fff;padding:13px 15px;font-size:13.5px;line-height:1.5;color:#3a4a40">${esc(q)}</div>`).join('')}
  </div>` : ''}
  ${c.notas ? `<div style="margin-top:18px;background:${C.fundoSuave};border-left:3px solid ${C.ouro};padding:12px 14px;font-size:13.5px;line-height:1.55;color:${C.texto}"><b>${esc(L.notaInterna)}.</b> ${esc(c.notas)}</div>` : ''}
  ${rodape(L, c, ++n)}`))
  }

  // ═══ 4 · MERCADO ═══
  if (txt('mercado')) {
    addPagina(pagina(`
  ${cabecalhoPagina(L.mercado, 3)}
  ${paragrafos(txt('mercado'))}
  ${rodape(L, c, ++n)}`))
  }

  // ═══ 5 · SWOT ═══
  if (temSwot) {
    const quad = (key, sigla, cor, fundo, primeiraLinha) => {
      const itens = swotPorQuadrante[key]
      return `
      <div style="border:1px solid ${C.linha};${primeiraLinha ? '' : 'border-top:none;'}${sigla === 'S' || sigla === 'O' ? 'border-right:none;' : ''}background:${fundo};padding:20px 22px">
        <div style="display:flex;align-items:baseline;gap:10px;margin-bottom:14px">
          <span style="font-family:${SERIF};font-size:34px;font-weight:700;color:${cor};line-height:1">${sigla}</span>
          <span style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${cor};font-weight:600">${esc(L[key])}</span>
          <span style="margin-left:auto;font-size:12px;color:${C.mudo}">${itens.length}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:11px;font-size:14.5px;line-height:1.5;color:${C.texto}">
          ${itens.map(i => `<div style="display:flex;gap:9px"><span style="color:${cor};font-weight:600">${i.ref}</span><span>${esc(i.texto)}</span></div>`).join('') || `<div style="color:${C.mudo};font-size:13px">—</div>`}
        </div>
      </div>`
    }
    addPagina(pagina(`
  ${cabecalhoPagina(L.swot, 4)}
  <p style="margin:0 0 20px;font-size:14.5px;line-height:1.6;color:${C.suave};max-width:520px">${esc(L.swotNota)}</p>
  <div style="display:grid;grid-template-columns:34px 1fr 1fr;grid-template-rows:32px 1fr 1fr">
    <div></div>
    <div style="display:flex;align-items:center;justify-content:center;font-size:11.5px;letter-spacing:2px;text-transform:uppercase;color:${C.verdeClaro}">${esc(L.ajuda)}</div>
    <div style="display:flex;align-items:center;justify-content:center;font-size:11.5px;letter-spacing:2px;text-transform:uppercase;color:${C.alerta}">${esc(L.trava)}</div>
    <div style="display:flex;align-items:center;justify-content:center;font-size:11.5px;letter-spacing:2px;text-transform:uppercase;color:${C.mudo2};writing-mode:vertical-rl;transform:rotate(180deg)">${esc(L.interno)}</div>
    ${quad('forcas', 'S', C.verdeClaro, C.fundoVerde, true)}
    ${quad('fraquezas', 'W', C.alerta, C.alertaFundo2, true)}
    <div style="display:flex;align-items:center;justify-content:center;font-size:11.5px;letter-spacing:2px;text-transform:uppercase;color:${C.mudo2};writing-mode:vertical-rl;transform:rotate(180deg)">${esc(L.externo)}</div>
    ${quad('oportunidades', 'O', C.verdeClaro, C.fundoVerde, false)}
    ${quad('ameacas', 'T', C.alerta, C.alertaFundo2, false)}
  </div>
  ${rodape(L, c, ++n)}`))
  }

  // ═══ 6 · PESO DOS FATORES ═══
  if (temSwot && Object.keys(pesos).length) {
    const larg = { alto: '100%', medio: '62%', baixo: '30%' }
    const grupo = (key, titulo, cor, fundoBarra, coresPeso) => {
      const itens = swotPorQuadrante[key].filter(i => pesos[i.ref])
      if (!itens.length) return ''
      return `
      <div>
        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${cor};font-weight:600;margin-bottom:14px">${esc(titulo)}</div>
        <div style="display:flex;flex-direction:column;gap:13px">
          ${itens.map(i => {
        const p = pesos[i.ref] || 'medio'
        return `<div>
              <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:5px;gap:12px">
                <span>${i.ref} ${esc(i.texto)}</span><span style="color:${C.mudo};flex:none">${esc(L.niveis[p] || p)}</span>
              </div>
              <div style="height:9px;background:${fundoBarra}"><div style="width:${larg[p] || '62%'};height:100%;background:${coresPeso[p] || coresPeso.medio}"></div></div>
            </div>`
      }).join('')}
        </div>
      </div>`
    }
    const cVerde = { alto: C.verde, medio: C.verdeMed, baixo: C.ouro }
    const cAlerta = { alto: C.alerta, medio: C.laranja, baixo: C.ouro }
    addPagina(pagina(`
  ${cabecalhoPagina(L.pesos, 5)}
  <p style="margin:0 0 22px;font-size:13.5px;line-height:1.55;color:${C.mudo};max-width:560px">${esc(L.pesosNota)}</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:28px 34px">
    ${grupo('forcas', L.forcas, C.verdeClaro, C.linhaLeve, cVerde)}
    ${grupo('fraquezas', L.fraquezas, C.alerta, C.alertaLinha, cAlerta)}
    ${grupo('oportunidades', L.oportunidades, C.verdeClaro, C.linhaLeve, cVerde)}
    ${grupo('ameacas', L.ameacas, C.alerta, C.alertaLinha, cAlerta)}
  </div>
  ${rel.leitura ? `
  <div style="margin-top:30px;background:${C.verde};color:${C.creme};padding:22px 24px">
    <div style="font-size:11.5px;letter-spacing:2px;text-transform:uppercase;color:${C.ouro};margin-bottom:10px">${esc(L.leitura)}</div>
    <p style="margin:0;font-size:15px;line-height:1.6">${esc(rel.leitura)}</p>
  </div>` : ''}
  ${rodape(L, c, ++n)}`))
  }

  // ═══ 7 · TOWS ═══
  if (temTows) {
    const celula = (key, titulo, corBarra) => {
      const es = estrategias.filter(e => e.cel.key === key)
      return `
      <div style="background:#fff;padding:18px 20px">
        <div style="display:flex;align-items:baseline;gap:9px;margin-bottom:12px">
          <span style="font-family:${SERIF};font-size:22px;font-weight:600;color:${C.verde}">${esc(L.tiposTows[key] || key.toUpperCase())}</span>
          <span style="font-size:11px;color:${C.mudo}">${key.toUpperCase().split('').join(' × ')}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${es.map(e => `
            <div style="border-left:3px solid ${corBarra};padding-left:12px">
              <div style="font-size:14.5px;line-height:1.5;color:${C.texto}">${esc(e.texto)}</div>
              ${e.origens.length ? `<div style="margin-top:5px;font-size:11.5px;color:${C.mudo}">${e.origens.map(o => o.ref).join(' × ')} · ${e.origens.map(o => esc(o.texto)).join(' × ')}</div>` : ''}
            </div>`).join('') || `<div style="font-size:13px;color:${C.mudo}">—</div>`}
        </div>
      </div>`
    }
    addPagina(pagina(`
  ${cabecalhoPagina(L.tows, 6)}
  <p style="margin:0 0 18px;font-size:14.5px;line-height:1.6;color:${C.suave};max-width:560px">${esc(L.towsNota)}</p>
  <div style="display:grid;grid-template-columns:96px 1fr 1fr;gap:1px;background:${C.linha};border:1px solid ${C.linha}">
    <div style="background:#fff"></div>
    <div style="background:${C.fundoVerde};padding:12px 16px;font-size:11.5px;letter-spacing:2px;text-transform:uppercase;color:${C.verdeClaro};font-weight:600">${esc(L.oportunidades)}</div>
    <div style="background:${C.alertaFundo2};padding:12px 16px;font-size:11.5px;letter-spacing:2px;text-transform:uppercase;color:${C.alerta};font-weight:600">${esc(L.ameacas)}</div>
    <div style="background:${C.fundoVerde};padding:16px 12px;font-size:11.5px;letter-spacing:2px;text-transform:uppercase;color:${C.verdeClaro};font-weight:600;display:flex;align-items:center">${esc(L.forcas)}</div>
    ${celula('so', L.oportunidades, C.verde)}
    ${celula('st', L.ameacas, C.ouro)}
    <div style="background:${C.alertaFundo2};padding:16px 12px;font-size:11.5px;letter-spacing:2px;text-transform:uppercase;color:${C.alerta};font-weight:600;display:flex;align-items:center">${esc(L.fraquezas)}</div>
    ${celula('wo', L.oportunidades, C.verdeMed)}
    ${celula('wt', L.ameacas, C.alerta)}
  </div>
  ${rodape(L, c, ++n)}`))
  }

  // ═══ 8 · PRIORIDADES ═══
  if (prioridades.length) {
    const cores = { so: C.verde, wo: C.verdeMed, st: C.ouro, wt: C.alerta }
    const px = (v) => 70 + ((Number(v) - 1) / 4) * 580     // esforço 1..5 → 70..650
    const py = (v) => 310 - ((Number(v) - 1) / 4) * 300    // impacto 1..5 → 310..10
    addPagina(pagina(`
  ${cabecalhoPagina(L.prioridades, 7)}
  <p style="margin:0 0 14px;font-size:13.5px;line-height:1.55;color:${C.mudo};max-width:560px">${esc(L.prioNota)}</p>
  <svg viewBox="0 0 674 340" style="width:100%;height:auto;display:block" font-family="${SANS}">
    <rect x="70" y="10" width="290" height="150" fill="#eef4ef"/><rect x="360" y="10" width="290" height="150" fill="${C.fundoSuave}"/>
    <rect x="70" y="160" width="290" height="150" fill="#fafbfa"/><rect x="360" y="160" width="290" height="150" fill="#faf8f4"/>
    <g stroke="${C.linha}"><line x1="70" y1="10" x2="650" y2="10"/><line x1="70" y1="310" x2="650" y2="310"/><line x1="70" y1="10" x2="70" y2="310"/><line x1="650" y1="10" x2="650" y2="310"/><line x1="70" y1="160" x2="650" y2="160"/><line x1="360" y1="10" x2="360" y2="310"/></g>
    <g font-size="10.5" fill="#a4b0a8" letter-spacing="1.6">
      <text x="82" y="28">${esc(L.quadrantes[0])}</text><text x="372" y="28">${esc(L.quadrantes[1])}</text>
      <text x="82" y="302">${esc(L.quadrantes[2])}</text><text x="372" y="302">${esc(L.quadrantes[3])}</text>
    </g>
    <text x="30" y="160" font-size="11.5" fill="#3a4a40" text-anchor="middle" transform="rotate(-90 30 160)">${esc(L.impacto)}</text>
    <text x="360" y="334" font-size="11.5" fill="#3a4a40" text-anchor="middle">${esc(L.esforco)}</text>
    <g font-size="10.5" fill="${C.mudo}"><text x="70" y="326" text-anchor="middle">${esc(L.baixo)}</text><text x="650" y="326" text-anchor="middle">${esc(L.alto)}</text><text x="58" y="313" text-anchor="end">${esc(L.baixo)}</text><text x="58" y="16" text-anchor="end">${esc(L.alto)}</text></g>
    <g>${prioridades.map((p, i) => {
      const cor = cores[p.tipo] || C.verde
      return `<circle cx="${px(p.esforco)}" cy="${py(p.impacto)}" r="15" fill="${cor}"/><text x="${px(p.esforco)}" y="${py(p.impacto) + 5}" font-size="12" font-weight="600" fill="${cor === C.ouro ? C.verde : C.creme}" text-anchor="middle">${i + 1}</text>`
    }).join('')}</g>
  </svg>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 26px;margin-top:16px;font-size:13.5px;color:${C.texto}">
    ${prioridades.map((p, i) => `<div style="display:flex;gap:9px"><b style="color:${cores[p.tipo] || C.verde}">${i + 1}</b><span>${esc(p.titulo)}${p.tipo ? ` <span style="color:${C.mudo}">· ${esc(L.tiposTows[p.tipo] || '')}</span>` : ''}</span></div>`).join('')}
  </div>
  ${sequencia.length ? `
  <h3 style="margin:28px 0 14px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${C.verde}">${esc(L.sequencia)}</h3>
  <div style="display:grid;grid-template-columns:repeat(${Math.min(4, sequencia.length)},1fr);gap:1px;background:${C.linha};border:1px solid ${C.linha}">
    ${sequencia.slice(0, 4).map((s, i) => {
      const ultimo = i === Math.min(4, sequencia.length) - 1
      return `<div style="background:${ultimo ? C.verde : '#fff'};padding:16px;${ultimo ? `color:${C.creme}` : ''}">
        <div style="font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:${C.ouro};font-weight:600;margin-bottom:9px">${esc(s.periodo)}</div>
        <ul style="margin:0;padding-left:15px;font-size:13.5px;line-height:1.5;${ultimo ? '' : `color:${C.texto}`}">${(s.itens || []).map(x => `<li style="margin-bottom:5px">${esc(x)}</li>`).join('')}</ul>
      </div>`
    }).join('')}
  </div>` : ''}
  ${rodape(L, c, ++n)}`))
  }

  // ═══ 9 · CAPITAL ═══
  if (temNumeros && cap.total > 0) {
    const linhasTabela = (arr, extra = []) => [
      ...(arr || []).filter(l => Number(l?.valor)).map(l => [l.desc || '—', Number(l.valor)]),
      ...extra,
    ]
    const tabela = (titulo, linhas, total, rotTotal, extraLinha) => `
      <div>
        ${rotulo(titulo)}
        <div style="font-size:14px;color:${C.texto}">
          ${linhas.map(([d, v]) => `<div style="display:flex;justify-content:space-between;gap:14px;padding:8px 0;border-bottom:1px solid ${C.linhaLeve}"><span>${esc(d)}</span><b style="flex:none">${eur(v, lang)}</b></div>`).join('')}
          <div style="display:flex;justify-content:space-between;padding:10px 0;color:${C.verde}"><b>${esc(rotTotal)}</b><b>${eur(total, lang)}</b></div>
          ${extraLinha || ''}
        </div>
      </div>`
    // Barra proporcional da necessidade
    const partes = [
      [L.invConst, cap.investimentos, C.verde],
      ['', cap.constituicao, C.verdeMed],
      [L.reserva, cap.reserva, C.ouro],
    ].filter(([, v]) => v > 0)
    const totalBarra = partes.reduce((a, [, v]) => a + v, 0) || 1
    let cursor = 0
    const barra = partes.map(([, v, cor]) => {
      const w = (v / totalBarra) * 674, x = cursor; cursor += w + 1
      return `<rect x="${x.toFixed(1)}" y="24" width="${Math.max(2, w - 1).toFixed(1)}" height="34" fill="${cor}"/>`
    }).join('')

    addPagina(pagina(`
  ${cabecalhoPagina(L.capital, 8)}
  <svg viewBox="0 0 674 96" style="width:100%;height:auto;display:block;margin-bottom:18px" font-family="${SANS}">
    <text x="0" y="12" font-size="11.5" letter-spacing="1.6" fill="${C.mudo2}">${esc(L.necessidade.toUpperCase())} ${eur(cap.total, lang)}</text>
    <g>${barra}</g>
    <line x1="0" y1="76" x2="674" y2="76" stroke="${C.linha2}"/>
    <text x="0" y="92" font-size="12.5" fill="#3a4a40">${esc(L.v1)}</text>
    <text x="674" y="92" font-size="15" font-weight="700" fill="${fin.cobre ? C.verdeClaro : C.alerta}" text-anchor="end">${fin.cobre ? L.sim : L.nao}</text>
  </svg>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:26px">
    ${tabela(L.invConst,
      linhasTabela(num.capital?.investimentos, linhasTabela(num.capital?.constituicao, [[L.reserva, cap.reserva]])),
      cap.total, L.necTotal)}
    ${tabela(L.fontes,
      linhasTabela(num.financiamento?.proprio, linhasTabela(num.financiamento?.alheio)),
      fin.total, L.finTotal,
      `<div style="display:flex;justify-content:space-between;padding:10px 0;color:${C.mudo}"><span>${esc(L.amortizacao)}</span><b>${eur(fin.amortizacaoAno, lang)}</b></div>
       ${!fin.cobre ? `<div style="margin-top:12px;background:${C.alertaFundo};border-left:3px solid ${C.alerta};padding:14px 16px;font-size:14px;line-height:1.55;color:#3a2b23">${esc(L.defice)}: <b>${eur(Math.abs(fin.diferenca), lang)}</b></div>` : ''}`)}
  </div>
  ${txt('capital') ? `<div style="margin-top:20px">${paragrafos(txt('capital'), 14.5)}</div>` : ''}
  ${rodape(L, c, ++n)}`))
  }

  // ═══ 10 · PROJEÇÕES ═══
  if (temNumeros && proj.porAno.some(a => a.receitas || a.custos)) {
    const maxV = Math.max(...proj.porAno.map(a => Math.max(a.receitas, a.custos)), 1)
    addPagina(pagina(`
  ${cabecalhoPagina(L.projecoes, 9)}
  <svg viewBox="0 0 674 210" style="width:100%;height:auto;display:block;margin-bottom:20px" font-family="${SANS}">
    ${proj.porAno.map((a, i) => {
      const x = i * 230, hR = (a.receitas / maxV) * 130, hC = (a.custos / maxV) * 130
      return `
        <text x="${x}" y="12" font-size="11.5" letter-spacing="1.6" fill="${C.mudo2}">${esc(L.ano)} ${a.ano}</text>
        <rect x="${x}" y="${152 - hR}" width="84" height="${hR}" fill="${C.verde}"/>
        <rect x="${x + 92}" y="${152 - hC}" width="84" height="${hC}" fill="${C.alerta}" opacity=".75"/>
        <text x="${x + 42}" y="${146 - hR}" font-size="11" fill="${C.verde}" text-anchor="middle">${eur(a.receitas, lang)}</text>
        <text x="${x + 134}" y="${146 - hC}" font-size="11" fill="${C.alerta}" text-anchor="middle">${eur(a.custos, lang)}</text>
        <text x="${x}" y="172" font-size="11.5" fill="${C.mudo}">${esc(L.lucro)}</text>
        <text x="${x}" y="192" font-size="17" font-weight="700" fill="${a.lucro >= 0 ? C.verde : C.alerta}" font-family="${SERIF}">${eur(a.lucro, lang)}</text>`
    }).join('')}
  </svg>
  <div style="display:grid;grid-template-columns:repeat(${ver.length},1fr);gap:1px;background:${C.linha};border:1px solid ${C.linha};margin-bottom:20px">
    ${ver.map(a => `
      <div style="background:${a.cobre ? C.fundoVerde : C.alertaFundo};padding:15px 17px">
        <div style="font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:${a.cobre ? C.verdeClaro : C.alerta};margin-bottom:7px">${esc(L.ano)} ${a.ano} · ${esc(L.exigido)} ${eur(a.exigido, lang)}</div>
        <div style="display:flex;align-items:baseline;gap:9px">
          <span style="font-family:${SERIF};font-size:26px;font-weight:600;color:${a.cobre ? C.verdeClaro : C.alerta};line-height:1">${a.cobre ? L.sim : L.nao}</span>
          <span style="font-size:13px;color:${C.texto}">${esc(L.folga)} ${eur(a.folga, lang)}</span>
        </div>
      </div>`).join('')}
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:${C.linha};border:1px solid ${C.linha};margin-bottom:18px">
    <div style="background:${C.fundoSuave};padding:15px 17px">
      <div style="font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:${C.mudo2};margin-bottom:7px">${esc(L.retiradaMes)}</div>
      <div style="font-family:${SERIF};font-size:26px;font-weight:600;color:${C.verde};line-height:1">${eur(ret.necessarioMes, lang)}</div>
    </div>
    <div style="background:${liq.ok ? C.fundoSuave : C.alertaFundo};padding:15px 17px">
      <div style="font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:${liq.ok ? C.mudo2 : C.alerta};margin-bottom:7px">${esc(L.liquidezT)}</div>
      <div style="font-family:${SERIF};font-size:26px;font-weight:600;color:${liq.ok ? C.verde : C.alerta};line-height:1">${eur(liq.saldoFinal, lang)}</div>
      <div style="font-size:12px;color:${C.mudo};margin-top:4px">${liq.ok ? esc(L.semprePositivo) : `${esc(L.negativoNoMes)} ${liq.negativos[0].mes}`}</div>
    </div>
  </div>
  ${txt('projecoes') ? paragrafos(txt('projecoes'), 14.5) : ''}
  ${rodape(L, c, ++n)}`))
  }

  // ═══ 11 · EM ABERTO ═══
  if (lacunas.length) {
    addPagina(`
<section class="page" style="display:flex;flex-direction:column;background:${C.fundoSuave};padding:56px 62px 40px;color:${C.tinta}">
  ${cabecalhoPagina(L.aberto, 10)}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:${C.linha};border:1px solid ${C.linha}">
    ${lacunas.map((l, i) => `
      <div style="background:#fff;padding:16px 18px;display:flex;gap:12px">
        <span style="font-family:${SERIF};font-size:20px;font-weight:600;color:${C.ouro};line-height:1;flex:none">${String(i + 1).padStart(2, '0')}</span>
        <span style="font-size:14px;line-height:1.55;color:${C.texto}">${esc(l)}</span>
      </div>`).join('')}
    ${lacunas.length % 2 ? '<div style="background:#fff"></div>' : ''}
  </div>
  ${txt('estrategia') ? `<div style="margin-top:22px">${paragrafos(txt('estrategia'), 14.5)}</div>` : ''}
  ${rodape(L, c, ++n)}
</section>`)
  }

  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8">
<title>${esc(L.relatorio)} — ${esc(c.nome)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,400;1,500&family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box}
  body{margin:0;font-family:${SANS};background:#e8ece9;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{width:210mm;min-height:297mm;margin:0 auto 10mm;box-shadow:0 2px 14px rgba(0,0,0,.10);overflow:hidden}
  @page{size:A4;margin:0}
  @media print{
    body{background:#fff}
    .page{margin:0;box-shadow:none;break-after:page;page-break-after:always}
    .page:last-child{break-after:auto;page-break-after:auto}
  }
</style></head><body>${paginas.join('\n')}</body></html>`
}
