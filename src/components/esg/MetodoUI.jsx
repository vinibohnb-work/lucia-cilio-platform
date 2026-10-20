import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'

// Peças visuais partilhadas pelas páginas do método ESG (os dados vêm de
// src/lib/useMetodoESG.js).

// Caixa de texto que grava ao sair do campo (regra do projeto: nada a cada tecla).
// `valor` vem de fora; enquanto se escreve, vale o rascunho local.
export function CampoTexto({ valor, aoGravar, soLeitura, linhas = 3, placeholder, rotulo, ajuda }) {
  const { t } = useTheme()
  const [rascunho, setRascunho] = useState(null)
  const atual = rascunho ?? (valor || '')
  const estilo = { width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, background: soLeitura ? t.softCardBg : t.inputBg, color: t.heading, fontSize: '13px', lineHeight: 1.5, fontFamily: t.fontBody, resize: 'vertical', outline: 'none' }
  return (
    <label style={{ display: 'block' }}>
      {rotulo && <span style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: t.heading, marginBottom: '4px', lineHeight: 1.4 }}>{rotulo}</span>}
      {ajuda && <span style={{ display: 'block', fontSize: '11.5px', color: t.subtle, marginBottom: '5px' }}>{ajuda}</span>}
      {soLeitura
        ? <div style={{ ...estilo, minHeight: '38px', whiteSpace: 'pre-wrap', color: atual ? t.heading : t.subtle }}>{atual || '—'}</div>
        : <textarea rows={linhas} value={atual} placeholder={placeholder} style={estilo}
            onChange={e => setRascunho(e.target.value)}
            onBlur={() => { if (rascunho !== null && rascunho !== (valor || '')) aoGravar(rascunho); setRascunho(null) }} />}
    </label>
  )
}

export function CartaoMetodo({ titulo, sub, children, acao }) {
  const { t } = useTheme()
  return (
    <section style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px', padding: '18px 20px', marginBottom: '16px' }}>
      {(titulo || acao) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: sub ? '4px' : '12px', flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: t.heading, flex: 1, minWidth: '200px' }}>{titulo}</h2>
          {acao}
        </div>
      )}
      {sub && <p style={{ margin: '0 0 14px', fontSize: '12.5px', color: t.textMuted, lineHeight: 1.5 }}>{sub}</p>}
      {children}
    </section>
  )
}

