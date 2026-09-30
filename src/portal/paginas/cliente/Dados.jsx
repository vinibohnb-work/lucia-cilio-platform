import { useTheme } from '../../../context/ThemeContext'
import { useIsMobile } from '../../../hooks/useIsMobile'
import { acoes, usePortal } from '../../dados'
import { Cartao, Campo, Chip, useCampos, usePerfil, pode, Ic } from '../../ui'
import { fmtEur, PAISES, FORMAS, REGIMES, SOFTWARE, SERVICOS, PERIODICIDADES, ESTADOS_CLIENTE, rotuloRegime, rotuloServico, rotuloPeriodicidade } from '../../regras'

// Dados do cliente — os campos do cabeçalho do documento (secção 1) e o perfil
// fiscal que decide o calendário (secção 3). Estes dados são mantidos pela
// equipa: o cliente vê-os, não os altera.

export default function Dados({ cliente, modoCliente, equipa }) {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const c = useCampos()
  const { papel } = usePerfil()
  const s = usePortal()
  const conta = s.contas.find(x => x.id === cliente.userId)
  const livres = s.contas.filter(x => x.id === cliente.userId || !s.clientes.some(k => k.userId === x.id))
  const up = (patch) => acoes.atualizarCliente(cliente.id, patch)
  const inp = (k, extra = {}) => <input value={cliente[k] ?? ''} onChange={e => up({ [k]: e.target.value })} style={c.input} {...extra} />
  const sel = (k, opcoes) => (
    <select value={cliente[k] ?? ''} onChange={e => up({ [k]: e.target.value })} style={{ ...c.input, cursor: 'pointer' }}>
      {opcoes.map(([v, r]) => <option key={v} value={v}>{r}</option>)}
    </select>
  )
  const grelha = { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: '12px' }

  if (modoCliente) {
    const linhas = [
      ['Empresa', cliente.nome], ['Pessoa de contacto', cliente.pessoa], ['País', PAISES[cliente.pais]], ['Forma jurídica', cliente.forma],
      ['Setor', cliente.setor], ['Regime fiscal', rotuloRegime(cliente)], ['Serviços contratados', cliente.servicos.map(rotuloServico).join(', ')],
      ['Acompanhamento', rotuloPeriodicidade(cliente.periodicidade)], ['Software contabilístico', cliente.software], ['E-mail', cliente.email], ['Telefone', cliente.telefone || '—'],
    ]
    return (
      <Cartao titulo="Os dados da sua empresa" icone={<Ic.clientes />}>
        <div style={grelha}>
          {linhas.map(([k, v]) => <div key={k}><div style={c.rotulo}>{k}</div><div style={{ fontSize: '14px', fontWeight: 600, color: t.heading }}>{v || '—'}</div></div>)}
        </div>
        <div style={{ fontSize: '12px', color: t.subtle, marginTop: '14px' }}>Algo mudou? Envie uma mensagem — a equipa atualiza os dados e o calendário fiscal.</div>
      </Cartao>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Cartao titulo="Identificação e contactos" icone={<Ic.clientes />} area="cliente">
        <div style={grelha}>
          <Campo rotulo="Nome do cliente ou empresa">{inp('nome')}</Campo>
          <Campo rotulo="Pessoa de contacto">{inp('pessoa')}</Campo>
          <Campo rotulo="Setor de atividade">{inp('setor')}</Campo>
          <Campo rotulo="E-mail">{inp('email', { type: 'email' })}</Campo>
          <Campo rotulo="Telefone (WhatsApp)">{inp('telefone', { placeholder: '+49 …' })}</Campo>
          <Campo rotulo="Estado do cliente">{sel('estado', Object.entries(ESTADOS_CLIENTE).map(([k, v]) => [k, v.rotulo]))}</Campo>
        </div>
      </Cartao>

      <Cartao titulo="Perfil fiscal e serviço" icone={<Ic.agenda />} area="cliente">
        <div style={grelha}>
          <Campo rotulo="País">{sel('pais', Object.entries(PAISES))}</Campo>
          <Campo rotulo="Forma jurídica">{sel('forma', (FORMAS[cliente.pais] || []).map(x => [x, x]))}</Campo>
          <Campo rotulo="Regime fiscal">{sel('regime', REGIMES[cliente.pais] || [])}</Campo>
          <Campo rotulo="Periodicidade do acompanhamento">{sel('periodicidade', PERIODICIDADES)}</Campo>
          <Campo rotulo="Software contabilístico">{sel('software', SOFTWARE.map(x => [x, x]))}</Campo>
          <Campo rotulo="Trabalhadores">
            <select value={String(!!cliente.trabalhadores)} onChange={e => up({ trabalhadores: e.target.value === 'true' })} style={{ ...c.input, cursor: 'pointer' }}>
              <option value="false">Não tem</option><option value="true">Tem trabalhadores</option>
            </select></Campo>
        </div>
        <div style={{ marginTop: '14px' }}>
          <span style={c.rotulo}>Serviços contratados</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {SERVICOS.map(([k, r]) => {
              const on = cliente.servicos.includes(k)
              return (
                <label key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '7px 12px', borderRadius: '9px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, border: `1px solid ${on ? t.accent : t.cardBorder}`, background: on ? t.softCardBg : t.cardBg, color: t.heading }}>
                  <input type="checkbox" checked={on} onChange={() => up({ servicos: on ? cliente.servicos.filter(x => x !== k) : [...cliente.servicos, k] })} style={{ accentColor: t.btnBg }} />{r}
                </label>
              )
            })}
          </div>
        </div>
        <div style={{ fontSize: '12px', color: t.subtle, marginTop: '12px' }}>País, forma jurídica, regime, periodicidade, trabalhadores e serviços decidem o calendário fiscal. Depois de mudar, gere o ano outra vez em Obrigações fiscais — não duplica o que já existe.</div>
      </Cartao>

      <Cartao titulo="Gestão interna" icone={<Ic.cadeado size={17} />} area="interna">
        <div style={grelha}>
          <Campo rotulo="Responsável pelo cliente">{sel('responsavel', equipa.map(x => [x, x]))}</Campo>
          <Campo rotulo="Horas incluídas por mês">{inp('horasIncluidas', { type: 'number', step: '0.5' })}</Campo>
          <Campo rotulo="Cliente desde">{inp('cliente_desde', { type: 'date' })}</Campo>
          {pode(papel, 'avenca') && (
            <Campo rotulo="Avença">
              <div style={{ fontSize: '13.5px', padding: '9px 0' }}>
                {cliente.contratoId ? <><strong style={{ color: t.heading }}>{fmtEur(cliente.avenca)}</strong> · {(rotuloPeriodicidade(cliente.avencaPeriodicidade) || cliente.avencaPeriodicidade).toLowerCase()}</> : <span style={{ color: t.subtle }}>sem contrato</span>}
                <a href="/gestao/financeiro" style={{ marginLeft: '8px', fontSize: '12px', fontWeight: 700, color: t.accentText, textDecoration: 'none' }}>Financeiro →</a>
              </div>
            </Campo>
          )}
        </div>
      </Cartao>

      {/* Conta na plataforma: é o que liga esta ficha ao que o cliente vê e faz na conta dele. */}
      <Cartao titulo="Conta na plataforma" icone={<Ic.cadeado size={17} />} area="interna">
        {s.admin ? (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select value={cliente.userId || ''} onChange={e => { if (!e.target.value || window.confirm('Ligar esta ficha à conta escolhida? As obrigações fiscais da conta passam a aparecer aqui e as desta ficha passam a aparecer ao cliente.')) acoes.ligarConta(cliente.id, e.target.value || null) }}
              style={{ ...c.input, width: 'auto', minWidth: '260px', cursor: 'pointer' }} aria-label="Conta na plataforma">
              <option value="">Sem conta (só WhatsApp e e-mail)</option>
              {livres.map(x => <option key={x.id} value={x.id}>{x.nome} · {x.email}</option>)}
            </select>
            {conta && <Chip tom={conta.ativo ? 'ok' : 'aviso'}>{conta.ativo ? 'Conta ativa' : 'Ainda não entrou'}</Chip>}
            <a href="/gestao/acessos" style={{ fontSize: '12px', fontWeight: 700, color: t.accentText, textDecoration: 'none' }}>Criar conta em Acessos →</a>
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: t.text }}>{cliente.userId ? 'Tem conta na plataforma.' : 'Sem conta na plataforma.'}</div>
        )}
        <div style={{ fontSize: '12px', color: t.subtle, marginTop: '10px' }}>Com conta, as mensagens daqui aparecem no Início do cliente e os documentos carregados por mês ficam na pasta dele. Sem conta, fica tudo registado aqui e a comunicação é por WhatsApp.</div>
      </Cartao>
    </div>
  )
}
