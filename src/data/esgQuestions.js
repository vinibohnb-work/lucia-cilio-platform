// ============================================================================
// Questionário ESG — Creditreform "Advanced" 2023 (ano de referência 2023)
// 28 perguntas: 10 Environment · 7 Social · 11 Governance
// Alinhado aos European Sustainability Reporting Standards (ESRS/EFRAG).
// Schema trilingue (DE original + tradução PT + EN). A complexidade vive aqui,
// nos dados — o formulário (Diagnostico.jsx) é genérico e renderiza por `type`.
//
// Tipos de resposta:
//   'boolean'   → Sim / Não
//   'boolean3'  → Sim / Não / Planejado
//   'number'    → valor numérico (units[] opcional → dropdown de unidade)
//   'percent'   → valor em %
//   'group'     → várias linhas (fields[]), cada uma number/percent com units
// Todas as perguntas oferecem ainda as opções padrão "não consegui responder"
// (indisponível / pergunta não clara) — tratadas no formulário via estado `na`.
// Nota: os rótulos de subcampo (fields[].pt) são partilhados por todos os idiomas.
// ============================================================================

export const ESG_PILLARS = [
  {
    key: 'E', letter: 'E',
    pt: 'Ambiente', de: 'Umwelt', en: 'Environment',
    introPt: 'Estas perguntas tratam dos impactos das atividades empresariais sobre o meio ambiente e o clima.',
    introDe: 'Diese Fragen betreffen die Auswirkungen der Unternehmenstätigkeit auf Umwelt und Klima.',
    introEn: 'These questions concern the impact of business activities on the environment and climate.',
    color: '#0a7a3e', bg: '#eaf5ee',
  },
  {
    key: 'S', letter: 'S',
    pt: 'Social', de: 'Soziales', en: 'Social',
    introPt: 'Estas perguntas tratam de saúde e segurança do trabalho e engajamento social.',
    introDe: 'Diese Fragen betreffen Arbeitsschutz, Gesundheit und soziales Engagement.',
    introEn: 'These questions concern occupational health and safety and social engagement.',
    color: '#1e60c8', bg: '#e8f0fb',
  },
  {
    key: 'G', letter: 'G',
    pt: 'Governança', de: 'Unternehmensführung', en: 'Governance',
    introPt: 'Estas perguntas tratam de uma gestão empresarial séria, que respeita as leis e mantém processos de direção e controle.',
    introDe: 'Diese Fragen betreffen eine seriöse, gesetzestreue Unternehmensführung mit Leitungs- und Kontrollprozessen.',
    introEn: 'These questions concern serious, law-abiding corporate management with proper governance and control processes.',
    color: '#a9781a', bg: '#fbf3d9',
  },
]

export const ESG_QUESTIONS = [
  // ─────────────── ENVIRONMENT (1–10) ───────────────
  {
    id: 1, pillar: 'E', type: 'boolean',
    de: 'Erwarten Sie für Ihr Unternehmen relevante Chancen oder Risiken aus den CO₂-Reduktionsplänen von Europa und Deutschland?',
    pt: 'A sua empresa espera oportunidades ou riscos relevantes decorrentes dos planos de redução de CO₂ da Europa e da Alemanha?',
    en: 'Does your company expect relevant opportunities or risks arising from the CO₂ reduction plans of Europe and Germany?',
  },
  {
    id: 2, pillar: 'E', type: 'group',
    de: 'Wie hoch war der Energieverbrauch Ihres Unternehmens im Bezugsjahr für die folgenden Energieträger?',
    pt: 'Qual foi o consumo de energia da sua empresa no ano de referência, por fonte de energia?',
    en: 'What was your company\'s energy consumption in the reference year, by energy source?',
    fields: [
      { key: 'erdgas',      sub: 'Não renováveis', pt: 'Gás natural (Erdgas L e H)', type: 'number', units: ['m³', 'kWh', 'Joule'] },
      { key: 'fluessiggas', sub: 'Não renováveis', pt: 'Gás liquefeito (GLP / Flüssiggas)', type: 'number', units: ['t', 'm³', 'kWh', 'Joule'] },
      { key: 'heizoel_l',   sub: 'Não renováveis', pt: 'Óleo de aquecimento leve (Heizöl leicht)', type: 'number', units: ['Litros'] },
      { key: 'heizoel_s',   sub: 'Não renováveis', pt: 'Óleo de aquecimento pesado (Heizöl schwer)', type: 'number', units: ['Litros'] },
      { key: 'steinkohle',  sub: 'Não renováveis', pt: 'Hulha (Steinkohle)', type: 'number', units: ['t'] },
      { key: 'braunkohle',  sub: 'Não renováveis', pt: 'Linhito (Braunkohle)', type: 'number', units: ['t'] },
      { key: 'benzin',      sub: 'Não renováveis', pt: 'Gasolina (veículos da empresa)', type: 'number', units: ['Litros'] },
      { key: 'diesel',      sub: 'Não renováveis', pt: 'Diesel (veículos da empresa)', type: 'number', units: ['Litros'] },
      { key: 'fernwaerme_nr', sub: 'Não renováveis', pt: 'Aquecimento/refrigeração distrital (Nah-/Fernwärme/-Kälte)', type: 'number', units: ['kWh', 'Joule'] },
      { key: 'outras_nr',   sub: 'Não renováveis', pt: 'Outras fontes não especificadas', type: 'number', units: ['kWh', 'Joule'] },
      { key: 'biomasse',    sub: 'Renováveis', pt: 'Biomassa / madeira (Biomasse/Holz)', type: 'number', units: ['t', 'kWh', 'Joule'] },
      { key: 'biogas',      sub: 'Renováveis', pt: 'Biogás (Biogas)', type: 'number', units: ['m³', 'kWh', 'Joule'] },
      { key: 'biodiesel',   sub: 'Renováveis', pt: 'Biodiesel', type: 'number', units: ['Litros', 'kWh', 'Joule'] },
      { key: 'holzpellets', sub: 'Renováveis', pt: 'Pellets de madeira (Holzpellets)', type: 'number', units: ['t', 'kWh', 'Joule'] },
      { key: 'fernwaerme_r', sub: 'Renováveis', pt: 'Aquecimento/refrigeração distrital renovável', type: 'number', units: ['kWh', 'Joule'] },
      { key: 'outras_r',    sub: 'Renováveis', pt: 'Outras fontes renováveis não especificadas', type: 'number', units: ['kWh', 'Joule'] },
      { key: 'elet_total',  sub: 'Eletricidade', pt: 'Consumo total de eletricidade', type: 'number', units: ['kWh'] },
      { key: 'elet_renov',  sub: 'Eletricidade', pt: 'Parcela de fontes renováveis', type: 'percent' },
      { key: 'elet_auto',   sub: 'Eletricidade', pt: 'Parcela autogerada', type: 'percent' },
    ],
  },
  {
    id: 3, pillar: 'E', type: 'number', units: ['gCO₂/kWh'],
    de: 'Sofern Ihr Energieversorger Ihnen entsprechende Informationen mitteilt: Wie hoch war der durchschnittliche CO₂-Ausstoß Ihres Elektrizitätsverbrauchs?',
    pt: 'Caso o seu fornecedor de energia informe (ex.: na fatura anual): qual foi a emissão média de CO₂ do seu consumo de eletricidade?',
    en: 'If your energy supplier provides this (e.g. on the annual bill): what was the average CO₂ emission of your electricity consumption?',
  },
  {
    id: 4, pillar: 'E', type: 'boolean',
    de: 'Hat Ihr Unternehmen in der Vergangenheit Investitionen in umweltfreundliche Güter getätigt (z.B. Solaranlage, Wärmepumpe, Elektroauto) und besitzt/betreibt diese aktuell noch?',
    pt: 'A sua empresa já investiu em bens ecológicos (ex.: painéis solares, bomba de calor, carro elétrico) e ainda os possui/opera atualmente?',
    en: 'Has your company invested in eco-friendly goods (e.g. solar panels, heat pump, electric car) and does it still own/operate them today?',
  },
  {
    id: 5, pillar: 'E', type: 'group',
    de: 'Wie hoch war der CO₂-Ausstoß Ihres Unternehmens im Bezugsjahr?',
    pt: 'Qual foi a emissão de CO₂ da sua empresa no ano de referência?',
    en: 'What were your company\'s CO₂ emissions in the reference year?',
    fields: [
      { key: 'total',   pt: 'Emissão total de CO₂', type: 'number', units: ['t CO₂'] },
      { key: 'scope1',  pt: 'Scope 1 (emissões diretas)', type: 'number', units: ['t CO₂'] },
      { key: 'scope2',  pt: 'Scope 2 (energia adquirida)', type: 'number', units: ['t CO₂'] },
      { key: 'scope3',  pt: 'Scope 3 (cadeia de valor)', type: 'number', units: ['t CO₂'] },
    ],
  },
  {
    id: 6, pillar: 'E', type: 'boolean',
    de: 'Hat Ihr Unternehmen ein CO₂-Emissionsreduktionsziel?',
    pt: 'A sua empresa possui uma meta de redução de emissões de CO₂?',
    en: 'Does your company have a CO₂ emissions reduction target?',
  },
  {
    id: 7, pillar: 'E', type: 'boolean',
    de: 'Kompensieren Sie die CO₂-Emissionen Ihres Unternehmens ganz oder teilweise?',
    pt: 'A sua empresa compensa, total ou parcialmente, as suas emissões de CO₂?',
    en: 'Do you offset your company\'s CO₂ emissions, fully or partially?',
  },
  {
    id: 8, pillar: 'E', type: 'number', units: ['m³', 'l', 'Euro'],
    de: 'Wie hoch war der Wasserverbrauch Ihres Unternehmens im Bezugsjahr?',
    pt: 'Qual foi o consumo de água da sua empresa no ano de referência?',
    en: 'What was your company\'s water consumption in the reference year?',
  },
  {
    id: 9, pillar: 'E', type: 'group',
    de: 'Wie hoch war das Abfallaufkommen Ihres Unternehmens im Bezugsjahr?',
    pt: 'Qual foi a geração de resíduos da sua empresa no ano de referência?',
    en: 'What was your company\'s waste generation in the reference year?',
    fields: [
      { key: 'total',        pt: 'Resíduos totais', type: 'number', units: ['t', 'Euro'] },
      { key: 'total_recic',  pt: 'Resíduos totais: parcela reciclada', type: 'percent' },
      { key: 'perigosos',    pt: 'Resíduos perigosos', type: 'number', units: ['t', 'Euro'] },
      { key: 'perigosos_recic', pt: 'Resíduos perigosos: parcela reciclada', type: 'percent' },
    ],
  },
  {
    id: 10, pillar: 'E', type: 'group',
    de: 'Wie hoch waren die taxonomiefähigen und -konformen Umsätze, Investitionen und Betriebsausgaben Ihres Unternehmens im Bezugsjahr?',
    pt: 'Quais foram as receitas, investimentos e despesas operacionais elegíveis e alinhados à Taxonomia (UE) no ano de referência?',
    en: 'What were your taxonomy-eligible and taxonomy-aligned revenues, investments and operating expenses (EU Taxonomy) in the reference year?',
    fields: [
      { key: 'total',     pt: 'Total (receitas + investimentos + despesas op.)', type: 'number', units: ['Euro'] },
      { key: 'elegivel',  pt: 'Elegível à taxonomia (taxonomiefähig)', type: 'percent' },
      { key: 'alinhado',  pt: 'Alinhado à taxonomia (taxonomiekonform)', type: 'percent' },
    ],
  },

  // ─────────────── SOCIAL (11–17) ───────────────
  {
    id: 11, pillar: 'S', type: 'number', units: ['FTE'],
    de: 'Wie viele Mitarbeiter beschäftigte Ihr Unternehmen durchschnittlich im Bezugsjahr?',
    pt: 'Quantos funcionários a sua empresa empregou, em média, no ano de referência? (em equivalentes de tempo integral — FTE)',
    en: 'How many employees did your company employ on average in the reference year? (in full-time equivalents — FTE)',
  },
  {
    id: 12, pillar: 'S', type: 'group',
    de: 'Wie hoch war der Anteil der Frauen in Ihrem Unternehmen innerhalb der folgenden Positionen?',
    pt: 'Qual foi o percentual de mulheres na sua empresa nas seguintes posições?',
    en: 'What was the share of women in your company in the following positions?',
    fields: [
      { key: 'todos',     pt: 'Todos os funcionários', type: 'percent' },
      { key: 'liderancas', pt: 'Lideranças (com gestão de equipa)', type: 'percent' },
      { key: 'alta_gestao', pt: 'Alta gestão (diretoria, conselho executivo)', type: 'percent' },
      { key: 'controle',  pt: 'Nível de controlo (conselho fiscal, representação dos sócios)', type: 'percent' },
    ],
  },
  {
    id: 13, pillar: 'S', type: 'percent',
    de: 'Im Verhältnis zum durchschnittlichen Bruttostundenverdienst aller Männer: wieviel höher oder niedriger ist dieser Verdienst für alle Frauen in Ihrem Unternehmen?',
    pt: 'Em relação ao salário-hora bruto médio dos homens: quanto maior ou menor é o salário das mulheres na sua empresa? (gender pay gap; use valor negativo se menor)',
    en: 'Relative to the average gross hourly pay of all men: how much higher or lower is the pay for all women in your company? (gender pay gap; use a negative value if lower)',
  },
  {
    id: 14, pillar: 'S', type: 'group',
    de: 'Wie viele gemeldete Arbeitsunfälle gab es in Ihrem Unternehmen im Bezugsjahr?',
    pt: 'Quantos acidentes de trabalho registados houve na sua empresa no ano de referência?',
    en: 'How many reported occupational accidents occurred in your company in the reference year?',
    fields: [
      { key: 'com_afastamento', pt: 'Acidentes com 3 ou mais dias de afastamento', type: 'number' },
      { key: 'fatais',          pt: 'Acidentes de trabalho fatais', type: 'number' },
    ],
  },
  {
    id: 15, pillar: 'S', type: 'group',
    de: 'Wie viele Kündigungen gab es in Ihrem Unternehmen im Bezugsjahr?',
    pt: 'Quantos desligamentos houve na sua empresa no ano de referência?',
    en: 'How many terminations were there in your company in the reference year?',
    fields: [
      { key: 'todos',          pt: 'Todos os desligamentos', type: 'number' },
      { key: 'por_iniciativa', pt: 'Apenas por iniciativa do funcionário', type: 'number' },
    ],
  },
  {
    id: 16, pillar: 'S', type: 'number', units: ['horas'],
    de: 'Wie viele Fortbildungsstunden erhielten Ihre Mitarbeiter durchschnittlich im Bezugsjahr?',
    pt: 'Quantas horas de formação os seus funcionários receberam, em média, no ano de referência?',
    en: 'How many training hours did your employees receive on average in the reference year?',
  },
  {
    id: 17, pillar: 'S', type: 'number', units: ['Euro'],
    de: 'Wie hoch waren die durchschnittlichen Fortbildungskosten pro Mitarbeiter Ihres Unternehmens im Bezugsjahr?',
    pt: 'Qual foi o custo médio de formação por funcionário no ano de referência?',
    en: 'What was the average training cost per employee in the reference year?',
  },

  // ─────────────── GOVERNANCE (18–28) ───────────────
  {
    id: 18, pillar: 'G', type: 'number',
    de: 'Wie viele Personen und/oder Gesellschaften sind Eigentümer Ihres Unternehmens?',
    pt: 'Quantas pessoas e/ou sociedades são proprietárias da sua empresa?',
    en: 'How many individuals and/or companies own your company?',
  },
  {
    id: 19, pillar: 'G', type: 'number', units: ['anos'],
    de: 'Bezogen auf die an Ihrem gesamten Unternehmen beteiligten Personen: Wie lange sind diese Personen im Schnitt aktiv an Ihrem Unternehmen beteiligt?',
    pt: 'Em relação às pessoas com participação na empresa: há quanto tempo, em média, participam ativamente da empresa?',
    en: 'Regarding the people holding a stake in your company: on average, how long have they been actively involved in the company?',
  },
  {
    id: 20, pillar: 'G', type: 'boolean',
    de: 'Sind alle Eigentümer Ihres Unternehmens direkt im Management Ihres Unternehmens tätig?',
    pt: 'Todos os proprietários da empresa atuam diretamente na gestão da empresa?',
    en: 'Do all owners of your company work directly in its management?',
  },
  {
    id: 21, pillar: 'G', type: 'boolean',
    de: 'Ist die Person, die Ihr Unternehmen in letzter Instanz lenkt (z.B. Mehrheitseigentümer), aktiv im Management Ihres Unternehmens tätig?',
    pt: 'A pessoa que controla a empresa em última instância (ex.: sócio maioritário) atua ativamente na gestão da empresa?',
    en: 'Is the person who ultimately controls your company (e.g. majority owner) actively involved in its management?',
  },
  {
    id: 22, pillar: 'G', type: 'boolean',
    de: 'Ist der Abschluss Ihres Unternehmens prüfungspflichtig oder haben Sie einen WP/BP mit der Prüfung Ihres Unternehmens beauftragt?',
    pt: 'As demonstrações financeiras da empresa estão sujeitas a auditoria obrigatória, ou contratou um auditor (WP/BP) para auditar a empresa?',
    en: 'Are your company\'s financial statements subject to mandatory audit, or have you engaged an auditor to audit the company?',
  },
  {
    id: 23, pillar: 'G', type: 'boolean3',
    de: 'Erhebt und verarbeitet Ihr Unternehmen Nachhaltigkeitsdaten, die in die Berichterstattung einfließen?',
    pt: 'A sua empresa recolhe e processa dados de sustentabilidade que alimentam relatórios corporativos?',
    en: 'Does your company collect and process sustainability data that feeds into corporate reporting?',
  },
  {
    id: 24, pillar: 'G', type: 'boolean',
    de: 'Bezieht Ihr Unternehmen in Managemententscheidungen ebenfalls Umwelt- und Sozialfaktoren ein und hat dafür Richtlinien und Entscheidungshilfen implementiert?',
    pt: 'A sua empresa considera fatores ambientais e sociais nas decisões de gestão e implementou diretrizes e ferramentas de apoio à decisão para isso?',
    en: 'Does your company factor environmental and social aspects into management decisions and has it implemented policies and decision-support tools for this?',
  },
  {
    id: 25, pillar: 'G', type: 'boolean',
    de: 'Erhalten die Personen in der Führungsebene Ihres Unternehmens Vergütungsanteile, die an das Erreichen spezifischer Nachhaltigkeitsziele geknüpft sind?',
    pt: 'A liderança da empresa recebe parcelas de remuneração vinculadas ao atingimento de metas específicas de sustentabilidade?',
    en: 'Does your company\'s leadership receive remuneration components tied to achieving specific sustainability targets?',
  },
  {
    id: 26, pillar: 'G', type: 'boolean',
    de: 'Verfügt Ihr Unternehmen über Umwelt- und/oder weitere nachhaltigkeitsbezogene Zertifizierungen?',
    pt: 'A sua empresa possui certificações ambientais e/ou outras certificações relacionadas à sustentabilidade?',
    en: 'Does your company hold environmental and/or other sustainability-related certifications?',
  },
  {
    id: 27, pillar: 'G', type: 'boolean',
    de: 'Gibt es in Ihrem Unternehmen Handlungsanweisungen und/oder eine Richtlinie zur Vermeidung von Korruption und Bestechlichkeit bei Ihnen und Ihren Geschäftspartnern?',
    pt: 'Existem na sua empresa instruções e/ou uma política para prevenção de corrupção e suborno, abrangendo a empresa e os seus parceiros de negócio?',
    en: 'Does your company have instructions and/or a policy to prevent corruption and bribery, covering the company and its business partners?',
  },
  {
    id: 28, pillar: 'G', type: 'boolean',
    de: 'Gibt es in Ihrem Unternehmen eine Compliance-Richtlinie oder einen Compliance-Beauftragten?',
    pt: 'Existe na sua empresa uma política de compliance ou um responsável por compliance?',
    en: 'Does your company have a compliance policy or a compliance officer?',
  },
]

export const ESG_TOTAL = ESG_QUESTIONS.length

export function questionsByPillar(key) {
  return ESG_QUESTIONS.filter(q => q.pillar === key)
}
