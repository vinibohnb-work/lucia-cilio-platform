import { useTheme } from '../../context/ThemeContext'
import { useLang } from '../../context/LangContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { CAMPOS, rot, progressoEnquadramento, perguntasDesalinhadas } from '../../data/enquadramento'

// Bloco 0 · Enquadramento — o que se pergunta antes de saber qual dos dois
// produtos faz sentido. Vem do formulário de diagnóstico inicial da Lúcia.
//
// Fica no topo da ficha, junto ao contacto, porque é dessa natureza: não é uma
// sessão de trabalho, é o cabeçalho do caso.

export default function BlocoEnquadramento({ enquadramento = {}, notasCliente = '', alterar }) {
  const { t } = useTheme()
  const { lang } = useLang()
  const isMobile = useIsMobile()

  const L = lang === 'de' ? {
    titulo: 'Einordnung', sub: 'Aus dem Erstdiagnose-Formular',
    outra: 'Welche?', notasCliente: 'In den Worten der Kundin/des Kunden',
    notasAjuda: 'Getrennt von den internen Notizen.',
    aviso: 'Diese Person ist bereits tätig — mehrere Fragen in Block 1 sind für eine Neugründung formuliert.',
    escolher: '—',
  } : lang === 'en' ? {
    titulo: 'Context', sub: 'From the initial diagnostic form',
    outra: 'Which one?', notasCliente: "In the client's own words",
    notasAjuda: 'Kept separate from your internal notes.',
    aviso: 'This person is already trading — several questions in block 1 are written for a new venture.',
    escolher: '—',
  } : {
    titulo: 'Enquadramento', sub: 'Do formulário de diagnóstico inicial',
    outra: 'Qual?', notasCliente: 'Nas palavras do cliente',
    notasAjuda: 'Guardado à parte das tuas notas internas.',
    aviso: 'Esta pessoa já está a faturar — várias perguntas do bloco 1 estão escritas para quem ainda não abriu.',
    escolher: '—',
  }

  const prog = progressoEnquadramento(enquadramento)
  const set = (k, v) => alterar({ enquadramento: { ...enquadramento, [k]: v } })

  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px' }
  const inputStyle = { padding: '10px 12px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: t.fontBody }
  const lblStyle = { fontSize: '11px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '4px' }

  return (
    <div style={{ ...card, padding: '18px 20px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap', marginBottom: '3px' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: t.accentText }}>0</span>
        <h3 style={{ margin: 0, fontFamily: t.fontDisplay, fontSize: '18px', fontWeight: 600, color: t.heading }}>{L.titulo}</h3>
        <span style={{ fontSize: '11px', color: t.subtle }}>{L.sub}</span>
        <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: prog.pct === 100 ? t.dueOk.ink : t.subtle }}>{prog.feitas}/{prog.total}</span>
      </div>

      {/* Quem já fatura não devia levar as perguntas de quem vai abrir */}
      {perguntasDesalinhadas(enquadramento) && (
        <div style={{ background: t.dueSoon.bg, color: t.dueSoon.ink, borderRadius: '9px', padding: '9px 12px', fontSize: '11.5px', fontWeight: 600, margin: '10px 0 4px', lineHeight: 1.45 }}>
          ⚠ {L.aviso}
        </div>
      )}

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
                <div style={{ fontSize: '10.5px', color: t.subtle, marginTop: '3px', lineHeight: 1.4 }}>
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
        <div style={{ fontSize: '10.5px', color: t.subtle, marginTop: '3px' }}>{L.notasAjuda}</div>
      </div>
    </div>
  )
}
