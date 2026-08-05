// Destino inicial de cada utilizador após login, conforme role e plataforma.
// Login unificado: o utilizador nunca escolhe — vai direto para a sua plataforma.
export function homePathFor(role, platform) {
  if (role === 'admin') return '/gestao/clientes'
  // Papéis de equipa: entram direto na sua única área
  if (role === 'comercial') return '/gestao/crm'
  if (role === 'marketing') return '/gestao/marketing'
  if (platform === 'esg') return '/esg/diagnostico'
  // 'accounting' e 'both' aterram na Contabilidade ('both' alterna pelo toggle)
  return '/contabilidade/dashboard'
}
