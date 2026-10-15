import { createContext, useContext, useState, useCallback } from 'react'

const LangContext = createContext()

// Língua da interface (decisão de 14/10): por omissão segue o país do cliente
// (DE → alemão, PT → português); quem escolhe nas bandeiras fica com a escolha,
// guardada neste dispositivo. As regras fiscais nunca dependem da língua.
const CHAVE = 'lc-office-lang'
const LINGUAS = ['pt', 'de', 'en']

function escolhaGuardada() {
  try { const l = localStorage.getItem(CHAVE); return LINGUAS.includes(l) ? l : null } catch { return null }
}

// Antes do login ainda não se sabe o país: um browser em alemão abre em alemão.
function linguaInicial() {
  const guardada = escolhaGuardada()
  if (guardada) return guardada
  const nav = (typeof navigator !== 'undefined' && navigator.language || '').toLowerCase()
  return nav.startsWith('de') ? 'de' : 'pt'
}

export function LangProvider({ children }) {
  const [lang, setLangEstado] = useState(linguaInicial)

  // Escolha feita pela pessoa (bandeiras): passa a valer neste dispositivo.
  const setLang = useCallback((l) => {
    setLangEstado(l)
    try { localStorage.setItem(CHAVE, l) } catch { /* sem armazenamento: vale só nesta sessão */ }
  }, [])

  // Língua sugerida pelo país; não se sobrepõe a uma escolha feita nas bandeiras.
  const sugerirLang = useCallback((l) => {
    if (LINGUAS.includes(l) && !escolhaGuardada()) setLangEstado(l)
  }, [])

  return (
    <LangContext.Provider value={{ lang, setLang, sugerirLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
