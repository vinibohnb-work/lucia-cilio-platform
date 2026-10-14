import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { supabase } from '../../lib/supabase'
import { BLOCOS, progressoTotal, progressoBloco } from '../../data/consultoriaBlocos'
import ListaCasos from '../../components/gestao/ListaCasos'

// Lista de consultorias. A Lúcia trabalha aqui como administradora e regista o
// contacto sem criar conta ao cliente (decisão da reunião de 13/08).
// 13-D (13/10): cria-se só com Nome, Empresa e Tipo — o e-mail, o telefone e o
// setor estão no cabeçalho da ficha, que abre logo a seguir.

const EMPTY = { nome: '', empresa: '', tipo: 'implementacao' }

// O bloco atual é calculado (o primeiro por acabar), como a fase na ESG — antes
// ficava gravado o último bloco em que se clicou, mesmo só para espreitar.
const blocoAtual = (c) => (BLOCOS.find(b => progressoBloco(b.n, c).pct < 100) || BLOCOS[BLOCOS.length - 1]).n

const IconPasta = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="7" width="17" height="12.5" rx="2" /><path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M3.5 12.5h17" /></svg>
)

export default function Consultorias() {
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filtro, setFiltro] = useState('ativa')

  const L = lang === 'de' ? {
    title: 'Beratungen',
    nova: '+ Neue Beratung', nome: 'Name', empresa: 'Firma',
    tipo: 'Art', tGratuita: 'Kostenlos', tImplementacao: 'Geschäftsaufbau',
    criar: 'Anlegen und beginnen', cancelar: 'Abbrechen',
    ativa: 'Laufend', concluida: 'Abgeschlossen', pausada: 'Pausiert', todas: 'Alle',
    respostas: 'Antworten', vazio: 'Noch keine Beratung. Legen Sie die erste an.',
    loading: 'Wird geladen…', erro: 'Laden nicht möglich. Bitte erneut versuchen.', erroCriar: 'Anlegen nicht möglich. Bitte erneut versuchen.',
    semNome: 'Name ist erforderlich.',
    abrirLista: 'Öffnen', hCliente: 'Kunde', hEstado: 'Status', hBlocos: 'Blöcke', hProgresso: 'Fortschritt',
  } : lang === 'en' ? {
    title: 'Consultancies',
    nova: '+ New consultancy', nome: 'Name', empresa: 'Company',
    tipo: 'Type', tGratuita: 'Free', tImplementacao: 'Business setup',
    criar: 'Create and start', cancelar: 'Cancel',
    ativa: 'Active', concluida: 'Completed', pausada: 'Paused', todas: 'All',
    respostas: 'answers', vazio: 'No consultancies yet. Create the first one.',
    loading: 'Loading…', erro: 'Could not load. Please try again.', erroCriar: 'Could not create. Please try again.',
    semNome: 'Name is required.',
    abrirLista: 'Open', hCliente: 'Client', hEstado: 'Status', hBlocos: 'Blocks', hProgresso: 'Progress',
  } : {
    title: 'Consultorias',
    nova: '+ Nova consultoria', nome: 'Nome', empresa: 'Empresa',
    tipo: 'Tipo', tGratuita: 'Gratuita', tImplementacao: 'Implementação de negócio',
    criar: 'Criar e começar', cancelar: 'Cancelar',
    ativa: 'Ativa', concluida: 'Concluída', pausada: 'Pausada', todas: 'Todas',
    respostas: 'respostas', vazio: 'Ainda não há consultorias. Cria a primeira.',
    loading: 'A carregar…', erro: 'Não foi possível carregar. Tenta de novo.', erroCriar: 'Não foi possível criar. Tenta de novo.',
    semNome: 'O nome é obrigatório.',
    abrirLista: 'Abrir', hCliente: 'Cliente', hEstado: 'Estado', hBlocos: 'Blocos', hProgresso: 'Progresso',
  }

  const tipoLabel = (x) => x === 'gratuita' ? L.tGratuita : L.tImplementacao
  const statusLabel = { ativa: L.ativa, concluida: L.concluida, pausada: L.pausada }
  const statusTone = { ativa: t.dueOk, concluida: { bg: t.chipBg, ink: t.chipText }, pausada: { bg: t.segBg, ink: t.textMuted } }

  const load = useCallback(async () => {
    setLoading(true); setErr('')
    const { data, error } = await supabase.from('consultorias').select('*').order('updated_at', { ascending: false })
    if (error) setErr(L.erro); else setLista(data || [])
    setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])

  async function criar() {
    if (!form?.nome.trim()) { setErr(L.semNome); return }
    setSaving(true); setErr('')
    const { data, error } = await supabase.from('consultorias').insert({
      nome: form.nome.trim(), empresa: form.empresa || null, tipo: form.tipo,
    }).select('id').single()
    setSaving(false)
    if (error || !data) { setErr(L.erroCriar); return }
    navigate(`/gestao/consultorias/${data.id}`)   // entra logo a trabalhar
  }

  const visiveis = filtro === 'todas' ? lista : lista.filter(c => c.status === filtro)

  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px' }
  const inputStyle = { padding: '10px 12px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }
  const lblStyle = { fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody }}>
      <h1 className="so-leitores">{L.title}</h1>

      {err && <div style={{ background: t.dueLate.bg, color: t.dueLate.ink, borderRadius: '10px', padding: '11px 15px', fontSize: '12.5px', fontWeight: 600, marginBottom: '14px' }}>{err}</div>}

      {/* Criar — só o essencial, para arrancar em segundos numa sessão ao vivo */}
      {form && (
        <div style={{ ...card, padding: '18px 20px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1.3fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div><div style={lblStyle}>{L.nome} *</div><input autoFocus value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} style={inputStyle} /></div>
            <div><div style={lblStyle}>{L.empresa}</div><input value={form.empresa} onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))} style={inputStyle} /></div>
            <div><div style={lblStyle}>{L.tipo}</div>
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="implementacao">{L.tImplementacao}</option>
                <option value="gratuita">{L.tGratuita}</option>
              </select></div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={criar} disabled={saving || !form.nome.trim()} style={{ padding: '10px 20px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '9px', fontWeight: 700, fontSize: '13px', cursor: form.nome.trim() ? 'pointer' : 'default', opacity: form.nome.trim() ? 1 : .5 }}>{saving ? '…' : L.criar}</button>
            <button onClick={() => { setForm(null); setErr('') }} style={{ padding: '10px 16px', background: t.segBg, border: `1px solid ${t.segBorder}`, borderRadius: '9px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', color: t.textMuted }}>{L.cancelar}</button>
          </div>
        </div>
      )}

      {/* Com o formulário de nova consultoria aberto (muitas vezes com o cliente ao
          lado), a lista dos outros clientes não aparece — reunião de 08/10. */}
      {/* Filtro por estado */}
      {/* Filtros e o botão de criar na mesma linha (13/10) — sem linha só para o botão */}
      {!form && <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px' }}>
        {['ativa', 'concluida', 'pausada', 'todas'].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{
            padding: '7px 14px', borderRadius: '20px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer',
            border: `1px solid ${filtro === f ? t.accent : t.cardBorder}`,
            background: filtro === f ? t.softCardBg : 'transparent', color: filtro === f ? t.accentText : t.textMuted,
          }}>{f === 'todas' ? L.todas : statusLabel[f]}</button>
        ))}
        <span style={{ flex: 1 }} />
        <button onClick={() => setForm({ ...EMPTY })} style={{ padding: '10px 20px', background: t.btnBg, color: t.btnInk, border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>{L.nova}</button>
      </div>}

      {!form && loading && <div style={{ padding: '40px', color: t.subtle, fontSize: '14px' }}>{L.loading}</div>}
      {!form && !loading && visiveis.length === 0 && (
        <div style={{ ...card, padding: '34px 28px', textAlign: 'center' }}>
          <div style={{ marginBottom: '10px', color: t.subtle }}><IconPasta /></div>
          <div style={{ fontSize: '14px', color: t.textMuted }}>{L.vazio}</div>
        </div>
      )}

      {/* A mesma lista das Consultorias ESG — uma linha por cliente, blocos à vista */}
      {!form && !loading && visiveis.length > 0 && (
        <ListaCasos
          abrirRotulo={L.abrirLista}
          // 13-D (13/10): a coluna Estado só aparece em "Todas" — com um filtro de
          // estado, todas as linhas diziam o mesmo.
          cabecalho={{ cliente: L.hCliente, estado: filtro === 'todas' ? L.hEstado : null, fases: L.hBlocos, resumo: L.hProgresso }}
          linhas={visiveis.map(c => {
            const prog = progressoTotal(c)
            const tone = statusTone[c.status] || statusTone.ativa
            const atual = blocoAtual(c)
            return {
              id: c.id,
              titulo: c.nome,
              sub: [c.empresa, c.setor].filter(Boolean).join(' · '),
              estado: filtro === 'todas' ? { rotulo: statusLabel[c.status], bg: tone.bg, ink: tone.ink } : null,
              chips: [tipoLabel(c.tipo)],
              fases: BLOCOS.map(b => { const p = progressoBloco(b.n, c); return { n: b.n, titulo: b[lang] || b.pt, pct: p.pct, atual: atual === b.n, pronto: p.pct >= 100 } }),
              // Sem "Bloco N": a barra do bloco atual já está destacada ao lado
              resumo: <><strong style={{ color: t.heading }}>{prog.feitas}/{prog.total}</strong> {L.respostas}</>,
              onAbrir: () => navigate(`/gestao/consultorias/${c.id}`),
            }
          })}
        />
      )}
    </div>
  )
}
