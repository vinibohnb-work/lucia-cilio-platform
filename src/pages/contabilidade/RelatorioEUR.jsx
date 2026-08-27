import { useState, useEffect, useCallback, useMemo } from 'react'
import EsqueletoPagina from '../../components/EsqueletoPagina'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { useEffectiveUserId } from '../../context/ViewAsContext'
import { getCompanySettings } from '../../lib/companySettings'
import { getCategory } from '../../data/expenseCategories'
import { calcularEUR, liquidoDe } from '../../lib/eurCalc'

// Relatório EÜR (Einnahmen-Überschuss-Rechnung) — o apuramento fiscal alemão,
// gerado do Livro de Caixa. Modelado nas imagens de referência que a Lúcia
// enviou a 20/08 (o EÜR da ferramenta que ela usava).
//
// Os nomes das linhas ficam SEMPRE em alemão: é um documento fiscal alemão e é
// assim que o contabilista e o Finanzamt os conhecem. A interface à volta é
// que acompanha o idioma.

export default function RelatorioEUR() {
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const eid = useEffectiveUserId()

  const anoAtual = new Date().getFullYear()
  const [ano, setAno] = useState(anoAtual)
  const [entries, setEntries] = useState([])
  const [regime, setRegime] = useState('normal')
  const [empresa, setEmpresa] = useState('')
  const [loading, setLoading] = useState(true)
  const [aberta, setAberta] = useState(null)     // key da linha expandida

  const L = lang === 'de' ? {
    eyebrow: 'Buchhaltung', title: 'EÜR-Bericht',
    subtitle: 'Einnahmen-Überschuss-Rechnung aus dem Kassenbuch — vorläufige Werte zur Abstimmung mit der Steuerberatung.',
    einnahmen: 'Summe der Betriebseinnahmen', ausgaben: 'Summe der Betriebsausgaben',
    gewinn: 'Vorläufiger steuerpfl. Gewinn/Verlust',
    secReceitas: 'Betriebseinnahmen', secDespesas: 'Betriebsausgaben',
    zeile: 'Zeile', pos: 'Position', betrag: 'Betrag',
    zahldatum: 'Zahldatum', konto: 'Konto', beleg: 'Belegnummer', texto: 'Buchungstext',
    print: '🖨 Drucken / PDF', loading: 'Wird geladen…',
    vazio: 'Keine Buchungen in diesem Jahr.',
    regimeNormal: 'Regelbesteuerung — Nettowerte; vereinnahmte USt als Einnahme, gezahlte Vorsteuer als Ausgabe.',
    regimeKlein: 'Kleinunternehmer — Bruttowerte, ohne USt-Trennung.',
    avisoForm: 'Vorläufige Werte auf Grundlage des Kassenbuchs. Die offizielle Zeilennummerierung folgt dem Formular des jeweiligen Jahres — bitte mit der Steuerberatung abstimmen.',
    lancamentos: 'Buchungen',
  } : lang === 'en' ? {
    eyebrow: 'Accounting', title: 'EÜR report',
    subtitle: 'German profit calculation (EÜR) built from the cash book — preliminary figures to review with the tax adviser.',
    einnahmen: 'Total business income', ausgaben: 'Total business expenses',
    gewinn: 'Preliminary taxable profit/loss',
    secReceitas: 'Betriebseinnahmen (income)', secDespesas: 'Betriebsausgaben (expenses)',
    zeile: 'Line', pos: 'Position', betrag: 'Amount',
    zahldatum: 'Payment date', konto: 'Account', beleg: 'Document no.', texto: 'Description',
    print: '🖨 Print / PDF', loading: 'Loading…',
    vazio: 'No entries in this year.',
    regimeNormal: 'Standard VAT regime — net values; VAT collected counts as income, input VAT as expense.',
    regimeKlein: 'Small business (Kleinunternehmer) — gross values, no VAT split.',
    avisoForm: 'Preliminary figures from the cash book. Official line numbering follows each year’s form — review with the tax adviser.',
    lancamentos: 'entries',
  } : {
    eyebrow: 'Contabilidade', title: 'Relatório EÜR',
    subtitle: 'O apuramento fiscal alemão (EÜR) gerado do Livro de Caixa — valores preliminares, a validar com o contabilista.',
    einnahmen: 'Total de receitas da atividade', ausgaben: 'Total de despesas da atividade',
    gewinn: 'Lucro/prejuízo tributável preliminar',
    secReceitas: 'Betriebseinnahmen (receitas)', secDespesas: 'Betriebsausgaben (despesas)',
    zeile: 'Linha', pos: 'Posição', betrag: 'Valor',
    zahldatum: 'Data de pagamento', konto: 'Conta', beleg: 'N.º de documento', texto: 'Descrição',
    print: '🖨 Imprimir / PDF', loading: 'A carregar…',
    vazio: 'Sem lançamentos neste ano.',
    regimeNormal: 'Regime normal — valores líquidos; o IVA recebido conta como receita e o IVA pago como despesa.',
    regimeKlein: 'Kleinunternehmer (isento) — valores brutos, sem separação de IVA.',
    avisoForm: 'Valores preliminares a partir do Livro de Caixa. A numeração oficial das linhas segue o formulário de cada ano — validar com o contabilista.',
    lancamentos: 'lançamentos',
  }

  // Nomes oficiais das linhas — sempre em alemão (documento fiscal alemão)
  const NOME_LINHA = {
    normal19: 'Umsatzsteuerpflichtige Betriebseinnahmen (Regelsteuersatz)',
    reduzida: 'Betriebseinnahmen zum ermäßigten Steuersatz',
    semIva: 'Umsatzsteuerfreie Betriebseinnahmen',
    klein: 'Betriebseinnahmen als umsatzsteuerlicher Kleinunternehmer',
    vatRecebido: 'Vereinnahmte Umsatzsteuer',
    vatPago: 'Gezahlte Vorsteuerbeträge',
  }

  const load = useCallback(async () => {
    if (!eid) return
    setLoading(true)
    const [ce, cs] = await Promise.all([
      supabase.from('cash_entries').select('*').eq('user_id', eid)
        .gte('entry_date', `${ano}-01-01`).lte('entry_date', `${ano}-12-31`)
        .order('entry_date', { ascending: true }),
      getCompanySettings(eid),
    ])
    setEntries(ce.data || [])
    setRegime(cs?.vat_regime === 'exempt' ? 'exempt' : 'normal')
    setEmpresa(cs?.company_name || '')
    setLoading(false)
  }, [eid, ano])
  useEffect(() => { load() }, [load])

  const r = useMemo(() => calcularEUR(entries, regime), [entries, regime])
  const isento = r.regime === 'exempt'
  const valorDe = (e) => (isento ? Number(e.amount) || 0 : liquidoDe(e))

  const loc = lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-GB' : 'pt-PT'
  const fmt = (v) => (Number(v) || 0).toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
  const dataFmt = (d) => new Date(d).toLocaleDateString(loc)
  const nomeDe = (l) => l.categoria
    ? (getCategory(l.categoria)?.de?.label || l.categoria)
    : (NOME_LINHA[l.key] || l.key)
  const kontoDe = (e) => {
    if (e.type === 'entrada') return e.vat_rate > 0 ? `Erlöse ${e.vat_rate}% USt` : 'Erlöse'
    return getCategory(e.category)?.de?.label || 'Sonstige Ausgaben'
  }

  // ── Impressão: folha própria, como nos outros relatórios ──
  function imprimir() {
    const esc = (s) => String(s ?? '').replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]))
    const linhaHTML = (l) => `
      <tr><td>${l.zeile ?? ''}</td><td>${esc(nomeDe(l))}</td><td>${l.position ?? ''}</td><td class="v">${fmt(l.total)}</td></tr>
      ${l.entries.map(e => `<tr class="sub"><td></td><td>${dataFmt(e.entry_date)} · ${esc(kontoDe(e))}${e.doc ? ` · ${esc(e.doc)}` : ''} · ${esc(e.description)}</td><td></td><td class="v">${fmt(valorDe(e))}</td></tr>`).join('')}`
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>EÜR ${ano}${empresa ? ` — ${esc(empresa)}` : ''}</title><style>
      body{font-family:Georgia,serif;color:#1a2b20;max-width:780px;margin:40px auto;padding:0 20px;line-height:1.5}
      h1{font-size:24px;margin-bottom:2px} .sub{color:#667;font-size:12.5px;margin-bottom:22px}
      .cards{display:flex;gap:14px;margin-bottom:24px}
      .card{flex:1;border:1px solid #ccc;padding:12px 14px}
      .card b{display:block;font-size:19px;margin-top:5px}
      h2{font-size:15px;border-bottom:2px solid #c9a84c;padding-bottom:4px;margin-top:26px}
      table{width:100%;border-collapse:collapse;font-size:12px;margin:8px 0}
      td{border-bottom:1px solid #eee;padding:5px 8px;vertical-align:top}
      td.v{text-align:right;white-space:nowrap}
      tr.sub td{color:#778;font-size:11px;border-bottom:1px dotted #eee}
      tr.total td{font-weight:bold;border-top:2px solid #1a2b20;border-bottom:none}
      .aviso{font-size:10.5px;color:#889;margin-top:26px;border-top:1px solid #ddd;padding-top:10px}
    </style></head><body>
      <h1>Einnahmenüberschussrechnung (EÜR) ${ano}</h1>
      <div class="sub">${esc(empresa)}${empresa ? ' · ' : ''}${isento ? 'Kleinunternehmer' : 'Regelbesteuerung'}</div>
      <div class="cards">
        <div class="card">${esc(L.einnahmen)}<b>${fmt(r.totalReceitas)}</b></div>
        <div class="card">${esc(L.ausgaben)}<b>${fmt(r.totalDespesas)}</b></div>
        <div class="card">${esc(L.gewinn)}<b>${fmt(r.resultado)}</b></div>
      </div>
      <h2>Betriebseinnahmen</h2>
      <table>
        <tr><td style="font-size:10px;color:#889">${esc(L.zeile)}</td><td style="font-size:10px;color:#889"></td><td style="font-size:10px;color:#889">${esc(L.pos)}</td><td class="v" style="font-size:10px;color:#889">${esc(L.betrag)}</td></tr>
        ${r.linhasReceita.map(linhaHTML).join('')}
        ${r.vatRecebido ? `<tr><td></td><td>${NOME_LINHA.vatRecebido}</td><td></td><td class="v">${fmt(r.vatRecebido)}</td></tr>` : ''}
        <tr class="total"><td></td><td>${esc(L.einnahmen)}</td><td></td><td class="v">${fmt(r.totalReceitas)}</td></tr>
      </table>
      <h2>Betriebsausgaben</h2>
      <table>
        ${r.linhasDespesa.map(linhaHTML).join('')}
        ${r.vatPago ? `<tr><td></td><td>${NOME_LINHA.vatPago}</td><td></td><td class="v">${fmt(r.vatPago)}</td></tr>` : ''}
        <tr class="total"><td></td><td>${esc(L.ausgaben)}</td><td></td><td class="v">${fmt(r.totalDespesas)}</td></tr>
      </table>
      <div class="aviso">${esc(L.avisoForm)} — Lúcia Cílio · Office Consulting</div>
    </body></html>`
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html); w.document.close()
    setTimeout(() => w.print(), 300)
  }

  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px' }
  const kpi = (rot, val, destaque = false) => (
    <div style={{ ...card, padding: '16px 19px', flex: 1, minWidth: '180px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: '7px' }}>{rot}</div>
      <div style={{ fontFamily: t.fontDisplay, fontSize: '25px', fontWeight: 600, color: destaque ? (r.resultado >= 0 ? t.dueOk.ink : t.neg) : t.heading }}>{fmt(val)}</div>
    </div>
  )

  const Linha = ({ l }) => {
    const expandida = aberta === l.key
    return (
      <div style={{ borderTop: `1px solid ${t.rowBorder || t.cardBorder}` }}>
        <div onClick={() => setAberta(expandida ? null : l.key)}
          style={{ display: 'flex', gap: '10px', alignItems: 'baseline', padding: '10px 0', cursor: 'pointer' }}>
          <span style={{ flex: 'none', width: '36px', fontSize: '12px', color: t.textMuted, fontVariantNumeric: 'tabular-nums' }}>{l.zeile ?? ''}</span>
          <span style={{ flex: 1, fontSize: '13px', color: t.heading, lineHeight: 1.4 }}>
            {expandida ? '▾ ' : '▸ '}{nomeDe(l)}
            <span style={{ fontSize: '10.5px', color: t.subtle }}> · {l.entries.length} {L.lancamentos}</span>
          </span>
          {l.position && <span style={{ flex: 'none', fontSize: '12px', color: t.textMuted, fontVariantNumeric: 'tabular-nums' }}>{l.position}</span>}
          <span style={{ flex: 'none', fontSize: '13.5px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: t.heading }}>{fmt(l.total)}</span>
        </div>
        {expandida && (
          <div style={{ background: t.softCardBg, borderRadius: '9px', padding: '9px 12px', marginBottom: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '86px 1fr 1fr 90px', gap: '8px', fontSize: '10px', fontWeight: 700, color: t.subtle, textTransform: 'uppercase', letterSpacing: '.4px', marginBottom: '5px' }}>
              <span>{L.zahldatum}</span><span>{L.konto}</span><span>{L.texto}</span><span style={{ textAlign: 'right' }}>{L.betrag}</span>
            </div>
            {l.entries.map((e, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '86px 1fr 1fr 90px', gap: '8px', fontSize: '11.5px', color: t.text, padding: '3px 0' }}>
                <span style={{ fontFamily: t.fontNum, color: t.subtle }}>{dataFmt(e.entry_date)}</span>
                <span>{kontoDe(e)}{e.doc ? ` · ${e.doc}` : ''}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</span>
                <span style={{ textAlign: 'right', fontFamily: t.fontNum, fontWeight: 700 }}>{fmt(valorDe(e))}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const LinhaIVA = ({ nome, valor }) => (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline', padding: '10px 0', borderTop: `1px solid ${t.rowBorder || t.cardBorder}` }}>
      <span style={{ flex: 'none', width: '34px' }} />
      <span style={{ flex: 1, fontSize: '13px', color: t.heading }}>{nome}</span>
      <span style={{ flex: 'none', fontSize: '13.5px', fontWeight: 800, fontFamily: t.fontNum, color: t.heading }}>{fmt(valor)}</span>
    </div>
  )

  const Total = ({ nome, valor }) => (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline', padding: '11px 0 2px', borderTop: `2px solid ${t.heading}` }}>
      <span style={{ flex: 'none', width: '34px' }} />
      <span style={{ flex: 1, fontSize: '13px', fontWeight: 800, color: t.heading }}>{nome}</span>
      <span style={{ flex: 'none', fontSize: '14px', fontWeight: 900, fontFamily: t.fontNum, color: t.heading }}>{fmt(valor)}</span>
    </div>
  )

  if (loading) return <EsqueletoPagina />

  const temDados = entries.some(e => !e.private)

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody, maxWidth: '920px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accentText }}>{L.eyebrow}</div>
          <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '27px' : '34px', lineHeight: 1.05, letterSpacing: '-.5px', color: t.heading }}>{L.title}</h1>
          <p style={{ fontSize: '12.5px', color: t.textMuted, margin: '8px 0 0', maxWidth: '560px', lineHeight: 1.5 }}>{L.subtitle}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select value={ano} onChange={e => setAno(Number(e.target.value))}
            style={{ padding: '9px 12px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '13px', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
            {[anoAtual + 1, anoAtual, anoAtual - 1, anoAtual - 2].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {temDados && <button onClick={imprimir} style={{ padding: '9px 15px', borderRadius: '10px', border: `1px solid ${t.cardBorder}`, background: t.cardBg, color: t.heading, fontWeight: 700, fontSize: '12.5px', cursor: 'pointer' }}>{L.print}</button>}
        </div>
      </div>

      {/* Regime aplicado — sempre à vista, porque muda todos os números */}
      <div style={{ background: t.chipBg, color: t.chipText, borderRadius: '10px', padding: '10px 14px', fontSize: '12px', fontWeight: 600, marginBottom: '14px', lineHeight: 1.5 }}>
        ⚖ {isento ? L.regimeKlein : L.regimeNormal}
      </div>

      {!temDados && (
        <div style={{ ...card, padding: '34px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: '34px', marginBottom: '10px' }}>🧾</div>
          <div style={{ fontSize: '14px', color: t.textMuted }}>{L.vazio}</div>
        </div>
      )}

      {temDados && (
        <>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {kpi(L.einnahmen, r.totalReceitas)}
            {kpi(L.ausgaben, r.totalDespesas)}
            {kpi(L.gewinn, r.resultado, true)}
          </div>

          <div style={{ ...card, padding: '18px 22px', marginBottom: '14px' }}>
            <h3 style={{ margin: '0 0 6px', fontFamily: t.fontDisplay, fontSize: '18px', fontWeight: 600, color: t.heading }}>{L.secReceitas}</h3>
            {r.linhasReceita.map(l => <Linha key={l.key} l={l} />)}
            {r.vatRecebido > 0 && <LinhaIVA nome={NOME_LINHA.vatRecebido} valor={r.vatRecebido} />}
            <Total nome={L.einnahmen} valor={r.totalReceitas} />
          </div>

          <div style={{ ...card, padding: '18px 22px', marginBottom: '14px' }}>
            <h3 style={{ margin: '0 0 6px', fontFamily: t.fontDisplay, fontSize: '18px', fontWeight: 600, color: t.heading }}>{L.secDespesas}</h3>
            {r.linhasDespesa.map(l => <Linha key={l.key} l={l} />)}
            {r.vatPago > 0 && <LinhaIVA nome={NOME_LINHA.vatPago} valor={r.vatPago} />}
            <Total nome={L.ausgaben} valor={r.totalDespesas} />
          </div>

          <p style={{ fontSize: '11px', color: t.subtle, lineHeight: 1.5, margin: '0 0 20px' }}>ⓘ {L.avisoForm}</p>
        </>
      )}
    </div>
  )
}
