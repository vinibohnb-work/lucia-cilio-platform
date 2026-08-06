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

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [role, setRole]       = useState(null)
  const [platform, setPlatform] = useState(null)
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function resolve(sess) {
      if (!active) return
      setSession(sess)
      if (sess?.user) {
        const { role: r, platform: p, mustChangePassword: m } = await fetchProfile(sess.user.id)
        if (active) { setRole(r); setPlatform(p); setMustChangePassword(m) }
      } else {
        setRole(null); setPlatform(null); setMustChangePassword(false)
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
    isAdmin: role === 'admin',
    // Palavra-passe temporária por trocar: força a passagem por /definir-senha
    mustChangePassword,
    clearMustChangePassword: () => setMustChangePassword(false),
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
