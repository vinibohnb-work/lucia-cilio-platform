// ============================================================================
// Biblioteca de temas de materialidade — destilada da lista de temas ESRS
// (ESRS 1 AR16) para linguagem de PME, alinhada ao espírito do VSME.
// abbr: rótulo curto usado nos pontos da matriz.
// A Lúcia pode ajustar/validar esta lista com o mentor — é só dados.
// ============================================================================

export const ESG_TOPICS = [
  // ── Ambiente ──
  { key: 'clima',    pillar: 'E', abbr: 'CL',
    pt: 'Clima e energia',              de: 'Klima und Energie',                 en: 'Climate and energy',
    hintPt: 'Consumo de energia, emissões de CO₂, eficiência.', hintDe: 'Energieverbrauch, CO₂-Emissionen, Effizienz.', hintEn: 'Energy use, CO₂ emissions, efficiency.' },
  { key: 'poluicao', pillar: 'E', abbr: 'PO',
    pt: 'Poluição',                     de: 'Umweltverschmutzung',               en: 'Pollution',
    hintPt: 'Emissões para o ar, água e solo; químicos.', hintDe: 'Emissionen in Luft, Wasser, Boden; Chemikalien.', hintEn: 'Emissions to air, water, soil; chemicals.' },
  { key: 'agua',     pillar: 'E', abbr: 'AG',
    pt: 'Água',                         de: 'Wasser',                            en: 'Water',
    hintPt: 'Consumo e gestão de água.', hintDe: 'Wasserverbrauch und -management.', hintEn: 'Water use and management.' },
  { key: 'residuos', pillar: 'E', abbr: 'RE',
    pt: 'Resíduos e circularidade',     de: 'Abfall und Kreislaufwirtschaft',    en: 'Waste and circularity',
    hintPt: 'Geração de resíduos, reciclagem, reutilização de materiais.', hintDe: 'Abfallaufkommen, Recycling, Wiederverwendung.', hintEn: 'Waste generation, recycling, material reuse.' },
  { key: 'biodiv',   pillar: 'E', abbr: 'BI',
    pt: 'Biodiversidade e ecossistemas', de: 'Biodiversität und Ökosysteme',     en: 'Biodiversity and ecosystems',
    hintPt: 'Impacto em habitats, solos e espécies.', hintDe: 'Auswirkungen auf Lebensräume, Böden, Arten.', hintEn: 'Impact on habitats, soils, species.' },

  // ── Social ──
  { key: 'equipa',   pillar: 'S', abbr: 'EQ',
    pt: 'Equipa própria',               de: 'Eigene Belegschaft',                en: 'Own workforce',
    hintPt: 'Condições de trabalho, saúde e segurança, salários.', hintDe: 'Arbeitsbedingungen, Gesundheit und Sicherheit, Löhne.', hintEn: 'Working conditions, health & safety, wages.' },
  { key: 'formacao', pillar: 'S', abbr: 'FO',
    pt: 'Formação e desenvolvimento',   de: 'Aus- und Weiterbildung',            en: 'Training and development',
    hintPt: 'Qualificação e progresso dos colaboradores.', hintDe: 'Qualifizierung und Entwicklung der Mitarbeitenden.', hintEn: 'Employee skills and growth.' },
  { key: 'diversid', pillar: 'S', abbr: 'DI',
    pt: 'Diversidade e igualdade',      de: 'Vielfalt und Gleichstellung',       en: 'Diversity and equality',
    hintPt: 'Igualdade de género, inclusão, gap salarial.', hintDe: 'Geschlechtergleichstellung, Inklusion, Lohnlücke.', hintEn: 'Gender equality, inclusion, pay gap.' },
  { key: 'cadeia',   pillar: 'S', abbr: 'CV',
    pt: 'Trabalhadores na cadeia de valor', de: 'Arbeitskräfte in der Wertschöpfungskette', en: 'Value chain workers',
    hintPt: 'Condições nos fornecedores e parceiros.', hintDe: 'Bedingungen bei Lieferanten und Partnern.', hintEn: 'Conditions at suppliers and partners.' },
  { key: 'comunid',  pillar: 'S', abbr: 'CM',
    pt: 'Comunidades locais',           de: 'Lokale Gemeinschaften',             en: 'Local communities',
    hintPt: 'Impacto e envolvimento na comunidade.', hintDe: 'Wirkung und Engagement in der Gemeinschaft.', hintEn: 'Community impact and engagement.' },
  { key: 'clientes', pillar: 'S', abbr: 'CU',
    pt: 'Clientes e consumidores',      de: 'Kundinnen und Verbraucher',         en: 'Customers and consumers',
    hintPt: 'Segurança do produto/serviço, privacidade de dados.', hintDe: 'Produkt-/Dienstleistungssicherheit, Datenschutz.', hintEn: 'Product/service safety, data privacy.' },

  // ── Governança ──
  { key: 'conduta',  pillar: 'G', abbr: 'CO',
    pt: 'Conduta e ética empresarial',  de: 'Unternehmensethik',                 en: 'Business conduct and ethics',
    hintPt: 'Cultura, valores, gestão responsável.', hintDe: 'Kultur, Werte, verantwortliche Führung.', hintEn: 'Culture, values, responsible management.' },
  { key: 'anticorr', pillar: 'G', abbr: 'AC',
    pt: 'Anticorrupção e suborno',      de: 'Korruptions- und Bestechungsprävention', en: 'Anti-corruption and bribery',
    hintPt: 'Prevenção de corrupção na empresa e parceiros.', hintDe: 'Prävention bei Unternehmen und Partnern.', hintEn: 'Prevention in the company and partners.' },
  { key: 'pagament', pillar: 'G', abbr: 'PA',
    pt: 'Pagamentos a fornecedores',    de: 'Zahlungspraktiken',                 en: 'Payment practices',
    hintPt: 'Prazos e práticas de pagamento justas.', hintDe: 'Faire Zahlungsfristen und -praktiken.', hintEn: 'Fair payment terms and practices.' },
  { key: 'transpar', pillar: 'G', abbr: 'TR',
    pt: 'Transparência e reporte',      de: 'Transparenz und Berichterstattung', en: 'Transparency and reporting',
    hintPt: 'Qualidade da informação prestada a terceiros.', hintDe: 'Qualität der Informationen an Dritte.', hintEn: 'Quality of information provided to others.' },
  { key: 'riscos',   pillar: 'G', abbr: 'RI',
    pt: 'Governança e gestão de riscos', de: 'Governance und Risikomanagement',  en: 'Governance and risk management',
    hintPt: 'Processos de decisão, controlo interno.', hintDe: 'Entscheidungsprozesse, interne Kontrolle.', hintEn: 'Decision processes, internal control.' },
]

export const TOPIC_PILLAR_META = {
  E: { color: '#0a7a3e', bg: '#eaf5ee', pt: 'Ambiente', de: 'Umwelt', en: 'Environment' },
  S: { color: '#1e60c8', bg: '#e8f0fb', pt: 'Social', de: 'Soziales', en: 'Social' },
  G: { color: '#a9781a', bg: '#fbf3d9', pt: 'Governança', de: 'Unternehmensführung', en: 'Governance' },
}

export const topicLabel = (topic, lang) => topic[lang] || topic.pt
export const topicHint = (topic, lang) => lang === 'de' ? topic.hintDe : lang === 'en' ? topic.hintEn : topic.hintPt

// Tema é material quando ambos os eixos atingem o limiar.
export const isMaterial = (entry, threshold) =>
  !!entry?.applicable && Number(entry.stakeholder) >= threshold && Number(entry.company) >= threshold
