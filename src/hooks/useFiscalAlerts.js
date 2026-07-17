import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Obrigações fiscais pendentes vencidas ou a vencer dentro de `windowDays`.
// Usado no sino de notificações (AppLayout) e no badge do menu (Sidebar).
export function useFiscalAlerts(windowDays = 14, userId) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      if (!userId) { setAlerts([]); setLoading(false); return }
      const { data } = await supabase
        .from('fiscal_obligations')
        .select('id,obligation_type,deadline,country,status')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('deadline', { ascending: true })
      if (!active) return
      const today = new Date(); today.setHours(0, 0, 0, 0)
      const list = (data || [])
        .map(o => ({ ...o, days: Math.round((new Date(o.deadline) - today) / 86400000) }))
        .filter(o => o.days <= windowDays)
      setAlerts(list)
      setLoading(false)
    })()
    return () => { active = false }
  }, [windowDays, userId])

  return { alerts, count: alerts.length, loading }
}
