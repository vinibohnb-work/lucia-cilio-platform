import { createContext, useContext, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'

// "Ver como" (só leitura): um admin escolhe um utilizador na Gestão e passa a
// ver as páginas com os dados desse utilizador. Guardado em sessionStorage
// (persiste na navegação; limpa ao fechar o separador).
const ViewAsContext = createContext()
const KEY = 'lc-view-as'

export function ViewAsProvider({ children }) {
  const [viewAs, setState] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || null } catch { return null }
  })
  const setViewAs = useCallback((v) => {
    setState(v)
    try { if (v) sessionStorage.setItem(KEY, JSON.stringify(v)); else sessionStorage.removeItem(KEY) } catch { /* ignore */ }
  }, [])
  const clearViewAs = useCallback(() => setViewAs(null), [setViewAs])
  return (
    <ViewAsContext.Provider value={{ viewAs, setViewAs, clearViewAs, isViewing: !!viewAs }}>
      {children}
    </ViewAsContext.Provider>
  )
}

export function useViewAs() {
  return useContext(ViewAsContext) || { viewAs: null, isViewing: false, setViewAs: () => {}, clearViewAs: () => {} }
}

// Id do utilizador cujos dados devem ser lidos: o alvo "Ver como" ou o próprio.
export function useEffectiveUserId() {
  const { user } = useAuth()
  const { viewAs } = useViewAs()
  return viewAs?.id || user?.id || null
}
