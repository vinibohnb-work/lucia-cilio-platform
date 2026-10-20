import { useLang } from '../../context/LangContext'
import { useTheme } from '../../context/ThemeContext'
import { useIsMobile } from '../../hooks/useIsMobile'
import { useAlvoESG } from '../../context/AlvoESGContext'
import { useMetodo } from '../../lib/useMetodoESG'
import { CampoTexto, CartaoMetodo } from '../../components/esg/MetodoUI'
import { NIVEIS, PERGUNTAS_ARRANQUE, INTERLOCUTORES, RESPONSABILIDADES, txt, respostasArranque } from '../../data/esgMetodo'

// Arranque do caso ESG — "Compreender" no método da Lúcia (documento de 15/10).
// A primeira sessão não é uma apresentação de ESG: é perceber o negócio. Aqui
// ficam o nível contratado, as 7 perguntas do formulário, com quem se fala dentro
// da empresa e quem faz o quê (consultora × cliente).
export default function ArranqueESG() {
  const { lang } = useLang()
  const { t } = useTheme()
  const isMobile = useIsMobile()
  const { caso } = useAlvoESG()
  const { metodo, gravar, soLeitura } = useMetodo()
  const arranque = metodo.arranque || {}
  const gravarArranque = (k) => (v) => gravar('arranque', { ...arranque, [k]: v })
  const nivel = caso?.nivel || 'diagnostico'

  const L = lang === 'de' ? {
    titulo: 'Start', nivelT: 'Leistungsstufe', nivelSub: 'Das Produkt in drei Stufen — die aktuelle ist markiert (oben im Fall änderbar).',
    perguntasT: 'Die 7 Fragen zum Start', perguntasSub: 'Für das erste Gespräch: das Geschäft verstehen, bevor man über ESG spricht.',
    respondidas: 'beantwortet', interT: 'Ansprechpartner im Unternehmen', interSub: 'ESG ist bereichsübergreifend: wer ist für was die Kontaktperson?', interPh: 'Name, Funktion, Kontakt',
    respT: 'Wer macht was', consultora: 'Beraterin', cliente: 'Kunde', atual: 'aktuell',
  } : lang === 'en' ? {
    titulo: 'Kick-off', nivelT: 'Service level', nivelSub: 'The product in three levels — the current one is marked (change it at the top of the case).',
    perguntasT: 'The 7 kick-off questions', perguntasSub: 'For the first session: understand the business before talking about ESG.',
    respondidas: 'answered', interT: 'Contacts inside the company', interSub: 'ESG cuts across the business: who is the contact for each area?', interPh: 'Name, role, contact',
    respT: 'Who does what', consultora: 'Consultant', cliente: 'Client', atual: 'current',
  } : {
    titulo: 'Arranque', nivelT: 'Nível do serviço', nivelSub: 'O produto em três níveis — o atual está marcado (muda-se no topo do caso).',
    perguntasT: 'As 7 perguntas do arranque', perguntasSub: 'Para a primeira sessão: perceber o negócio antes de falar de ESG.',
    respondidas: 'respondidas', interT: 'Interlocutores na empresa', interSub: 'O ESG é transversal: quem é o contacto de cada área?', interPh: 'Nome, função, contacto',
    respT: 'Quem faz o quê', consultora: 'Consultora', cliente: 'Cliente', atual: 'atual',
  }

  const n = respostasArranque(metodo)
  return (
    <div style={{ width: '100%', fontFamily: t.fontBody }}>
      <h1 className="so-leitores">{L.titulo}</h1>

      <CartaoMetodo titulo={L.nivelT} sub={L.nivelSub}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
          {NIVEIS.map((nv, i) => {
            const on = nv.key === nivel
            return (
              <div key={nv.key} style={{ padding: '12px 14px', borderRadius: '12px', border: `1.5px solid ${on ? t.accent : t.cardBorder}`, background: on ? t.softCardBg : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: t.accentText }}>{i + 1}</span>
                  <span style={{ fontSize: '13.5px', fontWeight: 800, color: t.heading }}>{txt(nv.nome, lang)}</span>
                  {on && <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: t.chipBg, color: t.chipText }}>{L.atual}</span>}
                </div>
                <div style={{ fontSize: '12px', color: t.textMuted, lineHeight: 1.45 }}>{txt(nv.entrega, lang)}</div>
              </div>
            )
          })}
        </div>
      </CartaoMetodo>

      <CartaoMetodo titulo={L.perguntasT} sub={L.perguntasSub}
        acao={<span style={{ fontSize: '12px', fontWeight: 700, color: n === PERGUNTAS_ARRANQUE.length ? t.pos : t.textMuted }}>{n}/{PERGUNTAS_ARRANQUE.length} {L.respondidas}</span>}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {PERGUNTAS_ARRANQUE.map((p, i) => (
            <CampoTexto key={p.key} rotulo={`${i + 1}. ${txt(p.t, lang)}`} ajuda={p.destaque ? txt(p.destaque, lang) : null}
              valor={arranque[p.key]} aoGravar={gravarArranque(p.key)} soLeitura={soLeitura} />
          ))}
        </div>
      </CartaoMetodo>

      <CartaoMetodo titulo={L.interT} sub={L.interSub}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
          {INTERLOCUTORES.map(it => (
            <CampoTexto key={it.key} rotulo={txt(it.nome, lang)} ajuda={txt(it.foco, lang)} linhas={2} placeholder={L.interPh}
              valor={arranque[it.key]} aoGravar={gravarArranque(it.key)} soLeitura={soLeitura} />
          ))}
        </div>
      </CartaoMetodo>

      <CartaoMetodo titulo={L.respT}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
          {[[L.consultora, RESPONSABILIDADES.consultora], [L.cliente, RESPONSABILIDADES.cliente]].map(([quem, o]) => (
            <div key={quem} style={{ padding: '12px 14px', borderRadius: '12px', background: t.softCardBg }}>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.05em', color: t.accentText, marginBottom: '4px' }}>{quem}</div>
              <div style={{ fontSize: '13px', color: t.text, lineHeight: 1.5 }}>{txt(o, lang)}</div>
            </div>
          ))}
        </div>
      </CartaoMetodo>
    </div>
  )
}
