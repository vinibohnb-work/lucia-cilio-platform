import { useState, useEffect } from 'react'
import EsqueletoPagina from '../components/EsqueletoPagina'
import { useLang } from '../context/LangContext'
import CabecalhoPagina from '../components/CabecalhoPagina'
import { useIsMobile } from '../hooks/useIsMobile'
import { useTheme } from '../context/ThemeContext'
import { getCompanySettings, saveCompanySettings, VAT_RATES, DEFAULT_SETTINGS } from '../lib/companySettings'
import { useEffectiveUserId, useViewAs } from '../context/ViewAsContext'
import EnvioDocumentos from '../components/EnvioDocumentos'
import LogoEmpresa from '../components/LogoEmpresa'
import InfoTooltip from '../components/InfoTooltip'
import { BRAND } from '../theme'

const G = BRAND.green
const GOLD = BRAND.gold
const BG = '#f2f6f3'


export default function Empresa() {
  const { lang } = useLang()
  const { t } = useTheme()
  const GOLD = t.accent
  const isMobile = useIsMobile()
  const eid = useEffectiveUserId()
  const { isViewing } = useViewAs()
  const [form, setForm] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!eid) return
    (async () => {
      const data = await getCompanySettings(eid)
      if (data) setForm({ ...DEFAULT_SETTINGS, ...data })
      setLoading(false)
    })()
  }, [eid])

  const isExempt = form.vat_regime === 'exempt'
  const rates = VAT_RATES[form.country] || VAT_RATES.PT

  const L = lang === 'de' ? {
    title: 'Firmendaten', subtitle: 'Grundlage für MwSt., Steuerkalender und Steuerrücklage.',
    section_general: 'Allgemein', section_tax: 'Steuern', section_docs: 'Belege',
    name: 'Firmenname', namePh: 'z.B. Lúcia Cílio, Unip. Lda',
    country: 'Land', currency: 'Währung',
    vatRegime: 'MwSt.-Regelung', normal: 'Normal', exempt: 'Befreit',
    vatRate: 'MwSt.-Satz (Standard)', irReserve: 'IR-Rücklage (%)',
    irHint: 'Empfehlung: 20–30 %', ssRegime: 'SV-Regelung', ssNone: '— keine —',
    infoVatRegime: 'Normal: Sie stellen MwSt. in Rechnung und führen sie an das Finanzamt ab. Befreit: keine MwSt. auf Rechnungen (z. B. Kleinunternehmer nach § 19 UStG), solange die Umsatzgrenze nicht überschritten wird.',
    infoVatRate: 'Der Satz, der bei neuen Buchungen vorgeschlagen wird. Er lässt sich bei jeder Buchung ändern.',
    infoIr: 'Anteil des Gewinns, der für die Einkommensteuer des Jahres zurückgelegt wird. Eine Schätzung — bitte mit der Steuerberatung abstimmen.',
    infoSs: 'Selbstständig: Sie zahlen die Sozialbeiträge selbst. Gesellschaft: die Firma zahlt sie — die persönlichen Berechnungen werden ausgeblendet.',
    ssSelf: 'Selbstständig', ssCompany: 'Gesellschaft',
    fyStart: 'Geschäftsjahresbeginn', save: 'Speichern', saving: 'Wird gespeichert…',
    saved: 'Gespeichert ✓', loading: 'Wird geladen…',
  } : lang === 'en' ? {
    title: 'Company Details', subtitle: 'Basis for VAT, tax calendar and tax reserve.',
    section_general: 'General', section_tax: 'Taxes', section_docs: 'Documents',
    name: 'Company name', namePh: 'e.g. Lúcia Cílio, Unip. Lda',
    country: 'Country', currency: 'Currency',
    vatRegime: 'VAT scheme', normal: 'Standard', exempt: 'Exempt',
    vatRate: 'VAT rate (default)', irReserve: 'Income tax reserve (%)',
    irHint: 'Suggested: 20–30%', ssRegime: 'Social security scheme', ssNone: '— none —',
    infoVatRegime: 'Standard: you charge VAT on invoices and pay it to the tax office. Exempt: no VAT on invoices (small-business schemes such as art. 53 in Portugal or § 19 UStG in Germany), while under the turnover limit.',
    infoVatRate: 'The rate suggested on new entries. It can be changed on each entry.',
    infoIr: 'Share of profit set aside for the year\'s income tax. An estimate — please confirm with your accountant.',
    infoSs: 'Self-employed: you pay social security yourself. Company: the company pays it — the personal calculations are hidden.',
    ssSelf: 'Self-employed', ssCompany: 'Company',
    fyStart: 'Fiscal year start', save: 'Save', saving: 'Saving…',
    saved: 'Saved ✓', loading: 'Loading…',
  } : {
    title: 'Dados da Empresa', subtitle: 'Base para IVA, calendário fiscal e reserva de imposto.',
    section_general: 'Geral', section_tax: 'Fiscalidade', section_docs: 'Documentos',
    name: 'Nome da empresa', namePh: 'ex: Lúcia Cílio, Unip. Lda',
    country: 'País', currency: 'Moeda',
    vatRegime: 'Regime de IVA', normal: 'Normal', exempt: 'Isento',
    vatRate: 'Taxa de IVA (por defeito)', irReserve: 'Reserva de IR (%)',
    irHint: 'Sugestão: 20–30%', ssRegime: 'Regime de Segurança Social', ssNone: '— nenhum —',
    infoVatRegime: 'Normal: cobra IVA nas faturas e entrega-o ao Estado. Isento: não cobra IVA (por exemplo o art. 53.º em Portugal ou o § 19 UStG na Alemanha), enquanto não passar o limite de faturação.',
    infoVatRate: 'A taxa proposta nos lançamentos novos. Pode ser mudada em cada lançamento.',
    infoIr: 'A parte do lucro guardada para o imposto sobre o rendimento do ano. É uma estimativa — confirme com o contabilista.',
    infoSs: 'Trabalhador independente: paga as contribuições por conta própria. Sociedade: é a empresa que as paga — os cálculos pessoais ficam escondidos.',
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
    if (isViewing) return
    setSaving(true); setSaved(false)
    const payload = {
      ...form,
      vat_default_rate: isExempt ? 0 : Number(form.vat_default_rate),
      ir_reserve_pct: Number(form.ir_reserve_pct),
      // Moeda e início do ano fiscal saíram do ecrã (não eram usados em lado nenhum — R-D8)
      fiscal_year_start_month: Number(form.fiscal_year_start_month) || 1,
      ss_regime: form.ss_regime || null,
    }
    const { error } = await saveCompanySettings(payload)
    setSaving(false)
    if (error) { alert(error.message); return }
    setSaved(true)
  }

  // Termos fiscais com (i): explicação curta ao lado do rótulo (reunião de 06/08).
  const label = (txt, info) => <div style={{ fontSize: '12px', fontWeight: 700, color: t.text, marginBottom: '6px', display: 'flex', alignItems: 'center' }}>{txt}{info && <InfoTooltip text={info} />}</div>
  const inputStyle = { padding: '10px 12px', borderRadius: '9px', border: `1px solid ${t.cardBorder}`, fontSize: '14px', background: t.cardBg, outline: 'none', width: '100%', boxSizing: 'border-box', color: '#1a2e1a' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }
  const card = { background: t.cardBg, borderRadius: '14px', border: `1px solid ${t.cardBorder}`, padding: '22px 24px' }
  const grid2 = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }

  if (loading) return <EsqueletoPagina />

  return (
    <div style={{ width: '100%' }}>
      <CabecalhoPagina eyebrow={{ pt: 'Gestão', de: 'Verwaltung', en: 'Management' }} titulo={L.title} sub={L.subtitle} />

      {/* Geral */}
      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: GOLD, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '16px' }}>{L.section_general}</div>
        <div style={{ marginBottom: '16px' }}>
          {label(L.name)}
          <input value={form.company_name || ''} onChange={e => update('company_name', e.target.value)} placeholder={L.namePh} style={inputStyle} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <LogoEmpresa userId={eid} soLeitura={isViewing} />
        </div>
        <div style={grid2}>
          <div>
            {label(L.country)}
            <select value={form.country} onChange={e => update('country', e.target.value)} style={selectStyle}>
              <option value="PT">🇵🇹 Portugal</option>
              <option value="DE">🇩🇪 Deutschland</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fiscalidade */}
      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: GOLD, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '16px' }}>{L.section_tax}</div>
        <div style={grid2}>
          <div>
            {label(L.vatRegime, L.infoVatRegime)}
            <select value={form.vat_regime} onChange={e => update('vat_regime', e.target.value)} style={selectStyle}>
              <option value="normal">{L.normal}</option>
              <option value="exempt">{L.exempt}</option>
            </select>
          </div>
          <div>
            {label(L.vatRate, L.infoVatRate)}
            <select value={form.vat_default_rate} onChange={e => update('vat_default_rate', e.target.value)} disabled={isExempt} style={{ ...selectStyle, opacity: isExempt ? 0.5 : 1 }}>
              {rates.map(r => <option key={r} value={r}>{r}%</option>)}
            </select>
          </div>
          <div>
            {label(L.irReserve, L.infoIr)}
            <input type="number" min="0" max="100" step="1" value={form.ir_reserve_pct} onChange={e => update('ir_reserve_pct', e.target.value)} style={inputStyle} />
            <div style={{ fontSize: '11px', color: t.subtle, marginTop: '5px' }}>{L.irHint}</div>
          </div>
          <div>
            {label(L.ssRegime, L.infoSs)}
            <select value={form.ss_regime || ''} onChange={e => update('ss_regime', e.target.value)} style={selectStyle}>
              <option value="">{L.ssNone}</option>
              <option value="self">{L.ssSelf}</option>
              <option value="company">{L.ssCompany}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Documentos — envio pelo cliente, arrumado por mês (27/08) */}
      <div style={{ ...card, marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: GOLD, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '16px' }}>{L.section_docs}</div>
        <EnvioDocumentos userId={eid} />
      </div>

      {/* Ações */}
      {!isViewing && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button onClick={handleSave} disabled={saving} style={{ padding: '12px 26px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '14px', cursor: saving ? 'wait' : 'pointer' }}>
          {saving ? L.saving : L.save}
        </button>
        {saved && <span style={{ fontSize: '13px', fontWeight: 700, color: '#065f46' }}>{L.saved}</span>}
      </div>
      )}
    </div>
  )
}
