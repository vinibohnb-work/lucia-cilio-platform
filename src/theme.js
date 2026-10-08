// Tokens de tema (light / night) com a identidade visual da LC Office Consulting
// (documento da Letícia, 08/10/2026): verde principal #0E3D33, verde secundário
// #184F43, bege #EAD8B7, creme #F8F1E4, dourado #C89B3C, branco. Títulos em
// Archivo Black, corpo em Arial Nova (com Archivo como fonte web de recurso).

export const BRAND = { green: '#0E3D33', greenMid: '#184F43', gold: '#C89B3C', beige: '#EAD8B7', cream: '#F8F1E4' }

const FONT_BODY = "'Arial Nova','Archivo','Segoe UI',system-ui,sans-serif"
const FONT_DISPLAY = "'Archivo Black','Archivo','Arial Nova',sans-serif"

export const THEMES = {
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
