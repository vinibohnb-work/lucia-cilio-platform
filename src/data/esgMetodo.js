// Conteúdo fixo do método de consultoria ESG da Lúcia — documento "Consultoria
// ESG: estrutura do método" (mentoria com o Luís Sinate), enviado na reunião de
// 15/10. A nomenclatura final é revista pela Lúcia (decisão de 04/08).
//
// Tudo o que aqui se preenche grava-se em esg_consultorias.metodo (migração 046):
//   { arranque: { p1…p7, gestao, operacoes, marketing, comunidade },
//     fotografia: { E: { praticas, lacunas, riscos, semInfo }, S: {…}, G: {…} },
//     devolucao: { desenvolvidas, analisar, oportunidades },
//     problemas: [{ id, tema, sintoma, causa, impacto }],
//     reunioes: [{ id, data, resumo, decisoes, proximos }],
//     feedback: [{ id, data, nota, mudou, melhorar }],
//     avaliacao: { feito, mudou, porFazer, evidencias, riscos, proximo } }

const T = (pt, de, en) => ({ pt, de, en })
export const txt = (o, lang) => (o && (o[lang] || o.pt)) || ''

// Os três níveis em que o serviço se vende ("Diagnóstico e Desenvolvimento ESG")
export const NIVEIS = [
  { key: 'diagnostico', nome: T('Diagnóstico ESG', 'ESG-Diagnose', 'ESG Diagnosis'),
    entrega: T('Fotografia atual + prioridades + recomendações', 'Ist-Aufnahme + Prioritäten + Empfehlungen', 'Current snapshot + priorities + recommendations') },
  { key: 'desenvolvimento', nome: T('Desenvolvimento ESG', 'ESG-Entwicklung', 'ESG Development'),
    entrega: T('Plano de ação + implementação + KPIs + acompanhamento', 'Maßnahmenplan + Umsetzung + KPIs + Begleitung', 'Action plan + implementation + KPIs + follow-up') },
  { key: 'reporting', nome: T('Reporting ESG', 'ESG-Reporting', 'ESG Reporting'),
    entrega: T('Consolidação de resultados + evidências + relatório', 'Ergebnisse + Nachweise + Bericht', 'Consolidated results + evidence + report') },
]

// As 7 perguntas para o formulário de arranque
export const PERGUNTAS_ARRANQUE = [
  { key: 'p1', t: T('Quais são atualmente os principais objetivos e desafios da empresa?',
    'Was sind derzeit die wichtigsten Ziele und Herausforderungen des Unternehmens?',
    'What are the company’s main goals and challenges right now?') },
  { key: 'p2', t: T('O que significa sustentabilidade para a empresa e que iniciativas já existem?',
    'Was bedeutet Nachhaltigkeit für das Unternehmen, und welche Initiativen gibt es schon?',
    'What does sustainability mean to the company, and what initiatives already exist?') },
  { key: 'p3', t: T('Quem são os principais stakeholders do negócio — colaboradores, clientes, fornecedores, comunidade, investidores ou outros?',
    'Wer sind die wichtigsten Stakeholder — Mitarbeitende, Kunden, Lieferanten, Gemeinschaft, Investoren oder andere?',
    'Who are the main stakeholders — employees, clients, suppliers, community, investors or others?') },
  { key: 'p4', t: T('Que impactos ambientais e sociais consideram mais relevantes na atividade?',
    'Welche ökologischen und sozialen Auswirkungen halten Sie in Ihrer Tätigkeit für am wichtigsten?',
    'Which environmental and social impacts do you consider most relevant to the business?') },
  { key: 'p5', t: T('Existem objetivos, políticas, responsáveis ou indicadores relacionados com sustentabilidade?',
    'Gibt es Ziele, Richtlinien, Verantwortliche oder Kennzahlen zur Nachhaltigkeit?',
    'Are there sustainability goals, policies, people in charge or indicators?') },
  { key: 'p6', t: T('Que dados relacionados com energia, resíduos, pessoas, fornecedores, comunidade ou outros temas ESG já são recolhidos?',
    'Welche Daten zu Energie, Abfall, Personal, Lieferanten, Gemeinschaft oder anderen ESG-Themen werden bereits erfasst?',
    'What data on energy, waste, people, suppliers, community or other ESG topics is already collected?') },
  { key: 'p7', t: T('Daqui a 12 meses, o que gostariam de poder dizer que mudou em matéria de sustentabilidade?',
    'Was möchten Sie in 12 Monaten sagen können, das sich bei der Nachhaltigkeit verändert hat?',
    'In 12 months, what would you like to be able to say has changed in sustainability?'),
    destaque: T('Revela o resultado que o cliente quer comprar.', 'Zeigt, welches Ergebnis der Kunde kaufen möchte.', 'Reveals the result the client wants to buy.') },
]

// As primeiras reuniões, como a Lúcia as faz (15/10): "primeira reunião com a
// liderança, primeira reunião com a parte operacional e uma terceira reunião
// extra, onde eu faço o protocolo". Sem IA nas reuniões com o cliente: o
// protocolo é escrito à mão. Gravam-se em metodo.primeiras[key].
export const REUNIOES_ARRANQUE = [
  { key: 'lideranca', nome: T('Reunião com a liderança', 'Gespräch mit der Geschäftsführung', 'Meeting with leadership'),
    ajuda: T('prioridades, riscos, oportunidades, porquê agora', 'Prioritäten, Risiken, Chancen, warum jetzt', 'priorities, risks, opportunities, why now') },
  { key: 'operacional', nome: T('Reunião com a parte operacional', 'Gespräch mit dem Betrieb', 'Meeting with operations'),
    ajuda: T('energia, resíduos, fornecedores, processos, instalações', 'Energie, Abfall, Lieferanten, Prozesse, Räume', 'energy, waste, suppliers, processes, premises') },
  { key: 'extra', nome: T('Reunião extra', 'Zusätzliches Gespräch', 'Extra meeting'),
    ajuda: T('o que ficou por ver; observação do espaço', 'was noch offen ist; Besichtigung', 'what is still open; site visit') },
]
export const CAMPOS_REUNIAO = [
  { key: 'participantes', t: T('Com quem', 'Mit wem', 'With whom'), linhas: 1 },
  { key: 'protocolo', t: T('Protocolo da reunião', 'Gesprächsprotokoll', 'Meeting minutes'), linhas: 6 },
  { key: 'proximos', t: T('Próximos passos', 'Nächste Schritte', 'Next steps'), linhas: 2 },
]

// Com quem se fala dentro da empresa (o ESG é transversal)
export const INTERLOCUTORES = [
  { key: 'gestao', nome: T('Gestão / Founder', 'Geschäftsführung / Gründer', 'Management / Founder'),
    foco: T('prioridades, riscos, oportunidades, posicionamento e decisões', 'Prioritäten, Risiken, Chancen, Positionierung, Entscheidungen', 'priorities, risks, opportunities, positioning, decisions') },
  { key: 'operacoes', nome: T('Operações', 'Betrieb', 'Operations'),
    foco: T('energia, resíduos, fornecedores, consumos, processos e instalações', 'Energie, Abfall, Lieferanten, Verbrauch, Prozesse, Räume', 'energy, waste, suppliers, consumption, processes, premises') },
  { key: 'marketing', nome: T('Marketing / Comunicação', 'Marketing / Kommunikation', 'Marketing / Communication'),
    foco: T('o que se pode comunicar — e o que não, sem evidência', 'was kommuniziert werden kann — und was nicht ohne Nachweis', 'what can be communicated — and what not without evidence') },
  { key: 'comunidade', nome: T('Comunidade / Membros', 'Gemeinschaft / Mitglieder', 'Community / Members'),
    foco: T('impacto social, eventos, inclusão, formação, satisfação', 'soziale Wirkung, Events, Inklusion, Weiterbildung, Zufriedenheit', 'social impact, events, inclusion, training, satisfaction') },
]

// Quem faz o quê — evita que a consultora execute o que pertence à empresa
export const RESPONSABILIDADES = {
  consultora: T('Estrutura, orienta, analisa, recomenda, cria ferramentas, acompanha e desafia.',
    'Strukturiert, begleitet, analysiert, empfiehlt, entwickelt Werkzeuge, fordert heraus.',
    'Structures, guides, analyses, recommends, builds tools, follows up and challenges.'),
  cliente: T('Disponibiliza informação, decide, atribui responsáveis, executa as ações e recolhe as evidências.',
    'Stellt Informationen bereit, entscheidet, benennt Verantwortliche, setzt um und sammelt Nachweise.',
    'Provides information, decides, assigns owners, carries out the actions and collects the evidence.'),
}

// Fotografia por pilar (fase 1 — "onde estamos?")
export const PILARES_FOTO = [
  { key: 'E', nome: T('Ambiental', 'Umwelt', 'Environmental'), ajuda: T('energia, água, resíduos, mobilidade, compras, materiais, emissões', 'Energie, Wasser, Abfall, Mobilität, Einkauf, Materialien, Emissionen', 'energy, water, waste, mobility, purchasing, materials, emissions') },
  { key: 'S', nome: T('Social', 'Soziales', 'Social'), ajuda: T('colaboradores, clientes, diversidade, formação, saúde e segurança, comunidade, acessibilidade', 'Mitarbeitende, Kunden, Vielfalt, Weiterbildung, Arbeitsschutz, Gemeinschaft, Barrierefreiheit', 'employees, clients, diversity, training, health & safety, community, accessibility') },
  { key: 'G', nome: T('Governação', 'Unternehmensführung', 'Governance'), ajuda: T('responsabilidades, políticas, processos, proteção de dados, ética, fornecedores, documentação', 'Zuständigkeiten, Richtlinien, Prozesse, Datenschutz, Ethik, Lieferanten, Dokumentation', 'responsibilities, policies, processes, data protection, ethics, suppliers, documentation') },
]
export const CAMPOS_FOTO = [
  { key: 'praticas', t: T('O que já faz', 'Was bereits getan wird', 'What is already done') },
  { key: 'lacunas', t: T('Lacunas', 'Lücken', 'Gaps') },
  { key: 'riscos', t: T('Riscos e oportunidades', 'Risiken und Chancen', 'Risks and opportunities') },
  { key: 'semInfo', t: T('Sem informação (a não resposta também é resposta)', 'Keine Information (auch keine Antwort ist eine Antwort)', 'No information (no answer is an answer too)') },
]

// Primeira devolução ao cliente (bloco 3 da primeira sessão)
export const CAMPOS_DEVOLUCAO = [
  { key: 'desenvolvidas', t: T('Áreas já desenvolvidas', 'Bereits entwickelte Bereiche', 'Areas already developed') },
  { key: 'analisar', t: T('Áreas que precisam de maior análise', 'Bereiche, die mehr Analyse brauchen', 'Areas needing more analysis') },
  { key: 'oportunidades', t: T('Potenciais oportunidades', 'Mögliche Chancen', 'Potential opportunities') },
]

// Avaliação final (fase 6 — "o que mudou?")
export const PERGUNTAS_AVALIACAO = [
  { key: 'feito', t: T('O que foi feito?', 'Was wurde getan?', 'What was done?') },
  { key: 'mudou', t: T('O que mudou?', 'Was hat sich verändert?', 'What changed?') },
  { key: 'porFazer', t: T('O que ficou por fazer?', 'Was ist offen geblieben?', 'What is still to do?') },
  { key: 'evidencias', t: T('Que evidências existem?', 'Welche Nachweise gibt es?', 'What evidence exists?') },
  { key: 'riscos', t: T('Que riscos e oportunidades foram identificados?', 'Welche Risiken und Chancen wurden erkannt?', 'What risks and opportunities were identified?') },
  { key: 'proximo', t: T('Qual é o próximo passo?', 'Was ist der nächste Schritt?', 'What is the next step?') },
]

export const preenchido = (v) => String(v ?? '').trim() !== ''
export const respostasArranque = (metodo) => PERGUNTAS_ARRANQUE.filter(p => preenchido(metodo?.arranque?.[p.key])).length
