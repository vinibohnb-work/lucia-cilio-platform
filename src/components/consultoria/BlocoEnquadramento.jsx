import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { useLang } from '../../context/LangContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { CAMPOS, rot, opcaoDe, perguntasDesalinhadas } from '../../data/enquadramento'

// Bloco 0 · Enquadramento — o que se pergunta antes de saber qual dos dois
// produtos faz sentido. Vem do formulário de diagnóstico inicial da Lúcia.
//
// Fica no topo da ficha, junto ao contacto, porque é dessa natureza: não é uma
// sessão de trabalho, é o cabeçalho do caso.
// 13-D (13/10): depois de preenchido (país e "já iniciou"), abre fechado, com uma
// linha de resumo — antes ficava sempre aberto e empurrava o trabalho para baixo.
// Saiu o contador 5/8 (havia cinco sítios com o progresso da consultoria).

const IconAviso = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none', marginTop: '1px' }}><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></svg>
)
const Seta = ({ aberto }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: 'none', transform: aberto ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><path d="m6 9 6 6 6-6" /></svg>
)
// O que entra na linha de resumo, por esta ordem
const RESUMO = ['pais', 'iniciou', 'regime', 'iva', 'faturacao', 'contabilista']

export default function BlocoEnquadramento({ enquadramento = {}, notasCliente = '', alterar }) {
  const { t } = useTheme()
  const { lang } = useLang()
  const isMobile = useIsMobile()

  const L = lang === 'de' ? {
    titulo: 'Einordnung', sub: 'Die Fragen der Erstdiagnose', abrir: 'Bearbeiten', fechar: 'Schließen', iva: 'USt',
    outra: 'Welche?', notasCliente: 'In den Worten der Kundin/des Kunden',
    notasAjuda: 'Getrennt von den internen Notizen.',
    aviso: 'Diese Person ist bereits tätig — mehrere Fragen in Block 1 sind für eine Neugründung formuliert.',
    escolher: '—',
  } : lang === 'en' ? {
    titulo: 'Context', sub: 'The initial diagnostic questions', abrir: 'Edit', fechar: 'Close', iva: 'VAT',
    outra: 'Which one?', notasCliente: "In the client's own words",
    notasAjuda: 'Kept separate from your internal notes.',
    aviso: 'This person is already trading — several questions in block 1 are written for a new venture.',
    escolher: '—',
  } : {
    titulo: 'Enquadramento', sub: 'As perguntas do diagnóstico inicial', abrir: 'Editar', fechar: 'Fechar', iva: 'IVA',
    outra: 'Qual?', notasCliente: 'Nas palavras do cliente',
    notasAjuda: 'Guardado à parte das tuas notas internas.',
    aviso: 'Esta pessoa já está a faturar — várias perguntas do bloco 1 estão escritas para quem ainda não abriu.',
    escolher: '—',
  }

  const preenchido = CAMPOS.filter(c => c.obrigatorio).every(c => String(enquadramento?.[c.key] ?? '').trim())
  const [aberto, setAberto] = useState(!preenchido)
  const set = (k, v) => alterar({ enquadramento: { ...enquadramento, [k]: v } })
  // "PT · Sim · Regime simplificado · IVA: Não · …" — o IVA leva o nome porque "Sim/Não" sozinho não se lê
  const resumo = RESUMO.map(k => {
    const v = opcaoDe(k, enquadramento?.[k], lang)
    if (!v) return ''
    if (k === 'pais') return enquadramento.pais
    return k === 'iva' ? `${L.iva}: ${v}` : v
  }).filter(Boolean).join(' · ')

  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px' }
  const inputStyle = { padding: '10px 12px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: t.fontBody }
  const lblStyle = { fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }

  return (
    <div style={{ ...card, padding: '18px 20px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: t.accentText }}>0</span>
        <h3 style={{ margin: 0, fontFamily: t.fontDisplay, fontSize: '18px', fontWeight: 600, color: t.heading }}>{L.titulo}</h3>
        <span style={{ fontSize: '11px', color: aberto || !resumo ? t.subtle : t.textMuted, fontWeight: aberto || !resumo ? 400 : 600 }}>{aberto || !resumo ? L.sub : resumo}</span>
        <button type="button" onClick={() => setAberto(a => !a)} aria-expanded={aberto}
          style={{ marginLeft: 'auto', alignSelf: 'center', display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: '11.5px', fontWeight: 700, color: t.accentText, fontFamily: t.fontBody }}>
          {aberto ? L.fechar : L.abrir} <Seta aberto={aberto} />
        </button>
      </div>

      {/* Quem já fatura não devia levar as perguntas de quem vai abrir — fica visível mesmo fechado */}
      {perguntasDesalinhadas(enquadramento) && (
        <div style={{ display: 'flex', gap: '7px', alignItems: 'flex-start', background: t.dueSoon.bg, color: t.dueSoon.ink, borderRadius: '9px', padding: '9px 12px', fontSize: '11.5px', fontWeight: 600, margin: '10px 0 4px', lineHeight: 1.45 }}>
          <IconAviso /> <span>{L.aviso}</span>
        </div>
      )}

      {aberto && <>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px', marginTop: '12px' }}>
        {CAMPOS.map(cp => {
          const valor = enquadramento[cp.key] ?? ''
          const opcaoEscolhida = (cp.opcoes || []).find(o => o.key === valor)
          const destacado = !!opcaoEscolhida?.destaque
          return (
            <div key={cp.key} style={cp.key === 'dificuldade' && !isMobile ? { gridColumn: 'span 2' } : undefined}>
              <div style={lblStyle}>
                {rot(cp, lang)}{cp.obrigatorio ? ' *' : ''}
              </div>
              {cp.tipo === 'data' ? (
                <input type="date" value={valor} onChange={e => set(cp.key, e.target.value)} style={inputStyle} />
              ) : (
                <select value={valor} onChange={e => set(cp.key, e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer', fontWeight: destacado ? 700 : 400, color: destacado ? t.dueSoon.ink : t.heading }}>
                  <option value="">{L.escolher}</option>
                  {(cp.opcoes || []).map(o => <option key={o.key} value={o.key}>{rot(o, lang)}</option>)}
                </select>
              )}
              {rot({ pt: cp.ajudaPt, de: cp.ajudaDe, en: cp.ajudaEn }, lang) && (
                <div style={{ fontSize: '11px', color: t.subtle, marginTop: '3px', lineHeight: 1.4 }}>
                  {rot({ pt: cp.ajudaPt, de: cp.ajudaDe, en: cp.ajudaEn }, lang)}
                </div>
              )}
              {/* "Outra" pede o texto */}
              {cp.outraKey && opcaoEscolhida?.pedeTexto && (
                <input value={enquadramento[cp.outraKey] ?? ''} onChange={e => set(cp.outraKey, e.target.value)}
                  placeholder={L.outra} style={{ ...inputStyle, marginTop: '6px' }} />
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: '14px' }}>
        <div style={lblStyle}>{L.notasCliente}</div>
        <textarea value={notasCliente || ''} onChange={e => alterar({ notas_cliente: e.target.value })} rows={2}
          style={{ ...inputStyle, resize: 'vertical' }} />
        <div style={{ fontSize: '11px', color: t.subtle, marginTop: '3px' }}>{L.notasAjuda}</div>
      </div>
      </>}
    </div>
  )
}
