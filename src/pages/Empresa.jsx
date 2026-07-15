import { useState, useEffect } from 'react'
import { useLang } from '../context/LangContext'
import { useIsMobile } from '../hooks/useIsMobile'
import { useTheme } from '../context/ThemeContext'
import { getCompanySettings, saveCompanySettings, VAT_RATES, DEFAULT_SETTINGS } from '../lib/companySettings'

const G = '#0a2f1a'
const GOLD = '#c9a84c'
const BG = '#f2f6f3'

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MONTHS_DE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function Empresa() {
  const { lang } = useLang()
  const { t } = useTheme()
  const G = t.heading, GOLD = t.accent, BG = t.softCardBg
  const isMobile = useIsMobile()
  const [form, setForm] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    (async () => {
      const data = await getCompanySettings()
      if (data) setForm({ ...DEFAULT_SETTINGS, ...data })
      setLoading(false)
    })()
  }, [])

  const months = lang === 'de' ? MONTHS_DE : lang === 'en' ? MONTHS_EN : MONTHS_PT
  const isExempt = form.vat_regime === 'exempt'
  const rates = VAT_RATES[form.country] || VAT_RATES.PT

  const L = lang === 'de' ? {
    title: 'Firmendaten', subtitle: 'Grundlage für MwSt., Steuerkalender und Steuerrücklage.',
    section_general: 'Allgemein', section_tax: 'Steuern',
    name: 'Firmenname', namePh: 'z.B. Lúcia Cílio, Unip. Lda',
    country: 'Land', currency: 'Währung',
    vatRegime: 'MwSt.-Regelung', normal: 'Normal', exempt: 'Befreit',
    vatRate: 'MwSt.-Satz (Standard)', irReserve: 'IR-Rücklage (%)',
    irHint: 'Empfehlung: 20–30 %', ssRegime: 'SV-Regelung', ssNone: '— keine —',
    ssSelf: 'Selbstständig', ssCompany: 'Gesellschaft',
    fyStart: 'Geschäftsjahresbeginn', save: 'Speichern', saving: 'Wird gespeichert…',
    saved: 'Gespeichert ✓', loading: 'Wird geladen…',
  } : lang === 'en' ? {
    title: 'Company Details', subtitle: 'Basis for VAT, tax calendar and tax reserve.',
    section_general: 'General', section_tax: 'Taxes',
    name: 'Company name', namePh: 'e.g. Lúcia Cílio, Unip. Lda',
    country: 'Country', currency: 'Currency',
    vatRegime: 'VAT scheme', normal: 'Standard', exempt: 'Exempt',
    vatRate: 'VAT rate (default)', irReserve: 'Income tax reserve (%)',
    irHint: 'Suggested: 20–30%', ssRegime: 'Social security scheme', ssNone: '— none —',
    ssSelf: 'Self-employed', ssCompany: 'Company',
    fyStart: 'Fiscal year start', save: 'Save', saving: 'Saving…',
    saved: 'Saved ✓', loading: 'Loading…',
  } : {
    title: 'Dados da Empresa', subtitle: 'Base para IVA, calendário fiscal e reserva de imposto.',
    section_general: 'Geral', section_tax: 'Fiscalidade',
    name: 'Nome da empresa', namePh: 'ex: Lúcia Cílio, Unip. Lda',
    country: 'País', currency: 'Moeda',
    vatRegime: 'Regime de IVA', normal: 'Normal', exempt: 'Isento',
    vatRate: 'Taxa de IVA (por defeito)', irReserve: 'Reserva de IR (%)',
    irHint: 'Sugestão: 20–30%', ssRegime: 'Regime de Segurança Social', ssNone: '— nenhum —',
    ssSelf: 'Trabalhador Independente', ssCompany: 'Sociedade',
    fyStart: 'Início do ano fiscal', save: 'Guardar', saving: 'A guardar…',
    saved: 'Guardado ✓', loading: 'A carregar…',
  }

  function update(field, value) {
    setSaved(false)
    setForm(f => {
      const next = { ...f, [field]: value }
      // Ao trocar de país, ajusta a taxa de IVA por defeito
      if (field === 'country') next.vat_default_rate = (VAT_RATES[value] || VAT_RATES.PT)[0]
      return next
    })
  }

  async function handleSave() {
    setSaving(true); setSaved(false)
    const payload = {
      ...form,
      vat_default_rate: isExempt ? 0 : Number(form.vat_default_rate),
      ir_reserve_pct: Number(form.ir_reserve_pct),
      fiscal_year_start_month: Number(form.fiscal_year_start_month),
      ss_regime: form.ss_regime || null,
    }
    const { error } = await saveCompanySettings(payload)
    setSaving(false)
    if (error) { alert(error.message); return }
    setSaved(true)
  }

  const label = (txt) => <div style={{ fontSize: '12px', fontWeight: 700, color: t.text, marginBottom: '6px' }}>{txt}</div>
  const inputStyle = { padding: '10px 12px', borderRadius: '9px', border: `1px solid ${t.cardBorder}`, fontSize: '14px', background: t.cardBg, outline: 'none', width: '100%', boxSizing: 'border-box', color: '#1a2e1a' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }
  const card = { background: t.cardBg, borderRadius: '14px', border: `1px solid ${t.cardBorder}`, padding: '22px 24px' }
  const grid2 = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }

  if (loading) return <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.loading}</div>

  return (
    <div style={{ width: '100%', maxWidth: '760px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 900, color: G, margin: '0 0 4px' }}>{L.title}</h2>
      <p style={{ fontSize: '13px', color: t.textMuted, margin: '0 0 22px' }}>{L.subtitle}</p>

      {/* Geral */}
      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: GOLD, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '16px' }}>{L.section_general}</div>
        <div style={{ marginBottom: '16px' }}>
          {label(L.name)}
          <input value={form.company_name || ''} onChange={e => update('company_name', e.target.value)} placeholder={L.namePh} style={inputStyle} />
        </div>
        <div style={grid2}>
          <div>
            {label(L.country)}
            <select value={form.country} onChange={e => update('country', e.target.value)} style={selectStyle}>
              <option value="PT">🇵🇹 Portugal</option>
              <option value="DE">🇩🇪 Deutschland</option>
            </select>
          </div>
          <div>
            {label(L.currency)}
            <input value={form.currency} onChange={e => update('currency', e.target.value)} style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Fiscalidade */}
      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: GOLD, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '16px' }}>{L.section_tax}</div>
        <div style={grid2}>
          <div>
            {label(L.vatRegime)}
            <select value={form.vat_regime} onChange={e => update('vat_regime', e.target.value)} style={selectStyle}>
              <option value="normal">{L.normal}</option>
              <option value="exempt">{L.exempt}</option>
            </select>
          </div>
          <div>
            {label(L.vatRate)}
            <select value={form.vat_default_rate} onChange={e => update('vat_default_rate', e.target.value)} disabled={isExempt} style={{ ...selectStyle, opacity: isExempt ? 0.5 : 1 }}>
              {rates.map(r => <option key={r} value={r}>{r}%</option>)}
            </select>
          </div>
          <div>
            {label(L.irReserve)}
            <input type="number" min="0" max="100" step="1" value={form.ir_reserve_pct} onChange={e => update('ir_reserve_pct', e.target.value)} style={inputStyle} />
            <div style={{ fontSize: '11px', color: t.subtle, marginTop: '5px' }}>{L.irHint}</div>
          </div>
          <div>
            {label(L.ssRegime)}
            <select value={form.ss_regime || ''} onChange={e => update('ss_regime', e.target.value)} style={selectStyle}>
              <option value="">{L.ssNone}</option>
              <option value="self">{L.ssSelf}</option>
              <option value="company">{L.ssCompany}</option>
            </select>
          </div>
          <div>
            {label(L.fyStart)}
            <select value={form.fiscal_year_start_month} onChange={e => update('fiscal_year_start_month', e.target.value)} style={selectStyle}>
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button onClick={handleSave} disabled={saving} style={{ padding: '12px 26px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '14px', cursor: saving ? 'wait' : 'pointer' }}>
          {saving ? L.saving : L.save}
        </button>
        {saved && <span style={{ fontSize: '13px', fontWeight: 700, color: '#065f46' }}>{L.saved}</span>}
      </div>
    </div>
  )
}
