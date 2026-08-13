import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { useEffectiveUserId, useViewAs } from '../../context/ViewAsContext'
import { parseCSV, extrairMovimentos, conciliar, movimentoParaLancamento } from '../../lib/extratoBancario'

// Conciliação caixa/banco a partir do extrato.
// Decisão da reunião de 13/08: ficheiro em vez de integração bancária.
//
// O princípio que guia o ecrã: a máquina propõe, a pessoa decide. Só o que é
// inequívoco (mesmo valor, mesmo dia, sem outro candidato igual) se concilia
// sozinho — tudo o resto passa pelas mãos dela.

export default function Conciliacao() {
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const eid = useEffectiveUserId()
  const { isViewing } = useViewAs()
  const inputRef = useRef(null)

  const [txs, setTxs] = useState([])
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [aLer, setALer] = useState(false)
  const [previa, setPrevia] = useState(null)     // { movimentos, mapa, ficheiro, ... }
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [aba, setAba] = useState('pendente')

  const L = lang === 'de' ? {
    eyebrow: 'Buchhaltung', title: 'Abstimmung Kasse/Bank',
    subtitle: 'Kontoauszug importieren (CSV oder Excel) und mit dem Kassenbuch abgleichen.',
    escolher: '📄 Datei wählen', aLer: 'Wird gelesen…', importar: 'Importieren', cancelar: 'Abbrechen',
    detetado: 'Erkanntes Format', linhas: 'Zeilen', novos: 'neu', repetidos: 'bereits importiert',
    pendente: 'Offen', conciliado: 'Abgestimmt', ignorado: 'Ignoriert', semExtrato: 'Nicht im Auszug',
    sugestao: 'Vorschlag', conciliar: 'Abstimmen', criar: 'Buchung anlegen', ignorar: 'Ignorieren',
    desfazer: 'Rückgängig', confianca: 'Sicherheit', ambiguo: 'Mehrere gleiche Buchungen — bitte prüfen',
    vazio: 'Noch kein Auszug importiert.', tudoOk: 'Alles abgestimmt ✓',
    semExtratoAjuda: 'Bankbuchungen im Kassenbuch, die im Auszug fehlen.',
    loading: 'Wird geladen…', erroFormato: 'Format nicht erkannt. Prüfen Sie, ob die Datei Datum, Beschreibung und Betrag enthält.',
    erroVazio: 'Keine Buchungen in der Datei gefunden.', semAlteracoes: 'Alle Buchungen waren bereits importiert.',
    verComo: 'Im Ansichtsmodus nicht möglich.',
  } : lang === 'en' ? {
    eyebrow: 'Accounting', title: 'Cash/bank reconciliation',
    subtitle: 'Import a bank statement (CSV or Excel) and match it against the cash book.',
    escolher: '📄 Choose file', aLer: 'Reading…', importar: 'Import', cancelar: 'Cancel',
    detetado: 'Detected format', linhas: 'rows', novos: 'new', repetidos: 'already imported',
    pendente: 'Pending', conciliado: 'Matched', ignorado: 'Ignored', semExtrato: 'Not in statement',
    sugestao: 'Suggestion', conciliar: 'Match', criar: 'Create entry', ignorar: 'Ignore',
    desfazer: 'Undo', confianca: 'confidence', ambiguo: 'Several identical entries — please check',
    vazio: 'No statement imported yet.', tudoOk: 'Everything matched ✓',
    semExtratoAjuda: 'Bank entries in the cash book that are missing from the statement.',
    loading: 'Loading…', erroFormato: 'Format not recognised. Check the file has date, description and amount.',
    erroVazio: 'No transactions found in the file.', semAlteracoes: 'Every transaction was already imported.',
    verComo: 'Not available in view-as mode.',
  } : {
    eyebrow: 'Contabilidade', title: 'Conciliação caixa/banco',
    subtitle: 'Importa o extrato bancário (CSV ou Excel) e cruza-o com o Livro de Caixa.',
    escolher: '📄 Escolher ficheiro', aLer: 'A ler…', importar: 'Importar', cancelar: 'Cancelar',
    detetado: 'Formato detetado', linhas: 'linhas', novos: 'novos', repetidos: 'já importados',
    pendente: 'Por conciliar', conciliado: 'Conciliados', ignorado: 'Ignorados', semExtrato: 'Não constam do extrato',
    sugestao: 'Sugestão', conciliar: 'Conciliar', criar: 'Criar lançamento', ignorar: 'Ignorar',
    desfazer: 'Desfazer', confianca: 'confiança', ambiguo: 'Há vários lançamentos iguais — confirma qual',
    vazio: 'Ainda não importaste nenhum extrato.', tudoOk: 'Está tudo conciliado ✓',
    semExtratoAjuda: 'Lançamentos de banco no Livro de Caixa que não aparecem no extrato.',
    loading: 'A carregar…', erroFormato: 'Não reconheci o formato. Confirma que o ficheiro tem data, descrição e valor.',
    erroVazio: 'Não encontrei movimentos no ficheiro.', semAlteracoes: 'Todos os movimentos já tinham sido importados.',
    verComo: 'Não disponível no modo "ver como".',
  }

  const fmt = (v) => (Number(v) || 0).toLocaleString(lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-GB' : 'pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const dataFmt = (d) => new Date(d).toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-GB' : 'pt-PT')

  const load = useCallback(async () => {
    if (!eid) return
    setLoading(true)
    const [tx, ce] = await Promise.all([
      supabase.from('bank_transactions').select('*').eq('user_id', eid).order('tx_date', { ascending: false }),
      supabase.from('cash_entries').select('id,entry_date,description,type,amount,destination').eq('user_id', eid).eq('destination', 'banco'),
    ])
    setTxs(tx.data || []); setEntries(ce.data || []); setLoading(false)
  }, [eid])
  useEffect(() => { load() }, [load])

  // Sugestões recalculadas sobre o que ainda está pendente
  const { sugestoes, entriesSemPar } = useMemo(() => {
    const pendentes = txs.filter(x => x.status === 'pendente')
      .map(x => ({ fingerprint: x.fingerprint, data: x.tx_date, descricao: x.description, valor: Number(x.amount), tipo: x.type }))
    const jaUsados = new Set(txs.filter(x => x.cash_entry_id).map(x => x.cash_entry_id))
    const livres = entries.filter(e => !jaUsados.has(e.id))
    const r = conciliar(pendentes, livres)
    return { sugestoes: r.sugestoes, entriesSemPar: r.entriesSemPar }
  }, [txs, entries])

  const entryById = useMemo(() => Object.fromEntries(entries.map(e => [e.id, e])), [entries])

  // ── Ler o ficheiro (no browser; nada sobe sem ela confirmar) ──
  async function lerFicheiro(file) {
    if (!file) return
    setErro(''); setAviso(''); setALer(true); setPrevia(null)
    try {
      let linhas
      if (/\.xlsx?$/i.test(file.name)) {
        // Só se carrega o leitor de Excel quando é mesmo preciso
        const { default: readXlsxFile } = await import('read-excel-file/browser')
        const rows = await readXlsxFile(file)
        linhas = rows.map(r => r.map(c => (c instanceof Date ? c.toISOString().slice(0, 10) : String(c ?? '').trim())))
          .filter(r => r.some(c => c !== ''))
      } else {
        linhas = parseCSV(await file.text())
      }
      const r = extrairMovimentos(linhas)
      if (r.erro === 'formato') { setErro(L.erroFormato); return }
      if (r.erro === 'vazio' || !r.movimentos.length) { setErro(L.erroVazio); return }
      setPrevia({ ...r, ficheiro: file.name })
    } catch (e) {
      setErro(e.message || L.erroFormato)
    } finally {
      setALer(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  // ── Gravar o extrato ──
  async function importar() {
    if (isViewing) { setErro(L.verComo); return }
    const { movimentos, ficheiro } = previa
    const datas = movimentos.map(m => m.data).sort()
    const { data: imp, error: e1 } = await supabase.from('bank_imports').insert({
      user_id: eid, filename: ficheiro, period_start: datas[0], period_end: datas[datas.length - 1],
      total_rows: movimentos.length,
    }).select('id').single()
    if (e1) { setErro(e1.message); return }

    // O índice único (user_id, fingerprint) faz o resto: reimportar é inofensivo
    const { data: inseridos, error: e2 } = await supabase.from('bank_transactions')
      .upsert(movimentos.map(m => ({
        user_id: eid, import_id: imp.id, tx_date: m.data, description: m.descricao,
        amount: m.valor, type: m.tipo, balance: m.saldo, fingerprint: m.fingerprint,
        raw: { linha: m.raw },
      })), { onConflict: 'user_id,fingerprint', ignoreDuplicates: true })
      .select('id')
    if (e2) { setErro(e2.message); return }

    const novos = (inseridos || []).length
    await supabase.from('bank_imports').update({ new_rows: novos }).eq('id', imp.id)
    if (novos === 0) setAviso(L.semAlteracoes)
    setPrevia(null); setAba('pendente'); load()
  }

  // ── Ações sobre um movimento ──
  async function conciliarCom(tx, entryId) {
    if (isViewing) return
    setTxs(prev => prev.map(x => x.id === tx.id ? { ...x, status: 'conciliado', cash_entry_id: entryId } : x))
    const { error } = await supabase.from('bank_transactions')
      .update({ status: 'conciliado', cash_entry_id: entryId, matched_at: new Date().toISOString() }).eq('id', tx.id)
    if (error) { setErro(error.message); load() }
  }
  async function marcar(tx, status) {
    if (isViewing) return
    setTxs(prev => prev.map(x => x.id === tx.id ? { ...x, status, cash_entry_id: null } : x))
    const { error } = await supabase.from('bank_transactions')
      .update({ status, cash_entry_id: null, matched_at: null }).eq('id', tx.id)
    if (error) { setErro(error.message); load() }
  }
  async function criarLancamento(tx) {
    if (isViewing) return
    const novo = movimentoParaLancamento({ data: tx.tx_date, descricao: tx.description, valor: Number(tx.amount), tipo: tx.type })
    const { data, error } = await supabase.from('cash_entries').insert({ ...novo, user_id: eid }).select('id,entry_date,description,type,amount,destination').single()
    if (error) { setErro(error.message); return }
    setEntries(prev => [...prev, data])
    await conciliarCom(tx, data.id)
  }

  // Concilia de uma vez tudo o que é inequívoco
  async function conciliarAutomaticos() {
    if (isViewing) { setErro(L.verComo); return }
    const alvos = txs.filter(x => x.status === 'pendente')
      .map(x => ({ tx: x, s: sugestoes.get(x.fingerprint) }))
      .filter(({ s }) => s?.automatico)
    for (const { tx, s } of alvos) await conciliarCom(tx, s.entryId)
  }

  const porStatus = (s) => txs.filter(x => x.status === s)
  const pendentes = porStatus('pendente')
  const nAutomaticos = pendentes.filter(x => sugestoes.get(x.fingerprint)?.automatico).length

  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px' }
  const btn = { padding: '6px 12px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', border: 'none' }

  if (loading) return <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.loading}</div>

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody, maxWidth: '1020px' }}>
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accent }}>{L.eyebrow}</div>
        <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '27px' : '34px', lineHeight: 1.05, letterSpacing: '-.5px', color: t.heading }}>{L.title}</h1>
        <p style={{ fontSize: '12.5px', color: t.textMuted, margin: '8px 0 0', maxWidth: '560px', lineHeight: 1.5 }}>{L.subtitle}</p>
      </div>

      {erro && <div style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '10px', padding: '11px 15px', fontSize: '12.5px', fontWeight: 600, marginBottom: '14px' }}>{erro}</div>}
      {aviso && <div style={{ background: t.chipBg, color: t.chipText, borderRadius: '10px', padding: '11px 15px', fontSize: '12.5px', fontWeight: 600, marginBottom: '14px' }}>{aviso}</div>}

      {/* Importar */}
      {!previa && (
        <div style={{ ...card, padding: '18px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <input ref={inputRef} type="file" accept=".csv,.txt,.xlsx,.xls" onChange={e => lerFicheiro(e.target.files?.[0])} style={{ display: 'none' }} />
          <button onClick={() => inputRef.current?.click()} disabled={aLer || isViewing}
            style={{ ...btn, padding: '10px 20px', fontSize: '13px', background: t.btnBg, color: t.btnInk, opacity: aLer || isViewing ? .55 : 1 }}>
            {aLer ? L.aLer : L.escolher}
          </button>
          <span style={{ fontSize: '11.5px', color: t.subtle }}>CSV · Excel</span>
        </div>
      )}

      {/* Pré-visualização antes de gravar */}
      {previa && (
        <div style={{ ...card, padding: '18px 20px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: t.heading, marginBottom: '4px' }}>{previa.ficheiro}</div>
          <div style={{ fontSize: '11.5px', color: t.textMuted, marginBottom: '12px' }}>
            {L.detetado}: {previa.movimentos.length} {L.linhas}
            {previa.duplicadosNoFicheiro ? ` · ${previa.duplicadosNoFicheiro} repetidas no ficheiro` : ''}
            {previa.ignoradas ? ` · ${previa.ignoradas} sem data ou valor` : ''}
          </div>
          <div style={{ background: t.softCardBg, borderRadius: '10px', padding: '10px 12px', marginBottom: '12px', maxHeight: '190px', overflowY: 'auto' }}>
            {previa.movimentos.slice(0, 8).map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '11.5px', padding: '3px 0', color: t.text }}>
                <span style={{ flex: 'none', width: '78px', color: t.subtle, fontFamily: t.fontNum }}>{dataFmt(m.data)}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.descricao}</span>
                <span style={{ flex: 'none', fontFamily: t.fontNum, fontWeight: 700, color: m.tipo === 'entrada' ? t.dueOk.ink : t.neg }}>
                  {m.tipo === 'entrada' ? '+' : '−'}{fmt(m.valor)}
                </span>
              </div>
            ))}
            {previa.movimentos.length > 8 && <div style={{ fontSize: '11px', color: t.subtle, marginTop: '5px' }}>+{previa.movimentos.length - 8}…</div>}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={importar} style={{ ...btn, padding: '10px 20px', fontSize: '13px', background: t.btnBg, color: t.btnInk }}>{L.importar}</button>
            <button onClick={() => setPrevia(null)} style={{ ...btn, padding: '10px 16px', fontSize: '13px', background: t.segBg, border: `1px solid ${t.segBorder}`, color: t.textMuted }}>{L.cancelar}</button>
          </div>
        </div>
      )}

      {!txs.length && !previa && (
        <div style={{ ...card, padding: '34px 28px', textAlign: 'center' }}>
          <div style={{ fontSize: '34px', marginBottom: '10px' }}>🏦</div>
          <div style={{ fontSize: '14px', color: t.textMuted }}>{L.vazio}</div>
        </div>
      )}

      {!!txs.length && (
        <>
          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'center' }}>
            {[['pendente', pendentes.length], ['conciliado', porStatus('conciliado').length], ['ignorado', porStatus('ignorado').length], ['semExtrato', entriesSemPar.length]].map(([k, n]) => (
              <button key={k} onClick={() => setAba(k)} style={{
                padding: '7px 14px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${aba === k ? t.accent : t.cardBorder}`,
                background: aba === k ? t.softCardBg : 'transparent', color: aba === k ? t.accent : t.textMuted,
              }}>{L[k]} ({n})</button>
            ))}
            {aba === 'pendente' && nAutomaticos > 0 && (
              <button onClick={conciliarAutomaticos} disabled={isViewing}
                style={{ ...btn, marginLeft: 'auto', padding: '8px 15px', fontSize: '12px', background: t.btnBg, color: t.btnInk, opacity: isViewing ? .55 : 1 }}>
                ⚡ {L.conciliar} {nAutomaticos}
              </button>
            )}
          </div>

          {/* Lançamentos que não constam do extrato */}
          {aba === 'semExtrato' ? (
            <div style={{ ...card, padding: '18px 20px' }}>
              <p style={{ fontSize: '11.5px', color: t.subtle, margin: '0 0 12px' }}>ⓘ {L.semExtratoAjuda}</p>
              {!entriesSemPar.length && <div style={{ fontSize: '13px', color: t.textMuted }}>{L.tudoOk}</div>}
              {entriesSemPar.map(e => (
                <div key={e.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '8px 0', borderTop: `1px solid ${t.rowBorder || t.cardBorder}`, fontSize: '12.5px' }}>
                  <span style={{ flex: 'none', width: '82px', color: t.subtle, fontFamily: t.fontNum }}>{dataFmt(e.entry_date)}</span>
                  <span style={{ flex: 1, color: t.text }}>{e.description}</span>
                  <span style={{ fontFamily: t.fontNum, fontWeight: 700, color: e.type === 'entrada' ? t.dueOk.ink : t.neg }}>
                    {e.type === 'entrada' ? '+' : '−'}{fmt(e.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <>
              {!porStatus(aba).length && (
                <div style={{ ...card, padding: '28px', textAlign: 'center', fontSize: '13px', color: t.textMuted }}>
                  {aba === 'pendente' ? L.tudoOk : '—'}
                </div>
              )}
              {porStatus(aba).map(tx => {
                const s = sugestoes.get(tx.fingerprint)
                const sug = s ? entryById[s.entryId] : null
                const ligado = tx.cash_entry_id ? entryById[tx.cash_entry_id] : null
                return (
                  <div key={tx.id} style={{ ...card, padding: '14px 17px', marginBottom: '9px' }}>
                    <div style={{ display: 'flex', gap: '11px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ flex: 'none', fontSize: '11.5px', color: t.subtle, fontFamily: t.fontNum, width: '78px' }}>{dataFmt(tx.tx_date)}</span>
                      <span style={{ flex: 1, minWidth: '160px', fontSize: '13px', fontWeight: 600, color: t.heading }}>{tx.description}</span>
                      <span style={{ fontSize: '14px', fontWeight: 800, fontFamily: t.fontNum, color: tx.type === 'entrada' ? t.dueOk.ink : t.neg }}>
                        {tx.type === 'entrada' ? '+' : '−'}{fmt(tx.amount)}
                      </span>
                    </div>

                    {/* Já conciliado: mostra com quê */}
                    {tx.status === 'conciliado' && (
                      <div style={{ display: 'flex', gap: '9px', alignItems: 'center', flexWrap: 'wrap', marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${t.rowBorder || t.cardBorder}` }}>
                        <span style={{ fontSize: '11.5px', color: t.dueOk.ink, fontWeight: 700 }}>✓ {ligado ? `${dataFmt(ligado.entry_date)} · ${ligado.description}` : '—'}</span>
                        {!isViewing && <button onClick={() => marcar(tx, 'pendente')} style={{ ...btn, marginLeft: 'auto', background: 'none', color: t.subtle, textDecoration: 'underline', padding: 0 }}>{L.desfazer}</button>}
                      </div>
                    )}

                    {/* Pendente: sugestão + decisões */}
                    {tx.status === 'pendente' && (
                      <div style={{ marginTop: '9px', paddingTop: '9px', borderTop: `1px solid ${t.rowBorder || t.cardBorder}` }}>
                        {sug && (
                          <div style={{ background: s.ambiguo ? t.dueSoon.bg : t.softCardBg, borderRadius: '9px', padding: '9px 11px', marginBottom: '8px' }}>
                            <div style={{ fontSize: '10px', fontWeight: 800, color: s.ambiguo ? t.dueSoon.ink : t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>
                              {L.sugestao} · {s.score}% {L.confianca}{s.automatico ? ' ⚡' : ''}
                            </div>
                            <div style={{ fontSize: '12.5px', color: t.text }}>{dataFmt(sug.entry_date)} · {sug.description} · {fmt(sug.amount)}</div>
                            {s.ambiguo && <div style={{ fontSize: '11px', color: t.dueSoon.ink, marginTop: '4px', fontWeight: 600 }}>⚠ {L.ambiguo}</div>}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                          {sug && <button onClick={() => conciliarCom(tx, sug.id)} disabled={isViewing} style={{ ...btn, background: t.btnBg, color: t.btnInk, opacity: isViewing ? .55 : 1 }}>{L.conciliar}</button>}
                          <button onClick={() => criarLancamento(tx)} disabled={isViewing} style={{ ...btn, background: t.segBg, border: `1px solid ${t.segBorder}`, color: t.heading, opacity: isViewing ? .55 : 1 }}>{L.criar}</button>
                          <button onClick={() => marcar(tx, 'ignorado')} disabled={isViewing} style={{ ...btn, background: 'none', color: t.subtle, opacity: isViewing ? .55 : 1 }}>{L.ignorar}</button>
                        </div>
                      </div>
                    )}

                    {tx.status === 'ignorado' && !isViewing && (
                      <div style={{ marginTop: '7px' }}>
                        <button onClick={() => marcar(tx, 'pendente')} style={{ ...btn, background: 'none', color: t.subtle, textDecoration: 'underline', padding: 0 }}>{L.desfazer}</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </>
      )}
    </div>
  )
}
