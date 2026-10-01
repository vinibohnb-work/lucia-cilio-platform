import { useState, lazy, Suspense } from 'react'
import { useParams, useNavigate, NavLink, Navigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { usePortal } from '../dados'
import { usePerfil, Chip, Botao, Janela, Ic, Cartao } from '../ui'
import { PAISES, ESTADOS_CLIENTE, rotuloServico, rotuloPeriodicidade, rotuloRegime, iniciais, linkWhatsApp } from '../regras'
import { naoLidas } from '../seletores'
import { FormTarefa, TabelaTarefas } from '../partes/Tarefas'
import { Chat, CompositorWhatsApp } from '../partes/Comunicacao'
import Resumo from './cliente/Resumo'
import Obrigacoes from './cliente/Obrigacoes'
import Documentos from './cliente/Documentos'
import RelatoriosCliente from './cliente/RelatoriosCliente'
import Dados from './cliente/Dados'
import AreaInterna from './cliente/AreaInterna'

// A ficha da conta (números, onboarding, avisos, pasta, histórico de consultoria).
const ContaPlataforma = lazy(() => import('../../pages/gestao/ClienteDetalhe'))

// Página individual do cliente (documento, secção 1), com o cabeçalho e os
// separadores do mockup. A mesma página serve a equipa e o cliente: no perfil
// Cliente os separadores e os cartões internos simplesmente não existem — é a
// "área visível" do documento, sem uma segunda página para manter.

export default function PaginaCliente({ idFixo }) {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const s = usePortal()
  const { papel } = usePerfil()
  const params = useParams()
  const navigate = useNavigate()
  const modoCliente = papel === 'cliente'
  const id = idFixo || params.id
  const sep = params.sep || 'resumo'
  // Também aceita o id da conta (ligações antigas da ficha da v1 apontavam para ele)
  const cliente = s.clientes.find(c => c.id === id) || s.clientes.find(c => c.userId === id)
  const [tarefa, setTarefa] = useState(false)
  const [whats, setWhats] = useState(false)

  if (!cliente) return <Navigate to="/gestao/clientes" replace />
  const base = modoCliente ? '/v2/portal' : `/gestao/clientes/${id}`
  const porLer = naoLidas(s, id).length

  const separadores = [
    ['resumo', 'Resumo'], ['obrigacoes', 'Obrigações fiscais'],
    ...(modoCliente ? [] : [['tarefas', 'Tarefas']]),
    ['documentos', 'Documentos'], ['relatorios', 'Relatórios'],
    ['mensagens', 'Mensagens', !modoCliente && porLer], ['dados', modoCliente ? 'Os meus dados' : 'Dados do cliente'],
    ...(modoCliente ? [] : [['notas', 'Notas internas', null, true]]),
    // Só a administradora: a ficha da conta usa a lista de contas, que é dela.
    ...(!modoCliente && papel === 'admin' && cliente?.userId ? [['conta', 'Conta na plataforma', null, true]] : []),
  ]
  if (!separadores.some(([k]) => k === sep)) return <Navigate to={base} replace />

  const est = ESTADOS_CLIENTE[cliente.estado]

  return (
    <div>
      {!modoCliente && (
        <button onClick={() => navigate('/gestao/clientes')} style={{ background: 'none', border: 'none', padding: 0, marginBottom: '14px', color: t.accentText, fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>← Todos os clientes</button>
      )}

      {/* ── Cabeçalho (secção 1) ── */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={{ flex: 'none', width: isMobile ? '72px' : '104px', height: isMobile ? '72px' : '104px', borderRadius: '14px', background: '#efe8d8', border: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: t.fontDisplay, fontSize: isMobile ? '28px' : '38px', fontWeight: 600, color: '#6b5a2a', letterSpacing: '1px' }}>
          {iniciais(cliente.nome)}
        </div>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '28px' : '38px', lineHeight: 1.05, color: t.heading }}>{cliente.nome}</h1>
            <Chip tom="ouro"><Ic.pin />{PAISES[cliente.pais]}</Chip>
            <Chip tom={est.tom}>{cliente.estado === 'ativo' ? '♥ ' : ''}{est.rotulo}</Chip>
          </div>
          <div style={{ fontSize: '15px', color: t.textMuted, marginTop: '6px' }}>
            {cliente.setor} · {cliente.servicos.map(rotuloServico).join(' + ')} {rotuloPeriodicidade(cliente.periodicidade).toLowerCase()}
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '10px', fontSize: '12.5px', color: t.text }}>
            <span><span style={{ color: t.subtle }}>Forma jurídica </span><strong>{cliente.forma}</strong></span>
            <span><span style={{ color: t.subtle }}>Regime </span><strong>{rotuloRegime(cliente)}</strong></span>
            <span><span style={{ color: t.subtle }}>Software </span><strong>{cliente.software}</strong></span>
            {!modoCliente && <span><span style={{ color: t.subtle }}>Responsável </span><strong>{cliente.responsavel}</strong></span>}
          </div>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '6px', fontSize: '12.5px', color: t.textMuted }}>
            <span>👤 {cliente.pessoa || '—'}</span>
            <span>✉ {cliente.email || '—'}</span>
            <span>☎ {cliente.telefone || 'sem telefone'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', width: isMobile ? '100%' : 'auto' }}>
          {modoCliente ? (
            <>
              <Botao variante="whats" onClick={() => window.open(linkWhatsApp('', `Olá, Lúcia. Sou ${cliente.pessoa} (${cliente.nome}).`), '_blank', 'noopener')}><Ic.whats />WhatsApp</Botao>
              <Botao onClick={() => navigate(`${base}/mensagens`)}><Ic.mail />Mensagem</Botao>
              <Botao variante="ouro" onClick={() => navigate(`${base}/documentos`)}><Ic.mais />Enviar documentos</Botao>
            </>
          ) : (
            <>
              <Botao variante="whats" onClick={() => setWhats(true)}><Ic.whats />WhatsApp</Botao>
              <Botao onClick={() => navigate(`${base}/mensagens`)}><Ic.mail />Mensagem</Botao>
              <Botao variante="ouro" onClick={() => setTarefa(true)}><Ic.mais />Adicionar tarefa</Botao>
            </>
          )}
        </div>
      </div>

      {/* ── Separadores ── */}
      <nav style={{ display: 'flex', gap: isMobile ? '2px' : '4px 8px', borderBottom: `1px solid ${t.cardBorder}`, marginBottom: '20px', overflowX: isMobile ? 'auto' : 'visible', flexWrap: isMobile ? 'nowrap' : 'wrap' }}>
        {separadores.map(([k, rot, badge, interno]) => (
          <NavLink key={k} to={k === 'resumo' ? base : `${base}/${k}`} end
            style={() => ({
              display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '11px 14px', fontSize: '14.5px', whiteSpace: 'nowrap', textDecoration: 'none',
              fontWeight: sep === k ? 800 : 500, color: sep === k ? t.heading : t.textMuted,
              borderBottom: `3px solid ${sep === k ? t.heading : 'transparent'}`, marginBottom: '-1px',
            })}>
            {rot}
            {interno && <Ic.cadeado />}
            {!!badge && <span style={{ fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '20px', background: '#c0392b', color: '#fff' }}>{badge}</span>}
          </NavLink>
        ))}
      </nav>

      {sep === 'resumo' && <Resumo cliente={cliente} base={base} modoCliente={modoCliente} />}
      {sep === 'obrigacoes' && <Obrigacoes cliente={cliente} modoCliente={modoCliente} />}
      {sep === 'tarefas' && (
        <Cartao titulo="Tarefas deste cliente" icone={<Ic.lista />} area="interna" acao={<Botao variante="primario" onClick={() => setTarefa(true)}><Ic.mais size={15} />Nova tarefa</Botao>} semPadding>
          <TabelaTarefas mostrarCliente={false} tarefas={s.tarefas.filter(x => x.clienteId === id).sort((a, b) => (a.estado === 'concluida') - (b.estado === 'concluida') || a.prazo.localeCompare(b.prazo))} />
        </Cartao>
      )}
      {sep === 'documentos' && <Documentos cliente={cliente} modoCliente={modoCliente} />}
      {sep === 'relatorios' && <RelatoriosCliente cliente={cliente} modoCliente={modoCliente} />}
      {sep === 'mensagens' && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile || modoCliente ? '1fr' : '1.4fr 1fr', gap: '16px', alignItems: 'start' }}>
          <Cartao titulo={modoCliente ? 'Conversa com a LC Office Consulting' : `Conversa com ${cliente.pessoa || cliente.nome}`} icone={<Ic.mensagens />} area={modoCliente || !cliente.userId ? undefined : 'cliente'}>
            <Chat clienteId={id} como={modoCliente ? 'cliente' : 'equipa'} />
          </Cartao>
          {!modoCliente && (
            <Cartao titulo="WhatsApp com modelo" icone={<Ic.whats />}>
              <CompositorWhatsApp clienteId={id} compacto />
            </Cartao>
          )}
        </div>
      )}
      {sep === 'dados' && <Dados cliente={cliente} modoCliente={modoCliente} equipa={s.equipa} />}
      {sep === 'notas' && <AreaInterna cliente={cliente} />}
      {sep === 'conta' && <Suspense fallback={null}><ContaPlataforma key={cliente.userId} userId={cliente.userId} embutido /></Suspense>}

      {tarefa && <FormTarefa inicial={{ clienteId: id, responsavel: cliente.responsavel }} aoFechar={() => setTarefa(false)} />}
      {whats && (
        <Janela titulo={`WhatsApp · ${cliente.nome}`} aoFechar={() => setWhats(false)}>
          <CompositorWhatsApp clienteId={id} aoEnviar={() => setWhats(false)} />
        </Janela>
      )}
    </div>
  )
}
