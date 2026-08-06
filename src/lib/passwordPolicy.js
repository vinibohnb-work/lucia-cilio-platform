// ============================================================================
// Regras da palavra-passe e gerador de senhas temporárias.
// As regras têm de acompanhar o que o Supabase impõe (Authentication →
// Policies). Confirmado na reunião de 06/08/2026: é exigido caractere especial.
// ============================================================================

export const MIN_LENGTH = 8
const SPECIAL = '!@#$%&*?+-'

// Cada regra tem um teste e um rótulo nas três línguas, para a lista de
// requisitos e a validação usarem exatamente a mesma fonte.
export const PASSWORD_RULES = [
  { key: 'len',     test: (p) => p.length >= MIN_LENGTH,
    pt: `Pelo menos ${MIN_LENGTH} caracteres`, de: `Mindestens ${MIN_LENGTH} Zeichen`, en: `At least ${MIN_LENGTH} characters` },
  { key: 'lower',   test: (p) => /[a-z]/.test(p),
    pt: 'Uma letra minúscula', de: 'Ein Kleinbuchstabe', en: 'One lowercase letter' },
  { key: 'upper',   test: (p) => /[A-Z]/.test(p),
    pt: 'Uma letra maiúscula', de: 'Ein Großbuchstabe', en: 'One uppercase letter' },
  { key: 'digit',   test: (p) => /[0-9]/.test(p),
    pt: 'Um número', de: 'Eine Ziffer', en: 'One number' },
  { key: 'special', test: (p) => /[^A-Za-z0-9]/.test(p),
    pt: 'Um caractere especial (! @ # $ % & *)', de: 'Ein Sonderzeichen (! @ # $ % & *)', en: 'One special character (! @ # $ % & *)' },
]

export const ruleLabel = (rule, lang) => rule[lang] || rule.pt

// Estado de cada regra para a palavra-passe dada
export const checkPassword = (pw) =>
  PASSWORD_RULES.map(r => ({ ...r, ok: r.test(pw || '') }))

export const isPasswordValid = (pw) => PASSWORD_RULES.every(r => r.test(pw || ''))

// Palavra-passe temporária legível: evita caracteres ambíguos (0/O, 1/l/I) para
// não gerar confusão quando a Lúcia a dita ou envia por mensagem.
export function generatePassword(length = 12) {
  const lower = 'abcdefghijkmnpqrstuvwxyz'
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const digit = '23456789'
  const all = lower + upper + digit + SPECIAL
  const pick = (set) => set[Math.floor(Math.random() * set.length)]

  // Garante pelo menos um de cada tipo exigido
  const chars = [pick(lower), pick(upper), pick(digit), pick(SPECIAL)]
  while (chars.length < Math.max(length, MIN_LENGTH)) chars.push(pick(all))

  // Baralha (Fisher-Yates) para os obrigatórios não ficarem sempre no início
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}
