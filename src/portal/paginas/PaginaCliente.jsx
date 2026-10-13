import { useState, lazy, Suspense } from 'react'
import { useParams, useNavigate, NavLink, Navigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'
import { useViewAs } from '../../context/ViewAsContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { usePortal } from '../dados'
import { usePerfil, Chip, Botao, Janela, Ic, Cartao } from '../ui'
import { PAISES, ESTADOS_CLIENTE, rotuloServico, rotuloPeriodicidade, rotuloRegime, linkWhatsApp } from '../regras'
import { naoLidas } from '../seletores'
import { FormTarefa } from '../partes/Tarefas'
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
  const { setViewAs } = useViewAs()
  const modoCliente = papel === 'cliente'
  const id = idFixo || params.id
  const sep = params.sep || 'resumo'
  // Também aceita o id da conta (ligações antigas da ficha da v1 apontavam para ele)
  const cliente = s.clientes.find(c => c.id === id) || s.clientes.find(c => c.userId === id)
  const [tarefa, setTarefa] = useState(false)
  const [whats, setWhats] = useState(false)

  // Ao abrir pelo endereço (ou F5) os dados ainda não chegaram: esperar, em vez
  // de concluir que a ficha não existe e voltar à lista (teste de 05/10).
  if (!s.carregado) return <div style={{ padding: '24px 0', fontSize: '13px', color: t.subtle }}>A carregar…</div>
  if (!cliente) return <Navigate to="/gestao/clientes" replace />
  const base = modoCliente ? '/v2/portal' : `/gestao/clientes/${id}`
  const porLer = naoLidas(s, id).length

  const separadores = [
    // As Tarefas vivem no Resumo (simplificação de 12/10)
    ['resumo', 'Resumo'], ['obrigacoes', 'Obrigações fiscais'],
    ['documentos', 'Documentos'], ['relatorios', 'Relatórios'],
    ['mensagens', 'Mensagens', !modoCliente && porLer], ['dados', modoCliente ? 'Os meus dados' : 'Dados do cliente'],
    ...(modoCliente ? [] : [['notas', 'Notas internas', null, true]]),
    // Só a administradora: a ficha da conta usa a lista de contas, que é dela.
    ...(!modoCliente && papel === 'admin' && cliente?.userId ? [['conta', 'Conta na plataforma', null, true]] : []),
  ]
  if (!separadores.some(([k]) => k === sep)) return <Navigate to={base} replace />

  const est = ESTADOS_CLIENTE[cliente.estado]
  // Uma linha de perfil só com o que está preenchido (sem rótulos vazios)
  const perfil = [
    cliente.setor,
    [cliente.servicos.map(rotuloServico).join(' + '), rotuloPeriodicidade(cliente.periodicidade).toLowerCase()].filter(Boolean).join(' '),
    cliente.forma,
    cliente.regime && rotuloRegime(cliente),
  ].filter(x => x && String(x).trim() && x !== '—').join(' · ')
  const tel = (cliente.telefone || '').replace(/[^\d+]/g, '')
  const contactos = [
    cliente.pessoa && ['pessoa', <Ic.clientes size={15} />, cliente.pessoa],
    cliente.email && ['email', <Ic.mail size={15} />, cliente.email, `mailto:${cliente.email}`],
    cliente.telefone && ['tel', <Ic.telefone size={15} />, cliente.telefone, `tel:${tel}`],
  ].filter(Boolean)

  // "Ver como o cliente" (08/10): entra na conta dele em só leitura, na página
  // que ele vê ao entrar, e a barra de cima traz de volta a esta ficha.
  function verComoCliente() {
    const conta = s.contas.find(x => x.id === cliente.userId)
    const platform = conta?.platform || 'accounting'
    setViewAs({ id: cliente.userId, name: cliente.nome, platform, voltar: `/gestao/clientes/${cliente.id}` })
    navigate(platform === 'esg' ? '/esg/percurso' : '/contabilidade/inicio')
  }

  return (
    <div>
      {!modoCliente && (
        <button onClick={() => navigate('/gestao/clientes')} style={{ background: 'none', border: 'none', padding: 0, marginBottom: '14px', color: t.accentText, fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>← Todos os clientes</button>
      )}

      {/* ── Cabeçalho (secção 1) ──
          Simplificado a 12/10: sem o quadrado das iniciais; uma linha de perfil só com o que
          está preenchido; contactos clicáveis; o estado só aparece quando não é "Ativo". */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '28px' : '36px', lineHeight: 1.05, color: t.heading }}>{cliente.nome}</h1>
            <Chip tom="ouro"><Ic.pin />{PAISES[cliente.pais]}</Chip>
            {cliente.estado !== 'ativo' && est && <Chip tom={est.tom}>{est.rotulo}</Chip>}
          </div>
          {perfil && <div style={{ fontSize: '14.5px', color: t.textMuted, marginTop: '6px' }}>{perfil}</div>}
          {contactos.length > 0 && (
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px', fontSize: '13px' }}>
              {contactos.map(([k, icone, texto, href]) => (
                <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: t.text }}>
                  <span style={{ color: t.subtle, display: 'flex' }}>{icone}</span>
                  {href ? <a href={href} style={{ color: 'inherit', textDecoration: 'none' }}>{texto}</a> : texto}
                </span>
              ))}
            </div>
          )}
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
              {papel === 'admin' && <Botao onClick={verComoCliente} disabled={!cliente.userId}
                title={cliente.userId ? 'Abre a plataforma exatamente como o cliente a vê (só leitura)' : 'Este cliente ainda não tem conta na plataforma'}><Ic.olho size={15} />Ver como o cliente</Botao>}
              {/* O único sítio da ficha para escrever um WhatsApp (12/10) */}
              <Botao variante="whats" onClick={() => setWhats(true)}><Ic.whats />WhatsApp</Botao>
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
            {!!badge && <span style={{ fontSize: '11px', fontWeight: 800, padding: '1px 6px', borderRadius: '20px', background: '#c0392b', color: '#fff' }}>{badge}</span>}
          </NavLink>
        ))}
      </nav>

      {sep === 'resumo' && <Resumo cliente={cliente} base={base} modoCliente={modoCliente} />}
      {sep === 'obrigacoes' && <Obrigacoes cliente={cliente} modoCliente={modoCliente} />}
      {sep === 'documentos' && <Documentos cliente={cliente} modoCliente={modoCliente} />}
      {sep === 'relatorios' && <RelatoriosCliente cliente={cliente} modoCliente={modoCliente} />}
      {sep === 'mensagens' && (
        <Cartao titulo={modoCliente ? 'Conversa com a LC Office Consulting' : `Conversa com ${cliente.pessoa || cliente.nome}`} icone={<Ic.mensagens />}>
          <Chat clienteId={id} como={modoCliente ? 'cliente' : 'equipa'} />
        </Cartao>
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
