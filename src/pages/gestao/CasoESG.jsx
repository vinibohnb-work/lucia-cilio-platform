import { useState, useEffect, useCallback } from 'react'
import { Outlet, NavLink, useParams, useNavigate } from 'react-router-dom'
import EsqueletoPagina from '../../components/EsqueletoPagina'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { AlvoESGProvider } from '../../context/AlvoESGContext'
import { FASES, rotuloFase } from '../../lib/esgPercurso'

// Casca de um caso ESG na Gestão. É aqui que a Lúcia trabalha: o nome da
// empresa fica sempre em cima, o menu do percurso vive dentro do caso, e as
// seis páginas por baixo (Outlet) lêem e gravam neste caso.

export default function CasoESG() {
  const { id } = useParams()
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  const [caso, setCaso] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  const L = lang === 'de' ? {
    voltar: '← ESG-Beratungen', eyebrow: 'Verwaltung · ESG-Beratung', percurso: 'Weg',
    ativa: 'Laufend', concluida: 'Abgeschlossen', pausada: 'Pausiert',
    conta: 'Konto verknüpft', semConta: 'ohne Konto', visivel: 'Kunde sieht Weg & Bericht', oculto: 'Für den Kunden ausgeblendet',
    naoEncontrado: 'ESG-Beratung nicht gefunden.', erroSave: 'Speichern fehlgeschlagen.',
  } : lang === 'en' ? {
    voltar: '← ESG consultancies', eyebrow: 'Management · ESG consultancy', percurso: 'Journey',
    ativa: 'Active', concluida: 'Completed', pausada: 'Paused',
    conta: 'Account linked', semConta: 'no account', visivel: 'Client sees journey & report', oculto: 'Hidden from the client',
    naoEncontrado: 'ESG consultancy not found.', erroSave: 'Save failed.',
  } : {
    voltar: '← Consultorias ESG', eyebrow: 'Gestão · Consultoria ESG', percurso: 'Percurso',
    ativa: 'Ativa', concluida: 'Concluída', pausada: 'Pausada',
    conta: 'Conta ligada', semConta: 'sem conta', visivel: 'O cliente vê percurso e relatório', oculto: 'Escondido do cliente',
    naoEncontrado: 'Consultoria ESG não encontrada.', erroSave: 'Falha ao guardar.',
  }

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('esg_consultorias').select('*').eq('id', id).maybeSingle()
    setCaso(data || null)
    setLoading(false)
  }, [id])
  useEffect(() => { load() }, [load])

  async function alterar(patch) {
    setErro('')
    setCaso(prev => ({ ...prev, ...patch }))
    const { error } = await supabase.from('esg_consultorias')
      .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { setErro(L.erroSave); load() }
  }

  if (loading) return <EsqueletoPagina cartoes={2} linhas={4} />
  if (!caso) return (
    <div style={{ padding: '40px 0' }}>
      <button onClick={() => navigate('/gestao/esg')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.accentText, fontWeight: 700, fontSize: '13px', padding: 0, marginBottom: '12px' }}>{L.voltar}</button>
      <div style={{ color: t.subtle, fontSize: '14px' }}>{L.naoEncontrado}</div>
    </div>
  )

  const base = `/gestao/esg/${id}`
  const statusTone = { ativa: t.dueOk, concluida: { bg: t.chipBg, ink: t.chipText }, pausada: { bg: t.segBg, ink: t.textMuted } }
  const tone = statusTone[caso.status] || statusTone.ativa

  const tabStyle = ({ isActive }) => ({
    padding: '8px 13px', borderRadius: '9px', fontSize: '12.5px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
    background: isActive ? t.navActiveBg || t.softCardBg : 'transparent',
    color: isActive ? t.accentText : t.textMuted,
    border: `1px solid ${isActive ? t.accent : 'transparent'}`,
  })

  return (
    <AlvoESGProvider value={{ caso, id: caso.id, base, soLeitura: false, recarregar: load }}>
      <div style={{ width: '100%', fontFamily: t.fontBody }}>
        <button onClick={() => navigate('/gestao/esg')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.accentText, fontWeight: 700, fontSize: '13px', padding: 0, marginBottom: '12px' }}>{L.voltar}</button>

        {/* Cabeçalho do caso: quem é, em que estado está, o que o cliente vê */}
        <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px', padding: '14px 18px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, color: t.accentText, marginBottom: '3px' }}>{L.eyebrow}</div>
              <div style={{ fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '22px' : '26px', lineHeight: 1.05, color: t.heading }}>{caso.empresa || caso.nome}</div>
              <div style={{ fontSize: '12px', color: t.textMuted, marginTop: '3px' }}>
                {caso.empresa ? `${caso.nome} · ` : ''}{caso.email || ''}{caso.telefone ? ` · ${caso.telefone}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <select value={caso.status} onChange={e => alterar({ status: e.target.value })}
                style={{ padding: '5px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, border: 'none', background: tone.bg, color: tone.ink, cursor: 'pointer', outline: 'none' }}>
                {['ativa', 'concluida', 'pausada'].map(s => <option key={s} value={s}>{L[s]}</option>)}
              </select>
              <span title={caso.user_id ? L.conta : L.semConta} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 700, background: t.softCardBg, color: caso.user_id ? t.accentText : t.subtle }}>
                {caso.user_id ? '🔗 ' + L.conta : L.semConta}
              </span>
              {caso.user_id && (
                <label title={caso.visivel_cliente ? L.visivel : L.oculto} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: t.textMuted, cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!caso.visivel_cliente} onChange={e => alterar({ visivel_cliente: e.target.checked })} style={{ accentColor: t.accent }} />
                  {caso.visivel_cliente ? L.visivel : L.oculto}
                </label>
              )}
            </div>
          </div>
          {erro && <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 700, color: t.neg }}>{erro}</div>}

          {/* O menu do percurso vive dentro do caso */}
          <nav style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${t.cardBorder}` }}>
            <NavLink to={base} end style={tabStyle}>{L.percurso}</NavLink>
            {FASES.map(f => (
              <NavLink key={f.key} to={`${base}/${f.rota}`} style={tabStyle}>{f.n} · {rotuloFase(f, lang)}</NavLink>
            ))}
          </nav>
        </div>

        <Outlet />
      </div>
    </AlvoESGProvider>
  )
}
