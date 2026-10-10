import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { usePortal } from '../dados'
import { Titulo, Cartao, Kpi, Vazio, Chip, Pilulas, Botao, Ic } from '../ui'
import { ESTADOS_OBRIG, FECHADOS, estadoEfetivo, hojeIso, somaDias, fmtData } from '../regras'
import { tarefaAtrasada, docsEmFalta, naoLidas, clientePorId } from '../seletores'

// Início da equipa (reunião de 08/10): o que há para fazer hoje, de relance.
// As minhas tarefas, o que os clientes têm pendente (obrigações em atraso ou a
// chegar, documentos em falta, relatórios do trimestre por fazer, mensagens por
// ler) e as horas de hoje, com atalho para registar.

const fmtH = (n) => `${(Math.round(n * 100) / 100).toLocaleString('pt-PT', { maximumFractionDigits: 2 })} h`

export default function InicioEquipa() {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const s = usePortal()
  const navigate = useNavigate()
  const hoje = hojeIso()
  const em7 = somaDias(hoje, 7)
  const [deQuem, setDeQuem] = useState('minhas')   // 'minhas' | 'equipa'

  // ── Tarefas ──
  const abertas = s.tarefas.filter(x => x.estado !== 'concluida' && (deQuem === 'equipa' || x.responsavel === s.eu))
  const tarefasHoje = abertas.filter(x => x.prazo === hoje)
  const tarefasAtraso = abertas.filter(x => tarefaAtrasada(x, hoje))
  const tarefasLista = abertas.filter(x => x.prazo <= em7).sort((a, b) => a.prazo.localeCompare(b.prazo)).slice(0, 8)

  // ── Pendências dos clientes ──
  const obrAtraso = s.obrigacoes.filter(o => estadoEfetivo(o) === 'em_atraso').sort((a, b) => a.prazo.localeCompare(b.prazo))
  const obrProx = s.obrigacoes.filter(o => !FECHADOS.includes(o.estado) && estadoEfetivo(o) !== 'em_atraso' && o.prazo >= hoje && o.prazo <= em7).sort((a, b) => a.prazo.localeCompare(b.prazo))
  const faltaPorCliente = Object.entries(docsEmFalta(s).reduce((acc, d) => { acc[d.clienteId] = (acc[d.clienteId] || 0) + 1; return acc }, {}))
    .map(([cid, n]) => ({ cliente: clientePorId(s, cid), n })).filter(x => x.cliente).sort((a, b) => b.n - a.n)
  const porLer = naoLidas(s)

  // Relatório do trimestre que acabou: clientes de contabilidade ativos sem relatório.
  const d = new Date(); const tAtual = Math.floor(d.getMonth() / 3) + 1
  const [anoR, triR] = tAtual === 1 ? [d.getFullYear() - 1, 4] : [d.getFullYear(), tAtual - 1]
  const fimTri = `${anoR}-${String(triR * 3).padStart(2, '0')}-31`
  const relPorFazer = s.clientes.filter(c => c.estado === 'ativo' && c.servicos.includes('contabilidade') && (!c.cliente_desde || c.cliente_desde <= fimTri)
    && !s.relatorios.some(r => r.clienteId === c.id && r.ano === anoR && r.trimestre === triR))

  // ── Horas de hoje ──
  const horasHoje = s.horas.filter(h => h.data === hoje && h.pessoa === s.eu).reduce((tot, h) => tot + Number(h.horas || 0), 0)

  const nome = (cid) => clientePorId(s, cid)?.nome || '—'
  const linha = { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderTop: `1px solid ${t.rowBorder}`, fontSize: '13px' }
  const linkBtn = { background: 'none', border: 'none', padding: 0, font: 'inherit', fontWeight: 700, color: t.heading, cursor: 'pointer', textAlign: 'left' }
  const primeiro = (s.eu || '').split(' ')[0]
  const tudoEmDia = !obrAtraso.length && !obrProx.length && !faltaPorCliente.length && !relPorFazer.length && !porLer.length

  return (
    <div>
      <Titulo eyebrow={`Gestão · ${fmtData(hoje)}`} titulo={primeiro ? `Olá, ${primeiro}` : 'Início'}
        sub="O que há para fazer hoje: as tarefas, o que os clientes têm pendente e as horas do dia." />

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(185px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        <Kpi icone={<Ic.lista size={20} />} rotulo="Tarefas para hoje" valor={tarefasHoje.length} sub={tarefasAtraso.length ? `${tarefasAtraso.length} em atraso` : 'nenhuma em atraso'} tom={tarefasAtraso.length ? 'erro' : undefined} onClick={() => navigate('/gestao/tarefas')} />
        <Kpi icone={<Ic.agenda size={20} />} rotulo="Obrigações em atraso" valor={obrAtraso.length} sub={`${obrProx.length} nos próximos 7 dias`} tom={obrAtraso.length ? 'erro' : undefined} onClick={() => navigate('/gestao/agenda')} />
        <Kpi icone={<Ic.doc size={20} />} rotulo="Documentos em falta" valor={docsEmFalta(s).length} sub={`${faltaPorCliente.length} cliente(s)`} tom={faltaPorCliente.length ? 'aviso' : undefined} onClick={() => navigate('/gestao/clientes')} />
        <Kpi icone={<Ic.mensagens size={20} />} rotulo="Mensagens por ler" valor={porLer.length} sub="dos clientes" tom={porLer.length ? 'aviso' : undefined} onClick={() => navigate('/gestao/mensagens')} />
        <Kpi icone={<Ic.agenda size={20} />} rotulo="As minhas horas hoje" valor={fmtH(horasHoje)} sub="registar →" onClick={() => navigate('/gestao/horas')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', alignItems: 'start' }}>
        <Cartao titulo="Tarefas" icone={<Ic.lista />}
          acao={<Pilulas opcoes={[['minhas', 'As minhas'], ['equipa', 'Equipa']]} valor={deQuem} aoMudar={setDeQuem} />}>
          {tarefasLista.length === 0 ? <Vazio>Nada para os próximos 7 dias. ✓</Vazio> : tarefasLista.map((x, i) => {
            const atraso = tarefaAtrasada(x, hoje)
            return (
              <div key={x.id} style={{ ...linha, borderTop: i ? linha.borderTop : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: t.heading }}>{x.titulo}</div>
                  <div style={{ fontSize: '11.5px', color: t.subtle }}>{x.clienteId ? nome(x.clienteId) : 'Interna'}{deQuem === 'equipa' && x.responsavel ? ` · ${x.responsavel}` : ''}</div>
                </div>
                <Chip tom={atraso ? 'erro' : x.prazo === hoje ? 'aviso' : 'neutro'}>{atraso ? `atrasada · ${fmtData(x.prazo)}` : x.prazo === hoje ? 'hoje' : fmtData(x.prazo)}</Chip>
              </div>
            )
          })}
          <div style={{ marginTop: '10px' }}><Botao variante="fantasma" onClick={() => navigate('/gestao/tarefas')}>Ver todas as tarefas →</Botao></div>
        </Cartao>

        <Cartao titulo="Pendências dos clientes" icone={<Ic.clientes />}>
          {tudoEmDia ? <Vazio>Tudo em dia. ✓</Vazio> : (
            <div>
              {[...obrAtraso, ...obrProx].slice(0, 6).map((o, i) => {
                const e = estadoEfetivo(o)
                return (
                  <div key={o.id} style={{ ...linha, borderTop: i ? linha.borderTop : 'none' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <button onClick={() => navigate(`/gestao/clientes/${o.clienteId}/obrigacoes`)} style={linkBtn}>{nome(o.clienteId)}</button>
                      <div style={{ fontSize: '11.5px', color: t.subtle }}>{o.nome} · {o.periodo} · {fmtData(o.prazo)}</div>
                    </div>
                    <Chip tom={ESTADOS_OBRIG[e]?.tom || 'neutro'}>{ESTADOS_OBRIG[e]?.rotulo || e}</Chip>
                  </div>
                )
              })}
              {faltaPorCliente.slice(0, 4).map(({ cliente, n }) => (
                <div key={`d-${cliente.id}`} style={linha}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <button onClick={() => navigate(`/gestao/clientes/${cliente.id}/documentos`)} style={linkBtn}>{cliente.nome}</button>
                    <div style={{ fontSize: '11.5px', color: t.subtle }}>documentos pedidos que ainda não chegaram</div>
                  </div>
                  <Chip tom="aviso">{n} em falta</Chip>
                </div>
              ))}
              {relPorFazer.length > 0 && (
                <div style={linha}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <button onClick={() => navigate('/gestao/relatorios')} style={linkBtn}>Relatórios do {triR}.º trimestre {anoR}</button>
                    <div style={{ fontSize: '11.5px', color: t.subtle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{relPorFazer.slice(0, 3).map(c => c.nome).join(', ')}{relPorFazer.length > 3 ? '…' : ''}</div>
                  </div>
                  <Chip tom="aviso">{relPorFazer.length} por fazer</Chip>
                </div>
              )}
              {porLer.length > 0 && (
                <div style={linha}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <button onClick={() => navigate('/gestao/mensagens')} style={linkBtn}>Mensagens dos clientes</button>
                    <div style={{ fontSize: '11.5px', color: t.subtle }}>{[...new Set(porLer.map(m => nome(m.clienteId)))].slice(0, 3).join(', ')}</div>
                  </div>
                  <Chip tom="aviso">{porLer.length} por ler</Chip>
                </div>
              )}
            </div>
          )}
        </Cartao>
      </div>
    </div>
  )
}
