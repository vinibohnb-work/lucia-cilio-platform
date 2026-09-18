import { useState, useEffect, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import EsqueletoPagina from '../../components/EsqueletoPagina'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import { useEffectiveUserId } from '../../context/ViewAsContext'
import { AlvoESGProvider } from '../../context/AlvoESGContext'

// A área ESG do cliente, depois de 18/09: só leitura. Ele vê o percurso, os
// indicadores e o relatório do caso que a Lúcia lhe ligou — não preenche nada.
// Se ela ainda não abriu um caso para ele (ou o escondeu), aparece isto em vez
// de seis páginas vazias.

export default function ClienteESG() {
  const { lang } = useLang()
  const { t } = useTheme()
  const eid = useEffectiveUserId()

  const [caso, setCaso] = useState(null)
  const [loading, setLoading] = useState(true)

  const L = lang === 'de' ? {
    titulo: 'ESG-Beratung', semCaso: 'Ihre ESG-Beratung ist noch nicht freigeschaltet.',
    semCasoSub: 'Sobald Ihre Beraterin den Weg vorbereitet hat, erscheint er hier.',
  } : lang === 'en' ? {
    titulo: 'ESG consulting', semCaso: 'Your ESG consultancy is not available yet.',
    semCasoSub: 'As soon as your consultant has prepared the journey, it will appear here.',
  } : {
    titulo: 'Consultoria ESG', semCaso: 'A sua consultoria ESG ainda não está disponível.',
    semCasoSub: 'Assim que a sua consultora preparar o percurso, aparece aqui.',
  }

  const load = useCallback(async () => {
    if (!eid) return
    setLoading(true)
    // A política de leitura já filtra pelo utilizador e por visivel_cliente;
    // o filtro aqui é para o "Ver como" do admin, que lê tudo.
    const { data } = await supabase.from('esg_consultorias').select('*')
      .eq('user_id', eid).eq('visivel_cliente', true)
      .order('updated_at', { ascending: false }).limit(1).maybeSingle()
    setCaso(data || null)
    setLoading(false)
  }, [eid])
  useEffect(() => { load() }, [load])

  if (loading) return <EsqueletoPagina cartoes={3} linhas={5} />

  if (!caso) return (
    <div style={{ width: '100%', maxWidth: '640px', fontFamily: t.fontBody }}>
      <h1 style={{ margin: '0 0 18px', fontFamily: t.fontDisplay, fontWeight: 600, fontSize: '30px', color: t.heading }}>{L.titulo}</h1>
      <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px', padding: '34px 28px', textAlign: 'center' }}>
        <div style={{ fontSize: '34px', marginBottom: '10px' }}>🌱</div>
        <div style={{ fontSize: '15px', fontWeight: 700, color: t.heading, marginBottom: '6px' }}>{L.semCaso}</div>
        <div style={{ fontSize: '13px', color: t.textMuted, lineHeight: 1.5 }}>{L.semCasoSub}</div>
      </div>
    </div>
  )

  return (
    <AlvoESGProvider value={{ caso, id: caso.id, base: '/esg', soLeitura: true, recarregar: load }}>
      <Outlet />
    </AlvoESGProvider>
  )
}
