import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { localeDe } from '../../lib/formato'
import { FASES, rotuloFase, subFase, progressoESG } from '../../lib/esgPercurso'
import { computeKpis } from '../../lib/esgKpis'
import { ESG_TOPICS, TOPIC_PILLAR_META, topicLabel, isMaterial } from '../../data/esgTopics'

// Modo apresentação de um caso ESG (reunião de 18/09: "visualização do ESG por
// cliente, pronta para apresentar"). É o que a Lúcia mostra ao cliente numa
// reunião ou partilha no ecrã: sem campos, sem menus, letra grande, e imprime
// limpo em PDF. Vive fora da casca da plataforma, numa página própria.
//
// Só entram as secções que têm conteúdo (reunião de 25/09: nada de secções
// vazias). Tudo é lido do caso — esta página não grava nada.

export default function ApresentacaoESG() {
  const { id } = useParams()
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const loc = localeDe(lang)

  const [d, setD] = useState(null)
  const [ano, setAno] = useState(null)
  const [erro, setErro] = useState(false)

  const L = lang === 'de' ? {
    eyebrow: 'ESG-Beratung · Verlaufsbericht', carregar: 'Wird geladen…', naoEncontrado: 'ESG-Beratung nicht gefunden.',
    imprimir: 'Drucken / PDF', fechar: 'Schließen', anoRef: 'Bezugsjahr',
    percurso: 'Der Weg', geral: 'Gesamtfortschritt', pronto: 'Fertig', curso: 'Läuft', vazio: 'Noch nicht begonnen', espera: 'Wartet',
    importa: 'Was für das Unternehmen zählt', importaSub: 'Doppelte Wesentlichkeit: Bedeutung für das Unternehmen und für die Stakeholder. Oben rechts liegt, woran gearbeitet wird.',
    eixoX: 'Bedeutung für das Unternehmen →', eixoY: 'Bedeutung für die Stakeholder →', meta: 'Ziel', payback: 'Payback', anos: 'Jahre',
    numeros: 'Die Zahlen', numerosSub: (a, b) => b ? `${a} im Vergleich zu ${b}` : `Bezugsjahr ${a}`,
    co2: 'CO₂-Emissionen', renov: 'Erneuerbarer Strom', colab: 'Mitarbeitende', gov: 'Governance-Reife', mulheres: 'Frauenanteil',
    plano: 'Der Plan', planoSub: 'Projekte aus den wesentlichen Themen — mit Kosten und Nutzen.',
    invest: 'Investition', poupanca: 'Einsparung/Jahr', estados: { planned: 'Geplant', active: 'Laufend', done: 'Abgeschlossen' },
    proximo: 'Nächster Schritt', tudoPronto: 'Alle Phasen abgeschlossen.', vs: 'ggü.',
  } : lang === 'en' ? {
    eyebrow: 'ESG consulting · Progress report', carregar: 'Loading…', naoEncontrado: 'ESG consultancy not found.',
    imprimir: 'Print / PDF', fechar: 'Close', anoRef: 'Reference year',
    percurso: 'The journey', geral: 'Overall progress', pronto: 'Done', curso: 'In progress', vazio: 'Not started', espera: 'Waiting',
    importa: 'What matters to this business', importaSub: 'Double materiality: importance for the business and for its stakeholders. The top-right corner is where the work happens.',
    eixoX: 'Importance for the business →', eixoY: 'Importance for stakeholders →', meta: 'Target', payback: 'Payback', anos: 'years',
    numeros: 'The numbers', numerosSub: (a, b) => b ? `${a} compared with ${b}` : `Reference year ${a}`,
    co2: 'CO₂ emissions', renov: 'Renewable electricity', colab: 'Employees', gov: 'Governance maturity', mulheres: 'Share of women',
    plano: 'The plan', planoSub: 'Projects born from the material topics — with their cost and benefit.',
    invest: 'Investment', poupanca: 'Saving/year', estados: { planned: 'Planned', active: 'In progress', done: 'Done' },
    proximo: 'Next step', tudoPronto: 'Every phase is complete.', vs: 'vs',
  } : {
    eyebrow: 'Consultoria ESG · Relatório de acompanhamento', carregar: 'A carregar…', naoEncontrado: 'Consultoria ESG não encontrada.',
    imprimir: 'Imprimir / PDF', fechar: 'Fechar', anoRef: 'Ano de referência',
    percurso: 'O percurso', geral: 'Progresso geral', pronto: 'Pronto', curso: 'Em curso', vazio: 'Por começar', espera: 'À espera',
    importa: 'O que importa a este negócio', importaSub: 'Dupla materialidade: importância para a empresa e para quem se relaciona com ela. O canto superior direito é onde se trabalha.',
    eixoX: 'Importância para a empresa →', eixoY: 'Importância para os stakeholders →', meta: 'Meta', payback: 'Payback', anos: 'anos',
    numeros: 'Os números', numerosSub: (a, b) => b ? `${a} comparado com ${b}` : `Ano de referência ${a}`,
    co2: 'Emissões de CO₂', renov: 'Eletricidade renovável', colab: 'Colaboradores', gov: 'Maturidade de governança', mulheres: 'Percentagem de mulheres',
    plano: 'O plano', planoSub: 'Projetos que nascem dos temas materiais — com o custo e o benefício.',
    invest: 'Investimento', poupanca: 'Poupança/ano', estados: { planned: 'Planeado', active: 'Em curso', done: 'Concluído' },
    proximo: 'Próximo passo', tudoPronto: 'Todas as fases estão fechadas.', vs: 'vs',
  }

  const carregar = useCallback(async () => {
    const [caso, mat, diag, proj, rep] = await Promise.all([
      supabase.from('esg_consultorias').select('*').eq('id', id).maybeSingle(),
      supabase.from('esg_materiality').select('topics,threshold').eq('consultoria_id', id).maybeSingle(),
      supabase.from('esg_diagnostics').select('reference_year,answers').eq('consultoria_id', id).order('reference_year', { ascending: false }),
      supabase.from('esg_projects').select('*').eq('consultoria_id', id).order('created_at', { ascending: true }),
      supabase.from('esg_reports').select('reference_year,sections').eq('consultoria_id', id),
    ])
    if (!caso.data) { setErro(true); return }
    const porAno = {}
    ;(diag.data || []).forEach(r => { if (r.answers && Object.keys(r.answers).length) porAno[r.reference_year] = r.answers })
    const anos = Object.keys(porAno).map(Number).sort((a, b) => b - a)
    setAno(a => a ?? (anos[0] || new Date().getFullYear()))
    setD({ caso: caso.data, materiality: mat.data, porAno, anos, projects: proj.data || [], reports: rep.data || [] })
  }, [id])
  useEffect(() => { carregar() }, [carregar])

  const pagina = { minHeight: '100vh', background: t.appBg, color: t.text, fontFamily: t.fontBody }
  if (erro) return <div style={{ ...pagina, padding: '60px 24px', textAlign: 'center' }}>{L.naoEncontrado}</div>
  if (!d || ano == null) return <div style={{ ...pagina, padding: '60px 24px', textAlign: 'center', color: t.subtle }}>{L.carregar}</div>

  const { caso, materiality, porAno, anos, projects } = d
  const anoPrev = anos.find(a => a < ano) || null
  const k = porAno[ano] ? computeKpis(porAno[ano]) : null
  const kPrev = anoPrev ? computeKpis(porAno[anoPrev]) : null
  const rep = d.reports.find(r => r.reference_year === ano)
  const prog = progressoESG({ materiality, diagnostic: porAno[ano] ? { answers: porAno[ano] } : null, projects, report: rep })
  const limiar = Number(materiality?.threshold) || 3.5
  const topics = materiality?.topics || {}
  const pontuados = ESG_TOPICS.filter(tp => topics[tp.key]?.applicable && topics[tp.key]?.stakeholder && topics[tp.key]?.company)
  const materiais = ESG_TOPICS.filter(tp => isMaterial(topics[tp.key], limiar))
    .sort((a, b) => (Number(topics[b.key].stakeholder) + Number(topics[b.key].company)) - (Number(topics[a.key].stakeholder) + Number(topics[a.key].company)))
  const fmt = (v, dec = 0) => v == null ? '—' : Number(v).toLocaleString(loc, { minimumFractionDigits: dec, maximumFractionDigits: dec })
  const eur = (v) => v == null ? '—' : `€ ${fmt(v)}`
  const payback = (inv, sav) => Number(inv) > 0 && Number(sav) > 0 ? Number(inv) / Number(sav) : null

  // A maturidade de governança dá 0 sem respostas — só conta com respostas do pilar G.
  const gov = (kk) => kk && kk.completeness.G.done ? kk.gov.maturityPct : null
  const kpis = k ? [
    { rot: L.co2, v: k.env.co2Total, p: kPrev?.env.co2Total, un: 't', dec: 1, menosMelhor: true, cor: TOPIC_PILLAR_META.E.color },
    { rot: L.renov, v: k.env.elecRenewPct, p: kPrev?.env.elecRenewPct, un: '%', cor: TOPIC_PILLAR_META.E.color },
    { rot: L.colab, v: k.social.employees, p: kPrev?.social.employees, un: '', cor: TOPIC_PILLAR_META.S.color },
    { rot: L.mulheres, v: k.social.womenAll, p: kPrev?.social.womenAll, un: '%', cor: TOPIC_PILLAR_META.S.color },
    { rot: L.gov, v: gov(k), p: gov(kPrev), un: '%', cor: TOPIC_PILLAR_META.G.color },
  ].filter(x => x.v != null) : []

  const tomFase = { pronto: t.dueOk, curso: { bg: t.chipBg, ink: t.chipText }, vazio: { bg: t.segBg, ink: t.textMuted }, espera: { bg: t.segBg, ink: t.subtle } }
  const faseProx = FASES.find(f => f.key === prog.proxima)

  const secao = (titulo, sub, conteudo) => (
    <section className="apres-secao" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: '18px', padding: isMobile ? '22px 18px' : '30px 34px', marginBottom: '22px' }}>
      <h2 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '26px' : '32px', color: t.heading, lineHeight: 1.1 }}>{titulo}</h2>
      {sub && <p style={{ margin: '6px 0 0', fontSize: '15px', color: t.textMuted, maxWidth: '720px', lineHeight: 1.5 }}>{sub}</p>}
      <div style={{ marginTop: '22px' }}>{conteudo}</div>
    </section>
  )

  // Matriz de dupla materialidade, grande para ler num ecrã partilhado.
  const S = isMobile ? 320 : 460, M = 46, plot = S - M - 16
  const px = (v) => M + ((v - 1) / 4) * plot, py = (v) => (S - M) - ((v - 1) / 4) * plot
  const vistos = {}
  const pontos = pontuados.map(tp => {
    const e = topics[tp.key]; const chave = `${e.company}-${e.stakeholder}`
    const n = (vistos[chave] = (vistos[chave] || 0) + 1) - 1; const ang = n * 2.4, off = n === 0 ? 0 : 11 + Math.floor(n / 6) * 9
    return { tp, e, x: px(Number(e.company)) + Math.cos(ang) * off, y: py(Number(e.stakeholder)) + Math.sin(ang) * off, mat: isMaterial(e, limiar) }
  })

  return (
    <div style={pagina}>
      <style>{`
        @media print {
          .nao-imprimir { display: none !important; }
          body { background: #fff !important; }
          .apres-secao { break-inside: avoid; page-break-inside: avoid; box-shadow: none !important; }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>

      {/* Barra de ações — não aparece na impressão */}
      <div className="nao-imprimir" style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', padding: '10px 20px', background: t.sidebarBg, color: '#e9dfc4' }}>
        <span style={{ fontSize: '12.5px', fontWeight: 700 }}>{caso.empresa || caso.nome}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {anos.length > 1 && (
            <select value={ano} onChange={e => setAno(Number(e.target.value))} aria-label={L.anoRef}
              style={{ padding: '6px 9px', borderRadius: '8px', border: '1px solid rgba(201,168,76,.4)', background: 'transparent', color: '#e9dfc4', fontSize: '12.5px', fontWeight: 700 }}>
              {anos.map(a => <option key={a} value={a} style={{ color: '#000' }}>{L.anoRef} {a}</option>)}
            </select>
          )}
          <button onClick={() => window.print()} style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: '#c9a84c', color: '#0a2f1a', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer' }}>{L.imprimir}</button>
          <button onClick={() => window.close()} style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid rgba(201,168,76,.4)', background: 'transparent', color: '#e9dfc4', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer' }}>{L.fechar}</button>
        </span>
      </div>

      <main style={{ padding: isMobile ? '26px 14px 60px' : '46px 34px 80px' }}>
        {/* Capa */}
        <header style={{ marginBottom: '30px' }}>
          <div style={{ fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 700, color: t.accentText }}>{L.eyebrow}</div>
          <h1 style={{ margin: '10px 0 0', fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '38px' : '58px', lineHeight: 1, color: t.heading }}>{caso.empresa || caso.nome}</h1>
          <div style={{ marginTop: '12px', fontSize: '16px', color: t.textMuted }}>
            {[caso.setor, `${L.anoRef} ${ano}`, new Date().toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' })].filter(Boolean).join(' · ')}
          </div>
        </header>

        {/* O percurso — está sempre, é o fio da consultoria */}
        {secao(L.percurso, null, (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px', marginBottom: '10px' }}>
              <span style={{ fontFamily: t.fontDisplay, fontSize: isMobile ? '48px' : '64px', fontWeight: 600, color: t.heading, lineHeight: 1 }}>{prog.pctGeral}%</span>
              <span style={{ fontSize: '15px', color: t.textMuted }}>{L.geral}</span>
            </div>
            <div style={{ height: '10px', borderRadius: '20px', background: t.trackBg, overflow: 'hidden', marginBottom: '22px' }}>
              <div style={{ width: `${prog.pctGeral}%`, height: '100%', background: t.accent }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, minmax(0, 1fr))', gap: '12px' }}>
              {FASES.map(f => {
                const e = prog[f.key]; const tom = tomFase[e.estado] || tomFase.vazio
                return (
                  <div key={f.key} style={{ borderRadius: '14px', padding: '16px', background: e.estado === 'pronto' ? t.dueOk.bg : t.softCardBg, border: `1px solid ${f.key === prog.proxima ? t.accent : t.cardBorder}` }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: t.accentText }}>{f.n}</div>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: t.heading, marginTop: '2px' }}>{rotuloFase(f, lang)}</div>
                    <div style={{ fontSize: '12.5px', color: t.textMuted, marginTop: '3px', minHeight: '34px' }}>{subFase(f, lang)}</div>
                    <div style={{ height: '6px', borderRadius: '20px', background: t.trackBg, overflow: 'hidden', margin: '10px 0 8px' }}>
                      <div style={{ width: `${e.pct}%`, height: '100%', background: e.estado === 'pronto' ? t.dueOk.ink : t.accent }} />
                    </div>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '2px 9px', borderRadius: '20px', background: tom.bg, color: tom.ink }}>{L[e.estado]}</span>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${t.cardBorder}`, fontSize: '16px' }}>
              {faseProx
                ? <><span style={{ color: t.accentText, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px' }}>{L.proximo}</span><div style={{ fontSize: '20px', fontWeight: 800, color: t.heading, marginTop: '3px' }}>{faseProx.n} · {rotuloFase(faseProx, lang)} <span style={{ fontWeight: 500, color: t.textMuted, fontSize: '16px' }}>— {subFase(faseProx, lang)}</span></div></>
                : <span style={{ fontWeight: 800, color: t.dueOk.ink }}>{L.tudoPronto}</span>}
            </div>
          </>
        ))}

        {/* O que importa — matriz e temas materiais */}
        {pontuados.length > 0 && secao(L.importa, L.importaSub, (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : `${S}px 1fr`, gap: '28px', alignItems: 'start' }}>
            <svg viewBox={`0 0 ${S} ${S + 18}`} style={{ width: '100%', maxWidth: `${S}px` }} role="img" aria-label={L.importa}>
              <rect x={px(limiar)} y={16} width={(S - 16) - px(limiar)} height={py(limiar) - 16} fill={t.accent} opacity="0.14" />
              {[1, 2, 3, 4, 5].map(v => (
                <g key={v}>
                  <line x1={px(v)} y1={16} x2={px(v)} y2={S - M} stroke={t.rowBorder} />
                  <line x1={M} y1={py(v)} x2={S - 16} y2={py(v)} stroke={t.rowBorder} />
                  <text x={px(v)} y={S - M + 16} textAnchor="middle" fontSize="11" fill={t.subtle}>{v}</text>
                  <text x={M - 9} y={py(v) + 4} textAnchor="end" fontSize="11" fill={t.subtle}>{v}</text>
                </g>
              ))}
              <line x1={px(limiar)} y1={16} x2={px(limiar)} y2={S - M} stroke={t.accent} strokeWidth="1.6" strokeDasharray="6 4" />
              <line x1={M} y1={py(limiar)} x2={S - 16} y2={py(limiar)} stroke={t.accent} strokeWidth="1.6" strokeDasharray="6 4" />
              <text x={(M + S - 16) / 2} y={S + 12} textAnchor="middle" fontSize="12" fontWeight="600" fill={t.textMuted}>{L.eixoX}</text>
              <text x={13} y={(S - M + 16) / 2} textAnchor="middle" fontSize="12" fontWeight="600" fill={t.textMuted} transform={`rotate(-90 13 ${(S - M + 16) / 2})`}>{L.eixoY}</text>
              {pontos.map(({ tp, x, y, mat }) => (
                <g key={tp.key}>
                  <title>{topicLabel(tp, lang)}</title>
                  <circle cx={x} cy={y} r={mat ? 13 : 10} fill={TOPIC_PILLAR_META[tp.pillar].color} opacity={mat ? 1 : 0.6} stroke={mat ? t.accent : 'none'} strokeWidth="2.5" />
                  <text x={x} y={y + 3.5} textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff">{tp.abbr}</text>
                </g>
              ))}
            </svg>
            <div>
              {materiais.map(tp => {
                const e = topics[tp.key]; const meta = TOPIC_PILLAR_META[tp.pillar]
                const pb = payback(e.financial?.investment, e.financial?.saving)
                return (
                  <div key={tp.key} style={{ display: 'flex', gap: '12px', padding: '13px 0', borderBottom: `1px solid ${t.rowBorder}` }}>
                    <span style={{ flex: 'none', width: '30px', height: '30px', borderRadius: '8px', background: meta.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10.5px', fontWeight: 800 }}>{tp.abbr}</span>
                    <div>
                      <div style={{ fontSize: '17px', fontWeight: 800, color: t.heading }}>{topicLabel(tp, lang)}</div>
                      {(e.goal?.target || pb != null) && (
                        <div style={{ fontSize: '14px', color: t.textMuted, marginTop: '3px' }}>
                          {e.goal?.target && <span>🎯 {L.meta}: <strong style={{ color: t.heading }}>{e.goal.baseline ? `${e.goal.baseline} → ` : ''}{e.goal.target}</strong>{e.goal.deadline ? ` · ${e.goal.deadline}` : ''}</span>}
                          {e.goal?.target && pb != null && ' · '}
                          {pb != null && <span>💶 {L.payback}: <strong style={{ color: t.dueOk.ink }}>{fmt(pb, 1)} {L.anos}</strong></span>}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Os números — só os indicadores com valor */}
        {kpis.length > 0 && secao(L.numeros, L.numerosSub(ano, anoPrev), (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : `repeat(${Math.min(kpis.length, 5)}, minmax(0, 1fr))`, gap: '14px' }}>
            {kpis.map(x => {
              const dlt = x.p != null && x.v != null ? x.v - x.p : null
              const bom = dlt == null ? null : x.menosMelhor ? dlt < 0 : dlt > 0
              return (
                <div key={x.rot} style={{ borderRadius: '14px', padding: '18px', background: t.softCardBg, borderTop: `4px solid ${x.cor}` }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: t.textMuted }}>{x.rot}</div>
                  <div style={{ fontFamily: t.fontDisplay, fontSize: isMobile ? '32px' : '40px', fontWeight: 600, color: t.heading, lineHeight: 1.1, marginTop: '4px' }}>{fmt(x.v, x.dec || 0)}<span style={{ fontSize: '18px', color: t.textMuted }}> {x.un}</span></div>
                  {dlt != null && dlt !== 0 && <div style={{ fontSize: '13px', fontWeight: 800, color: bom ? t.dueOk.ink : t.neg, marginTop: '4px' }}>{dlt > 0 ? '▲' : '▼'} {fmt(Math.abs(dlt), x.dec || 0)} {L.vs} {anoPrev}</div>}
                </div>
              )
            })}
          </div>
        ))}

        {/* O plano — projetos */}
        {projects.length > 0 && secao(L.plano, L.planoSub, (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
            {projects.map(p => {
              const tp = ESG_TOPICS.find(x => x.key === p.topic_key); const meta = tp ? TOPIC_PILLAR_META[tp.pillar] : null
              const pb = payback(p.investment, p.annual_saving)
              return (
                <div key={p.id} style={{ borderRadius: '14px', padding: '18px', background: t.softCardBg, borderLeft: `4px solid ${meta?.color || t.accent}` }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: t.heading }}>{p.name}</div>
                  <div style={{ fontSize: '13px', color: t.textMuted, marginTop: '3px' }}>{[tp && topicLabel(tp, lang), L.estados[p.status]].filter(Boolean).join(' · ')}</div>
                  {p.expected_impact && <div style={{ fontSize: '14.5px', color: t.text, marginTop: '8px' }}>🎯 {p.expected_impact}</div>}
                  {(p.investment != null || p.annual_saving != null) && (
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '10px', fontSize: '14px' }}>
                      {p.investment != null && <span style={{ color: t.textMuted }}>{L.invest}: <strong style={{ color: t.heading }}>{eur(p.investment)}</strong></span>}
                      {p.annual_saving != null && <span style={{ color: t.textMuted }}>{L.poupanca}: <strong style={{ color: t.dueOk.ink }}>{eur(p.annual_saving)}</strong></span>}
                      {pb != null && <span style={{ color: t.dueOk.ink, fontWeight: 800 }}>{L.payback}: {fmt(pb, 1)} {L.anos}</span>}
                    </div>
                  )}
                  <div style={{ height: '7px', borderRadius: '20px', background: t.trackBg, overflow: 'hidden', marginTop: '12px' }}>
                    <div style={{ width: `${p.progress || 0}%`, height: '100%', background: meta?.color || t.accent }} />
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        <footer style={{ textAlign: 'center', fontSize: '12px', color: t.subtle, marginTop: '30px' }}>Lúcia Cílio · Office Consulting</footer>
      </main>
    </div>
  )
}
