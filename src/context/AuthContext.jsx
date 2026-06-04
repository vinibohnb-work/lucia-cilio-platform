import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

async function fetchRole(userId) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  if (error) return 'user' // fallback (ex: antes da migração 003)
  return data?.role || 'user'
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [role, setRole]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function resolve(sess) {
      if (!active) return
      setSession(sess)
      if (sess?.user) {
        const r = await fetchRole(sess.user.id)
        if (active) setRole(r)
      } else {
        setRole(null)
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
