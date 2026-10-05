import { useState, useEffect, useCallback } from 'react'
import { Outlet, useParams } from 'react-router-dom'
import EsqueletoPagina from '../../components/EsqueletoPagina'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import { AlvoESGProvider } from '../../context/AlvoESGContext'
import { listUsers } from '../../lib/adminApi'

// Um caso ESG aberto na Gestão. Abre num separador próprio, com o menu da ESG
// na barra lateral — é a plataforma ESG tal como o cliente a vê, só que com a
// Lúcia a preencher. Foi assim que ela pediu (19/09): a ESG tem de parecer o
// produto que é, também quando partilha o ecrã, e não uma aba da gestão.
//
// Por isso este ficheiro é só uma tira fina em cima (quem é, estado, o que o
// cliente vê) e as seis páginas por baixo, iguais às de sempre.

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
    voltar: 'ESG-Beratungen', editar: 'Bearbeiten', guardar: 'Speichern', nome: 'Kontaktperson', empresa: 'Unternehmen', email: 'E-Mail', telefone: 'Telefon', setor: 'Branche', contaL: 'Plattformkonto', semContaOpt: '— ohne Konto —', apresentar: 'Präsentationsmodus', ativa: 'Laufend', concluida: 'Abgeschlossen', pausada: 'Pausiert',
    conta: 'Konto verknüpft', semConta: 'ohne Konto', visivel: 'Kunde sieht Weg & Bericht', oculto: 'Für den Kunden ausgeblendet',
    naoEncontrado: 'ESG-Beratung nicht gefunden.', erroSave: 'Speichern fehlgeschlagen.',
  } : lang === 'en' ? {
    voltar: 'ESG consultancies', editar: 'Edit', guardar: 'Save', nome: 'Contact person', empresa: 'Company', email: 'E-mail', telefone: 'Phone', setor: 'Sector', contaL: 'Platform account', semContaOpt: '— no account —', apresentar: 'Presentation mode', ativa: 'Active', concluida: 'Completed', pausada: 'Paused',
    conta: 'Account linked', semConta: 'no account', visivel: 'Client sees journey & report', oculto: 'Hidden from the client',
    naoEncontrado: 'ESG consultancy not found.', erroSave: 'Save failed.',
  } : {
    voltar: 'Consultorias ESG', editar: 'Editar', guardar: 'Guardar', nome: 'Pessoa de contacto', empresa: 'Empresa', email: 'E-mail', telefone: 'Telefone', setor: 'Setor', contaL: 'Conta na plataforma', semContaOpt: '— sem conta —', apresentar: 'Modo apresentação', ativa: 'Ativa', concluida: 'Concluída', pausada: 'Pausada',
    conta: 'Conta ligada', semConta: 'sem conta', visivel: 'O cliente vê percurso e relatório', oculto: 'Escondido do cliente',
    naoEncontrado: 'Consultoria ESG não encontrada.', erroSave: 'Falha ao guardar.',
  }

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('esg_consultorias').select('*').eq('id', id).maybeSingle()
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
    <AlvoESGProvider value={{ caso, id: caso.id, base: `/gestao/esg/${id}`, soLeitura: false, recarregar: load }}>
      <div style={{ width: '100%', fontFamily: t.fontBody }}>
        {/* Tira do caso: discreta, para não roubar o ecrã às páginas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '12px', color: t.textMuted, marginBottom: '16px', paddingBottom: '12px', borderBottom: `1px solid ${t.cardBorder}` }}>
          <a href="/gestao/esg" style={{ color: t.accentText, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>← {L.voltar}</a>
          <span style={{ color: t.subtle }}>·</span>
          <span style={{ fontWeight: 700, color: t.heading }}>{caso.empresa || caso.nome}</span>
          {caso.empresa && <span>{caso.nome}</span>}
          <button onClick={abrirEdicao} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: t.accentText, fontWeight: 700, fontSize: '11.5px' }}>✏️ {L.editar}</button>
          <span style={{ marginLeft: 'auto' }} />
          {/* Abre num separador próprio, sem menus — para mostrar ao cliente (18/09) */}
          <a href={`/apresentacao/esg/${id}`} target="_blank" rel="noopener"
            style={{ padding: '5px 12px', borderRadius: '8px', background: t.btnBg, color: t.btnInk, fontSize: '11.5px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>{L.apresentar} ↗</a>
          <select value={caso.status} onChange={e => alterar({ status: e.target.value })}
            style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 700, border: 'none', background: tone.bg, color: tone.ink, cursor: 'pointer', outline: 'none' }}>
            {['ativa', 'concluida', 'pausada'].map(s => <option key={s} value={s}>{L[s]}</option>)}
          </select>
          <span title={caso.user_id ? L.conta : L.semConta} style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 700, background: t.softCardBg, color: caso.user_id ? t.accentText : t.subtle, whiteSpace: 'nowrap' }}>
            {caso.user_id ? '🔗 ' + L.conta : L.semConta}
          </span>
          {caso.user_id && (
            <label title={caso.visivel_cliente ? L.visivel : L.oculto} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <input type="checkbox" checked={!!caso.visivel_cliente} onChange={e => alterar({ visivel_cliente: e.target.checked })} style={{ accentColor: t.accent }} />
              {caso.visivel_cliente ? L.visivel : L.oculto}
            </label>
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
            <button onClick={() => setEditar(null)} style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${t.cardBorder}`, background: 'transparent', color: t.textMuted, fontSize: '12.5px', cursor: 'pointer' }}>✕</button>
          </div>
        )}

        <Outlet />
      </div>
    </AlvoESGProvider>
  )
}
