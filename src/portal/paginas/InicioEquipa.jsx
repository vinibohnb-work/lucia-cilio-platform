import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { usePortal, acoes } from '../dados'
import { Titulo, Cartao, Vazio, Chip, Pilulas, Botao, Ic } from '../ui'
import { ESTADOS_OBRIG, FECHADOS, estadoEfetivo, hojeIso, somaDias, fmtData } from '../regras'
import { tarefaAtrasada, docsEmFalta, naoLidas, clientePorId, clienteEmCurso } from '../seletores'
import { FormTarefa } from '../partes/Tarefas'

// Início da equipa (reunião de 08/10): o que há para fazer hoje, de relance.
// As minhas tarefas, o que os clientes têm pendente (obrigações em atraso ou a
// chegar, documentos em falta, relatórios do trimestre por fazer, mensagens por
// ler) e as horas de hoje, com atalho para registar.
// 13-D (13/10): sem os 5 indicadores do topo — repetiam os dois cartões. As
// horas de hoje ficam num botão discreto; as listas dizem "+N — ver todas"
// quando cortam (antes escondiam linhas sem avisar).

const fmtH = (n) => `${(Math.round(n * 100) / 100).toLocaleString('pt-PT', { maximumFractionDigits: 2 })} h`
const LIM = { tarefas: 8, obrig: 6, docs: 4, nomes: 3 }

export default function InicioEquipa() {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const s = usePortal()
  const navigate = useNavigate()
  const hoje = hojeIso()
  const em7 = somaDias(hoje, 7)
  const [deQuem, setDeQuem] = useState('minhas')   // 'minhas' | 'equipa'
  const [verTudo, setVerTudo] = useState({})          // listas abertas por inteiro
  const [editar, setEditar] = useState(null)          // tarefa aberta no formulário

  // ── Tarefas ──
  const abertas = s.tarefas.filter(x => x.estado !== 'concluida' && (deQuem === 'equipa' || x.responsavel === s.eu))
  const tarefas7 = abertas.filter(x => x.prazo <= em7).sort((a, b) => a.prazo.localeCompare(b.prazo))

  // ── Pendências dos clientes (regra única: os inativos não contam) ──
  const emCurso = (cid) => clienteEmCurso(clientePorId(s, cid))
  const obrAtraso = s.obrigacoes.filter(o => emCurso(o.clienteId) && estadoEfetivo(o) === 'em_atraso').sort((a, b) => a.prazo.localeCompare(b.prazo))
  const obrProx = s.obrigacoes.filter(o => emCurso(o.clienteId) && !FECHADOS.includes(o.estado) && estadoEfetivo(o) !== 'em_atraso' && o.prazo >= hoje && o.prazo <= em7).sort((a, b) => a.prazo.localeCompare(b.prazo))
  const faltaPorCliente = Object.entries(docsEmFalta(s).reduce((acc, d) => { acc[d.clienteId] = (acc[d.clienteId] || 0) + 1; return acc }, {}))
    .map(([cid, n]) => ({ cliente: clientePorId(s, cid), n })).filter(x => clienteEmCurso(x.cliente)).sort((a, b) => b.n - a.n)
  const porLer = naoLidas(s)

  // Relatório do trimestre que acabou: clientes de contabilidade (não inativos) sem
  // relatório. Mesma regra da página Relatórios (13-D, 13/10; antes só os "Ativo").
  const d = new Date(); const tAtual = Math.floor(d.getMonth() / 3) + 1
  const [anoR, triR] = tAtual === 1 ? [d.getFullYear() - 1, 4] : [d.getFullYear(), tAtual - 1]
  const fimTri = `${anoR}-${String(triR * 3).padStart(2, '0')}-31`
  const relPorFazer = s.clientes.filter(c => clienteEmCurso(c) && c.servicos.includes('contabilidade') && (!c.cliente_desde || c.cliente_desde <= fimTri)
    && !s.relatorios.some(r => r.clienteId === c.id && r.ano === anoR && r.trimestre === triR))

  // ── Horas de hoje ──
  const horasHoje = s.horas.filter(h => h.data === hoje && h.pessoa === s.eu).reduce((tot, h) => tot + Number(h.horas || 0), 0)

  const nome = (cid) => clientePorId(s, cid)?.nome || '—'
  const linha = { display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderTop: `1px solid ${t.rowBorder}`, fontSize: '13px' }
  const linkBtn = { background: 'none', border: 'none', padding: 0, font: 'inherit', fontWeight: 700, color: t.heading, cursor: 'pointer', textAlign: 'left' }
  const primeiro = (s.eu || '').split(' ')[0]
  const hora = new Date().getHours()
  const saudacao = hora < 12 ? 'Bom dia' : hora < 20 ? 'Boa tarde' : 'Boa noite'
  const hojeExtenso = new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })
  const tudoEmDia = !obrAtraso.length && !obrProx.length && !faltaPorCliente.length && !relPorFazer.length && !porLer.length

  // Corta uma lista e devolve quantas ficam de fora, para o "+N — ver todas".
  const corta = (k, lista) => verTudo[k] ? [lista, 0] : [lista.slice(0, LIM[k]), Math.max(0, lista.length - LIM[k])]
  const [tarefasLista, tarefasMais] = corta('tarefas', tarefas7)
  const [obrigsLista, obrigsMais] = corta('obrig', [...obrAtraso, ...obrProx])
  const [docsLista, docsMais] = corta('docs', faltaPorCliente)
  const verMais = (k, n) => n > 0 && (
    <button onClick={() => setVerTudo(v => ({ ...v, [k]: true }))} style={{ ...linkBtn, fontSize: '12px', color: t.accentText, padding: '8px 0', display: 'block' }}>+{n} — ver todas</button>
  )
  const nomes = (lista) => lista.slice(0, LIM.nomes).join(', ') + (lista.length > LIM.nomes ? ` +${lista.length - LIM.nomes}` : '')

  return (
    <div>
      {/* Boas-vindas à esquerda e "Registar horas" à direita, na mesma linha (14/10).
          O <h1> continua só para leitores de ecrã, como nas outras páginas. */}
      <Titulo titulo="Início" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: t.fontDisplay, fontSize: isMobile ? '20px' : '23px', fontWeight: 600, color: t.heading, lineHeight: 1.15 }}>
            {saudacao}{primeiro ? `, ${primeiro}` : ''}
          </div>
          <div style={{ fontSize: '13px', color: t.textMuted, marginTop: '2px' }}>{hojeExtenso}</div>
        </div>
        <Botao onClick={() => navigate('/gestao/horas')} title="Abrir as Horas para registar"><Ic.relogio size={16} />Registar horas · hoje {fmtH(horasHoje)}</Botao>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', alignItems: 'start' }}>
        <Cartao titulo="Tarefas" icone={<Ic.lista />}
          acao={<Pilulas opcoes={[['minhas', 'As minhas'], ['equipa', 'Equipa']]} valor={deQuem} aoMudar={setDeQuem} />}>
          {tarefasLista.length === 0 ? <Vazio>Nada para os próximos 7 dias. ✓</Vazio> : tarefasLista.map((x, i) => {
            const atraso = tarefaAtrasada(x, hoje)
            // Como na tabela das Tarefas: a caixa conclui, o título abre para editar (13-D, 13/10).
            return (
              <div key={x.id} style={{ ...linha, borderTop: i ? linha.borderTop : 'none' }}>
                <input type="checkbox" checked={false} onChange={() => acoes.alternarTarefa(x.id)} aria-label={`Concluir: ${x.titulo}`}
                  style={{ width: '18px', height: '18px', accentColor: '#1f6b45', cursor: 'pointer', flex: 'none' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <button onClick={() => setEditar(x)} style={linkBtn}>{x.titulo}</button>
                  <div style={{ fontSize: '11.5px', color: t.subtle }}>{x.clienteId ? nome(x.clienteId) : 'Interna'}{deQuem === 'equipa' && x.responsavel ? ` · ${x.responsavel}` : ''}</div>
                </div>
                <Chip tom={atraso ? 'erro' : x.prazo === hoje ? 'aviso' : 'neutro'}>{atraso ? `atrasada · ${fmtData(x.prazo)}` : x.prazo === hoje ? 'hoje' : fmtData(x.prazo)}</Chip>
              </div>
            )
          })}
          {verMais('tarefas', tarefasMais)}
          <div style={{ marginTop: '10px' }}><Botao variante="fantasma" onClick={() => navigate('/gestao/tarefas')}>Ver todas as tarefas →</Botao></div>
        </Cartao>

        <Cartao titulo="Pendências dos clientes" icone={<Ic.clientes />}>
          {tudoEmDia ? <Vazio>Tudo em dia. ✓</Vazio> : (
            <div>
              {obrigsLista.map((o, i) => {
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
              {verMais('obrig', obrigsMais)}
              {docsLista.map(({ cliente, n }) => (
                <div key={`d-${cliente.id}`} style={linha}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <button onClick={() => navigate(`/gestao/clientes/${cliente.id}/documentos`)} style={linkBtn}>{cliente.nome}</button>
                    <div style={{ fontSize: '11.5px', color: t.subtle }}>documentos pedidos</div>
                  </div>
                  <Chip tom="aviso">{n} em falta</Chip>
                </div>
              ))}
              {verMais('docs', docsMais)}
              {relPorFazer.length > 0 && (
                <div style={linha}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <button onClick={() => navigate('/gestao/relatorios')} style={linkBtn}>Relatórios do {triR}.º trimestre {anoR}</button>
                    <div style={{ fontSize: '11.5px', color: t.subtle, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nomes(relPorFazer.map(c => c.nome))}</div>
                  </div>
                  <Chip tom="aviso">{relPorFazer.length} por fazer</Chip>
                </div>
              )}
              {porLer.length > 0 && (
                <div style={linha}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <button onClick={() => navigate('/gestao/mensagens')} style={linkBtn}>Mensagens dos clientes</button>
                    <div style={{ fontSize: '11.5px', color: t.subtle }}>{nomes([...new Set(porLer.map(m => nome(m.clienteId)))])}</div>
                  </div>
                  <Chip tom="aviso">{porLer.length} por ler</Chip>
                </div>
              )}
            </div>
          )}
        </Cartao>
      </div>
      {editar && <FormTarefa inicial={editar} aoFechar={() => setEditar(null)} />}
    </div>
  )
}
