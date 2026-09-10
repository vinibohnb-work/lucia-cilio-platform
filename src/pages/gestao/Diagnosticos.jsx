import { useState, useEffect, useCallback } from 'react'
import EsqueletoPagina from '../../components/EsqueletoPagina'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { localeDe } from '../../lib/formato'
import { opcaoDe } from '../../data/enquadramento'
import { criarLeadDeContacto } from '../../lib/leadsCrm'

// Respostas do formulário público de diagnóstico.
//
// O filtro decide o que SOBE ao CRM, não o que existe: as respostas abaixo do
// corte ficam aqui na mesma, com o motivo à vista. Nenhum contacto se perde por
// causa de uma regra automática — e a regra vive em src/lib/triagem.js, para
// ser afinada com a Lúcia sem mexer em mais nada.

export default function Diagnosticos() {
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [filtro, setFiltro] = useState('novo')
  const [aberta, setAberta] = useState(null)      // id da resposta expandida
  const [ocupado, setOcupado] = useState(null)

  const L = lang === 'de' ? {
    eyebrow: 'Verwaltung', titulo: 'Erstdiagnosen', subtitulo: 'Antworten aus dem öffentlichen Formular. Der Filter entscheidet, was ins CRM aufsteigt — verloren geht nichts.',
    novo: 'Neu', no_crm: 'Im CRM', descartado: 'Verworfen', todas: 'Alle',
    qualificado: 'Qualifiziert', abaixo: 'Unter der Schwelle',
    addCrm: '+ Zum CRM', descartar: 'Verwerfen', verCrm: 'Im CRM ansehen →', repor: 'Zurückholen',
    vazio: 'Noch keine Antworten.', erro: 'Fehler (Migration 032 nötig).',
    contacto: 'Kontakt', respostas: 'Antworten', semResposta: 'ohne Antwort', ligacao: 'Formular-Link',
  } : lang === 'en' ? {
    eyebrow: 'Management', titulo: 'Initial diagnoses', subtitulo: 'Answers from the public form. The filter decides what rises to the CRM — nothing is lost.',
    novo: 'New', no_crm: 'In CRM', descartado: 'Discarded', todas: 'All',
    qualificado: 'Qualified', abaixo: 'Below the cut',
    addCrm: '+ Add to CRM', descartar: 'Discard', verCrm: 'See in CRM →', repor: 'Restore',
    vazio: 'No answers yet.', erro: 'Error (migration 032 required).',
    contacto: 'Contact', respostas: 'Answers', semResposta: 'not answered', ligacao: 'Form link',
  } : {
    eyebrow: 'Gestão', titulo: 'Diagnósticos', subtitulo: 'Respostas do formulário público. O filtro decide o que sobe ao CRM — não se perde nada.',
    novo: 'Novos', no_crm: 'No CRM', descartado: 'Descartados', todas: 'Todas',
    qualificado: 'Qualificado', abaixo: 'Abaixo do corte',
    addCrm: '+ Juntar ao CRM', descartar: 'Descartar', verCrm: 'Ver no CRM →', repor: 'Repor',
    vazio: 'Ainda não há respostas.', erro: 'Erro (é necessária a migração 032).',
    contacto: 'Contacto', respostas: 'Respostas', semResposta: 'sem resposta', ligacao: 'Ligação do formulário',
  }

  const load = useCallback(async () => {
    setLoading(true); setErro('')
    const { data, error } = await supabase.from('diagnostico_submissoes')
      .select('*').order('created_at', { ascending: false })
    if (error) setErro(L.erro); else setLista(data || [])
    setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])

  async function juntarAoCrm(s) {
    setOcupado(s.id); setErro('')
    const { data, error } = await criarLeadDeContacto({
      nome: s.nome, empresa: s.empresa, email: s.email, telefone: s.telefone,
      enquadramento: s.respostas || {}, origem: 'diagnostico',
      notaExtra: `Veio do formulário de diagnóstico em ${new Date(s.created_at).toLocaleDateString(localeDe(lang))}.\n${s.motivo || ''}`,
      lang,
    })
    if (error || !data) { setOcupado(null); setErro(L.erro); return }
    await supabase.from('diagnostico_submissoes')
      .update({ estado: 'no_crm', crm_lead_id: data.id }).eq('id', s.id)
    setOcupado(null); load()
  }

  async function mudarEstado(s, estado) {
    setOcupado(s.id)
    await supabase.from('diagnostico_submissoes').update({ estado }).eq('id', s.id)
    setOcupado(null); load()
  }

  const visiveis = filtro === 'todas' ? lista : lista.filter(s => s.estado === filtro)
  const conta = (e) => lista.filter(s => s.estado === e).length

  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px' }
  const btn = { padding: '7px 13px', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: 'none', whiteSpace: 'nowrap' }

  if (loading) return <EsqueletoPagina cartoes={3} />

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody, maxWidth: '1020px' }}>
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accentText }}>{L.eyebrow}</div>
        <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '27px' : '34px', lineHeight: 1.05, letterSpacing: '-.5px', color: t.heading }}>{L.titulo}</h1>
        <p style={{ fontSize: '12.5px', color: t.textMuted, margin: '8px 0 0', maxWidth: '620px', lineHeight: 1.5 }}>{L.subtitulo}</p>
        <div style={{ fontSize: '11.5px', color: t.subtle, marginTop: '8px' }}>
          {L.ligacao}: <code style={{ color: t.accentText, fontWeight: 700 }}>{window.location.origin}/diagnostico</code>
        </div>
      </div>

      {erro && <div style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '10px', padding: '11px 15px', fontSize: '12.5px', fontWeight: 600, marginBottom: '14px' }}>{erro}</div>}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginBottom: '14px' }}>
        {[['novo', conta('novo')], ['no_crm', conta('no_crm')], ['descartado', conta('descartado')], ['todas', lista.length]].map(([k, n]) => (
          <button key={k} onClick={() => setFiltro(k)} style={{
            padding: '7px 14px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
            border: `1px solid ${filtro === k ? t.accent : t.cardBorder}`,
            background: filtro === k ? t.softCardBg : 'transparent', color: filtro === k ? t.accentText : t.textMuted,
          }}>{L[k]} ({n})</button>
        ))}
      </div>

      {!visiveis.length && <div style={{ ...card, padding: '30px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>{L.vazio}</div>}

      {visiveis.map(s => {
        const tom = s.qualificado ? t.dueOk : { bg: t.chipBg, ink: t.chipText }
        const aberto = aberta === s.id
        return (
          <div key={s.id} style={{ ...card, padding: '15px 18px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: t.heading }}>{s.nome}</span>
                  {s.empresa && <span style={{ fontSize: '12.5px', color: t.textMuted }}>{s.empresa}</span>}
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 700, background: tom.bg, color: tom.ink, whiteSpace: 'nowrap' }}>
                    {s.qualificado ? L.qualificado : L.abaixo}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: t.textMuted, marginTop: '4px' }}>
                  {[s.email, s.telefone].filter(Boolean).join(' · ')}
                  {' · '}{new Date(s.created_at).toLocaleDateString(localeDe(lang))}
                </div>
                <div style={{ fontSize: '11.5px', color: t.subtle, marginTop: '5px', lineHeight: 1.45 }}>{s.motivo}</div>
              </div>

              <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={() => setAberta(aberto ? null : s.id)}
                  style={{ ...btn, background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.textMuted }}>
                  {L.respostas} {aberto ? '▴' : '▾'}
                </button>
                {s.estado === 'no_crm' ? (
                  <button onClick={() => navigate('/gestao/crm')} style={{ ...btn, background: t.dueOk.bg, color: t.dueOk.ink }}>{L.verCrm}</button>
                ) : (
                  <>
                    <button onClick={() => juntarAoCrm(s)} disabled={ocupado === s.id}
                      style={{ ...btn, background: t.btnBg, color: t.btnInk, opacity: ocupado === s.id ? .6 : 1 }}>
                      {ocupado === s.id ? '…' : L.addCrm}
                    </button>
                    {s.estado === 'descartado'
                      ? <button onClick={() => mudarEstado(s, 'novo')} style={{ ...btn, background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.textMuted }}>{L.repor}</button>
                      : <button onClick={() => mudarEstado(s, 'descartado')} style={{ ...btn, background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.textMuted }}>{L.descartar}</button>}
                  </>
                )}
              </div>
            </div>

            {aberto && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${t.cardBorder}`, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '8px' }}>
                {['pais', 'iniciou', 'regime', 'iva', 'faturacao', 'contabilista', 'dificuldade'].map(k => {
                  const v = s.respostas?.[k]
                  const texto = k === 'dificuldade' && v === 'outra'
                    ? (s.respostas?.dificuldade_outra || L.semResposta)
                    : (opcaoDe(k, v, lang) || L.semResposta)
                  return (
                    <div key={k} style={{ fontSize: '12px' }}>
                      <span style={{ color: t.subtle }}>{k}: </span>
                      <span style={{ color: v ? t.heading : t.subtle, fontWeight: v ? 600 : 400 }}>{texto}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
