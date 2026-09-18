import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'

// Lista de casos (consultorias, consultorias ESG) — uma linha por cliente, com
// os indicadores das fases à vista e o atalho para abrir. É a mesma tabela nas
// duas páginas, de propósito: a Lúcia lê as duas da mesma maneira.
//
// linhas: [{ id, titulo, sub, estado: {rotulo, bg, ink}, chips: [texto],
//            fases: [{ n, titulo, pct, atual, pronto, apagada }],
//            resumo: nó, href, novaGuia, onAbrir }]

export default function ListaCasos({ linhas, cabecalho, abrirRotulo }) {
  const { t } = useTheme()
  const isMobile = useIsMobile()

  const th = { textAlign: 'left', fontSize: '10.5px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', padding: '8px 12px', borderBottom: `1px solid ${t.cardBorder}`, whiteSpace: 'nowrap' }
  const td = { padding: '12px', borderBottom: `1px solid ${t.rowBorder || t.cardBorder}`, verticalAlign: 'middle' }

  const Fases = ({ fases }) => (
    <div style={{ display: 'flex', gap: '4px', minWidth: isMobile ? 'auto' : '170px' }}>
      {fases.map(f => (
        <div key={f.n} style={{ flex: 1 }} title={`${f.n} · ${f.titulo} — ${f.pct}%`}>
          <div style={{ height: '5px', borderRadius: '20px', background: t.trackBg, overflow: 'hidden' }}>
            <div style={{ width: `${f.pct}%`, height: '100%', background: f.apagada ? t.subtle : f.pronto ? t.dueOk.ink : t.accent }} />
          </div>
          <div style={{ fontSize: '10.5px', fontWeight: f.atual ? 800 : 600, color: f.atual ? t.accentText : t.subtle, marginTop: '3px', textAlign: 'center' }}>{f.n}</div>
        </div>
      ))}
    </div>
  )

  const Abrir = ({ l }) => l.href
    ? <a href={l.href} target={l.novaGuia ? '_blank' : undefined} rel={l.novaGuia ? 'noopener' : undefined} onClick={e => e.stopPropagation()}
        style={{ fontSize: '12px', fontWeight: 700, color: t.accentText, textDecoration: 'none', whiteSpace: 'nowrap' }}>{abrirRotulo}{l.novaGuia ? ' ↗' : ' →'}</a>
    : <span style={{ fontSize: '12px', fontWeight: 700, color: t.accentText, whiteSpace: 'nowrap' }}>{abrirRotulo} →</span>

  const abrir = (l) => {
    if (l.onAbrir) return l.onAbrir()
    if (l.href) window.open(l.href, l.novaGuia ? '_blank' : '_self', l.novaGuia ? 'noopener' : undefined)
  }

  // ── Telemóvel: uma linha vira um cartão compacto ──
  if (isMobile) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {linhas.map(l => (
        <div key={l.id} onClick={() => abrir(l)} style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px', padding: '14px 16px', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: t.heading }}>{l.titulo}</div>
              {l.sub && <div style={{ fontSize: '11.5px', color: t.textMuted, marginTop: '2px' }}>{l.sub}</div>}
            </div>
            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 700, background: l.estado.bg, color: l.estado.ink, flex: 'none' }}>{l.estado.rotulo}</span>
          </div>
          <Fases fases={l.fases} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '11.5px', color: t.textMuted }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.resumo}</span>
            <Abrir l={l} />
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>{cabecalho.cliente}</th>
            <th style={th}>{cabecalho.estado}</th>
            <th style={{ ...th, width: '190px' }}>{cabecalho.fases}</th>
            <th style={th}>{cabecalho.resumo}</th>
            <th style={{ ...th, width: '1%' }} />
          </tr>
        </thead>
        <tbody>
          {linhas.map(l => (
            <tr key={l.id} onClick={() => abrir(l)} style={{ cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = t.softCardBg }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
              <td style={td}>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: t.heading }}>{l.titulo}</div>
                {l.sub && <div style={{ fontSize: '11.5px', color: t.textMuted, marginTop: '2px' }}>{l.sub}</div>}
                {l.chips?.length > 0 && (
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '5px' }}>
                    {l.chips.map(c => <span key={c} style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: t.chipBg, color: t.chipText }}>{c}</span>)}
                  </div>
                )}
              </td>
              <td style={td}>
                <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '10.5px', fontWeight: 700, background: l.estado.bg, color: l.estado.ink, whiteSpace: 'nowrap' }}>{l.estado.rotulo}</span>
              </td>
              <td style={td}><Fases fases={l.fases} /></td>
              <td style={{ ...td, fontSize: '12px', color: t.textMuted }}>{l.resumo}</td>
              <td style={{ ...td, textAlign: 'right' }}><Abrir l={l} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
