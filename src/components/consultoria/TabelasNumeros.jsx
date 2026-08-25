import { useTheme } from '../../context/ThemeContext'
import { useLang } from '../../context/LangContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import {
  soma, retiradasPrivadas, necessidadeCapital, financiamento,
  projecao, verificacaoLucro, liquidez, linhasPadrao, ANOS,
} from '../../lib/consultoriaCalc'

// Blocos 3 e 4 da consultoria — as tabelas de números do documento da IHK.
// Todas partilham a mesma mecânica: linhas {desc, valor} que a Lúcia edita,
// pré-carregadas com as linhas por omissão (que são referência, não dogma).

const eur = (v, lang) => (Number(v) || 0).toLocaleString(
  lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-GB' : 'pt-PT',
  { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'

// ── Tabela simples de linhas {desc, valor} ─────────────────────────────────
export function TabelaLinhas({ titulo, linhas, chavePadrao, onChange, total, cor }) {
  const { t } = useTheme()
  const { lang } = useLang()
  const L = lang === 'de' ? { add: '+ Zeile', total: 'Summe', desc: 'Bezeichnung', val: 'Betrag' }
        : lang === 'en' ? { add: '+ Row', total: 'Total', desc: 'Description', val: 'Amount' }
        : { add: '+ Linha', total: 'Total', desc: 'Descrição', val: 'Valor' }

  // Primeira utilização: carrega as linhas por omissão para ela não escrever tudo
  const rows = (linhas && linhas.length) ? linhas : linhasPadrao(chavePadrao, lang)
  const set = (i, campo, v) => {
    const r = rows.map((l, idx) => idx === i ? { ...l, [campo]: v } : l)
    onChange(r)
  }
  const inputStyle = { padding: '8px 10px', borderRadius: '7px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '13.5px', outline: 'none', width: '100%', boxSizing: 'border-box' }

  return (
    <div style={{ background: t.softCardBg, borderRadius: '11px', padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '9px' }}>
        <span style={{ fontSize: '12px', fontWeight: 800, color: cor || t.heading }}>{titulo}</span>
        <span style={{ marginLeft: 'auto', fontSize: '13px', fontWeight: 800, color: cor || t.heading, fontFamily: t.fontNum }}>{eur(total ?? soma(rows), lang)}</span>
      </div>
      {rows.map((l, i) => (
        <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '5px' }}>
          <input value={l.desc || ''} onChange={e => set(i, 'desc', e.target.value)} placeholder={L.desc} style={{ ...inputStyle, flex: 1 }} />
          <input value={l.valor ?? ''} onChange={e => set(i, 'valor', e.target.value)} placeholder={L.val} inputMode="decimal"
            style={{ ...inputStyle, width: '96px', flex: 'none', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }} />
          <button onClick={() => onChange(rows.filter((_, idx) => idx !== i))}
            style={{ background: 'none', border: 'none', color: t.subtle, cursor: 'pointer', fontSize: '12px', padding: '0 2px', flex: 'none' }}>✕</button>
        </div>
      ))}
      <button onClick={() => onChange([...rows, { desc: '', valor: '' }])}
        style={{ background: 'none', border: 'none', color: t.accentText, fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', padding: '4px 0' }}>{L.add}</button>
    </div>
  )
}

// ── Semáforo de verificação ────────────────────────────────────────────────
function Semaforo({ ok, titulo, detalhe }) {
  const { t } = useTheme()
  const tone = ok ? t.dueOk : t.dueLate
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: tone.bg, borderRadius: '11px', padding: '12px 15px', marginTop: '12px' }}>
      <span style={{ fontSize: '15px', lineHeight: 1.2 }}>{ok ? '🟢' : '🔴'}</span>
      <div>
        <div style={{ fontSize: '12.5px', fontWeight: 700, color: tone.ink }}>{titulo}</div>
        {detalhe && <div style={{ fontSize: '11.5px', color: tone.ink, opacity: .85, marginTop: '2px' }}>{detalhe}</div>}
      </div>
    </div>
  )
}

// ── 2.1 Retiradas privadas ─────────────────────────────────────────────────
export function Privadas({ numeros, alterar }) {
  const { t } = useTheme(); const { lang } = useLang(); const isMobile = useIsMobile()
  const L = lang === 'de' ? { rend: 'Einkommen des Haushalts', desp: 'Ausgaben des Haushalts', res: 'Notwendige Privatentnahme', mes: 'pro Monat', ano: 'pro Jahr' }
        : lang === 'en' ? { rend: 'Household income', desp: 'Household expenses', res: 'Necessary private withdrawal', mes: 'per month', ano: 'per year' }
        : { rend: 'Rendimentos do agregado', desp: 'Despesas do agregado', res: 'Retirada privada necessária', mes: 'por mês', ano: 'por ano' }
  const p = numeros?.privadas || {}
  const r = retiradasPrivadas(p)
  const set = (campo, v) => alterar({ numeros: { ...numeros, privadas: { ...p, [campo]: v } } })
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
        <TabelaLinhas titulo={L.rend} linhas={p.rendimentos} chavePadrao="rendimentos" onChange={v => set('rendimentos', v)} cor={t.dueOk.ink} />
        <TabelaLinhas titulo={L.desp} linhas={p.despesas} chavePadrao="despesas" onChange={v => set('despesas', v)} cor={t.neg} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', background: t.chipBg, borderRadius: '11px', padding: '13px 16px', marginTop: '12px' }}>
        <span style={{ fontSize: '12px', fontWeight: 800, color: t.chipText, textTransform: 'uppercase', letterSpacing: '.5px' }}>{L.res}</span>
        <span style={{ marginLeft: 'auto', fontSize: '20px', fontWeight: 800, color: t.heading, fontFamily: t.fontNum }}>{eur(r.necessarioMes, lang)}<span style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted }}> / {L.mes}</span></span>
        <span style={{ fontSize: '14px', fontWeight: 700, color: t.textMuted, fontFamily: t.fontNum }}>{eur(r.necessarioAno, lang)}<span style={{ fontSize: '11px', fontWeight: 600 }}> / {L.ano}</span></span>
      </div>
    </>
  )
}

// ── 2.2.1 Necessidade de capital ───────────────────────────────────────────
export function Capital({ numeros, alterar }) {
  const { t } = useTheme(); const { lang } = useLang(); const isMobile = useIsMobile()
  const L = lang === 'de' ? { inv: 'Investitionen', con: 'Gründungskosten', res: 'Reserve', meses: 'Monate lfd. Kosten', sug: 'Vorschlag aus Block 4', total: 'Kapitalbedarf gesamt', usarSug: 'Vorschlag übernehmen' }
        : lang === 'en' ? { inv: 'Investments', con: 'Setup costs', res: 'Reserve', meses: 'months of running costs', sug: 'suggested from block 4', total: 'Total capital needed', usarSug: 'Use suggestion' }
        : { inv: 'Investimentos', con: 'Custos de constituição', res: 'Reserva', meses: 'meses de custos correntes', sug: 'sugestão a partir do bloco 4', total: 'Necessidade total de capital', usarSug: 'Usar sugestão' }
  const cap = numeros?.capital || {}
  const custosAno1 = projecao(numeros?.projecao).custosAno1
  const c = necessidadeCapital(cap, custosAno1)
  const set = (campo, v) => alterar({ numeros: { ...numeros, capital: { ...cap, [campo]: v } } })
  const inputStyle = { padding: '8px 10px', borderRadius: '7px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '13.5px', outline: 'none', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
        <TabelaLinhas titulo={L.inv} linhas={cap.investimentos} chavePadrao="investimentos" onChange={v => set('investimentos', v)} />
        <TabelaLinhas titulo={L.con} linhas={cap.constituicao} chavePadrao="constituicao" onChange={v => set('constituicao', v)} />
      </div>
      <div style={{ background: t.softCardBg, borderRadius: '11px', padding: '12px 14px', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', fontWeight: 800, color: t.heading }}>{L.res}</span>
        <input value={cap.reservaMeses ?? 3} onChange={e => set('reservaMeses', e.target.value)} style={{ ...inputStyle, width: '46px' }} />
        <span style={{ fontSize: '11.5px', color: t.textMuted }}>{L.meses}</span>
        <input value={cap.reserva ?? ''} onChange={e => set('reserva', e.target.value)} placeholder={String(Math.round(c.reservaSugerida))} style={{ ...inputStyle, width: '110px', marginLeft: 'auto' }} />
        {custosAno1 > 0 && (cap.reserva === '' || cap.reserva === undefined) && (
          <span style={{ fontSize: '10.5px', color: t.subtle }}>{L.sug}: {eur(c.reservaSugerida, lang)}</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: t.chipBg, borderRadius: '11px', padding: '13px 16px', marginTop: '12px' }}>
        <span style={{ fontSize: '12px', fontWeight: 800, color: t.chipText, textTransform: 'uppercase', letterSpacing: '.5px' }}>{L.total}</span>
        <span style={{ marginLeft: 'auto', fontSize: '20px', fontWeight: 800, color: t.heading, fontFamily: t.fontNum }}>{eur(c.total, lang)}</span>
      </div>
    </>
  )
}

// ── 2.2.2 Financiamento ────────────────────────────────────────────────────
export function Financiamento({ numeros, alterar }) {
  const { t } = useTheme(); const { lang } = useLang(); const isMobile = useIsMobile()
  const L = lang === 'de' ? { pro: 'Eigenkapital', alh: 'Fremdkapital', total: 'Finanzierung gesamt', amort: 'Tilgung pro Jahr',
        ok: 'Die Finanzierung deckt den Kapitalbedarf.', falta: 'Es fehlen', sobra: 'Überdeckung' }
        : lang === 'en' ? { pro: 'Own capital', alh: 'External capital', total: 'Total financing', amort: 'Repayment per year',
        ok: 'Financing covers the capital needed.', falta: 'Missing', sobra: 'Surplus' }
        : { pro: 'Capital próprio', alh: 'Capital alheio', total: 'Financiamento total', amort: 'Amortização por ano',
        ok: 'O financiamento cobre a necessidade de capital.', falta: 'Faltam', sobra: 'Excedente' }
  const fin = numeros?.financiamento || {}
  const capTotal = necessidadeCapital(numeros?.capital, projecao(numeros?.projecao).custosAno1).total
  const f = financiamento(fin, capTotal)
  const set = (campo, v) => alterar({ numeros: { ...numeros, financiamento: { ...fin, [campo]: v } } })
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
        <TabelaLinhas titulo={L.pro} linhas={fin.proprio} chavePadrao="proprio" onChange={v => set('proprio', v)} cor={t.dueOk.ink} />
        <TabelaLinhas titulo={L.alh} linhas={fin.alheio} chavePadrao="alheio" onChange={v => set('alheio', v)} cor={t.toneBlue?.ink || t.heading} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', background: t.softCardBg, borderRadius: '11px', padding: '12px 14px', marginTop: '12px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: t.textMuted }}>{L.amort}</span>
        <input value={fin.amortizacaoAno ?? ''} onChange={e => set('amortizacaoAno', e.target.value)} inputMode="decimal"
          style={{ padding: '8px 10px', borderRadius: '7px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '13.5px', outline: 'none', width: '110px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }} />
        <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 800, color: t.chipText, textTransform: 'uppercase', letterSpacing: '.5px' }}>{L.total}</span>
        <span style={{ fontSize: '18px', fontWeight: 800, color: t.heading, fontFamily: t.fontNum }}>{eur(f.total, lang)}</span>
      </div>
      <Semaforo ok={f.cobre} titulo={f.cobre ? L.ok : `${L.falta} ${eur(Math.abs(f.diferenca), lang)}`}
        detalhe={`${eur(f.total, lang)} / ${eur(capTotal, lang)}${f.cobre && f.diferenca > 0 ? ` · ${L.sobra} ${eur(f.diferenca, lang)}` : ''}`} />
    </>
  )
}

// ── 2.2.3 Projeção a 3 anos ────────────────────────────────────────────────
export function Projecao({ numeros, alterar }) {
  const { t } = useTheme(); const { lang } = useLang()
  const L = lang === 'de' ? { rec: 'Umsatz (netto)', cus: 'Kosten', luc: 'Gewinn', ano: 'Jahr', add: '+ Zeile', desc: 'Bezeichnung',
        cobre: 'Der Gewinn deckt Privatentnahmen und Tilgung.', naoCobre: 'Der Gewinn reicht nicht', exigido: 'benötigt' }
        : lang === 'en' ? { rec: 'Revenue (net)', cus: 'Costs', luc: 'Profit', ano: 'Year', add: '+ Row', desc: 'Description',
        cobre: 'Profit covers private withdrawals and repayments.', naoCobre: 'Profit is not enough', exigido: 'required' }
        : { rec: 'Faturação (líquida)', cus: 'Custos', luc: 'Lucro', ano: 'Ano', add: '+ Linha', desc: 'Descrição',
        cobre: 'O lucro cobre as retiradas privadas e as amortizações.', naoCobre: 'O lucro não chega', exigido: 'exigido' }

  const proj = numeros?.projecao || {}
  const p = projecao(proj)
  const retAno = retiradasPrivadas(numeros?.privadas).necessarioAno
  const amort = Number(numeros?.financiamento?.amortizacaoAno) || 0
  const v = verificacaoLucro(proj, retAno, amort)

  const set = (campo, v2) => alterar({ numeros: { ...numeros, projecao: { ...proj, [campo]: v2 } } })
  const rows = (campo) => (proj[campo] && proj[campo].length)
    ? proj[campo] : linhasPadrao(campo, lang).map(l => ({ desc: l.desc, valores: Array(ANOS).fill('') }))
  const setCell = (campo, i, ai, val) => {
    const r = rows(campo).map((l, idx) => idx === i ? { ...l, valores: Object.assign([...(l.valores || Array(ANOS).fill(''))], { [ai]: val }) } : l)
    set(campo, r)
  }
  const setDesc = (campo, i, val) => set(campo, rows(campo).map((l, idx) => idx === i ? { ...l, desc: val } : l))

  const inp = { padding: '5px 7px', borderRadius: '6px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '12px', outline: 'none', width: '100%', boxSizing: 'border-box', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }
  const GRID = 'minmax(120px, 1fr) 92px 92px 92px 22px'

  const Tabela = ({ campo, titulo, cor }) => (
    <div style={{ background: t.softCardBg, borderRadius: '11px', padding: '12px 14px', marginBottom: '10px' }}>
      <div style={{ fontSize: '12px', fontWeight: 800, color: cor, marginBottom: '9px' }}>{titulo}</div>
      <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: '6px', marginBottom: '5px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase' }}>{L.desc}</span>
        {[1, 2, 3].map(a => <span key={a} style={{ fontSize: '10px', fontWeight: 700, color: t.textMuted, textAlign: 'right' }}>{L.ano} {a}</span>)}
        <span />
      </div>
      {rows(campo).map((l, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: GRID, gap: '6px', marginBottom: '5px' }}>
          <input value={l.desc || ''} onChange={e => setDesc(campo, i, e.target.value)} style={{ ...inp, textAlign: 'left', fontWeight: 400, fontFamily: t.fontBody }} />
          {[0, 1, 2].map(ai => <input key={ai} value={l.valores?.[ai] ?? ''} onChange={e => setCell(campo, i, ai, e.target.value)} inputMode="decimal" style={inp} />)}
          <button onClick={() => set(campo, rows(campo).filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: t.subtle, cursor: 'pointer', fontSize: '12px', padding: 0 }}>✕</button>
        </div>
      ))}
      <button onClick={() => set(campo, [...rows(campo), { desc: '', valores: Array(ANOS).fill('') }])}
        style={{ background: 'none', border: 'none', color: t.accentText, fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', padding: '4px 0' }}>{L.add}</button>
    </div>
  )

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: '460px' }}>
        <Tabela campo="receitas" titulo={L.rec} cor={t.dueOk.ink} />
        <Tabela campo="custos" titulo={L.cus} cor={t.neg} />

        {/* Lucro por ano + a verificação que fecha o plano */}
        <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: '6px', background: t.chipBg, borderRadius: '11px', padding: '12px 14px' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: t.chipText, textTransform: 'uppercase', letterSpacing: '.5px' }}>{L.luc}</span>
          {v.map(a => (
            <span key={a.ano} style={{ textAlign: 'right', fontSize: '14px', fontWeight: 800, fontFamily: t.fontNum, color: a.lucro >= 0 ? t.heading : t.neg }}>{eur(a.lucro, lang)}</span>
          ))}
          <span />
        </div>

        {(retAno > 0 || amort > 0) && v.map(a => (
          <Semaforo key={a.ano} ok={a.cobre}
            titulo={`${L.ano} ${a.ano} — ${a.cobre ? L.cobre : L.naoCobre}`}
            detalhe={`${L.luc} ${eur(a.lucro, lang)} · ${L.exigido} ${eur(a.exigido, lang)} (${eur(retAno, lang)} + ${eur(amort, lang)})`} />
        ))}
      </div>
    </div>
  )
}

// ── 2.3 Liquidez (12 meses do ano 1) ───────────────────────────────────────
export function Liquidez({ numeros, alterar }) {
  const { t } = useTheme(); const { lang } = useLang()
  const MESES = lang === 'de' ? ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez']
    : lang === 'en' ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    : ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  const L = lang === 'de' ? { ini: 'Anfangsbestand', ent: 'Einzahlungen', sai: 'Auszahlungen', sal: 'Saldo',
        ok: 'Der Saldo bleibt das ganze Jahr positiv.', neg: 'Der Saldo wird negativ im Monat' }
        : lang === 'en' ? { ini: 'Opening balance', ent: 'Cash in', sai: 'Cash out', sal: 'Balance',
        ok: 'The balance stays positive all year.', neg: 'The balance goes negative in month' }
        : { ini: 'Saldo inicial', ent: 'Entradas', sai: 'Saídas', sal: 'Saldo',
        ok: 'O saldo mantém-se positivo todo o ano.', neg: 'O saldo fica negativo no mês' }

  const liq = numeros?.liquidez || {}
  const r = liquidez(liq)
  const set = (campo, v) => alterar({ numeros: { ...numeros, liquidez: { ...liq, [campo]: v } } })
  const setMes = (campo, i, v) => {
    const arr = [...(liq[campo] || Array(12).fill(''))]; arr[i] = v
    set(campo, arr)
  }
  const inp = { padding: '5px 4px', borderRadius: '6px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '11.5px', outline: 'none', width: '100%', boxSizing: 'border-box', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700 }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: t.textMuted }}>{L.ini}</span>
        <input value={liq.saldoInicial ?? ''} onChange={e => set('saldoInicial', e.target.value)} inputMode="decimal"
          style={{ ...inp, width: '110px', flex: 'none' }} />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: '780px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `84px repeat(12, 1fr)`, gap: '4px', marginBottom: '5px' }}>
            <span />
            {MESES.map(m => <span key={m} style={{ fontSize: '10px', fontWeight: 700, color: t.textMuted, textAlign: 'center' }}>{m}</span>)}
          </div>
          {[['entradas', L.ent, t.dueOk.ink], ['saidas', L.sai, t.neg]].map(([campo, rot, cor]) => (
            <div key={campo} style={{ display: 'grid', gridTemplateColumns: `84px repeat(12, 1fr)`, gap: '4px', marginBottom: '5px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: cor }}>{rot}</span>
              {Array.from({ length: 12 }, (_, i) => (
                <input key={i} value={liq[campo]?.[i] ?? ''} onChange={e => setMes(campo, i, e.target.value)} inputMode="decimal" style={inp} />
              ))}
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: `84px repeat(12, 1fr)`, gap: '4px', background: t.chipBg, borderRadius: '9px', padding: '8px 6px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: t.chipText }}>{L.sal}</span>
            {r.meses.map(m => (
              <span key={m.mes} style={{ fontSize: '11px', fontWeight: 800, textAlign: 'right', fontFamily: t.fontNum, color: m.saldo < 0 ? t.neg : t.heading }}>
                {Math.round(m.saldo).toLocaleString(lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-GB' : 'pt-PT')}
              </span>
            ))}
          </div>
        </div>
      </div>
      <Semaforo ok={r.ok} titulo={r.ok ? L.ok : `${L.neg} ${r.negativos[0]?.mes} (${MESES[(r.negativos[0]?.mes || 1) - 1]})`}
        detalhe={`${L.sal} ${eur(r.saldoFinal, lang)}`} />
    </>
  )
}
