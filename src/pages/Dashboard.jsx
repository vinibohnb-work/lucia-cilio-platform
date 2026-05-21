import { useLang } from '../context/LangContext'
import { t } from '../i18n/translations'

const G = '#0d3b20'
const GOLD = '#c9a84c'
const BG = '#f2f6f3'

export default function Dashboard() {
  const { lang } = useLang()

  const kpis = [
    { value: 4,  label: t(lang, 'dash_active_projects'), icon: '🌱', valuColor: G,      bg: '#e8f5ec' },
    { value: 47, label: t(lang, 'dash_active_clients'),  icon: '👥', valuColor: GOLD,    bg: '#f5edd6' },
    { value: 2,  label: t(lang, 'dash_pending'),         icon: '⏰', valuColor: '#e53e3e', bg: '#fff5f5' },
  ]

  const activities = [
    { icon: '🌱', text: t(lang, 'dash_act1'), time: `${t(lang, 'dash_today')}, 09:30`,    dot: G },
    { icon: '📋', text: t(lang, 'dash_act2'), time: `${t(lang, 'dash_yesterday')}, 15:00`, dot: GOLD },
    { icon: '👥', text: t(lang, 'dash_act3'), time: t(lang, 'dash_may12'),                dot: '#1a5c32' },
    { icon: '📅', text: t(lang, 'dash_act4'), time: t(lang, 'dash_may10'),                dot: '#64748b' },
  ]

  const deadlines = [
    { date: t(lang, 'dash_dl1_date'), label: t(lang, 'dash_dl1_label'), flag: '🇵🇹', urgent: false },
    { date: t(lang, 'dash_dl2_date'), label: t(lang, 'dash_dl2_label'), flag: '🇵🇹', urgent: true  },
    { date: t(lang, 'dash_dl3_date'), label: t(lang, 'dash_dl3_label'), flag: '🇩🇪', urgent: false },
  ]

  return (
    <div style={{ maxWidth: '1100px' }}>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px', marginBottom: '24px' }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: '14px', padding: '24px 26px', border: '1px solid #dde8de', boxShadow: '0 2px 8px rgba(0,0,0,.04)', display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{k.icon}</div>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 900, color: k.valuColor, lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '5px', fontWeight: 500 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity + Deadlines */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Recent Activity */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', border: '1px solid #dde8de' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: G, margin: '0 0 20px' }}>{t(lang, 'dash_recent')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activities.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: BG, border: '1px solid #dde8de', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>{a.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', color: '#1a2e1a', fontWeight: 500, lineHeight: 1.5 }}>{a.text}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Deadlines */}
        <div style={{ background: '#fff', borderRadius: '14px', padding: '24px', border: '1px solid #dde8de' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: G, margin: '0 0 20px' }}>{t(lang, 'dash_upcoming')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {deadlines.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', background: d.urgent ? '#fff5f5' : BG, border: `1px solid ${d.urgent ? '#feb2b2' : '#dde8de'}` }}>
                <div style={{ fontSize: '13px', fontWeight: 900, color: d.urgent ? '#e53e3e' : G, minWidth: '46px', flexShrink: 0 }}>{d.date}</div>
                <div style={{ flex: 1, fontSize: '12px', color: '#1a2e1a', fontWeight: 500, lineHeight: 1.4 }}>{d.label}</div>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{d.flag}</span>
              </div>
            ))}
          </div>
          {/* Progress bar hint */}
          <div style={{ marginTop: '20px', padding: '14px 16px', background: BG, borderRadius: '10px', border: '1px solid #dde8de' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: G }}>{lang === 'de' ? 'ESG-Fortschritt Q2' : 'Progresso ESG Q2'}</span>
              <span style={{ fontSize: '11px', fontWeight: 800, color: GOLD }}>68%</span>
            </div>
            <div style={{ height: '6px', background: '#dde8de', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ width: '68%', height: '100%', background: `linear-gradient(90deg, ${G}, ${GOLD})`, borderRadius: '99px' }} />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
