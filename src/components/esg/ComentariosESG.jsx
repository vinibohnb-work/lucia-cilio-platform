import { useState, useEffect, useCallback } from 'react'
import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useViewAs } from '../../context/ViewAsContext'
import { supabase } from '../../lib/supabase'
import { useAlvoESG } from '../../context/AlvoESGContext'

// "Uma caixinha de comentários para cada um deles" (Lúcia, 15/10): dois lados por
// item — o da equipa e o do cliente (tabela esg_comentarios, migração 047).
//   · equipa: a Lúcia escreve; o cliente lê. Não é nota interna.
//   · cliente: o cliente escreve na área dele (a única coisa que grava na ESG);
//     a Lúcia também pode preencher, quando o cliente comenta na reunião.
// No "Ver como" ninguém grava. Grava ao sair do campo.
export default function ComentariosESG({ chave, compacto = false }) {
  const { lang } = useLang()
  const { t } = useTheme()
  const { session, isAdmin } = useAuth()
  const { isViewing } = useViewAs()
  const { id: cid, soLeitura } = useAlvoESG()
  const [linhas, setLinhas] = useState(null)
  const [erro, setErro] = useState('')

  const L = lang === 'de' ? { equipa: 'Kommentar der Beraterin', cliente: 'Kommentar des Kunden', phE: 'Was wir dazu beobachtet haben…', phC: 'Ihre Anmerkung zu diesem Punkt…', erro: 'Speichern fehlgeschlagen.' }
    : lang === 'en' ? { equipa: 'Consultant’s comment', cliente: 'Client’s comment', phE: 'What we observed on this point…', phC: 'Your note on this point…', erro: 'Save failed.' }
    : { equipa: 'Comentário da consultora', cliente: 'Comentário do cliente', phE: 'O que observámos neste ponto…', phC: 'A sua nota sobre este ponto…', erro: 'Falha ao guardar.' }

  const carregar = useCallback(async () => {
    const { data } = await supabase.from('esg_comentarios').select('lado, texto').eq('consultoria_id', cid).eq('chave', chave)
    setLinhas(Object.fromEntries((data || []).map(l => [l.lado, l.texto || ''])))
  }, [cid, chave])
  useEffect(() => { carregar() }, [carregar])

  // Quem pode escrever onde: dentro do caso (Gestão) a admin escreve nos dois
  // lados; na área do cliente só o próprio cliente escreve, e só no lado dele.
  // No "Ver como" (soLeitura + isViewing) ninguém grava.
  const podeEquipa = !soLeitura && isAdmin
  const podeCliente = soLeitura ? (!isViewing && !isAdmin && !!session?.user) : isAdmin

  async function gravar(lado, texto) {
    setErro('')
    const { error } = await supabase.from('esg_comentarios').upsert(
      { consultoria_id: cid, chave, lado, texto, autor_id: session?.user?.id || null, updated_at: new Date().toISOString() },
      { onConflict: 'consultoria_id,chave,lado' })
    if (error) setErro(L.erro); else setLinhas(p => ({ ...(p || {}), [lado]: texto }))
  }

  if (linhas === null) return null
  const lados = [['equipa', podeEquipa, L.phE], ['cliente', podeCliente, L.phC]]
    // Em leitura, um lado vazio não ocupa espaço
    .filter(([lado, pode]) => pode || (linhas[lado] || '').trim())
  if (!lados.length) return null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: compacto ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginTop: '12px' }}>
      {lados.map(([lado, pode, ph]) => (
        <Caixa key={lado} rotulo={L[lado]} valor={linhas[lado] || ''} pode={pode} ph={ph} aoGravar={v => gravar(lado, v)} t={t} fonte={t.fontBody} destaque={lado === 'cliente'} />
      ))}
      {erro && <span role="alert" style={{ fontSize: '12px', color: t.neg, gridColumn: '1 / -1' }}>{erro}</span>}
    </div>
  )
}

function Caixa({ rotulo, valor, pode, ph, aoGravar, t, fonte, destaque }) {
  const [rascunho, setRascunho] = useState(null)
  const atual = rascunho ?? valor
  const estilo = { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '9px', border: `1px solid ${destaque ? t.accent : t.inputBorder}`, background: pode ? t.inputBg : t.softCardBg, color: t.heading, fontSize: '12.5px', lineHeight: 1.5, fontFamily: fonte, resize: 'vertical' }
  return (
    <label style={{ display: 'block', minWidth: 0 }}>
      <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: destaque ? t.accentText : t.textMuted, marginBottom: '4px' }}>{rotulo}</span>
      {pode
        ? <textarea rows={2} value={atual} placeholder={ph} style={estilo} onChange={e => setRascunho(e.target.value)}
            onBlur={() => { if (rascunho !== null && rascunho !== valor) aoGravar(rascunho); setRascunho(null) }} />
        : <div style={{ ...estilo, whiteSpace: 'pre-wrap' }}>{valor}</div>}
    </label>
  )
}
