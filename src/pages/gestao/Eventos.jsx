import { useState, useEffect, useCallback, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import { lerInscritos } from '../../lib/inscritosEvento'
import { dataCurta } from '../../lib/formato'
import { Cartao, Botao, Chip, Vazio, Ic, useCampos } from '../../portal/ui'

// Eventos (pedido da Lúcia, 20/10): a lista de inscritos de um evento e o link
// pessoal de cada um para a área de participantes (/momentos/participantes,
// migração 048). A lista vem do Luma (exportar convidados → CSV) ou junta-se à
// mão. Cada link é aleatório e só serve para aquele participante; enviar por
// WhatsApp ou e-mail, um a um ou em CSV.
// Os participantes não têm conta: só a administradora vê esta lista (RLS).

const BUCKET = 'eventos'
const BASE_LINK = `${typeof window !== 'undefined' ? window.location.origin : ''}/momentos/participantes/#t=`

const novoToken = () => {
  const b = new Uint8Array(24)
  crypto.getRandomValues(b)
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
const linkDe = (p) => BASE_LINK + p.token
const primeiroNome = (n) => String(n || '').trim().split(/\s+/)[0] || ''
const mensagemDe = (p, evento) =>
  `Olá ${primeiroNome(p.nome)}! Para o ${evento?.nome || 'evento'} abrimos uma área onde os participantes se podem conhecer e ligar antes e depois do encontro. Este é o seu link pessoal (não o partilhe): ${linkDe(p)}`
const semAcentos = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function Eventos() {
  const { t } = useTheme()
  const c = useCampos()
  const [evento, setEvento] = useState(null)
  const [pessoas, setPessoas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [msg, setMsg] = useState({ tom: '', texto: '' })
  const [novo, setNovo] = useState({ nome: '', email: '' })
  const [filtro, setFiltro] = useState('')
  const [aRemover, setARemover] = useState(null)
  const ficheiroRef = useRef(null)

  const avisar = (tom, texto) => { setMsg({ tom, texto }); if (tom !== 'erro') setTimeout(() => setMsg({ tom: '', texto: '' }), 3500) }

  const carregar = useCallback(async () => {
    const { data: evs } = await supabase.from('eventos').select('*').order('data', { ascending: false })
    const ev = (evs || [])[0] || null
    setEvento(ev)
    if (ev) {
      const { data } = await supabase.from('evento_participantes')
        .select('id, nome, email, token, negocio, partilhar, foto_path, ultimo_acesso, created_at').eq('evento_id', ev.id).order('nome')
      setPessoas(data || [])
    }
    setCarregando(false)
  }, [])
  useEffect(() => { carregar() }, [carregar])

  async function juntar(lista) {
    const existentes = new Set(pessoas.map(p => String(p.email || '').toLowerCase()))
    const novos = lista.filter(p => !existentes.has(p.email)).map(p => ({ evento_id: evento.id, nome: p.nome, email: p.email, token: novoToken() }))
    if (!novos.length) { avisar('ok', 'Nenhum inscrito novo: todos já estavam na lista.'); return }
    const { error } = await supabase.from('evento_participantes').insert(novos)
    if (error) { avisar('erro', 'Não foi possível juntar os inscritos (falta a migração 048?).'); return }
    avisar('ok', novos.length === 1 ? '1 inscrito juntado.' : `${novos.length} inscritos juntados.`)
    carregar()
  }

  async function importar(ev) {
    const f = ev.target.files?.[0]
    ev.target.value = ''
    if (!f) return
    const lista = lerInscritos(await f.text())
    if (lista === null) { avisar('erro', 'O ficheiro precisa de colunas com o nome e o e-mail (no Luma: Convidados → Exportar → CSV).'); return }
    if (!lista.length) { avisar('erro', 'Não encontrei inscritos com nome e e-mail válidos no ficheiro.'); return }
    juntar(lista)
  }

  async function juntarUm(e) {
    e.preventDefault()
    const email = novo.email.trim().toLowerCase()
    if (!novo.nome.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { avisar('erro', 'Escreva o nome e um e-mail válido.'); return }
    await juntar([{ nome: novo.nome.trim(), email }])
    setNovo({ nome: '', email: '' })
  }

  async function copiar(texto, rotulo) {
    try { await navigator.clipboard.writeText(texto); avisar('ok', `Copiado: ${rotulo.toLowerCase()}.`) }
    catch { window.prompt('Copie o texto:', texto) }
  }

  async function remover(p) {
    if (p.foto_path) await supabase.storage.from(BUCKET).remove([p.foto_path])
    const { error, count } = await supabase.from('evento_participantes').delete({ count: 'exact' }).eq('id', p.id)
    setARemover(null)
    if (error || count === 0) { avisar('erro', 'Não foi possível remover.'); return }
    avisar('ok', `${p.nome} removido. O link dele deixa de funcionar.`)
    carregar()
  }

  async function novoLink(p) {
    const { error } = await supabase.from('evento_participantes').update({ token: novoToken() }).eq('id', p.id)
    if (error) { avisar('erro', 'Não foi possível gerar outro link.'); return }
    avisar('ok', `Novo link para ${p.nome}. O anterior deixou de funcionar.`)
    carregar()
  }

  function descarregarCSV() {
    const q = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`
    const csv = ['nome;email;link', ...pessoas.map(p => [q(p.nome), q(p.email), q(linkDe(p))].join(';'))].join('\r\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }))
    a.download = `links-participantes-${evento.id}.csv`
    a.click()
  }

  if (carregando) return <div style={{ color: t.subtle, padding: '20px 0' }}>A carregar…</div>
  if (!evento) return <Vazio>Ainda não há eventos. Falta correr a migração 048 na base de dados.</Vazio>

  const comPerfil = pessoas.filter(p => p.partilhar).length
  const entraram = pessoas.filter(p => p.ultimo_acesso).length
  const lista = pessoas.filter(p => !filtro || semAcentos(`${p.nome} ${p.email}`).includes(semAcentos(filtro)))
  const th = { textAlign: 'left', padding: '9px 10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: t.textMuted, borderBottom: `1px solid ${t.cardBorder}` }
  const td = { padding: '10px', fontSize: '13px', color: t.text, borderBottom: `1px solid ${t.rowBorder}`, verticalAlign: 'middle' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h1 className="so-leitores">Eventos</h1>

      <Cartao titulo={`${evento.nome} · ${dataCurta(evento.data)}`}
        acao={<a href="/momentos/" target="_blank" rel="noopener" style={{ fontSize: '12.5px', fontWeight: 700, color: t.accentText }}>Ver a landing ↗</a>}>
        <div style={{ display: 'flex', gap: '22px', flexWrap: 'wrap', marginBottom: '14px', fontSize: '13px', color: t.textMuted }}>
          <span><strong style={{ fontSize: '20px', color: t.heading }}>{pessoas.length}</strong> inscritos</span>
          <span><strong style={{ fontSize: '20px', color: t.heading }}>{entraram}</strong> já entraram</span>
          <span><strong style={{ fontSize: '20px', color: t.heading }}>{comPerfil}</strong> partilham o perfil</span>
          {evento.aberto_ate && <span>Área aberta até {dataCurta(evento.aberto_ate)}</span>}
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input type="search" value={filtro} onChange={e => setFiltro(e.target.value)} placeholder="Procurar nome ou e-mail" aria-label="Procurar inscrito" style={{ ...c.input, width: 'auto', minWidth: '220px', flex: '1 1 220px' }} />
          <span style={{ flex: 1 }} />
          <input ref={ficheiroRef} type="file" accept=".csv,text/csv" onChange={importar} className="so-leitores" id="csv-luma" />
          <Botao onClick={() => ficheiroRef.current?.click()}><Ic.doc size={16} />Importar do Luma (CSV)</Botao>
          {pessoas.length > 0 && <Botao onClick={descarregarCSV}><Ic.lista size={16} />Descarregar links (CSV)</Botao>}
        </div>
        <form onSubmit={juntarUm} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
          <input value={novo.nome} onChange={e => setNovo(p => ({ ...p, nome: e.target.value }))} placeholder="Nome" aria-label="Nome do inscrito" style={{ ...c.input, flex: '1 1 180px', width: 'auto' }} />
          <input value={novo.email} onChange={e => setNovo(p => ({ ...p, email: e.target.value }))} placeholder="E-mail" type="email" aria-label="E-mail do inscrito" style={{ ...c.input, flex: '1 1 220px', width: 'auto' }} />
          <Botao variante="primario" type="submit"><Ic.mais size={16} />Juntar inscrito</Botao>
        </form>
        {msg.texto && <div role="status" style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: msg.tom === 'erro' ? t.neg : t.pos }}>{msg.texto}</div>}
      </Cartao>

      <Cartao semPadding>
        {pessoas.length === 0
          ? <div style={{ padding: '20px' }}><Vazio>Ainda não há inscritos. No Luma: Convidados → Exportar → CSV, e depois "Importar do Luma".</Vazio></div>
          : (
            <div className="table-scroll">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>Nome</th><th style={th}>E-mail</th><th style={th}>Perfil</th><th style={th}>Entrou</th><th style={th}><span className="so-leitores">Ações</span></th></tr></thead>
                <tbody>
                  {lista.map(p => (
                    <tr key={p.id}>
                      <td style={{ ...td, fontWeight: 700, color: t.heading }}>{p.nome}{p.negocio && <div style={{ fontWeight: 400, fontSize: '12px', color: t.subtle }}>{p.negocio}</div>}</td>
                      <td style={td}>{p.email}</td>
                      <td style={td}>{p.partilhar ? <Chip tom="ok">Partilha</Chip> : <Chip>Não partilha</Chip>}</td>
                      <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{p.ultimo_acesso ? dataCurta(p.ultimo_acesso.slice(0, 10)) : '—'}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        {aRemover === p.id ? (
                          <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px' }}>Remover {primeiroNome(p.nome)}?</span>
                            <Botao onClick={() => remover(p)} estilo={{ color: t.neg }}>Remover</Botao>
                            <Botao onClick={() => setARemover(null)}>Cancelar</Botao>
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap' }}>
                            <Botao onClick={() => copiar(mensagemDe(p, evento), 'Mensagem')} title="Copiar a mensagem com o link, para WhatsApp ou e-mail"><Ic.whats size={15} />Mensagem</Botao>
                            <Botao onClick={() => copiar(linkDe(p), 'Link')} title="Copiar só o link pessoal">Link</Botao>
                            <Botao onClick={() => novoLink(p)} title="Gerar outro link (o atual deixa de funcionar)">Novo link</Botao>
                            <Botao onClick={() => setARemover(p.id)} estilo={{ color: t.neg }}>Remover</Botao>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </Cartao>
      <p style={{ fontSize: '12px', color: t.subtle, margin: 0 }}>
        Cada link é pessoal: quem o tiver entra como aquele participante. Se alguém o perder ou o partilhar, use "Novo link". O e-mail dos inscritos nunca aparece aos outros participantes.
      </p>
    </div>
  )
}
