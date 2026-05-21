import { useState } from 'react'
import { useLang } from '../../context/LangContext'
import { t } from '../../i18n/translations'

const G = '#0d3b20'
const GOLD = '#c9a84c'
const BG = '#f2f6f3'

const clients = [
  { id: 1, name: 'TerraVerde Lda',      country: '🇵🇹', countryCode: 'pt', sectorKey: 'cli_s1', serviceKey: 'cli_both',   statusKey: 'cli_active'   },
  { id: 2, name: 'Meinhardt GmbH',      country: '🇩🇪', countryCode: 'de', sectorKey: 'cli_s2', serviceKey: 'cli_esg',    statusKey: 'cli_active'   },
  { id: 3, name: 'Grupo Horizonte',     country: '🇵🇹', countryCode: 'pt', sectorKey: 'cli_s3', serviceKey: 'cli_both',   statusKey: 'cli_active'   },
  { id: 4, name: 'Schneider & Partner', country: '🇩🇪', countryCode: 'de', sectorKey: 'cli_s4', serviceKey: 'cli_esg',    statusKey: 'cli_active'   },
  { id: 5, name: 'Solar Luso Lda',      country: '🇵🇹', countryCode: 'pt', sectorKey: 'cli_s5', serviceKey: 'cli_acc',    statusKey: 'cli_active'   },
  { id: 6, name: 'Tech Lisboa',         country: '🇵🇹', countryCode: 'pt', sectorKey: 'cli_s6', serviceKey: 'cli_acc',    statusKey: 'cli_active'   },
  { id: 7, name: 'Müller Bau GmbH',     country: '🇩🇪', countryCode: 'de', sectorKey: 'cli_s1', serviceKey: 'cli_both',   statusKey: 'cli_inactive' },
]

const SERVICE_STYLE = {
  cli_esg:  { bg: '#e8f5ec', color: G      },
  cli_acc:  { bg: '#f5edd6', color: '#92400e' },
  cli_both: { bg: '#ede9fe', color: '#5b21b6' },
}

const STATUS_STYLE = {
  cli_active:   { bg: '#d1fae5', color: '#065f46' },
  cli_inactive: { bg: '#f1f5f9', color: '#64748b' },
}

export default function Clientes() {
  const { lang } = useLang()
  const [filter, setFilter] = useState('all')

  const visible = filter === 'all' ? clients
    : filter === 'pt' ? clients.filter(c => c.countryCode === 'pt')
    : clients.filter(c => c.countryCode === 'de')

  const filterBtnStyle = (val) => ({
    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
    cursor: 'pointer', border: `1px solid ${filter === val ? G : '#dde8de'}`,
    background: filter === val ? G : '#fff',
    color: filter === val ? '#fff' : '#64748b',
  })

  return (
    <div style={{ width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[['all', lang === 'de' ? 'Alle' : 'Todos'], ['pt', '🇵🇹 Portugal'], ['de', '🇩🇪 Deutschland']].map(([val, label]) => (
            <button key={val} style={filterBtnStyle(val)} onClick={() => setFilter(val)}>{label}</button>
          ))}
        </div>
        <button style={{ padding: '9px 18px', background: G, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
          {t(lang, 'cli_new')}
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #dde8de', overflow: 'hidden' }}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 140px 130px 110px', padding: '12px 20px', background: BG, borderBottom: '1px solid #dde8de' }}>
          {[t(lang,'cli_name'), t(lang,'cli_country'), t(lang,'cli_sector'), t(lang,'cli_service'), t(lang,'cli_status')].map(h => (
            <div key={h} style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {visible.map((c, i) => {
          const svcStyle = SERVICE_STYLE[c.serviceKey] || {}
          const stStyle  = STATUS_STYLE[c.statusKey]  || {}
          return (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 140px 130px 110px', padding: '14px 20px', borderBottom: i < visible.length - 1 ? '1px solid #f0f4f1' : 'none', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: G }}>{c.name}</div>
              <div style={{ fontSize: '20px' }}>{c.country}</div>
              <div style={{ fontSize: '12px', color: '#4a6355' }}>{t(lang, c.sectorKey)}</div>
              <div>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: svcStyle.bg, color: svcStyle.color }}>
                  {t(lang, c.serviceKey)}
                </span>
              </div>
              <div>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: stStyle.bg, color: stStyle.color }}>
                  {t(lang, c.statusKey)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
        {[
          { label: lang === 'de' ? 'Insgesamt' : 'Total', val: clients.length, color: G },
          { label: 'Portugal', val: clients.filter(c=>c.countryCode==='pt').length, color: '#1a5c32' },
          { label: 'Deutschland', val: clients.filter(c=>c.countryCode==='de').length, color: GOLD },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: '10px', padding: '12px 18px', border: '1px solid #dde8de', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px', fontWeight: 900, color: s.color }}>{s.val}</span>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>{s.label}</span>
          </div>
        ))}
      </div>

    </div>
  )
}
