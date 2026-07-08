import { createContext, useContext, useEffect, useState } from 'react'
import { THEMES } from '../theme'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const s = typeof localStorage !== 'undefined' ? localStorage.getItem('lc-office-theme') : null
    return s === 'night' || s === 'light' ? s : 'light'
  })

  useEffect(() => {
    localStorage.setItem('lc-office-theme', theme)
    // Atualiza a cor da barra do browser/PWA e o fundo do body conforme o tema
    document.documentElement.style.background = THEMES[theme].appBg
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'night' ? '#04140b' : '#0a2f1a')
  }, [theme])

  const value = {
    theme,
    night: theme === 'night',
    t: THEMES[theme],
    toggle: () => setTheme(p => (p === 'night' ? 'light' : 'night')),
    setTheme,
  }
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  // Fallback defensivo: nunca devolver undefined (evita crash ao desestruturar t)
  return ctx || { theme: 'light', night: false, t: THEMES.light, toggle: () => {}, setTheme: () => {} }
}
