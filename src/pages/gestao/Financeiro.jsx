import { useState, useEffect, useCallback } from 'react'
import { IconFicheiro } from '../../components/Icones'
import EsqueletoPagina from '../../components/EsqueletoPagina'
import { localeDe } from '../../lib/formato'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { listUsers } from '../../lib/adminApi'
import { devidoNoPeriodo } from '../../lib/periodicidade'

// Financeiro da Gestão: contratos/mensalidades dos clientes da Lúcia e
// confirmação de recebimentos por mês (padrão igual às Despesas Recorrentes).

// O contrato é devido no período? Regra comum a avenças e despesas recorrentes.
export const isDueInPeriod = devidoNoPeriodo

// Ícone da conta ligada (substitui o emoji 🔗; 13-D, 13/10)
const IconConta = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: '-0.1em' }}>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </svg>
)

// cliente_id = ficha escolhida; semFicha = disse-se explicitamente que o
// cliente não tem ficha (só aí o nome é texto livre).
const EMPTY = { cliente_id: '', semFicha: false, client_name: '', user_id: '', service: '', amount: '', periodicity: 'monthly', start_month: new Date().toISOString().slice(0, 7), notes: '' }

export default function Financeiro() {
  const { lang } = useLang()
  const loc = localeDe(lang)
  const fmt = (n) => `€ ${(Number(n) || 0).toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const { t } = useTheme()
  const isMobile = useIsMobile()

  const [billing, setBilling] = useState([])
  const [payments, setPayments] = useState([])
  const [users, setUsers] = useState([])
  const [fichas, setFichas] = useState([])   // clientes da Gestão (portal)
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7))
  const [form, setForm] = useState(EMPTY)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [actuals, setActuals] = useState({})     // billing_id -> valor a confirmar
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [err, setErr] = useState('')

  const L = lang === 'de' ? {
    eyebrow: 'Verwaltung', title: 'Finanzen', subtitle: 'Verträge und Zahlungseingänge Ihrer Mandanten — pro Monat bestätigen.',
    received: 'Erhalten (Monat)', pendingK: 'Ausstehend',
    contractsT: 'Verträge', monthT: 'Eingänge im Monat', new: '+ Neuer Vertrag',
    client: 'Mandant', linkUser: 'Plattform-Nutzer (optional)', none: '— keiner —', service: 'Leistung',
    escolherFicha: '— Mandantenakte wählen —', semFicha: '— Mandant ohne Akte —', nomeSemFicha: 'Name (ohne Akte)',
    contaDaFicha: 'Plattform-Konto aus der Akte', inactive: 'Inaktiv', toggleHint: 'Klicken zum Umschalten', cancel: 'Abbrechen',
    contrato: 'Vertrag', anexar: 'PDF anhängen', verContrato: 'Vertrag öffnen', trocar: 'Ersetzen',
    semContrato: 'kein Vertrag', erroAnexo: 'Datei konnte nicht hochgeladen werden.',
    amount: 'Betrag (€)', periodicity: 'Häufigkeit', monthly: 'Monatlich', quarterly: 'Vierteljährlich',
    annual: 'Jährlich', once: 'Einmalig', startM: 'Beginn', notes: 'Notizen', active: 'Aktiv',
    save: 'Speichern', edit: 'Bearbeiten', del: 'Löschen', confirm: 'Bestätigen', confirmed: 'Erhalten ✓', undo: 'Rückgängig',
    noDue: 'In diesem Monat ist nichts fällig.', noContracts: 'Noch keine Verträge.',
    loading: 'Wird geladen…', confirmDel: (n) => `Vertrag von „${n}" löschen?`, saveErr: 'Fehler (Migration 021 nötig).',
    servicePh: 'z.B. Plattform, ESG-Beratung…',
  } : lang === 'en' ? {
    eyebrow: 'Management', title: 'Finance', subtitle: 'Your clients\' contracts and incoming payments — confirm month by month.',
    received: 'Received (month)', pendingK: 'Outstanding',
    contractsT: 'Contracts', monthT: 'Payments this month', new: '+ New contract',
    client: 'Client', linkUser: 'Platform user (optional)', none: '— none —', service: 'Service',
    escolherFicha: '— choose the client file —', semFicha: '— client without a file —', nomeSemFicha: 'Name (no file)',
    contaDaFicha: 'Platform account from the file', inactive: 'Inactive', toggleHint: 'Click to switch', cancel: 'Cancel',
    contrato: 'Contract', anexar: 'Attach PDF', verContrato: 'Open contract', trocar: 'Replace',
    semContrato: 'no contract', erroAnexo: 'Could not upload the file.',
    amount: 'Amount (€)', periodicity: 'Frequency', monthly: 'Monthly', quarterly: 'Quarterly',
    annual: 'Yearly', once: 'One-off', startM: 'Start', notes: 'Notes', active: 'Active',
    save: 'Save', edit: 'Edit', del: 'Delete', confirm: 'Confirm', confirmed: 'Received ✓', undo: 'Undo',
    noDue: 'Nothing due this month.', noContracts: 'No contracts yet.',
    loading: 'Loading…', confirmDel: (n) => `Delete contract of "${n}"?`, saveErr: 'Error (migration 021 required).',
    servicePh: 'e.g. Platform, ESG consulting…',
  } : {
    eyebrow: 'Gestão', title: 'Financeiro', subtitle: 'Contratos e recebimentos dos teus clientes — confirma mês a mês.',
    received: 'Recebido (mês)', pendingK: 'Por receber',
    contractsT: 'Contratos', monthT: 'Recebimentos do mês', new: '+ Novo contrato',
    client: 'Cliente', linkUser: 'Utilizador da plataforma (opcional)', none: '— nenhum —', service: 'Serviço',
    escolherFicha: '— escolher a ficha do cliente —', semFicha: '— cliente sem ficha —', nomeSemFicha: 'Nome (sem ficha)',
    contaDaFicha: 'Conta na plataforma da ficha', inactive: 'Inativo', toggleHint: 'Clicar para alternar', cancel: 'Cancelar',
    contrato: 'Contrato', anexar: 'Anexar PDF', verContrato: 'Abrir contrato', trocar: 'Substituir',
    semContrato: 'sem contrato', erroAnexo: 'N\u00e3o foi poss\u00edvel carregar o ficheiro.',
    amount: 'Valor (€)', periodicity: 'Periodicidade', monthly: 'Mensal', quarterly: 'Trimestral',
    annual: 'Anual', once: 'Pontual', startM: 'Início', notes: 'Notas', active: 'Ativo',
    save: 'Guardar', edit: 'Editar', del: 'Eliminar', confirm: 'Confirmar', confirmed: 'Recebido ✓', undo: 'Anular',
    noDue: 'Nada previsto para este mês.', noContracts: 'Ainda não há contratos.',
    loading: 'A carregar…', confirmDel: (n) => `Eliminar o contrato de "${n}"?`, saveErr: 'Erro (é necessária a migração 021).',
    servicePh: 'ex: Plataforma, Consultoria ESG…',
  }
  const perLabel = { monthly: L.monthly, quarterly: L.quarterly, annual: L.annual, once: L.once }

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    try {
      const [{ data: b, error: e1 }, { data: p, error: e2 }, us, { data: fx }] = await Promise.all([
        supabase.from('client_billing').select('*').order('created_at', { ascending: true }),
        supabase.from('billing_payments').select('*').eq('period', period),
        listUsers().catch(() => []),
        supabase.from('clientes').select('id,nome,user_id').order('nome'),
      ])
      setFichas(fx || [])
      if (e1 || e2) throw (e1 || e2)
      setBilling(b || []); setPayments(p || []); setUsers((us || []).filter(u => u.role !== 'admin'))
    } catch { setErr(L.saveErr) }
    setLoading(false)
  }, [period]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])

  // ── Derivados do mês ──
  const paidByBilling = Object.fromEntries(payments.map(p => [p.billing_id, p]))
  const dueThisMonth = billing.filter(b => b.active && isDueInPeriod(b, period))
  const received = dueThisMonth.reduce((s, b) => s + (paidByBilling[b.id] ? Number(paidByBilling[b.id].amount) : 0), 0)
  const outstanding = dueThisMonth.filter(b => !paidByBilling[b.id]).reduce((s, b) => s + Number(b.amount), 0)
  // "Previsto" e "Contratos ativos" saíram (13-D, 13/10): o previsto é Recebido +
  // Por receber, e a contagem vê-se na lista de contratos.
  const mesPorExtenso = (() => {
    const [y, m] = period.split('-').map(Number)
    if (!y || !m) return period
    return new Date(y, m - 1, 1).toLocaleDateString(loc, { month: 'long', year: 'numeric' })
  })()
  const fichaEscolhida = fichas.find(f => f.id === form.cliente_id) || null
  const contaDaFicha = !form.semFicha && fichaEscolhida?.user_id ? fichaEscolhida.user_id : null
  const podeGuardar = form.amount !== '' && (form.semFicha ? !!form.client_name.trim() : !!fichaEscolhida)

  // ── CRUD contratos ──
  async function saveContract() {
    if (!podeGuardar) return
    setErr('')
    // O contrato liga-se à ficha do cliente na Gestão — é daí que a página do
    // cliente lê a avença (portal/dados.js). Antes ligava pelo nome escrito à
    // mão, em silêncio, e um nome escrito de outra forma deixava a avença fora
    // da ficha (E3, 13/10). Agora escolhe-se a ficha; texto livre só quando se
    // marca "cliente sem ficha". A conta vem da ficha quando ela a tem.
    const ficha = form.semFicha ? null : fichaEscolhida
    const payload = {
      client_name: ficha ? ficha.nome : form.client_name.trim(),
      user_id: ficha?.user_id || form.user_id || null,
      cliente_id: ficha?.id || null,
      service: form.service || null, amount: parseFloat(form.amount) || 0,
      periodicity: form.periodicity, start_month: form.start_month || null, notes: form.notes || null,
    }
    const { error } = editingId
      ? await supabase.from('client_billing').update(payload).eq('id', editingId)
      : await supabase.from('client_billing').insert({ ...payload, active: true })
    if (error) { setErr(L.saveErr); return }
    setForm(EMPTY); setShowForm(false); setEditingId(null); load()
  }
  // O ✕ vivia na linha, a 4 px do ✎; passou para dentro da edição (13-D, 13/10)
  async function removeContract(b) {
    if (!window.confirm(L.confirmDel(b.client_name))) return
    const { error } = await supabase.from('client_billing').delete().eq('id', b.id)
    if (error) setErr(L.saveErr)
    setShowForm(false); setEditingId(null); setForm(EMPTY)
    load()
  }
  // ── Contrato em PDF ──────────────────────────────────────────────────────
  // Vai para a pasta do próprio cliente quando o contrato está ligado a uma
  // conta: assim ele vê-o no Início dele (política de leitura da migração 019)
  // e o ficheiro desaparece com o cliente quando este é eliminado. Sem conta
  // associada, fica numa pasta a que só a Lúcia chega.
  async function anexarContrato(b, file) {
    if (!file) return
    setBusyId(b.id); setErr('')
    const nome = file.name.replace(/[^\w.\-@ ]+/g, '_')
    const caminho = b.user_id ? `${b.user_id}/contratos/${nome}` : `contratos/${b.id}/${nome}`
    const { error: eUp } = await supabase.storage.from('client-docs').upload(caminho, file, { upsert: true })
    if (eUp) { setErr(L.erroAnexo); setBusyId(null); return }
    const { error } = await supabase.from('client_billing')
      .update({ contract_path: caminho, contract_name: file.name }).eq('id', b.id)
    if (error) setErr(L.erroAnexo)
    setBusyId(null); load()
  }

  // O bucket é privado: pede-se uma ligação temporária em vez de guardar URLs.
  async function abrirContrato(caminho) {
    const { data, error } = await supabase.storage.from('client-docs').createSignedUrl(caminho, 120)
    if (error || !data?.signedUrl) { setErr(L.erroAnexo); return }
    window.open(data.signedUrl, '_blank', 'noopener')
  }

  async function toggleActive(b) {
    const { error } = await supabase.from('client_billing').update({ active: !b.active }).eq('id', b.id)
    if (error) setErr(L.saveErr)
    load()
  }
  function openEdit(b) {
    setEditingId(b.id)
    setForm({ cliente_id: b.cliente_id || '', semFicha: !b.cliente_id, client_name: b.client_name, user_id: b.user_id || '', service: b.service || '', amount: String(b.amount), periodicity: b.periodicity, start_month: b.start_month || '', notes: b.notes || '' })
    setShowForm(true)
  }

  // ── Recebimentos ──
  async function confirmPayment(b) {
    const val = actuals[b.id] !== undefined && actuals[b.id] !== '' ? parseFloat(actuals[b.id]) : Number(b.amount)
    setBusyId(b.id)
    const { error } = await supabase.from('billing_payments').insert({ billing_id: b.id, period, amount: val })
    setBusyId(null)
    if (error) { setErr(L.saveErr); return }
    setActuals(a => ({ ...a, [b.id]: '' })); load()
  }
  async function undoPayment(b) {
    const p = paidByBilling[b.id]; if (!p) return
    setBusyId(b.id)
    const { error } = await supabase.from('billing_payments').delete().eq('id', p.id)
    setBusyId(null)
    if (error) setErr(L.saveErr)
    load()
  }

  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px' }
  const inputStyle = { padding: '8px 10px', borderRadius: '8px', border: `1px solid ${t.inputBorder}`, fontSize: '13px', background: t.inputBg, color: t.heading, outline: 'none', width: '100%', boxSizing: 'border-box' }

  if (loading) return <EsqueletoPagina />

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap', marginBottom: '18px' }}>
        <div>
          <h1 className="so-leitores">{L.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => { setEditingId(null); setForm(EMPTY); setShowForm(v => !v) }} style={{ padding: '10px 18px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}>{L.new}</button>
        </div>
      </div>

      {err && <div style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '10px', padding: '11px 15px', fontSize: '12.5px', fontWeight: 600, marginBottom: '14px' }}>{err}</div>}

      {/* KPIs do mês */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px', marginBottom: '18px', maxWidth: isMobile ? 'none' : '520px' }}>
        {[
          { label: L.received, value: fmt(received), color: t.dueOk.ink },
          { label: L.pendingK, value: fmt(outstanding), color: outstanding > 0 ? t.dueSoon.ink : t.heading },
        ].map(k => (
          <div key={k.label} style={{ ...card, padding: '15px 17px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '5px' }}>{k.label}</div>
            <div style={{ fontSize: '21px', fontWeight: 800, color: k.color, fontFamily: t.fontNum || t.fontDisplay }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Form contrato */}
      {showForm && (
        <div style={{ ...card, border: `2px solid ${t.accent}`, padding: '16px 18px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1.2fr 1fr', gap: '11px', marginBottom: '11px' }}>
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '5px' }}>{L.client}</div>
              {/* Escolhe-se a ficha (o select nativo aceita escrever para procurar);
                  "cliente sem ficha" é uma escolha explícita que abre o texto livre. */}
              <select value={form.semFicha ? '__sem' : form.cliente_id}
                onChange={e => { const v = e.target.value; setForm(f => v === '__sem' ? { ...f, semFicha: true, cliente_id: '' } : { ...f, semFicha: false, cliente_id: v }) }}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">{L.escolherFicha}</option>
                {fichas.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                <option value="__sem">{L.semFicha}</option>
              </select>
              {form.semFicha && (
                <input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder={L.nomeSemFicha} aria-label={L.nomeSemFicha} style={{ ...inputStyle, marginTop: '6px' }} />
              )}</div>
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '5px' }}>{contaDaFicha ? L.contaDaFicha : L.linkUser}</div>
              {contaDaFicha ? (
                // A conta vem da ficha (clientes.user_id): não se escolhe à mão
                <div style={{ ...inputStyle, background: t.softCardBg, color: t.textMuted, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <IconConta />{(() => { const u = users.find(x => x.id === contaDaFicha); return u ? (u.display_name || u.email) : '—' })()}
                </div>
              ) : (
                <select value={form.user_id} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">{L.none}</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.display_name || u.email}</option>)}
                </select>
              )}</div>
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '5px' }}>{L.service}</div>
              <input value={form.service} onChange={e => setForm(f => ({ ...f, service: e.target.value }))} placeholder={L.servicePh} style={inputStyle} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '120px 150px 130px 1fr auto', gap: '11px', alignItems: 'end' }}>
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '5px' }}>{L.amount}</div>
              <input type="number" min="0" step="0.5" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={inputStyle} /></div>
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '5px' }}>{L.periodicity}</div>
              <select value={form.periodicity} onChange={e => setForm(f => ({ ...f, periodicity: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="monthly">{L.monthly}</option><option value="quarterly">{L.quarterly}</option>
                <option value="annual">{L.annual}</option><option value="once">{L.once}</option>
              </select></div>
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '5px' }}>{L.startM}</div>
              <input type="month" value={form.start_month} onChange={e => setForm(f => ({ ...f, start_month: e.target.value }))} style={inputStyle} /></div>
            <div><div style={{ fontSize: '11px', fontWeight: 600, color: t.textMuted, marginBottom: '5px' }}>{L.notes}</div>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={inputStyle} /></div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={saveContract} disabled={!podeGuardar} style={{ padding: '9px 16px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '9px', fontWeight: 700, fontSize: '13px', cursor: podeGuardar ? 'pointer' : 'default', opacity: podeGuardar ? 1 : .5 }}>{L.save}</button>
              <button onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY) }} style={{ padding: '9px 12px', background: t.segBg, border: `1px solid ${t.segBorder}`, borderRadius: '9px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: t.textMuted }}>{L.cancel}</button>
            </div>
          </div>
          {editingId && (
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${t.rowBorder || t.cardBorder}`, display: 'flex' }}>
              <button onClick={() => { const b = billing.find(x => x.id === editingId); if (b) removeContract(b) }}
                style={{ marginLeft: 'auto', padding: '7px 13px', background: 'transparent', border: `1px solid ${t.dueLate.ink}`, borderRadius: '9px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', color: t.dueLate.ink }}>{L.del}</button>
            </div>
          )}
        </div>
      )}

      {/* Recebimentos do mês */}
      {/* O seletor de mês só afeta os recebimentos: vive no título desta secção,
          com o mês por extenso em vez de "2026-10" (13-D, 13/10). */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', margin: '0 0 10px' }}>
        <h2 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: '20px', color: t.heading }}>{L.monthT} · {mesPorExtenso}</h2>
        <input type="month" value={period} onChange={e => setPeriod(e.target.value)} aria-label={L.monthT} style={{ ...inputStyle, width: 'auto', padding: '5px 8px', fontSize: '12px' }} />
      </div>
      <div style={{ ...card, overflow: 'hidden', marginBottom: '22px' }}>
        {dueThisMonth.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>{L.noDue}</div>}
        {dueThisMonth.map((b, i) => {
          const paid = paidByBilling[b.id]
          return (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: i < dueThisMonth.length - 1 ? `1px solid ${t.rowBorder || t.cardBorder}` : 'none', flexWrap: 'wrap' }}>
              <div style={{ minWidth: '150px', flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: t.heading }}>{b.client_name}</div>
                <div style={{ fontSize: '11px', color: t.subtle }}>{b.service || '—'} · {perLabel[b.periodicity]}</div>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: t.heading, width: '96px', textAlign: 'right' }}>{fmt(paid ? paid.amount : b.amount)}</div>
              {paid ? (
                <button onClick={() => undoPayment(b)} disabled={busyId === b.id} style={{ padding: '6px 13px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700, border: 'none', background: t.dueOk.bg, color: t.dueOk.ink, cursor: 'pointer' }} title={L.undo}>{L.confirmed}</button>
              ) : (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input type="number" min="0" step="0.5" placeholder={String(b.amount)} value={actuals[b.id] ?? ''} onChange={e => setActuals(a => ({ ...a, [b.id]: e.target.value }))} style={{ ...inputStyle, width: '90px' }} />
                  <button onClick={() => confirmPayment(b)} disabled={busyId === b.id} style={{ padding: '7px 14px', borderRadius: '9px', fontSize: '12px', fontWeight: 700, border: 'none', background: t.btnBg, color: t.btnInk, cursor: busyId === b.id ? 'wait' : 'pointer' }}>{busyId === b.id ? '…' : L.confirm}</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Contratos */}
      <h2 style={{ margin: '0 0 10px', fontFamily: t.fontDisplay, fontWeight: 600, fontSize: '20px', color: t.heading }}>{L.contractsT}</h2>
      <div style={{ ...card, overflow: 'hidden' }}>
        {billing.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>{L.noContracts}</div>}
        {billing.map((b, i) => (
          <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: i < billing.length - 1 ? `1px solid ${t.rowBorder || t.cardBorder}` : 'none', flexWrap: 'wrap', opacity: b.active ? 1 : 0.55 }}>
            <div style={{ minWidth: '150px', flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: t.heading }}>{b.client_name}{b.user_id && <span title={L.linkUser} style={{ marginLeft: '6px', color: t.accentText }}><IconConta /></span>}</div>
              <div style={{ fontSize: '11px', color: t.subtle }}>{b.service || '—'}{b.notes ? ` · ${b.notes}` : ''}</div>
            </div>
            <span style={{ padding: '2px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: t.softCardBg, color: t.textMuted }}>{perLabel[b.periodicity]}</span>
            <div style={{ fontSize: '13px', fontWeight: 800, color: t.heading, width: '96px', textAlign: 'right' }}>{fmt(b.amount)}</div>
            {b.contract_path ? (
              <button onClick={() => abrirContrato(b.contract_path)} title={b.contract_name || L.verContrato}
                style={{ padding: '4px 11px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, border: `1px solid ${t.cardBorder}`, cursor: 'pointer', background: 'transparent', color: t.accentText, whiteSpace: 'nowrap' }}><IconFicheiro tam={12} /> {L.contrato}</button>
            ) : (
              <label title={L.anexar} style={{ padding: '4px 11px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, border: `1px dashed ${t.cardBorder}`, cursor: busyId === b.id ? 'wait' : 'pointer', background: 'transparent', color: t.subtle, whiteSpace: 'nowrap' }}>
                {busyId === b.id ? '…' : L.anexar}
                <input type="file" accept="application/pdf,image/*" disabled={busyId === b.id}
                  onChange={e => anexarContrato(b, e.target.files?.[0])} style={{ display: 'none' }} />
              </label>
            )}
            {/* O texto dizia sempre "Ativo", mesmo com o contrato inativo (13-D, 13/10) */}
            <button onClick={() => toggleActive(b)} title={L.toggleHint} aria-pressed={!!b.active} style={{ padding: '4px 11px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, border: 'none', cursor: 'pointer', background: b.active ? t.dueOk.bg : t.segBg, color: b.active ? t.dueOk.ink : t.textMuted }}>{b.active ? L.active : L.inactive}</button>
            <button onClick={() => openEdit(b)} title={L.edit} aria-label={L.edit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.subtle, padding: '4px', display: 'inline-flex' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
