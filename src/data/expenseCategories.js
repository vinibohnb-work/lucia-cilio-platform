// Categorias de despesa para o Livro de Caixa.
// Cada categoria tem: chave, rótulo + explicação (PT/DE) e tipo de custo.
// costType: 'fixed' | 'variable' | 'other'

export const EXPENSE_CATEGORIES = [
  { key: 'material',   costType: 'variable',
    pt: { label: 'Material e Consumíveis',       explain: 'Produtos e materiais utilizados para prestar o serviço ou produzir o produto.' },
    de: { label: 'Material und Verbrauchsmaterial', explain: 'Produkte und Materialien zur Erbringung der Leistung oder Herstellung des Produkts.' } },
  { key: 'auto',       costType: 'variable',
    pt: { label: 'Automóvel e Combustível',      explain: 'Gasóleo, gasolina, manutenção, seguro, portagens e estacionamento.' },
    de: { label: 'Fahrzeug und Kraftstoff',      explain: 'Diesel, Benzin, Wartung, Versicherung, Maut und Parken.' } },
  { key: 'telecom',    costType: 'fixed',
    pt: { label: 'Telecomunicações',             explain: 'Telemóvel, internet e comunicações da atividade.' },
    de: { label: 'Telekommunikation',            explain: 'Mobiltelefon, Internet und betriebliche Kommunikation.' } },
  { key: 'software',   costType: 'fixed',
    pt: { label: 'Software e Subscrições',       explain: 'Programas e plataformas digitais.' },
    de: { label: 'Software und Abonnements',     explain: 'Programme und digitale Plattformen.' } },
  { key: 'marketing',  costType: 'variable',
    pt: { label: 'Marketing e Publicidade',      explain: 'Anúncios, flyers, website e promoções.' },
    de: { label: 'Marketing und Werbung',        explain: 'Anzeigen, Flyer, Website und Promotionen.' } },
  { key: 'formacao',   costType: 'other',
    pt: { label: 'Formação',                     explain: 'Cursos, workshops, livros e formações.' },
    de: { label: 'Weiterbildung',                explain: 'Kurse, Workshops, Bücher und Schulungen.' } },
  { key: 'honorarios', costType: 'fixed',
    pt: { label: 'Honorários Profissionais',     explain: 'Contabilista, advogado, consultor e outros profissionais.' },
    de: { label: 'Beraterhonorare',              explain: 'Buchhalter, Anwalt, Berater und andere Fachleute.' } },
  { key: 'renda',      costType: 'fixed',
    pt: { label: 'Renda e Instalações',          explain: 'Renda de escritório, loja, coworking ou armazém.' },
    de: { label: 'Miete und Räumlichkeiten',     explain: 'Miete für Büro, Laden, Coworking oder Lager.' } },
  { key: 'limpeza',    costType: 'fixed',
    pt: { label: 'Limpeza e Higiene',            explain: 'Produtos e serviços de limpeza.' },
    de: { label: 'Reinigung und Hygiene',        explain: 'Reinigungsprodukte und -dienstleistungen.' } },
  { key: 'viagens',    costType: 'variable',
    pt: { label: 'Viagens e Deslocações',        explain: 'Hotéis, voos, comboios, táxis e deslocações profissionais.' },
    de: { label: 'Reisen und Fahrten',           explain: 'Hotels, Flüge, Züge, Taxis und Geschäftsreisen.' } },
  { key: 'refeicoes',  costType: 'variable',
    pt: { label: 'Refeições de Negócio',         explain: 'Refeições com clientes, fornecedores ou parceiros.' },
    de: { label: 'Geschäftsessen',               explain: 'Mahlzeiten mit Kunden, Lieferanten oder Partnern.' } },
  { key: 'bancos',     costType: 'fixed',
    pt: { label: 'Bancos e Comissões',           explain: 'Comissões bancárias, PayPal, Stripe e similares.' },
    de: { label: 'Bankgebühren und Provisionen', explain: 'Bankgebühren, PayPal, Stripe und Ähnliches.' } },
  { key: 'impostos',   costType: 'other',
    pt: { label: 'Impostos e Taxas',             explain: 'Taxas administrativas, licenças e registos.' },
    de: { label: 'Steuern und Gebühren',         explain: 'Verwaltungsgebühren, Lizenzen und Registrierungen.' } },
  { key: 'seguros',    costType: 'fixed',
    pt: { label: 'Seguros',                      explain: 'Seguros empresariais e responsabilidade civil.' },
    de: { label: 'Versicherungen',               explain: 'Betriebs- und Haftpflichtversicherungen.' } },
  { key: 'equipamentos', costType: 'other',
    pt: { label: 'Equipamentos e Investimentos', explain: 'Computadores, mobiliário, máquinas e outros bens duradouros.' },
    de: { label: 'Ausrüstung und Investitionen', explain: 'Computer, Möbel, Maschinen und andere langlebige Güter.' } },
  { key: 'outros',     costType: 'other',
    pt: { label: 'Outros',                       explain: 'Despesas não enquadradas nas categorias anteriores.' },
    de: { label: 'Sonstiges',                    explain: 'Ausgaben, die in keine der vorherigen Kategorien passen.' } },
]

export const COST_TYPE = {
  fixed:    { pt: 'Fixo',     de: 'Fix',      bg: '#eff6ff', color: '#1d4ed8' },
  variable: { pt: 'Variável', de: 'Variabel', bg: '#fff7ed', color: '#c2410c' },
  other:    { pt: 'Outros',   de: 'Sonstige', bg: '#f1f5f9', color: '#64748b' },
}

const BY_KEY = Object.fromEntries(EXPENSE_CATEGORIES.map(c => [c.key, c]))
export const getCategory = (key) => BY_KEY[key] || null
export const categoryLabel = (key, lang) => getCategory(key)?.[lang]?.label || ''
