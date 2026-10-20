import { useState, useEffect, useCallback, useRef } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import EsqueletoPagina from '../../components/EsqueletoPagina'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import { AlvoESGProvider } from '../../context/AlvoESGContext'
import { listUsers } from '../../lib/adminApi'
import NotasInternasESG from '../../components/esg/NotasInternasESG'
import { NIVEIS, txt } from '../../data/esgMetodo'

// Um caso ESG aberto na Gestão. Abre num separador próprio, com o menu da ESG
// na barra lateral — é a plataforma ESG tal como o cliente a vê, só que com a
// Lúcia a preencher. Foi assim que ela pediu (19/09): a ESG tem de parecer o
// produto que é, também quando partilha o ecrã, e não uma aba da gestão.
//
// Por isso este ficheiro é só uma tira fina em cima (quem é, estado, o que o
// cliente vê) e as seis páginas por baixo, iguais às de sempre.
// 13-D (13/10): a etiqueta "Conta ligada" e a caixa "O cliente vê…" eram dois
// controlos para a mesma pergunta — fica um só, "Cliente vê: Sim · Não". O nome
// da empresa vive só nesta tira (saiu a caixa por cima do menu lateral).

const IconLapis = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ verticalAlign: '-0.1em' }}><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></svg>
)

export default function CasoESG() {
  const { id } = useParams()
  const { lang } = useLang()
  const { t } = useTheme()

  const [caso, setCaso] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  // Editar o contacto e a conta do caso depois de criado (R-D10)
  const [editar, setEditar] = useState(null)
  const [contas, setContas] = useState([])
  async function abrirEdicao() {
    setEditar({ nome: caso.nome || '', empresa: caso.empresa || '', email: caso.email || '', telefone: caso.telefone || '', setor: caso.setor || '', user_id: caso.user_id || '' })
    if (!contas.length) setContas((await listUsers().catch(() => [])).filter(u => u.role === 'user'))
  }
  async function guardarEdicao() {
    if (!editar.nome.trim()) return
    await alterar({ ...editar, nome: editar.nome.trim(), user_id: editar.user_id || null, visivel_cliente: editar.user_id ? caso.visivel_cliente : false })
    setEditar(null)
  }

  const L = lang === 'de' ? {
    voltar: 'ESG-Beratungen', editar: 'Bearbeiten', guardar: 'Speichern', fechar: 'Schließen', nome: 'Kontaktperson', empresa: 'Unternehmen', email: 'E-Mail', telefone: 'Telefon', setor: 'Branche', contaL: 'Plattformkonto', semContaOpt: '— ohne Konto —', apresentar: 'Dem Kunden zeigen', ativa: 'Laufend', concluida: 'Abgeschlossen', pausada: 'Pausiert',
    clienteVe: 'Kunde sieht', sim: 'Ja', nao: 'Nein', semConta: 'ohne Konto (unter „Bearbeiten“ verknüpfen)', ajudaVe: 'Weg und Bericht in der Plattform des Kunden',
    naoEncontrado: 'ESG-Beratung nicht gefunden.', erroSave: 'Speichern fehlgeschlagen.', nivel: 'Leistungsstufe',
  } : lang === 'en' ? {
    voltar: 'ESG consultancies', editar: 'Edit', guardar: 'Save', fechar: 'Close', nome: 'Contact person', empresa: 'Company', email: 'E-mail', telefone: 'Phone', setor: 'Sector', contaL: 'Platform account', semContaOpt: '— no account —', apresentar: 'Show to client', ativa: 'Active', concluida: 'Completed', pausada: 'Paused',
    clienteVe: 'Client sees', sim: 'Yes', nao: 'No', semConta: 'no account (link it in Edit)', ajudaVe: "Journey and report in the client's platform",
    naoEncontrado: 'ESG consultancy not found.', erroSave: 'Save failed.', nivel: 'Service level',
  } : {
    voltar: 'Consultorias ESG', editar: 'Editar', guardar: 'Guardar', fechar: 'Fechar', nome: 'Pessoa de contacto', empresa: 'Empresa', email: 'E-mail', telefone: 'Telefone', setor: 'Setor', contaL: 'Conta na plataforma', semContaOpt: '— sem conta —', apresentar: 'Apresentar ao cliente', ativa: 'Ativa', concluida: 'Concluída', pausada: 'Pausada',
    clienteVe: 'Cliente vê', sim: 'Sim', nao: 'Não', semConta: 'sem conta (ligar em Editar)', ajudaVe: 'Percurso e relatório na plataforma do cliente',
    naoEncontrado: 'Consultoria ESG não encontrada.', erroSave: 'Falha ao guardar.', nivel: 'Nível do serviço',
  }

  // O método (migração 046) grava-se por partes — arranque, fotografia, reuniões…
  // A referência guarda o objeto inteiro mais recente, para duas gravações
  // seguidas não se apagarem uma à outra.
  const metodoRef = useRef({})
  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('esg_consultorias').select('*').eq('id', id).maybeSingle()
    metodoRef.current = data?.metodo || {}
    setCaso(data || null)
    setLoading(false)
  }, [id])
  useEffect(() => { load() }, [load])

  async function alterar(patch) {
    setErro('')
    setCaso(prev => ({ ...prev, ...patch }))
    const { error } = await supabase.from('esg_consultorias')
      .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { setErro(L.erroSave); load() }
  }

  async function alterarMetodo(chave, valor) {
    metodoRef.current = { ...metodoRef.current, [chave]: valor }
    await alterar({ metodo: metodoRef.current })
  }

  if (loading) return <EsqueletoPagina cartoes={2} linhas={4} />
  if (!caso) return (
    <div style={{ padding: '40px 0' }}>
      <a href="/gestao/esg" style={{ color: t.accentText, fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>← {L.voltar}</a>
      <div style={{ color: t.subtle, fontSize: '14px', marginTop: '12px' }}>{L.naoEncontrado}</div>
    </div>
  )

  const statusTone = { ativa: t.dueOk, concluida: { bg: t.chipBg, ink: t.chipText }, pausada: { bg: t.segBg, ink: t.textMuted } }
  const tone = statusTone[caso.status] || statusTone.ativa

  return (
    <AlvoESGProvider value={{ caso, id: caso.id, base: `/gestao/esg/${id}`, soLeitura: false, recarregar: load, alterarMetodo }}>
      <div style={{ width: '100%', fontFamily: t.fontBody }}>
        {/* Tira do caso: discreta, para não roubar o ecrã às páginas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '12px', color: t.textMuted, marginBottom: '16px', paddingBottom: '12px', borderBottom: `1px solid ${t.cardBorder}` }}>
          <a href="/gestao/esg" style={{ color: t.accentText, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>← {L.voltar}</a>
          <span style={{ color: t.subtle }}>·</span>
          <span style={{ fontWeight: 700, color: t.heading }}>{caso.empresa || caso.nome}</span>
          {caso.empresa && <span>{caso.nome}</span>}
          <button onClick={abrirEdicao} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: t.accentText, fontWeight: 700, fontSize: '11.5px' }}><IconLapis /> {L.editar}</button>
          <span style={{ marginLeft: 'auto' }} />
          {/* Abre num separador próprio, sem menus — para mostrar ao cliente (18/09) */}
          <a href={`/apresentacao/esg/${id}`} target="_blank" rel="noopener"
            style={{ padding: '5px 12px', borderRadius: '8px', background: t.btnBg, color: t.btnInk, fontSize: '11.5px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>{L.apresentar} ↗</a>
          {/* Nível contratado (documento do método, 15/10): Diagnóstico · Desenvolvimento · Reporting */}
          <select value={caso.nivel || 'diagnostico'} onChange={e => alterar({ nivel: e.target.value })} aria-label={L.nivel} title={L.nivel}
            style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, border: `1px solid ${t.cardBorder}`, background: t.cardBg, color: t.heading, cursor: 'pointer', outline: 'none' }}>
            {NIVEIS.map(n => <option key={n.key} value={n.key}>{txt(n.nome, lang)}</option>)}
          </select>
          <select value={caso.status} onChange={e => alterar({ status: e.target.value })}
            style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, border: 'none', background: tone.bg, color: tone.ink, cursor: 'pointer', outline: 'none' }}>
            {['ativa', 'concluida', 'pausada'].map(s => <option key={s} value={s}>{L[s]}</option>)}
          </select>
          {caso.user_id ? (
            <span role="group" aria-label={L.clienteVe} title={L.ajudaVe} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
              {L.clienteVe}:
              <span style={{ display: 'inline-flex', padding: '2px', borderRadius: '20px', background: t.segBg, border: `1px solid ${t.segBorder}` }}>
                {[[true, L.sim], [false, L.nao]].map(([v, rot]) => {
                  const on = !!caso.visivel_cliente === v
                  return (
                    <button key={rot} type="button" aria-pressed={on} onClick={() => { if (!on) alterar({ visivel_cliente: v }) }}
                      style={{ padding: '2px 10px', borderRadius: '20px', border: 'none', fontSize: '11px', fontWeight: 700, cursor: on ? 'default' : 'pointer', background: on ? t.cardBg : 'transparent', color: on ? (v ? t.dueOk.ink : t.heading) : t.subtle }}>{rot}</button>
                  )
                })}
              </span>
            </span>
          ) : (
            <span style={{ fontSize: '11px', fontWeight: 600, color: t.subtle, whiteSpace: 'nowrap' }}>{L.clienteVe}: {L.semConta}</span>
          )}
          {erro && <span style={{ fontWeight: 700, color: t.neg }}>{erro}</span>}
        </div>

        {editar && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end', padding: '12px 14px', marginBottom: '16px', borderRadius: '12px', border: `1px solid ${t.cardBorder}`, background: t.softCardBg }}>
            {[['empresa', L.empresa], ['nome', L.nome], ['email', L.email], ['telefone', L.telefone], ['setor', L.setor]].map(([k, rot]) => (
              <label key={k} style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', fontWeight: 700, color: t.textMuted, flex: '1 1 150px' }}>{rot}
                <input value={editar[k]} onChange={e => setEditar(p => ({ ...p, [k]: e.target.value }))} style={{ padding: '7px 9px', borderRadius: '8px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '13px' }} />
              </label>
            ))}
            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', fontWeight: 700, color: t.textMuted, flex: '1 1 200px' }}>{L.contaL}
              <select value={editar.user_id} onChange={e => setEditar(p => ({ ...p, user_id: e.target.value }))} style={{ padding: '7px 9px', borderRadius: '8px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '13px' }}>
                <option value="">{L.semContaOpt}</option>
                {contas.map(u => <option key={u.id} value={u.id}>{u.display_name || u.email} · {u.email}</option>)}
              </select>
            </label>
            <button onClick={guardarEdicao} disabled={!editar.nome.trim()} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: t.btnBg, color: t.btnInk, fontWeight: 700, fontSize: '12.5px', cursor: 'pointer' }}>{L.guardar}</button>
            <button onClick={() => setEditar(null)} aria-label={L.fechar} title={L.fechar} style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.cardBorder}`, background: 'transparent', color: t.textMuted, fontSize: '12.5px', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        <Outlet />
        {/* Caixa de comentários interna (pedido de 15/10). Só aqui, na Gestão: o
            modo apresentação e a área do cliente não a mostram, e a tabela
            esg_interno só a administradora a lê. */}
        <NotasInternasESG casoId={caso.id} />
      </div>
    </AlvoESGProvider>
  )
}
