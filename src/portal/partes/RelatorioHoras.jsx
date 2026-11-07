import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { Janela, Botao, Campo, Ic, useCampos } from '../ui'
import { ATIVIDADES, hojeIso, somaDias, dataDe } from '../regras'
import { TODOS, filtrarHoras, resumoHoras, csvHoras, htmlHoras, fmtHoras } from '../relatorioHoras'

// Janela "Relatório de horas" da página Horas (pedido da Letícia, 06/11).
// Escolhe-se o período, a pessoa e o cliente/atividade; vê-se o total antes
// de imprimir (ou guardar em PDF) ou descarregar para o Excel.

const pad = (n) => String(n).padStart(2, '0')
const fimDoMes = (mes) => { const d = dataDe(`${mes}-01`); d.setMonth(d.getMonth() + 1, 0); return `${mes}-${pad(d.getDate())}` }

function periodoRapido(k, hoje) {
  const mes = hoje.slice(0, 7)
  if (k === 'mes') return [`${mes}-01`, fimDoMes(mes)]
  if (k === 'anterior') { const ant = somaDias(`${mes}-01`, -1).slice(0, 7); return [`${ant}-01`, fimDoMes(ant)] }
  if (k === 'trimestre') { const m = Number(mes.slice(5)); const q = Math.floor((m - 1) / 3) * 3 + 1; const ini = `${hoje.slice(0, 4)}-${pad(q)}`; return [`${ini}-01`, fimDoMes(`${hoje.slice(0, 4)}-${pad(q + 2)}`)] }
  if (k === 'ano') return [`${hoje.slice(0, 4)}-01-01`, `${hoje.slice(0, 4)}-12-31`]
  return null
}

export default function RelatorioHoras({ horas, clientes, equipa, eu, mesInicial, pessoaInicial, aoFechar }) {
  const { t } = useTheme()
  const c = useCampos()
  const hoje = hojeIso()
  const [de, setDe] = useState(`${mesInicial}-01`)
  const [ate, setAte] = useState(fimDoMes(mesInicial))
  const [pessoa, setPessoa] = useState(pessoaInicial ?? TODOS)
  const [destino, setDestino] = useState(TODOS)
  const [aviso, setAviso] = useState('')

  const nomeCliente = Object.fromEntries(clientes.map(x => [x.id, x.nome]))
  const atividades = [...new Set([...ATIVIDADES, ...horas.filter(h => !h.clienteId && h.atividade).map(h => h.atividade)])]
  const clientesComHoras = clientes.filter(x => horas.some(h => h.clienteId === x.id)).sort((a, b) => a.nome.localeCompare(b.nome))
  const pessoas = [...new Set([eu, ...equipa, ...horas.map(h => h.pessoa)])].filter(Boolean)

  const lista = de && ate && de <= ate ? filtrarHoras(horas, { de, ate, pessoa, destino }) : []
  const r = resumoHoras(lista, nomeCliente)
  const pessoaTxt = pessoa ? pessoa : 'Toda a equipa'
  const destinoTxt = !destino ? 'Todos os clientes e atividades' : destino.startsWith('c:') ? (nomeCliente[destino.slice(2)] || 'Cliente') : destino.slice(2)
  const nomeFicheiro = `horas-${de}-a-${ate}`

  function validar() {
    if (!de || !ate || de > ate) { setAviso('Escolha um período válido: a data inicial não pode ser depois da final.'); return false }
    if (!lista.length) { setAviso('Não há horas registadas com estes filtros.'); return false }
    setAviso(''); return true
  }
  function imprimir() {
    if (!validar()) return
    const w = window.open('', '_blank')
    if (!w) { setAviso('O navegador bloqueou a janela do relatório. Permita janelas deste site e tente de novo.'); return }
    w.document.write(htmlHoras(lista, nomeCliente, { de, ate, pessoaTxt, destinoTxt, origem: hoje }))
    w.document.close()
    setTimeout(() => w.print(), 300)
  }
  function descarregar() {
    if (!validar()) return
    const url = URL.createObjectURL(new Blob([csvHoras(lista, nomeCliente)], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url; a.download = `${nomeFicheiro}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const sel = { ...c.input, cursor: 'pointer' }
  const rapido = (k) => { const p = periodoRapido(k, hoje); setDe(p[0]); setAte(p[1]); setAviso('') }

  return (
    <Janela titulo="Relatório de horas" aoFechar={aoFechar} largura={620}>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {[['mes', 'Este mês'], ['anterior', 'Mês anterior'], ['trimestre', 'Este trimestre'], ['ano', 'Este ano']].map(([k, rot]) => (
          <Botao key={k} onClick={() => rapido(k)} estilo={{ padding: '6px 12px', fontSize: '12.5px' }}>{rot}</Botao>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '12px' }}>
        <Campo rotulo="De"><input type="date" value={de} max={ate || undefined} onChange={e => setDe(e.target.value)} style={c.input} /></Campo>
        <Campo rotulo="Até"><input type="date" value={ate} min={de || undefined} onChange={e => setAte(e.target.value)} style={c.input} /></Campo>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '14px' }}>
        <Campo rotulo="Quem">
          <select value={pessoa} onChange={e => setPessoa(e.target.value)} style={sel}>
            <option value={TODOS}>Toda a equipa</option>
            {pessoas.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </Campo>
        <Campo rotulo="Cliente ou atividade">
          <select value={destino} onChange={e => setDestino(e.target.value)} style={sel}>
            <option value={TODOS}>Todos</option>
            <optgroup label="Clientes">
              {clientesComHoras.map(x => <option key={x.id} value={`c:${x.id}`}>{x.nome}</option>)}
            </optgroup>
            <optgroup label="Atividades">
              {atividades.map(a => <option key={a} value={`a:${a}`}>{a}</option>)}
            </optgroup>
          </select>
        </Campo>
      </div>

      <div style={{ background: t.softCardBg, borderRadius: '10px', padding: '12px 14px', marginBottom: '14px', fontSize: '13.5px', color: t.text }}>
        {lista.length ? (
          <>
            <strong style={{ color: t.heading, fontVariantNumeric: 'tabular-nums' }}>{fmtHoras(r.total)}</strong> em {r.registos} {r.registos === 1 ? 'registo' : 'registos'}
            {r.porDestino.length > 1 && <> · {r.porDestino.length} clientes e atividades</>}
            {r.porPessoa.length > 1 && <> · {r.porPessoa.length} pessoas</>}
          </>
        ) : 'Sem horas registadas com estes filtros.'}
      </div>

      {aviso && <div role="alert" style={{ marginBottom: '12px', fontSize: '12.5px', fontWeight: 700, color: t.dueLate.ink }}>{aviso}</div>}

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <Botao onClick={descarregar} disabled={!lista.length}><Ic.lista size={15} />Descarregar para Excel</Botao>
        <Botao variante="primario" onClick={imprimir} disabled={!lista.length}>Imprimir ou guardar em PDF</Botao>
      </div>
    </Janela>
  )
}
