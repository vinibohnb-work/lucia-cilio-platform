import { useState } from 'react'
import { useIsMobile } from '../../hooks/useIsMobile'
import { usePortal } from '../dados'
import { Titulo, Botao, Cartao, useCampos, Ic, Pilulas } from '../ui'
import { hojeIso, somaDias } from '../regras'
import { tarefaAtrasada } from '../seletores'
import { FormTarefa, TabelaTarefas } from '../partes/Tarefas'

// Área interna de tarefas (documento, secção 4): as tarefas de todos os
// clientes numa lista. 13-D (13/10): os quatro destaques e o filtro "Prazo"
// passaram a pílulas com contagem (Hoje · 7 dias · Em atraso · Todas). Saíram
// o painel de documentos em falta (o resumo vive no Início, o detalhe na
// ficha → Documentos), o cartão de obrigações (prazos fiscais vivem no Início
// e na Agenda) e os filtros Cliente e País (a visão de um cliente é a ficha).

export default function Tarefas() {
  const isMobile = useIsMobile()
  const s = usePortal()
  const c = useCampos()
  const hoje = hojeIso()
  const em7 = somaDias(hoje, 7)
  const [nova, setNova] = useState(false)
  const [f, setF] = useState({ responsavel: '', estado: 'abertas', prazo: 'todas' })
  const set = (k) => (e) => setF(p => ({ ...p, [k]: e.target.value }))

  const PRAZOS = {
    hoje: (x) => x.prazo === hoje,
    '7dias': (x) => x.prazo >= hoje && x.prazo <= em7,
    atraso: (x) => tarefaAtrasada(x, hoje),
    todas: () => true,
  }
  // As contagens das pílulas são das tarefas por fazer da pessoa escolhida.
  const abertas = s.tarefas.filter(x => x.estado !== 'concluida' && (!f.responsavel || x.responsavel === f.responsavel))
  const n = (k) => abertas.filter(PRAZOS[k]).length

  const lista = s.tarefas.filter(x => {
    if (f.responsavel && x.responsavel !== f.responsavel) return false
    if (f.estado === 'abertas' && x.estado === 'concluida') return false
    if (!['abertas', 'todas'].includes(f.estado) && x.estado !== f.estado) return false
    return PRAZOS[f.prazo](x)
  }).sort((a, b) => (a.estado === 'concluida') - (b.estado === 'concluida') || a.prazo.localeCompare(b.prazo))

  // Uma pílula de prazo mostra o que está por fazer (como os antigos destaques).
  const mudarPrazo = (k) => setF(p => ({ ...p, prazo: k, estado: k === 'todas' ? p.estado : 'abertas' }))

  return (
    <div>
      <Titulo titulo="Tarefas"
        acoes={<Botao variante="primario" onClick={() => setNova(true)}><Ic.mais size={16} />Nova tarefa</Botao>} />

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '14px' }}>
        <Pilulas valor={f.prazo} aoMudar={mudarPrazo}
          opcoes={[['hoje', `Hoje (${n('hoje')})`], ['7dias', `7 dias (${n('7dias')})`], ['atraso', `Em atraso (${n('atraso')})`], ['todas', 'Todas']]} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginLeft: isMobile ? 0 : 'auto', width: isMobile ? '100%' : '380px' }}>
          <select value={f.responsavel} onChange={set('responsavel')} style={{ ...c.input, cursor: 'pointer' }} aria-label="Responsável"><option value="">Toda a equipa</option>{s.equipa.map(x => <option key={x}>{x}</option>)}</select>
          {/* Estado: fica como está até a Lúcia decidir se "Em curso" é usado (⏳). */}
          <select value={f.estado} onChange={set('estado')} style={{ ...c.input, cursor: 'pointer' }} aria-label="Estado"><option value="abertas">Por fazer</option><option value="pendente">Pendentes</option><option value="em_curso">Em curso</option><option value="concluida">Concluídas</option><option value="todas">Todas</option></select>
        </div>
      </div>

      <Cartao semPadding><TabelaTarefas tarefas={lista} vazio="Nenhuma tarefa com estes filtros." /></Cartao>
      {nova && <FormTarefa aoFechar={() => setNova(false)} />}
    </div>
  )
}
