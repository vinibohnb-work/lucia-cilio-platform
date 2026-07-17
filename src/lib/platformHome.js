// Destino inicial de cada utilizador após login, conforme role e plataforma.
// Login unificado: o utilizador nunca escolhe — vai direto para a sua plataforma.
export function homePathFor(role, platform) {
  if (role === 'admin') return '/gestao/clientes'
  if (platform === 'esg') return '/esg/diagnostico'
  return '/contabilidade/dashboard'
}
