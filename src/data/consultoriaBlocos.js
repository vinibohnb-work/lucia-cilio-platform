// ============================================================================
// Consultoria de Implementação de Negócio — estrutura em 4 blocos (sessões).
//
// Base: "Der Businessplan (BP)" da Câmara de Comércio alemã (IHK), que a Lúcia
// enviou. O alemão é o original; o português e o inglês são tradução.
//
// ⚠️ ESTA LISTA É UMA REFERÊNCIA, NÃO UM DOGMA.
// Acrescentar, remover ou reescrever perguntas é só editar este ficheiro — as
// respostas ficam guardadas por `key`, portanto mudar o texto de uma pergunta
// não perde a resposta; mudar a `key` é que perde. Ao remover uma pergunta, a
// resposta antiga fica no JSONB sem aparecer (não se perde, só deixa de ser
// mostrada).
//
// Blocos 3 e 4 são os números: as tabelas têm linhas por omissão (também elas
// referência) que a Lúcia pode renomear, apagar ou acrescentar na própria
// interface — os cálculos estão em src/lib/consultoriaCalc.js.
// ============================================================================

export const BLOCOS = [
  {
    n: 1, key: 'ideia',
    pt: 'Ideia e pessoa', de: 'Idee und Person', en: 'Idea and person',
    subPt: 'Sessão 1 · o que é o negócio e quem o vai fazer',
    subDe: 'Sitzung 1 · was das Geschäft ist und wer es macht',
    subEn: 'Session 1 · what the business is and who will run it',
    seccoes: [
      {
        key: 'geschaeftsidee', num: '1.1',
        pt: 'A minha ideia de negócio', de: 'Meine Geschäftsidee', en: 'My business idea',
        perguntas: [
          { key: 'produtos',   pt: 'Quais são os meus produtos ou que serviços ofereço?', de: 'Was sind meine Produkte, bzw. welche Dienstleistungen biete ich an?', en: 'What are my products or services?' },
          { key: 'porque',     pt: 'Porquê estes produtos ou serviços?', de: 'Warum biete ich gerade diese Produkte bzw. Dienstleistungen an?', en: 'Why these products or services?' },
          { key: 'nicho',      pt: 'Onde vejo uma lacuna de mercado ou um nicho?', de: 'Wo sehe ich eine „Marktlücke" oder eine „Nische"?', en: 'Where do I see a market gap or a niche?' },
          { key: 'local',      pt: 'Em que localização quero começar?', de: 'An welchem Standort will ich gründen?', en: 'Where do I want to start?' },
          { key: 'socios',     pt: 'Sozinho ou com sócios?', de: 'Will ich allein oder mit mehreren gründen?', en: 'Alone or with partners?' },
          { key: 'quando',     pt: 'Quando quero iniciar a atividade?', de: 'Wann will ich meine selbstständige Tätigkeit aufnehmen?', en: 'When do I want to start?' },
          { key: 'regime',     pt: 'Em que regime — tempo inteiro ou parcial?', de: 'In welchem Umfang (Vollerwerb, Nebenerwerb) will ich gründen?', en: 'Full-time or part-time?' },
        ],
      },
      {
        key: 'voraussetzungen', num: '1.2',
        pt: 'As minhas competências pessoais e técnicas', de: 'Meine persönlichen und fachlichen Voraussetzungen', en: 'My personal and professional background',
        notaPt: 'O documento original pede para juntar o CV.',
        notaDe: 'Das Originaldokument bittet um den Lebenslauf.',
        notaEn: 'The original document asks for a CV.',
        perguntas: [
          { key: 'porque_independente', pt: 'Porque me quero tornar independente?', de: 'Warum will ich mich selbstständig machen?', en: 'Why do I want to become self-employed?' },
          { key: 'formacao',   pt: 'Que formação e especializações tenho?', de: 'Welche Aus- und Weiterbildungen habe ich?', en: 'What education and training do I have?' },
          { key: 'experiencia',pt: 'Onde ganhei experiência neste ramo?', de: 'Wodurch habe ich Erfahrungen im geplanten Geschäftsfeld sammeln können?', en: 'Where did I gain experience in this field?' },
          { key: 'comercial',  pt: 'Tenho experiência ou conhecimentos comerciais?', de: 'Habe ich kaufmännische Erfahrungen oder Kenntnisse?', en: 'Do I have commercial experience or knowledge?' },
          { key: 'lacunas',    pt: 'Se não tenho, como vou colmatar essa lacuna? (seminários, cursos, coaching)', de: 'Falls mir diese fehlen, wodurch kann ich diese Wissenslücke schließen? (Gründungsseminare, VHS-Kurse, Coaching)', en: 'If not, how will I close that gap? (seminars, courses, coaching)' },
          { key: 'familia',    pt: 'Qual é a minha situação familiar? (casado, parceria, filhos)', de: 'Wie ist meine familiäre Situation? (verheiratet, Partnerschaft, Kinder)', en: 'What is my family situation? (married, partnership, children)' },
          { key: 'quem_vive',  pt: 'Quem vive do rendimento desta atividade?', de: 'Wer muss von den Einkünften aus der geplanten selbstständigen Tätigkeit leben?', en: 'Who depends on the income from this activity?' },
          { key: 'outro_rendimento', pt: 'Existe outro rendimento no agregado?', de: 'Ist noch ein weiteres Einkommen vorhanden?', en: 'Is there other household income?' },
          { key: 'conciliar',  pt: 'Como concilio a família com a independência?', de: 'Wie kann ich die Familie mit der Selbstständigkeit vereinbaren?', en: 'How do I reconcile family with self-employment?' },
          { key: 'criancas',   pt: 'Como está organizado o apoio às crianças?', de: 'Wie ist die Kinderbetreuung geregelt?', en: 'How is childcare arranged?' },
          { key: 'apoio',      pt: 'A minha família apoia-me nesta atividade?', de: 'Unterstützt mich meine Familie bei der Ausübung meiner selbstständigen Tätigkeit?', en: 'Does my family support this activity?' },
        ],
      },
    ],
  },
  {
    n: 2, key: 'mercado',
    pt: 'Mercado e estratégia', de: 'Markt und Strategie', en: 'Market and strategy',
    subPt: 'Sessão 2 · para quem se vende e como se compete',
    subDe: 'Sitzung 2 · an wen verkauft wird und wie man konkurriert',
    subEn: 'Session 2 · who to sell to and how to compete',
    seccoes: [
      {
        key: 'mercado', num: '1.3',
        pt: 'Clientes, concorrência, marketing e vendas', de: 'Kundenzielgruppe, Wettbewerb, Marketing und Vertrieb', en: 'Customers, competition, marketing and sales',
        perguntas: [
          { key: 'clientes',    pt: 'Quem são exatamente os meus clientes?', de: 'Wer sind genau meine Kunden?', en: 'Who exactly are my customers?' },
          { key: 'onde_achar',  pt: 'Onde e como os encontro?', de: 'Wo und wie finde ich meine Kundschaft?', en: 'Where and how do I find them?' },
          { key: 'concorrentes',pt: 'Quem são os meus concorrentes e o que oferecem?', de: 'Wer sind meine Mitbewerberinnen und Mitbewerber? Was bieten sie an?', en: 'Who are my competitors and what do they offer?' },
          { key: 'diferenca',   pt: 'O que distingue a minha oferta da deles?', de: 'Wodurch unterscheidet sich mein Angebot von dem meiner Mitbewerber?', en: 'What sets my offer apart from theirs?' },
          { key: 'vantagens',   pt: 'Que vantagens tem a minha oferta?', de: 'Welche Vorteile hat mein Angebot gegenüber dem meiner Mitbewerber?', en: 'What advantages does my offer have?' },
        ],
      },
      {
        key: 'swot', num: '1.4', tipo: 'swot',
        pt: 'Análise SWOT', de: 'SWOT-Analyse', en: 'SWOT analysis',
        notaPt: 'Substitui a secção original "Perspetivas futuras, oportunidades e riscos". As perguntas dessa secção passam a alimentar os quadrantes.',
        notaDe: 'Ersetzt den ursprünglichen Abschnitt „Zukunftsaussichten, Chancen und Risiken".',
        notaEn: 'Replaces the original section "Future prospects, opportunities and risks".',
        // Servem de apoio ao preenchimento dos quadrantes (vêm do documento original)
        apoio: [
          { pt: 'Que objetivos tenho? Onde quero estar e quando?', de: 'Welche Ziele habe ich? Wo will ich wann stehen?', en: 'What are my goals? Where do I want to be, and when?', quadrante: 'oportunidades' },
          { pt: 'Há riscos ou oportunidades que já conheço?', de: 'Gibt es besondere Risiken oder Chancen, die mir jetzt schon bekannt sind?', en: 'Are there risks or opportunities I already know of?', quadrante: 'ameacas' },
          { pt: 'Consigo viver dos excedentes no início?', de: 'Kann/muss ich von den geplanten Überschüssen in der ersten Zeit leben?', en: 'Can I live on the expected surplus at the start?', quadrante: 'fraquezas' },
          { pt: 'E se o primeiro ano correr pior do que o planeado?', de: 'Was passiert, wenn das Unternehmen im ersten Jahr schlechter als geplant läuft?', en: 'What if the first year goes worse than planned?', quadrante: 'ameacas' },
          { pt: 'E se eu adoecer?', de: 'Was passiert, wenn ich krank werde?', en: 'What if I fall ill?', quadrante: 'ameacas' },
        ],
      },
      { key: 'tows', num: '1.4b', tipo: 'tows',
        pt: 'Estratégias TOWS', de: 'TOWS-Strategien', en: 'TOWS strategies',
        notaPt: 'Com aquilo que descobri no SWOT, o que devo fazer?',
        notaDe: 'Was soll ich mit dem tun, was ich in der SWOT entdeckt habe?',
        notaEn: 'With what the SWOT revealed, what should I do?',
      },
    ],
  },
  {
    n: 3, key: 'capital',
    pt: 'Dinheiro pessoal e capital', de: 'Privatentnahmen und Kapital', en: 'Personal income and capital',
    subPt: 'Sessão 3 · retiradas privadas, necessidade de capital e financiamento',
    subDe: 'Sitzung 3 · Privatentnahmen, Kapitalbedarf und Finanzierung',
    subEn: 'Session 3 · private withdrawals, capital needs and financing',
    seccoes: [
      { key: 'privadas', num: '2.1', tipo: 'privadas',
        pt: 'Retiradas privadas necessárias', de: 'Berechnung der notwendigen Privatentnahmen', en: 'Necessary private withdrawals',
        notaPt: 'Quanto o negócio tem de gerar para a pessoa viver — despesas do agregado menos os outros rendimentos.',
        notaDe: 'Was das Geschäft erwirtschaften muss, damit die Person leben kann.',
        notaEn: 'What the business must generate for the person to live on.' },
      { key: 'capital', num: '2.2.1', tipo: 'capital',
        pt: 'Necessidade de capital', de: 'Kapitalbedarf', en: 'Capital needs',
        notaPt: 'Investimentos + custos de constituição + reserva. O documento sugere, para a reserva, os custos correntes dos primeiros 3 meses.',
        notaDe: 'Investitionen + Gründungskosten + Reserve (lfd. Kosten der ersten drei Monate).',
        notaEn: 'Investments + setup costs + reserve (the first three months of running costs).' },
      { key: 'financiamento', num: '2.2.2', tipo: 'financiamento',
        pt: 'Financiamento', de: 'Finanzierung', en: 'Financing',
        notaPt: 'Tem de cobrir a totalidade da necessidade de capital.',
        notaDe: 'Muss den ermittelten Finanzbedarf vollständig decken.',
        notaEn: 'Must fully cover the capital needs.' },
    ],
  },
  {
    n: 4, key: 'projecoes',
    pt: 'Previsões', de: 'Vorschau', en: 'Projections',
    subPt: 'Sessão 4 · faturação, custos, lucro e liquidez',
    subDe: 'Sitzung 4 · Umsatz, Kosten, Gewinn und Liquidität',
    subEn: 'Session 4 · revenue, costs, profit and liquidity',
    seccoes: [
      { key: 'projecao', num: '2.2.3', tipo: 'projecao',
        pt: 'Previsão de faturação, custos e lucro', de: 'Umsatz-, Kosten- und Gewinnvorschau', en: 'Revenue, cost and profit forecast',
        notaPt: 'Faturação sempre líquida (sem IVA) e planeada com prudência. O lucro tem de cobrir as retiradas privadas mais as amortizações.',
        notaDe: 'Immer Netto-Umsatz (ohne MwSt.) und vorsichtig planen. Der Gewinn muss die Privatentnahmen und die Tilgung decken.',
        notaEn: 'Always net revenue (excl. VAT), planned conservatively. Profit must cover private withdrawals plus loan repayments.' },
      { key: 'liquidez', num: '2.3', tipo: 'liquidez',
        pt: 'Previsão de liquidez', de: 'Liquiditätsvorschau', en: 'Liquidity forecast',
        notaPt: 'Mostra se há dinheiro em caixa a cada momento. Considerar sazonalidade, adiantamentos e o comportamento de pagamento dos clientes.',
        notaDe: 'Zeigt, ob Sie jederzeit zahlungsfähig sind — Saisonalität, Abschlagszahlungen und Zahlungsverhalten berücksichtigen.',
        notaEn: 'Shows whether cash is available at all times — consider seasonality, advances and customer payment behaviour.' },
    ],
  },
  // ── Bloco 5 · Consultoria de marketing (pedido da Letícia, 05/11) ──
  // Opcional: não entra no progresso total, não decide o "bloco atual" e não
  // aparece em "Por responder" no relatório do plano de negócio. Usa-se só nas
  // consultorias de marketing. Chaves com prefixo mk_ para não colidir.
  {
    n: 5, key: 'marketing', opcional: true,
    pt: 'Marketing', de: 'Marketing', en: 'Marketing',
    subPt: 'Consultoria de marketing · diagnóstico da presença do negócio e próximos passos',
    subDe: 'Marketing-Beratung · Diagnose der Präsenz des Unternehmens und nächste Schritte',
    subEn: 'Marketing consultancy · diagnosis of the business presence and next steps',
    seccoes: [
      {
        key: 'mk_negocio', num: '5.1',
        pt: 'O negócio hoje', de: 'Das Unternehmen heute', en: 'The business today',
        perguntas: [
          { key: 'mk_oferta',       pt: 'O que vendo hoje e qual é o meu produto ou serviço principal?', de: 'Was verkaufe ich heute und was ist mein Hauptprodukt bzw. meine Hauptdienstleistung?', en: 'What do I sell today and what is my main product or service?' },
          { key: 'mk_cliente',      pt: 'Quem é o meu cliente ideal e que problema lhe resolvo?', de: 'Wer ist mein idealer Kunde und welches Problem löse ich für ihn?', en: 'Who is my ideal customer and what problem do I solve for them?' },
          { key: 'mk_diferencial',  pt: 'Porque é que os clientes me escolhem a mim e não a outro?', de: 'Warum wählen Kunden mich und nicht jemand anderen?', en: 'Why do customers choose me and not someone else?' },
          { key: 'mk_como_chegam',  pt: 'Como chegam hoje os clientes até mim? (indicação, Instagram, Google, eventos…)', de: 'Wie kommen Kunden heute zu mir? (Empfehlung, Instagram, Google, Events…)', en: 'How do customers find me today? (referral, Instagram, Google, events…)' },
        ],
      },
      {
        key: 'mk_presenca', num: '5.2',
        pt: 'Presença nas redes sociais', de: 'Präsenz in den sozialen Medien', en: 'Social media presence',
        perguntas: [
          { key: 'mk_redes',        pt: 'Em que redes estou e quais são os perfis? (Instagram, LinkedIn, Facebook, TikTok, site)', de: 'In welchen Netzwerken bin ich und wie heißen die Profile? (Instagram, LinkedIn, Facebook, TikTok, Website)', en: 'Which networks am I on and what are the profiles? (Instagram, LinkedIn, Facebook, TikTok, website)' },
          { key: 'mk_frequencia',   pt: 'Com que frequência publico e quem cria o conteúdo?', de: 'Wie oft veröffentliche ich und wer erstellt die Inhalte?', en: 'How often do I post and who creates the content?' },
          { key: 'mk_conteudo',     pt: 'Que tipo de conteúdo publico hoje e qual funciona melhor?', de: 'Welche Art von Inhalten veröffentliche ich und was funktioniert am besten?', en: 'What kind of content do I post and what works best?' },
          { key: 'mk_numeros',      pt: 'Como estão os números? (seguidores, alcance, mensagens e pedidos que chegam)', de: 'Wie sind die Zahlen? (Follower, Reichweite, eingehende Nachrichten und Anfragen)', en: 'What do the numbers look like? (followers, reach, incoming messages and requests)' },
          { key: 'mk_identidade',   pt: 'Tenho identidade visual definida? (logótipo, cores, fotografias)', de: 'Habe ich eine definierte visuelle Identität? (Logo, Farben, Fotos)', en: 'Do I have a defined visual identity? (logo, colours, photos)' },
          { key: 'mk_referencias',  pt: 'Que perfis ou concorrentes admiro e porquê?', de: 'Welche Profile oder Mitbewerber bewundere ich und warum?', en: 'Which profiles or competitors do I admire, and why?' },
        ],
      },
      {
        key: 'mk_objetivos', num: '5.3',
        pt: 'Dificuldades e objetivos', de: 'Schwierigkeiten und Ziele', en: 'Difficulties and goals',
        perguntas: [
          { key: 'mk_dificuldades', pt: 'Quais são hoje as minhas maiores dificuldades no marketing?', de: 'Was sind heute meine größten Schwierigkeiten im Marketing?', en: 'What are my biggest marketing difficulties today?' },
          { key: 'mk_recursos',     pt: 'Quanto tempo e que orçamento posso dedicar ao marketing por mês?', de: 'Wie viel Zeit und Budget kann ich monatlich für Marketing aufwenden?', en: 'How much time and budget can I dedicate to marketing each month?' },
          { key: 'mk_metas',        pt: 'O que quero alcançar nos próximos 3 a 6 meses?', de: 'Was möchte ich in den nächsten 3 bis 6 Monaten erreichen?', en: 'What do I want to achieve in the next 3 to 6 months?' },
          { key: 'mk_medir',        pt: 'Como vou saber que o marketing está a funcionar?', de: 'Woran erkenne ich, dass das Marketing funktioniert?', en: 'How will I know the marketing is working?' },
        ],
      },
      {
        key: 'mk_diagnostico', num: '5.4',
        pt: 'Diagnóstico e próximos passos', de: 'Diagnose und nächste Schritte', en: 'Diagnosis and next steps',
        perguntas: [
          { key: 'mk_melhorar',     pt: 'O que podemos melhorar já? (perfil, biografia, destaques, conteúdo, frequência)', de: 'Was können wir sofort verbessern? (Profil, Bio, Highlights, Inhalte, Frequenz)', en: 'What can we improve right away? (profile, bio, highlights, content, frequency)' },
          { key: 'mk_prioridades',  pt: 'Quais são as 3 prioridades para as próximas semanas?', de: 'Was sind die 3 Prioritäten für die nächsten Wochen?', en: 'What are the 3 priorities for the coming weeks?' },
          { key: 'mk_proximos',     pt: 'Próximos passos: quem faz o quê e até quando?', de: 'Nächste Schritte: wer macht was bis wann?', en: 'Next steps: who does what, and by when?' },
        ],
      },
    ],
  },
]

// Blocos que contam para o percurso do plano de negócio (o 5, marketing, é opcional)
export const BLOCOS_PERCURSO = BLOCOS.filter(b => !b.opcional)

// Tabelas que contam para o progresso de cada bloco de números
export const TABELAS_POR_BLOCO = {
  3: [['privadas', 'rendimentos'], ['privadas', 'despesas'], ['capital', 'investimentos'],
      ['capital', 'constituicao'], ['financiamento', 'proprio'], ['financiamento', 'alheio']],
  4: [['projecao', 'receitas'], ['projecao', 'custos'], ['liquidez', 'entradas']],
}

// ── Quadrantes da SWOT ──
export const SWOT_QUADRANTES = [
  { key: 'forcas',        cor: '#0a7a3e', bg: '#eaf5ee', eixo: 'interno', sinal: '+', pt: 'Forças',        de: 'Stärken',    en: 'Strengths' },
  { key: 'fraquezas',     cor: '#c2410c', bg: '#fff1e8', eixo: 'interno', sinal: '−', pt: 'Fraquezas',     de: 'Schwächen',  en: 'Weaknesses' },
  { key: 'oportunidades', cor: '#1e60c8', bg: '#e8f0fb', eixo: 'externo', sinal: '+', pt: 'Oportunidades', de: 'Chancen',    en: 'Opportunities' },
  { key: 'ameacas',       cor: '#a9781a', bg: '#fbf3d9', eixo: 'externo', sinal: '−', pt: 'Ameaças',       de: 'Risiken',    en: 'Threats' },
]

// ── Células TOWS: cada uma cruza um quadrante interno com um externo ──
export const TOWS_CELULAS = [
  { key: 'so', de1: 'forcas',    de2: 'oportunidades', sigla: 'SO', pt: 'Atacar',   dePt: 'Usar as forças para agarrar as oportunidades',      deDe: 'Stärken nutzen, um Chancen zu ergreifen',        deEn: 'Use strengths to seize opportunities' },
  { key: 'wo', de1: 'fraquezas', de2: 'oportunidades', sigla: 'WO', pt: 'Melhorar', dePt: 'Corrigir fraquezas para poder agarrar oportunidades', deDe: 'Schwächen abbauen, um Chancen zu nutzen',       deEn: 'Fix weaknesses to seize opportunities' },
  { key: 'st', de1: 'forcas',    de2: 'ameacas',       sigla: 'ST', pt: 'Defender', dePt: 'Usar as forças para mitigar as ameaças',            deDe: 'Stärken nutzen, um Risiken abzuwehren',          deEn: 'Use strengths to mitigate threats' },
  { key: 'wt', de1: 'fraquezas', de2: 'ameacas',       sigla: 'WT', pt: 'Proteger', dePt: 'Reduzir a exposição onde há fraqueza e ameaça',     deDe: 'Exponierung verringern, wo Schwäche auf Risiko trifft', deEn: 'Reduce exposure where weakness meets threat' },
]

// ── Helpers ──
export const lbl = (obj, lang, campo = '') => {
  const k = campo ? campo + lang.charAt(0).toUpperCase() + lang.slice(1) : lang
  return obj?.[k] ?? obj?.[campo ? campo + 'Pt' : 'pt'] ?? ''
}
export const bloco = (n) => BLOCOS.find(b => b.n === n)
export const perguntasDoBloco = (n) =>
  (bloco(n)?.seccoes || []).flatMap(s => s.perguntas || [])

// Progresso: perguntas respondidas / total, mais os quadrantes SWOT preenchidos
// Uma tabela conta como feita quando tem pelo menos um valor preenchido.
const temValor = (linhas) => (linhas || []).some(l =>
  Array.isArray(l?.valores) ? l.valores.some(v => String(v ?? '').trim())
  : Array.isArray(l) ? String(l ?? '').trim()
  : String(l?.valor ?? '').trim())

export function progressoBloco(n, c) {
  const perguntas = perguntasDoBloco(n)
  const feitas = perguntas.filter(q => (c?.respostas?.[q.key] || '').trim()).length
  const temSwot = (bloco(n)?.seccoes || []).some(s => s.tipo === 'swot')
  const swotFeitos = temSwot ? SWOT_QUADRANTES.filter(q => (c?.swot?.[q.key] || []).length).length : 0
  // Blocos de números: conta as tabelas com algum valor
  const tabelas = TABELAS_POR_BLOCO[n] || []
  const tabelasFeitas = tabelas.filter(([sec, campo]) => {
    const v = c?.numeros?.[sec]?.[campo]
    return Array.isArray(v) ? temValor(v.map(x => (typeof x === 'object' ? x : { valor: x }))) : false
  }).length
  const total = perguntas.length + (temSwot ? SWOT_QUADRANTES.length : 0) + tabelas.length
  const soma = feitas + swotFeitos + tabelasFeitas
  return { feitas: soma, total, pct: total ? Math.round((soma / total) * 100) : 0 }
}

export function progressoTotal(c) {
  const r = [1, 2, 3, 4].map(n => progressoBloco(n, c))
  const feitas = r.reduce((s, x) => s + x.feitas, 0)
  const total = r.reduce((s, x) => s + x.total, 0)
  return { feitas, total, pct: total ? Math.round((feitas / total) * 100) : 0 }
}
