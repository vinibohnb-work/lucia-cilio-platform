import { useState } from 'react'
import { useLang } from '../../context/LangContext'
import { t } from '../../i18n/translations'

const G = '#0d3b20'
const GOLD = '#c9a84c'
const BG = '#f2f6f3'

const obligations = [
  { id: 1, typeKey: 'obl_t1', client: 'Solar Luso Lda',      country: '🇵🇹', countryCode: 'pt', deadline: '2026-06-10', statusKey: 'obl_pending' },
  { id: 2, typeKey: 'obl_t2', client: 'TerraVerde Lda',      country: '🇵🇹', countryCode: 'pt', deadline: '2026-06-30', statusKey: 'obl_pending' },
  { id: 3, typeKey: 'obl_t3', client: 'Meinhardt GmbH',      country: '🇩🇪', countryCode: 'de', deadline: '2026-05-10', statusKey: 'obl_done'    },
  { id: 4, typeKey: 'obl_t4', client: 'Meinhardt GmbH',      country: '🇩🇪', countryCode: 'de', deadline: '2026-07-31', statusKey: 'obl_pending' },
  { id: 5, typeKey: 'obl_t5', client: 'Grupo Horizonte',     country: '🇵🇹', countryCode: 'pt', deadline: '2026-06-30', statusKey: 'obl_pending' },
  { id: 6, typeKey: 'obl_t3', client: 'Schneider & Partner', country: '🇩🇪', countryCode: 'de', deadline: '2026-05-10', statusKey: 'obl_done'    },
  { id: 7, typeKey: 'obl_t1', client: 'Tech Lisboa',         country: '🇵🇹', countryCode: 'pt', deadline: '2026-06-10', statusKey: 'obl_pending' },
]

const STATUS_STYLE = {
  obl_pending: { bg: '#fef3c7', color: '#92400e' },
  obl_done:    { bg: '#d1fae5', color: '#065f46' },
  obl_overdue: { bg: '#fee2e2', color: '#991b1b' },
}

function daysUntil(dateStr) {
  const today = new Date('2026-05-15')
  const target = new Date(dateStr)
  return Math.round((target - today) / 86400000)
}

export default function ObrigacoesFiscais() {
  const { lang } = useLang()
  const [filter, setFilter] = useState('all')

  const visible = filter === 'all' ? obligations
    : filter === 'pending' ? obligations.filter(o => o.statusKey === 'obl_pending')
    : obligations.filter(o => o.countryCode === filter)

  const filterBtnStyle = (val) => ({
    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
    cursor: 'pointer', border: `1px solid ${filter === val ? G : '#dde8de'}`,
    background: filter === val ? G : '#fff',
    color: filter === val ? '#fff' : '#64748b',
  })

  const pendingCount = obligations.filter(o => o.statusKey === 'obl_pending').length

  return (
    <div style={{ width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            ['all',     lang === 'de' ? 'Alle' : 'Todas'],
            ['pending', lang === 'de' ? 'Offen' : 'Pendentes'],
            ['pt',      '🇵🇹 Portugal'],
            ['de',      '🇩🇪 Deutschland'],
          ].map(([val, label]) => (
            <button key={val} style={filterBtnStyle(val)} onClick={() => setFilter(val)}>{label}</button>
          ))}
        </div>
        <button style={{ padding: '9px 18px', background: G, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
          {t(lang, 'obl_new')}
        </button>
      </div>

      {/* Alert banner */}
      {pendingCount > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '12px 18px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#92400e' }}>
            {pendingCount} {lang === 'de' ? `offene Frist${pendingCount > 1 ? 'en' : ''}` : `obrigaç${pendingCount > 1 ? 'ões' : 'ão'} pendente${pendingCount > 1 ? 's' : ''}`}
          </span>
        </div>
      )}

      {/* List */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #dde8de', overflow: 'hidden' }}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 100px 100px 110px', padding: '12px 20px', background: BG, borderBottom: '1px solid #dde8de' }}>
          {[t(lang,'obl_type'), t(lang,'obl_client'), t(lang,'obl_country'), t(lang,'obl_deadline'), t(lang,'cli_status')].map(h => (
            <div key={h} style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {visible.map((o, i) => {
          const stStyle = STATUS_STYLE[o.statusKey] || {}
          const days = daysUntil(o.deadline)
          const dateColor = o.statusKey === 'obl_done' ? '#64748b' : days <= 14 ? '#e53e3e' : G

          return (
            <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 100px 100px 110px', padding: '14px 20px', borderBottom: i < visible.length - 1 ? '1px solid #f0f4f1' : 'none', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#1a2e1a', lineHeight: 1.4 }}>{t(lang, o.typeKey)}</div>
              <div style={{ fontSize: '12px', color: '#4a6355', fontWeight: 500 }}>{o.client}</div>
              <div style={{ fontSize: '20px' }}>{o.country}</div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: dateColor }}>{o.deadline.slice(5).split('-').join('/')}</div>
                {o.statusKey !== 'obl_done' && (
                  <div style={{ fontSize: '10px', color: days <= 14 ? '#e53e3e' : '#64748b', marginTop: '2px' }}>
                    {days > 0 ? `${days} ${lang === 'de' ? 'Tage' : 'dias'}` : lang === 'de' ? 'Heute' : 'Hoje'}
                  </div>
                )}
              </div>
              <div>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: stStyle.bg, color: stStyle.color }}>
                  {t(lang, o.statusKey)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
