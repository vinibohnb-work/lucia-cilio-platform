import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { IconFicheiro, IconRaio } from '../../components/Icones'
import EsqueletoPagina from '../../components/EsqueletoPagina'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import { dataCurta } from '../../lib/formato'
import { useEffectiveUserId, useViewAs } from '../../context/ViewAsContext'
import { parseCSV, extrairMovimentos, conciliar, movimentoParaLancamento, sugerirCategoria } from '../../lib/extratoBancario'
import { opcoesCategorias, useCategoriasExtra } from '../../lib/categorias'
import { getCompanySettings, VAT_RATES } from '../../lib/companySettings'

// Conciliação caixa/banco a partir do extrato.
// Decisão da reunião de 13/08: ficheiro em vez de integração bancária.
//
// O princípio que guia o ecrã: a máquina propõe, a pessoa decide. Só o que é
// inequívoco (mesmo valor, mesmo dia, sem outro candidato igual) se concilia
// sozinho — tudo o resto passa pelas mãos dela.

// Ícone de clipe do comprovativo (SVG, não emoji)
function IconClipe() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21.4 11.1l-8.5 8.5a6 6 0 0 1-8.5-8.5l8.5-8.5a4 4 0 0 1 5.7 5.7l-8.5 8.5a2 2 0 0 1-2.8-2.8l7.8-7.8" /></svg>
}

export default function Conciliacao() {
  const { lang } = useLang()
  const { t } = useTheme()
  const eid = useEffectiveUserId()
  const { isViewing } = useViewAs()
  const inputRef = useRef(null)

  const [txs, setTxs] = useState([])
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [aLer, setALer] = useState(false)
  const [importacoes, setImportacoes] = useState([])   // extratos já arquivados
  const [previa, setPrevia] = useState(null)     // { movimentos, mapa, ficheiro, ... }
  const [erro, setErro] = useState('')
  // Taxa de IVA para "Criar lançamento": por omissão a da empresa (0 se isenta)
  const [settings, setSettings] = useState(null)
  const [taxas, setTaxas] = useState({})   // tx.id -> taxa escolhida
  // Categoria do lançamento a criar (entradas e saídas, 29/10): nas saídas, por
  // omissão, a proposta a partir da coluna de categoria do extrato; a pessoa
  // confirma ou troca. As opções juntam a base às categorias do cliente (ficha).
  const [categorias, setCategorias] = useState({})   // tx.id -> chave escolhida
  const categoriaDe = (tx) => categorias[tx.id] ?? (tx.type === 'saida' ? sugerirCategoria(tx.raw?.categoria) : '')
  const extras = useCategoriasExtra(eid)
  const [aAnexar, setAAnexar] = useState(null)   // tx.id a enviar comprovativo
  useEffect(() => { if (eid) getCompanySettings(eid).then(setSettings) }, [eid])
  const taxaEmpresa = settings ? (settings.vat_regime === 'exempt' ? 0 : Number(settings.vat_default_rate) || 0) : 0
  const vatOptions = [...(VAT_RATES[settings?.country] || VAT_RATES.PT), 0]
  const [aviso, setAviso] = useState('')
  const [ligacoesExtra, setLigacoesExtra] = useState([])   // lançamentos adicionais dos movimentos (066)
  // ?aba=conciliado (vindo da marca "Ligado ao banco" do Livro de Caixa) abre já na aba certa (QA Nina 18/11)
  const [searchParams] = useSearchParams()
  const [aba, setAba] = useState(() => { const a = searchParams.get('aba'); return ['pendente', 'conciliado', 'ignorado', 'semExtrato'].includes(a) ? a : 'pendente' })
  // &mov=<id>: o movimento exato vindo da marca; o ecrã rola até ele e destaca-o
  const movAlvo = searchParams.get('mov')
  useEffect(() => {
    if (loading || !movAlvo) return
    const el = document.getElementById(`mov-${movAlvo}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [loading, movAlvo])

  const L = lang === 'de' ? {
    eyebrow: 'Buchhaltung', title: 'Abstimmung Kasse/Bank',
    subtitle: 'Kontoauszug importieren (CSV oder Excel) und mit dem Kassenbuch abgleichen.',
    escolher: 'Datei wählen', aLer: 'Wird gelesen…', importar: 'Importieren', cancelar: 'Abbrechen',
    detetado: 'Erkanntes Format', linhas: 'Zeilen', semDataValor: 'ohne Datum oder Betrag', saldoInicial: 'Anfangssaldo', naoConta: 'zählt nicht als Buchung', novos: 'neu', repetidos: 'bereits importiert',
    pendente: 'Offen', conciliado: 'Abgestimmt', ignorado: 'Ignoriert', semExtrato: 'Nicht im Auszug',
    sugestao: 'Vorschlag', conciliar: 'Abstimmen', criar: 'Buchung anlegen', ignorar: 'Ignorieren',
    desfazer: 'Rückgängig', confianca: 'Sicherheit', ambiguo: 'Mehrere gleiche Buchungen — bitte prüfen',
    vazio: 'Noch kein Auszug importiert.', tudoOk: 'Alles abgestimmt ✓',
    semExtratoAjuda: 'Bankbuchungen im Kassenbuch, die im Auszug fehlen.',
    loading: 'Wird geladen…', erroFormato: 'Format nicht erkannt. Prüfen Sie, ob die Datei Datum, Beschreibung und Betrag enthält.',
    erroVazio: 'Keine Buchungen in der Datei gefunden.', semAlteracoes: 'Alle Buchungen waren bereits importiert.',
    importados: 'Importierte Kontoauszüge', abrirFicheiro: 'Öffnen', semFicheiro: 'ohne Datei',
    verComo: 'Im Ansichtsmodus nicht möglich.',
    semCategoria: '— ohne Kategorie —', categoriaTitulo: 'Kategorie der neuen Buchung', categoriaExtrato: 'Kategorie im Auszug',
    jaLigado: 'Diese Kassenbuchung ist bereits mit einer anderen Bankbewegung verknüpft. Die Liste wurde aktualisiert — bitte eine andere wählen.',
    anexar: 'Beleg anhängen', trocar: 'Ersetzen', retirar: 'Entfernen', aEnviar: 'Wird hochgeladen…', erroAnexo: 'Beleg konnte nicht hochgeladen werden.', tipoAnexo: 'PDF, JPEG, PNG oder WebP bis 10 MB.',
    conciliarSel: 'Ausgewählte abstimmen', aConciliar: 'Wird abgestimmt…', marcarTodas: 'Alle auswählen', desmarcarTodas: 'Keine auswählen', incluirLote: 'Gemeinsam abstimmen', mesmaData: 'gleicher Betrag und Datum',
  } : lang === 'en' ? {
    eyebrow: 'Accounting', title: 'Cash/bank reconciliation',
    subtitle: 'Import a bank statement (CSV or Excel) and match it against the cash book.',
    escolher: 'Choose file', aLer: 'Reading…', importar: 'Import', cancelar: 'Cancel',
    detetado: 'Detected format', linhas: 'rows', semDataValor: 'without date or amount', saldoInicial: 'opening balance', naoConta: 'not counted as a transaction', novos: 'new', repetidos: 'already imported',
    pendente: 'Pending', conciliado: 'Matched', ignorado: 'Ignored', semExtrato: 'Not in statement',
    sugestao: 'Suggestion', conciliar: 'Match', criar: 'Create entry', ignorar: 'Ignore',
    desfazer: 'Undo', confianca: 'confidence', ambiguo: 'Several identical entries — please check',
    vazio: 'No statement imported yet.', tudoOk: 'Everything matched ✓',
    semExtratoAjuda: 'Bank entries in the cash book that are missing from the statement.',
    loading: 'Loading…', erroFormato: 'Format not recognised. Check the file has date, description and amount.',
    erroVazio: 'No transactions found in the file.', semAlteracoes: 'Every transaction was already imported.',
    importados: 'Imported statements', abrirFicheiro: 'Open', semFicheiro: 'no file',
    verComo: 'Not available in view-as mode.',
    semCategoria: '— no category —', categoriaTitulo: 'Category of the new entry', categoriaExtrato: 'Category in the statement',
    jaLigado: 'This cash book entry is already linked to another bank movement. The list was refreshed — please pick another one.',
    anexar: 'Attach receipt', trocar: 'Replace', retirar: 'Remove', aEnviar: 'Uploading…', erroAnexo: 'Could not upload the receipt.', tipoAnexo: 'PDF, JPEG, PNG or WebP up to 10 MB.',
    conciliarSel: 'Match selected', aConciliar: 'Matching…', marcarTodas: 'Select all', desmarcarTodas: 'Clear selection', incluirLote: 'Match together', mesmaData: 'same amount and date',
  } : {
    eyebrow: 'Contabilidade', title: 'Conciliação caixa/banco',
    subtitle: 'Importa o extrato bancário (CSV ou Excel) e cruza-o com o Livro de Caixa.',
    escolher: 'Escolher ficheiro', aLer: 'A ler…', importar: 'Importar', cancelar: 'Cancelar',
    detetado: 'Formato detetado', linhas: 'linhas', semDataValor: 'sem data ou valor', saldoInicial: 'saldo inicial', naoConta: 'não conta como movimento', novos: 'novos', repetidos: 'já importados',
    pendente: 'Por conciliar', conciliado: 'Conciliados', ignorado: 'Ignorados', semExtrato: 'Não constam do extrato',
    sugestao: 'Sugestão', conciliar: 'Conciliar', criar: 'Criar lançamento', ignorar: 'Ignorar',
    desfazer: 'Desfazer', confianca: 'confiança', ambiguo: 'Há vários lançamentos iguais — confirma qual',
    vazio: 'Ainda não importaste nenhum extrato.', tudoOk: 'Está tudo conciliado ✓',
    semExtratoAjuda: 'Lançamentos de banco no Livro de Caixa que não aparecem no extrato.',
    loading: 'A carregar…', erroFormato: 'Não reconheci o formato. Confirma que o ficheiro tem data, descrição e valor.',
    erroVazio: 'Não encontrei movimentos no ficheiro.', semAlteracoes: 'Todos os movimentos já tinham sido importados.',
    verComo: 'Não disponível no modo "ver como".',
    importados: 'Extratos importados', abrirFicheiro: 'Abrir', semFicheiro: 'sem ficheiro',
    semCategoria: '— sem categoria —', categoriaTitulo: 'Categoria do lançamento a criar', categoriaExtrato: 'Categoria no extrato',
    jaLigado: 'Este lançamento do Livro de Caixa já está ligado a outro movimento do banco. A lista foi atualizada — escolhe outro.',
    anexar: 'Anexar comprovativo', trocar: 'Trocar', retirar: 'Retirar', aEnviar: 'A enviar…', erroAnexo: 'Não foi possível enviar o comprovativo.', tipoAnexo: 'PDF, JPEG, PNG ou WebP até 10 MB.',
    conciliarSel: 'Conciliar selecionados', aConciliar: 'A conciliar…', marcarTodas: 'Marcar todas', desmarcarTodas: 'Desmarcar todas', incluirLote: 'Conciliar em conjunto', mesmaData: 'mesmo valor e data',
  }

  const fmt = (v) => (Number(v) || 0).toLocaleString(lang === 'de' ? 'de-DE' : lang === 'en' ? 'en-GB' : 'pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const dataFmt = (d) => dataCurta(d, lang)

  const load = useCallback(async () => {
    if (!eid) return
    setLoading(true)
    const [tx, ce, imp, ex] = await Promise.all([
      supabase.from('bank_transactions').select('*').eq('user_id', eid).order('tx_date', { ascending: false }),
      supabase.from('cash_entries').select('id,entry_date,description,type,amount,destination').eq('user_id', eid).eq('destination', 'banco'),
      supabase.from('bank_imports').select('*').eq('user_id', eid).order('created_at', { ascending: false }).limit(6),
      // Lançamentos adicionais de um movimento (066). Sem a migração, segue vazio.
      supabase.from('bank_transaction_entries').select('bank_transaction_id,cash_entry_id').eq('user_id', eid),
    ])
    setTxs(tx.data || []); setEntries(ce.data || []); setImportacoes(imp.data || []); setLigacoesExtra(ex.error ? [] : (ex.data || [])); setLoading(false)
  }, [eid])
  useEffect(() => { load() }, [load])

  // Um movimento pode cobrir vários lançamentos (LUC-243): o primeiro fica no
  // próprio movimento, os outros em bank_transaction_entries.
  const extrasPorTx = useMemo(() => {
    const m = {}
    for (const x of ligacoesExtra) (m[x.bank_transaction_id] ||= []).push(x.cash_entry_id)
    return m
  }, [ligacoesExtra])
  const entriesUsadas = useMemo(() => new Set([
    ...txs.filter(x => x.cash_entry_id).map(x => x.cash_entry_id),
    ...ligacoesExtra.map(x => x.cash_entry_id),
  ]), [txs, ligacoesExtra])

  // Sugestões recalculadas sobre o que ainda está pendente
  const { sugestoes, entriesSemPar } = useMemo(() => {
    const pendentes = txs.filter(x => x.status === 'pendente')
      .map(x => ({ fingerprint: x.fingerprint, data: x.tx_date, descricao: x.description, valor: Number(x.amount), tipo: x.type }))
    const jaUsados = entriesUsadas
    const livres = entries.filter(e => !jaUsados.has(e.id))
    const r = conciliar(pendentes, livres)
    // "Não constam do extrato": só os lançamentos dentro do período dos extratos
    // importados — fora dele não há extrato para os encontrar (R-B11)
    const periodos = importacoes.filter(i => i.period_start && i.period_end)
    const noPeriodo = (d) => periodos.some(i => d >= i.period_start && d <= i.period_end)
    return { sugestoes: r.sugestoes, entriesSemPar: r.entriesSemPar.filter(e => noPeriodo(e.entry_date)) }
  }, [txs, entries, importacoes, entriesUsadas])

  const entryById = useMemo(() => Object.fromEntries(entries.map(e => [e.id, e])), [entries])

  // Escolha à mão (29/10): para um movimento sem par, os lançamentos do caixa
  // ainda livres do mesmo tipo. Primeiro os de valor igual com data a até 45
  // dias (os candidatos), depois os outros, por proximidade de data.
  // O índice único da 030 garante que um lançamento só liga a um movimento.
  const [escolhas, setEscolhas] = useState({})   // tx.id -> cash_entry id escolhido à mão
  const [erroTx, setErroTx] = useState({})       // tx.id -> mensagem de erro do "Ligar"/"Conciliar", mostrada no card
  const livresPorTipo = useMemo(() => {
    const r = { entrada: [], saida: [] }
    for (const e of entries) if (!entriesUsadas.has(e.id) && r[e.type]) r[e.type].push(e)
    return r
  }, [entries, entriesUsadas])

  // Ligar a vários lançamentos (LUC-243): a Lúcia marca os lançamentos que o
  // movimento cobre; a soma aparece ao lado do valor do banco e, se não bater,
  // fica o aviso (ela pode ligar mesmo assim: comissões, arredondamentos).
  const [varios, setVarios] = useState({})   // tx.id -> [cash_entry ids] (aberto quando existe)
  const [aLigar, setALigar] = useState(null)
  async function ligarVarios(tx, ids) {
    if (isViewing || ids.length < 2) return
    setALigar(tx.id); setErroTx(p => { if (!p[tx.id]) return p; const n = { ...p }; delete n[tx.id]; return n })
    const { error } = await supabase.rpc('conciliar_varios', { p_tx: tx.id, p_entries: ids })
    setALigar(null)
    if (error) { setErroTx(p => ({ ...p, [tx.id]: error.code === '23505' ? L.jaLigado : error.message })); load(); return }
    setVarios(p => { const n = { ...p }; delete n[tx.id]; return n })
    load()
  }
  const candidatosDe = (tx) => {
    const dias = (e) => Math.abs((new Date(e.entry_date) - new Date(tx.tx_date)) / 86400000)
    const igual = (e) => Math.abs(Number(e.amount) - Number(tx.amount)) < 0.005
    const todos = [...(livresPorTipo[tx.type] || [])].sort((a, b) => dias(a) - dias(b))
    const candidatos = todos.filter(e => igual(e) && dias(e) <= 45)
    const ids = new Set(candidatos.map(e => e.id))
    return { candidatos, outros: todos.filter(e => !ids.has(e.id)) }
  }

  // ── Ler o ficheiro (no browser; nada sobe sem ela confirmar) ──
  async function lerFicheiro(file) {
    if (!file) return
    setErro(''); setAviso(''); setALer(true); setPrevia(null)
    try {
      let r
      if (/\.xlsx?$/i.test(file.name)) {
        // Só se carrega o leitor de Excel quando é mesmo preciso. A versão 9 do
        // leitor devolve todas as folhas ([{ sheet, data }]); fica a folha onde
        // se leem mais movimentos (o ficheiro pode trazer também o resumo, a EÜR
        // ou a lista de categorias noutras folhas).
        const { default: readXlsxFile } = await import('read-excel-file/browser')
        const folhas = await readXlsxFile(file)
        for (const f of folhas) {
          const linhas = (f.data || []).map(l => l.map(c => (c instanceof Date ? c.toISOString().slice(0, 10) : String(c ?? '').trim())))
            .filter(l => l.some(c => c !== ''))
          const res = extrairMovimentos(linhas)
          if (!r || res.movimentos.length > r.movimentos.length) r = res
        }
        if (!r) r = { erro: 'vazio', movimentos: [] }
      } else {
        r = extrairMovimentos(parseCSV(await file.text()))
      }
      if (r.erro === 'formato') { setErro(L.erroFormato); return }
      if (r.erro === 'vazio' || !r.movimentos.length) { setErro(L.erroVazio); return }
      setPrevia({ ...r, ficheiro: file.name, blob: file })
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
    const { movimentos, ficheiro, blob } = previa
    const datas = movimentos.map(m => m.data).sort()
    const { data: imp, error: e1 } = await supabase.from('bank_imports').insert({
      user_id: eid, filename: ficheiro, period_start: datas[0], period_end: datas[datas.length - 1],
      total_rows: movimentos.length,
    }).select('id').single()
    if (e1) { setErro(e1.message); return }

    // O extrato original fica arquivado, para se poder voltar a ele quando uma
    // conciliação levantar dúvidas. Vai para a pasta do próprio cliente no
    // bucket 'client-docs' — a mesma que é apagada por inteiro quando o cliente
    // é eliminado, por isso não deixa pontas soltas de RGPD.
    // Se o envio falhar, a importação segue na mesma: perder o arquivo é
    // incómodo, perder os movimentos seria pior.
    if (blob) {
      const nome = `${new Date().toISOString().slice(0, 10)}-${ficheiro}`.replace(/[^\w.\-@ ]+/g, '_')
      const caminho = `${eid}/extratos/${nome}`
      const { error: eUp } = await supabase.storage.from('client-docs').upload(caminho, blob, { upsert: true })
      if (!eUp) await supabase.from('bank_imports').update({ file_path: caminho }).eq('id', imp.id)
    }

    // O índice único (user_id, fingerprint) faz o resto: reimportar é inofensivo
    const { data: inseridos, error: e2 } = await supabase.from('bank_transactions')
      .upsert(movimentos.map(m => ({
        user_id: eid, import_id: imp.id, tx_date: m.data, description: m.descricao,
        amount: m.valor, type: m.tipo, balance: m.saldo, fingerprint: m.fingerprint,
        raw: m.categoria ? { linha: m.raw, categoria: m.categoria } : { linha: m.raw },
      })), { onConflict: 'user_id,fingerprint', ignoreDuplicates: true })
      .select('id')
    if (e2) { setErro(e2.message); return }

    const novos = (inseridos || []).length
    await supabase.from('bank_imports').update({ new_rows: novos }).eq('id', imp.id)
    if (novos === 0) setAviso(L.semAlteracoes)
    setPrevia(null); setAba('pendente'); load()
  }

  // Abrir o extrato arquivado: o bucket é privado, por isso pede-se uma
  // ligação temporária em vez de guardar URLs.
  async function abrirExtrato(caminho) {
    const { data, error } = await supabase.storage.from('client-docs').createSignedUrl(caminho, 120)
    if (error || !data?.signedUrl) { setErro(L.erroFormato); return }
    window.open(data.signedUrl, '_blank', 'noopener')
  }

  // ── Ações sobre um movimento ──
  async function conciliarCom(tx, entryId) {
    if (isViewing) return
    setErro(''); setErroTx(p => { if (!p[tx.id]) return p; const n = { ...p }; delete n[tx.id]; return n })
    setTxs(prev => prev.map(x => x.id === tx.id ? { ...x, status: 'conciliado', cash_entry_id: entryId } : x))
    const { error } = await supabase.from('bank_transactions')
      .update({ status: 'conciliado', cash_entry_id: entryId, matched_at: new Date().toISOString() }).eq('id', tx.id)
      // 23505 = índice único uq_bank_tx_one_entry (030): o lançamento já está ligado a outro
      // movimento (ex.: noutro separador). O banco recusa; a tela explica e recarrega (B1).
      .then(r => (r.error?.code === '23505' ? { ...r, error: { ...r.error, message: L.jaLigado } } : r))
    // B2 do QA: a mensagem fica no próprio card (no telemóvel o topo não se vê);
    // B1: a escolha à mão é limpa, para o "Ligar" não repetir o mesmo erro.
    if (error) { setErroTx(p => ({ ...p, [tx.id]: error.message })); setEscolhas(p => { const n = { ...p }; delete n[tx.id]; return n }); load(); return }
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
    const novo = movimentoParaLancamento({ data: tx.tx_date, descricao: tx.description, valor: Number(tx.amount), tipo: tx.type }, Number(taxas[tx.id] ?? taxaEmpresa), categoriaDe(tx))
    const { data, error } = await supabase.from('cash_entries').insert({ ...novo, user_id: eid }).select('id,entry_date,description,type,amount,destination').single()
    if (error) { setErro(error.message); return }
    setEntries(prev => [...prev, data])
    await conciliarCom(tx, data.id)
  }

  // Comprovativo de um movimento (29/10): vai para a pasta privada do cliente em
  // client-docs, onde ele pode enviar mas não apagar. Trocar envia outro ficheiro;
  // retirar só desliga o ficheiro do movimento (o documento entregue não desaparece).
  async function anexarComprovativo(tx, ficheiro) {
    if (isViewing || !ficheiro) return
    if (!/^(application\/pdf|image\/(jpeg|png|webp))$/.test(ficheiro.type) || ficheiro.size > 10 * 1024 * 1024) { setErro(L.tipoAnexo); return }
    setAAnexar(tx.id); setErro('')
    const ext = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[ficheiro.type]
    const caminho = `${eid}/comprovativos/${tx.id}-${crypto.randomUUID().slice(0, 8)}.${ext}`
    const up = await supabase.storage.from('client-docs').upload(caminho, ficheiro, { contentType: ficheiro.type })
    if (up.error) { setAAnexar(null); setErro(L.erroAnexo); return }
    const nome = String(ficheiro.name || 'comprovativo').slice(0, 120)
    const { error, count } = await supabase.from('bank_transactions').update({ comprovativo_path: caminho, comprovativo_nome: nome }, { count: 'exact' }).eq('id', tx.id)
    setAAnexar(null)
    if (error || count === 0) { setErro(L.erroAnexo); return }
    setTxs(prev => prev.map(x => x.id === tx.id ? { ...x, comprovativo_path: caminho, comprovativo_nome: nome } : x))
  }
  async function retirarComprovativo(tx) {
    if (isViewing) return
    const { error, count } = await supabase.from('bank_transactions').update({ comprovativo_path: null, comprovativo_nome: null }, { count: 'exact' }).eq('id', tx.id)
    if (error || count === 0) { setErro(L.erroAnexo); return }
    setTxs(prev => prev.map(x => x.id === tx.id ? { ...x, comprovativo_path: null, comprovativo_nome: null } : x))
  }

  // Conciliação em lote (LUC-243): cada sugestão sem empate ganha uma caixa de
  // seleção. Vêm já marcadas as de valor e data iguais (e as automáticas); a
  // Lúcia desmarca o que não quer e confirma tudo de uma vez. As de empate
  // ("há vários lançamentos iguais") ficam de fora: essas decide-as à mão.
  const [selecao, setSelecao] = useState({})   // tx.id -> true/false escolhido à mão
  const [emLote, setEmLote] = useState(false)
  const sugestaoDe = (tx) => {
    const s = sugestoes.get(tx.fingerprint)
    const e = s ? entryById[s.entryId] : null
    return s && e && !s.ambiguo ? { s, e } : null
  }
  const marcadoPorOmissao = (tx) => { const p = sugestaoDe(tx); return !!p && (p.s.automatico || p.e.entry_date === tx.tx_date) }
  const estaMarcado = (tx) => !!sugestaoDe(tx) && (selecao[tx.id] ?? marcadoPorOmissao(tx))
  async function conciliarSelecionados() {
    if (isViewing) { setErro(L.verComo); return }
    const alvos = txs.filter(x => x.status === 'pendente' && estaMarcado(x)).map(x => ({ tx: x, entryId: sugestaoDe(x).e.id }))
    setEmLote(true)
    // Um a um: se um lançamento já estiver ligado noutro separador, só esse
    // falha (com o aviso no próprio cartão) e os outros seguem.
    for (const { tx, entryId } of alvos) await conciliarCom(tx, entryId)
    setEmLote(false); setSelecao({})
  }

  const porStatus = (s) => txs.filter(x => x.status === s)
  const pendentes = porStatus('pendente')
  const nSelecionados = pendentes.filter(estaMarcado).length
  const nSelecionaveis = pendentes.filter(x => !!sugestaoDe(x)).length
  const marcarTodos = (v) => setSelecao(Object.fromEntries(pendentes.filter(x => !!sugestaoDe(x)).map(x => [x.id, v])))

  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px' }
  const btn = { padding: '6px 12px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', border: 'none' }
  // Ações do movimento pendente: área de toque de 44px; seletores com 16px para o iPhone não dar zoom (QA Nina 18/11)
  const btnToque = { ...btn, minHeight: '44px', padding: '0 14px' }
  const selToque = { ...btnToque, fontSize: '16px', fontWeight: 600 }

  if (loading) return <EsqueletoPagina />

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody }}>
      <div>
        <h1 className="so-leitores">{L.title}</h1>
      </div>

      {erro && <div style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '10px', padding: '11px 15px', fontSize: '12.5px', fontWeight: 600, marginBottom: '14px' }}>{erro}</div>}
      {aviso && <div style={{ background: t.chipBg, color: t.chipText, borderRadius: '10px', padding: '11px 15px', fontSize: '12.5px', fontWeight: 600, marginBottom: '14px' }}>{aviso}</div>}

      {/* Importar */}
      {!previa && (
        <div style={{ ...card, padding: '18px 20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <input ref={inputRef} type="file" accept=".csv,.txt,.xlsx,.xls" onChange={e => lerFicheiro(e.target.files?.[0])} style={{ display: 'none' }} />
          <button onClick={() => inputRef.current?.click()} disabled={aLer || isViewing}
            style={{ ...btn, padding: '10px 20px', fontSize: '13px', background: t.btnBg, color: t.btnInk, opacity: aLer || isViewing ? .55 : 1 }}>
            {!aLer && <IconFicheiro />} {aLer ? L.aLer : L.escolher}
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
            {previa.saldoInicial ? ` · ${L.saldoInicial} ${fmt(previa.saldoInicial.valor)} (${dataFmt(previa.saldoInicial.data)}) ${L.naoConta}` : ''}
            {previa.ignoradas ? ` · ${previa.ignoradas} ${L.semDataValor}` : ''}
          </div>
          <div style={{ background: t.softCardBg, borderRadius: '10px', padding: '10px 12px', marginBottom: '12px', maxHeight: '190px', overflowY: 'auto' }}>
            {previa.movimentos.slice(0, 8).map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '11.5px', padding: '3px 0', color: t.text }}>
                <span style={{ flex: 'none', width: '78px', color: t.subtle, fontVariantNumeric: 'tabular-nums' }}>{dataFmt(m.data)}</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.descricao}</span>
                <span style={{ flex: 'none', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: m.tipo === 'entrada' ? t.dueOk.ink : t.neg }}>
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

      {/* Extratos já arquivados — dá para voltar ao original (27/08) */}
      {!!importacoes.length && !previa && (
        <div style={{ ...card, padding: '14px 18px', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '9px' }}>{L.importados}</div>
          {importacoes.map((imp, i) => (
            <div key={imp.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < importacoes.length - 1 ? `1px solid ${t.rowBorder || t.cardBorder}` : 'none', flexWrap: 'wrap' }}>
              <span style={{ flex: 1, minWidth: '160px', fontSize: '12.5px', color: t.heading, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{imp.filename}</span>
              <span style={{ flex: 'none', fontSize: '11.5px', color: t.subtle, fontVariantNumeric: 'tabular-nums' }}>
                {dataFmt(imp.period_start)} – {dataFmt(imp.period_end)} · {imp.total_rows} {L.linhas}
              </span>
              {imp.file_path ? (
                <button onClick={() => abrirExtrato(imp.file_path)}
                  style={{ flex: 'none', minHeight: '30px', padding: '0 12px', background: 'transparent', border: `1px solid ${t.cardBorder}`, borderRadius: '8px', fontSize: '11.5px', fontWeight: 700, color: t.accentText, cursor: 'pointer' }}>{L.abrirFicheiro}</button>
              ) : (
                <span style={{ flex: 'none', fontSize: '11px', color: t.subtle }}>{L.semFicheiro}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {!!txs.length && (
        <>
          <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'center' }}>
            {[['pendente', pendentes.length], ['conciliado', porStatus('conciliado').length], ['ignorado', porStatus('ignorado').length], ['semExtrato', entriesSemPar.length]].map(([k, n]) => (
              <button key={k} onClick={() => setAba(k)} style={{
                padding: '7px 14px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                border: `1px solid ${aba === k ? t.accent : t.cardBorder}`,
                background: aba === k ? t.softCardBg : 'transparent', color: aba === k ? t.accentText : t.textMuted,
              }}>{L[k]} ({n})</button>
            ))}
            {aba === 'pendente' && nSelecionaveis > 0 && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '7px', alignItems: 'center', flexWrap: 'wrap' }}>
                {!isViewing && (
                  <button onClick={() => marcarTodos(nSelecionados < nSelecionaveis)}
                    style={{ ...btn, minHeight: '44px', padding: '0 12px', background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.textMuted, whiteSpace: 'nowrap' }}>
                    {nSelecionados < nSelecionaveis ? L.marcarTodas : L.desmarcarTodas}
                  </button>
                )}
                <button onClick={conciliarSelecionados} disabled={isViewing || emLote || !nSelecionados}
                  style={{ ...btn, minHeight: '44px', flex: 'none', whiteSpace: 'nowrap', padding: '0 15px', fontSize: '12px', background: t.btnBg, color: t.btnInk, opacity: isViewing || emLote || !nSelecionados ? .55 : 1 }}>
                  <IconRaio /> {emLote ? L.aConciliar : `${L.conciliarSel} (${nSelecionados})`}
                </button>
              </div>
            )}
          </div>

          {/* Lançamentos que não constam do extrato */}
          {aba === 'semExtrato' ? (
            <div style={{ ...card, padding: '18px 20px' }}>
              <p style={{ fontSize: '11.5px', color: t.subtle, margin: '0 0 12px' }}>ⓘ {L.semExtratoAjuda}</p>
              {!entriesSemPar.length && <div style={{ fontSize: '13px', color: t.textMuted }}>{L.tudoOk}</div>}
              {entriesSemPar.map(e => (
                <div key={e.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '8px 0', borderTop: `1px solid ${t.rowBorder || t.cardBorder}`, fontSize: '12.5px' }}>
                  <span style={{ flex: 'none', width: '82px', color: t.subtle, fontVariantNumeric: 'tabular-nums' }}>{dataFmt(e.entry_date)}</span>
                  <span style={{ flex: 1, color: t.text }}>{e.description}</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: e.type === 'entrada' ? t.dueOk.ink : t.neg }}>
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
                  <div key={tx.id} id={`mov-${tx.id}`} style={{ ...card, padding: '14px 17px', marginBottom: '9px', ...(movAlvo === tx.id ? { border: `2px solid ${t.accent}` } : {}) }}>
                    <div style={{ display: 'flex', gap: '11px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ flex: 'none', fontSize: '11.5px', color: t.subtle, fontVariantNumeric: 'tabular-nums', width: '78px' }}>{dataFmt(tx.tx_date)}</span>
                      <span style={{ flex: 1, minWidth: '160px', fontSize: '13px', fontWeight: 600, color: t.heading }}>{tx.description}</span>
                      <span style={{ fontSize: '14px', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: tx.type === 'entrada' ? t.dueOk.ink : t.neg }}>
                        {tx.type === 'entrada' ? '+' : '−'}{fmt(tx.amount)}
                      </span>
                    </div>

                    {erroTx[tx.id] && (
                      <div role="alert" style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '9px', padding: '9px 11px', fontSize: '12.5px', fontWeight: 600, marginTop: '8px' }}>{erroTx[tx.id]}</div>
                    )}

                    {/* Comprovativo do movimento (29/10) */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '6px' }}>
                      {tx.comprovativo_path ? (
                        <>
                          <button onClick={() => abrirExtrato(tx.comprovativo_path)} style={{ ...btn, padding: '2px 0', background: 'none', color: t.accentText, display: 'inline-flex', alignItems: 'center', gap: '5px' }} title={tx.comprovativo_nome || ''}>
                            <IconClipe /> <span style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.comprovativo_nome || L.anexar}</span>
                          </button>
                          {!isViewing && <label style={{ ...btn, padding: '2px 0', background: 'none', color: t.subtle, textDecoration: 'underline', cursor: 'pointer' }}>
                            {L.trocar}<input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; anexarComprovativo(tx, f) }} />
                          </label>}
                          {!isViewing && <button onClick={() => retirarComprovativo(tx)} style={{ ...btn, padding: '2px 0', background: 'none', color: t.subtle, textDecoration: 'underline' }}>{L.retirar}</button>}
                        </>
                      ) : !isViewing && (
                        <label style={{ ...btn, padding: '2px 0', background: 'none', color: t.subtle, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }} title={L.tipoAnexo}>
                          <IconClipe /> {aAnexar === tx.id ? L.aEnviar : L.anexar}
                          <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" style={{ display: 'none' }} disabled={aAnexar === tx.id} onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; anexarComprovativo(tx, f) }} />
                        </label>
                      )}
                    </div>

                    {/* Já conciliado: mostra com quê */}
                    {tx.status === 'conciliado' && (
                      <div style={{ display: 'flex', gap: '9px', alignItems: 'center', flexWrap: 'wrap', marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${t.rowBorder || t.cardBorder}` }}>
                        <span style={{ fontSize: '11.5px', color: t.dueOk.ink, fontWeight: 700, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span>✓ {ligado ? `${dataFmt(ligado.entry_date)} · ${ligado.description}${extrasPorTx[tx.id]?.length ? ` · ${fmt(ligado.amount)}` : ''}` : '—'}</span>
                          {(extrasPorTx[tx.id] || []).map(id => entryById[id]).filter(Boolean).map(e => (
                            <span key={e.id}>✓ {dataFmt(e.entry_date)} · {e.description} · {fmt(e.amount)}</span>
                          ))}
                        </span>
                        {!isViewing && <button onClick={() => marcar(tx, 'pendente')} style={{ ...btn, marginLeft: 'auto', minHeight: '36px', padding: '0 14px', background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.textMuted }}>{L.desfazer}</button>}
                      </div>
                    )}

                    {/* Pendente: sugestão + decisões */}
                    {tx.status === 'pendente' && (
                      <div style={{ marginTop: '9px', paddingTop: '9px', borderTop: `1px solid ${t.rowBorder || t.cardBorder}` }}>
                        {sug && (
                          <div style={{ background: s.ambiguo ? t.dueSoon.bg : t.softCardBg, borderRadius: '9px', padding: '9px 11px', marginBottom: '8px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: s.ambiguo ? t.dueSoon.ink : t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }}>
                              {L.sugestao} · {s.score}% {L.confianca}{s.automatico && <> <IconRaio tam={12} /></>}
                            </div>
                            <div style={{ fontSize: '12.5px', color: t.text }}>{dataFmt(sug.entry_date)} · {sug.description} · {fmt(sug.amount)}</div>
                            {s.ambiguo && <div style={{ fontSize: '11px', color: t.dueSoon.ink, marginTop: '4px', fontWeight: 600 }}>⚠ {L.ambiguo}</div>}
                            {!s.ambiguo && !isViewing && (
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', minHeight: '44px', marginTop: '2px', fontSize: '12.5px', fontWeight: 600, color: t.heading, cursor: 'pointer' }}>
                                <input type="checkbox" checked={estaMarcado(tx)} onChange={e => setSelecao(p => ({ ...p, [tx.id]: e.target.checked }))}
                                  style={{ width: '20px', height: '20px', accentColor: t.accent, cursor: 'pointer' }} />
                                {L.incluirLote}{sug.entry_date === tx.tx_date ? ` · ${L.mesmaData}` : ''}
                              </label>
                            )}
                          </div>
                        )}
                        {tx.raw?.categoria && (
                          <div style={{ fontSize: '11px', color: t.subtle, marginBottom: '7px' }}>{L.categoriaExtrato}: {tx.raw.categoria}</div>
                        )}
                        {(() => {
                          const { candidatos, outros } = candidatosDe(tx)
                          if (!candidatos.length && !outros.length) return null
                          const LM = lang === 'de'
                            ? { rot: 'Kassenbuchung selbst wählen', esc: '— Buchung wählen —', cand: 'Gleicher Betrag, nahes Datum', outros: 'Andere offene Buchungen', ligar: 'Verknüpfen', nenhum: 'Keine Buchung mit gleichem Betrag — wähle aus den anderen oder lege eine neue an.' }
                            : lang === 'en'
                              ? { rot: 'Pick the cash book entry yourself', esc: '— choose an entry —', cand: 'Same amount, close date', outros: 'Other open entries', ligar: 'Link', nenhum: 'No entry with the same amount — pick from the others or create a new one.' }
                              : { rot: 'Escolher o lançamento do Livro de Caixa', esc: '— escolher lançamento —', cand: 'Mesmo valor, data próxima', outros: 'Outros lançamentos sem par', ligar: 'Ligar', nenhum: 'Nenhum lançamento com o mesmo valor — escolhe entre os outros ou cria um novo.' }
                          const opcao = (e) => <option key={e.id} value={e.id}>{dataFmt(e.entry_date)} · {e.description} · {fmt(e.amount)}</option>
                          const escolhido = escolhas[tx.id] && (livresPorTipo[tx.type] || []).some(e => e.id === escolhas[tx.id]) ? escolhas[tx.id] : ''
                          return (
                            <div style={{ marginBottom: '8px' }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, marginBottom: '4px' }}>{LM.rot}</div>
                              <div style={{ display: 'flex', gap: '7px', flexWrap: 'nowrap', alignItems: 'center' }}>
                                <select value={escolhido} onChange={e => setEscolhas(p => ({ ...p, [tx.id]: e.target.value }))} disabled={isViewing} aria-label={LM.rot}
                                  style={{ ...btn, fontSize: '16px', fontWeight: 600, flex: '1 1 0', minWidth: 0, minHeight: '44px', background: t.cardBg, border: `1px solid ${t.cardBorder}`, color: t.heading, cursor: 'pointer' }}>
                                  <option value="">{LM.esc}</option>
                                  {!!candidatos.length && <optgroup label={LM.cand}>{candidatos.map(opcao)}</optgroup>}
                                  {!!outros.length && <optgroup label={LM.outros}>{outros.map(opcao)}</optgroup>}
                                </select>
                                <button onClick={() => conciliarCom(tx, escolhido)} disabled={isViewing || !escolhido}
                                  style={{ ...btn, flex: 'none', minHeight: '44px', padding: '0 16px', background: t.btnBg, color: t.btnInk, opacity: isViewing || !escolhido ? .55 : 1 }}>{LM.ligar}</button>
                              </div>
                              {!candidatos.length && <div style={{ fontSize: '11px', color: t.subtle, marginTop: '4px' }}>{LM.nenhum}</div>}
                            </div>
                          )
                        })()}
                        {/* Ligar a vários lançamentos (LUC-243) */}
                        {!isViewing && (livresPorTipo[tx.type] || []).length >= 2 && (() => {
                          const aberto = !!varios[tx.id]
                          const LV = lang === 'de'
                            ? { abrir: 'Mit mehreren Buchungen verknüpfen', fechar: 'Schließen', soma: 'Summe', de: 'von', ligar: (n) => `${n} Buchungen verknüpfen`, naoBate: 'Die Summe stimmt nicht mit dem Bankbetrag überein — prüfe die Auswahl oder verknüpfe trotzdem (z. B. Gebühren).', bate: 'Die Summe stimmt ✓', minimo: 'Mindestens zwei Buchungen wählen.' }
                            : lang === 'en'
                              ? { abrir: 'Link to several entries', fechar: 'Close', soma: 'Total', de: 'of', ligar: (n) => `Link ${n} entries`, naoBate: 'The total does not match the bank amount — check the selection or link anyway (e.g. fees).', bate: 'The total matches ✓', minimo: 'Pick at least two entries.' }
                              : { abrir: 'Ligar a vários lançamentos', fechar: 'Fechar', soma: 'Soma', de: 'de', ligar: (n) => `Ligar ${n} lançamentos`, naoBate: 'A soma não bate com o valor do banco — confere a escolha ou liga mesmo assim (ex.: comissões).', bate: 'A soma bate ✓', minimo: 'Escolhe pelo menos dois lançamentos.' }
                          if (!aberto) return (
                            <button onClick={() => setVarios(p => ({ ...p, [tx.id]: [] }))}
                              style={{ ...btn, minHeight: '44px', padding: '0 4px', marginBottom: '6px', background: 'none', color: t.accentText, textDecoration: 'underline' }}>{LV.abrir}</button>
                          )
                          const dias = (e) => Math.abs((new Date(e.entry_date) - new Date(tx.tx_date)) / 86400000)
                          const lista = [...livresPorTipo[tx.type]].filter(e => Number(e.amount) <= Number(tx.amount) + 0.005).sort((a, b) => dias(a) - dias(b)).slice(0, 40)
                          const marcados = varios[tx.id]
                          const soma = marcados.reduce((s, id) => s + (Number(entryById[id]?.amount) || 0), 0)
                          const bate = Math.abs(soma - Number(tx.amount)) < 0.005
                          return (
                            <div style={{ border: `1px solid ${t.cardBorder}`, borderRadius: '10px', padding: '8px 10px', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ flex: 1, fontSize: '11px', fontWeight: 700, color: t.textMuted }}>{LV.abrir}</span>
                                <button onClick={() => setVarios(p => { const n = { ...p }; delete n[tx.id]; return n })}
                                  style={{ ...btn, minHeight: '44px', padding: '0 10px', background: 'none', color: t.subtle, textDecoration: 'underline' }}>{LV.fechar}</button>
                              </div>
                              <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                                {lista.map(e => (
                                  <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '9px', minHeight: '44px', fontSize: '12.5px', color: t.text, cursor: 'pointer', borderTop: `1px solid ${t.rowBorder || t.cardBorder}` }}>
                                    <input type="checkbox" checked={marcados.includes(e.id)}
                                      onChange={ev => setVarios(p => ({ ...p, [tx.id]: ev.target.checked ? [...(p[tx.id] || []), e.id] : (p[tx.id] || []).filter(x => x !== e.id) }))}
                                      style={{ width: '20px', height: '20px', flex: 'none', accentColor: t.accent, cursor: 'pointer' }} />
                                    <span style={{ flex: 'none', width: '72px', color: t.subtle, fontVariantNumeric: 'tabular-nums' }}>{dataFmt(e.entry_date)}</span>
                                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description}</span>
                                    <span style={{ flex: 'none', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{fmt(e.amount)}</span>
                                  </label>
                                ))}
                              </div>
                              <div style={{ fontSize: '12.5px', fontWeight: 700, color: t.heading, marginTop: '6px', fontVariantNumeric: 'tabular-nums' }}>
                                {LV.soma}: {fmt(soma)} {LV.de} {fmt(tx.amount)}
                              </div>
                              {marcados.length >= 2 && (
                                <div role={bate ? undefined : 'alert'} style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px', borderRadius: '8px', padding: bate ? 0 : '7px 10px', background: bate ? 'none' : t.dueSoon.bg, color: bate ? t.dueOk.ink : t.dueSoon.ink }}>
                                  {bate ? LV.bate : `⚠ ${LV.naoBate}`}
                                </div>
                              )}
                              {marcados.length < 2 && <div style={{ fontSize: '11px', color: t.subtle, marginTop: '4px' }}>{LV.minimo}</div>}
                              <button onClick={() => ligarVarios(tx, marcados)} disabled={marcados.length < 2 || aLigar === tx.id}
                                style={{ ...btnToque, marginTop: '7px', background: t.btnBg, color: t.btnInk, opacity: marcados.length < 2 || aLigar === tx.id ? .55 : 1 }}>
                                {aLigar === tx.id ? L.aConciliar : LV.ligar(marcados.length)}
                              </button>
                            </div>
                          )
                        })()}
                        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                          {sug && <button onClick={() => conciliarCom(tx, sug.id)} disabled={isViewing} style={{ ...btnToque, background: t.btnBg, color: t.btnInk, opacity: isViewing ? .55 : 1 }}>{L.conciliar}</button>}
                          <select value={taxas[tx.id] ?? taxaEmpresa} onChange={e => setTaxas(p => ({ ...p, [tx.id]: e.target.value }))} disabled={isViewing} aria-label="IVA"
                            title={lang === 'de' ? 'USt für die neue Buchung' : lang === 'en' ? 'VAT for the new entry' : 'IVA do lançamento a criar'}
                            style={{ ...selToque, background: t.cardBg, border: `1px solid ${t.cardBorder}`, color: t.heading, cursor: 'pointer' }}>
                            {vatOptions.map(r => <option key={r} value={r}>{(lang === 'de' ? 'USt ' : lang === 'en' ? 'VAT ' : 'IVA ') + r + '%'}</option>)}
                          </select>
                          <select value={categoriaDe(tx)} onChange={e => setCategorias(p => ({ ...p, [tx.id]: e.target.value }))} disabled={isViewing}
                            aria-label={L.categoriaTitulo}
                            title={tx.raw?.categoria ? `${L.categoriaExtrato}: ${tx.raw.categoria}` : L.categoriaTitulo}
                            style={{ ...selToque, maxWidth: '100%', background: t.cardBg, border: `1px solid ${t.cardBorder}`, color: t.heading, cursor: 'pointer' }}>
                            <option value="">{L.semCategoria}</option>
                            {opcoesCategorias(tx.type, extras, lang).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                          <button onClick={() => criarLancamento(tx)} disabled={isViewing} style={{ ...btnToque, background: t.segBg, border: `1px solid ${t.segBorder}`, color: t.heading, opacity: isViewing ? .55 : 1 }}>{L.criar}</button>
                          <button onClick={() => marcar(tx, 'ignorado')} disabled={isViewing} style={{ ...btnToque, background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.textMuted, opacity: isViewing ? .55 : 1 }}>{L.ignorar}</button>
                        </div>
                      </div>
                    )}

                    {tx.status === 'ignorado' && !isViewing && (
                      <div style={{ marginTop: '7px' }}>
                        <button onClick={() => marcar(tx, 'pendente')} style={{ ...btn, minHeight: '36px', padding: '0 14px', background: 'transparent', border: `1px solid ${t.cardBorder}`, color: t.textMuted }}>{L.desfazer}</button>
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
