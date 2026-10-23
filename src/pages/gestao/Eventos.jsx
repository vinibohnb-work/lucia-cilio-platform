import { useState, useEffect, useCallback } from 'react'
import QRCode from 'qrcode'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import { dataCurta } from '../../lib/formato'
import { Cartao, Botao, Chip, Vazio, Janela, Pilulas, useCampos } from '../../portal/ui'

// Repositório de eventos da Lúcia (pedido de 22/10; antes servia só o Momentos
// de 24/10). Cada evento tem a sua landing page (no lcoffice.pt ou externa) e,
// se ela quiser, uma área de participantes: no dia, quem está na sala lê o QR
// code, escreve o nome, cria o perfil e vê os outros (/participantes, migração
// 048 e 050, api/evento.js) e, em cada evento, as palestras e as avaliações
// delas (NPS, migração 051). Um evento sem código não tem área. Trocar o código
// invalida o QR antigo (se tiver sido partilhado fora da sala, por exemplo).

const BUCKET = 'eventos'
// No domínio próprio, o QR aponta para o site (lcoffice.pt), não para app.lcoffice.pt
const ORIGEM = typeof window === 'undefined' ? '' : window.location.hostname.endsWith('lcoffice.pt') ? 'https://lcoffice.pt' : window.location.origin
const linkQR = (codigo) => `${ORIGEM}/participantes/#c=${codigo}`
// Landings que já existem no site, sugeridas no campo
const LANDINGS = ['https://lcoffice.pt/momentos/']
const novoCodigo = () => {
  const b = new Uint8Array(12)
  crypto.getRandomValues(b)
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const novoId = (nome, data) => {
  const base = String(nome || 'evento').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'evento'
  return `${base}-${String(data || '').slice(0, 7)}-${crypto.randomUUID().slice(0, 4)}`.replace(/--+/g, '-')
}
const primeiroNome = (n) => String(n || '').trim().split(/\s+/)[0] || ''
const hojeLisboa = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Lisbon' }).format(new Date())
const ligacaoValida = (v) => {
  let s = String(v || '').trim()
  if (!s) return ''
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s
  try { const u = new URL(s); return u.hostname.includes('.') ? u.toString() : null } catch { return null }
}

// Estado da área de participantes de um evento
function estadoArea(e, hoje) {
  if (!e.codigo) return { texto: 'Sem área', tom: 'neutro' }
  if (e.aberto_de && hoje < e.aberto_de) return { texto: `Abre a ${dataCurta(e.aberto_de)}`, tom: 'ouro' }
  if (e.aberto_ate && hoje > e.aberto_ate) return { texto: 'Fechada', tom: 'neutro' }
  return { texto: 'Aberta', tom: 'ok' }
}

// Campo de texto que grava ao sair (não a cada tecla). Quem o usa passa key={valor}
// para o campo recomeçar quando o valor muda por fora.
function CampoTexto({ valor, aoGravar, estilo, ...resto }) {
  const [v, setV] = useState(valor || '')
  return <input {...resto} value={v} onChange={e => setV(e.target.value)} onBlur={() => { if ((v || '') !== (valor || '')) aoGravar(v) }} style={estilo} />
}

function NovoEvento({ aoFechar, aoCriar }) {
  const c = useCampos()
  const { t } = useTheme()
  const [f, setF] = useState({ nome: '', data: '', local: '', landing: '', area: true })
  const [erro, setErro] = useState('')
  const [aGravar, setAGravar] = useState(false)
  const muda = (k) => (e) => setF(x => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const sujo = f.nome || f.local || f.landing
  const fechar = () => { if (!sujo || window.confirm('Fechar sem criar o evento? O que escreveu perde-se.')) aoFechar() }
  async function criar(e) {
    e.preventDefault()
    if (!f.nome.trim() || !f.data) { setErro('Indique o nome e a data do evento.'); return }
    const landing = ligacaoValida(f.landing)
    if (landing === null) { setErro('O endereço da landing page não é válido.'); return }
    setAGravar(true)
    const ok = await aoCriar({
      id: novoId(f.nome, f.data), nome: f.nome.trim(), data: f.data, local: f.local.trim() || null, landing_url: landing || null,
      codigo: f.area ? novoCodigo() : null, aberto_de: f.area ? f.data : null, aberto_ate: f.area ? f.data : null,
    })
    setAGravar(false)
    if (!ok) setErro('Não foi possível criar o evento.')
  }
  const rotulo = { ...c.rotulo, display: 'block' }
  return (
    <Janela titulo="Novo evento" aoFechar={fechar}>
      <form onSubmit={criar} style={{ display: 'grid', gap: '12px' }}>
        <label><span style={rotulo}>Nome</span><input value={f.nome} onChange={muda('nome')} maxLength={120} required autoFocus style={c.input} placeholder="Ex.: Momentos entre Empreendedores" /></label>
        <label><span style={rotulo}>Data</span><input type="date" value={f.data} onChange={muda('data')} required style={c.input} /></label>
        <label><span style={rotulo}>Local</span><input value={f.local} onChange={muda('local')} maxLength={160} style={c.input} placeholder="Ex.: District Space, Lisboa" /></label>
        <label><span style={rotulo}>Landing page</span><input value={f.landing} onChange={muda('landing')} list="landings-site" style={c.input} placeholder="https://lcoffice.pt/… ou o link da Luma" inputMode="url" autoCapitalize="off" /></label>
        <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: t.text, cursor: 'pointer' }}>
          <input type="checkbox" checked={f.area} onChange={muda('area')} style={{ width: '18px', height: '18px', marginTop: '1px', accentColor: t.accent }} />
          <span><strong style={{ color: t.heading }}>Criar área de participantes</strong><br /><span style={{ color: t.textMuted }}>Um QR code para os participantes criarem o perfil e se conhecerem. Abre só no dia do evento (pode mudar depois).</span></span>
        </label>
        {erro && <div role="alert" style={{ fontSize: '13px', fontWeight: 600, color: t.neg }}>{erro}</div>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Botao type="button" onClick={fechar}>Cancelar</Botao>
          <Botao type="submit" variante="primario" disabled={aGravar}>{aGravar ? 'A criar…' : 'Criar evento'}</Botao>
        </div>
      </form>
    </Janela>
  )
}

// NPS de uma lista de notas 0–10: % de 9–10 menos % de 0–6 (de −100 a +100)
function resumoNps(notas) {
  const n = notas.length
  if (!n) return null
  const promotores = notas.filter(x => x >= 9).length, detratores = notas.filter(x => x <= 6).length
  return { n, nps: Math.round((promotores - detratores) / n * 100), media: notas.reduce((a, b) => a + b, 0) / n }
}
const fmtNps = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v)
const fmtMedia = (v) => v.toLocaleString('pt-PT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const tomNps = (v) => v >= 50 ? 'ok' : v >= 0 ? 'ouro' : 'erro'

// Palestras do evento e o que os participantes acharam delas (migração 051).
// A Lúcia escreve o programa; os participantes avaliam no separador "Avaliar" da
// área de participantes. Os resultados aparecem sem nomes.
function PalestrasAvaliacoes({ evento, avisar }) {
  const { t } = useTheme()
  const c = useCampos()
  const [palestras, setPalestras] = useState([])
  const [avs, setAvs] = useState([])
  const [vista, setVista] = useState('programa')
  const [aberta, setAberta] = useState(null)

  const carregar = useCallback(async () => {
    const [{ data: ps }, { data: as }] = await Promise.all([
      supabase.from('evento_palestras').select('*').eq('evento_id', evento.id).order('ordem'),
      supabase.from('evento_avaliacoes').select('palestra_id, nota, comentario, updated_at').eq('evento_id', evento.id),
    ])
    setPalestras(ps || [])
    setAvs(as || [])
  }, [evento.id])
  useEffect(() => { carregar() }, [carregar])

  async function juntar() {
    const ordem = palestras.reduce((m, p) => Math.max(m, p.ordem || 0), 0) + 1
    const { error } = await supabase.from('evento_palestras').insert({ evento_id: evento.id, ordem, titulo: 'Nova palestra' })
    if (error) { avisar('erro', 'Não foi possível juntar a palestra.'); return }
    carregar()
  }
  async function alterar(id, patch) {
    const { error, count } = await supabase.from('evento_palestras').update(patch, { count: 'exact' }).eq('id', id)
    if (error || count === 0) { avisar('erro', 'Não foi possível guardar.'); return }
    setPalestras(ps => ps.map(p => p.id === id ? { ...p, ...patch } : p))
  }
  async function remover(p) {
    const n = avs.filter(a => a.palestra_id === p.id).length
    if (!window.confirm(n ? `Remover "${p.titulo}" e as ${n} avaliações dela?` : `Remover "${p.titulo}"?`)) return
    const { error, count } = await supabase.from('evento_palestras').delete({ count: 'exact' }).eq('id', p.id)
    if (error || count === 0) { avisar('erro', 'Não foi possível remover.'); return }
    carregar()
  }

  const doEvento = resumoNps(avs.filter(a => !a.palestra_id).map(a => a.nota))
  const linhas = palestras.map(p => ({ ...p, r: resumoNps(avs.filter(a => a.palestra_id === p.id).map(a => a.nota)), comentarios: avs.filter(a => a.palestra_id === p.id && a.comentario) }))
  if (vista === 'ranking') linhas.sort((a, b) => (b.r ? b.r.nps : -999) - (a.r ? a.r.nps : -999) || (b.r ? b.r.media : 0) - (a.r ? a.r.media : 0))
  const melhor = linhas.filter(l => l.r).reduce((m, l) => (!m || l.r.nps > m.r.nps || (l.r.nps === m.r.nps && l.r.media > m.r.media)) ? l : m, null)
  const comentariosEvento = avs.filter(a => !a.palestra_id && a.comentario)
  const th = { ...c.th, textTransform: 'uppercase', letterSpacing: '.04em' }
  const num = { ...c.td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }
  const listaComentarios = (lista) => (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '8px' }}>
      {lista.map((a, i) => <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '13px', color: t.text }}><Chip tom={a.nota >= 9 ? 'ok' : a.nota <= 6 ? 'erro' : 'ouro'}>{a.nota}</Chip><span style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{a.comentario}</span></li>)}
    </ul>
  )

  return (
    <Cartao titulo="Palestras e avaliações" semPadding
      acao={<Pilulas opcoes={[['programa', 'Programa'], ['ranking', 'Melhor avaliadas']]} valor={vista} aoMudar={setVista} />}>
      <div style={{ padding: '0 20px 14px', display: 'flex', gap: '18px', flexWrap: 'wrap', alignItems: 'center', fontSize: '13px', color: t.textMuted }}>
        <span>O evento:</span>
        {doEvento
          ? <><Chip tom={tomNps(doEvento.nps)} forte>NPS {fmtNps(doEvento.nps)}</Chip><span>média <strong style={{ color: t.heading }}>{fmtMedia(doEvento.media)}</strong></span><span><strong style={{ color: t.heading }}>{doEvento.n}</strong> {doEvento.n === 1 ? 'resposta' : 'respostas'}</span>
            {comentariosEvento.length > 0 && <Botao variante="fantasma" onClick={() => setAberta(aberta === 'evento' ? null : 'evento')}>{aberta === 'evento' ? 'Esconder' : 'Ver'} comentários ({comentariosEvento.length})</Botao>}</>
          : <span>ainda sem avaliações.</span>}
      </div>
      {aberta === 'evento' && <div style={{ padding: '0 20px 14px' }}>{listaComentarios(comentariosEvento)}</div>}
      <div className="table-scroll">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={{ ...th, width: '90px' }}>Hora</th><th style={th}>Palestra</th><th style={th}>Orador</th><th style={{ ...th, textAlign: 'right' }}>Respostas</th><th style={{ ...th, textAlign: 'right' }}>Média</th><th style={{ ...th, textAlign: 'right' }}>NPS</th><th style={th}><span className="so-leitores">Ações</span></th></tr></thead>
          <tbody>
            {linhas.length === 0 && <tr><td colSpan={7} style={c.td}><Vazio>Ainda não há palestras. Junte-as para os participantes as poderem avaliar.</Vazio></td></tr>}
            {linhas.map(p => (
              <PalestraLinha key={p.id} p={p} c={c} t={t} num={num} melhor={melhor && melhor.id === p.id && vista === 'programa'}
                aberta={aberta === p.id} aoAbrir={() => setAberta(aberta === p.id ? null : p.id)} aoAlterar={alterar} aoRemover={remover} listaComentarios={listaComentarios} />
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding: '12px 20px 18px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <Botao onClick={juntar}>+ Juntar palestra</Botao>
        <span style={{ fontSize: '12px', color: t.subtle, flex: '1 1 300px' }}>
          Os participantes avaliam no separador "Avaliar" da área de participantes (0 a 10: "quanto recomendaria…"). NPS = % de notas 9–10 menos % de notas 0–6, de −100 a +100. Os resultados aparecem sem nomes.
        </span>
      </div>
    </Cartao>
  )
}

function PalestraLinha({ p, c, t, num, melhor, aberta, aoAbrir, aoAlterar, aoRemover, listaComentarios }) {
  return (
    <>
      <tr>
        <td style={c.td}><CampoTexto key={p.id + (p.hora || '')} valor={p.hora} maxLength={20} placeholder="15h30" aria-label="Hora" aoGravar={v => aoAlterar(p.id, { hora: v.trim() || null })} estilo={{ ...c.input, width: '80px' }} /></td>
        <td style={c.td}><div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}><CampoTexto key={p.id + p.titulo} valor={p.titulo} maxLength={160} aria-label="Palestra" aoGravar={v => v.trim() && aoAlterar(p.id, { titulo: v.trim() })} estilo={{ ...c.input, minWidth: '200px' }} />{melhor && <Chip tom="ok">Melhor avaliada</Chip>}</div></td>
        <td style={c.td}><CampoTexto key={p.id + (p.orador || '')} valor={p.orador} maxLength={120} aria-label="Orador" aoGravar={v => aoAlterar(p.id, { orador: v.trim() || null })} estilo={{ ...c.input, minWidth: '150px' }} /></td>
        <td style={num}>{p.r ? p.r.n : 0}</td>
        <td style={num}>{p.r ? fmtMedia(p.r.media) : '—'}</td>
        <td style={num}>{p.r ? <Chip tom={tomNps(p.r.nps)} forte>{fmtNps(p.r.nps)}</Chip> : '—'}</td>
        <td style={{ ...c.td, whiteSpace: 'nowrap', textAlign: 'right' }}>
          {p.comentarios.length > 0 && <Botao variante="fantasma" onClick={aoAbrir}>{aberta ? 'Esconder' : 'Comentários'} ({p.comentarios.length})</Botao>}
          <Botao variante="perigo" onClick={() => aoRemover(p)} aria-label={`Remover ${p.titulo}`}>Remover</Botao>
        </td>
      </tr>
      {aberta && <tr><td colSpan={7} style={{ ...c.td, background: t.softCardBg }}>{listaComentarios(p.comentarios)}</td></tr>}
    </>
  )
}

export default function Eventos() {
  const { t } = useTheme()
  const c = useCampos()
  const [eventos, setEventos] = useState([])
  const [contagem, setContagem] = useState({})
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState('proximos')
  const [selId, setSelId] = useState(null)
  const [pessoas, setPessoas] = useState([])
  const [qr, setQr] = useState('')
  const [novo, setNovo] = useState(false)
  const [msg, setMsg] = useState({ tom: '', texto: '' })
  const [aRemover, setARemover] = useState(null)
  const [confirmar, setConfirmar] = useState('') // 'qr' | 'desligar' | 'eliminar'
  const hoje = hojeLisboa()
  const sel = eventos.find(e => e.id === selId) || null

  const avisar = (tom, texto) => { setMsg({ tom, texto }); if (tom !== 'erro') setTimeout(() => setMsg({ tom: '', texto: '' }), 3500) }

  const carregar = useCallback(async () => {
    const [{ data: evs }, { data: ps }] = await Promise.all([
      supabase.from('eventos').select('*').order('data', { ascending: false }),
      supabase.from('evento_participantes').select('evento_id'),
    ])
    setEventos(evs || [])
    setContagem((ps || []).reduce((m, p) => ({ ...m, [p.evento_id]: (m[p.evento_id] || 0) + 1 }), {}))
    setCarregando(false)
  }, [])
  useEffect(() => { carregar() }, [carregar])

  const carregarPessoas = useCallback(async (id) => {
    const { data } = await supabase.from('evento_participantes')
      .select('id, nome, negocio, cargo, localidade, partilhar, foto_path, ultimo_acesso, created_at').eq('evento_id', id).order('nome')
    setPessoas(data || [])
  }, [])
  useEffect(() => { if (selId) carregarPessoas(selId) }, [selId, carregarPessoas])
  useEffect(() => {
    let vivo = true
    if (sel?.codigo) QRCode.toDataURL(linkQR(sel.codigo), { width: 520, margin: 2, color: { dark: '#0E3D33', light: '#FFFFFF' } }).then(u => { if (vivo) setQr(u) })
    return () => { vivo = false }
  }, [sel?.codigo])

  async function alterar(patch, ok) {
    const { error, count } = await supabase.from('eventos').update(patch, { count: 'exact' }).eq('id', sel.id)
    if (error || count === 0) { avisar('erro', 'Não foi possível guardar.'); return false }
    setEventos(evs => evs.map(e => e.id === sel.id ? { ...e, ...patch } : e))
    if (ok) avisar('ok', ok)
    return true
  }

  async function criar(ev) {
    const { error } = await supabase.from('eventos').insert(ev)
    if (error) return false
    setNovo(false)
    await carregar()
    setSelId(ev.id); setPessoas([])
    avisar('ok', 'Evento criado.')
    return true
  }

  async function eliminar() {
    // Fotografias primeiro (RGPD); os participantes saem em cascata com o evento
    const { data: ficheiros } = await supabase.storage.from(BUCKET).list(sel.id, { limit: 1000 })
    if (ficheiros?.length) await supabase.storage.from(BUCKET).remove(ficheiros.map(f => `${sel.id}/${f.name}`))
    const { error, count } = await supabase.from('eventos').delete({ count: 'exact' }).eq('id', sel.id)
    setConfirmar('')
    if (error || count === 0) { avisar('erro', 'Não foi possível eliminar o evento.'); return }
    setSelId(null)
    await carregar()
    avisar('ok', 'Evento eliminado.')
  }

  async function copiar(texto) {
    try { await navigator.clipboard.writeText(texto); avisar('ok', 'Link copiado.') }
    catch { window.prompt('Copie o link:', texto) }
  }

  async function remover(p) {
    if (p.foto_path) await supabase.storage.from(BUCKET).remove([p.foto_path])
    const { error, count } = await supabase.from('evento_participantes').delete({ count: 'exact' }).eq('id', p.id)
    setARemover(null)
    if (error || count === 0) { avisar('erro', 'Não foi possível remover.'); return }
    avisar('ok', `${p.nome} removido da área de participantes.`)
    carregarPessoas(sel.id)
    setContagem(m => ({ ...m, [sel.id]: Math.max(0, (m[sel.id] || 1) - 1) }))
  }

  if (carregando) return <div style={{ color: t.subtle, padding: '20px 0' }}>A carregar…</div>

  const aviso = msg.texto && <div role="status" style={{ fontSize: '13px', fontWeight: 600, color: msg.tom === 'erro' ? t.neg : t.pos }}>{msg.texto}</div>
  const th = { ...c.th, textTransform: 'uppercase', letterSpacing: '.04em' }
  const rotulo = { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.04em', minWidth: 0 }
  const ligacao = { fontSize: '12.5px', fontWeight: 700, color: t.accentText }
  const datalist = <datalist id="landings-site">{LANDINGS.map(l => <option key={l} value={l} />)}</datalist>

  // ── Lista de eventos ──────────────────────────────────────────────────────
  if (!sel) {
    const lista = eventos
      .filter(e => filtro === 'todos' || (filtro === 'proximos' ? (e.data || '') >= hoje : (e.data || '') < hoje))
      .sort((a, b) => filtro === 'proximos' ? (a.data || '').localeCompare(b.data || '') : (b.data || '').localeCompare(a.data || ''))
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h1 className="so-leitores">Eventos</h1>
        {datalist}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Pilulas opcoes={[['proximos', 'Próximos'], ['passados', 'Passados'], ['todos', 'Todos']]} valor={filtro} aoMudar={setFiltro} />
          <div style={{ flex: 1 }} />
          <Botao variante="primario" onClick={() => setNovo(true)}>+ Novo evento</Botao>
        </div>
        {aviso}
        <Cartao semPadding>
          {lista.length === 0
            ? <div style={{ padding: '0 20px' }}><Vazio>{eventos.length ? 'Nenhum evento neste filtro.' : 'Ainda não há eventos. Crie o primeiro em "+ Novo evento".'}</Vazio></div>
            : (
              <div className="table-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Evento</th><th style={th}>Data</th><th style={th}>Landing page</th><th style={th}>Área de participantes</th><th style={{ ...th, textAlign: 'right' }}>Participantes</th><th style={th}><span className="so-leitores">Ações</span></th></tr></thead>
                  <tbody>
                    {lista.map(e => {
                      const est = estadoArea(e, hoje)
                      return (
                        <tr key={e.id} onClick={() => setSelId(e.id)} style={{ cursor: 'pointer' }}>
                          <td style={c.td}><div style={{ fontWeight: 700, color: t.heading }}>{e.nome}</div>{e.local && <div style={{ fontSize: '12px', color: t.subtle }}>{e.local}</div>}</td>
                          <td style={{ ...c.td, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{e.data ? dataCurta(e.data) : '—'}</td>
                          <td style={c.td}>{e.landing_url ? <a href={e.landing_url} target="_blank" rel="noopener noreferrer" onClick={ev => ev.stopPropagation()} style={ligacao}>Abrir ↗</a> : <span style={{ color: t.subtle }}>—</span>}</td>
                          <td style={c.td}><Chip tom={est.tom}>{est.texto}</Chip></td>
                          <td style={{ ...c.td, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{contagem[e.id] || 0}</td>
                          <td style={{ ...c.td, textAlign: 'right' }}><Botao onClick={ev => { ev.stopPropagation(); setSelId(e.id) }}>Abrir</Botao></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </Cartao>
        {novo && <NovoEvento aoFechar={() => setNovo(false)} aoCriar={criar} />}
      </div>
    )
  }

  // ── Um evento ─────────────────────────────────────────────────────────────
  const partilham = pessoas.filter(p => p.partilhar).length
  const est = estadoArea(sel, hoje)
  const gravarLanding = (v) => {
    const l = ligacaoValida(v)
    if (l === null) { avisar('erro', 'O endereço da landing page não é válido.'); return }
    alterar({ landing_url: l || null }, 'Landing page guardada.')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 className="so-leitores">{sel.nome}</h1>
      {datalist}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <Botao variante="fantasma" onClick={() => { setSelId(null); setConfirmar(''); setARemover(null) }}>← Todos os eventos</Botao>
        <div style={{ flex: 1 }} />
        <Chip tom={est.tom}>{est.texto === 'Sem área' ? 'Sem área de participantes' : `Área ${est.texto.toLowerCase()}`}</Chip>
      </div>
      {aviso}

      <Cartao titulo="Evento" acao={sel.landing_url && <a href={sel.landing_url} target="_blank" rel="noopener noreferrer" style={ligacao}>Ver a landing ↗</a>}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px' }}>
          <label style={rotulo}>Nome<CampoTexto key={sel.id + (sel.nome || '')} valor={sel.nome} maxLength={120} aoGravar={v => v.trim() ? alterar({ nome: v.trim() }, 'Nome guardado.') : avisar('erro', 'O evento precisa de um nome.')} estilo={c.input} /></label>
          <label style={rotulo}>Data<input type="date" value={sel.data || ''} onChange={e => e.target.value && alterar({ data: e.target.value }, 'Data guardada.')} style={c.input} /></label>
          <label style={rotulo}>Local<CampoTexto key={sel.id + (sel.local || '')} valor={sel.local} maxLength={160} placeholder="Ex.: District Space, Lisboa" aoGravar={v => alterar({ local: v.trim() || null }, 'Local guardado.')} estilo={c.input} /></label>
          <label style={rotulo}>Landing page<CampoTexto key={sel.id + (sel.landing_url || '')} valor={sel.landing_url} list="landings-site" placeholder="https://lcoffice.pt/… ou o link da Luma" inputMode="url" autoCapitalize="off" aoGravar={gravarLanding} estilo={c.input} /></label>
        </div>
      </Cartao>

      <Cartao titulo="Área de participantes">
        {!sel.codigo ? (
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
            <p style={{ margin: 0, flex: '1 1 320px', fontSize: '13.5px', color: t.text, lineHeight: 1.5 }}>
              Em vez de crachás, um QR code à entrada: quem o lê escreve o nome, cria o perfil e vê os outros participantes. Sem contas nem palavras-passe. Abre só nos dias que escolher.
            </p>
            <Botao variante="primario" onClick={() => alterar({ codigo: novoCodigo(), aberto_de: sel.aberto_de || sel.data, aberto_ate: sel.aberto_ate || sel.data }, 'Área de participantes criada.')}>Criar área de participantes</Botao>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: '0 0 auto', textAlign: 'center' }}>
              {qr && <img src={qr} alt={`QR code da área de participantes de ${sel.nome}`} width="200" height="200" style={{ display: 'block', borderRadius: '12px', border: `1px solid ${t.cardBorder}`, background: '#fff' }} />}
              {qr && <a href={qr} download={`qr-${sel.id}.png`} style={{ display: 'inline-block', marginTop: '8px', ...ligacao }}>Descarregar o QR (PNG)</a>}
            </div>
            <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ margin: 0, fontSize: '13.5px', color: t.text, lineHeight: 1.5 }}>
                Imprima ou projete este QR à entrada. Quem o ler escreve o nome, cria o perfil e vê os outros participantes.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <label style={rotulo}>Abre a
                  <input type="date" value={sel.aberto_de || ''} onChange={e => alterar({ aberto_de: e.target.value || null }, 'Data de abertura guardada.')} style={{ ...c.input, width: 'auto' }} />
                </label>
                <label style={rotulo}>Fecha depois de
                  <input type="date" value={sel.aberto_ate || ''} onChange={e => alterar({ aberto_ate: e.target.value || null }, 'Data de fecho guardada.')} style={{ ...c.input, width: 'auto' }} />
                </label>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Botao onClick={() => copiar(linkQR(sel.codigo))}>Copiar o link do QR</Botao>
                <a href={linkQR(sel.codigo)} target="_blank" rel="noopener noreferrer" style={ligacao}>Abrir a área ↗</a>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {confirmar === 'qr' ? (
                  <>
                    <span style={{ fontSize: '12px' }}>O QR atual deixa de funcionar. Continuar?</span>
                    <Botao variante="perigo" onClick={() => { setConfirmar(''); alterar({ codigo: novoCodigo() }, 'Novo QR gerado. O anterior deixou de funcionar.') }}>Gerar novo QR</Botao>
                    <Botao onClick={() => setConfirmar('')}>Cancelar</Botao>
                  </>
                ) : confirmar === 'desligar' ? (
                  <>
                    <span style={{ fontSize: '12px' }}>O QR deixa de funcionar e ninguém entra. Os perfis ficam guardados. Continuar?</span>
                    <Botao variante="perigo" onClick={() => { setConfirmar(''); alterar({ codigo: null }, 'Área de participantes desligada.') }}>Desligar a área</Botao>
                    <Botao onClick={() => setConfirmar('')}>Cancelar</Botao>
                  </>
                ) : (
                  <>
                    <Botao onClick={() => setConfirmar('qr')}>Gerar novo QR</Botao>
                    <Botao variante="perigo" onClick={() => setConfirmar('desligar')}>Desligar a área</Botao>
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '22px', flexWrap: 'wrap', fontSize: '13px', color: t.textMuted }}>
                <span><strong style={{ fontSize: '20px', color: t.heading }}>{pessoas.length}</strong> entraram</span>
                <span><strong style={{ fontSize: '20px', color: t.heading }}>{partilham}</strong> partilham o perfil</span>
              </div>
            </div>
          </div>
        )}
      </Cartao>

      <PalestrasAvaliacoes key={sel.id} evento={sel} avisar={avisar} />

      {(sel.codigo || pessoas.length > 0) && (
        <Cartao titulo="Quem entrou" semPadding>
          {pessoas.length === 0
            ? <div style={{ padding: '0 20px 20px' }}><Vazio>Ainda ninguém entrou. A lista enche-se no dia, à medida que as pessoas leem o QR.</Vazio></div>
            : (
              <div className="table-scroll">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr><th style={th}>Nome</th><th style={th}>Empresa · cargo</th><th style={th}>Perfil</th><th style={th}>Entrou</th><th style={th}><span className="so-leitores">Ações</span></th></tr></thead>
                  <tbody>
                    {pessoas.map(p => (
                      <tr key={p.id}>
                        <td style={{ ...c.td, fontWeight: 700, color: t.heading }}>{p.nome}</td>
                        <td style={c.td}>{[p.negocio, p.cargo].filter(Boolean).join(' · ') || '—'}{p.localidade ? <span style={{ color: t.subtle }}> · {p.localidade}</span> : null}</td>
                        <td style={c.td}>{p.partilhar ? <Chip tom="ok">Partilha</Chip> : <Chip>Não partilha</Chip>}</td>
                        <td style={{ ...c.td, fontVariantNumeric: 'tabular-nums' }}>{dataCurta(p.created_at.slice(0, 10))}</td>
                        <td style={{ ...c.td, whiteSpace: 'nowrap' }}>
                          {aRemover === p.id ? (
                            <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px' }}>Remover {primeiroNome(p.nome)}?</span>
                              <Botao variante="perigo" onClick={() => remover(p)}>Remover</Botao>
                              <Botao onClick={() => setARemover(null)}>Cancelar</Botao>
                            </span>
                          ) : <Botao variante="perigo" onClick={() => setARemover(p.id)}>Remover</Botao>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </Cartao>
      )}

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <p style={{ fontSize: '12px', color: t.subtle, margin: 0, flex: '1 1 320px' }}>
          Só aparece aos outros quem marcar "Partilhar". Se alguém entrar sem ser do evento, remova-o; se o QR circular fora da sala, gere um novo.
        </p>
        {confirmar === 'eliminar' ? (
          <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px' }}>Eliminar o evento, os perfis e as fotografias? Não se pode desfazer.</span>
            <Botao variante="perigo" onClick={eliminar}>Eliminar</Botao>
            <Botao onClick={() => setConfirmar('')}>Cancelar</Botao>
          </span>
        ) : <Botao variante="perigo" onClick={() => setConfirmar('eliminar')}>Eliminar evento</Botao>}
      </div>
    </div>
  )
}
