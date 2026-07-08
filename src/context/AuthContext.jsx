import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

async function fetchProfile(userId) {
  if (!userId) return { role: null, platform: null }
  const { data, error } = await supabase
    .from('profiles')
    .select('role, platform')
    .eq('id', userId)
    .single()
  if (error) return { role: 'user', platform: 'accounting' } // fallback (ex: antes das migrações)
  return { role: data?.role || 'user', platform: data?.platform || 'accounting' }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [role, setRole]       = useState(null)
  const [platform, setPlatform] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function resolve(sess) {
      if (!active) return
      setSession(sess)
      if (sess?.user) {
        const { role: r, platform: p } = await fetchProfile(sess.user.id)
        if (active) { setRole(r); setPlatform(p) }
      } else {
        setRole(null); setPlatform(null)
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
    loading,
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
