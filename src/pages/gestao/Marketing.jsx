import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useAuth } from '../../context/AuthContext'

// Página de Marketing — placeholder. Serve de espaço reservado para o gestor
// de tráfego (Filipe): as métricas (Meta/Google) e a origem dos leads passam a
// viver aqui, para os dados ficarem retidos na base da Lúcia mesmo que ela
// mude de fornecedor. O conteúdo real será definido na reunião com ele.

export default function Marketing() {
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const { role } = useAuth()

  const L = lang === 'de' ? {
    eyebrow: 'Verwaltung', title: 'Marketing',
    subtitle: 'Bereich für Traffic und Kampagnen — Inhalt wird mit dem Traffic-Manager definiert.',
    soon: 'In Vorbereitung',
    intro: 'Diese Seite ist der reservierte Platz für die Marketing-Daten. Geplant sind:',
    items: [
      ['📊', 'Kampagnen-Kennzahlen', 'Reichweite, Kosten und Ergebnisse aus Meta und Google.'],
      ['🎯', 'Herkunft der Leads', 'Welcher Kanal bringt Leads — bereits im CRM erfasst (Feld „Quelle").'],
      ['📝', 'Formulare und E-Book', 'Anmeldungen, die automatisch als Leads ins CRM laufen.'],
      ['📈', 'Inhalte', 'Welche Themen am besten funktionieren, um die Kommunikation zu steuern.'],
    ],
    note: 'Der Zugang ist auf diese Seite beschränkt: Mandanten-, Finanz- und ESG-Daten sind für dieses Profil nicht sichtbar.',
  } : lang === 'en' ? {
    eyebrow: 'Management', title: 'Marketing',
    subtitle: 'Space for traffic and campaigns — content to be defined with the traffic manager.',
    soon: 'In preparation',
    intro: 'This page is the reserved space for marketing data. Planned:',
    items: [
      ['📊', 'Campaign metrics', 'Reach, cost and results from Meta and Google.'],
      ['🎯', 'Lead origin', 'Which channel brings leads — already captured in the CRM ("source" field).'],
      ['📝', 'Forms and e-book', 'Sign-ups flowing automatically into the CRM as leads.'],
      ['📈', 'Content', 'Which topics perform best, to steer the communication.'],
    ],
    note: 'Access is limited to this page: client, financial and ESG data are not visible to this profile.',
  } : {
    eyebrow: 'Gestão', title: 'Marketing',
    subtitle: 'Espaço para tráfego e campanhas — conteúdo a definir com o gestor de tráfego.',
    soon: 'Em preparação',
    intro: 'Esta página é o espaço reservado para os dados de marketing. Previsto:',
    items: [
      ['📊', 'Métricas das campanhas', 'Alcance, custo e resultados da Meta e do Google.'],
      ['🎯', 'Origem dos leads', 'Que canal traz leads — já registado no CRM (campo "origem").'],
      ['📝', 'Formulários e e-book', 'Inscrições a entrar automaticamente no CRM como leads.'],
      ['📈', 'Conteúdos', 'Que temas funcionam melhor, para orientar a comunicação.'],
    ],
    note: 'O acesso está limitado a esta página: dados de clientes, financeiros e ESG não são visíveis a este perfil.',
  }

  const card = { background: t.cardBg, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, borderRadius: '14px' }

  return (
    <div style={{ width: '100%', fontFamily: t.fontBody, maxWidth: '820px' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '10.5px', letterSpacing: '2.6px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '7px', color: t.accent }}>{L.eyebrow}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontFamily: t.fontDisplay, fontWeight: 600, fontSize: isMobile ? '28px' : '38px', lineHeight: 1, letterSpacing: '-.5px', color: t.heading }}>{L.title}</h1>
          <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: '#fbf3d9', color: '#a9781a' }}>{L.soon}</span>
        </div>
        <p style={{ fontSize: '13px', color: t.textMuted, margin: '8px 0 0' }}>{L.subtitle}</p>
      </div>

      <div style={{ ...card, padding: '22px 24px' }}>
        <p style={{ fontSize: '13px', color: t.text, margin: '0 0 16px', lineHeight: 1.5 }}>{L.intro}</p>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
          {L.items.map(([icon, title, desc]) => (
            <div key={title} style={{ background: t.softCardBg, borderRadius: '11px', padding: '14px 16px' }}>
              <div style={{ fontSize: '18px', marginBottom: '6px' }}>{icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: t.heading, marginBottom: '3px' }}>{title}</div>
              <div style={{ fontSize: '11.5px', color: t.textMuted, lineHeight: 1.45 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {role === 'marketing' && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', marginTop: '16px', padding: '11px 14px', borderRadius: '11px', background: t.softCardBg, border: `1px solid ${t.cardBorder}`, fontSize: '11.5px', lineHeight: 1.5, color: t.textMuted }}>
          <span style={{ flex: 'none' }}>🔒</span><span>{L.note}</span>
        </div>
      )}
    </div>
  )
}
