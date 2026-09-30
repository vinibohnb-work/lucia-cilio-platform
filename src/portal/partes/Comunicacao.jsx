import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { usePortal, acoes, abrirFicheiro } from '../dados'
import { Botao, Chip, useCampos, Ic, Vazio } from '../ui'
import { MODELOS_WHATSAPP, linkWhatsApp, fmtEur, fmtData, FECHADOS, iso } from '../regras'
import { docsEmFalta } from '../seletores'

// Mensagens (documento, secção 7): o chat com histórico e anexos, e o
// WhatsApp com mensagens pré-preenchidas mas editáveis antes de enviar.

export function Chat({ clienteId, como = 'equipa', altura = 420 }) {
  const { t } = useTheme()
  const s = usePortal()
  const c = useCampos()
  const [texto, setTexto] = useState('')
  const [anexo, setAnexo] = useState(null)
  const fim = useRef(null)
  const cli = s.clientes.find(x => x.id === clienteId)
  const msgs = s.mensagens.filter(m => m.clienteId === clienteId).sort((a, b) => a.data.localeCompare(b.data))
  const porLer = msgs.some(m => m.de === 'cliente' && !m.lida)

  // Abrir a conversa do lado da equipa marca as do cliente como lidas.
  useEffect(() => { if (como === 'equipa' && porLer) acoes.marcarLidas(clienteId) }, [clienteId, como, porLer])
  useEffect(() => { fim.current?.scrollIntoView({ block: 'nearest' }) }, [msgs.length])

  const [aEnviar, setAEnviar] = useState(false)
  async function enviar() {
    if ((!texto.trim() && !anexo) || aEnviar) return
    setAEnviar(true)
    await acoes.enviarMensagem({ clienteId, texto: texto.trim(), canal: 'plataforma', ficheiro: anexo })
    setAEnviar(false)
    setTexto(''); setAnexo(null)
  }
  const semConta = !cli?.userId

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ height: `${altura}px`, overflowY: 'auto', padding: '4px 2px 10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {msgs.length === 0 && <Vazio>Ainda não há mensagens.</Vazio>}
        {msgs.map(m => {
          const minha = m.de === como
          return (
            <div key={m.id} style={{ alignSelf: minha ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
              <div style={{ fontSize: '10.5px', color: t.subtle, marginBottom: '3px', textAlign: minha ? 'right' : 'left' }}>
                {m.autor} · {fmtData(iso(new Date(m.data)))} {new Date(m.data).toTimeString().slice(0, 5)}{m.canal === 'whatsapp' ? ' · via WhatsApp' : m.canal === 'registo' ? ' · registo interno' : m.lidaPeloCliente ? ' · lida' : ''}
              </div>
              <div style={{ padding: '10px 13px', borderRadius: minha ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: m.canal === 'whatsapp' ? '#e3f4e8' : minha ? t.btnBg : t.softCardBg, color: m.canal === 'whatsapp' ? '#14532d' : minha ? t.btnInk : t.text, border: minha ? 'none' : `1px solid ${t.cardBorder}`, fontSize: '13px', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {m.texto}
                {m.anexo && <div onClick={() => abrirFicheiro(m.anexo.caminho)} style={{ cursor: m.anexo.caminho ? 'pointer' : 'default', marginTop: m.texto ? '7px' : 0, display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 9px', borderRadius: '8px', background: 'rgba(255,255,255,.14)', border: '1px solid rgba(201,168,76,.4)', fontSize: '12px', fontWeight: 600 }}><Ic.clip size={13} />{m.anexo.nome}</div>}
              </div>
            </div>
          )
        })}
        <div ref={fim} />
      </div>
      <div style={{ borderTop: `1px solid ${t.rowBorder}`, paddingTop: '10px' }}>
        {semConta && como === 'equipa' && <div style={{ fontSize: '12px', color: t.subtle, marginBottom: '7px' }}>Este cliente não tem conta na plataforma: o que escrever fica registado aqui. Para lhe chegar, use o WhatsApp.</div>}
        {anexo && <div style={{ marginBottom: '7px' }}><Chip tom="ouro">📎 {anexo.name} <button onClick={() => setAnexo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}>✕</button></Chip></div>}
        <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={2} placeholder={semConta ? 'Registar uma nota de contacto…' : 'Escrever uma mensagem — aparece no Início do cliente…'}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) enviar() }} style={{ ...c.input, resize: 'vertical' }} />
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, color: t.accentText, cursor: 'pointer' }}>
            <Ic.clip />Anexar
            <input type="file" style={{ display: 'none' }} onChange={e => { setAnexo(e.target.files?.[0] || null); e.target.value = '' }} />
          </label>
          <Botao variante="verde" estilo={{ marginLeft: 'auto' }} onClick={enviar} disabled={aEnviar || (!texto.trim() && !anexo)}><Ic.enviar />{aEnviar ? 'A enviar…' : semConta ? 'Registar' : 'Enviar'}</Botao>
        </div>
      </div>
    </div>
  )
}

// A obrigação que faz mais sentido comunicar: a que está em curso e já tem
// valor apurado; senão a última entregue; senão a próxima.
export function obrigacaoParaComunicar(s, clienteId) {
  const doCliente = s.obrigacoes.filter(o => o.clienteId === clienteId)
  const emCurso = doCliente.filter(o => !FECHADOS.includes(o.estado) && o.estado !== 'por_preparar' && Number(o.valor?.montante) > 0).sort((a, b) => a.prazo.localeCompare(b.prazo))
  if (emCurso[0]) return emCurso[0]
  const entregues = doCliente.filter(o => o.estado === 'entregue').sort((a, b) => b.prazo.localeCompare(a.prazo))
  if (entregues[0]) return entregues[0]
  return doCliente.filter(o => !FECHADOS.includes(o.estado)).sort((a, b) => a.prazo.localeCompare(b.prazo))[0] || doCliente[0] || null
}

const modeloPara = (o) => !o ? 'docs' : o.valor?.tipo === 'credito' ? 'credito' : o.valor?.tipo === 'reembolso' ? 'reembolso'
  : o.estado === 'aguardar_docs' ? 'docs' : ['entregue', 'pago'].includes(o.estado) ? (o.valor?.montante ? 'pagar' : 'sem_valor') : o.valor?.montante ? 'prazo' : 'docs'

export function CompositorWhatsApp({ clienteId, obrigacaoId, compacto, aoEnviar }) {
  const { t } = useTheme()
  const s = usePortal()
  const c = useCampos()
  const cli = s.clientes.find(x => x.id === clienteId)
  const obrigs = s.obrigacoes.filter(o => o.clienteId === clienteId).sort((a, b) => b.prazo.localeCompare(a.prazo))
  const inicial = obrigacaoId ? obrigs.find(o => o.id === obrigacaoId) : obrigacaoParaComunicar(s, clienteId)
  const [oid, setOid] = useState(inicial?.id || '')
  const [modelo, setModelo] = useState(modeloPara(inicial))
  const o = obrigs.find(x => x.id === oid)

  // Os campos (nome, período, valor, prazo) vêm da obrigação — secção 7.
  const preencher = (m, ob) => {
    const falta = docsEmFalta(s, clienteId).map(d => d.tipo.toLowerCase())
    const x = {
      nome: cli?.pessoa || cli?.nome, obrigacao: ob?.nome || 'declaração', periodo: ob?.periodo || '—',
      valor: fmtEur(ob?.valor?.montante), prazo: fmtData(ob?.prazo), prazoPagamento: fmtData(ob?.prazo),
      emFalta: falta.length ? [...new Set(falta)].join(', ') : 'os documentos do período',
    }
    return MODELOS_WHATSAPP.find(([k]) => k === m)[2](x)
  }
  const [texto, setTexto] = useState(() => preencher(modelo, o))
  const mudar = (m, id) => { const ob = obrigs.find(x => x.id === id); setModelo(m); setOid(id); setTexto(preencher(m, ob)) }

  function enviar() {
    window.open(linkWhatsApp(cli?.telefone, texto), '_blank', 'noopener')
    acoes.enviarMensagem({ clienteId, texto, canal: 'whatsapp' })
    // "Cliente informado" é um passo da checklist e do processo: fica marcado.
    if (o && !o.checklist?.cliente_informado) acoes.alternarChecklist(o.id, 'cliente_informado')
    aoEnviar?.()
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: compacto ? '1fr' : '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
        <select value={modelo} onChange={e => mudar(e.target.value, oid)} style={{ ...c.input, cursor: 'pointer' }} aria-label="Modelo">
          {MODELOS_WHATSAPP.map(([k, r]) => <option key={k} value={k}>{r}</option>)}
        </select>
        <select value={oid} onChange={e => mudar(modelo, e.target.value)} style={{ ...c.input, cursor: 'pointer' }} aria-label="Obrigação">
          <option value="">— Sem obrigação —</option>
          {obrigs.slice(0, 40).map(x => <option key={x.id} value={x.id}>{x.nome} · {x.periodo}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: '#e3f4e8', borderRadius: '12px', padding: '12px' }}>
        <span style={{ flex: 'none', width: '36px', height: '36px', borderRadius: '50%', background: '#25a244', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic.whats size={20} /></span>
        <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={compacto ? 3 : 4} aria-label="Mensagem"
          style={{ ...c.input, background: 'transparent', border: 'none', padding: '2px', color: '#14532d', fontSize: '13.5px', lineHeight: 1.5, resize: 'vertical' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11.5px', color: t.subtle, flex: 1, minWidth: '160px' }}>{cli?.telefone ? `Para ${cli.telefone}` : 'Sem telefone na ficha — o WhatsApp abre para escolher o contacto.'} O texto pode ser editado antes de enviar.</span>
        <Botao variante="verde" onClick={enviar}><Ic.enviar />Rever e enviar</Botao>
      </div>
    </div>
  )
}
