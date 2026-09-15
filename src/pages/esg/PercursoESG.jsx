import { useState, useEffect, useCallback } from 'react'
import EsqueletoPagina from '../../components/EsqueletoPagina'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { useEffectiveUserId } from '../../context/ViewAsContext'
import { FASES, rotuloFase, subFase, progressoESG } from '../../lib/esgPercurso'

// Percurso ESG — a vista que faltava para a consultoria ESG se ler como
// consultoria e não como cinco ecrãs soltos (reunião de 10/09).
//
// Mostra as cinco fases, em que ponto está cada uma e qual é o passo seguinte.
// Tudo é calculado a partir do que os módulos já gravam: esta página não guarda
// estado nenhum, por isso nunca fica dessincronizada do trabalho real.

export default function PercursoESG() {
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const eid = useEffectiveUserId()

  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ano] = useState(new Date().getFullYear())

  const L = lang === 'de' ? {
    eyebrow: 'ESG-Beratung', titulo: 'Der Weg',
    subtitulo: 'Fünf Phasen, von dem was zählt bis zum Bericht. Der Stand kommt aus den Modulen selbst.',
    geral: 'Gesamtfortschritt', proximo: 'Nächster Schritt', abrir: 'Öffnen →', continuar: 'Weitermachen →',
    pronto: 'Fertig', curso: 'Läuft', vazio: 'Noch nichts', espera: 'Wartet auf die Wesentlichkeit',
    temas: (n) => `${n} wesentliche Themen`, semTemas: 'noch keine wesentlichen Themen',
    projetosDe: (a, b) => `${a} von ${b} wesentlichen Themen mit Projekt`,
    tudoPronto: 'Alle Phasen abgeschlossen — der Bericht kann übergeben werden.',
    ano: 'Berichtsjahr',
  } : lang === 'en' ? {
    eyebrow: 'ESG consulting', titulo: 'The journey',
    subtitulo: 'Five phases, from what matters to the report. The status comes from the modules themselves.',
    geral: 'Overall progress', proximo: 'Next step', abrir: 'Open →', continuar: 'Continue →',
    pronto: 'Done', curso: 'In progress', vazio: 'Not started', espera: 'Waiting on materiality',
    temas: (n) => `${n} material topics`, semTemas: 'no material topics yet',
    projetosDe: (a, b) => `${a} of ${b} material topics with a project`,
    tudoPronto: 'Every phase is complete — the report is ready to hand over.',
    ano: 'Reference year',
  } : {
    eyebrow: 'Consultoria ESG', titulo: 'O percurso',
    subtitulo: 'Cinco fases, do que importa até ao relatório. O estado vem dos próprios módulos.',
    geral: 'Progresso geral', proximo: 'Próximo passo', abrir: 'Abrir →', continuar: 'Continuar →',
    pronto: 'Pronto', curso: 'Em curso', vazio: 'Por começar', espera: 'À espera da materialidade',
    temas: (n) => `${n} temas materiais`, semTemas: 'ainda sem temas materiais',
    projetosDe: (a, b) => `${a} de ${b} temas materiais com projeto`,
    tudoPronto: 'Todas as fases estão fechadas — o relatório está pronto para entregar.',
    ano: 'Ano de referência',
  }

  const load = useCallback(async () => {
    if (!eid) return
    setLoading(true)
    const [mat, diag, proj, rep] = await Promise.all([
      supabase.from('esg_materiality').select('*').eq('user_id', eid).maybeSingle(),
      supabase.from('esg_diagnostics').select('*').eq('user_id', eid).eq('reference_year', ano).maybeSingle(),
      supabase.from('esg_projects').select('id,topic_key,status').eq('user_id', eid),
      supabase.from('esg_reports').select('*').eq('user_id', eid).eq('reference_year', ano).maybeSingle(),
    ])
    setDados({
      materiality: mat.data, diagnostic: diag.data,
      projects: proj.data || [], report: rep.data,
    })
    setLoading(false)
  }, [eid, ano])
  useEffect(() => { load() }, [load])

  if (loading) return <EsqueletoPagina cartoes={3} linhas={5} />

  const p = progressoESG(dados || {})
  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px' }
  const tom = {
    pronto: t.dueOk,
    curso: { bg: t.chipBg, ink: t.chipText },
    vazio: { bg: t.segBg, ink: t.textMuted },
    espera: { bg: t.segBg, ink: t.subtle },
  }
  const faseProxima = FASES.find(f => f.key === p.proxima)

  return (
    <div style={{ width: '100%', maxWidth: '900px', fontFamily: t.fontBody }}>
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accentText }}>{L.eyebrow}</div>
        <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '27px' : '34px', lineHeight: 1.05, letterSpacing: '-.5px', color: t.heading }}>{L.titulo}</h1>
        <p style={{ fontSize: '12.5px', color: t.textMuted, margin: '8px 0 0', maxWidth: '600px', lineHeight: 1.5 }}>{L.subtitulo}</p>
      </div>

      {/* Progresso geral + o que fazer a seguir */}
      <div style={{ ...card, padding: '18px 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px' }}>{L.geral}</div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: t.heading, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1, marginTop: '2px' }}>{p.pctGeral}%</div>
          </div>
          <div style={{ flex: 'none', fontSize: '11.5px', color: t.subtle }}>{L.ano}: <strong style={{ color: t.textMuted }}>{ano}</strong></div>
        </div>
        <div style={{ height: '7px', borderRadius: '20px', background: t.trackBg, overflow: 'hidden' }}>
          <div style={{ width: `${p.pctGeral}%`, height: '100%', background: t.accent, transition: 'width .3s' }} />
        </div>

        {faseProxima ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '14px', paddingTop: '13px', borderTop: `1px solid ${t.cardBorder}` }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: t.accentText, textTransform: 'uppercase', letterSpacing: '.5px' }}>{L.proximo}</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: t.heading, marginTop: '2px' }}>
                {faseProxima.n} · {rotuloFase(faseProxima, lang)}
              </div>
              <div style={{ fontSize: '12px', color: t.textMuted, marginTop: '2px' }}>{subFase(faseProxima, lang)}</div>
            </div>
            <button onClick={() => navigate(faseProxima.rota)}
              style={{ flex: 'none', padding: '11px 20px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{L.continuar}</button>
          </div>
        ) : (
          <div style={{ marginTop: '14px', paddingTop: '13px', borderTop: `1px solid ${t.cardBorder}`, fontSize: '13px', fontWeight: 700, color: t.dueOk.ink }}>{L.tudoPronto}</div>
        )}
      </div>

      {/* As cinco fases */}
      {FASES.map(f => {
        const e = p[f.key]
        const cor = tom[e.estado] || tom.vazio
        const rotuloEstado = L[e.estado] || ''
        const detalhe = f.key === 'materialidade'
          ? (e.materiais ? L.temas(e.materiais) : L.semTemas)
          : f.key === 'projetos' && e.estado !== 'espera'
            ? L.projetosDe(e.feitas, e.total)
            : null
        return (
          <div key={f.key} style={{ ...card, padding: '15px 18px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ flex: 'none', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12.5px', fontWeight: 800, background: e.estado === 'pronto' ? t.dueOk.bg : t.trackBg, color: e.estado === 'pronto' ? t.dueOk.ink : t.textMuted }}>
              {e.estado === 'pronto' ? '✓' : f.n}
            </span>

            <div style={{ flex: 1, minWidth: '190px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14.5px', fontWeight: 800, color: t.heading }}>{rotuloFase(f, lang)}</span>
                <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 700, background: cor.bg, color: cor.ink, whiteSpace: 'nowrap' }}>{rotuloEstado}</span>
              </div>
              <div style={{ fontSize: '12px', color: t.textMuted, marginTop: '2px' }}>{subFase(f, lang)}</div>
              {detalhe && <div style={{ fontSize: '11.5px', color: t.subtle, marginTop: '3px' }}>{detalhe}</div>}
            </div>

            {e.estado !== 'espera' && (
              <div style={{ flex: 'none', width: isMobile ? '100%' : '150px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: t.subtle, marginBottom: '4px', fontVariantNumeric: 'tabular-nums' }}>
                  <span>{e.feitas}/{e.total}</span><span>{e.pct}%</span>
                </div>
                <div style={{ height: '5px', borderRadius: '20px', background: t.trackBg, overflow: 'hidden' }}>
                  <div style={{ width: `${e.pct}%`, height: '100%', background: e.estado === 'pronto' ? t.dueOk.ink : t.accent }} />
                </div>
              </div>
            )}

            <button onClick={() => navigate(f.rota)}
              style={{ flex: 'none', minHeight: '34px', padding: '0 14px', background: 'transparent', border: `1px solid ${t.cardBorder}`, borderRadius: '9px', fontSize: '12px', fontWeight: 700, color: t.accentText, cursor: 'pointer', whiteSpace: 'nowrap' }}>{L.abrir}</button>
          </div>
        )
      })}
    </div>
  )
}
