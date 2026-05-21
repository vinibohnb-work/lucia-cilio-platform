import { useLang } from '../../context/LangContext'
import { t } from '../../i18n/translations'

const G = '#0d3b20'
const GOLD = '#c9a84c'
const BG = '#f2f6f3'

const STATUS_STYLE = {
  active: { bg: '#d1fae5', color: '#065f46', key: 'proj_status_active' },
  review: { bg: '#fef3c7', color: '#92400e', key: 'proj_status_review' },
  done:   { bg: '#e8f5ec', color: G,         key: 'proj_status_done'   },
}

export default function ProjetosESG() {
  const { lang } = useLang()

  const projects = [
    { id: 1, nameKey: 'proj_p1_name', clientKey: 'proj_p1_client', phaseKey: 'proj_p1_phase', country: '🇵🇹', status: 'active', started: '2026-02-10', score: 42, progress: 25 },
    { id: 2, nameKey: 'proj_p2_name', clientKey: 'proj_p2_client', phaseKey: 'proj_p2_phase', country: '🇩🇪', status: 'review', started: '2026-01-15', score: 71, progress: 50 },
    { id: 3, nameKey: 'proj_p3_name', clientKey: 'proj_p3_client', phaseKey: 'proj_p3_phase', country: '🇵🇹', status: 'active', started: '2026-03-01', score: 28, progress: 50 },
    { id: 4, nameKey: 'proj_p4_name', clientKey: 'proj_p4_client', phaseKey: 'proj_p4_phase', country: '🇩🇪', status: 'active', started: '2025-11-20', score: 85, progress: 75 },
  ]

  const phaseList = lang === 'de'
    ? ['Diagnose', 'Wesentlichkeit', 'KPIs', 'Bericht']
    : ['Diagnóstico', 'Materialidade', 'KPIs', 'Relatório']

  return (
    <div style={{ maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', color: '#64748b' }}>
          {projects.length} {lang === 'de' ? 'Projekte insgesamt' : 'projetos no total'}
        </div>
        <button style={{ padding: '9px 18px', background: G, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
          {t(lang, 'proj_new')}
        </button>
      </div>

      {/* Project Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {projects.map(p => {
          const st = STATUS_STYLE[p.status]
          return (
            <div key={p.id} style={{ background: '#fff', borderRadius: '14px', padding: '22px 26px', border: '1px solid #dde8de', boxShadow: '0 2px 8px rgba(0,0,0,.04)', display: 'flex', alignItems: 'center', gap: '20px' }}>

              {/* Number badge */}
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: BG, border: '1px solid #dde8de', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 900, color: G, flexShrink: 0 }}>
                {String(p.id).padStart(2, '0')}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: G }}>{t(lang, p.nameKey)}</span>
                  <span style={{ fontSize: '20px' }}>{p.country}</span>
                  <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 800, background: st.bg, color: st.color }}>
                    {t(lang, st.key)}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 600, color: '#4a6355' }}>{t(lang, 'proj_client')}:</span> {t(lang, p.clientKey)}
                  &ensp;·&ensp;
                  <span style={{ fontWeight: 600, color: '#4a6355' }}>{t(lang, 'proj_phase')}:</span> {t(lang, p.phaseKey)}
                  &ensp;·&ensp;
                  <span style={{ fontWeight: 600, color: '#4a6355' }}>{t(lang, 'proj_started')}:</span> {p.started}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, height: '5px', background: '#dde8de', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ width: `${p.progress}%`, height: '100%', background: `linear-gradient(90deg,${G},${GOLD})`, borderRadius: '99px' }} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', minWidth: '30px' }}>{p.progress}%</span>
                </div>
              </div>

              {/* ESG Score */}
              <div style={{ flexShrink: 0, textAlign: 'center', padding: '12px 18px', background: BG, borderRadius: '12px', border: '1px solid #dde8de' }}>
                <div style={{ fontSize: '24px', fontWeight: 900, color: p.score >= 70 ? '#065f46' : p.score >= 40 ? G : '#e53e3e' }}>{p.score}</div>
                <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>ESG Score</div>
              </div>

            </div>
          )
        })}
      </div>

      {/* Phase legend */}
      <div style={{ marginTop: '22px', padding: '16px 20px', background: '#fff', borderRadius: '12px', border: '1px solid #dde8de', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>
          {lang === 'de' ? 'Phasen:' : 'Fases:'}
        </span>
        {phaseList.map((ph, i) => (
          <span key={ph} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: i < 2 ? G : GOLD, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: '#4a6355', fontWeight: 500 }}>{ph}</span>
            {i < phaseList.length - 1 && <span style={{ color: '#c8d9c8', margin: '0 3px' }}>→</span>}
          </span>
        ))}
      </div>

    </div>
  )
}
