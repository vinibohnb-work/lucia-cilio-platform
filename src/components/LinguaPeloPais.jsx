import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { supabase } from '../lib/supabase'

// Ao entrar, um cliente vê a plataforma na língua do país da empresa (14/10):
// primeiro o país da ficha (mantido pela equipa), senão o dos dados da empresa.
// Uma escolha feita nas bandeiras prevalece (ver LangContext). A equipa não muda.
const LINGUA_DO_PAIS = { DE: 'de', PT: 'pt' }

export default function LinguaPeloPais() {
  const { user, role } = useAuth()
  const { sugerirLang } = useLang()

  useEffect(() => {
    if (!user || role !== 'user') return
    let vivo = true
    ;(async () => {
      const { data: ficha } = await supabase.from('clientes').select('pais').eq('user_id', user.id).maybeSingle()
      let pais = ficha?.pais
      if (!pais) {
        const { data: cfg } = await supabase.from('company_settings').select('country').eq('user_id', user.id).maybeSingle()
        pais = cfg?.country
      }
      if (vivo && LINGUA_DO_PAIS[pais]) sugerirLang(LINGUA_DO_PAIS[pais])
    })()
    return () => { vivo = false }
  }, [user, role, sugerirLang])

  return null
}
