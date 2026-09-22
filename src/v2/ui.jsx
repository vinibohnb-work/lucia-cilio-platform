import { createContext, useContext } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useIsMobile } from '../hooks/useIsMobile'

// v2 · peças de interface partilhadas pelas páginas do portal.

// ── Perfil (documento, secção 10: Administrador · Colaboradora · Cliente) ──
export const PerfilContext = createContext({ papel: 'admin', clienteId: null })
export const usePerfil = () => useContext(PerfilContext)
// O que cada perfil vê. A colaboradora trabalha tudo menos o dinheiro da casa
// (avença e pagamentos); o cliente só vê a sua área visível.
export function pode(papel, coisa) {
  if (papel === 'admin') return true
  if (papel === 'colaboradora') return coisa !== 'avenca'
  return ['visivel'].includes(coisa)
}

// ── Ícones (traço = currentColor), no estilo da barra lateral da v1 ──
const I = ({ children, size = 18, sw = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>{children}</svg>
)
export const Ic = {
  clientes: (p) => <I {...p}><circle cx="9" cy="8" r="3.3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 6.5a3 3 0 0 1 0 5.6M17.5 20a5 5 0 0 0-3-4.6" /></I>,
  agenda: (p) => <I {...p}><rect x="3.5" y="4.5" width="17" height="16" rx="2.5" /><path d="M3.5 9h17M8 2.5v4M16 2.5v4" /></I>,
  tarefas: (p) => <I {...p}><rect x="4" y="4" width="16" height="16" rx="2.5" /><path d="m8.5 12 2.5 2.5 4.5-5" /></I>,
  relatorios: (p) => <I {...p}><path d="M5 20V11M10 20V5M15 20v-7M20 20V9" /></I>,
  mensagens: (p) => <I {...p}><path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z" /></I>,
  doc: (p) => <I {...p}><path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" /><path d="M13.5 3.5V8H18M8.5 13h7M8.5 16.5h5" /></I>,
  euro: (p) => <I {...p}><path d="M17 6.5A7 7 0 1 0 17 17.5M4 10.5h9M4 13.5h8" /></I>,
  lista: (p) => <I {...p}><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></I>,
  check: (p) => <I {...p}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="m8.5 12 2.5 2.5 4.5-5" /></I>,
  cadeado: (p) => <I size={12} sw={2} {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></I>,
  olho: (p) => <I size={12} sw={2} {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></I>,
  sino: (p) => <I {...p}><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0" /></I>,
  mais: (p) => <I {...p}><path d="M12 5v14M5 12h14" /></I>,
  mail: (p) => <I {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6 8.5-6" /></I>,
  pin: (p) => <I size={13} sw={2} {...p}><path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.2" /></I>,
  clip: (p) => <I size={15} {...p}><path d="m20 11.5-8.3 8.3a5 5 0 0 1-7.1-7.1l8.6-8.6a3.4 3.4 0 0 1 4.8 4.8l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.7-7.7" /></I>,
  enviar: (p) => <I size={16} {...p}><path d="M21 3 10 14M21 3l-7 18-4-7-7-4z" /></I>,
  whats: (p) => (
    <svg width={p?.size || 18} height={p?.size || 18} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" />
    </svg>
  ),
}

// ── Tons ──
export function useTons() {
  const { t } = useTheme()
  return {
    ok: t.dueOk, aviso: t.dueSoon, erro: t.dueLate,
    azul: t.toneBlue || { bg: '#eff6ff', ink: '#1d4ed8' },
    neutro: { bg: t.segBg, ink: t.textMuted },
    ouro: { bg: t.chipBg, ink: t.chipText },
  }
}

export function Chip({ tom = 'neutro', children, title, forte }) {
  const tons = useTons()
  const c = tons[tom] || tons.neutro
  return <span title={title} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: forte ? 800 : 700, background: c.bg, color: c.ink, whiteSpace: 'nowrap', lineHeight: 1.4 }}>{children}</span>
}

// A marca das duas áreas do documento: o que o cliente vê e o que é só da equipa.
export function Area({ interna }) {
  const { t } = useTheme()
  return (
    <span title={interna ? 'Só a equipa da LC Office Consulting vê isto' : 'O cliente também vê isto'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 9px', borderRadius: '8px', fontSize: '10.5px', fontWeight: 700, background: interna ? t.segBg : t.dueOk.bg, color: interna ? t.textMuted : t.dueOk.ink, whiteSpace: 'nowrap' }}>
      {interna ? <Ic.cadeado /> : <Ic.olho />}{interna ? 'Área interna' : 'Visível ao cliente'}
    </span>
  )
}

export function Cartao({ titulo, icone, area, acao, children, estilo, semPadding }) {
  const { t } = useTheme()
  return (
    <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px', padding: semPadding ? 0 : '18px 20px', minWidth: 0, ...estilo }}>
      {(titulo || acao || area !== undefined) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap', padding: semPadding ? '16px 20px 0' : 0 }}>
          {icone && <span style={{ color: t.heading, display: 'flex' }}>{icone}</span>}
          <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 800, color: t.heading, flex: 1, minWidth: 0 }}>{titulo}</h3>
          {acao}
          {area !== undefined && <Area interna={area === 'interna'} />}
        </div>
      )}
      {children}
    </div>
  )
}

export function Botao({ variante = 'secundario', children, estilo, ...resto }) {
  const { t } = useTheme()
  const v = {
    primario: { background: t.btnBg, color: t.btnInk, border: `1px solid ${t.btnBg}` },
    ouro: { background: '#a88a3d', color: '#fff', border: '1px solid #a88a3d' },
    whats: { background: '#0f3b22', color: '#fff', border: '1px solid #0f3b22' },
    verde: { background: '#1f6b45', color: '#fff', border: '1px solid #1f6b45' },
    secundario: { background: t.cardBg, color: t.heading, border: `1px solid ${t.cardBorder}` },
    fantasma: { background: 'transparent', color: t.accentText, border: '1px solid transparent' },
    perigo: { background: 'transparent', color: t.neg, border: `1px solid ${t.cardBorder}` },
  }[variante]
  return (
    <button {...resto} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minHeight: '38px', padding: '0 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: resto.disabled ? 'default' : 'pointer', opacity: resto.disabled ? 0.55 : 1, whiteSpace: 'nowrap', fontFamily: 'inherit', ...v, ...estilo }}>
      {children}
    </button>
  )
}

export function useCampos() {
  const { t } = useTheme()
  return {
    input: { padding: '9px 11px', borderRadius: '9px', border: `1px solid ${t.inputBorder}`, background: t.inputBg, color: t.heading, fontSize: '13px', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' },
    rotulo: { fontSize: '10.5px', fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '5px', display: 'block' },
    th: { textAlign: 'left', fontSize: '11px', fontWeight: 700, color: t.textMuted, padding: '9px 12px', background: t.headBg || t.softCardBg, whiteSpace: 'nowrap' },
    td: { padding: '11px 12px', borderTop: `1px solid ${t.rowBorder}`, fontSize: '13px', color: t.text, verticalAlign: 'middle' },
  }
}

export function Campo({ rotulo, children, largura }) {
  const s = useCampos()
  return <label style={{ display: 'block', minWidth: 0, gridColumn: largura }}><span style={s.rotulo}>{rotulo}</span>{children}</label>
}

export function Kpi({ icone, rotulo, valor, sub, tom }) {
  const { t } = useTheme()
  const tons = useTons()
  return (
    <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px', padding: '14px 14px', display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
      <span style={{ flex: 'none', width: '38px', height: '38px', borderRadius: '50%', background: t.softCardBg, border: `1px solid ${t.cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.accentText }}>{icone}</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '12.5px', color: t.textMuted, fontWeight: 600 }}>{rotulo}</div>
        <div style={{ fontSize: '17px', fontWeight: 800, color: tom ? tons[tom].ink : t.heading, lineHeight: 1.25, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{valor}</div>
        {sub && <div style={{ fontSize: '11.5px', color: t.subtle, marginTop: '2px' }}>{sub}</div>}
      </div>
    </div>
  )
}

export function Vazio({ children }) {
  const { t } = useTheme()
  return <div style={{ padding: '22px 12px', textAlign: 'center', fontSize: '13px', color: t.subtle }}>{children}</div>
}

// Janela por cima da página (formulários curtos).
export function Janela({ titulo, aoFechar, children, largura = 560 }) {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  return (
    <div onClick={aoFechar} style={{ position: 'fixed', inset: 0, background: 'rgba(5,20,12,.45)', zIndex: 200, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : '20px' }}>
      <div onClick={e => e.stopPropagation()} role="dialog" aria-label={titulo}
        style={{ background: t.cardBg, borderRadius: isMobile ? '18px 18px 0 0' : '16px', width: '100%', maxWidth: `${largura}px`, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 30px 70px -20px rgba(0,0,0,.4)', padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: t.heading, flex: 1 }}>{titulo}</h3>
          <button onClick={aoFechar} aria-label="Fechar" style={{ width: '34px', height: '34px', borderRadius: '9px', border: `1px solid ${t.cardBorder}`, background: 'transparent', color: t.textMuted, cursor: 'pointer', fontSize: '15px' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Grelha({ colunas = 2, min = '220px', gap = '14px', children, estilo }) {
  const isMobile = useIsMobile()
  return <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : (typeof colunas === 'string' ? colunas : `repeat(${colunas}, minmax(0, 1fr))`), gap, minWidth: 0, ...estilo }} data-min={min}>{children}</div>
}

export function Titulo({ eyebrow, titulo, sub, acoes }) {
  const { t } = useTheme()
  const isMobile = useIsMobile()
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '14px', flexWrap: 'wrap', marginBottom: '20px' }}>
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accentText }}>{eyebrow}</div>}
        <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '28px' : '36px', lineHeight: 1.05, letterSpacing: '-.5px', color: t.heading }}>{titulo}</h1>
        {sub && <p style={{ fontSize: '13px', color: t.textMuted, margin: '8px 0 0', maxWidth: '620px', lineHeight: 1.5 }}>{sub}</p>}
      </div>
      {acoes && <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>{acoes}</div>}
    </div>
  )
}

// Seletor em pílulas (filtros rápidos, vistas dia/semana/mês).
export function Pilulas({ opcoes, valor, aoMudar }) {
  const { t } = useTheme()
  return (
    <div style={{ display: 'inline-flex', gap: '3px', padding: '3px', borderRadius: '11px', background: t.segBg, flexWrap: 'wrap' }}>
      {opcoes.map(([k, r]) => (
        <button key={k} onClick={() => aoMudar(k)} style={{ padding: '6px 13px', borderRadius: '8px', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: valor === k ? t.cardBg : 'transparent', color: valor === k ? t.heading : t.textMuted, boxShadow: valor === k ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>{r}</button>
      ))}
    </div>
  )
}
