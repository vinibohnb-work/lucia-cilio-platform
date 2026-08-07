// Destino inicial de cada utilizador após login, conforme role e plataforma.
// Login unificado: o utilizador nunca escolhe — vai direto para a sua plataforma.
export function homePathFor(role, platform) {
  if (role === 'admin') return '/gestao/clientes'
  // Papéis de equipa: entram direto na sua única área
  if (role === 'comercial') return '/gestao/crm'
  if (role === 'marketing') return '/gestao/marketing'
  if (platform === 'esg') return '/esg/diagnostico'
  // 'accounting', 'accounting_lite' e 'both' aterram na Contabilidade
  // ('both' alterna pelo toggle)
  return '/contabilidade/dashboard'
}

// ── Contabilidade Lite ──────────────────────────────────────────────────────
// Variante da Contabilidade que mostra apenas a secção "Contabilidade" do menu
// (o dia a dia: painel, caixa, catálogo, obrigações) e esconde a secção
// "Gestão" (precificação, planeamento, clientes, empresa, consultoria e o
// módulo alemão). Para clientes que só querem lançar e acompanhar.
export const isLite = (platform) => platform === 'accounting_lite'

// Para efeitos de plataforma, "lite" é Contabilidade — o que muda é o âmbito.
export const basePlatform = (platform) => (isLite(platform) ? 'accounting' : platform)

// Secções do menu visíveis em lite
export const LITE_SECTIONS = ['section_acc']

// Rotas permitidas em lite. Inclui /contabilidade/recorrentes: não está no menu,
// mas o Painel tem um botão para lá — bloqueá-la deixaria um botão morto.
export const LITE_PATHS = [
  '/contabilidade/dashboard',
  '/contabilidade/caixa',
  '/contabilidade/recorrentes',
  '/contabilidade/catalogo',
  '/contabilidade/obrigacoes',
]

export const liteAllows = (pathname) =>
  LITE_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
