import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { usePortal, acoes } from '../dados'
import { Titulo, Botao, Chip, Campo, useCampos, Cartao, Ic } from '../ui'
import { PAISES, FORMAS, SERVICOS, PERIODICIDADES, ESTADOS_CLIENTE, REGIMES, rotuloServico, fmtData, iniciais, estadoEfetivo, ESTADOS_OBRIG } from '../regras'
import { proximaObrigacao, docsEmFalta, naoLidas, tarefaAtrasada } from '../seletores'

// A lista geral de clientes — a mesma do print delas (Nome · País · Setor ·
// Serviço · Estado), agora com o que interessa saber de relance e com o nome a
// abrir a página individual (documento, secção 1).

const VAZIO = { nome: '', pais: '', setor: '', servico: 'contabilidade', estado: 'onboarding', forma: '', periodicidade: 'trimestral', regime: '' }

export default function ListaClientes() {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  // Em ecrãs médios a tabela junta colunas para caber sem deslizar para o lado:
  // até 1320 px, país e setor numa só; até 1100 px, o estado vai para o serviço
  // e o responsável para debaixo do nome.
  const medio = useIsMobile(1320)
  const estreito = useIsMobile(1100) && !isMobile
  const s = usePortal()
  const navigate = useNavigate()
  const c = useCampos()
  const [f, setF] = useState({ nome: '', pais: '', servico: '', estado: '', responsavel: '' })
  const [novo, setNovo] = useState(null)

  const visiveis = s.clientes.filter(x =>
    (!f.nome || (x.nome + ' ' + (x.pessoa || '') + ' ' + (x.setor || '')).toLowerCase().includes(f.nome.toLowerCase())) &&
    (!f.pais || x.pais === f.pais) && (!f.servico || x.servicos.includes(f.servico)) &&
    (!f.estado || x.estado === f.estado) && (!f.responsavel || x.responsavel === f.responsavel))

  function criar() {
    if (!novo.nome.trim() || !novo.pais) return
    const id = acoes.criarCliente({
      nome: novo.nome.trim(), pais: novo.pais, setor: novo.setor, servicos: [novo.servico], estado: novo.estado,
      forma: novo.forma || FORMAS[novo.pais][0], periodicidade: novo.periodicidade,
      regime: novo.regime || REGIMES[novo.pais][0][0], software: novo.pais === 'PT' ? 'TOConline' : 'Lexware', responsavel: s.eu,
    })
    acoes.gerarAno(id, new Date().getFullYear())
    navigate(`/gestao/clientes/${id}`)
  }

  const sel = (k, opts, vazio) => (
    <select value={f[k]} onChange={e => setF(p => ({ ...p, [k]: e.target.value }))} style={{ ...c.input, cursor: 'pointer' }}>
      <option value="">{vazio}</option>
      {opts.map(([v, r]) => <option key={v} value={v}>{r}</option>)}
    </select>
  )

  return (
    <div>
      <Titulo titulo="Clientes" />

      {novo && (
        <Cartao titulo="Novo cliente" estilo={{ marginBottom: '16px', border: `1.5px solid ${t.accent}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.6fr 1fr 1.2fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <Campo rotulo="Nome"><input autoFocus value={novo.nome} onChange={e => setNovo(p => ({ ...p, nome: e.target.value }))} placeholder="Nome ou empresa" style={c.input} /></Campo>
            <Campo rotulo="País">
              <select value={novo.pais} onChange={e => setNovo(p => ({ ...p, pais: e.target.value, forma: '', regime: '' }))} style={{ ...c.input, cursor: 'pointer' }}>
                <option value="">— Selecionar país —</option>{Object.entries(PAISES).map(([k, r]) => <option key={k} value={k}>{r}</option>)}
              </select></Campo>
            <Campo rotulo="Setor"><input value={novo.setor} onChange={e => setNovo(p => ({ ...p, setor: e.target.value }))} placeholder="ex: Construção, Indústria…" style={c.input} /></Campo>
            <Campo rotulo="Serviço">
              <select value={novo.servico} onChange={e => setNovo(p => ({ ...p, servico: e.target.value }))} style={{ ...c.input, cursor: 'pointer' }}>
                {SERVICOS.map(([k, r]) => <option key={k} value={k}>{r}</option>)}
              </select></Campo>
            <Campo rotulo="Estado">
              <select value={novo.estado} onChange={e => setNovo(p => ({ ...p, estado: e.target.value }))} style={{ ...c.input, cursor: 'pointer' }}>
                {Object.entries(ESTADOS_CLIENTE).map(([k, v]) => <option key={k} value={k}>{v.rotulo}</option>)}
              </select></Campo>
          </div>
          {novo.pais && (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <Campo rotulo="Forma jurídica">
                <select value={novo.forma} onChange={e => setNovo(p => ({ ...p, forma: e.target.value }))} style={{ ...c.input, cursor: 'pointer' }}>
                  {FORMAS[novo.pais].map(x => <option key={x}>{x}</option>)}
                </select></Campo>
              <Campo rotulo="Regime fiscal">
                <select value={novo.regime} onChange={e => setNovo(p => ({ ...p, regime: e.target.value }))} style={{ ...c.input, cursor: 'pointer' }}>
                  {REGIMES[novo.pais].map(([k, r]) => <option key={k} value={k}>{r}</option>)}
                </select></Campo>
              <Campo rotulo="Periodicidade">
                <select value={novo.periodicidade} onChange={e => setNovo(p => ({ ...p, periodicidade: e.target.value }))} style={{ ...c.input, cursor: 'pointer' }}>
                  {PERIODICIDADES.map(([k, r]) => <option key={k} value={k}>{r}</option>)}
                </select></Campo>
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Botao variante="primario" onClick={criar} disabled={!novo.nome.trim() || !novo.pais}>Guardar e abrir</Botao>
            <Botao onClick={() => setNovo(null)}>Cancelar</Botao>
            <span style={{ fontSize: '12px', color: t.subtle }}>O calendário fiscal do ano é gerado logo a partir do país, forma e regime.</span>
          </div>
        </Cartao>
      )}

      {/* Filtros (nome, país, serviço, estado) e "Novo cliente" na mesma linha (10/10) */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : estreito ? '1fr 1fr 1fr' : '2fr repeat(3, 1fr) auto', gap: '10px', marginBottom: '14px', alignItems: 'center' }}>
        <input value={f.nome} onChange={e => setF(p => ({ ...p, nome: e.target.value }))} placeholder="Procurar por nome, pessoa ou setor…" aria-label="Procurar cliente" style={{ ...c.input, gridColumn: isMobile ? '1 / -1' : undefined }} />
        {sel('pais', Object.entries(PAISES), 'Todos os países')}
        {sel('servico', SERVICOS, 'Todos os serviços')}
        {sel('estado', Object.entries(ESTADOS_CLIENTE).map(([k, v]) => [k, v.rotulo]), 'Todos os estados')}
        <Botao variante="primario" onClick={() => setNovo({ ...VAZIO })}><Ic.mais size={16} />Novo cliente</Botao>
      </div>

      <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? '760px' : 0 }}>
          <thead><tr>
            {(estreito ? ['Nome', 'País · setor', 'Serviço · estado', 'Próxima obrigação', 'Atenção']
              : medio ? ['Nome', 'País · setor', 'Serviço', 'Estado', 'Próxima obrigação', 'Atenção', 'Responsável']
              : ['Nome', 'País', 'Setor', 'Serviço', 'Estado', 'Próxima obrigação', 'Atenção', 'Responsável']).map(h => <th key={h} style={{ ...c.th, textTransform: 'uppercase', letterSpacing: '.6px', fontSize: '10.5px' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {visiveis.map(x => {
              const po = proximaObrigacao(s, x.id)
              const falta = docsEmFalta(s, x.id).length
              const atrasadas = s.tarefas.filter(tf => tf.clienteId === x.id && tarefaAtrasada(tf)).length
              const msgs = naoLidas(s, x.id).length
              // Obrigações em atraso também pedem atenção (antes dizia "Tudo em dia" — R-B11)
              const obrAtraso = s.obrigacoes.filter(o => o.clienteId === x.id && estadoEfetivo(o) === 'em_atraso').length
              const ef = po ? estadoEfetivo(po) : null
              return (
                <tr key={x.id} onClick={() => navigate(`/gestao/clientes/${x.id}`)} style={{ cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = t.softCardBg }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                  <td style={c.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                      <span style={{ flex: 'none', width: '34px', height: '34px', borderRadius: '9px', background: t.softCardBg, border: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: t.fontDisplay, fontWeight: 700, fontSize: '14px', color: t.accentText }}>{iniciais(x.nome)}</span>
                      <div><div style={{ fontWeight: 800, color: t.heading, fontSize: '14px' }}>{x.nome}</div><div style={{ fontSize: '11.5px', color: t.subtle }}>{x.forma}{estreito && x.responsavel ? ` · ${x.responsavel}` : ''}</div></div>
                    </div>
                  </td>
                  {medio
                    ? <td style={c.td}>{PAISES[x.pais]}<div style={{ fontSize: '11.5px', color: t.subtle }}>{x.setor || '—'}</div></td>
                    : <><td style={c.td}>{PAISES[x.pais]}</td><td style={c.td}>{x.setor || '—'}</td></>}
                  <td style={c.td}><div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>{x.servicos.map(k => <Chip key={k} tom="ouro">{rotuloServico(k)}</Chip>)}{estreito && <Chip tom={ESTADOS_CLIENTE[x.estado]?.tom}>{ESTADOS_CLIENTE[x.estado]?.rotulo}</Chip>}</div></td>
                  {!estreito && <td style={c.td}><Chip tom={ESTADOS_CLIENTE[x.estado]?.tom}>{ESTADOS_CLIENTE[x.estado]?.rotulo}</Chip></td>}
                  <td style={c.td}>
                    {po ? <><div style={{ fontWeight: 700, color: t.heading, fontSize: '12.5px' }}>{po.nome}</div><div style={{ fontSize: '11.5px', color: ef === 'em_atraso' ? t.neg : t.subtle }}>{fmtData(po.prazo)} · {ESTADOS_OBRIG[ef].rotulo}</div></> : <span style={{ color: t.subtle }}>—</span>}
                  </td>
                  <td style={c.td}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {obrAtraso > 0 && <Chip tom="erro">{obrAtraso} obrigaç{obrAtraso > 1 ? 'ões' : 'ão'} em atraso</Chip>}
                      {falta > 0 && <Chip tom="erro">{falta} doc. em falta</Chip>}
                      {atrasadas > 0 && <Chip tom="erro">{atrasadas} tarefa{atrasadas > 1 ? 's' : ''} em atraso</Chip>}
                      {msgs > 0 && <Chip tom="azul">{msgs} mensage{msgs > 1 ? 'ns' : 'm'}</Chip>}
                      {!obrAtraso && !falta && !atrasadas && !msgs && <span style={{ color: t.subtle, fontSize: '12px' }}>Tudo em dia</span>}
                    </div>
                  </td>
                  {!estreito && <td style={{ ...c.td, fontSize: '12.5px' }}>{x.responsavel}</td>}
                </tr>
              )
            })}
          </tbody>
        </table>
        {visiveis.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: t.subtle, fontSize: '13px' }}>Nenhum cliente com estes filtros.</div>}
      </div>
    </div>
  )
}
