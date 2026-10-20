// Tokens de tema (light "Editorial Premium" / night "Imersivo").
// Copiado do protótipo de redesign (handoff). A marca (verde+dourado) mantém-se.

const BRAND_V1 = { green: '#0a2f1a', greenMid: '#164e2b', gold: '#c9a84c' }

const THEMES_V1 = {
  light: {
    appBg: '#f5f1e8', mainBg: '#f5f1e8',
    sidebarBg: '#0a2f1a', sidebarBorder: 'rgba(201,168,76,.22)', sidebarSub: '#9db3a3',
    logoBg: 'transparent', logoInk: '#c9a84c', logoBorder: '1.5px solid #c9a84c',
    // Logótipo com as letras na cor que se lê sobre o fundo do tema
    logoSrc: '/logo-letra-verde.png',
    navActiveBg: 'rgba(201,168,76,.13)', navActiveText: '#f3ecdb', navText: '#b9c8be',
    sectionLabel: '#6f8b78',
    cardBg: '#fff', cardBorder: '#e7decd', cardShadow: '0 1px 2px rgba(10,47,26,.04)',
    softCardBg: '#fbf7ee',
    heading: '#0a2f1a', text: '#374a3e', textMuted: '#5a6b61', subtle: '#5f7066',
    trackBg: '#f0ead9', bar1: '#0a2f1a', bar2: '#164e2b',
    rowBorder: '#eee6d6', headBg: '#f6f1e6',
    chipBg: '#f0ead9', chipText: '#6b5a2a',
    inputBg: '#fff', inputBorder: '#ddd2ba',
    segBg: '#eae3d4', segBorder: '#ddd2ba',
    badgeBg: '#fbe6e2', badgeInk: '#c0392b',
    iconWrap: '#f0ead9',
    btnBg: '#0a2f1a', btnInk: '#f3ecdb',
    avatarBg: '#0a2f1a', avatarInk: '#c9a84c', avatarBorder: 'none',
    toggleBg: 'transparent',
    pos: '#2f7d4f', neg: '#c0392b', accent: '#c9a84c', accentText: '#6b5a2a',
    gridLine: '#eee6d6', gridAxis: '#e7decd',
    fluxLine: '#164e2b', fluxLine2: '#c9a84c', fluxFillOp: 0.16,
    highlightBg: '#0a2f1a', highlightBorder: '#0a2f1a',
    highlightRing: 'rgba(201,168,76,.28)', highlightLabel: '#c9a84c', highlightValue: '#f3ecdb',
    highlightDelta: '#c9a84c', highlightMuted: '#b9c8be', highlightDivider: 'rgba(201,168,76,.25)',
    loginBg: '#f5f1e8', loginShadow: '0 30px 70px -30px rgba(10,47,26,.35)',
    fontBody: "'Instrument Sans',system-ui,sans-serif", fontDisplay: "'Cormorant Garamond',serif", fontNum: "'Cormorant Garamond',serif",
    dueOk: { bg: '#e7f4ec', ink: '#2f7d4f' }, dueSoon: { bg: '#fbf3df', ink: '#a5842f' }, dueLate: { bg: '#fbe6e2', ink: '#c0392b' },
    // Tons auxiliares para cartões de indicadores (antes fixos no Dashboard)
    toneBlue: { bg: '#eff6ff', ink: '#1d4ed8' }, toneOrange: { bg: '#fff7ed', ink: '#c2410c' },
  },
  night: {
    appBg: '#071c11', mainBg: 'radial-gradient(120% 100% at 100% 0%,#0d2c1a 0%,#071c11 55%)',
    sidebarBg: '#04140b', sidebarBorder: 'rgba(201,168,76,.22)', sidebarSub: '#8ba392',
    logoBg: 'linear-gradient(140deg,#c9a84c,#a5842f)', logoInk: '#071c11', logoBorder: 'none',
    logoSrc: '/logo-letra-branca.png',
    navActiveBg: 'rgba(201,168,76,.16)', navActiveText: '#f3ecdb', navText: '#8ba392',
    sectionLabel: '#5f7c6b',
    cardBg: 'rgba(255,255,255,.045)', cardBorder: 'rgba(201,168,76,.14)', cardShadow: 'none',
    softCardBg: 'rgba(255,255,255,.04)',
    heading: '#f2f7f3', text: '#cfe0d6', textMuted: '#8ba392', subtle: '#7d9789',
    trackBg: 'rgba(255,255,255,.07)', bar1: '#c9a84c', bar2: '#4f9d6f',
    rowBorder: 'rgba(255,255,255,.07)', headBg: 'rgba(255,255,255,.03)',
    chipBg: 'rgba(201,168,76,.14)', chipText: '#d8bd74',
    inputBg: 'rgba(255,255,255,.05)', inputBorder: 'rgba(201,168,76,.22)',
    segBg: 'rgba(255,255,255,.05)', segBorder: 'rgba(201,168,76,.22)',
    badgeBg: 'rgba(201,168,76,.2)', badgeInk: '#d8bd74',
    iconWrap: 'rgba(201,168,76,.12)',
    btnBg: 'linear-gradient(140deg,#c9a84c,#a5842f)', btnInk: '#20140a',
    avatarBg: 'linear-gradient(140deg,#164e2b,#0a2f1a)', avatarInk: '#c9a84c', avatarBorder: '1px solid rgba(201,168,76,.3)',
    toggleBg: 'rgba(201,168,76,.12)',
    pos: '#7fd6a0', neg: '#e08b7a', accent: '#c9a84c', accentText: '#d8bd74',
    gridLine: 'rgba(255,255,255,.06)', gridAxis: 'rgba(255,255,255,.1)',
    fluxLine: '#c9a84c', fluxLine2: '#4f9d6f', fluxFillOp: 0.42,
    highlightBg: 'linear-gradient(140deg,rgba(201,168,76,.92),rgba(165,132,47,.84))', highlightBorder: 'rgba(201,168,76,.5)',
    highlightRing: 'rgba(7,28,17,.18)', highlightLabel: '#3a2f10', highlightValue: '#20140a',
    highlightDelta: '#2b4a34', highlightMuted: '#4a3d18', highlightDivider: 'rgba(7,28,17,.18)',
    loginBg: 'radial-gradient(120% 90% at 50% 0%,#0d2c1a 0%,#071c11 60%)', loginShadow: '0 30px 80px -30px rgba(0,0,0,.6)',
    fontBody: "'Manrope',system-ui,sans-serif", fontDisplay: "'Cormorant Garamond',serif", fontNum: "'Space Grotesk',monospace",
    dueOk: { bg: 'rgba(127,214,160,.14)', ink: '#7fd6a0' }, dueSoon: { bg: 'rgba(201,168,76,.18)', ink: '#d8bd74' }, dueLate: { bg: 'rgba(224,86,66,.16)', ink: '#e08b7a' },
    toneBlue: { bg: 'rgba(125,175,255,.14)', ink: '#9dc3ff' }, toneOrange: { bg: 'rgba(251,146,60,.14)', ink: '#f3a866' },
  },
}

// ── Identidade visual da LC Office Consulting (a "V2", validada em /v2 e oficial desde 19/10) ──
// (documento da Letícia, 08/10/2026): verde principal #0E3D33, verde secundário
// #184F43, bege #EAD8B7, creme #F8F1E4, dourado #C89B3C, branco. Títulos em
// Archivo Black, corpo em Arial Nova (com Archivo como fonte web de recurso).
// Os tokens que esta identidade não define vêm da V1, para nenhum ecrã ficar sem cor.
const BRAND_V2 = { green: '#0E3D33', greenMid: '#184F43', gold: '#C89B3C', beige: '#EAD8B7', cream: '#F8F1E4' }

const FONT_BODY = "'Arial Nova','Archivo','Segoe UI',system-ui,sans-serif"
const FONT_DISPLAY = "'Archivo Black','Archivo','Arial Nova',sans-serif"

const THEMES_V2_BASE = {
  light: {
    appBg: '#F8F1E4', mainBg: '#F8F1E4',
    sidebarBg: '#0E3D33', sidebarBorder: 'rgba(200,155,60,.28)', sidebarSub: '#b9c9bf',
    logoBg: 'transparent', logoInk: '#C89B3C', logoBorder: '1.5px solid #C89B3C',
    navActiveBg: 'rgba(255,255,255,.10)', navActiveText: '#FFFFFF', navText: '#EAD8B7',
    sectionLabel: '#C89B3C',
    cardBg: '#FFFFFF', cardBorder: '#EAD8B7', cardShadow: '0 1px 2px rgba(14,61,51,.05)',
    softCardBg: '#FBF7EE',
    heading: '#0E3D33', text: '#2b3a34', textMuted: '#5c6a64', subtle: '#6b7a73',
    trackBg: '#EAD8B7', bar1: '#0E3D33', bar2: '#184F43',
    rowBorder: '#F1E7D5', headBg: '#F8F1E4',
    chipBg: '#EAD8B7', chipText: '#6b4f16',
    inputBg: '#FFFFFF', inputBorder: '#d9cbb0',
    segBg: '#EAD8B7', segBorder: '#d9cbb0',
    badgeBg: '#F6DAD5', badgeInk: '#8E2F20',
    iconWrap: '#EAD8B7',
    btnBg: '#0E3D33', btnInk: '#F8F1E4',
    avatarBg: '#0E3D33', avatarInk: '#C89B3C', avatarBorder: 'none',
    toggleBg: 'transparent',
    pos: '#184F43', neg: '#8E2F20', accent: '#C89B3C', accentText: '#8A5B12',
    gridLine: '#F1E7D5', gridAxis: '#EAD8B7',
    fluxLine: '#184F43', fluxLine2: '#C89B3C', fluxFillOp: 0.16,
    highlightBg: '#0E3D33', highlightBorder: '#0E3D33',
    highlightRing: 'rgba(200,155,60,.3)', highlightLabel: '#C89B3C', highlightValue: '#F8F1E4',
    highlightDelta: '#C89B3C', highlightMuted: '#EAD8B7', highlightDivider: 'rgba(200,155,60,.3)',
    loginBg: '#F8F1E4', loginShadow: '0 30px 70px -30px rgba(14,61,51,.35)',
    fontBody: FONT_BODY, fontDisplay: FONT_DISPLAY, fontNum: FONT_BODY,
    dueOk: { bg: '#E3EEE8', ink: '#184F43' }, dueSoon: { bg: '#FBE7C7', ink: '#8A5B12' }, dueLate: { bg: '#F6DAD5', ink: '#8E2F20' },
    // Tons auxiliares para cartões de indicadores (antes fixos no Dashboard)
    toneBlue: { bg: '#E3EEE8', ink: '#184F43' }, toneOrange: { bg: '#FBE7C7', ink: '#8A5B12' },
  },
  night: {
    appBg: '#0E3D33', mainBg: '#0E3D33',
    sidebarBg: '#0A2E27', sidebarBorder: 'rgba(234,216,183,.18)', sidebarSub: '#b9c9bf',
    logoBg: 'transparent', logoInk: '#C89B3C', logoBorder: '1.5px solid #C89B3C',
    navActiveBg: '#184F43', navActiveText: '#FFFFFF', navText: '#EAD8B7',
    sectionLabel: '#C89B3C',
    cardBg: '#184F43', cardBorder: 'rgba(234,216,183,.18)', cardShadow: 'none',
    softCardBg: 'rgba(234,216,183,.08)',
    heading: '#F8F1E4', text: '#EAD8B7', textMuted: '#d6c6a6', subtle: '#c4b596',
    trackBg: 'rgba(234,216,183,.12)', bar1: '#C89B3C', bar2: '#EAD8B7',
    rowBorder: 'rgba(234,216,183,.12)', headBg: 'rgba(234,216,183,.06)',
    chipBg: 'rgba(234,216,183,.16)', chipText: '#EAD8B7',
    inputBg: '#0E3D33', inputBorder: 'rgba(234,216,183,.25)',
    segBg: 'rgba(234,216,183,.08)', segBorder: 'rgba(234,216,183,.25)',
    badgeBg: '#C89B3C', badgeInk: '#0E3D33',
    iconWrap: 'rgba(234,216,183,.12)',
    btnBg: '#C89B3C', btnInk: '#0E3D33',
    avatarBg: '#C89B3C', avatarInk: '#0E3D33', avatarBorder: 'none',
    toggleBg: 'rgba(234,216,183,.12)',
    pos: '#EAD8B7', neg: '#f0a99b', accent: '#C89B3C', accentText: '#C89B3C',
    gridLine: 'rgba(234,216,183,.08)', gridAxis: 'rgba(234,216,183,.14)',
    fluxLine: '#C89B3C', fluxLine2: '#EAD8B7', fluxFillOp: 0.3,
    highlightBg: '#F8F1E4', highlightBorder: '#F8F1E4',
    highlightRing: 'rgba(14,61,51,.18)', highlightLabel: '#8A5B12', highlightValue: '#0E3D33',
    highlightDelta: '#184F43', highlightMuted: '#5c6a64', highlightDivider: 'rgba(14,61,51,.18)',
    loginBg: '#0E3D33', loginShadow: '0 30px 80px -30px rgba(0,0,0,.6)',
    fontBody: FONT_BODY, fontDisplay: FONT_DISPLAY, fontNum: FONT_BODY,
    dueOk: { bg: 'rgba(234,216,183,.16)', ink: '#EAD8B7' }, dueSoon: { bg: '#C89B3C', ink: '#0E3D33' }, dueLate: { bg: '#F6DAD5', ink: '#8E2F20' },
    toneBlue: { bg: 'rgba(234,216,183,.16)', ink: '#EAD8B7' }, toneOrange: { bg: '#C89B3C', ink: '#0E3D33' },
  },
}

const THEMES_V2 = {
  light: { ...THEMES_V1.light, ...THEMES_V2_BASE.light, logoSrc: '/logo-letra-verde.png' },
  night: { ...THEMES_V1.night, ...THEMES_V2_BASE.night, logoSrc: '/logo-letra-branca.png' },
}

// A V1 fica só como base dos tokens que a V2 não redefine.
void BRAND_V1
export const BRAND = BRAND_V2
export const THEMES = THEMES_V2
