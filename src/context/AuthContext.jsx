import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

async function fetchProfile(userId) {
  if (!userId) return { role: null, platform: null, mustChangePassword: false }
  const { data, error } = await supabase
    .from('profiles')
    .select('role, platform, must_change_password')
    .eq('id', userId)
    .single()
  if (error) return { role: 'user', platform: 'accounting', mustChangePassword: false } // fallback (ex: antes das migrações)
  return {
    role: data?.role || 'user',
    platform: data?.platform || 'accounting',
    mustChangePassword: !!data?.must_change_password,
  }
}

// true quando a conta tem um fator verificado e a sessão ainda está em aal1.
// Lido da própria sessão (o "aal" vem no token; os fatores, no utilizador) —
// chamar o Supabase dentro do onAuthStateChange pode bloquear a sessão.
function nivelMfa(sess) {
  try {
    const verificado = (sess?.user?.factors || []).some(f => f.status === 'verified')
    if (!verificado) return false
    const b64 = sess.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const aal = JSON.parse(atob(b64)).aal
    return aal !== 'aal2'
  } catch { return false }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [role, setRole]       = useState(null)
  const [platform, setPlatform] = useState(null)
  const [mustChangePassword, setMustChangePassword] = useState(false)
  // Verificação em dois passos (R5a): a sessão tem um fator TOTP verificado mas
  // ainda não passou o código — fica presa no ecrã do código até o confirmar.
  const [precisaMfa, setPrecisaMfa] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function resolve(sess) {
      if (!active) return
      setSession(sess)
      if (sess?.user) {
        const { role: r, platform: p, mustChangePassword: m } = await fetchProfile(sess.user.id)
        if (active) { setRole(r); setPlatform(p); setMustChangePassword(m); setPrecisaMfa(nivelMfa(sess)) }
      } else {
        setRole(null); setPlatform(null); setMustChangePassword(false); setPrecisaMfa(false)
      }
      if (active) setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => resolve(data.session))

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      resolve(newSession)
    })

    return () => { active = false; sub.subscription.unsubscribe() }
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    role,
    platform,
    // O nome da pessoa vive nos metadados da conta (é o que Acessos grava), não em profiles.
    displayName: session?.user?.user_metadata?.display_name || '',
    isAdmin: role === 'admin',
    // Palavra-passe temporária por trocar: força a passagem por /definir-senha
    mustChangePassword,
    clearMustChangePassword: () => setMustChangePassword(false),
    precisaMfa,
    reverMfa: async () => { const { data } = await supabase.auth.getSession(); setPrecisaMfa(nivelMfa(data.session)) },
    // Papéis de equipa da Lúcia (acesso restrito a uma área da Gestão)
    isComercial: role === 'comercial',
    isMarketing: role === 'marketing',
    isStaff: role === 'admin' || role === 'comercial' || role === 'marketing',
    loading,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
