import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { Cartao, Botao, Chip, Janela, Vazio, Pilulas, Ic, useCampos, Campo } from '../../portal/ui'

// Marketing (reunião de 01/10): o planeamento do Instagram da LC Office,
// partilhado entre a Lúcia, a Letícia e a Nicole.
//   · Feed — a grelha como vai ficar no perfil, com as publicações planeadas;
//   · Calendário — o mês com o que sai em cada dia;
//   · Lista — tudo por data, com o estado de cada publicação;
//   · Anotações — o quadro de ideias e lembretes da equipa.
// Cada publicação tem data e hora, formato, estado, imagem, legenda (com
// contagem para o limite do Instagram), hashtags e notas internas.
// A integração com as métricas da Meta/Google continua um item à parte.

const BUCKET = 'client-docs'
const LIMITE_LEGENDA = 2200
const FORMATOS = [['post', 'Post'], ['carrossel', 'Carrossel'], ['reel', 'Reel'], ['story', 'Story']]
const ESTADOS = {
  ideia:     { rotulo: 'Ideia',     tom: 'neutro' },
  rascunho:  { rotulo: 'Rascunho',  tom: 'aviso' },
  aprovado:  { rotulo: 'Aprovado',  tom: 'ouro' },
  agendado:  { rotulo: 'Agendado',  tom: 'ok' },
  publicado: { rotulo: 'Publicado', tom: 'ok' },
}
const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const pad = (n) => String(n).padStart(2, '0')
const isoDe = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const hoje = () => isoDe(new Date())
const fmtData = (s) => { if (!s) return 'sem data'; const [y, m, d] = s.split('-'); return `${d}/${m}/${y}` }
const VAZIO = { id: null, data: '', hora: '', formato: 'post', estado: 'ideia', titulo: '', legenda: '', hashtags: '', imagem_path: null, notas: '' }

export default function Marketing() {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const { user } = useAuth()
  const c = useCampos()
  const eu = user?.user_metadata?.display_name || user?.email?.split('@')[0] || ''

  const [posts, setPosts] = useState([])
  const [notas, setNotas] = useState([])
  const [urls, setUrls] = useState({})            // imagem_path → ligação temporária
  const [carregado, setCarregado] = useState(false)
  const [erro, setErro] = useState('')
  const [vista, setVista] = useState('feed')
  const [mes, setMes] = useState(() => hoje().slice(0, 7))
  const [editar, setEditar] = useState(null)
  const [novaNota, setNovaNota] = useState('')

  const ler = useCallback(async () => {
    const [{ data: p, error: e1 }, { data: n, error: e2 }] = await Promise.all([
      supabase.from('marketing_posts').select('*').order('data', { ascending: false, nullsFirst: true }),
      supabase.from('marketing_notas').select('*').order('created_at', { ascending: false }),
    ])
    if (e1 || e2) setErro('Não foi possível ler o planeamento (a migração 043 já foi aplicada?).')
    setPosts(p || []); setNotas(n || []); setCarregado(true)
    const caminhos = (p || []).map(x => x.imagem_path).filter(Boolean)
    if (caminhos.length) {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrls(caminhos, 3600)
      setUrls(Object.fromEntries((data || []).filter(x => x.signedUrl).map(x => [x.path, x.signedUrl])))
    }
  }, [])
  useEffect(() => { ler() }, [ler])

  async function guardar(p, ficheiro) {
    setErro('')
    let imagem_path = p.imagem_path
    const id = p.id || crypto.randomUUID()
    if (ficheiro) {
      const nome = ficheiro.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').slice(-60)
      const caminho = `marketing/${id}/${Date.now().toString(36)}-${nome}`
      const { error } = await supabase.storage.from(BUCKET).upload(caminho, ficheiro, { upsert: false })
      if (error) { setErro('A imagem não foi carregada.'); return false }
      imagem_path = caminho
    }
    const linha = {
      id, data: p.data || null, hora: p.hora || null, formato: p.formato, estado: p.estado,
      titulo: p.titulo?.trim() || null, legenda: p.legenda || null, hashtags: p.hashtags?.trim() || null,
      imagem_path, notas: p.notas || null, autor: p.autor || eu, updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('marketing_posts').upsert(linha)
    if (error) { setErro('Não foi possível guardar a publicação.'); return false }
    await ler()
    return true
  }
  async function apagar(p) {
    if (!window.confirm('Apagar esta publicação do planeamento?')) return
    if (p.imagem_path) await supabase.storage.from(BUCKET).remove([p.imagem_path])
    await supabase.from('marketing_posts').delete().eq('id', p.id)
    setEditar(null); ler()
  }
  async function juntarNota() {
    if (!novaNota.trim()) return
    const { error } = await supabase.from('marketing_notas').insert({ texto: novaNota.trim(), autor: eu })
    if (error) { setErro('Não foi possível guardar a anotação.'); return }
    setNovaNota(''); ler()
  }
  async function alternarNota(n) {
    setNotas(prev => prev.map(x => x.id === n.id ? { ...x, feita: !x.feita } : x))
    await supabase.from('marketing_notas').update({ feita: !n.feita }).eq('id', n.id)
  }
  async function apagarNota(n) {
    setNotas(prev => prev.filter(x => x.id !== n.id))
    await supabase.from('marketing_notas').delete().eq('id', n.id)
  }

  // ── Derivados ──
  const comData = posts.filter(p => p.data)
  const proximos = comData.filter(p => p.data >= hoje() && p.estado !== 'publicado').sort((a, b) => (a.data + (a.hora || '')).localeCompare(b.data + (b.hora || '')))
  const contagem = Object.fromEntries(Object.keys(ESTADOS).map(k => [k, posts.filter(p => p.estado === k).length]))

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody }}>
      <h1 className="so-leitores">Marketing</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <Pilulas opcoes={[['feed', 'Feed'], ['calendario', 'Calendário'], ['lista', 'Lista'], ['notas', `Anotações${notas.filter(n => !n.feita).length ? ` (${notas.filter(n => !n.feita).length})` : ''}`]]} valor={vista} aoMudar={setVista} />
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '12px', color: t.subtle }}>
          {Object.entries(ESTADOS).filter(([k]) => contagem[k]).map(([k, v]) => `${contagem[k]} ${v.rotulo.toLowerCase()}${contagem[k] > 1 ? 's' : ''}`).join(' · ') || 'Ainda sem publicações'}
        </span>
        <Botao variante="primario" onClick={() => setEditar({ ...VAZIO, data: hoje() })}><Ic.mais size={16} />Nova publicação</Botao>
      </div>

      {erro && <div role="alert" style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '10px', padding: '10px 14px', fontSize: '12.5px', fontWeight: 600, marginBottom: '14px' }}>{erro}</div>}
      {!carregado && <Vazio>A carregar…</Vazio>}

      {/* ── Feed: como fica a grelha do perfil ── */}
      {carregado && vista === 'feed' && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '16px', alignItems: 'start' }}>
          <Cartao titulo="Prévia do feed" icone={<Ic.olho />}>
            {comData.length === 0 ? <Vazio>Sem publicações com data. Crie a primeira em "Nova publicação".</Vazio> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '3px', maxWidth: '520px', margin: '0 auto' }}>
                {[...comData].filter(p => p.formato !== 'story').sort((a, b) => (b.data + (b.hora || '')).localeCompare(a.data + (a.hora || ''))).map(p => (
                  <button key={p.id} onClick={() => setEditar({ ...VAZIO, ...p })} title={`${fmtData(p.data)} · ${ESTADOS[p.estado].rotulo}`}
                    style={{ position: 'relative', aspectRatio: '1 / 1', border: 'none', padding: 0, cursor: 'pointer', background: t.softCardBg, overflow: 'hidden', opacity: p.estado === 'publicado' ? 1 : 0.92 }}>
                    {p.imagem_path && urls[p.imagem_path]
                      ? <img src={urls[p.imagem_path]} alt={p.titulo || 'Publicação'} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', fontSize: '11.5px', fontWeight: 700, color: t.textMuted, textAlign: 'center' }}>{p.titulo || p.legenda?.slice(0, 60) || 'Sem imagem'}</span>}
                    <span style={{ position: 'absolute', left: '5px', bottom: '5px', fontSize: '10px', fontWeight: 800, padding: '2px 7px', borderRadius: '999px', background: 'rgba(14,61,51,.82)', color: '#fff' }}>{fmtData(p.data).slice(0, 5)}{p.estado !== 'publicado' ? ` · ${ESTADOS[p.estado].rotulo}` : ''}</span>
                    {p.formato !== 'post' && <span style={{ position: 'absolute', right: '5px', top: '5px', fontSize: '10px', fontWeight: 800, padding: '2px 7px', borderRadius: '999px', background: 'rgba(255,255,255,.9)', color: '#0E3D33' }}>{FORMATOS.find(([k]) => k === p.formato)?.[1]}</span>}
                  </button>
                ))}
              </div>
            )}
            <div style={{ fontSize: '11.5px', color: t.subtle, marginTop: '10px', textAlign: 'center' }}>As mais recentes em cima, como no perfil. Os stories ficam fora da grelha.</div>
          </Cartao>
          <Cartao titulo="Próximas publicações" icone={<Ic.agenda />}>
            {proximos.length === 0 ? <Vazio>Nada agendado.</Vazio> : proximos.slice(0, 8).map((p, i) => (
              <button key={p.id} onClick={() => setEditar({ ...VAZIO, ...p })}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', textAlign: 'left', padding: '9px 0', border: 'none', borderTop: i ? `1px solid ${t.rowBorder}` : 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: t.heading, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.titulo || p.legenda?.slice(0, 50) || 'Sem título'}</div>
                  <div style={{ fontSize: '11.5px', color: t.subtle }}>{fmtData(p.data)}{p.hora ? ` · ${p.hora}` : ''} · {FORMATOS.find(([k]) => k === p.formato)?.[1]}</div>
                </div>
                <Chip tom={ESTADOS[p.estado].tom}>{ESTADOS[p.estado].rotulo}</Chip>
              </button>
            ))}
          </Cartao>
        </div>
      )}

      {/* ── Calendário do mês ── */}
      {carregado && vista === 'calendario' && (() => {
        const [y, m] = mes.split('-').map(Number)
        const primeiro = new Date(y, m - 1, 1)
        const desloc = (primeiro.getDay() + 6) % 7
        const diasMes = new Date(y, m, 0).getDate()
        const celulas = [...Array(desloc).fill(null), ...Array.from({ length: diasMes }, (_, i) => `${y}-${pad(m)}-${pad(i + 1)}`)]
        const muda = (n) => { const d = new Date(y, m - 1 + n, 1); setMes(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`) }
        return (
          <Cartao titulo={`${MESES[m - 1]} ${y}`} icone={<Ic.agenda />}
            acao={<div style={{ display: 'flex', gap: '6px' }}><Botao onClick={() => muda(-1)} aria-label="Mês anterior">‹</Botao><Botao onClick={() => setMes(hoje().slice(0, 7))}>Hoje</Botao><Botao onClick={() => muda(1)} aria-label="Mês seguinte">›</Botao></div>}>
            <div style={{ overflowX: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(96px, 1fr))', gap: '4px', minWidth: '700px' }}>
                {DIAS.map(d => <div key={d} style={{ fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', padding: '4px 6px' }}>{d}</div>)}
                {celulas.map((dia, i) => (
                  <div key={i} style={{ minHeight: '92px', borderRadius: '9px', padding: '6px', background: dia ? t.softCardBg : 'transparent', border: dia === hoje() ? `2px solid ${t.accent}` : '2px solid transparent' }}>
                    {dia && <>
                      <button onClick={() => setEditar({ ...VAZIO, data: dia })} aria-label={`Nova publicação a ${fmtData(dia)}`}
                        style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'none', padding: 0, fontSize: '12px', fontWeight: 700, color: t.textMuted, cursor: 'pointer', marginBottom: '4px' }}>{Number(dia.slice(8))}</button>
                      {posts.filter(p => p.data === dia).map(p => (
                        <button key={p.id} onClick={() => setEditar({ ...VAZIO, ...p })}
                          style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', borderRadius: '6px', padding: '3px 6px', marginBottom: '3px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: p.estado === 'publicado' || p.estado === 'agendado' ? t.dueOk.bg : p.estado === 'ideia' ? t.cardBg : t.dueSoon.bg, color: p.estado === 'publicado' || p.estado === 'agendado' ? t.dueOk.ink : p.estado === 'ideia' ? t.textMuted : t.dueSoon.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.hora ? `${p.hora} ` : ''}{p.titulo || FORMATOS.find(([k]) => k === p.formato)?.[1]}
                        </button>
                      ))}
                    </>}
                  </div>
                ))}
              </div>
            </div>
          </Cartao>
        )
      })()}

      {/* ── Lista ── */}
      {carregado && vista === 'lista' && (
        <Cartao titulo="Todas as publicações" icone={<Ic.lista />} semPadding>
          {posts.length === 0 ? <Vazio>Ainda sem publicações.</Vazio> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
                <thead><tr>{['Data', 'Formato', 'Publicação', 'Estado', 'Quem'].map(h => <th key={h} style={c.th}>{h}</th>)}</tr></thead>
                <tbody>{[...posts].sort((a, b) => (b.data || '9999').localeCompare(a.data || '9999')).map(p => (
                  <tr key={p.id} onClick={() => setEditar({ ...VAZIO, ...p })} style={{ cursor: 'pointer' }}>
                    <td style={{ ...c.td, whiteSpace: 'nowrap' }}>{fmtData(p.data)}{p.hora ? ` · ${p.hora}` : ''}</td>
                    <td style={c.td}>{FORMATOS.find(([k]) => k === p.formato)?.[1]}</td>
                    <td style={c.td}><div style={{ fontWeight: 700, color: t.heading }}>{p.titulo || 'Sem título'}</div><div style={{ fontSize: '11.5px', color: t.subtle, maxWidth: '420px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.legenda || '—'}</div></td>
                    <td style={c.td}><Chip tom={ESTADOS[p.estado].tom}>{ESTADOS[p.estado].rotulo}</Chip></td>
                    <td style={c.td}>{p.autor || '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </Cartao>
      )}

      {/* ── Anotações da equipa ── */}
      {carregado && vista === 'notas' && (
        <Cartao titulo="Anotações da equipa" icone={<Ic.mensagens />}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <input value={novaNota} onChange={e => setNovaNota(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') juntarNota() }}
              placeholder="Ideia, lembrete ou pedido para a equipa…" aria-label="Nova anotação" style={{ ...c.input, flex: '1 1 260px' }} />
            <Botao variante="primario" onClick={juntarNota}>Juntar</Botao>
          </div>
          {notas.length === 0 ? <Vazio>Sem anotações.</Vazio> : notas.map((n, i) => (
            <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '9px 0', borderTop: i ? `1px solid ${t.rowBorder}` : 'none' }}>
              <input type="checkbox" checked={n.feita} onChange={() => alternarNota(n)} aria-label="Marcar como feita" style={{ marginTop: '3px', width: '16px', height: '16px', cursor: 'pointer' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13.5px', color: n.feita ? t.subtle : t.heading, textDecoration: n.feita ? 'line-through' : 'none', whiteSpace: 'pre-wrap' }}>{n.texto}</div>
                <div style={{ fontSize: '11px', color: t.subtle, marginTop: '2px' }}>{n.autor || '—'} · {fmtData(n.created_at?.slice(0, 10))}</div>
              </div>
              <button onClick={() => apagarNota(n)} aria-label="Apagar anotação" style={{ background: 'none', border: 'none', color: t.subtle, cursor: 'pointer', fontSize: '14px', padding: '4px' }}>✕</button>
            </div>
          ))}
        </Cartao>
      )}

      {editar && <EditorPublicacao inicial={editar} url={editar.imagem_path ? urls[editar.imagem_path] : null}
        aoFechar={() => setEditar(null)} aoGuardar={async (p, f) => { if (await guardar(p, f)) setEditar(null) }} aoApagar={apagar} />}
    </div>
  )
}

function EditorPublicacao({ inicial, url, aoFechar, aoGuardar, aoApagar }) {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const c = useCampos()
  const [p, setP] = useState(inicial)
  const [ficheiro, setFicheiro] = useState(null)
  const [previa, setPrevia] = useState(url)
  const [aGuardar, setAGuardar] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const set = (k) => (e) => setP(x => ({ ...x, [k]: e.target.value }))
  const texto = [p.legenda, p.hashtags].filter(Boolean).join('\n\n')
  const excede = texto.length > LIMITE_LEGENDA

  function escolher(e) {
    const f = e.target.files?.[0]; if (!f) return
    setFicheiro(f); setPrevia(URL.createObjectURL(f))
  }

  return (
    <Janela titulo={inicial.id ? 'Publicação' : 'Nova publicação'} aoFechar={aoFechar} largura={760}>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1.3fr)', gap: '16px' }}>
        <div>
          <div style={{ aspectRatio: p.formato === 'story' || p.formato === 'reel' ? '9 / 16' : '1 / 1', maxHeight: '420px', borderRadius: '10px', overflow: 'hidden', background: t.softCardBg, border: `1px dashed ${t.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
            {previa ? <img src={previa} alt="Pré-visualização" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '12px', color: t.subtle }}>Sem imagem</span>}
          </div>
          <label style={{ display: 'inline-flex', marginTop: '10px', padding: '8px 14px', borderRadius: '9px', border: `1px solid ${t.cardBorder}`, fontSize: '12.5px', fontWeight: 700, color: t.heading, cursor: 'pointer' }}>
            {previa ? 'Trocar imagem' : 'Escolher imagem'}
            <input type="file" accept="image/*" onChange={escolher} style={{ display: 'none' }} />
          </label>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Campo rotulo="Título interno"><input value={p.titulo || ''} onChange={set('titulo')} placeholder="ex.: Dica fiscal da semana" style={c.input} /></Campo>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
            <Campo rotulo="Data"><input type="date" value={p.data || ''} onChange={set('data')} style={c.input} /></Campo>
            <Campo rotulo="Hora"><input type="time" value={p.hora || ''} onChange={set('hora')} style={c.input} /></Campo>
            <Campo rotulo="Formato"><select value={p.formato} onChange={set('formato')} style={{ ...c.input, cursor: 'pointer' }}>{FORMATOS.map(([k, r]) => <option key={k} value={k}>{r}</option>)}</select></Campo>
            <Campo rotulo="Estado"><select value={p.estado} onChange={set('estado')} style={{ ...c.input, cursor: 'pointer' }}>{Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.rotulo}</option>)}</select></Campo>
          </div>
          <Campo rotulo="Legenda"><textarea value={p.legenda || ''} onChange={set('legenda')} rows={6} style={{ ...c.input, resize: 'vertical' }} /></Campo>
          <Campo rotulo="Hashtags"><input value={p.hashtags || ''} onChange={set('hashtags')} placeholder="#empreendedorismo #contabilidade" style={c.input} /></Campo>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11.5px', color: excede ? t.dueLate.ink : t.subtle, fontWeight: excede ? 700 : 400 }}>
            <span>{texto.length} / {LIMITE_LEGENDA} caracteres{excede ? ' — acima do limite do Instagram' : ''}</span>
            <button onClick={() => { navigator.clipboard?.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 1600) }}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: t.accentText, fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>{copiado ? 'Copiado ✓' : 'Copiar legenda'}</button>
          </div>
          <Campo rotulo="Notas da equipa"><textarea value={p.notas || ''} onChange={set('notas')} rows={2} placeholder="Comentários, alterações pedidas, referências…" style={{ ...c.input, resize: 'vertical' }} /></Campo>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
        <Botao variante="primario" disabled={aGuardar} onClick={async () => { setAGuardar(true); await aoGuardar(p, ficheiro); setAGuardar(false) }}>{aGuardar ? 'A guardar…' : 'Guardar'}</Botao>
        <Botao onClick={aoFechar}>Cancelar</Botao>
        <div style={{ flex: 1 }} />
        {inicial.id && <Botao variante="perigo" onClick={() => aoApagar(inicial)}>Apagar</Botao>}
        {inicial.autor && <span style={{ alignSelf: 'center', fontSize: '11.5px', color: t.subtle }}>criada por {inicial.autor}</span>}
      </div>
    </Janela>
  )
}
